import { describe, it, expect } from "vitest";
import { buildRawEmail, calculateNextFollowUp } from "../gmail";

describe("buildRawEmail", () => {
  it("builds a basic email without threading headers", () => {
    const raw = buildRawEmail({
      to: "test@example.com",
      subject: "Hei",
      body: "Hei, dette er en test.",
    });
    const decoded = Buffer.from(raw, "base64url").toString();
    expect(decoded).toContain("To: test@example.com");
    expect(decoded).toContain("Subject: Hei");
    expect(decoded).toContain("Hei, dette er en test.");
  });

  it("includes In-Reply-To and References when provided", () => {
    const raw = buildRawEmail({
      to: "test@example.com",
      subject: "Re: Hei",
      body: "Oppfølging",
      inReplyTo: "<msg123@mail.gmail.com>",
      references: "<msg123@mail.gmail.com>",
    });
    const decoded = Buffer.from(raw, "base64url").toString();
    expect(decoded).toContain("In-Reply-To: <msg123@mail.gmail.com>");
    expect(decoded).toContain("References: <msg123@mail.gmail.com>");
  });
});

describe("calculateNextFollowUp", () => {
  it("adds 5 days to a Monday (result: Saturday → becomes Monday)", () => {
    const monday = new Date("2026-03-30"); // Monday
    const result = calculateNextFollowUp(monday);
    expect(result.getDay()).not.toBe(0);
    expect(result.getDay()).not.toBe(6);
    expect(result.toISOString().slice(0, 10)).toBe("2026-04-06");
  });

  it("adds 5 days to a Wednesday (result: Monday)", () => {
    const wednesday = new Date("2026-04-01"); // Wednesday
    const result = calculateNextFollowUp(wednesday);
    expect(result.toISOString().slice(0, 10)).toBe("2026-04-06");
  });

  it("adds 5 days to a Thursday (result: Tuesday)", () => {
    const thursday = new Date("2026-04-02"); // Thursday
    const result = calculateNextFollowUp(thursday);
    expect(result.getDay()).not.toBe(0);
    expect(result.getDay()).not.toBe(6);
    expect(result.toISOString().slice(0, 10)).toBe("2026-04-07");
  });
});
