import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { leads } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lead = await db.select().from(leads).where(eq(leads.id, parseInt(id))).get();
  if (!lead) return NextResponse.json({ error: "Ikke funnet" }, { status: 404 });
  return NextResponse.json(lead);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const result = await db.update(leads)
    .set({ ...body, updatedAt: new Date().toISOString() })
    .where(eq(leads.id, parseInt(id)))
    .returning();

  if (!result.length) return NextResponse.json({ error: "Ikke funnet" }, { status: 404 });
  return NextResponse.json(result[0]);
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await db.delete(leads).where(eq(leads.id, parseInt(id)));
  return NextResponse.json({ ok: true });
}
