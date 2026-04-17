# Quote System — Design Spec

## Context

Argon CRM mangler et tilbudssystem. I dag finnes kun et enkelt `quote`-felt (heltall) på leads-tabellen. Vi bygger et komplett quote-system med produktkatalog, tilbudsoppretting, statusflyt, PDF-generering og integrasjon med eksisterende leads-pipeline. Prisene er placeholder ("XX kr") da dette er et demonstrasjonssystem.

## Database Schema

### `products` tabell
```
id          INTEGER PRIMARY KEY AUTOINCREMENT
name        TEXT NOT NULL
description TEXT
unit        TEXT NOT NULL DEFAULT 'stk'  -- enum: stk, time, måned, prosjekt
createdAt   TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
updatedAt   TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
```

### `quotes` tabell
```
id          INTEGER PRIMARY KEY AUTOINCREMENT
quoteNumber TEXT NOT NULL UNIQUE           -- auto-generert: QT-001, QT-002, ...
leadId      INTEGER REFERENCES leads(id)   -- nullable, for standalone quotes
status      TEXT NOT NULL DEFAULT 'utkast'  -- enum: utkast, sendt, akseptert, avvist
notes       TEXT
createdAt   TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
updatedAt   TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
```

### `quoteItems` tabell
```
id          INTEGER PRIMARY KEY AUTOINCREMENT
quoteId     INTEGER NOT NULL REFERENCES quotes(id) ON DELETE CASCADE
productId   INTEGER NOT NULL REFERENCES products(id)
quantity    INTEGER NOT NULL DEFAULT 1
sortOrder   INTEGER NOT NULL DEFAULT 0
createdAt   TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
```

### Type exports
```typescript
export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type Quote = typeof quotes.$inferSelect;
export type NewQuote = typeof quotes.$inferInsert;
export type QuoteItem = typeof quoteItems.$inferSelect;
```

## Nye sider

### `/produkter` — Produktkatalog
- **Server component** med liste over alle produkter
- Hver rad: navn, beskrivelse, enhet, "XX kr"
- "Nytt produkt"-knapp åpner inline skjema (samme mønster som ActivityLog)
- Redigering via EditableField-mønsteret (hover-to-edit)
- Slett-knapp med bekreftelse

### `/tilbud` — Tilbudsoversikt
- **Server component** med liste over alle quotes
- Kolonner: quoteNumber, kunde (lead.name eller "Ingen kunde"), status (Badge), dato
- Filtrer på status (alle/utkast/sendt/akseptert/avvist)
- "Nytt tilbud"-knapp → navigerer til `/tilbud/ny`

### `/tilbud/ny` — Opprett tilbud
- **Client component** (interaktivt skjema)
- Valgfritt: velg lead fra dropdown (søkbar)
- Legg til produkter fra katalogen (dropdown + antall)
- Vis linjer med produkt, antall, "XX kr"
- Totalsum: "XX kr"
- Notater-felt
- "Opprett tilbud"-knapp → POST til API → redirect til `/tilbud/[id]`

### `/tilbud/[id]` — Tilbudsdetalj
- **Server component** med quote-info
- Kundeinfo (hvis koblet til lead, med lenke)
- Produktlinjer: produkt, antall, enhet, "XX kr"
- Totalsum: "XX kr"
- Status-Badge med statusendring-knapper:
  - Utkast → "Merk som sendt"
  - Sendt → "Merk som akseptert" / "Merk som avvist"
- "Last ned PDF"-knapp
- "Dupliser tilbud"-knapp → kopierer til ny quote med status utkast
- Redigering av linjer (legg til/fjern produkter, endre antall) kun når status er "utkast"

## API Routes

### Products
```
GET    /api/products        — List alle produkter
POST   /api/products        — Opprett produkt { name, description, unit }
PATCH  /api/products/[id]   — Oppdater produkt
DELETE /api/products/[id]   — Slett produkt
```

### Quotes
```
GET    /api/quotes          — List alle quotes (med lead-info joined)
POST   /api/quotes          — Opprett quote { leadId?, notes, items: [{productId, quantity}] }
GET    /api/quotes/[id]     — Hent quote med items og lead-info
PATCH  /api/quotes/[id]     — Oppdater quote (status, notes)
DELETE /api/quotes/[id]     — Slett quote
POST   /api/quotes/[id]/items     — Legg til linje { productId, quantity }
DELETE /api/quotes/[id]/items/[itemId] — Fjern linje
POST   /api/quotes/[id]/duplicate — Dupliser quote
```

## Statusflyt

```
utkast ──→ sendt ──→ akseptert
                 └──→ avvist
```

- Kun "utkast" kan redigeres (linjer, notater)
- Statusendring logger til aktivitetsloggen (hvis koblet til lead)

## Aktivitetslogg-integrasjon

Ny aktivitetstype: `"quote"` legges til i activities-tabellens type-enum.

Logger ved:
- Quote opprettet for en lead: "Tilbud QT-001 opprettet"
- Status endret: "Tilbud QT-001 merket som sendt/akseptert/avvist"

## Lead-detalj integrasjon

På `/leads/[id]`-siden:
- Ny seksjon "Tilbud" i høyre kolonne (under Data-synk)
- Viser liste over quotes koblet til leaden med quoteNumber, status, dato
- "Opprett tilbud"-knapp → navigerer til `/tilbud/ny?leadId={id}`

## Sidebar-navigasjon

To nye menypunkter i `navItems`:
```
{ href: "/produkter", label: "Produkter", icon: "..." }
{ href: "/tilbud", label: "Tilbud", icon: "..." }
```

Plassert mellom "Dashboard" og "Søk bedrifter".

## PDF-generering

- Bruker `html2pdf.js` (npm-pakke) for client-side PDF
- Rendrer en skjult HTML-template med:
  - Header: "Argon" + dato + quoteNumber
  - Kundeinformasjon (navn, org.nr, adresse) hvis koblet til lead
  - Produkttabell: Produkt | Antall | Enhet | Pris → alle priser "XX kr"
  - Totalsum: "XX kr"
  - Notater
- Filnavn: `tilbud-QT-001.pdf`

## Prisvisning

- Alle priser vises som **"XX kr"** i hele systemet
- Ingen reelle priser lagres i databasen
- Produktkatalogen viser "XX kr" per produkt
- Quote-linjer viser "XX kr" per linje
- Totalsum viser "XX kr"

## Drizzle-migrasjon

Kjøres med `npx drizzle-kit generate` + `npx drizzle-kit push` (samme mønster som eksisterende tabeller).

## Verifikasjon

1. Opprett et produkt via `/produkter`
2. Opprett et tilbud via `/tilbud/ny` med og uten lead-kobling
3. Legg til produkter, sett antall
4. Verifiser statusflyt: utkast → sendt → akseptert/avvist
5. Last ned PDF og sjekk at "XX kr" vises korrekt
6. Sjekk at aktivitetsloggen på lead-siden viser quote-hendelser
7. Dupliser et tilbud og verifiser at kopien har status "utkast"
8. Test at redigering er låst når status ikke er "utkast"
