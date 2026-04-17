# Google Places Enrichment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enrich CRM leads with Google Places data (rating, review count, phone, website) via automated job.

**Architecture:** Google Places scraper module calls Text Search → Place Details APIs. A `runGoogleEnrich()` task function iterates over unenriched leads, following the existing `runBrregSync()` pattern. Wired into the scheduler (Wednesday 3 AM) and manual trigger API.

**Tech Stack:** Next.js 16, Drizzle ORM, Google Places API (REST), node-cron

**Spec:** `docs/superpowers/specs/2026-04-01-google-places-enrichment-design.md`

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `src/lib/scrapers/google-places.ts` | Google Places API client (searchPlace, getPlaceDetails) |
| Modify | `src/lib/db/schema.ts` | Add googlePhone, googleWebsite fields to leads table |
| Modify | `src/lib/jobs/tasks.ts` | Add runGoogleEnrich() function |
| Modify | `src/lib/jobs/scheduler.ts` | Register Wednesday 3 AM cron |
| Modify | `src/app/api/jobber/route.ts` | Add google_enrich case to POST handler |

---

### Task 1: Add schema fields

**Files:**
- Modify: `src/lib/db/schema.ts:25-28`

- [ ] **Step 1: Add googlePhone and googleWebsite fields to leads table**

In `src/lib/db/schema.ts`, add these two fields after `googleReviewsCount` (line 26):

```typescript
googlePhone: text("google_phone"),
googleWebsite: text("google_website"),
```

The leads table should now have this block (lines 25-29):

```typescript
googleRating: real("google_rating"),
googleReviewsCount: integer("google_reviews_count"),
googlePhone: text("google_phone"),
googleWebsite: text("google_website"),
latitude: real("latitude"),
```

- [ ] **Step 2: Push schema to databases**

Run for local dev:

```bash
cd c:/Users/sondr/Google/argon-crm
npx drizzle-kit push
```

Expected: `Changes applied` — adds `google_phone` and `google_website` columns.

Then push to the live Turso database:

```bash
TURSO_DATABASE_URL="libsql://argon-crm-live-gyssa.aws-eu-west-1.turso.io" TURSO_AUTH_TOKEN="eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJleHAiOjE4MDY1NjIwNzcsImlhdCI6MTc3NTAyNjA3NywiaWQiOiIwMTlkNDdiYy02NDAxLTc5OTgtYTc0Zi02NjBlNzNmODVmNTMiLCJyaWQiOiIwMGFkYTNkOS1mOWI4LTRiNzgtYjIzMS1iNWExNmU4YmVmNDAifQ.M1-9RW3SrbBD9sR3_hSSdhl21CjDwTmp0kTR99QnxbypdZaFwF90VgR1IQuJIhH_SGAGQNdl4vfhF1h-t-UNCw" npx drizzle-kit push
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/db/schema.ts
git commit -m "feat: add googlePhone and googleWebsite fields to leads schema"
```

---

### Task 2: Create Google Places scraper

**Files:**
- Create: `src/lib/scrapers/google-places.ts`

- [ ] **Step 1: Create the Google Places scraper module**

Create `src/lib/scrapers/google-places.ts` with this content:

```typescript
export interface PlaceDetails {
  rating: number | null;
  reviewCount: number | null;
  phone: string | null;
  website: string | null;
}

export async function searchPlace(name: string, city: string): Promise<string | null> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_PLACES_API_KEY is not set");

  const query = `${name} ${city} Norge`;
  const url = new URL("https://maps.googleapis.com/maps/api/place/textsearch/json");
  url.searchParams.set("query", query);
  url.searchParams.set("key", apiKey);
  url.searchParams.set("language", "no");

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Google Text Search error: ${res.status}`);

  const data = await res.json();
  if (!data.results || data.results.length === 0) return null;

  return data.results[0].place_id ?? null;
}

export async function getPlaceDetails(placeId: string): Promise<PlaceDetails | null> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_PLACES_API_KEY is not set");

  const url = new URL("https://maps.googleapis.com/maps/api/place/details/json");
  url.searchParams.set("place_id", placeId);
  url.searchParams.set("fields", "rating,user_ratings_total,formatted_phone_number,website");
  url.searchParams.set("key", apiKey);
  url.searchParams.set("language", "no");

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Google Place Details error: ${res.status}`);

  const data = await res.json();
  if (data.status !== "OK" || !data.result) return null;

  return {
    rating: data.result.rating ?? null,
    reviewCount: data.result.user_ratings_total ?? null,
    phone: data.result.formatted_phone_number ?? null,
    website: data.result.website ?? null,
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/scrapers/google-places.ts
git commit -m "feat: add Google Places API scraper module"
```

---

### Task 3: Implement runGoogleEnrich task function

**Files:**
- Modify: `src/lib/jobs/tasks.ts`

- [ ] **Step 1: Add the import and runGoogleEnrich function**

In `src/lib/jobs/tasks.ts`, add the import at the top (after the existing imports):

```typescript
import { searchPlace, getPlaceDetails } from "@/lib/scrapers/google-places";
import { activities } from "@/lib/db/schema";
```

Then add the `runGoogleEnrich` function after the `runBrregSync` function:

```typescript
export async function runGoogleEnrich() {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    console.error("[GoogleEnrich] GOOGLE_PLACES_API_KEY is not set");
    return;
  }

  const job = await db.select().from(scrapeJobs).where(eq(scrapeJobs.name, "google_enrich")).get();
  if (!job) return;

  await db.update(scrapeJobs).set({ status: "running" }).where(eq(scrapeJobs.id, job.id));

  try {
    const staleLeads = await db.select().from(leads).where(isNull(leads.googleSyncedAt)).all();
    let processed = 0;

    for (const lead of staleLeads) {
      try {
        if (!lead.city) {
          await db.update(leads).set({
            googleSyncedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }).where(eq(leads.id, lead.id));
          continue;
        }

        const placeId = await searchPlace(lead.name, lead.city);

        if (!placeId) {
          await db.update(leads).set({
            googleSyncedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }).where(eq(leads.id, lead.id));
          continue;
        }

        const details = await getPlaceDetails(placeId);

        await db.update(leads).set({
          googleRating: details?.rating ?? null,
          googleReviewsCount: details?.reviewCount ?? null,
          googlePhone: details?.phone ?? null,
          googleWebsite: details?.website ?? null,
          googleSyncedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }).where(eq(leads.id, lead.id));

        if (details) {
          await db.insert(activities).values({
            leadId: lead.id,
            type: "data_enriched",
            description: "Google Places-data hentet",
          });
          processed++;
        }

        await new Promise((r) => setTimeout(r, 300));
      } catch (leadError) {
        console.error(`[GoogleEnrich] Error enriching lead ${lead.id}:`, leadError);
        continue;
      }
    }

    await db.update(scrapeJobs).set({
      status: "success",
      lastRunAt: new Date().toISOString(),
      recordsProcessed: processed,
      lastError: null,
    }).where(eq(scrapeJobs.id, job.id));
  } catch (error) {
    await db.update(scrapeJobs).set({
      status: "failed",
      lastRunAt: new Date().toISOString(),
      lastError: error instanceof Error ? error.message : "Unknown error",
    }).where(eq(scrapeJobs.id, job.id));
  }
}
```

- [ ] **Step 2: Verify the file compiles**

```bash
cd c:/Users/sondr/Google/argon-crm
npx tsc --noEmit src/lib/jobs/tasks.ts 2>&1 || echo "Check for errors"
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/jobs/tasks.ts
git commit -m "feat: implement runGoogleEnrich task function"
```

---

### Task 4: Wire up API handler and scheduler

**Files:**
- Modify: `src/app/api/jobber/route.ts:20-22`
- Modify: `src/lib/jobs/scheduler.ts`

- [ ] **Step 1: Add google_enrich case to the API POST handler**

In `src/app/api/jobber/route.ts`, change lines 20-22 from:

```typescript
  if (job.name === "brreg_sync") {
    import("@/lib/jobs/tasks").then(({ runBrregSync }) => runBrregSync());
  }
```

to:

```typescript
  if (job.name === "brreg_sync") {
    import("@/lib/jobs/tasks").then(({ runBrregSync }) => runBrregSync());
  } else if (job.name === "google_enrich") {
    import("@/lib/jobs/tasks").then(({ runGoogleEnrich }) => runGoogleEnrich());
  }
```

- [ ] **Step 2: Register google_enrich in the scheduler**

In `src/lib/jobs/scheduler.ts`, add the import and cron registration. Replace the full file content with:

```typescript
import cron from "node-cron";
import { runBrregSync } from "./tasks";
import { runGoogleEnrich } from "./tasks";

export function startScheduler() {
  console.log("[Scheduler] Starting cron jobs...");

  // Brønnøysund sync — Monday 3AM
  cron.schedule("0 3 * * 1", () => {
    console.log("[Scheduler] Running brreg_sync");
    runBrregSync();
  });

  // Google Places enrichment — Wednesday 3AM
  cron.schedule("0 3 * * 3", () => {
    console.log("[Scheduler] Running google_enrich");
    runGoogleEnrich();
  });

  console.log("[Scheduler] Cron jobs registered.");
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/jobber/route.ts src/lib/jobs/scheduler.ts
git commit -m "feat: wire google_enrich into API handler and scheduler"
```

---

### Task 5: Set environment variable and verify

**Files:** None (env config only)

- [ ] **Step 1: Add API key to .env.local**

Add to `c:/Users/sondr/Google/argon-crm/.env.local`:

```
GOOGLE_PLACES_API_KEY=AIzaSyDNj9xi2uL8MAABuss9R78GiK94mpvoGPM
```

- [ ] **Step 2: Add API key to Vercel (argon-crm-live)**

```bash
cd c:/Users/sondr/Google/argon-crm
cp .vercel/project.json .vercel/project.json.bak
vercel link --project argon-crm-live --yes
vercel env add GOOGLE_PLACES_API_KEY production --value "AIzaSyDNj9xi2uL8MAABuss9R78GiK94mpvoGPM" --yes
cp .vercel/project.json.bak .vercel/project.json
rm .vercel/project.json.bak
```

- [ ] **Step 3: Build check**

```bash
cd c:/Users/sondr/Google/argon-crm
npm run build
```

Expected: Build succeeds with no errors.

- [ ] **Step 4: Deploy to argon-crm-live**

```bash
cd c:/Users/sondr/Google/argon-crm
cp .vercel/project.json .vercel/project.json.bak
vercel link --project argon-crm-live --yes
vercel --prod --yes
cp .vercel/project.json.bak .vercel/project.json
rm .vercel/project.json.bak
```

- [ ] **Step 5: Verify on live — click "Kjør nå" on Google Places-berikelse**

Open https://argon-crm-live.vercel.app/jobber and click "Kjør nå" on the Google Places-berikelse job. Verify:
- Job status changes from "idle" to "running"
- After completion, status shows "success"
- If leads exist, check a lead detail page for Google data
