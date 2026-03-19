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
            <th className="px-3 py-3 font-medium text-text-light sm:px-4">Bedrift</th>
            <th className="hidden px-4 py-3 font-medium text-text-light sm:table-cell">Bransje</th>
            <th className="hidden px-4 py-3 font-medium text-text-light sm:table-cell">Sted</th>
            <th className="hidden px-4 py-3 font-medium text-text-light md:table-cell">Ansatte</th>
            <th className="px-3 py-3 font-medium text-text-light sm:px-4"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {results.map((r) => (
            <tr key={r.orgNumber} className="hover:bg-gray-50/50">
              <td className="px-3 py-3 sm:px-4">
                <div className="font-medium text-text">{r.name}</div>
                <div className="text-xs text-text-light">{r.orgNumber}</div>
                <div className="mt-0.5 text-xs text-text-light sm:hidden">{r.city ?? r.kommune ?? ""}</div>
              </td>
              <td className="hidden px-4 py-3 text-text-light sm:table-cell">{r.industryName ?? "—"}</td>
              <td className="hidden px-4 py-3 text-text-light sm:table-cell">{r.city ?? r.kommune ?? "—"}</td>
              <td className="hidden px-4 py-3 text-text-light md:table-cell">{r.employees ?? "—"}</td>
              <td className="px-3 py-3 sm:px-4">
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
