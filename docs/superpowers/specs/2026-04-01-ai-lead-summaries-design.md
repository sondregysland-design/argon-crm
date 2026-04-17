# AI Lead Summaries Design

**Date:** 2026-04-01
**Status:** Approved

## Summary

Add AI-generated short company descriptions to leads using Claude API. Display these on dashboard lead cards instead of NACE industry text.

## Requirements

1. New `summary` field on leads table (1-2 sentence AI-generated description)
2. Claude AI generates summary during `runGoogleEnrich` using scraped website content + industry info
3. Dashboard lead cards show summary instead of industry badge
4. Falls back to `industryName` if no summary exists

## Schema Change

Add to `leads` table in `src/lib/db/schema.ts`:

```typescript
summary: text("summary"),
```

## AI Generation

In `runGoogleEnrich()`, after scraping website content, call Claude to generate a summary.

**Input to Claude:**
- Company name
- Industry name (NACE)
- Scraped website description (from `notes`)
- City

**System prompt:**
```
Du er en salgsassistent. Skriv en kort beskrivelse (1-2 setninger, maks 80 tegn) av hva bedriften gjør.
Fokuser på tjenester/produkter som er relevante for salg. Skriv på norsk. Ikke inkluder firmanavn eller by.
```

**Output:** Short string stored in `summary` field.

Uses existing `@anthropic-ai/sdk` dependency and `ANTHROPIC_API_KEY` env var.

## Dashboard Lead Card Change

In `src/components/LeadCard.tsx`, replace the industry badge with the summary text:

- If `summary` exists: show it as a muted text line under the city
- If no `summary`: show `industryName` as before (badge fallback)

## Lead Detail Page

Show `summary` in the "Om bedriften" section (already shows `notes`). Display summary above the longer notes text.

## Cost

- Claude Haiku for generation (~$0.001 per lead)
- Only runs on leads without existing summary
- 18 leads = ~$0.02

## Out of Scope

- Manual editing of summary
- Re-generating summaries
- Proff.no enrichment
