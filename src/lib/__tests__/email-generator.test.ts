import { describe, it, expect } from "vitest";
import { buildInitialEmailPrompt, buildFollowUpPrompt } from "../email-generator";

const mockLead = {
  name: "Bergens Bygg AS",
  contactPerson: "Erik Hansen",
  industryName: "Bygg og anlegg",
  projectType: "nettside",
  city: "Bergen",
};

describe("buildInitialEmailPrompt", () => {
  it("includes company name and contact person", () => {
    const prompt = buildInitialEmailPrompt(mockLead);
    expect(prompt).toContain("Bergens Bygg AS");
    expect(prompt).toContain("Erik Hansen");
  });

  it("includes industry and project type", () => {
    const prompt = buildInitialEmailPrompt(mockLead);
    expect(prompt).toContain("Bygg og anlegg");
    expect(prompt).toContain("nettside");
  });

  it("instructs Norwegian language and casual tone", () => {
    const prompt = buildInitialEmailPrompt(mockLead);
    expect(prompt).toContain("norsk");
    expect(prompt.toLowerCase()).toContain("uformell");
  });
});

describe("buildFollowUpPrompt", () => {
  it("includes previous email content", () => {
    const prompt = buildFollowUpPrompt(mockLead, "Hei Erik, har du sett tilbudet?", 1);
    expect(prompt).toContain("Hei Erik, har du sett tilbudet?");
  });

  it("includes follow-up number", () => {
    const prompt = buildFollowUpPrompt(mockLead, "prev email", 2);
    expect(prompt).toContain("2");
  });

  it("instructs to keep it short", () => {
    const prompt = buildFollowUpPrompt(mockLead, "prev", 1);
    expect(prompt.toLowerCase()).toContain("kort");
  });
});
