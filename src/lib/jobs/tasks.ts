import { db } from "@/lib/db";
import { leads, scrapeJobs, activities } from "@/lib/db/schema";
import { eq, isNull } from "drizzle-orm";
import { fetchEnhet } from "@/lib/scrapers/brreg";
import { searchPlace, getPlaceDetails } from "@/lib/scrapers/google-places";
import { scrapeWebsite } from "@/lib/scrapers/email-scraper";
import Anthropic from "@anthropic-ai/sdk";

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

interface LeadSummaries {
  short: string | null;
  detailed: string | null;
}

async function generateLeadSummaries(name: string, industryName: string | null, websiteText: string | null, city: string | null): Promise<LeadSummaries> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return { short: null, detailed: null };

  const context = [
    `Firma: ${name}`,
    industryName ? `Bransje: ${industryName}` : null,
    city ? `By: ${city}` : null,
    websiteText ? `Nettside-info: ${websiteText.slice(0, 500)}` : null,
  ].filter(Boolean).join("\n");

  try {
    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
      system: `Du er en salgsassistent. Returner JSON med to felter:
- "short": En kort beskrivelse (maks 80 tegn, 1 setning) av hva bedriften gjør. For dashboard-oversikt.
- "detailed": En detaljert salgsbeskrivelse (3-4 setninger) som beskriver tjenester, spesialiteter og hva som gjør bedriften relevant som kunde. Inkluder konkrete detaljer fra nettsiden.
Skriv på norsk. Ikke inkluder firmanavn eller by. Returner KUN gyldig JSON.`,
      messages: [{ role: "user", content: context }],
    });
    const text = response.content[0];
    if (text.type === "text") {
      const parsed = JSON.parse(text.text.trim());
      return { short: parsed.short ?? null, detailed: parsed.detailed ?? null };
    }
    return { short: null, detailed: null };
  } catch (e) {
    console.error(`[GoogleEnrich] AI summary failed for ${name}:`, e);
    return { short: null, detailed: null };
  }
}

export async function runGoogleEnrich() {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    console.error("[GoogleEnrich] GOOGLE_PLACES_API_KEY is not set");
    return;
  }

  const job = await db.select().from(scrapeJobs).where(eq(scrapeJobs.name, "google_enrich")).get();
  if (!job) return;

  await db.update(scrapeJobs).set({ status: "running" }).where(eq(scrapeJobs.id, job.id));

  try {
    const staleLeads = await db.select().from(leads).where(isNull(leads.googleSyncedAt)).all();
    let processed = 0;

    for (const lead of staleLeads) {
      try {
        if (!lead.city) {
          await db.update(leads).set({
            googleSyncedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }).where(eq(leads.id, lead.id));
          continue;
        }

        const placeId = await searchPlace(lead.name, lead.city);

        if (!placeId) {
          await db.update(leads).set({
            googleSyncedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }).where(eq(leads.id, lead.id));
          continue;
        }

        const details = await getPlaceDetails(placeId);

        // Scrape website for email and company description
        let scrapedEmail: string | null = null;
        let scrapedDescription: string | null = null;
        const siteUrl = details?.website ?? lead.website;
        if (siteUrl) {
          try {
            const scrapeResult = await scrapeWebsite(siteUrl);
            if (!lead.email) scrapedEmail = scrapeResult.email;
            if (!lead.notes) scrapedDescription = scrapeResult.description;
          } catch (e) {
            console.error(`[GoogleEnrich] Website scrape failed for ${siteUrl}:`, e);
          }
        }

        // Generate AI summaries (short + detailed)
        let aiShort: string | null = null;
        let aiDetailed: string | null = null;
        if (!lead.summary || !lead.detailedSummary) {
          const summaries = await generateLeadSummaries(
            lead.name,
            lead.industryName,
            scrapedDescription,
            lead.city
          );
          if (!lead.summary) aiShort = summaries.short;
          if (!lead.detailedSummary) aiDetailed = summaries.detailed;
        }

        await db.update(leads).set({
          googleRating: details?.rating ?? null,
          googleReviewsCount: details?.reviewCount ?? null,
          googlePhone: details?.phone ?? null,
          googleWebsite: details?.website ?? null,
          email: scrapedEmail ?? lead.email,
          notes: scrapedDescription ?? lead.notes,
          summary: aiShort ?? lead.summary,
          detailedSummary: aiDetailed ?? lead.detailedSummary,
          googleSyncedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }).where(eq(leads.id, lead.id));

        if (details) {
          const parts = ["Google Places-data hentet"];
          if (scrapedEmail) parts.push(`e-post: ${scrapedEmail}`);
          if (scrapedDescription) parts.push("bedriftsbeskrivelse hentet");
          if (aiShort || aiDetailed) parts.push("AI-beskrivelse generert");
          await db.insert(activities).values({
            leadId: lead.id,
            type: "data_enriched",
            description: parts.join(" + "),
          });
          processed++;
        }

        await new Promise((r) => setTimeout(r, 300));
      } catch (leadError) {
        console.error(`[GoogleEnrich] Error enriching lead ${lead.id}:`, leadError);
        continue;
      }
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
