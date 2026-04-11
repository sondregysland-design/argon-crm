import { NextRequest } from "next/server";
import { searchBrreg, type BrregEnhet } from "@/lib/scrapers/brreg";
import { db } from "@/lib/db";
import { leads, activities } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

function mapEnhetToLead(enhet: BrregEnhet) {
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

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { navn, kommunenummer, naeringskode, fraAntallAnsatte, tilAntallAnsatte, maxLeads } = body;

  // Brønnøysund API krever minst ett hovedfilter
  if (!navn && !kommunenummer && !naeringskode) {
    return new Response(
      JSON.stringify({ error: "Velg minst ett filter: bedriftsnavn, kommune, eller bransje" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      function send(data: object) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      }

      let added = 0;
      let skipped = 0;
      let failed = 0;
      let processed = 0;

      try {
        // First call to get total count
        const firstPage = await searchBrreg({
          navn: navn || undefined,
          kommunenummer: kommunenummer || undefined,
          naeringskode: naeringskode || undefined,
          fraAntallAnsatte: fraAntallAnsatte || undefined,
          tilAntallAnsatte: tilAntallAnsatte || undefined,
          size: 20,
          page: 0,
        });

        const totalElements = firstPage.totalElements;
        const effectiveTotal = maxLeads === 0 ? totalElements : Math.min(maxLeads, totalElements);

        if (effectiveTotal === 0) {
          send({ type: "done", added: 0, skipped: 0, failed: 0, total: 0 });
          controller.close();
          return;
        }

        send({ type: "progress", added, skipped, failed, processed, total: effectiveTotal });

        // Process first page
        for (const enhet of firstPage.enheter) {
          if (processed >= effectiveTotal) break;

          try {
            const mapped = mapEnhetToLead(enhet);
            const existing = await db.select().from(leads).where(eq(leads.orgNumber, mapped.orgNumber)).get();

            if (existing) {
              skipped++;
            } else {
              const [newLead] = await db.insert(leads).values({
                orgNumber: mapped.orgNumber,
                name: mapped.name,
                industryCode: mapped.industryCode,
                industryName: mapped.industryName,
                address: mapped.address,
                postalCode: mapped.postalCode,
                city: mapped.city,
                kommune: mapped.kommune,
                website: mapped.website,
                employees: mapped.employees,
                foundedDate: mapped.foundedDate,
              }).returning();

              await db.insert(activities).values({
                leadId: newLead.id,
                type: "data_enriched",
                description: "Lagt til via auto-scrape",
              });

              added++;
            }
          } catch {
            failed++;
          }

          processed++;
        }

        send({ type: "progress", added, skipped, failed, processed, total: effectiveTotal });

        // Process remaining pages
        const totalPages = Math.ceil(effectiveTotal / 20);

        for (let page = 1; page < totalPages && processed < effectiveTotal; page++) {
          // Rate limit
          await new Promise((r) => setTimeout(r, 300));

          const result = await searchBrreg({
            navn: navn || undefined,
            kommunenummer: kommunenummer || undefined,
            naeringskode: naeringskode || undefined,
            fraAntallAnsatte: fraAntallAnsatte || undefined,
            tilAntallAnsatte: tilAntallAnsatte || undefined,
            size: 20,
            page,
          });

          for (const enhet of result.enheter) {
            if (processed >= effectiveTotal) break;

            try {
              const mapped = mapEnhetToLead(enhet);
              const existing = await db.select().from(leads).where(eq(leads.orgNumber, mapped.orgNumber)).get();

              if (existing) {
                skipped++;
              } else {
                const [newLead] = await db.insert(leads).values({
                  orgNumber: mapped.orgNumber,
                  name: mapped.name,
                  industryCode: mapped.industryCode,
                  industryName: mapped.industryName,
                  address: mapped.address,
                  postalCode: mapped.postalCode,
                  city: mapped.city,
                  kommune: mapped.kommune,
                  website: mapped.website,
                  employees: mapped.employees,
                  foundedDate: mapped.foundedDate,
                }).returning();

                await db.insert(activities).values({
                  leadId: newLead.id,
                  type: "data_enriched",
                  description: "Lagt til via auto-scrape",
                }).run();

                added++;
              }
            } catch {
              failed++;
            }

            processed++;
          }

          send({ type: "progress", added, skipped, failed, processed, total: effectiveTotal });
        }

        send({ type: "done", added, skipped, failed, total: effectiveTotal });
      } catch (error) {
        send({ type: "error", message: error instanceof Error ? error.message : "Ukjent feil" });
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
