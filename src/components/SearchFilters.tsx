"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { KOMMUNER, NACE_CODES } from "@/lib/constants";

interface SearchFiltersProps {
  onSearch: (filters: { navn: string; kommunenummer: string; naeringskode: string }) => void;
  loading: boolean;
}

export function SearchFilters({ onSearch, loading }: SearchFiltersProps) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        onSearch({
          navn: fd.get("navn") as string,
          kommunenummer: fd.get("kommunenummer") as string,
          naeringskode: fd.get("naeringskode") as string,
        });
      }}
      className="flex flex-wrap items-end gap-4"
    >
      <div className="min-w-[200px] flex-1">
        <label className="mb-1 block text-sm font-medium text-text">Bedriftsnavn</label>
        <Input name="navn" placeholder="Søk etter navn..." />
      </div>
      <div className="w-48">
        <label className="mb-1 block text-sm font-medium text-text">Kommune</label>
        <Select name="kommunenummer">
          {KOMMUNER.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
        </Select>
      </div>
      <div className="w-64">
        <label className="mb-1 block text-sm font-medium text-text">Bransje (NACE)</label>
        <Select name="naeringskode">
          {NACE_CODES.map((n) => <option key={n.value} value={n.value}>{n.label}</option>)}
        </Select>
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? "Søker..." : "Søk"}
      </Button>
    </form>
  );
}
