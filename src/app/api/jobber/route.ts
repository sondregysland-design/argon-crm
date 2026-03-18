import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { scrapeJobs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  const jobs = db.select().from(scrapeJobs).all();
  return NextResponse.json(jobs);
}

export async function POST(request: NextRequest) {
  const { jobId } = await request.json();

  const job = db.select().from(scrapeJobs).where(eq(scrapeJobs.id, jobId)).get();
  if (!job) return NextResponse.json({ error: "Jobb ikke funnet" }, { status: 404 });
  if (job.status === "running") return NextResponse.json({ error: "Jobben kjører allerede" }, { status: 409 });

  // Run the job async based on name
  if (job.name === "brreg_sync") {
    import("@/lib/jobs/tasks").then(({ runBrregSync }) => runBrregSync());
  }

  return NextResponse.json({ ok: true, message: `Starter ${job.name}...` });
}
