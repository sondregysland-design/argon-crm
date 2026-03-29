import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { leads } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { buildInitialEmailPrompt, buildFollowUpPrompt, generateEmail } from "@/lib/email-generator";

export async function POST(request: NextRequest) {
  const { leadId, type, previousEmail, followUpNumber } = await request.json();

  const lead = await db.select().from(leads).where(eq(leads.id, leadId)).get();
  if (!lead) return NextResponse.json({ error: "Lead ikke funnet" }, { status: 404 });
  if (!lead.email) return NextResponse.json({ error: "Lead mangler e-postadresse" }, { status: 400 });

  const prompt = type === "followup"
    ? buildFollowUpPrompt(lead, previousEmail, followUpNumber)
    : buildInitialEmailPrompt(lead);

  const content = await generateEmail(prompt);

  const subject = type === "followup"
    ? undefined
    : `Argon Solutions — ${lead.projectType ?? "samarbeid"}`;

  return NextResponse.json({ content, subject });
}
