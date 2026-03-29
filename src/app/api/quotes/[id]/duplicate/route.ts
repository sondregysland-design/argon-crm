import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { quotes, quoteItems } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const original = await db.select().from(quotes).where(eq(quotes.id, parseInt(id))).get();
  if (!original) return NextResponse.json({ error: "Ikke funnet" }, { status: 404 });

  const originalItems = await db.select().from(quoteItems)
    .where(eq(quoteItems.quoteId, original.id))
    .orderBy(quoteItems.sortOrder)
    .all();

  // Generate next quote number
  const lastQuote = await db.select({ quoteNumber: quotes.quoteNumber })
    .from(quotes)
    .orderBy(desc(quotes.id))
    .limit(1)
    .get();

  let nextNum = 1;
  if (lastQuote) {
    const match = lastQuote.quoteNumber.match(/QT-(\d+)/);
    if (match) nextNum = parseInt(match[1]) + 1;
  }
  const quoteNumber = `QT-${String(nextNum).padStart(3, "0")}`;

  const newQuote = await db.insert(quotes).values({
    quoteNumber,
    leadId: original.leadId,
    status: "utkast",
    notes: original.notes,
  }).returning();

  for (let i = 0; i < originalItems.length; i++) {
    await db.insert(quoteItems).values({
      quoteId: newQuote[0].id,
      productId: originalItems[i].productId,
      quantity: originalItems[i].quantity,
      sortOrder: originalItems[i].sortOrder,
    });
  }

  return NextResponse.json(newQuote[0], { status: 201 });
}
