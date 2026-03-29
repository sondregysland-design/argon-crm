import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { quoteItems } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();

  // Get max sort order
  const maxOrder = await db.select({ max: sql<number>`COALESCE(MAX(sort_order), -1)` })
    .from(quoteItems)
    .where(eq(quoteItems.quoteId, parseInt(id)))
    .get();

  const result = await db.insert(quoteItems).values({
    quoteId: parseInt(id),
    productId: body.productId,
    quantity: body.quantity ?? 1,
    sortOrder: (maxOrder?.max ?? -1) + 1,
  }).returning();

  return NextResponse.json(result[0], { status: 201 });
}
