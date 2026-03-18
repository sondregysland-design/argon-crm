import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { activities } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await db.select().from(activities)
    .where(eq(activities.leadId, parseInt(id)))
    .orderBy(desc(activities.createdAt))
    .all();
  return NextResponse.json(result);
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const result = await db.insert(activities).values({
    leadId: parseInt(id),
    type: body.type ?? "note",
    description: body.description,
    metadata: body.metadata ? JSON.stringify(body.metadata) : null,
  }).returning();

  return NextResponse.json(result[0], { status: 201 });
}
