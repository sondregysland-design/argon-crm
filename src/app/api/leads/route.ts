import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { leads, activities } from "@/lib/db/schema";
import { eq, and, like } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const stage = params.get("stage");
  const kommune = params.get("kommune");
  const industryCode = params.get("industryCode");

  const conditions = [];
  if (stage) conditions.push(eq(leads.stage, stage as "ny" | "kontaktet" | "kvalifisert" | "kunde"));
  if (kommune) conditions.push(like(leads.kommune, `%${kommune}%`));
  if (industryCode) conditions.push(like(leads.industryCode, `${industryCode}%`));

  const result = conditions.length > 0
    ? db.select().from(leads).where(and(...conditions)).orderBy(leads.stageOrder).all()
    : db.select().from(leads).orderBy(leads.stageOrder).all();

  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const existing = db.select().from(leads).where(eq(leads.orgNumber, body.orgNumber)).get();
  if (existing) {
    return NextResponse.json({ error: "Bedriften er allerede i pipeline" }, { status: 409 });
  }

  const [newLead] = db.insert(leads).values({
    orgNumber: body.orgNumber,
    name: body.name,
    industryCode: body.industryCode ?? null,
    industryName: body.industryName ?? null,
    address: body.address ?? null,
    postalCode: body.postalCode ?? null,
    city: body.city ?? null,
    kommune: body.kommune ?? null,
    website: body.website ?? null,
    employees: body.employees ?? null,
    foundedDate: body.foundedDate ?? null,
  }).returning().all();

  db.insert(activities).values({
    leadId: newLead.id,
    type: "stage_change",
    description: "Lagt til i pipeline",
  }).run();

  return NextResponse.json(newLead, { status: 201 });
}
