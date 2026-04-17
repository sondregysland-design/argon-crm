# Automatisk Kundeoppfølging — Design Spec

## Kontekst

Argon CRM mangler e-postfunksjonalitet. Leads blir kontaktet manuelt via Gmail, og oppfølging er avhengig av at brukeren husker å følge opp. Målet er å bygge inn AI-generert e-postsending og automatisk oppfølging direkte i CRM-en, slik at ingen leads faller mellom stolene.

## Krav

### Funksjonelle krav

1. **Send første e-post fra CRM-en**
   - "Send e-post"-knapp på lead-siden
   - Claude API genererer utkast basert på lead-data (firmanavn, kontaktperson, bransje, prosjekttype)
   - Brukeren kan redigere utkastet før sending
   - Sendes via Gmail API fra post@argon.no (Google Workspace)
   - Thread ID og Message-ID lagres i databasen

2. **Automatisk oppfølging**
   - Etter 5 dager uten svar sendes en oppfølgingsmail
   - Kun på ukedager (mandag–fredag)
   - Maks 3 oppfølginger per lead
   - E-posten sendes i samme Gmail-tråd (In-Reply-To / References headers)
   - Claude genererer oppfølging basert på lead-data + forrige sendte e-post

3. **Per-lead godkjenningsvalg**
   - Hver lead kan settes til "auto-send" eller "manuell godkjenning"
   - Auto-send: AI genererer og sender direkte
   - Manuell: AI genererer utkast → brukeren godkjenner/redigerer i CRM-en

4. **Oppfølgings-dashboard**
   - Oversikt over alle aktive oppfølginger
   - Ventende godkjenninger for manuell-modus leads
   - Godkjenn/rediger/avvis-handlinger

5. **Svar-deteksjon**
   - Sjekker Gmail-tråden for nye meldinger fra mottakeren
   - Hvis svar mottatt → stopper oppfølging, oppdaterer status

### Ikke-funksjonelle krav

- E-posttonen skal være uformell men profesjonell, på norsk
- Eksempel på ønsket tone: "Hei [navn], ville bare følge opp angående [tema]. Gi meg beskjed om du har noen spørsmål. — Sondre"
- Systemet skal kjøre som Vercel Cron Job (daglig kl 09:00 norsk tid)

## Arkitektur

### Nye avhengigheter

- `googleapis` — Gmail API klient
- `@anthropic-ai/sdk` — Claude API for e-postgenerering

### Datamodell

**Ny tabell: `email_threads`**

| Kolonne | Type | Beskrivelse |
|---------|------|-------------|
| `id` | integer, PK | Auto-increment |
| `leadId` | integer, FK → leads | Tilknyttet lead |
| `gmailThreadId` | text | Gmail sin thread ID |
| `gmailMessageId` | text | Siste sendte Message-ID |
| `subject` | text | Emnelinje |
| `followUpCount` | integer, default 0 | Antall sendte oppfølginger (0–3) |
| `nextFollowUpAt` | text (ISO date) | Neste planlagte oppfølging |
| `autoSend` | integer (boolean) | 1 = auto, 0 = manuell godkjenning |
| `status` | text | "active", "replied", "completed", "paused" |
| `lastEmailContent` | text | Innholdet i forrige sendte e-post |
| `createdAt` | text | Opprettet-tidspunkt |
| `updatedAt` | text | Sist oppdatert |

**Ny tabell: `pending_followups`**

| Kolonne | Type | Beskrivelse |
|---------|------|-------------|
| `id` | integer, PK | Auto-increment |
| `emailThreadId` | integer, FK → email_threads | Tilknyttet tråd |
| `generatedContent` | text | AI-generert utkast |
| `status` | text | "pending", "approved", "rejected" |
| `createdAt` | text | Opprettet-tidspunkt |

### API-ruter

| Rute | Metode | Beskrivelse |
|------|--------|-------------|
| `/api/email/send` | POST | Send e-post (første eller oppfølging) |
| `/api/email/generate` | POST | Generer AI-utkast uten å sende |
| `/api/email/thread/[threadId]` | GET | Hent tråd-status |
| `/api/email/pending` | GET | Liste ventende godkjenninger |
| `/api/email/pending/[id]` | PATCH | Godkjenn/avvis ventende oppfølging |
| `/api/cron/followup` | GET | Cron endpoint for daglig oppfølging |

### Komponentstruktur

**Lead-side (`/leads/[id]`):**
- `EmailComposer` — Modal for å skrive/sende e-post med AI-generert utkast
- `FollowUpStatus` — Viser oppfølgingsstatus (antall sendt, neste dato, auto/manuell toggle)

**Ny side (`/oppfolging`):**
- `FollowUpDashboard` — Oversikt over alle aktive oppfølginger
- `PendingApprovalList` — Ventende godkjenninger med handlingsknapper

### Gmail API-integrasjon

**Fil: `src/lib/gmail.ts`**
- OAuth2-oppsett med Google Workspace credentials for post@argon.no
- `sendEmail(to, subject, body, inReplyTo?, references?)` — sender e-post, returnerer thread ID + message ID
- `checkForReplies(threadId, afterMessageId)` — sjekker om noen har svart i tråden
- Threading via `In-Reply-To` og `References` headers

**Miljøvariabler:**
- `GMAIL_CLIENT_ID` — OAuth client ID
- `GMAIL_CLIENT_SECRET` — OAuth client secret
- `GMAIL_REFRESH_TOKEN` — Refresh token for post@argon.no
- `ANTHROPIC_API_KEY` — Claude API-nøkkel

### AI E-postgenerering

**Fil: `src/lib/email-generator.ts`**
- `generateInitialEmail(lead)` — genererer første e-post basert på lead-data
- `generateFollowUp(lead, previousEmail, followUpNumber)` — genererer oppfølging

**System-prompt retningslinjer:**
- Språk: norsk
- Tone: uformell men profesjonell
- Kort og direkte (2–4 setninger)
- Ingen formelle hilsener ("Med vennlig hilsen" etc.)
- Signatur: bare fornavn (— Sondre)
- Tilpass innholdet til bransje og prosjekttype

### Cron Job-flyt

```
Vercel Cron → GET /api/cron/followup (daglig kl 09:00 CET)
  ├── Finn alle email_threads der status = "active"
  │   AND nextFollowUpAt ≤ i dag
  │   AND followUpCount < 3
  │   AND det er en ukedag
  │
  ├── For hver tråd:
  │   ├── Sjekk Gmail for svar (checkForReplies)
  │   ├── Hvis svar → status = "replied", logg aktivitet, stopp
  │   ├── Hvis autoSend = true:
  │   │   ├── Generer oppfølging (Claude)
  │   │   ├── Send via Gmail API (i samme tråd)
  │   │   ├── Oppdater followUpCount, nextFollowUpAt, lastEmailContent
  │   │   └── Logg aktivitet
  │   └── Hvis autoSend = false:
  │       ├── Generer oppfølging (Claude)
  │       └── Lagre i pending_followups
  │
  └── Etter 3 oppfølginger → status = "completed"
```

### nextFollowUpAt-beregning

```typescript
function calculateNextFollowUp(fromDate: Date): Date {
  const next = new Date(fromDate);
  next.setDate(next.getDate() + 5);
  // Juster til neste ukedag
  const day = next.getDay();
  if (day === 0) next.setDate(next.getDate() + 1); // søndag → mandag
  if (day === 6) next.setDate(next.getDate() + 2); // lørdag → mandag
  return next;
}
```

## Verifikasjon

1. **Send første e-post:** Åpne en lead → klikk "Send e-post" → verifiser at e-posten mottas i riktig Gmail-tråd
2. **Oppfølging (auto):** Sett en lead til auto-send → simuler at 5 dager har gått → kjør cron manuelt → verifiser at oppfølging sendes i samme tråd
3. **Oppfølging (manuell):** Sett en lead til manuell → kjør cron → verifiser at utkast vises i /oppfolging-dashboardet
4. **Svar-deteksjon:** Svar på e-posten fra mottaker-kontoen → kjør cron → verifiser at status endres til "replied"
5. **Maks 3 oppfølginger:** Verifiser at systemet stopper etter 3 oppfølginger
6. **Ukedag-logikk:** Verifiser at nextFollowUpAt aldri faller på lørdag/søndag
