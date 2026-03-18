import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { leads } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lead = db.select().from(leads).where(eq(leads.id, parseInt(id))).get();
  if (!lead) return NextResponse.json({ error: "Ikke funnet" }, { status: 404 });
  return NextResponse.json(lead);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const updated = db.update(leads)
    .set({ ...body, updatedAt: new Date().toISOString() })
    .where(eq(leads.id, parseInt(id)))
    .returning()
    .get();

  if (!updated) return NextResponse.json({ error: "Ikke funnet" }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  db.delete(leads).where(eq(leads.id, parseInt(id))).run();
  return NextResponse.json({ ok: true });
}
