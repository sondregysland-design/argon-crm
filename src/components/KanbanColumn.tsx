"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { LeadCard } from "@/components/LeadCard";
import type { Lead } from "@/lib/db/schema";

const stageLabels: Record<string, string> = {
  ny: "Ny",
  kontaktet: "Kontaktet",
  kvalifisert: "Kvalifisert",
  kunde: "Kunde",
};

const stageHeaderColors: Record<string, string> = {
  ny: "bg-blue-500",
  kontaktet: "bg-amber-500",
  kvalifisert: "bg-purple-500",
  kunde: "bg-emerald-500",
};

interface KanbanColumnProps {
  stage: string;
  leads: Lead[];
  onDeleteAll?: () => void;
  onMoveLead?: (leadId: number, newStage: string) => void;
}

export function KanbanColumn({ stage, leads, onDeleteAll, onMoveLead }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });

  return (
    <div className={`flex min-h-[400px] flex-col rounded-xl bg-gray-50 ${isOver ? "ring-2 ring-primary/30" : ""}`}>
      <div className="flex items-center gap-2 p-3">
        <div className={`h-2.5 w-2.5 rounded-full ${stageHeaderColors[stage]}`} />
        <h3 className="text-sm font-semibold text-text">{stageLabels[stage]}</h3>
        <span className="ml-auto text-xs text-text-light">{leads.length}</span>
        {onDeleteAll && leads.length > 0 && (
          <button
            onClick={onDeleteAll}
            className="ml-1 rounded px-1.5 py-0.5 text-xs text-red-500 hover:bg-red-50 hover:text-red-700 transition"
            title={`Slett alle ${leads.length} leads i ${stageLabels[stage]}`}
          >
            Slett alle
          </button>
        )}
      </div>
      <div ref={setNodeRef} className="flex flex-1 flex-col gap-2 p-2">
        <SortableContext items={leads.map((l) => l.id)} strategy={verticalListSortingStrategy}>
          {leads.map((lead) => (
            <LeadCard key={lead.id} lead={lead} onMoveLead={onMoveLead} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}
