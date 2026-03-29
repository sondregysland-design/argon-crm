import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

interface LeadContext {
  name: string;
  contactPerson: string | null;
  industryName: string | null;
  projectType: string | null;
  city: string | null;
}

const SYSTEM_PROMPT = `Du er en selger for Argon Solutions, et norsk digitalbyrå.
Skriv e-poster på norsk med en uformell men profesjonell tone.
Regler:
- Kort og direkte (2-4 setninger maks)
- Ingen formelle hilsener som "Med vennlig hilsen"
- Signer kun med "— Sondre"
- Ikke bruk utropstegn
- Skriv som om du sender en rask melding til noen du kjenner litt
- Ikke start med "Hei!" — bruk "Hei [fornavn]," uten utropstegn`;

export function buildInitialEmailPrompt(lead: LeadContext): string {
  return `Skriv en første e-post til en potensiell kunde.

Firmanavn: ${lead.name}
Kontaktperson: ${lead.contactPerson ?? "ukjent"}
Bransje: ${lead.industryName ?? "ukjent"}
Prosjekttype: ${lead.projectType ?? "digitale tjenester"}
By: ${lead.city ?? "ukjent"}

Skriv en uformell, kort e-post på norsk som introduserer Argon Solutions og foreslår en kort prat om hvordan vi kan hjelpe dem med ${lead.projectType ?? "digitale tjenester"}.

Returner KUN e-postteksten, ingen emnelinjer eller metadata.`;
}

export function buildFollowUpPrompt(
  lead: LeadContext,
  previousEmail: string,
  followUpNumber: number
): string {
  return `Skriv oppfølgingsmail nummer ${followUpNumber} til en kunde som ikke har svart.

Firmanavn: ${lead.name}
Kontaktperson: ${lead.contactPerson ?? "ukjent"}
Bransje: ${lead.industryName ?? "ukjent"}

Forrige e-post vi sendte:
---
${previousEmail}
---

Skriv en kort og uformell oppfølging på norsk. Hold det til 1-2 setninger.
${followUpNumber >= 3 ? "Dette er siste oppfølging — gjør det tydelig at du ikke vil mase mer." : ""}

Returner KUN e-postteksten, ingen emnelinjer eller metadata.`;
}

export async function generateEmail(prompt: string): Promise<string> {
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 300,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: prompt }],
  });

  const block = response.content[0];
  if (block.type !== "text") throw new Error("Unexpected response type");
  return block.text.trim();
}
