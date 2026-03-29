import { describe, it, expect } from "vitest";
import { emailThreads, pendingFollowups } from "../db/schema";

describe("email schema", () => {
  it("emailThreads table has required columns", () => {
    const cols = Object.keys(emailThreads);
    expect(cols).toContain("id");
    expect(cols).toContain("leadId");
    expect(cols).toContain("gmailThreadId");
    expect(cols).toContain("gmailMessageId");
    expect(cols).toContain("subject");
    expect(cols).toContain("followUpCount");
    expect(cols).toContain("nextFollowUpAt");
    expect(cols).toContain("autoSend");
    expect(cols).toContain("status");
    expect(cols).toContain("lastEmailContent");
  });

  it("pendingFollowups table has required columns", () => {
    const cols = Object.keys(pendingFollowups);
    expect(cols).toContain("id");
    expect(cols).toContain("emailThreadId");
    expect(cols).toContain("generatedContent");
    expect(cols).toContain("status");
  });
});
