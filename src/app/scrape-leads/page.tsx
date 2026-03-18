"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { ScrapeConfig, type ScrapeFilters } from "@/components/ScrapeConfig";
import { ScrapeProgress, type ScrapeProgressData } from "@/components/ScrapeProgress";

export default function ScrapeLeadsPage() {
  const [status, setStatus] = useState<"idle" | "running" | "done" | "error">("idle");
  const [progress, setProgress] = useState<ScrapeProgressData>({ added: 0, skipped: 0, failed: 0, processed: 0, total: 0 });
  const [errorMessage, setErrorMessage] = useState("");

  async function handleStart(config: ScrapeFilters) {
    setStatus("running");
    setProgress({ added: 0, skipped: 0, failed: 0, processed: 0, total: 0 });
    setErrorMessage("");

    if (!config.navn && !config.kommunenummer && !config.naeringskode) {
      setStatus("error");
      setErrorMessage("Velg minst ett filter: bedriftsnavn, kommune, eller bransje.");
      return;
    }

    try {
      const res = await fetch("/api/scrape-leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });

      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => null);
        setStatus("error");
        setErrorMessage(err?.error ?? "Kunne ikke starte scraping");
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const dataLine = line.trim();
          if (!dataLine.startsWith("data: ")) continue;

          const json = JSON.parse(dataLine.slice(6));

          if (json.type === "progress") {
            setProgress({ added: json.added, skipped: json.skipped, failed: json.failed, processed: json.processed, total: json.total });
          } else if (json.type === "done") {
            setProgress({ added: json.added, skipped: json.skipped, failed: json.failed, processed: json.total, total: json.total });
            setStatus("done");
          } else if (json.type === "error") {
            setErrorMessage(json.message);
            setStatus("error");
          }
        }
      }

      // If we finished reading without a done event, mark as done
      if (status === "running") {
        setStatus("done");
      }
    } catch {
      setStatus("error");
      setErrorMessage("Nettverksfeil — sjekk at serveren kjører");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text">Auto-scrape leads</h1>
        <p className="mt-1 text-text-light">Sett opp kriterier og importer bedrifter automatisk fra Brønnøysundregistrene.</p>
      </div>

      <Card>
        <ScrapeConfig onStart={handleStart} disabled={status === "running"} />
      </Card>

      {status !== "idle" && (
        <Card>
          <ScrapeProgress status={status} progress={progress} errorMessage={errorMessage} />
        </Card>
      )}
    </div>
  );
}
