import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { quoteItems } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string; itemId: string }> }) {
  const { itemId } = await params;
  await db.delete(quoteItems).where(eq(quoteItems.id, parseInt(itemId)));
  return NextResponse.json({ ok: true });
}
