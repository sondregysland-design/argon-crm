"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import type { ScrapeJob } from "@/lib/db/schema";

const jobLabels: Record<string, string> = {
  brreg_sync: "Brønnøysund-synk",
  proff_enrich: "Proff.no-berikelse",
  google_enrich: "Google Places-berikelse",
};

export function JobStatusTable({ jobs: initialJobs }: { jobs: ScrapeJob[] }) {
  const [jobs, setJobs] = useState(initialJobs);
  const [runningId, setRunningId] = useState<number | null>(null);

  async function handleRunJob(jobId: number) {
    setRunningId(jobId);
    try {
      const res = await fetch("/api/jobber", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId }),
      });
      if (res.ok) {
        // Refresh job list after a short delay to pick up status change
        setTimeout(async () => {
          const refreshed = await fetch("/api/jobber");
          const data = await refreshed.json();
          setJobs(data);
          setRunningId(null);
        }, 2000);
      } else {
        setRunningId(null);
      }
    } catch {
      setRunningId(null);
    }
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-gray-100 bg-gray-50/50">
          <tr>
            <th className="px-3 py-3 font-medium text-text-light sm:px-4">Jobb</th>
            <th className="px-3 py-3 font-medium text-text-light sm:px-4">Status</th>
            <th className="hidden px-4 py-3 font-medium text-text-light sm:table-cell">Cron</th>
            <th className="hidden px-4 py-3 font-medium text-text-light md:table-cell">Sist kjørt</th>
            <th className="hidden px-4 py-3 font-medium text-text-light md:table-cell">Behandlet</th>
            <th className="px-3 py-3 font-medium text-text-light sm:px-4"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {jobs.map((job) => (
            <tr key={job.id}>
              <td className="px-3 py-3 font-medium text-text sm:px-4">{jobLabels[job.name] ?? job.name}</td>
              <td className="px-3 py-3 sm:px-4"><Badge label={job.status} /></td>
              <td className="hidden px-4 py-3 text-text-light font-mono text-xs sm:table-cell">{job.cronExpression}</td>
              <td className="hidden px-4 py-3 text-text-light md:table-cell">
                {job.lastRunAt ? new Date(job.lastRunAt).toLocaleString("nb-NO") : "Aldri"}
              </td>
              <td className="hidden px-4 py-3 text-text-light md:table-cell">{job.recordsProcessed ?? "—"}</td>
              <td className="px-3 py-3 sm:px-4">
                <Button
                  variant="ghost"
                  className="text-xs"
                  disabled={job.status === "running" || runningId === job.id}
                  onClick={() => handleRunJob(job.id)}
                >
                  {runningId === job.id ? "Starter..." : "Kjør nå"}
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
