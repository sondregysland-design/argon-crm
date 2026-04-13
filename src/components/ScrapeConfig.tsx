"use client";

import { Button } from "@/components/ui/Button";
import { Combobox } from "@/components/ui/Combobox";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { KOMMUNER, NACE_CODES } from "@/lib/constants";

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

const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

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
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:gap-4">
        <div className="w-full sm:min-w-[200px] sm:flex-1">
          <label className="mb-1 block text-sm font-medium text-text">Bedriftsnavn</label>
          <Input name="navn" placeholder="Valgfritt nøkkelord..." />
        </div>
        <div className="w-full sm:w-48">
          <label className="mb-1 block text-sm font-medium text-text">Kommune</label>
          <Select name="kommunenummer">
            {KOMMUNER.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
          </Select>
        </div>
        <div className="w-full sm:w-64">
          <label className="mb-1 block text-sm font-medium text-text">Bransje (NACE)</label>
          <Combobox name="naeringskode" options={NACE_CODES} placeholder="Søk bransje..." />
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:gap-4">
        <div className="grid grid-cols-2 gap-3 sm:contents">
          <div className="w-full sm:w-36">
            <label className="mb-1 block text-sm font-medium text-text">Min ansatte</label>
            <Input name="fraAntallAnsatte" type="number" placeholder="0" min={0} />
          </div>
          <div className="w-full sm:w-36">
            <label className="mb-1 block text-sm font-medium text-text">Maks ansatte</label>
            <Input name="tilAntallAnsatte" type="number" placeholder="Ingen grense" min={0} />
          </div>
        </div>
        <div className="w-full sm:w-40">
          <label className="mb-1 block text-sm font-medium text-text">Maks leads</label>
          <Select name="maxLeads" defaultValue="100">
            {MAX_LEADS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </Select>
        </div>
        <Button type="submit" disabled={disabled || isDemo} className="w-full sm:w-auto">
          {disabled ? "Scraper..." : "Start scraping"}
        </Button>
      </div>

      {isDemo && (
        <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4">
          <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-blue-800">
            Scraping-funksjonen er skrudd av for demobruk. Ønsker du en demonstrasjon? Ta kontakt med en av våre kunderepresentanter.
          </p>
        </div>
      )}
    </form>
  );
}
