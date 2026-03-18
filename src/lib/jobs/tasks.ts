import { db } from "@/lib/db";
import { leads, scrapeJobs } from "@/lib/db/schema";
import { eq, isNull } from "drizzle-orm";
import { fetchEnhet } from "@/lib/scrapers/brreg";

export async function runBrregSync() {
  const job = await db.select().from(scrapeJobs).where(eq(scrapeJobs.name, "brreg_sync")).get();
  if (!job) return;

  await db.update(scrapeJobs).set({ status: "running" }).where(eq(scrapeJobs.id, job.id));

  try {
    const staleLeads = await db.select().from(leads).where(isNull(leads.brregSyncedAt)).all();
    let processed = 0;

    for (const lead of staleLeads) {
      const enhet = await fetchEnhet(lead.orgNumber);
      if (enhet) {
        await db.update(leads).set({
          name: enhet.navn,
          industryCode: enhet.naeringskode1?.kode ?? lead.industryCode,
          industryName: enhet.naeringskode1?.beskrivelse ?? lead.industryName,
          address: enhet.forretningsadresse?.adresse?.join(", ") ?? lead.address,
          postalCode: enhet.forretningsadresse?.postnummer ?? lead.postalCode,
          city: enhet.forretningsadresse?.poststed ?? lead.city,
          kommune: enhet.forretningsadresse?.kommune ?? lead.kommune,
          employees: enhet.antallAnsatte ?? lead.employees,
          brregSyncedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }).where(eq(leads.id, lead.id));
        processed++;
      }
      await new Promise((r) => setTimeout(r, 200));
    }

    await db.update(scrapeJobs).set({
      status: "success",
      lastRunAt: new Date().toISOString(),
      recordsProcessed: processed,
      lastError: null,
    }).where(eq(scrapeJobs.id, job.id));
  } catch (error) {
    await db.update(scrapeJobs).set({
      status: "failed",
      lastRunAt: new Date().toISOString(),
      lastError: error instanceof Error ? error.message : "Unknown error",
    }).where(eq(scrapeJobs.id, job.id));
  }
}
