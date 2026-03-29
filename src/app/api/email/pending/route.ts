import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { pendingFollowups, emailThreads, leads } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const pending = await db.select({
    id: pendingFollowups.id,
    generatedContent: pendingFollowups.generatedContent,
    status: pendingFollowups.status,
    createdAt: pendingFollowups.createdAt,
    threadId: emailThreads.id,
    gmailThreadId: emailThreads.gmailThreadId,
    subject: emailThreads.subject,
    followUpCount: emailThreads.followUpCount,
    leadId: leads.id,
    leadName: leads.name,
    contactPerson: leads.contactPerson,
    email: leads.email,
  })
    .from(pendingFollowups)
    .innerJoin(emailThreads, eq(pendingFollowups.emailThreadId, emailThreads.id))
    .innerJoin(leads, eq(emailThreads.leadId, leads.id))
    .where(eq(pendingFollowups.status, "pending"))
    .all();

  return NextResponse.json(pending);
}
