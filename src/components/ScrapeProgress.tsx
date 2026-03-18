"use client";

export interface ScrapeProgressData {
  added: number;
  skipped: number;
  failed: number;
  processed: number;
  total: number;
}

interface ScrapeProgressProps {
  status: "idle" | "running" | "done" | "error";
  progress: ScrapeProgressData;
  errorMessage?: string;
}

export function ScrapeProgress({ status, progress, errorMessage }: ScrapeProgressProps) {
  const pct = progress.total > 0 ? Math.round((progress.processed / progress.total) * 100) : 0;

  return (
    <div className="space-y-4">
      <div>
        <div className="mb-1 flex justify-between text-sm">
          <span className="text-text-light">
            {status === "done" ? "Ferdig!" : `${progress.processed} av ${progress.total} behandlet`}
          </span>
          <span className="font-medium text-text">{pct}%</span>
        </div>
        <div className="h-2.5 w-full rounded-full bg-gray-100">
          <div
            className={`h-2.5 rounded-full transition-all duration-300 ${status === "done" ? "bg-emerald-500" : status === "error" ? "bg-red-500" : "bg-primary"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg bg-emerald-50 p-3 text-center">
          <div className="text-xl font-bold text-emerald-700">{progress.added}</div>
          <div className="text-xs text-emerald-600">Lagt til</div>
        </div>
        <div className="rounded-lg bg-amber-50 p-3 text-center">
          <div className="text-xl font-bold text-amber-700">{progress.skipped}</div>
          <div className="text-xs text-amber-600">Duplikater</div>
        </div>
        <div className="rounded-lg bg-red-50 p-3 text-center">
          <div className="text-xl font-bold text-red-700">{progress.failed}</div>
          <div className="text-xs text-red-600">Feilet</div>
        </div>
      </div>

      {status === "done" && (
        <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <svg className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <div className="font-medium text-emerald-800">Scraping fullført</div>
            <div className="text-sm text-emerald-600">
              {progress.added} nye leads lagt til i pipeline. {progress.skipped > 0 && `${progress.skipped} duplikater hoppet over.`}
            </div>
          </div>
        </div>
      )}

      {status === "error" && (
        <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
          <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <div className="font-medium text-red-800">Feil under scraping</div>
            <div className="text-sm text-red-600">{errorMessage ?? "Ukjent feil"}</div>
          </div>
        </div>
      )}
    </div>
  );
}
