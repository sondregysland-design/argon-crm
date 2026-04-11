"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { SearchFilters } from "@/components/SearchFilters";
import { LeadTable } from "@/components/LeadTable";

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

export default function SokPage() {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addingOrgNr, setAddingOrgNr] = useState<string | null>(null);

  async function handleSearch(filters: { navn: string; kommunenummer: string; naeringskode: string }) {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters.navn) params.set("navn", filters.navn);
      if (filters.kommunenummer) params.set("kommunenummer", filters.kommunenummer);
      if (filters.naeringskode) params.set("naeringskode", filters.naeringskode);

      const res = await fetch(`/api/sok?${params}`);
      if (!res.ok) {
        setError("Søket feilet. Prøv igjen eller juster søkekriteriene.");
        setResults([]);
        setTotal(0);
        return;
      }
      const data = await res.json();
      setResults(data.results ?? []);
      setTotal(data.total ?? 0);
    } catch {
      setError("Kunne ikke koble til søketjenesten. Sjekk nettverksforbindelsen.");
      setResults([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddLead(result: SearchResult) {
    setAddingOrgNr(result.orgNumber);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result),
      });
      if (res.status === 409) {
        alert("Bedriften er allerede i pipeline");
      }
    } catch {
      console.error("Kunne ikke legge til lead");
    } finally {
      setAddingOrgNr(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text">Søk bedrifter</h1>
        <p className="mt-1 text-text-light">Søk i Brønnøysundregistrene og legg til bedrifter i pipeline.</p>
      </div>

      <Card>
        <SearchFilters onSearch={handleSearch} loading={loading} />
      </Card>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {total > 0 && (
        <p className="text-sm text-text-light">{total} treff totalt</p>
      )}

      <LeadTable results={results} onAddLead={handleAddLead} addingOrgNr={addingOrgNr} />
    </div>
  );
}
