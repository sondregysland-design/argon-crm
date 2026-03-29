"use client";

import { useState, useEffect } from "react";

interface EmailThread {
  id: number;
  subject: string;
  followUpCount: number;
  nextFollowUpAt: string | null;
  autoSend: number;
  status: string;
}

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
