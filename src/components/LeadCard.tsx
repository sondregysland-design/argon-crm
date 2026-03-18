"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Badge } from "@/components/ui/Badge";
import Link from "next/link";
import type { Lead } from "@/lib/db/schema";

const STAGES = ["ny", "kontaktet", "kvalifisert", "kunde"] as const;

const stageLabels: Record<string, string> = {
  ny: "Ny",
  kontaktet: "Kontaktet",
  kvalifisert: "Kvalifisert",
  kunde: "Kunde",
};

const stageArrowColors: Record<string, string> = {
  ny: "text-blue-400 hover:text-blue-600",
  kontaktet: "text-amber-400 hover:text-amber-600",
  kvalifisert: "text-purple-400 hover:text-purple-600",
  kunde: "text-emerald-400 hover:text-emerald-600",
};

interface LeadCardProps {
  lead: Lead;
  onMoveLead?: (leadId: number, newStage: string) => void;
}

export function LeadCard({ lead, onMoveLead }: LeadCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: lead.id,
    data: { lead },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const currentIdx = STAGES.indexOf(lead.stage as typeof STAGES[number]);
  const nextStage = currentIdx < STAGES.length - 1 ? STAGES[currentIdx + 1] : null;
  const prevStage = currentIdx > 0 ? STAGES[currentIdx - 1] : null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="cursor-grab rounded-lg border border-gray-100 bg-white p-3 shadow-sm transition hover:shadow-md active:cursor-grabbing"
    >
      <Link href={`/leads/${lead.id}`} className="block" onClick={(e) => isDragging && e.preventDefault()}>
        <div className="font-medium text-text">{lead.name}</div>
        <div className="mt-1 text-xs text-text-light">{lead.city ?? lead.kommune ?? "—"}</div>
        {lead.industryName && (
          <Badge label={lead.industryName} className="mt-2" />
        )}
        {lead.employees != null && lead.employees > 0 && (
          <div className="mt-1 text-xs text-text-light">{lead.employees} ansatte</div>
        )}
      </Link>

      {onMoveLead && (
        <div className="mt-2 flex items-center justify-between border-t border-gray-50 pt-2">
          {prevStage ? (
            <button
              onClick={(e) => { e.stopPropagation(); onMoveLead(lead.id, prevStage); }}
              className={`flex items-center gap-1 rounded px-1.5 py-0.5 text-xs transition ${stageArrowColors[prevStage]}`}
              title={`Flytt til ${stageLabels[prevStage]}`}
            >
              &larr; {stageLabels[prevStage]}
            </button>
          ) : <span />}
          {nextStage && (
            <button
              onClick={(e) => { e.stopPropagation(); onMoveLead(lead.id, nextStage); }}
              className={`flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium transition ${stageArrowColors[nextStage]}`}
              title={`Flytt til ${stageLabels[nextStage]}`}
            >
              {stageLabels[nextStage]} &rarr;
            </button>
          )}
        </div>
      )}
    </div>
  );
}
