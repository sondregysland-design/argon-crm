"use client";

import { useState } from "react";
import { DndContext, DragEndEvent, closestCorners, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { KanbanColumn } from "@/components/KanbanColumn";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { Lead } from "@/lib/db/schema";

const STAGES = ["ny", "kontaktet", "kvalifisert", "kunde"] as const;

export function KanbanBoard({ initialLeads }: { initialLeads: Lead[] }) {
  const [leads, setLeads] = useState(initialLeads);
  const [deleteStage, setDeleteStage] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const filteredLeads = search
    ? leads.filter((l) => l.name.toLowerCase().includes(search.toLowerCase()) ||
        (l.city ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (l.summary ?? "").toLowerCase().includes(search.toLowerCase()))
    : leads;

  const deleteCount = deleteStage ? leads.filter((l) => l.stage === deleteStage).length : 0;

  function moveLead(leadId: number, newStage: string) {
    const lead = leads.find((l) => l.id === leadId);
    if (!lead || lead.stage === newStage) return;

    setLeads((prev) => prev.map((l) => l.id === leadId ? { ...l, stage: newStage as typeof STAGES[number] } : l));

    fetch("/api/pipeline", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadId, newStage, newOrder: 0 }),
    }).catch(() => {
      setLeads((prev) => prev.map((l) => l.id === leadId ? { ...l, stage: lead.stage } : l));
    });
  }

  async function confirmDeleteAll() {
    if (!deleteStage) return;
    const stageLeads = leads.filter((l) => l.stage === deleteStage);
    setLeads((prev) => prev.filter((l) => l.stage !== deleteStage));
    setDeleteStage(null);
    for (const lead of stageLeads) {
      await fetch(`/api/leads/${lead.id}`, { method: "DELETE" }).catch(() => {});
    }
  }

  function deleteLead(leadId: number) {
    setLeads((prev) => prev.filter((l) => l.id !== leadId));
    fetch(`/api/leads/${leadId}`, { method: "DELETE" }).catch(() => {});
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    const leadId = active.id as number;
    const newStage = over.id as typeof STAGES[number];
    if (!STAGES.includes(newStage)) return;
    moveLead(leadId, newStage);
  }

  return (
    <>
      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Søk leads..."
          className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm transition focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:max-w-xs"
        />
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
          {STAGES.map((stage) => (
            <KanbanColumn
              key={stage}
              stage={stage}
              leads={filteredLeads.filter((l) => l.stage === stage)}
              onDeleteAll={stage === "ny" ? () => setDeleteStage("ny") : undefined}
              onMoveLead={moveLead}
              onDeleteLead={deleteLead}
            />
          ))}
        </div>
      </DndContext>
      <ConfirmDialog
        open={deleteStage !== null}
        title="Slett alle leads"
        description={`Er du sikker på at du vil slette ${deleteCount} leads fra \u00ABNy\u00BB-kolonnen? Denne handlingen kan ikke angres.`}
        confirmLabel={`Slett ${deleteCount} leads`}
        onConfirm={confirmDeleteAll}
        onCancel={() => setDeleteStage(null)}
      />
    </>
  );
}
