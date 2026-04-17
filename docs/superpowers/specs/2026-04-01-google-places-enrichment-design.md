# Google Places Enrichment Design

**Date:** 2026-04-01
**Status:** Approved

## Summary

Implement the `google_enrich` scrape job that enriches CRM leads with Google Places data: rating, review count, phone number, and website. Uses Google Places API (Text Search + Place Details) to find businesses by name and city.

## Requirements

1. Enrich leads that have no Google data (`googleSyncedAt` is null)
2. Store: rating, review count, phone, website
3. Follow existing job patterns (runBrregSync as template)
4. Wire into scheduler (Wednesday 3 AM) and manual trigger ("Kjør nå")
5. Rate limit API calls (300ms between requests)
6. Handle missing/unmatched businesses gracefully

## Architecture

```
Lead (name + city)
      │
      ▼
Text Search API ──→ place_id
      │
      ▼
Place Details API ──→ { rating, reviewCount, phone, website }
      │
      ▼
Update lead record + set googleSyncedAt
```

## Schema Changes

Add two new fields to the `leads` table in `src/lib/db/schema.ts`:

```typescript
googlePhone: text("google_phone"),
googleWebsite: text("google_website"),
```

Existing fields already in schema:
- `googleRating` (real)
- `googleReviewsCount` (integer)
- `googleSyncedAt` (text)

## New File: `src/lib/scrapers/google-places.ts`

### `searchPlace(name: string, city: string): Promise<string | null>`

- Calls Google Places Text Search API
- Query: `"${name} ${city} Norge"`
- Returns `place_id` of the first result, or `null` if no match
- Uses `GOOGLE_PLACES_API_KEY` env var

### `getPlaceDetails(placeId: string): Promise<PlaceDetails | null>`

- Calls Google Places Details API with field mask:
  - `rating`
  - `userRatingsTotal` (review count)
  - `formattedPhoneNumber`
  - `website`
- Returns typed object or `null` on failure

### Types

```typescript
interface PlaceDetails {
  rating: number | null;
  reviewCount: number | null;
  phone: string | null;
  website: string | null;
}
```

## Task Function: `runGoogleEnrich()` in `src/lib/jobs/tasks.ts`

Follows the `runBrregSync()` pattern exactly:

1. Find `google_enrich` job record in `scrapeJobs` table
2. Set status to `"running"`
3. Query leads where `googleSyncedAt IS NULL` and `city IS NOT NULL`
4. For each lead:
   a. Call `searchPlace(lead.name, lead.city)`
   b. If no match: set `googleSyncedAt` to now (skip, don't re-try)
   c. If match: call `getPlaceDetails(placeId)`
   d. Update lead with rating, reviewCount, phone, website, googleSyncedAt
   e. Log activity: `"Google Places-data hentet"` with type `data_enriched`
   f. Wait 300ms before next lead
5. On success: set job status to `"success"`, update `lastRunAt` and `recordsProcessed`
6. On error: set job status to `"failed"`, store error in `lastError`

## Wiring Changes

### `src/app/api/jobber/route.ts`

Add case for `google_enrich` in the POST handler:

```typescript
if (job.name === "google_enrich") {
  import("@/lib/jobs/tasks").then(({ runGoogleEnrich }) => runGoogleEnrich());
}
```

### `src/lib/jobs/scheduler.ts`

Register cron job for Wednesday 3 AM:

```typescript
cron.schedule("0 3 * * 3", () => {
  console.log("[Scheduler] Running google_enrich");
  runGoogleEnrich();
});
```

## Environment Variable

- **Key:** `GOOGLE_PLACES_API_KEY`
- **Value:** `AIzaSyDNj9xi2uL8MAABuss9R78GiK94mpvoGPM`
- **Where:** `.env.local` for dev, Vercel env vars for production (both argon-crm and argon-crm-live)

## Error Handling

- Individual lead failures don't stop the batch — errors are logged and the loop continues
- If `GOOGLE_PLACES_API_KEY` is not set, `runGoogleEnrich()` exits early with an error message
- Leads with no city are skipped (can't search without location context)
- Leads with no match are marked as synced to prevent re-processing

## Cost Estimate

- Text Search: $0.032 per request
- Place Details (Basic): $0.017 per request
- Per lead: ~$0.05
- 100 leads: ~$5.00
- Well within the $300 free credit

## Out of Scope

- Displaying Google data on lead detail pages (can be added later)
- Proff.no enrichment (separate feature)
- Re-enrichment of already-synced leads
