"use client";

import { Button } from "@/components/ui/Button";

interface SearchResult {
  orgNumber: string;
  name: string;
  industryCode: string | null;
  industryName: string | null;
  address: string | null;
  postalCode: string | null;
  city: string | null;
  kommune: string | null;
  employees: number | null;
  website: string | null;
  foundedDate: string | null;
}

interface LeadTableProps {
  results: SearchResult[];
  onAddLead: (result: SearchResult) => void;
  addingOrgNr: string | null;
}

export function LeadTable({ results, onAddLead, addingOrgNr }: LeadTableProps) {
  if (results.length === 0) {
    return <p className="py-12 text-center text-text-light">Ingen resultater. Prøv et annet søk.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-gray-100 bg-gray-50/50">
          <tr>
            <th className="px-4 py-3 font-medium text-text-light">Bedrift</th>
            <th className="px-4 py-3 font-medium text-text-light">Bransje</th>
            <th className="px-4 py-3 font-medium text-text-light">Sted</th>
            <th className="px-4 py-3 font-medium text-text-light">Ansatte</th>
            <th className="px-4 py-3 font-medium text-text-light"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {results.map((r) => (
            <tr key={r.orgNumber} className="hover:bg-gray-50/50">
              <td className="px-4 py-3">
                <div className="font-medium text-text">{r.name}</div>
                <div className="text-xs text-text-light">{r.orgNumber}</div>
              </td>
              <td className="px-4 py-3 text-text-light">{r.industryName ?? "—"}</td>
              <td className="px-4 py-3 text-text-light">{r.city ?? r.kommune ?? "—"}</td>
              <td className="px-4 py-3 text-text-light">{r.employees ?? "—"}</td>
              <td className="px-4 py-3">
                <Button
                  variant="secondary"
                  onClick={() => onAddLead(r)}
                  disabled={addingOrgNr === r.orgNumber}
                  className="text-xs"
                >
                  {addingOrgNr === r.orgNumber ? "Legger til..." : "Legg til"}
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
