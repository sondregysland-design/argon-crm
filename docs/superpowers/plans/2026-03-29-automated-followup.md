# Automated Customer Follow-Up Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add AI-generated email sending and automated follow-up to Argon CRM, integrated with Gmail API (post@argon.no) and Claude API.

**Architecture:** New database tables (`email_threads`, `pending_followups`) track email conversations and pending approvals. Gmail API sends/reads emails with proper threading headers. Claude API generates casual Norwegian follow-up emails. A Vercel cron job runs daily at 09:00 CET to process due follow-ups. UI additions on the lead detail page and a new `/oppfolging` dashboard.

**Tech Stack:** Next.js 16 (App Router), Drizzle ORM + Turso, googleapis (Gmail API), @anthropic-ai/sdk (Claude), Vitest (testing)

**Spec:** `docs/superpowers/specs/2026-03-29-automated-followup-design.md`

---

### Task 1: Set Up Test Infrastructure

**Files:**
- Create: `vitest.config.ts`
- Create: `src/lib/__tests__/setup.ts`
- Modify: `package.json`
- Modify: `tsconfig.json`

- [ ] **Step 1: Install vitest and dependencies**

```bash
cd c:/Users/sondr/Google/argon-crm
npm install -D vitest @types/node
```

- [ ] **Step 2: Create vitest config**

Create `vitest.config.ts`:

```typescript
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

- [ ] **Step 3: Add test script to package.json**

Add to `scripts` in `package.json`:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 4: Run vitest to verify setup**

```bash
npx vitest run
```

Expected: vitest runs with no tests found (exit 0).

- [ ] **Step 5: Commit**

```bash
git add vitest.config.ts package.json package-lock.json
git commit -m "chore: add vitest test infrastructure"
```

---

### Task 2: Database Schema — Email Threads & Pending Follow-ups

**Files:**
- Modify: `src/lib/db/schema.ts`
- Create: `src/lib/__tests__/schema.test.ts`

- [ ] **Step 1: Write test verifying new tables export correctly**

Create `src/lib/__tests__/schema.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { emailThreads, pendingFollowups } from "../db/schema";

describe("email schema", () => {
  it("emailThreads table has required columns", () => {
    const cols = Object.keys(emailThreads);
    expect(cols).toContain("id");
    expect(cols).toContain("leadId");
    expect(cols).toContain("gmailThreadId");
    expect(cols).toContain("gmailMessageId");
    expect(cols).toContain("subject");
    expect(cols).toContain("followUpCount");
    expect(cols).toContain("nextFollowUpAt");
    expect(cols).toContain("autoSend");
    expect(cols).toContain("status");
    expect(cols).toContain("lastEmailContent");
  });

  it("pendingFollowups table has required columns", () => {
    const cols = Object.keys(pendingFollowups);
    expect(cols).toContain("id");
    expect(cols).toContain("emailThreadId");
    expect(cols).toContain("generatedContent");
    expect(cols).toContain("status");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/lib/__tests__/schema.test.ts
```

Expected: FAIL — `emailThreads` and `pendingFollowups` not exported from schema.

- [ ] **Step 3: Add email_threads and pending_followups tables to schema**

Add to `src/lib/db/schema.ts` after the `searchCache` table:

```typescript
export const emailThreads = sqliteTable("email_threads", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  leadId: integer("lead_id").notNull().references(() => leads.id, { onDelete: "cascade" }),
  gmailThreadId: text("gmail_thread_id"),
  gmailMessageId: text("gmail_message_id"),
  subject: text("subject").notNull(),
  followUpCount: integer("follow_up_count").notNull().default(0),
  nextFollowUpAt: text("next_follow_up_at"),
  autoSend: integer("auto_send").notNull().default(1),
  status: text("status", { enum: ["active", "replied", "completed", "paused"] }).notNull().default("active"),
  lastEmailContent: text("last_email_content"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const pendingFollowups = sqliteTable("pending_followups", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  emailThreadId: integer("email_thread_id").notNull().references(() => emailThreads.id, { onDelete: "cascade" }),
  generatedContent: text("generated_content").notNull(),
  status: text("status", { enum: ["pending", "approved", "rejected"] }).notNull().default("pending"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export type EmailThread = typeof emailThreads.$inferSelect;
export type NewEmailThread = typeof emailThreads.$inferInsert;
export type PendingFollowup = typeof pendingFollowups.$inferSelect;
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run src/lib/__tests__/schema.test.ts
```

Expected: PASS

- [ ] **Step 5: Generate and apply migration**

```bash
npx drizzle-kit generate
```

This creates a SQL migration file in `drizzle/`. For Turso production, apply manually:

```bash
npx drizzle-kit push
```

- [ ] **Step 6: Commit**

```bash
git add src/lib/db/schema.ts src/lib/__tests__/schema.test.ts drizzle/
git commit -m "feat: add email_threads and pending_followups tables"
```

---

### Task 3: Gmail API Integration

**Files:**
- Create: `src/lib/gmail.ts`
- Create: `src/lib/__tests__/gmail.test.ts`

**Reference:** Reuse patterns from `c:/Users/sondr/Google/kurstracker/src/lib/gmail.ts` — same OAuth2 setup with `googleapis`.

- [ ] **Step 1: Install googleapis**

```bash
npm install googleapis
```

- [ ] **Step 2: Write tests for Gmail utility functions**

Create `src/lib/__tests__/gmail.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { buildRawEmail, calculateNextFollowUp } from "../gmail";

describe("buildRawEmail", () => {
  it("builds a basic email without threading headers", () => {
    const raw = buildRawEmail({
      to: "test@example.com",
      subject: "Hei",
      body: "Hei, dette er en test.",
    });
    const decoded = Buffer.from(raw, "base64url").toString();
    expect(decoded).toContain("To: test@example.com");
    expect(decoded).toContain("Subject: Hei");
    expect(decoded).toContain("Hei, dette er en test.");
  });

  it("includes In-Reply-To and References when provided", () => {
    const raw = buildRawEmail({
      to: "test@example.com",
      subject: "Re: Hei",
      body: "Oppfølging",
      inReplyTo: "<msg123@mail.gmail.com>",
      references: "<msg123@mail.gmail.com>",
    });
    const decoded = Buffer.from(raw, "base64url").toString();
    expect(decoded).toContain("In-Reply-To: <msg123@mail.gmail.com>");
    expect(decoded).toContain("References: <msg123@mail.gmail.com>");
  });
});

describe("calculateNextFollowUp", () => {
  it("adds 5 days to a Monday (result: Saturday → becomes Monday)", () => {
    const monday = new Date("2026-03-30"); // Monday
    const result = calculateNextFollowUp(monday);
    // 5 days later = Saturday Apr 4 → pushed to Monday Apr 6
    expect(result.getDay()).not.toBe(0); // not Sunday
    expect(result.getDay()).not.toBe(6); // not Saturday
    expect(result.toISOString().slice(0, 10)).toBe("2026-04-06");
  });

  it("adds 5 days to a Wednesday (result: Monday)", () => {
    const wednesday = new Date("2026-04-01"); // Wednesday
    const result = calculateNextFollowUp(wednesday);
    // 5 days later = Monday Apr 6
    expect(result.toISOString().slice(0, 10)).toBe("2026-04-06");
  });

  it("adds 5 days to a Thursday (result: Tuesday → stays Tuesday)", () => {
    const thursday = new Date("2026-04-02"); // Thursday
    const result = calculateNextFollowUp(thursday);
    // 5 days later = Tuesday Apr 7
    expect(result.getDay()).not.toBe(0);
    expect(result.getDay()).not.toBe(6);
    expect(result.toISOString().slice(0, 10)).toBe("2026-04-07");
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

```bash
npx vitest run src/lib/__tests__/gmail.test.ts
```

Expected: FAIL — `buildRawEmail` and `calculateNextFollowUp` not found.

- [ ] **Step 4: Implement Gmail utility**

Create `src/lib/gmail.ts`:

```typescript
import { google, gmail_v1 } from "googleapis";

export function getGmailClient(): gmail_v1.Gmail {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET
  );
  oauth2Client.setCredentials({
    refresh_token: process.env.GMAIL_REFRESH_TOKEN,
  });
  return google.gmail({ version: "v1", auth: oauth2Client });
}

interface EmailOptions {
  to: string;
  subject: string;
  body: string;
  inReplyTo?: string;
  references?: string;
}

export function buildRawEmail(opts: EmailOptions): string {
  const lines = [
    `To: ${opts.to}`,
    `Subject: ${opts.subject}`,
    `Content-Type: text/plain; charset=utf-8`,
  ];
  if (opts.inReplyTo) lines.push(`In-Reply-To: ${opts.inReplyTo}`);
  if (opts.references) lines.push(`References: ${opts.references}`);
  lines.push("", opts.body);
  return Buffer.from(lines.join("\r\n")).toString("base64url");
}

export async function sendEmail(
  gmail: gmail_v1.Gmail,
  opts: EmailOptions & { threadId?: string }
): Promise<{ threadId: string; messageId: string }> {
  const raw = buildRawEmail(opts);
  const res = await gmail.users.messages.send({
    userId: "me",
    requestBody: {
      raw,
      threadId: opts.threadId,
    },
  });

  const sentMsg = await gmail.users.messages.get({
    userId: "me",
    id: res.data.id!,
    format: "metadata",
    metadataHeaders: ["Message-ID"],
  });

  const messageId = sentMsg.data.payload?.headers?.find(
    (h) => h.name === "Message-ID"
  )?.value ?? "";

  return {
    threadId: res.data.threadId!,
    messageId,
  };
}

export async function checkForReplies(
  gmail: gmail_v1.Gmail,
  threadId: string,
  afterMessageId: string
): Promise<boolean> {
  const thread = await gmail.users.threads.get({
    userId: "me",
    id: threadId,
    format: "metadata",
    metadataHeaders: ["From"],
  });

  const messages = thread.data.messages ?? [];
  // Find messages after our last sent message
  let foundOurMessage = false;
  for (const msg of messages) {
    if (msg.id === afterMessageId) {
      foundOurMessage = true;
      continue;
    }
    if (foundOurMessage) {
      // There's a message after ours — it's a reply
      return true;
    }
  }
  return false;
}

export function calculateNextFollowUp(fromDate: Date): Date {
  const next = new Date(fromDate);
  next.setDate(next.getDate() + 5);
  const day = next.getDay();
  if (day === 6) next.setDate(next.getDate() + 2); // Saturday → Monday
  if (day === 0) next.setDate(next.getDate() + 1); // Sunday → Monday
  return next;
}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
npx vitest run src/lib/__tests__/gmail.test.ts
```

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/lib/gmail.ts src/lib/__tests__/gmail.test.ts package.json package-lock.json
git commit -m "feat: add Gmail API integration with threading support"
```

---

### Task 4: AI Email Generator

**Files:**
- Create: `src/lib/email-generator.ts`
- Create: `src/lib/__tests__/email-generator.test.ts`

- [ ] **Step 1: Install Anthropic SDK**

```bash
npm install @anthropic-ai/sdk
```

- [ ] **Step 2: Write tests for prompt building functions**

Create `src/lib/__tests__/email-generator.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { buildInitialEmailPrompt, buildFollowUpPrompt } from "../email-generator";
import type { Lead } from "../db/schema";

const mockLead: Pick<Lead, "name" | "contactPerson" | "industryName" | "projectType" | "city"> = {
  name: "Bergens Bygg AS",
  contactPerson: "Erik Hansen",
  industryName: "Bygg og anlegg",
  projectType: "nettside",
  city: "Bergen",
};

describe("buildInitialEmailPrompt", () => {
  it("includes company name and contact person", () => {
    const prompt = buildInitialEmailPrompt(mockLead);
    expect(prompt).toContain("Bergens Bygg AS");
    expect(prompt).toContain("Erik Hansen");
  });

  it("includes industry and project type", () => {
    const prompt = buildInitialEmailPrompt(mockLead);
    expect(prompt).toContain("Bygg og anlegg");
    expect(prompt).toContain("nettside");
  });

  it("instructs Norwegian language and casual tone", () => {
    const prompt = buildInitialEmailPrompt(mockLead);
    expect(prompt).toContain("norsk");
    expect(prompt.toLowerCase()).toContain("uformell");
  });
});

describe("buildFollowUpPrompt", () => {
  it("includes previous email content", () => {
    const prompt = buildFollowUpPrompt(mockLead, "Hei Erik, har du sett tilbudet?", 1);
    expect(prompt).toContain("Hei Erik, har du sett tilbudet?");
  });

  it("includes follow-up number", () => {
    const prompt = buildFollowUpPrompt(mockLead, "prev email", 2);
    expect(prompt).toContain("2");
  });

  it("instructs to keep it short", () => {
    const prompt = buildFollowUpPrompt(mockLead, "prev", 1);
    expect(prompt.toLowerCase()).toContain("kort");
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

```bash
npx vitest run src/lib/__tests__/email-generator.test.ts
```

Expected: FAIL — functions not found.

- [ ] **Step 4: Implement email generator**

Create `src/lib/email-generator.ts`:

```typescript
import Anthropic from "@anthropic-ai/sdk";
import type { Lead } from "./db/schema";

const anthropic = new Anthropic();

type LeadContext = Pick<Lead, "name" | "contactPerson" | "industryName" | "projectType" | "city">;

const SYSTEM_PROMPT = `Du er en selger for Argon Solutions, et norsk digitalbyrå.
Skriv e-poster på norsk med en uformell men profesjonell tone.
Regler:
- Kort og direkte (2-4 setninger maks)
- Ingen formelle hilsener som "Med vennlig hilsen"
- Signer kun med "— Sondre"
- Ikke bruk utropstegn
- Skriv som om du sender en rask melding til noen du kjenner litt
- Ikke start med "Hei!" — bruk "Hei [fornavn]," uten utropstegn`;

export function buildInitialEmailPrompt(lead: LeadContext): string {
  return `Skriv en første e-post til en potensiell kunde.

Firmanavn: ${lead.name}
Kontaktperson: ${lead.contactPerson ?? "ukjent"}
Bransje: ${lead.industryName ?? "ukjent"}
Prosjekttype: ${lead.projectType ?? "digitale tjenester"}
By: ${lead.city ?? "ukjent"}

Skriv en uformell, kort e-post på norsk som introduserer Argon Solutions og foreslår en kort prat om hvordan vi kan hjelpe dem med ${lead.projectType ?? "digitale tjenester"}.

Returner KUN e-postteksten, ingen emnelinjer eller metadata.`;
}

export function buildFollowUpPrompt(
  lead: LeadContext,
  previousEmail: string,
  followUpNumber: number
): string {
  return `Skriv oppfølgingsmail nummer ${followUpNumber} til en kunde som ikke har svart.

Firmanavn: ${lead.name}
Kontaktperson: ${lead.contactPerson ?? "ukjent"}
Bransje: ${lead.industryName ?? "ukjent"}

Forrige e-post vi sendte:
---
${previousEmail}
---

Skriv en kort og uformell oppfølging på norsk. Hold det til 1-2 setninger.
${followUpNumber >= 3 ? "Dette er siste oppfølging — gjør det tydelig at du ikke vil mase mer." : ""}

Returner KUN e-postteksten, ingen emnelinjer eller metadata.`;
}

export async function generateEmail(prompt: string): Promise<string> {
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 300,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: prompt }],
  });

  const block = response.content[0];
  if (block.type !== "text") throw new Error("Unexpected response type");
  return block.text.trim();
}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
npx vitest run src/lib/__tests__/email-generator.test.ts
```

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/lib/email-generator.ts src/lib/__tests__/email-generator.test.ts package.json package-lock.json
git commit -m "feat: add Claude-powered email generator with Norwegian prompts"
```

---

### Task 5: API Route — Generate & Send Email

**Files:**
- Create: `src/app/api/email/generate/route.ts`
- Create: `src/app/api/email/send/route.ts`

- [ ] **Step 1: Create email generate endpoint**

Create `src/app/api/email/generate/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { leads } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { buildInitialEmailPrompt, buildFollowUpPrompt, generateEmail } from "@/lib/email-generator";

export async function POST(request: NextRequest) {
  const { leadId, type, previousEmail, followUpNumber } = await request.json();

  const lead = await db.select().from(leads).where(eq(leads.id, leadId)).get();
  if (!lead) return NextResponse.json({ error: "Lead ikke funnet" }, { status: 404 });
  if (!lead.email) return NextResponse.json({ error: "Lead mangler e-postadresse" }, { status: 400 });

  const prompt = type === "followup"
    ? buildFollowUpPrompt(lead, previousEmail, followUpNumber)
    : buildInitialEmailPrompt(lead);

  const content = await generateEmail(prompt);

  const subject = type === "followup"
    ? undefined // Use existing thread subject
    : `Argon Solutions — ${lead.projectType ?? "samarbeid"}`;

  return NextResponse.json({ content, subject });
}
```

- [ ] **Step 2: Create email send endpoint**

Create `src/app/api/email/send/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { leads, emailThreads, activities } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getGmailClient, sendEmail, calculateNextFollowUp } from "@/lib/gmail";

export async function POST(request: NextRequest) {
  const { leadId, content, subject, threadId, inReplyTo, references } = await request.json();

  const lead = await db.select().from(leads).where(eq(leads.id, leadId)).get();
  if (!lead) return NextResponse.json({ error: "Lead ikke funnet" }, { status: 404 });
  if (!lead.email) return NextResponse.json({ error: "Lead mangler e-postadresse" }, { status: 400 });

  const gmail = getGmailClient();
  const isFollowUp = !!threadId;

  const result = await sendEmail(gmail, {
    to: lead.email,
    subject: isFollowUp ? `Re: ${subject}` : subject,
    body: content,
    inReplyTo,
    references,
    threadId,
  });

  if (isFollowUp) {
    // Update existing thread
    const existingThread = await db.select().from(emailThreads)
      .where(eq(emailThreads.gmailThreadId, threadId)).get();
    if (existingThread) {
      const newCount = existingThread.followUpCount + 1;
      await db.update(emailThreads)
        .set({
          gmailMessageId: result.messageId,
          followUpCount: newCount,
          lastEmailContent: content,
          nextFollowUpAt: newCount >= 3 ? null : calculateNextFollowUp(new Date()).toISOString().slice(0, 10),
          status: newCount >= 3 ? "completed" : "active",
          updatedAt: new Date().toISOString(),
        })
        .where(eq(emailThreads.id, existingThread.id));
    }
  } else {
    // Create new email thread
    await db.insert(emailThreads).values({
      leadId: lead.id,
      gmailThreadId: result.threadId,
      gmailMessageId: result.messageId,
      subject,
      lastEmailContent: content,
      nextFollowUpAt: calculateNextFollowUp(new Date()).toISOString().slice(0, 10),
    });
  }

  // Log activity
  await db.insert(activities).values({
    leadId: lead.id,
    type: "email",
    description: isFollowUp ? `Oppfølgingsmail sendt` : `E-post sendt: ${subject}`,
  });

  return NextResponse.json({ threadId: result.threadId, messageId: result.messageId });
}
```

- [ ] **Step 3: Verify endpoints compile**

```bash
cd c:/Users/sondr/Google/argon-crm && npx tsc --noEmit
```

Expected: No type errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/email/
git commit -m "feat: add API routes for email generation and sending"
```

---

### Task 6: Cron Job — Daily Follow-Up Processor

**Files:**
- Create: `src/app/api/cron/followup/route.ts`
- Create: `vercel.json`

- [ ] **Step 1: Create the cron endpoint**

Create `src/app/api/cron/followup/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { emailThreads, pendingFollowups, leads, activities } from "@/lib/db/schema";
import { eq, and, lte, lt } from "drizzle-orm";
import { getGmailClient, sendEmail, checkForReplies, calculateNextFollowUp } from "@/lib/gmail";
import { buildFollowUpPrompt, generateEmail } from "@/lib/email-generator";

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date();
  const dayOfWeek = today.getDay();
  // Skip weekends
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return NextResponse.json({ message: "Weekend — skipping", processed: 0 });
  }

  const todayStr = today.toISOString().slice(0, 10);

  // Find all active threads due for follow-up
  const dueThreads = await db.select()
    .from(emailThreads)
    .where(
      and(
        eq(emailThreads.status, "active"),
        lte(emailThreads.nextFollowUpAt, todayStr),
        lt(emailThreads.followUpCount, 3)
      )
    )
    .all();

  const gmail = getGmailClient();
  let processed = 0;

  for (const thread of dueThreads) {
    // Check for replies first
    if (thread.gmailThreadId && thread.gmailMessageId) {
      const hasReply = await checkForReplies(gmail, thread.gmailThreadId, thread.gmailMessageId);
      if (hasReply) {
        await db.update(emailThreads)
          .set({ status: "replied", updatedAt: new Date().toISOString() })
          .where(eq(emailThreads.id, thread.id));

        await db.insert(activities).values({
          leadId: thread.leadId,
          type: "email",
          description: "Svar mottatt — oppfølging stoppet",
        });
        processed++;
        continue;
      }
    }

    // Get lead data for AI context
    const lead = await db.select().from(leads).where(eq(leads.id, thread.leadId)).get();
    if (!lead) continue;

    const followUpNumber = thread.followUpCount + 1;
    const prompt = buildFollowUpPrompt(lead, thread.lastEmailContent ?? "", followUpNumber);
    const content = await generateEmail(prompt);

    if (thread.autoSend) {
      // Auto-send: generate and send immediately
      const result = await sendEmail(gmail, {
        to: lead.email!,
        subject: `Re: ${thread.subject}`,
        body: content,
        inReplyTo: thread.gmailMessageId ?? undefined,
        references: thread.gmailMessageId ?? undefined,
        threadId: thread.gmailThreadId ?? undefined,
      });

      await db.update(emailThreads)
        .set({
          gmailMessageId: result.messageId,
          followUpCount: followUpNumber,
          lastEmailContent: content,
          nextFollowUpAt: followUpNumber >= 3 ? null : calculateNextFollowUp(new Date()).toISOString().slice(0, 10),
          status: followUpNumber >= 3 ? "completed" : "active",
          updatedAt: new Date().toISOString(),
        })
        .where(eq(emailThreads.id, thread.id));

      await db.insert(activities).values({
        leadId: thread.leadId,
        type: "email",
        description: `Automatisk oppfølging #${followUpNumber} sendt`,
      });
    } else {
      // Manual: save as pending for approval
      await db.insert(pendingFollowups).values({
        emailThreadId: thread.id,
        generatedContent: content,
      });

      // Pause the thread until approved
      await db.update(emailThreads)
        .set({ status: "paused", updatedAt: new Date().toISOString() })
        .where(eq(emailThreads.id, thread.id));
    }

    processed++;
  }

  return NextResponse.json({ message: "Follow-up cron complete", processed });
}
```

- [ ] **Step 2: Create vercel.json with cron config**

Create `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/followup",
      "schedule": "0 8 * * 1-5"
    }
  ]
}
```

Note: `0 8 * * 1-5` = 08:00 UTC = 09:00 CET, weekdays only.

- [ ] **Step 3: Verify compilation**

```bash
cd c:/Users/sondr/Google/argon-crm && npx tsc --noEmit
```

Expected: No type errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/cron/followup/route.ts vercel.json
git commit -m "feat: add daily follow-up cron job with reply detection"
```

---

### Task 7: API Routes — Pending Follow-ups Management

**Files:**
- Create: `src/app/api/email/pending/route.ts`
- Create: `src/app/api/email/pending/[id]/route.ts`
- Create: `src/app/api/email/thread/[leadId]/route.ts`

- [ ] **Step 1: Create pending follow-ups list endpoint**

Create `src/app/api/email/pending/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { pendingFollowups, emailThreads, leads } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const pending = await db.select({
    id: pendingFollowups.id,
    generatedContent: pendingFollowups.generatedContent,
    status: pendingFollowups.status,
    createdAt: pendingFollowups.createdAt,
    threadId: emailThreads.id,
    gmailThreadId: emailThreads.gmailThreadId,
    subject: emailThreads.subject,
    followUpCount: emailThreads.followUpCount,
    leadId: leads.id,
    leadName: leads.name,
    contactPerson: leads.contactPerson,
    email: leads.email,
  })
    .from(pendingFollowups)
    .innerJoin(emailThreads, eq(pendingFollowups.emailThreadId, emailThreads.id))
    .innerJoin(leads, eq(emailThreads.leadId, leads.id))
    .where(eq(pendingFollowups.status, "pending"))
    .all();

  return NextResponse.json(pending);
}
```

- [ ] **Step 2: Create pending follow-up action endpoint**

Create `src/app/api/email/pending/[id]/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { pendingFollowups, emailThreads, leads, activities } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getGmailClient, sendEmail, calculateNextFollowUp } from "@/lib/gmail";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { action, editedContent } = await request.json();

  const pending = await db.select().from(pendingFollowups)
    .where(eq(pendingFollowups.id, parseInt(id))).get();
  if (!pending) return NextResponse.json({ error: "Ikke funnet" }, { status: 404 });

  if (action === "reject") {
    await db.update(pendingFollowups)
      .set({ status: "rejected" })
      .where(eq(pendingFollowups.id, pending.id));

    // Resume the thread for next cycle
    await db.update(emailThreads)
      .set({ status: "active", updatedAt: new Date().toISOString() })
      .where(eq(emailThreads.id, pending.emailThreadId));

    return NextResponse.json({ ok: true });
  }

  // Approve and send
  const thread = await db.select().from(emailThreads)
    .where(eq(emailThreads.id, pending.emailThreadId)).get();
  if (!thread) return NextResponse.json({ error: "Tråd ikke funnet" }, { status: 404 });

  const lead = await db.select().from(leads)
    .where(eq(leads.id, thread.leadId)).get();
  if (!lead?.email) return NextResponse.json({ error: "Lead mangler e-post" }, { status: 400 });

  const content = editedContent ?? pending.generatedContent;
  const gmail = getGmailClient();
  const followUpNumber = thread.followUpCount + 1;

  const result = await sendEmail(gmail, {
    to: lead.email,
    subject: `Re: ${thread.subject}`,
    body: content,
    inReplyTo: thread.gmailMessageId ?? undefined,
    references: thread.gmailMessageId ?? undefined,
    threadId: thread.gmailThreadId ?? undefined,
  });

  await db.update(emailThreads)
    .set({
      gmailMessageId: result.messageId,
      followUpCount: followUpNumber,
      lastEmailContent: content,
      nextFollowUpAt: followUpNumber >= 3 ? null : calculateNextFollowUp(new Date()).toISOString().slice(0, 10),
      status: followUpNumber >= 3 ? "completed" : "active",
      updatedAt: new Date().toISOString(),
    })
    .where(eq(emailThreads.id, thread.id));

  await db.update(pendingFollowups)
    .set({ status: "approved" })
    .where(eq(pendingFollowups.id, pending.id));

  await db.insert(activities).values({
    leadId: thread.leadId,
    type: "email",
    description: `Oppfølging #${followUpNumber} godkjent og sendt`,
  });

  return NextResponse.json({ ok: true, threadId: result.threadId });
}
```

- [ ] **Step 3: Create thread status endpoint for lead page**

Create `src/app/api/email/thread/[leadId]/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { emailThreads } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ leadId: string }> }) {
  const { leadId } = await params;
  const threads = await db.select().from(emailThreads)
    .where(eq(emailThreads.leadId, parseInt(leadId)))
    .orderBy(desc(emailThreads.createdAt))
    .all();

  return NextResponse.json(threads);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ leadId: string }> }) {
  const { leadId } = await params;
  const { threadId, autoSend, status } = await request.json();

  const updates: Record<string, unknown> = { updatedAt: new Date().toISOString() };
  if (autoSend !== undefined) updates.autoSend = autoSend ? 1 : 0;
  if (status !== undefined) updates.status = status;

  await db.update(emailThreads)
    .set(updates)
    .where(eq(emailThreads.id, threadId));

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 4: Verify compilation**

```bash
cd c:/Users/sondr/Google/argon-crm && npx tsc --noEmit
```

Expected: No type errors.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/email/
git commit -m "feat: add API routes for pending follow-ups and thread management"
```

---

### Task 8: UI — Email Composer Component

**Files:**
- Create: `src/components/EmailComposer.tsx`
- Modify: `src/app/leads/[id]/page.tsx`

- [ ] **Step 1: Create EmailComposer component**

Create `src/components/EmailComposer.tsx`:

```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

interface Props {
  leadId: number;
  leadName: string;
  hasEmail: boolean;
}

export function EmailComposer({ leadId, leadName, hasEmail }: Props) {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");
  const [subject, setSubject] = useState("");
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleGenerate() {
    setGenerating(true);
    try {
      const res = await fetch("/api/email/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId, type: "initial" }),
      });
      const data = await res.json();
      setContent(data.content);
      setSubject(data.subject);
    } finally {
      setGenerating(false);
    }
  }

  async function handleSend() {
    if (!content.trim() || !subject.trim()) return;
    setSending(true);
    try {
      await fetch("/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId, content, subject }),
      });
      setSent(true);
      setTimeout(() => {
        setOpen(false);
        setSent(false);
        setContent("");
        setSubject("");
        window.location.reload();
      }, 1500);
    } finally {
      setSending(false);
    }
  }

  if (!hasEmail) return null;

  return (
    <>
      <Button onClick={() => { setOpen(true); handleGenerate(); }} variant="primary">
        Send e-post
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />
          <div className="relative w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold text-text">Send e-post til {leadName}</h2>

            {sent ? (
              <div className="py-8 text-center text-green-600 font-medium">E-post sendt!</div>
            ) : (
              <>
                <div className="mb-3">
                  <label className="mb-1 block text-sm text-text-light">Emne</label>
                  <input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder={generating ? "Genererer..." : "Emnelinje"}
                  />
                </div>

                <div className="mb-4">
                  <label className="mb-1 block text-sm text-text-light">Innhold</label>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={6}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder={generating ? "AI genererer utkast..." : "Skriv e-postinnhold..."}
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <Button variant="ghost" onClick={() => setOpen(false)}>Avbryt</Button>
                  <Button variant="secondary" onClick={handleGenerate} disabled={generating}>
                    {generating ? "Genererer..." : "Regenerer"}
                  </Button>
                  <Button onClick={handleSend} disabled={sending || !content.trim()}>
                    {sending ? "Sender..." : "Send"}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
```

- [ ] **Step 2: Add EmailComposer to lead detail page**

In `src/app/leads/[id]/page.tsx`:

Add import at top:
```typescript
import { EmailComposer } from "@/components/EmailComposer";
```

Add the component in the header area, after the `<Badge>` component (inside the `flex items-center gap-4` div):

```tsx
<EmailComposer leadId={lead.id} leadName={lead.name} hasEmail={!!lead.email} />
```

- [ ] **Step 3: Verify the page loads without errors**

```bash
cd c:/Users/sondr/Google/argon-crm && npm run build
```

Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/components/EmailComposer.tsx src/app/leads/\[id\]/page.tsx
git commit -m "feat: add email composer with AI generation on lead page"
```

---

### Task 9: UI — Follow-Up Status on Lead Page

**Files:**
- Create: `src/components/FollowUpStatus.tsx`
- Modify: `src/app/leads/[id]/page.tsx`

- [ ] **Step 1: Create FollowUpStatus component**

Create `src/components/FollowUpStatus.tsx`:

```tsx
"use client";

import { useState, useEffect } from "react";
import type { EmailThread } from "@/lib/db/schema";

export function FollowUpStatus({ leadId }: { leadId: number }) {
  const [threads, setThreads] = useState<EmailThread[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/email/thread/${leadId}`)
      .then((r) => r.json())
      .then(setThreads)
      .finally(() => setLoading(false));
  }, [leadId]);

  if (loading) return <div className="text-xs text-text-light">Laster...</div>;
  if (threads.length === 0) return null;

  const statusLabels: Record<string, string> = {
    active: "Aktiv",
    replied: "Svar mottatt",
    completed: "Fullført",
    paused: "Venter godkjenning",
  };

  const statusColors: Record<string, string> = {
    active: "bg-blue-100 text-blue-700",
    replied: "bg-green-100 text-green-700",
    completed: "bg-gray-100 text-gray-600",
    paused: "bg-yellow-100 text-yellow-700",
  };

  async function toggleAutoSend(thread: EmailThread) {
    const newValue = !thread.autoSend;
    await fetch(`/api/email/thread/${leadId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ threadId: thread.id, autoSend: newValue }),
    });
    setThreads((prev) =>
      prev.map((t) => (t.id === thread.id ? { ...t, autoSend: newValue ? 1 : 0 } : t))
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-text">E-post oppfølging</h3>
      {threads.map((thread) => (
        <div key={thread.id} className="rounded-lg border border-gray-200 p-3 text-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-text">{thread.subject}</span>
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[thread.status]}`}>
              {statusLabels[thread.status]}
            </span>
          </div>
          <div className="space-y-1 text-xs text-text-light">
            <div>Oppfølginger sendt: {thread.followUpCount}/3</div>
            {thread.nextFollowUpAt && thread.status === "active" && (
              <div>Neste oppfølging: {new Date(thread.nextFollowUpAt).toLocaleDateString("nb-NO")}</div>
            )}
            <button
              onClick={() => toggleAutoSend(thread)}
              className="mt-1 text-primary hover:underline"
            >
              {thread.autoSend ? "Bytt til manuell godkjenning" : "Bytt til automatisk sending"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Add FollowUpStatus to lead detail page sidebar**

In `src/app/leads/[id]/page.tsx`:

Add import:
```typescript
import { FollowUpStatus } from "@/components/FollowUpStatus";
```

Add after the "Data-synk" card in the sidebar (inside `<div className="space-y-4">`):

```tsx
<Card className="p-4">
  <FollowUpStatus leadId={lead.id} />
</Card>
```

- [ ] **Step 3: Verify build**

```bash
cd c:/Users/sondr/Google/argon-crm && npm run build
```

Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/components/FollowUpStatus.tsx src/app/leads/\[id\]/page.tsx
git commit -m "feat: add follow-up status display on lead page"
```

---

### Task 10: UI — Oppfølging Dashboard Page

**Files:**
- Create: `src/app/oppfolging/page.tsx`
- Modify: `src/components/Sidebar.tsx`

- [ ] **Step 1: Create the dashboard page**

Create `src/app/oppfolging/page.tsx`:

```tsx
"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

interface PendingItem {
  id: number;
  generatedContent: string;
  createdAt: string;
  subject: string;
  followUpCount: number;
  leadId: number;
  leadName: string;
  contactPerson: string | null;
  email: string;
}

export default function OppfolgingPage() {
  const [pending, setPending] = useState<PendingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editedContent, setEditedContent] = useState("");
  const [processing, setProcessing] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/email/pending")
      .then((r) => r.json())
      .then(setPending)
      .finally(() => setLoading(false));
  }, []);

  async function handleAction(id: number, action: "approve" | "reject") {
    setProcessing(id);
    try {
      await fetch(`/api/email/pending/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          editedContent: editingId === id ? editedContent : undefined,
        }),
      });
      setPending((prev) => prev.filter((p) => p.id !== id));
      setEditingId(null);
    } finally {
      setProcessing(null);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-text">Oppfølging</h1>

      {loading ? (
        <div className="text-text-light">Laster...</div>
      ) : pending.length === 0 ? (
        <Card>
          <div className="py-8 text-center text-text-light">
            Ingen ventende oppfølginger
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {pending.map((item) => (
            <Card key={item.id}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <Link href={`/leads/${item.leadId}`} className="font-semibold text-text hover:text-primary">
                    {item.leadName}
                  </Link>
                  <div className="text-sm text-text-light">
                    {item.contactPerson ?? item.email} &middot; Oppfølging #{item.followUpCount + 1}
                  </div>
                </div>
                <div className="text-xs text-text-light">
                  {new Date(item.createdAt).toLocaleDateString("nb-NO")}
                </div>
              </div>

              <div className="mb-3 text-sm text-text-light">Re: {item.subject}</div>

              {editingId === item.id ? (
                <textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  rows={4}
                  className="mb-3 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              ) : (
                <div className="mb-3 rounded-lg bg-gray-50 p-3 text-sm text-text whitespace-pre-wrap">
                  {item.generatedContent}
                </div>
              )}

              <div className="flex gap-2 justify-end">
                {editingId === item.id ? (
                  <Button variant="ghost" onClick={() => setEditingId(null)}>Avbryt redigering</Button>
                ) : (
                  <Button
                    variant="ghost"
                    onClick={() => { setEditingId(item.id); setEditedContent(item.generatedContent); }}
                  >
                    Rediger
                  </Button>
                )}
                <Button
                  variant="danger"
                  onClick={() => handleAction(item.id, "reject")}
                  disabled={processing === item.id}
                >
                  Avvis
                </Button>
                <Button
                  onClick={() => handleAction(item.id, "approve")}
                  disabled={processing === item.id}
                >
                  {processing === item.id ? "Sender..." : "Godkjenn & send"}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Add Oppfølging to sidebar navigation**

In `src/components/Sidebar.tsx`, add to the `navItems` array:

```typescript
{ href: "/oppfolging", label: "Oppfølging", icon: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" },
```

- [ ] **Step 3: Verify build**

```bash
cd c:/Users/sondr/Google/argon-crm && npm run build
```

Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/app/oppfolging/page.tsx src/components/Sidebar.tsx
git commit -m "feat: add oppfølging dashboard with pending approval management"
```

---

### Task 11: Environment Setup & Documentation

**Files:**
- Modify: `.env.local` (add new env vars)
- Create: `.env.example`

- [ ] **Step 1: Create .env.example with required variables**

Create `.env.example`:

```bash
# Database (Turso)
TURSO_DATABASE_URL=libsql://your-db.turso.io
TURSO_AUTH_TOKEN=your-token

# Gmail API (post@argon.no - Google Workspace)
GMAIL_CLIENT_ID=your-client-id
GMAIL_CLIENT_SECRET=your-client-secret
GMAIL_REFRESH_TOKEN=your-refresh-token

# Claude AI (Anthropic)
ANTHROPIC_API_KEY=your-api-key

# Cron job authentication
CRON_SECRET=your-cron-secret
```

- [ ] **Step 2: Add new env vars to .env.local**

Add to the existing `.env.local` (keep existing TURSO vars):

```bash
# Gmail API (post@argon.no)
GMAIL_CLIENT_ID=
GMAIL_CLIENT_SECRET=
GMAIL_REFRESH_TOKEN=

# Claude AI
ANTHROPIC_API_KEY=

# Cron secret for Vercel
CRON_SECRET=
```

The user needs to:
1. Set up OAuth2 credentials for post@argon.no in Google Cloud Console
2. Get a refresh token using the OAuth flow
3. Add their Anthropic API key
4. Generate a random CRON_SECRET

- [ ] **Step 3: Commit .env.example only**

```bash
git add .env.example
git commit -m "docs: add .env.example with required environment variables"
```

---

## Verification

1. **Unit tests:** `npx vitest run` — all tests pass
2. **Build check:** `npm run build` — no compilation errors
3. **Manual test — send first email:** Open a lead with an email → click "Send e-post" → verify AI generates draft → edit → send → verify email arrives in Gmail
4. **Manual test — thread check:** Reply from the recipient → verify the reply appears in the same Gmail thread
5. **Manual test — cron follow-up:** Call `GET /api/cron/followup` with Bearer token → verify it processes due threads
6. **Manual test — pending approval:** Set a lead to manual mode → trigger cron → verify draft appears in `/oppfolging` → approve → verify email sends
7. **Manual test — reply detection:** Reply to a tracked thread → run cron → verify status changes to "replied"
