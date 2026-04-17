import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { leads } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const numId = parseInt(id);
    if (isNaN(numId)) return NextResponse.json({ error: "Ugyldig ID" }, { status: 400 });

    const lead = await db.select().from(leads).where(eq(leads.id, numId)).get();
    if (!lead) return NextResponse.json({ error: "Ikke funnet" }, { status: 404 });
    return NextResponse.json(lead);
  } catch {
    return NextResponse.json({ error: "Intern feil" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const numId = parseInt(id);
    if (isNaN(numId)) return NextResponse.json({ error: "Ugyldig ID" }, { status: 400 });

    const body = await request.json();
    const result = await db.update(leads)
      .set({ ...body, updatedAt: new Date().toISOString() })
      .where(eq(leads.id, numId))
      .returning();

    if (!result.length) return NextResponse.json({ error: "Ikke funnet" }, { status: 404 });
    return NextResponse.json(result[0]);
  } catch {
    return NextResponse.json({ error: "Intern feil" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const numId = parseInt(id);
    if (isNaN(numId)) return NextResponse.json({ error: "Ugyldig ID" }, { status: 400 });

    await db.delete(leads).where(eq(leads.id, numId));
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Intern feil" }, { status: 500 });
  }
}
