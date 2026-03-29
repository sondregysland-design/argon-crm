import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  emailThreads,
  pendingFollowups,
  leads,
  activities,
} from "@/lib/db/schema";
import { eq, and, lte, lt } from "drizzle-orm";
import {
  getGmailClient,
  sendEmail,
  checkForReplies,
  calculateNextFollowUp,
} from "@/lib/gmail";
import { buildFollowUpPrompt, generateEmail } from "@/lib/email-generator";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date();
  const dayOfWeek = today.getDay();
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return NextResponse.json({ message: "Weekend — skipping", processed: 0 });
  }

  const todayStr = today.toISOString().slice(0, 10);

  const dueThreads = await db
    .select()
    .from(emailThreads)
    .where(
      and(
        eq(emailThreads.status, "active"),
        lte(emailThreads.nextFollowUpAt, todayStr),
        lt(emailThreads.followUpCount, 3)
      )
    )
    .all();

  const gmail = getGmailClient();
  let processed = 0;

  for (const thread of dueThreads) {
    if (thread.gmailThreadId && thread.gmailMessageId) {
      const hasReply = await checkForReplies(
        gmail,
        thread.gmailThreadId,
        thread.gmailMessageId
      );
      if (hasReply) {
        await db
          .update(emailThreads)
          .set({ status: "replied", updatedAt: new Date().toISOString() })
          .where(eq(emailThreads.id, thread.id));

        await db.insert(activities).values({
          leadId: thread.leadId,
          type: "email",
          description: "Svar mottatt — oppfølging stoppet",
        });
        processed++;
        continue;
      }
    }

    const lead = await db
      .select()
      .from(leads)
      .where(eq(leads.id, thread.leadId))
      .get();
    if (!lead) continue;

    const followUpNumber = thread.followUpCount + 1;
    const prompt = buildFollowUpPrompt(
      lead,
      thread.lastEmailContent ?? "",
      followUpNumber
    );
    const content = await generateEmail(prompt);

    if (thread.autoSend) {
      const result = await sendEmail(gmail, {
        to: lead.email!,
        subject: `Re: ${thread.subject}`,
        body: content,
        inReplyTo: thread.gmailMessageId ?? undefined,
        references: thread.gmailMessageId ?? undefined,
        threadId: thread.gmailThreadId ?? undefined,
      });

      await db
        .update(emailThreads)
        .set({
          gmailMessageId: result.messageId,
          followUpCount: followUpNumber,
          lastEmailContent: content,
          nextFollowUpAt:
            followUpNumber >= 3
              ? null
              : calculateNextFollowUp(new Date()).toISOString().slice(0, 10),
          status: followUpNumber >= 3 ? "completed" : "active",
          updatedAt: new Date().toISOString(),
        })
        .where(eq(emailThreads.id, thread.id));

      await db.insert(activities).values({
        leadId: thread.leadId,
        type: "email",
        description: `Automatisk oppfølging #${followUpNumber} sendt`,
      });
    } else {
      await db.insert(pendingFollowups).values({
        emailThreadId: thread.id,
        generatedContent: content,
      });

      await db
        .update(emailThreads)
        .set({ status: "paused", updatedAt: new Date().toISOString() })
        .where(eq(emailThreads.id, thread.id));
    }

    processed++;
  }

  return NextResponse.json({ message: "Follow-up cron complete", processed });
}
