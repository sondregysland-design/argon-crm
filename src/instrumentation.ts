export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Seed default scrape jobs
    const { db } = await import("@/lib/db");
    const { scrapeJobs } = await import("@/lib/db/schema");
    const { sql } = await import("drizzle-orm");

    const jobCount = await db.select({ count: sql<number>`count(*)` }).from(scrapeJobs).get();
    if (jobCount && jobCount.count === 0) {
      await db.insert(scrapeJobs).values([
        { name: "brreg_sync", cronExpression: "0 3 * * 1", status: "idle" as const },
        { name: "proff_enrich", cronExpression: "0 3 * * 2", status: "idle" as const },
        { name: "google_enrich", cronExpression: "0 3 * * 3", status: "idle" as const },
      ]);
    }

    // Only start scheduler in non-serverless environments
    if (!process.env.VERCEL) {
      const { startScheduler } = await import("@/lib/jobs/scheduler");
      startScheduler();
    }
  }
}
