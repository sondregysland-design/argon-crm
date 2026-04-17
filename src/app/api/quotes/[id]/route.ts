import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { quotes, quoteItems, products, leads, activities } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const numId = parseInt(id);
    if (isNaN(numId)) return NextResponse.json({ error: "Ugyldig ID" }, { status: 400 });

    const quote = await db.select().from(quotes).where(eq(quotes.id, numId)).get();
    if (!quote) return NextResponse.json({ error: "Ikke funnet" }, { status: 404 });

    const items = await db.select({
      id: quoteItems.id,
      quoteId: quoteItems.quoteId,
      productId: quoteItems.productId,
      quantity: quoteItems.quantity,
      sortOrder: quoteItems.sortOrder,
      productName: products.name,
      productDescription: products.description,
      productUnit: products.unit,
    })
      .from(quoteItems)
      .leftJoin(products, eq(quoteItems.productId, products.id))
      .where(eq(quoteItems.quoteId, quote.id))
      .orderBy(quoteItems.sortOrder)
      .all();

    let lead = null;
    if (quote.leadId) {
      lead = await db.select().from(leads).where(eq(leads.id, quote.leadId)).get();
    }

    return NextResponse.json({ ...quote, items, lead });
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
    const existing = await db.select().from(quotes).where(eq(quotes.id, numId)).get();
    if (!existing) return NextResponse.json({ error: "Ikke funnet" }, { status: 404 });

    const result = await db.update(quotes)
      .set({ ...body, updatedAt: new Date().toISOString() })
      .where(eq(quotes.id, numId))
      .returning();

    if (body.status && body.status !== existing.status && existing.leadId) {
      const statusLabel: Record<string, string> = {
        sendt: "merket som sendt",
        akseptert: "akseptert",
        avvist: "avvist",
      };
      await db.insert(activities).values({
        leadId: existing.leadId,
        type: "quote",
        description: `Tilbud ${existing.quoteNumber} ${statusLabel[body.status] ?? body.status}`,
      });
    }

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

    await db.delete(quotes).where(eq(quotes.id, numId));
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Intern feil" }, { status: 500 });
  }
}
