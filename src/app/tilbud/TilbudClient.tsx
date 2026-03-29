"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import Link from "next/link";

const FILTER_TABS = [
  { value: "", label: "Alle" },
  { value: "utkast", label: "Utkast" },
  { value: "sendt", label: "Sendt" },
  { value: "akseptert", label: "Akseptert" },
  { value: "avvist", label: "Avvist" },
] as const;

type Quote = {
  id: number;
  quoteNumber: string;
  leadId: number | null;
  leadName: string | null;
  status: string;
  createdAt: string;
};

export function TilbudClient({ quotes }: { quotes: Quote[] }) {
  const [statusFilter, setStatusFilter] = useState("");

  const filtered = statusFilter
    ? quotes.filter((q) => q.status === statusFilter)
    : quotes;

  return (
    <>
      <div className="flex gap-2">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition ${
              statusFilter === tab.value
                ? "bg-primary text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <Card>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-text-light">
              <th className="pb-3 font-medium">Nummer</th>
              <th className="pb-3 font-medium">Kunde</th>
              <th className="pb-3 font-medium">Status</th>
              <th className="pb-3 font-medium">Dato</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map((q) => (
              <tr key={q.id} className="group hover:bg-gray-50">
                <td className="py-3">
                  <Link href={`/tilbud/${q.id}`} className="font-medium text-primary hover:underline">
                    {q.quoteNumber}
                  </Link>
                </td>
                <td className="py-3 text-text">
                  {q.leadId && q.leadName ? (
                    <Link href={`/leads/${q.leadId}`} className="hover:underline">{q.leadName}</Link>
                  ) : (
                    <span className="text-text-light">Ingen kunde</span>
                  )}
                </td>
                <td className="py-3"><Badge label={q.status} /></td>
                <td className="py-3 text-text-light">
                  {new Date(q.createdAt).toLocaleDateString("nb-NO")}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="py-8 text-center text-text-light">
                  {statusFilter ? "Ingen tilbud med denne statusen." : "Ingen tilbud enda. Opprett det første!"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </>
  );
}
