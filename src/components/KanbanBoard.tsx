"use client";

import { useState } from "react";
import { DndContext, DragEndEvent, closestCorners, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { KanbanColumn } from "@/components/KanbanColumn";
import type { Lead } from "@/lib/db/schema";

const STAGES = ["ny", "kontaktet", "kvalifisert", "kunde"] as const;

export function KanbanBoard({ initialLeads }: { initialLeads: Lead[] }) {
  const [leads, setLeads] = useState(initialLeads);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

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

  async function deleteAllInStage(stage: string) {
    const stageLeads = leads.filter((l) => l.stage === stage);
    if (stageLeads.length === 0) return;
    if (!confirm(`Er du sikker på at du vil slette ${stageLeads.length} leads fra "${stage}"?`)) return;

    // Optimistic: remove from UI
    setLeads((prev) => prev.filter((l) => l.stage !== stage));

    // Delete each lead via API
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
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-4 gap-4">
        {STAGES.map((stage) => (
          <KanbanColumn
            key={stage}
            stage={stage}
            leads={leads.filter((l) => l.stage === stage)}
            onDeleteAll={stage === "ny" ? () => deleteAllInStage("ny") : undefined}
            onMoveLead={moveLead}
            onDeleteLead={deleteLead}
          />
        ))}
      </div>
    </DndContext>
  );
}
