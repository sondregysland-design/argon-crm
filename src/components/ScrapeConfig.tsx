"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

const KOMMUNER = [
  { value: "", label: "Alle kommuner" },
  { value: "1103", label: "Stavanger" },
  { value: "1101", label: "Eigersund" },
  { value: "1106", label: "Haugesund" },
  { value: "4601", label: "Bergen" },
  { value: "0301", label: "Oslo" },
  { value: "5001", label: "Trondheim" },
];

const NACE = [
  { value: "", label: "Alle bransjer" },
  { value: "06", label: "Utvinning av råolje og naturgass" },
  { value: "09", label: "Tjenester tilknyttet utvinning" },
  { value: "35", label: "Elektrisitetsforsyning" },
  { value: "62", label: "Programmering og konsulentvirksomhet" },
  { value: "71", label: "Arkitektur og teknisk konsulentvirksomhet" },
];

const MAX_LEADS_OPTIONS = [
  { value: "50", label: "50 leads" },
  { value: "100", label: "100 leads" },
  { value: "500", label: "500 leads" },
  { value: "0", label: "Alle" },
];

export interface ScrapeFilters {
  navn: string;
  kommunenummer: string;
  naeringskode: string;
  fraAntallAnsatte: number | undefined;
  tilAntallAnsatte: number | undefined;
  maxLeads: number;
}

interface ScrapeConfigProps {
  onStart: (config: ScrapeFilters) => void;
  disabled: boolean;
}

export function ScrapeConfig({ onStart, disabled }: ScrapeConfigProps) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const fra = fd.get("fraAntallAnsatte") as string;
        const til = fd.get("tilAntallAnsatte") as string;
        onStart({
          navn: fd.get("navn") as string,
          kommunenummer: fd.get("kommunenummer") as string,
          naeringskode: fd.get("naeringskode") as string,
          fraAntallAnsatte: fra ? parseInt(fra) : undefined,
          tilAntallAnsatte: til ? parseInt(til) : undefined,
          maxLeads: parseInt(fd.get("maxLeads") as string),
        });
      }}
      className="space-y-4"
    >
      <div className="flex flex-wrap items-end gap-4">
        <div className="min-w-[200px] flex-1">
          <label className="mb-1 block text-sm font-medium text-text">Bedriftsnavn</label>
          <Input name="navn" placeholder="Valgfritt nøkkelord..." />
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
            {NACE.map((n) => <option key={n.value} value={n.value}>{n.label}</option>)}
          </Select>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <div className="w-36">
          <label className="mb-1 block text-sm font-medium text-text">Min ansatte</label>
          <Input name="fraAntallAnsatte" type="number" placeholder="0" min={0} />
        </div>
        <div className="w-36">
          <label className="mb-1 block text-sm font-medium text-text">Maks ansatte</label>
          <Input name="tilAntallAnsatte" type="number" placeholder="Ingen grense" min={0} />
        </div>
        <div className="w-40">
          <label className="mb-1 block text-sm font-medium text-text">Maks leads</label>
          <Select name="maxLeads" defaultValue="100">
            {MAX_LEADS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </Select>
        </div>
        <Button type="submit" disabled={disabled}>
          {disabled ? "Scraper..." : "Start scraping"}
        </Button>
      </div>
    </form>
  );
}
