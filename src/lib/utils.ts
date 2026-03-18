export const NACE_CODES: Record<string, string> = {
  "06": "Utvinning av råolje og naturgass",
  "09": "Tjenester tilknyttet utvinning",
  "35": "Elektrisitets-, gass- og varmtvannsforsyning",
  "42": "Anleggsvirksomhet",
  "43": "Spesialisert bygge- og anleggsvirksomhet",
  "62": "Programmering, konsulentvirksomhet og tilknyttet aktivitet",
  "71": "Arkitektvirksomhet og teknisk konsulentvirksomhet",
};

export function formatOrgNumber(orgNr: string): string {
  return orgNr.replace(/(\d{3})(\d{3})(\d{3})/, "$1 $2 $3");
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("nb-NO", { style: "currency", currency: "NOK", maximumFractionDigits: 0 }).format(value);
}
