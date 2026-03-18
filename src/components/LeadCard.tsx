"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Badge } from "@/components/ui/Badge";
import Link from "next/link";
import type { Lead } from "@/lib/db/schema";

export function LeadCard({ lead }: { lead: Lead }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: lead.id,
    data: { lead },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

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
        {lead.employees && (
          <div className="mt-1 text-xs text-text-light">{lead.employees} ansatte</div>
        )}
      </Link>
    </div>
  );
}
