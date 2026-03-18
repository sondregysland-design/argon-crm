"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import type { Activity } from "@/lib/db/schema";

const typeLabels: Record<string, string> = {
  note: "Notat",
  email: "E-post",
  call: "Telefonsamtale",
  stage_change: "Status endret",
  data_enriched: "Data oppdatert",
};

const typeIcons: Record<string, string> = {
  note: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z",
  stage_change: "M9 5l7 7-7 7",
  data_enriched: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15",
};

export function ActivityLog({ leadId, initialActivities }: { leadId: number; initialActivities: Activity[] }) {
  const [activities, setActivities] = useState(initialActivities);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  async function addNote() {
    if (!note.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/leads/${leadId}/aktivitet`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "note", description: note }),
      });
      const activity = await res.json();
      setActivities((prev) => [activity, ...prev]);
      setNote("");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Legg til et notat..."
          className="flex-1 rounded-lg border border-gray-200 px-4 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          onKeyDown={(e) => e.key === "Enter" && addNote()}
        />
        <Button onClick={addNote} disabled={saving || !note.trim()}>
          {saving ? "Lagrer..." : "Legg til"}
        </Button>
      </div>

      <div className="space-y-3">
        {activities.map((a) => (
          <div key={a.id} className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100">
              <svg className="h-4 w-4 text-text-light" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d={typeIcons[a.type] ?? typeIcons.note} />
              </svg>
            </div>
            <div>
              <div className="text-sm text-text">{a.description}</div>
              <div className="mt-0.5 text-xs text-text-light">
                {typeLabels[a.type] ?? a.type} &middot; {new Date(a.createdAt).toLocaleDateString("nb-NO", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
