"use client";

import { useState, useEffect, useRef } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { cronToHuman } from "@/lib/utils";
import type { ScrapeJob } from "@/lib/db/schema";

const jobLabels: Record<string, string> = {
  brreg_sync: "Brønnøysund-synk",
  proff_enrich: "Proff.no-berikelse",
  google_enrich: "Google Places-berikelse",
};

export function JobStatusTable({ jobs: initialJobs }: { jobs: ScrapeJob[] }) {
  const [jobs, setJobs] = useState(initialJobs);
  const [runningId, setRunningId] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const hasRunning = jobs.some((j) => j.status === "running") || runningId !== null;

  useEffect(() => {
    if (hasRunning) {
      // Poll every 2 seconds
      pollRef.current = setInterval(async () => {
        try {
          const res = await fetch("/api/jobber");
          const data = await res.json();
          setJobs(data);
          const stillRunning = data.some((j: ScrapeJob) => j.status === "running");
          if (!stillRunning) {
            setRunningId(null);
            setElapsed(0);
          }
        } catch { /* ignore */ }
      }, 2000);

      // Elapsed timer every second
      timerRef.current = setInterval(() => {
        setElapsed((e) => e + 1);
      }, 1000);
    }

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [hasRunning]);

  async function handleRunJob(jobId: number) {
    setRunningId(jobId);
    setElapsed(0);
    try {
      const res = await fetch("/api/jobber", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId }),
      });
      if (!res.ok) {
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
          {jobs.map((job) => {
            const isRunning = job.status === "running" || runningId === job.id;
            return (
              <tr key={job.id}>
                <td className="px-3 py-3 font-medium text-text sm:px-4">
                  {jobLabels[job.name] ?? job.name}
                </td>
                <td className="px-3 py-3 sm:px-4">
                  {isRunning ? (
                    <div className="flex items-center gap-2">
                      <Badge label="running" />
                      <span className="text-xs text-text-light">{elapsed}s</span>
                    </div>
                  ) : (
                    <Badge label={job.status} />
                  )}
                </td>
                <td className="hidden px-4 py-3 text-text-light text-xs sm:table-cell">
                  {job.cronExpression ? cronToHuman(job.cronExpression) : "—"}
                </td>
                <td className="hidden px-4 py-3 text-text-light md:table-cell">
                  {job.lastRunAt ? new Date(job.lastRunAt).toLocaleString("nb-NO") : "Aldri"}
                </td>
                <td className="hidden px-4 py-3 text-text-light md:table-cell">
                  {job.recordsProcessed ?? "—"}
                </td>
                <td className="px-3 py-3 sm:px-4">
                  <Button
                    variant="ghost"
                    className="text-xs"
                    disabled={isRunning}
                    onClick={() => handleRunJob(job.id)}
                  >
                    {isRunning ? (
                      <span className="flex items-center gap-1.5">
                        <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Kjører...
                      </span>
                    ) : "Kjør nå"}
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {hasRunning && (
        <div className="border-t border-gray-100 px-4 py-3">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-primary transition-all duration-1000 ease-linear"
              style={{ width: `${Math.min((elapsed / 30) * 100, 95)}%` }}
            />
          </div>
          <p className="mt-1.5 text-xs text-text-light">
            Berikelse pågår... {elapsed}s (estimert ~30s)
          </p>
        </div>
      )}
    </div>
  );
}
