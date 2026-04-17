import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { db } from "@/lib/db";
import { scrapeJobs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  const jobs = await db.select().from(scrapeJobs).all();
  return NextResponse.json(jobs);
}

export async function POST(request: NextRequest) {
  const { jobId } = await request.json();

  const job = await db.select().from(scrapeJobs).where(eq(scrapeJobs.id, jobId)).get();
  if (!job) return NextResponse.json({ error: "Jobb ikke funnet" }, { status: 404 });
  if (job.status === "running") return NextResponse.json({ error: "Jobben kjører allerede" }, { status: 409 });

  after(async () => {
    if (job.name === "brreg_sync") {
      const { runBrregSync } = await import("@/lib/jobs/tasks");
      await runBrregSync();
    } else if (job.name === "google_enrich") {
      const { runGoogleEnrich } = await import("@/lib/jobs/tasks");
      await runGoogleEnrich();
    }
  });

  return NextResponse.json({ ok: true, message: `Starter ${job.name}...` });
}
