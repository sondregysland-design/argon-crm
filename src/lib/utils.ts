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

const WEEKDAYS: Record<string, string> = {
  "0": "søndager", "1": "mandager", "2": "tirsdager", "3": "onsdager",
  "4": "torsdager", "5": "fredager", "6": "lørdager", "7": "søndager",
};

export function cronToHuman(cron: string): string {
  const parts = cron.trim().split(/\s+/);
  if (parts.length !== 5) return cron;
  const [minute, hour, dayOfMonth, , dayOfWeek] = parts;

  const time = `${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`;

  if (dayOfWeek !== "*" && dayOfMonth === "*") {
    return `Hver ${WEEKDAYS[dayOfWeek] ?? `dag ${dayOfWeek}`} kl. ${time}`;
  }
  if (dayOfMonth !== "*") {
    return `Den ${dayOfMonth}. hver måned kl. ${time}`;
  }
  return `Daglig kl. ${time}`;
}
