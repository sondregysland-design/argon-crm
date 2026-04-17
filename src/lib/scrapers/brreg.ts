const BASE_URL = "https://data.brreg.no/enhetsregisteret/api";

export interface BrregEnhet {
  organisasjonsnummer: string;
  navn: string;
  organisasjonsform?: { kode: string; beskrivelse: string };
  naeringskode1?: { kode: string; beskrivelse: string };
  forretningsadresse?: {
    adresse?: string[];
    postnummer?: string;
    poststed?: string;
    kommunenummer?: string;
    kommune?: string;
    land?: string;
  };
  hjemmeside?: string;
  antallAnsatte?: number;
  registreringsdatoEnhetsregisteret?: string;
  stiftelsesdato?: string;
}

interface BrregSearchResponse {
  _embedded?: { enheter: BrregEnhet[] };
  page: { size: number; totalElements: number; totalPages: number; number: number };
}

export async function searchBrreg(params: {
  navn?: string;
  kommunenummer?: string;
  naeringskode?: string;
  fraAntallAnsatte?: number;
  tilAntallAnsatte?: number;
  size?: number;
  page?: number;
}): Promise<{ enheter: BrregEnhet[]; totalElements: number }> {
  const url = new URL(`${BASE_URL}/enheter`);

  if (params.navn) url.searchParams.set("navn", params.navn);
  if (params.kommunenummer) url.searchParams.set("kommunenummer", params.kommunenummer);
  if (params.naeringskode) url.searchParams.set("naeringskode", params.naeringskode);
  // Brønnøysund API personvernkrav: kan ikke søke mellom 1-4 ansatte
  // fraAntallAnsatte 1-4 justeres opp til 5 automatisk
  if (params.fraAntallAnsatte) {
    const fra = params.fraAntallAnsatte >= 1 && params.fraAntallAnsatte <= 4 ? 5 : params.fraAntallAnsatte;
    url.searchParams.set("fraAntallAnsatte", String(fra));
  }
  if (params.tilAntallAnsatte) url.searchParams.set("tilAntallAnsatte", String(params.tilAntallAnsatte));
  url.searchParams.set("size", String(params.size ?? 20));
  url.searchParams.set("page", String(params.page ?? 0));

  const res = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => null);
    const detail = errorBody?.valideringsfeil?.[0]?.feilmelding;
    throw new Error(detail ?? `Brønnøysund API error: ${res.status} ${res.statusText}`);
  }

  const data: BrregSearchResponse = await res.json();
  return {
    enheter: data._embedded?.enheter ?? [],
    totalElements: data.page.totalElements,
  };
}

export async function fetchEnhet(orgNr: string): Promise<BrregEnhet | null> {
  const res = await fetch(`${BASE_URL}/enheter/${orgNr}`, {
    headers: { Accept: "application/json" },
  });

  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Brønnøysund API error: ${res.status}`);

  return res.json();
}
