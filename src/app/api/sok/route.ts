import { NextRequest, NextResponse } from "next/server";
import { searchBrreg, type BrregEnhet } from "@/lib/scrapers/brreg";
import { db } from "@/lib/db";
import { searchCache } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

function mapEnhetToResult(enhet: BrregEnhet) {
  return {
    orgNumber: enhet.organisasjonsnummer,
    name: enhet.navn,
    industryCode: enhet.naeringskode1?.kode ?? null,
    industryName: enhet.naeringskode1?.beskrivelse ?? null,
    address: enhet.forretningsadresse?.adresse?.join(", ") ?? null,
    postalCode: enhet.forretningsadresse?.postnummer ?? null,
    city: enhet.forretningsadresse?.poststed ?? null,
    kommune: enhet.forretningsadresse?.kommune ?? null,
    website: enhet.hjemmeside ?? null,
    employees: enhet.antallAnsatte ?? null,
    foundedDate: enhet.stiftelsesdato ?? enhet.registreringsdatoEnhetsregisteret ?? null,
  };
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const navn = params.get("navn") ?? undefined;
  const kommunenummer = params.get("kommunenummer") ?? undefined;
  const naeringskode = params.get("naeringskode") ?? undefined;
  const page = parseInt(params.get("page") ?? "0");
  const size = parseInt(params.get("size") ?? "20");

  try {
    const result = await searchBrreg({ navn, kommunenummer, naeringskode, size, page });

    // Cache results
    for (const enhet of result.enheter) {
      const existing = db.select().from(searchCache).where(eq(searchCache.orgNumber, enhet.organisasjonsnummer)).get();
      if (!existing) {
        db.insert(searchCache).values({
          orgNumber: enhet.organisasjonsnummer,
          data: JSON.stringify(enhet),
          fetchedAt: new Date().toISOString(),
        }).run();
      }
    }

    return NextResponse.json({
      results: result.enheter.map(mapEnhetToResult),
      total: result.totalElements,
      page,
      size,
    });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ error: "Søk feilet" }, { status: 500 });
  }
}
