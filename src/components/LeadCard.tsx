"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Badge } from "@/components/ui/Badge";
import Link from "next/link";
import type { Lead } from "@/lib/db/schema";
import { PROJECT_TYPE_LABELS } from "@/lib/constants";

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

const sourceBorderColors: Record<string, string> = {
  calendar: "border-l-4 border-l-green-500",
  "contact-form": "border-l-4 border-l-blue-500",
};

interface LeadCardProps {
  lead: Lead;
  onMoveLead?: (leadId: number, newStage: string) => void;
  onDelete?: (leadId: number) => void;
}

export function LeadCard({ lead, onMoveLead, onDelete }: LeadCardProps) {
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
      className={`cursor-grab rounded-lg border border-gray-100 bg-white p-3 shadow-sm transition hover:shadow-md active:cursor-grabbing ${sourceBorderColors[lead.source ?? ""] ?? ""}`}
    >
      <div className="flex items-start justify-between">
        <Link href={`/leads/${lead.id}`} className="block flex-1" onClick={(e) => isDragging && e.preventDefault()}>
          <div className="font-medium text-text">{lead.name}</div>
        <div className="mt-1 text-xs text-text-light">{lead.city ?? lead.kommune ?? "—"}</div>
        {lead.summary ? (
          <p className="text-xs leading-snug text-text-light line-clamp-2 mt-2">{lead.summary}</p>
        ) : lead.industryName ? (
          <span className="inline-block rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700 mt-2">{lead.industryName}</span>
        ) : null}
        {lead.projectType && (
          <Badge label={PROJECT_TYPE_LABELS[lead.projectType] || lead.projectType} className="mt-1" />
        )}
        {lead.employees != null && lead.employees > 0 && (
          <div className="mt-1 text-xs text-text-light">{lead.employees} ansatte</div>
        )}
      </Link>
      {onDelete && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(lead.id); }}
          className="ml-1 shrink-0 rounded p-0.5 text-gray-300 hover:bg-red-50 hover:text-red-500 transition"
          title="Slett lead"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
      </div>

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
