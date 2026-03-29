import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { emailThreads } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ leadId: string }> }) {
  const { leadId } = await params;
  const threads = await db.select().from(emailThreads)
    .where(eq(emailThreads.leadId, parseInt(leadId)))
    .orderBy(desc(emailThreads.createdAt))
    .all();

  return NextResponse.json(threads);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ leadId: string }> }) {
  const { leadId } = await params;
  const { threadId, autoSend, status } = await request.json();

  const updates: Record<string, unknown> = { updatedAt: new Date().toISOString() };
  if (autoSend !== undefined) updates.autoSend = autoSend ? 1 : 0;
  if (status !== undefined) updates.status = status;

  await db.update(emailThreads)
    .set(updates)
    .where(eq(emailThreads.id, threadId));

  return NextResponse.json({ ok: true });
}
