import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { leads, activities } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(request: NextRequest) {
  const { leadId, newStage, newOrder } = await request.json();

  const lead = await db.select().from(leads).where(eq(leads.id, leadId)).get();
  if (!lead) return NextResponse.json({ error: "Ikke funnet" }, { status: 404 });

  const oldStage = lead.stage;

  await db.update(leads)
    .set({ stage: newStage, stageOrder: newOrder ?? 0, updatedAt: new Date().toISOString() })
    .where(eq(leads.id, leadId));

  if (oldStage !== newStage) {
    await db.insert(activities).values({
      leadId,
      type: "stage_change",
      description: `${oldStage} → ${newStage}`,
      metadata: JSON.stringify({ from: oldStage, to: newStage }),
    });
  }

  return NextResponse.json({ ok: true });
}
