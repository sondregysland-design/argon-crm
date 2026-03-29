import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { pendingFollowups, emailThreads, leads, activities } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getGmailClient, sendEmail, calculateNextFollowUp } from "@/lib/gmail";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { action, editedContent } = await request.json();

  const pending = await db.select().from(pendingFollowups)
    .where(eq(pendingFollowups.id, parseInt(id))).get();
  if (!pending) return NextResponse.json({ error: "Ikke funnet" }, { status: 404 });

  if (action === "reject") {
    await db.update(pendingFollowups)
      .set({ status: "rejected" })
      .where(eq(pendingFollowups.id, pending.id));

    await db.update(emailThreads)
      .set({ status: "active", updatedAt: new Date().toISOString() })
      .where(eq(emailThreads.id, pending.emailThreadId));

    return NextResponse.json({ ok: true });
  }

  const thread = await db.select().from(emailThreads)
    .where(eq(emailThreads.id, pending.emailThreadId)).get();
  if (!thread) return NextResponse.json({ error: "Tråd ikke funnet" }, { status: 404 });

  const lead = await db.select().from(leads)
    .where(eq(leads.id, thread.leadId)).get();
  if (!lead?.email) return NextResponse.json({ error: "Lead mangler e-post" }, { status: 400 });

  const content = editedContent ?? pending.generatedContent;
  const gmail = getGmailClient();
  const followUpNumber = thread.followUpCount + 1;

  const result = await sendEmail(gmail, {
    to: lead.email,
    subject: `Re: ${thread.subject}`,
    body: content,
    inReplyTo: thread.gmailMessageId ?? undefined,
    references: thread.gmailMessageId ?? undefined,
    threadId: thread.gmailThreadId ?? undefined,
  });

  await db.update(emailThreads)
    .set({
      gmailMessageId: result.messageId,
      followUpCount: followUpNumber,
      lastEmailContent: content,
      nextFollowUpAt: followUpNumber >= 3 ? null : calculateNextFollowUp(new Date()).toISOString().slice(0, 10),
      status: followUpNumber >= 3 ? "completed" : "active",
      updatedAt: new Date().toISOString(),
    })
    .where(eq(emailThreads.id, thread.id));

  await db.update(pendingFollowups)
    .set({ status: "approved" })
    .where(eq(pendingFollowups.id, pending.id));

  await db.insert(activities).values({
    leadId: thread.leadId,
    type: "email",
    description: `Oppfølging #${followUpNumber} godkjent og sendt`,
  });

  return NextResponse.json({ ok: true, threadId: result.threadId });
}
