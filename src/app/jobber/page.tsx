import { db } from "@/lib/db";
import { scrapeJobs } from "@/lib/db/schema";
import { JobStatusTable } from "@/components/JobStatusTable";

export const dynamic = "force-dynamic";

export default function JobberPage() {
  const jobs = db.select().from(scrapeJobs).all();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text">Scraping-jobber</h1>
        <p className="mt-1 text-text-light">Status på automatiske datainnhentingsjobber.</p>
      </div>
      <JobStatusTable jobs={jobs} />
    </div>
  );
}
