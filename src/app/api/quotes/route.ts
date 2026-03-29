import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { quotes, quoteItems, leads, activities } from "@/lib/db/schema";
import { desc, eq, sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const status = request.nextUrl.searchParams.get("status");
  const leadId = request.nextUrl.searchParams.get("leadId");

  let query = db.select({
    id: quotes.id,
    quoteNumber: quotes.quoteNumber,
    leadId: quotes.leadId,
    leadName: leads.name,
    status: quotes.status,
    notes: quotes.notes,
    createdAt: quotes.createdAt,
    updatedAt: quotes.updatedAt,
  })
    .from(quotes)
    .leftJoin(leads, eq(quotes.leadId, leads.id))
    .orderBy(desc(quotes.createdAt));

  const result = await query.all();

  const filtered = result.filter((q) => {
    if (status && q.status !== status) return false;
    if (leadId && q.leadId !== parseInt(leadId)) return false;
    return true;
  });

  return NextResponse.json(filtered);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

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
    leadId: body.leadId ?? null,
    notes: body.notes ?? null,
  }).returning();

  const quote = newQuote[0];

  // Insert items if provided
  if (body.items?.length) {
    for (let i = 0; i < body.items.length; i++) {
      await db.insert(quoteItems).values({
        quoteId: quote.id,
        productId: body.items[i].productId,
        quantity: body.items[i].quantity ?? 1,
        sortOrder: i,
      });
    }
  }

  // Log activity if linked to a lead
  if (quote.leadId) {
    await db.insert(activities).values({
      leadId: quote.leadId,
      type: "quote",
      description: `Tilbud ${quoteNumber} opprettet`,
    });
  }

  return NextResponse.json(quote, { status: 201 });
}
