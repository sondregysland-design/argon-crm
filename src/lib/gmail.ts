import { google, gmail_v1 } from "googleapis";

export function getGmailClient(): gmail_v1.Gmail {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET
  );
  oauth2Client.setCredentials({
    refresh_token: process.env.GMAIL_REFRESH_TOKEN,
  });
  return google.gmail({ version: "v1", auth: oauth2Client });
}

interface EmailOptions {
  to: string;
  subject: string;
  body: string;
  inReplyTo?: string;
  references?: string;
}

export function buildRawEmail(opts: EmailOptions): string {
  const lines = [
    `To: ${opts.to}`,
    `Subject: ${opts.subject}`,
    `Content-Type: text/plain; charset=utf-8`,
  ];
  if (opts.inReplyTo) lines.push(`In-Reply-To: ${opts.inReplyTo}`);
  if (opts.references) lines.push(`References: ${opts.references}`);
  lines.push("", opts.body);
  return Buffer.from(lines.join("\r\n")).toString("base64url");
}

export async function sendEmail(
  gmail: gmail_v1.Gmail,
  opts: EmailOptions & { threadId?: string }
): Promise<{ threadId: string; messageId: string }> {
  const raw = buildRawEmail(opts);
  const res = await gmail.users.messages.send({
    userId: "me",
    requestBody: {
      raw,
      threadId: opts.threadId,
    },
  });

  const sentMsg = await gmail.users.messages.get({
    userId: "me",
    id: res.data.id!,
    format: "metadata",
    metadataHeaders: ["Message-ID"],
  });

  const messageId =
    sentMsg.data.payload?.headers?.find((h) => h.name === "Message-ID")
      ?.value ?? "";

  return {
    threadId: res.data.threadId!,
    messageId,
  };
}

export async function checkForReplies(
  gmail: gmail_v1.Gmail,
  threadId: string,
  afterMessageId: string
): Promise<boolean> {
  const thread = await gmail.users.threads.get({
    userId: "me",
    id: threadId,
    format: "metadata",
    metadataHeaders: ["From"],
  });

  const messages = thread.data.messages ?? [];
  let foundOurMessage = false;
  for (const msg of messages) {
    if (msg.id === afterMessageId) {
      foundOurMessage = true;
      continue;
    }
    if (foundOurMessage) {
      return true;
    }
  }
  return false;
}

export function calculateNextFollowUp(fromDate: Date): Date {
  const next = new Date(fromDate);
  next.setDate(next.getDate() + 5);
  const day = next.getDay();
  if (day === 6) next.setDate(next.getDate() + 2); // Saturday → Monday
  if (day === 0) next.setDate(next.getDate() + 1); // Sunday → Monday
  return next;
}
