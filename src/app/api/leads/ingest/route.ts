import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { leads, activities } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { searchBrreg } from "@/lib/scrapers/brreg";

export async function POST(request: NextRequest) {
  try {
  let body: {
    name: string;
    email: string;
    company?: string;
    message?: string;
    source: "calendar" | "contact-form" | "manual";
    metadata?: {
      bookingDate?: string;
      bookingTime?: string;
      topic?: string;
    };
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ugyldig forespørsel" }, { status: 400 });
  }

  if (!body.name || !body.email || !body.source) {
    return NextResponse.json(
      { error: "name, email og source er påkrevd" },
      { status: 400 }
    );
  }

  // 1. Check for existing lead by email
  const existing = await db
    .select()
    .from(leads)
    .where(eq(leads.email, body.email))
    .get();

  if (existing) {
    const updates: Record<string, string> = {
      updatedAt: new Date().toISOString(),
    };
    if (!existing.contactPerson && body.name) {
      updates.contactPerson = body.name;
    }

    if (Object.keys(updates).length > 1) {
      await db.update(leads).set(updates).where(eq(leads.id, existing.id));
    }

    const activityDesc =
      body.source === "calendar"
        ? `Booket møte via kalender${body.metadata?.topic ? `: ${body.metadata.topic}` : ""}`
        : `Ny henvendelse via kontaktskjema${body.message ? `: ${body.message.slice(0, 200)}` : ""}`;

    await db.insert(activities).values({
      leadId: existing.id,
      type: body.source === "calendar" ? "call" : "note",
      description: activityDesc,
      metadata: body.metadata ? JSON.stringify(body.metadata) : null,
    });

    return NextResponse.json({
      lead: { ...existing, ...updates },
      action: "updated",
      activityAdded: true,
    });
  }

  // 2. Try Brønnøysund lookup by email domain
  let brregData: {
    orgNumber?: string;
    companyName?: string;
    industryCode?: string;
    industryName?: string;
    address?: string;
    postalCode?: string;
    city?: string;
    kommune?: string;
    website?: string;
    employees?: number;
    foundedDate?: string;
  } = {};

  try {
    const domain = body.email.split("@")[1];
    if (domain && !["gmail.com", "hotmail.com", "outlook.com", "yahoo.com", "icloud.com", "live.no", "online.no"].includes(domain)) {
      const domainName = domain.split(".")[0];
      const result = await searchBrreg({ navn: domainName, size: 5 });

      if (result.enheter && result.enheter.length > 0) {
        const best = result.enheter[0];
        brregData = {
          orgNumber: best.organisasjonsnummer,
          companyName: best.navn,
          industryCode: best.naeringskode1?.kode ?? undefined,
          industryName: best.naeringskode1?.beskrivelse ?? undefined,
          address: best.forretningsadresse?.adresse?.join(", ") ?? undefined,
          postalCode: best.forretningsadresse?.postnummer ?? undefined,
          city: best.forretningsadresse?.poststed ?? undefined,
          kommune: best.forretningsadresse?.kommune ?? undefined,
          website: best.hjemmeside ?? undefined,
          employees: best.antallAnsatte ?? undefined,
          foundedDate: best.stiftelsesdato ?? undefined,
        };
      }
    }
  } catch (error) {
    console.error("Brønnøysund lookup failed (continuing without):", error);
  }

  // 3. Create new lead
  const orgNumber = brregData.orgNumber || `INGEST-${Date.now()}`;
  const companyName = body.company || brregData.companyName || body.name;

  // Check orgNumber doesn't already exist (Brønnøysund match to existing lead)
  const orgExists = await db
    .select()
    .from(leads)
    .where(eq(leads.orgNumber, orgNumber))
    .get();

  if (orgExists) {
    const updates: Record<string, string> = {
      updatedAt: new Date().toISOString(),
    };
    if (!orgExists.email) updates.email = body.email;
    if (!orgExists.contactPerson) updates.contactPerson = body.name;
    if (!orgExists.source) updates.source = body.source;

    await db.update(leads).set(updates).where(eq(leads.id, orgExists.id));

    const activityDesc =
      body.source === "calendar"
        ? `Booket møte via kalender${body.metadata?.topic ? `: ${body.metadata.topic}` : ""}`
        : `Ny henvendelse via kontaktskjema${body.message ? `: ${body.message.slice(0, 200)}` : ""}`;

    await db.insert(activities).values({
      leadId: orgExists.id,
      type: body.source === "calendar" ? "call" : "note",
      description: activityDesc,
      metadata: body.metadata ? JSON.stringify(body.metadata) : null,
    });

    return NextResponse.json({
      lead: { ...orgExists, ...updates },
      action: "updated",
      activityAdded: true,
    });
  }

  const result = await db
    .insert(leads)
    .values({
      orgNumber,
      name: companyName,
      email: body.email,
      contactPerson: body.name,
      source: body.source,
      industryCode: brregData.industryCode ?? null,
      industryName: brregData.industryName ?? null,
      address: brregData.address ?? null,
      postalCode: brregData.postalCode ?? null,
      city: brregData.city ?? null,
      kommune: brregData.kommune ?? null,
      website: brregData.website ?? null,
      employees: brregData.employees ?? null,
      foundedDate: brregData.foundedDate ?? null,
      notes: body.message ?? null,
    })
    .returning();

  const newLead = result[0];

  const activityDesc =
    body.source === "calendar"
      ? `Lead opprettet fra kalenderbooking${body.metadata?.topic ? `: ${body.metadata.topic}` : ""}`
      : `Lead opprettet fra kontaktskjema${body.message ? `: ${body.message.slice(0, 200)}` : ""}`;

  await db.insert(activities).values({
    leadId: newLead.id,
    type: "stage_change",
    description: activityDesc,
    metadata: body.metadata ? JSON.stringify(body.metadata) : null,
  });

  return NextResponse.json(
    { lead: newLead, action: "created", enriched: !!brregData.orgNumber },
    { status: 201 }
  );
  } catch (error) {
    console.error("Ingest error:", error);
    return NextResponse.json(
      { error: "Intern feil", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
