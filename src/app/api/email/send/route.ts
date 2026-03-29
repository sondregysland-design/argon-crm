import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { leads, emailThreads, activities } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getGmailClient, sendEmail, calculateNextFollowUp } from "@/lib/gmail";

export async function POST(request: NextRequest) {
  const { leadId, content, subject, threadId, inReplyTo, references } = await request.json();

  const lead = await db.select().from(leads).where(eq(leads.id, leadId)).get();
  if (!lead) return NextResponse.json({ error: "Lead ikke funnet" }, { status: 404 });
  if (!lead.email) return NextResponse.json({ error: "Lead mangler e-postadresse" }, { status: 400 });

  const gmail = getGmailClient();
  const isFollowUp = !!threadId;

  const result = await sendEmail(gmail, {
    to: lead.email,
    subject: isFollowUp ? `Re: ${subject}` : subject,
    body: content,
    inReplyTo,
    references,
    threadId,
  });

  if (isFollowUp) {
    const existingThread = await db.select().from(emailThreads)
      .where(eq(emailThreads.gmailThreadId, threadId)).get();
    if (existingThread) {
      const newCount = existingThread.followUpCount + 1;
      await db.update(emailThreads)
        .set({
          gmailMessageId: result.messageId,
          followUpCount: newCount,
          lastEmailContent: content,
          nextFollowUpAt: newCount >= 3 ? null : calculateNextFollowUp(new Date()).toISOString().slice(0, 10),
          status: newCount >= 3 ? "completed" : "active",
          updatedAt: new Date().toISOString(),
        })
        .where(eq(emailThreads.id, existingThread.id));
    }
  } else {
    await db.insert(emailThreads).values({
      leadId: lead.id,
      gmailThreadId: result.threadId,
      gmailMessageId: result.messageId,
      subject,
      lastEmailContent: content,
      nextFollowUpAt: calculateNextFollowUp(new Date()).toISOString().slice(0, 10),
    });
  }

  await db.insert(activities).values({
    leadId: lead.id,
    type: "email",
    description: isFollowUp ? `Oppfølgingsmail sendt` : `E-post sendt: ${subject}`,
  });

  return NextResponse.json({ threadId: result.threadId, messageId: result.messageId });
}
