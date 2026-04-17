# Quote System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a complete quote/tilbud system with product catalog, quote creation, status workflow, PDF generation, and lead integration to Argon CRM.

**Architecture:** Three new database tables (products, quotes, quoteItems) with Drizzle ORM. Four new pages following existing Next.js App Router patterns. RESTful API routes matching the existing fetch-based mutation pattern. Client-side PDF generation with html2pdf.js.

**Tech Stack:** Next.js 16 (App Router), Drizzle ORM + Turso/libsql, Tailwind CSS 4, html2pdf.js, React 19

**Spec:** `docs/superpowers/specs/2026-03-29-quote-system-design.md`

---

## File Structure

### New files:
- `src/lib/db/schema.ts` — modify: add products, quotes, quoteItems tables + type exports
- `src/lib/constants.ts` — modify: add PRODUCT_UNITS, QUOTE_STATUSES, QUOTE_STATUS_LABELS
- `src/app/api/products/route.ts` — GET/POST products
- `src/app/api/products/[id]/route.ts` — PATCH/DELETE product
- `src/app/api/quotes/route.ts` — GET/POST quotes
- `src/app/api/quotes/[id]/route.ts` — GET/PATCH/DELETE quote
- `src/app/api/quotes/[id]/items/route.ts` — POST quote item
- `src/app/api/quotes/[id]/items/[itemId]/route.ts` — DELETE quote item
- `src/app/api/quotes/[id]/duplicate/route.ts` — POST duplicate quote
- `src/app/produkter/page.tsx` — Product catalog page
- `src/components/ProductForm.tsx` — Add/edit product form
- `src/app/tilbud/page.tsx` — Quotes list page
- `src/app/tilbud/ny/page.tsx` — Create quote page
- `src/app/tilbud/[id]/page.tsx` — Quote detail page
- `src/components/QuoteItemsEditor.tsx` — Add/remove products on a quote
- `src/components/QuoteStatusActions.tsx` — Status change buttons
- `src/components/QuotePdfDownload.tsx` — PDF generation button
- `src/components/LeadQuotes.tsx` — Quote list on lead detail page

### Modified files:
- `src/components/Sidebar.tsx` — add "Produkter" and "Tilbud" nav items
- `src/app/leads/[id]/page.tsx` — add LeadQuotes section
- `src/components/ActivityLog.tsx` — add "quote" type label/icon
- `src/components/ui/Badge.tsx` — add quote status colors

---

## Task 1: Database Schema — Products, Quotes, QuoteItems

**Files:**
- Modify: `src/lib/db/schema.ts`

- [ ] **Step 1: Add products table to schema**

In `src/lib/db/schema.ts`, add after the `pendingFollowups` table definition:

```typescript
export const products = sqliteTable("products", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description"),
  unit: text("unit", { enum: ["stk", "time", "måned", "prosjekt"] }).notNull().default("stk"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});
```

- [ ] **Step 2: Add quotes table to schema**

Add after the `products` table:

```typescript
export const quotes = sqliteTable("quotes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  quoteNumber: text("quote_number").unique().notNull(),
  leadId: integer("lead_id").references(() => leads.id),
  status: text("status", { enum: ["utkast", "sendt", "akseptert", "avvist"] }).notNull().default("utkast"),
  notes: text("notes"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});
```

- [ ] **Step 3: Add quoteItems table to schema**

Add after the `quotes` table:

```typescript
export const quoteItems = sqliteTable("quote_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  quoteId: integer("quote_id").notNull().references(() => quotes.id, { onDelete: "cascade" }),
  productId: integer("product_id").notNull().references(() => products.id),
  quantity: integer("quantity").notNull().default(1),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});
```

- [ ] **Step 4: Add type exports**

Add at the end of the file, after existing type exports:

```typescript
export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type Quote = typeof quotes.$inferSelect;
export type NewQuote = typeof quotes.$inferInsert;
export type QuoteItem = typeof quoteItems.$inferSelect;
```

- [ ] **Step 5: Update activities type enum**

Modify the `activities` table's `type` field to include `"quote"`:

```typescript
type: text("type", { enum: ["note", "email", "call", "stage_change", "data_enriched", "quote"] }).notNull(),
```

- [ ] **Step 6: Push schema to database**

Run:
```bash
cd argon-crm && npx drizzle-kit push
```

Expected: Schema changes applied to database.

- [ ] **Step 7: Commit**

```bash
git add src/lib/db/schema.ts
git commit -m "feat: add products, quotes, quoteItems tables to schema"
```

---

## Task 2: Constants — Product Units and Quote Statuses

**Files:**
- Modify: `src/lib/constants.ts`

- [ ] **Step 1: Add product unit and quote status constants**

Add at the end of `src/lib/constants.ts`:

```typescript
export const PRODUCT_UNITS = [
  { value: "stk", label: "Stk" },
  { value: "time", label: "Time" },
  { value: "måned", label: "Måned" },
  { value: "prosjekt", label: "Prosjekt" },
];

export const QUOTE_STATUSES = [
  { value: "", label: "Alle statuser" },
  { value: "utkast", label: "Utkast" },
  { value: "sendt", label: "Sendt" },
  { value: "akseptert", label: "Akseptert" },
  { value: "avvist", label: "Avvist" },
];

export const QUOTE_STATUS_LABELS: Record<string, string> = {
  utkast: "Utkast",
  sendt: "Sendt",
  akseptert: "Akseptert",
  avvist: "Avvist",
};
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/constants.ts
git commit -m "feat: add product unit and quote status constants"
```

---

## Task 3: Badge + ActivityLog Updates

**Files:**
- Modify: `src/components/ui/Badge.tsx`
- Modify: `src/components/ActivityLog.tsx`

- [ ] **Step 1: Add quote status colors to Badge**

In `src/components/ui/Badge.tsx`, add these entries to the `stageColors` object:

```typescript
utkast: "bg-gray-100 text-gray-600",
sendt: "bg-blue-100 text-blue-700",
akseptert: "bg-emerald-100 text-emerald-700",
avvist: "bg-red-100 text-red-700",
```

- [ ] **Step 2: Add quote type to ActivityLog**

In `src/components/ActivityLog.tsx`, add to `typeLabels`:

```typescript
quote: "Tilbud",
```

Add to `typeIcons`:

```typescript
quote: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
```

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/Badge.tsx src/components/ActivityLog.tsx
git commit -m "feat: add quote status colors and activity type"
```

---

## Task 4: Products API Routes

**Files:**
- Create: `src/app/api/products/route.ts`
- Create: `src/app/api/products/[id]/route.ts`

- [ ] **Step 1: Create products list/create route**

Create `src/app/api/products/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { products } from "@/lib/db/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  const result = await db.select().from(products).orderBy(desc(products.createdAt)).all();
  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const result = await db.insert(products).values({
    name: body.name,
    description: body.description ?? null,
    unit: body.unit ?? "stk",
  }).returning();
  return NextResponse.json(result[0], { status: 201 });
}
```

- [ ] **Step 2: Create product update/delete route**

Create `src/app/api/products/[id]/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { products } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const result = await db.update(products)
    .set({ ...body, updatedAt: new Date().toISOString() })
    .where(eq(products.id, parseInt(id)))
    .returning();
  if (!result.length) return NextResponse.json({ error: "Ikke funnet" }, { status: 404 });
  return NextResponse.json(result[0]);
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await db.delete(products).where(eq(products.id, parseInt(id)));
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/products/
git commit -m "feat: add products CRUD API routes"
```

---

## Task 5: Products Page

**Files:**
- Create: `src/app/produkter/page.tsx`
- Create: `src/components/ProductForm.tsx`

- [ ] **Step 1: Create ProductForm component**

Create `src/components/ProductForm.tsx`:

```typescript
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { PRODUCT_UNITS } from "@/lib/constants";

export function ProductForm({ onCreated }: { onCreated: (product: any) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [unit, setUnit] = useState("stk");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, unit }),
      });
      const product = await res.json();
      onCreated(product);
      setName("");
      setDescription("");
      setUnit("stk");
      setOpen(false);
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return <Button onClick={() => setOpen(true)}>+ Nytt produkt</Button>;
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap gap-3 rounded-lg border border-gray-200 bg-white p-4">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Produktnavn"
        required
        className="flex-1 min-w-[200px] rounded-lg border border-gray-200 px-4 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
      />
      <input
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Beskrivelse (valgfritt)"
        className="flex-1 min-w-[200px] rounded-lg border border-gray-200 px-4 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
      />
      <select
        value={unit}
        onChange={(e) => setUnit(e.target.value)}
        className="rounded-lg border border-gray-200 px-4 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
      >
        {PRODUCT_UNITS.map((u) => (
          <option key={u.value} value={u.value}>{u.label}</option>
        ))}
      </select>
      <div className="flex gap-2">
        <Button type="submit" disabled={saving || !name.trim()}>
          {saving ? "Lagrer..." : "Legg til"}
        </Button>
        <Button variant="ghost" type="button" onClick={() => setOpen(false)}>Avbryt</Button>
      </div>
    </form>
  );
}
```

- [ ] **Step 2: Create products page**

Create `src/app/produkter/page.tsx`:

```typescript
import { db } from "@/lib/db";
import { products } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { ProductsClient } from "./ProductsClient";

export const dynamic = "force-dynamic";

export default async function ProdukterPage() {
  const allProducts = await db.select().from(products).orderBy(desc(products.createdAt)).all();
  return <ProductsClient initialProducts={allProducts} />;
}
```

- [ ] **Step 3: Create ProductsClient component**

Create `src/app/produkter/ProductsClient.tsx`:

```typescript
"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ProductForm } from "@/components/ProductForm";
import type { Product } from "@/lib/db/schema";

const unitLabels: Record<string, string> = {
  stk: "Stk",
  time: "Time",
  måned: "Måned",
  prosjekt: "Prosjekt",
};

export function ProductsClient({ initialProducts }: { initialProducts: Product[] }) {
  const [productList, setProductList] = useState(initialProducts);

  async function handleDelete(id: number) {
    if (!confirm("Slett dette produktet?")) return;
    await fetch(`/api/products/${id}`, { method: "DELETE" });
    setProductList((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text">Produkter</h1>
        <ProductForm onCreated={(p) => setProductList((prev) => [p, ...prev])} />
      </div>

      <Card>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-text-light">
              <th className="pb-3 font-medium">Navn</th>
              <th className="pb-3 font-medium">Beskrivelse</th>
              <th className="pb-3 font-medium">Enhet</th>
              <th className="pb-3 font-medium">Pris</th>
              <th className="pb-3 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {productList.map((p) => (
              <tr key={p.id} className="group">
                <td className="py-3 font-medium text-text">{p.name}</td>
                <td className="py-3 text-text-light">{p.description || "—"}</td>
                <td className="py-3 text-text-light">{unitLabels[p.unit] ?? p.unit}</td>
                <td className="py-3 text-text-light">XX kr</td>
                <td className="py-3 text-right">
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="text-text-light opacity-0 transition group-hover:opacity-100 hover:text-red-600"
                    title="Slett"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
            {productList.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-text-light">
                  Ingen produkter enda. Legg til det første!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/produkter/ src/components/ProductForm.tsx
git commit -m "feat: add products catalog page with CRUD"
```

---

## Task 6: Quotes API Routes

**Files:**
- Create: `src/app/api/quotes/route.ts`
- Create: `src/app/api/quotes/[id]/route.ts`
- Create: `src/app/api/quotes/[id]/items/route.ts`
- Create: `src/app/api/quotes/[id]/items/[itemId]/route.ts`
- Create: `src/app/api/quotes/[id]/duplicate/route.ts`

- [ ] **Step 1: Create quotes list/create route**

Create `src/app/api/quotes/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { quotes, quoteItems, leads, activities } from "@/lib/db/schema";
import { desc, eq, sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const status = request.nextUrl.searchParams.get("status");
  const leadId = request.nextUrl.searchParams.get("leadId");

  let query = db.select({
    id: quotes.id,
    quoteNumber: quotes.quoteNumber,
    leadId: quotes.leadId,
    leadName: leads.name,
    status: quotes.status,
    notes: quotes.notes,
    createdAt: quotes.createdAt,
    updatedAt: quotes.updatedAt,
  })
    .from(quotes)
    .leftJoin(leads, eq(quotes.leadId, leads.id))
    .orderBy(desc(quotes.createdAt));

  const result = await query.all();

  const filtered = result.filter((q) => {
    if (status && q.status !== status) return false;
    if (leadId && q.leadId !== parseInt(leadId)) return false;
    return true;
  });

  return NextResponse.json(filtered);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  // Generate next quote number
  const lastQuote = await db.select({ quoteNumber: quotes.quoteNumber })
    .from(quotes)
    .orderBy(desc(quotes.id))
    .limit(1)
    .get();

  let nextNum = 1;
  if (lastQuote) {
    const match = lastQuote.quoteNumber.match(/QT-(\d+)/);
    if (match) nextNum = parseInt(match[1]) + 1;
  }
  const quoteNumber = `QT-${String(nextNum).padStart(3, "0")}`;

  const newQuote = await db.insert(quotes).values({
    quoteNumber,
    leadId: body.leadId ?? null,
    notes: body.notes ?? null,
  }).returning();

  const quote = newQuote[0];

  // Insert items if provided
  if (body.items?.length) {
    for (let i = 0; i < body.items.length; i++) {
      await db.insert(quoteItems).values({
        quoteId: quote.id,
        productId: body.items[i].productId,
        quantity: body.items[i].quantity ?? 1,
        sortOrder: i,
      });
    }
  }

  // Log activity if linked to a lead
  if (quote.leadId) {
    await db.insert(activities).values({
      leadId: quote.leadId,
      type: "quote",
      description: `Tilbud ${quoteNumber} opprettet`,
    });
  }

  return NextResponse.json(quote, { status: 201 });
}
```

- [ ] **Step 2: Create quote detail/update/delete route**

Create `src/app/api/quotes/[id]/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { quotes, quoteItems, products, leads, activities } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const quote = await db.select().from(quotes).where(eq(quotes.id, parseInt(id))).get();
  if (!quote) return NextResponse.json({ error: "Ikke funnet" }, { status: 404 });

  const items = await db.select({
    id: quoteItems.id,
    quoteId: quoteItems.quoteId,
    productId: quoteItems.productId,
    quantity: quoteItems.quantity,
    sortOrder: quoteItems.sortOrder,
    productName: products.name,
    productDescription: products.description,
    productUnit: products.unit,
  })
    .from(quoteItems)
    .leftJoin(products, eq(quoteItems.productId, products.id))
    .where(eq(quoteItems.quoteId, quote.id))
    .orderBy(quoteItems.sortOrder)
    .all();

  let lead = null;
  if (quote.leadId) {
    lead = await db.select().from(leads).where(eq(leads.id, quote.leadId)).get();
  }

  return NextResponse.json({ ...quote, items, lead });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();

  const existing = await db.select().from(quotes).where(eq(quotes.id, parseInt(id))).get();
  if (!existing) return NextResponse.json({ error: "Ikke funnet" }, { status: 404 });

  const result = await db.update(quotes)
    .set({ ...body, updatedAt: new Date().toISOString() })
    .where(eq(quotes.id, parseInt(id)))
    .returning();

  // Log status change activity
  if (body.status && body.status !== existing.status && existing.leadId) {
    const statusLabel: Record<string, string> = {
      sendt: "merket som sendt",
      akseptert: "akseptert",
      avvist: "avvist",
    };
    await db.insert(activities).values({
      leadId: existing.leadId,
      type: "quote",
      description: `Tilbud ${existing.quoteNumber} ${statusLabel[body.status] ?? body.status}`,
    });
  }

  return NextResponse.json(result[0]);
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await db.delete(quotes).where(eq(quotes.id, parseInt(id)));
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 3: Create quote items add route**

Create `src/app/api/quotes/[id]/items/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { quoteItems } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();

  // Get max sort order
  const maxOrder = await db.select({ max: sql<number>`COALESCE(MAX(sort_order), -1)` })
    .from(quoteItems)
    .where(eq(quoteItems.quoteId, parseInt(id)))
    .get();

  const result = await db.insert(quoteItems).values({
    quoteId: parseInt(id),
    productId: body.productId,
    quantity: body.quantity ?? 1,
    sortOrder: (maxOrder?.max ?? -1) + 1,
  }).returning();

  return NextResponse.json(result[0], { status: 201 });
}
```

- [ ] **Step 4: Create quote item delete route**

Create `src/app/api/quotes/[id]/items/[itemId]/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { quoteItems } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string; itemId: string }> }) {
  const { itemId } = await params;
  await db.delete(quoteItems).where(eq(quoteItems.id, parseInt(itemId)));
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 5: Create quote duplicate route**

Create `src/app/api/quotes/[id]/duplicate/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { quotes, quoteItems } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const original = await db.select().from(quotes).where(eq(quotes.id, parseInt(id))).get();
  if (!original) return NextResponse.json({ error: "Ikke funnet" }, { status: 404 });

  const originalItems = await db.select().from(quoteItems)
    .where(eq(quoteItems.quoteId, original.id))
    .orderBy(quoteItems.sortOrder)
    .all();

  // Generate next quote number
  const lastQuote = await db.select({ quoteNumber: quotes.quoteNumber })
    .from(quotes)
    .orderBy(desc(quotes.id))
    .limit(1)
    .get();

  let nextNum = 1;
  if (lastQuote) {
    const match = lastQuote.quoteNumber.match(/QT-(\d+)/);
    if (match) nextNum = parseInt(match[1]) + 1;
  }
  const quoteNumber = `QT-${String(nextNum).padStart(3, "0")}`;

  const newQuote = await db.insert(quotes).values({
    quoteNumber,
    leadId: original.leadId,
    status: "utkast",
    notes: original.notes,
  }).returning();

  for (let i = 0; i < originalItems.length; i++) {
    await db.insert(quoteItems).values({
      quoteId: newQuote[0].id,
      productId: originalItems[i].productId,
      quantity: originalItems[i].quantity,
      sortOrder: originalItems[i].sortOrder,
    });
  }

  return NextResponse.json(newQuote[0], { status: 201 });
}
```

- [ ] **Step 6: Commit**

```bash
git add src/app/api/quotes/
git commit -m "feat: add quotes CRUD, items, and duplicate API routes"
```

---

## Task 7: Quotes List Page

**Files:**
- Create: `src/app/tilbud/page.tsx`

- [ ] **Step 1: Create quotes list page**

Create `src/app/tilbud/page.tsx`:

```typescript
import { db } from "@/lib/db";
import { quotes, leads } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function TilbudPage() {
  const allQuotes = await db.select({
    id: quotes.id,
    quoteNumber: quotes.quoteNumber,
    leadId: quotes.leadId,
    leadName: leads.name,
    status: quotes.status,
    createdAt: quotes.createdAt,
  })
    .from(quotes)
    .leftJoin(leads, eq(quotes.leadId, leads.id))
    .orderBy(desc(quotes.createdAt))
    .all();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text">Tilbud</h1>
        <Link
          href="/tilbud/ny"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-dark"
        >
          + Nytt tilbud
        </Link>
      </div>

      <Card>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-text-light">
              <th className="pb-3 font-medium">Nummer</th>
              <th className="pb-3 font-medium">Kunde</th>
              <th className="pb-3 font-medium">Status</th>
              <th className="pb-3 font-medium">Dato</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {allQuotes.map((q) => (
              <tr key={q.id} className="group hover:bg-gray-50">
                <td className="py-3">
                  <Link href={`/tilbud/${q.id}`} className="font-medium text-primary hover:underline">
                    {q.quoteNumber}
                  </Link>
                </td>
                <td className="py-3 text-text">
                  {q.leadId && q.leadName ? (
                    <Link href={`/leads/${q.leadId}`} className="hover:underline">{q.leadName}</Link>
                  ) : (
                    <span className="text-text-light">Ingen kunde</span>
                  )}
                </td>
                <td className="py-3"><Badge label={q.status} /></td>
                <td className="py-3 text-text-light">
                  {new Date(q.createdAt).toLocaleDateString("nb-NO")}
                </td>
              </tr>
            ))}
            {allQuotes.length === 0 && (
              <tr>
                <td colSpan={4} className="py-8 text-center text-text-light">
                  Ingen tilbud enda. Opprett det første!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/tilbud/page.tsx
git commit -m "feat: add quotes list page"
```

---

## Task 8: Create Quote Page

**Files:**
- Create: `src/app/tilbud/ny/page.tsx`

- [ ] **Step 1: Create the new quote page**

Create `src/app/tilbud/ny/page.tsx`:

```typescript
import { db } from "@/lib/db";
import { products, leads } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { CreateQuoteForm } from "./CreateQuoteForm";

export const dynamic = "force-dynamic";

export default async function NyttTilbudPage() {
  const allProducts = await db.select().from(products).orderBy(products.name).all();
  const allLeads = await db.select({ id: leads.id, name: leads.name })
    .from(leads)
    .orderBy(leads.name)
    .all();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-text">Nytt tilbud</h1>
      <CreateQuoteForm products={allProducts} leads={allLeads} />
    </div>
  );
}
```

- [ ] **Step 2: Create CreateQuoteForm component**

Create `src/app/tilbud/ny/CreateQuoteForm.tsx`:

```typescript
"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import type { Product } from "@/lib/db/schema";

interface LineItem {
  productId: number;
  productName: string;
  productUnit: string;
  quantity: number;
}

export function CreateQuoteForm({
  products,
  leads,
}: {
  products: Product[];
  leads: { id: number; name: string }[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedLeadId = searchParams.get("leadId");

  const [leadId, setLeadId] = useState(preselectedLeadId ?? "");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<LineItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [saving, setSaving] = useState(false);

  function addItem() {
    const product = products.find((p) => p.id === parseInt(selectedProduct));
    if (!product) return;
    setItems((prev) => [
      ...prev,
      { productId: product.id, productName: product.name, productUnit: product.unit, quantity },
    ]);
    setSelectedProduct("");
    setQuantity(1);
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (items.length === 0) return;
    setSaving(true);
    try {
      const res = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: leadId ? parseInt(leadId) : null,
          notes: notes || null,
          items: items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
        }),
      });
      const quote = await res.json();
      router.push(`/tilbud/${quote.id}`);
    } finally {
      setSaving(false);
    }
  }

  const unitLabels: Record<string, string> = { stk: "Stk", time: "Time", måned: "Måned", prosjekt: "Prosjekt" };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <h2 className="mb-4 text-lg font-semibold text-text">Kundeinformasjon</h2>
        <select
          value={leadId}
          onChange={(e) => setLeadId(e.target.value)}
          className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="">Ingen kunde (standalone tilbud)</option>
          {leads.map((l) => (
            <option key={l.id} value={l.id}>{l.name}</option>
          ))}
        </select>
      </Card>

      <Card>
        <h2 className="mb-4 text-lg font-semibold text-text">Produkter</h2>
        <div className="flex flex-wrap gap-3 mb-4">
          <select
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(e.target.value)}
            className="flex-1 min-w-[200px] rounded-lg border border-gray-200 px-4 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">Velg produkt...</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <input
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
            className="w-24 rounded-lg border border-gray-200 px-4 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <Button type="button" variant="secondary" onClick={addItem} disabled={!selectedProduct}>
            Legg til
          </Button>
        </div>

        {items.length > 0 && (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-text-light">
                <th className="pb-2 font-medium">Produkt</th>
                <th className="pb-2 font-medium">Antall</th>
                <th className="pb-2 font-medium">Enhet</th>
                <th className="pb-2 font-medium">Pris</th>
                <th className="pb-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {items.map((item, i) => (
                <tr key={i}>
                  <td className="py-2 text-text">{item.productName}</td>
                  <td className="py-2 text-text-light">{item.quantity}</td>
                  <td className="py-2 text-text-light">{unitLabels[item.productUnit] ?? item.productUnit}</td>
                  <td className="py-2 text-text-light">XX kr</td>
                  <td className="py-2 text-right">
                    <button onClick={() => removeItem(i)} className="text-red-500 hover:text-red-700">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-gray-200">
                <td colSpan={3} className="pt-3 text-right font-semibold text-text">Totalsum:</td>
                <td className="pt-3 font-semibold text-text">XX kr</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        )}
      </Card>

      <Card>
        <h2 className="mb-4 text-lg font-semibold text-text">Notater</h2>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Valgfrie notater..."
          rows={3}
          className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </Card>

      <div className="flex gap-3">
        <Button type="submit" disabled={saving || items.length === 0}>
          {saving ? "Oppretter..." : "Opprett tilbud"}
        </Button>
        <Button variant="ghost" type="button" onClick={() => router.back()}>
          Avbryt
        </Button>
      </div>
    </form>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/tilbud/ny/
git commit -m "feat: add create quote page with product selection"
```

---

## Task 9: Quote Detail Page + Status Actions

**Files:**
- Create: `src/app/tilbud/[id]/page.tsx`
- Create: `src/components/QuoteStatusActions.tsx`

- [ ] **Step 1: Create QuoteStatusActions component**

Create `src/components/QuoteStatusActions.tsx`:

```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export function QuoteStatusActions({ quoteId, status }: { quoteId: number; status: string }) {
  const router = useRouter();
  const [updating, setUpdating] = useState(false);

  async function updateStatus(newStatus: string) {
    setUpdating(true);
    try {
      await fetch(`/api/quotes/${quoteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      router.refresh();
    } finally {
      setUpdating(false);
    }
  }

  async function handleDuplicate() {
    setUpdating(true);
    try {
      const res = await fetch(`/api/quotes/${quoteId}/duplicate`, { method: "POST" });
      const newQuote = await res.json();
      router.push(`/tilbud/${newQuote.id}`);
    } finally {
      setUpdating(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Slett dette tilbudet?")) return;
    await fetch(`/api/quotes/${quoteId}`, { method: "DELETE" });
    router.push("/tilbud");
  }

  return (
    <div className="flex flex-wrap gap-2">
      {status === "utkast" && (
        <Button onClick={() => updateStatus("sendt")} disabled={updating}>
          Merk som sendt
        </Button>
      )}
      {status === "sendt" && (
        <>
          <Button onClick={() => updateStatus("akseptert")} disabled={updating}>
            Merk som akseptert
          </Button>
          <Button variant="danger" onClick={() => updateStatus("avvist")} disabled={updating}>
            Merk som avvist
          </Button>
        </>
      )}
      <Button variant="secondary" onClick={handleDuplicate} disabled={updating}>
        Dupliser
      </Button>
      {status === "utkast" && (
        <Button variant="ghost" onClick={handleDelete} disabled={updating}>
          Slett
        </Button>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create quote detail page**

Create `src/app/tilbud/[id]/page.tsx`:

```typescript
import { db } from "@/lib/db";
import { quotes, quoteItems, products, leads } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { QuoteStatusActions } from "@/components/QuoteStatusActions";
import { QuotePdfDownload } from "@/components/QuotePdfDownload";
import Link from "next/link";

export const dynamic = "force-dynamic";

const unitLabels: Record<string, string> = { stk: "Stk", time: "Time", måned: "Måned", prosjekt: "Prosjekt" };

export default async function TilbudDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const quote = await db.select().from(quotes).where(eq(quotes.id, parseInt(id))).get();
  if (!quote) notFound();

  const items = await db.select({
    id: quoteItems.id,
    productId: quoteItems.productId,
    quantity: quoteItems.quantity,
    sortOrder: quoteItems.sortOrder,
    productName: products.name,
    productDescription: products.description,
    productUnit: products.unit,
  })
    .from(quoteItems)
    .leftJoin(products, eq(quoteItems.productId, products.id))
    .where(eq(quoteItems.quoteId, quote.id))
    .orderBy(quoteItems.sortOrder)
    .all();

  let lead = null;
  if (quote.leadId) {
    lead = await db.select().from(leads).where(eq(leads.id, quote.leadId)).get();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/tilbud" className="text-text-light hover:text-text">&larr;</Link>
        <div>
          <h1 className="text-2xl font-bold text-text">{quote.quoteNumber}</h1>
          <p className="text-sm text-text-light">
            Opprettet {new Date(quote.createdAt).toLocaleDateString("nb-NO")}
          </p>
        </div>
        <Badge label={quote.status} className="ml-auto" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <h2 className="mb-4 text-lg font-semibold text-text">Produkter</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-text-light">
                  <th className="pb-3 font-medium">Produkt</th>
                  <th className="pb-3 font-medium">Antall</th>
                  <th className="pb-3 font-medium">Enhet</th>
                  <th className="pb-3 font-medium">Pris</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="py-3">
                      <div className="font-medium text-text">{item.productName}</div>
                      {item.productDescription && (
                        <div className="text-xs text-text-light">{item.productDescription}</div>
                      )}
                    </td>
                    <td className="py-3 text-text-light">{item.quantity}</td>
                    <td className="py-3 text-text-light">{unitLabels[item.productUnit ?? "stk"]}</td>
                    <td className="py-3 text-text-light">XX kr</td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-text-light">Ingen produkter lagt til</td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr className="border-t border-gray-200">
                  <td colSpan={3} className="pt-3 text-right font-semibold text-text">Totalsum:</td>
                  <td className="pt-3 font-semibold text-text">XX kr</td>
                </tr>
              </tfoot>
            </table>
          </Card>

          {quote.notes && (
            <Card>
              <h2 className="mb-2 text-lg font-semibold text-text">Notater</h2>
              <p className="text-sm text-text-light whitespace-pre-wrap">{quote.notes}</p>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card className="p-4">
            <h3 className="mb-3 text-sm font-semibold text-text">Handlinger</h3>
            <QuoteStatusActions quoteId={quote.id} status={quote.status} />
            <div className="mt-3">
              <QuotePdfDownload
                quoteNumber={quote.quoteNumber}
                createdAt={quote.createdAt}
                leadName={lead?.name}
                leadOrgNumber={lead?.orgNumber}
                leadAddress={lead ? [lead.address, lead.postalCode, lead.city].filter(Boolean).join(", ") : undefined}
                items={items.map((i) => ({
                  name: i.productName ?? "",
                  quantity: i.quantity,
                  unit: unitLabels[i.productUnit ?? "stk"],
                }))}
                notes={quote.notes}
              />
            </div>
          </Card>

          {lead && (
            <Card className="p-4">
              <h3 className="mb-2 text-sm font-semibold text-text">Kunde</h3>
              <Link href={`/leads/${lead.id}`} className="text-sm text-primary hover:underline">
                {lead.name}
              </Link>
              <div className="mt-1 text-xs text-text-light">{lead.orgNumber}</div>
              {lead.address && (
                <div className="mt-1 text-xs text-text-light">
                  {[lead.address, lead.postalCode, lead.city].filter(Boolean).join(", ")}
                </div>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/tilbud/[id]/ src/components/QuoteStatusActions.tsx
git commit -m "feat: add quote detail page with status actions"
```

---

## Task 10: PDF Download Component

**Files:**
- Create: `src/components/QuotePdfDownload.tsx`

- [ ] **Step 1: Install html2pdf.js**

Run:
```bash
cd argon-crm && npm install html2pdf.js
```

- [ ] **Step 2: Create QuotePdfDownload component**

Create `src/components/QuotePdfDownload.tsx`:

```typescript
"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/Button";

interface QuotePdfDownloadProps {
  quoteNumber: string;
  createdAt: string;
  leadName?: string;
  leadOrgNumber?: string;
  leadAddress?: string;
  items: { name: string; quantity: number; unit: string }[];
  notes?: string | null;
}

export function QuotePdfDownload({
  quoteNumber,
  createdAt,
  leadName,
  leadOrgNumber,
  leadAddress,
  items,
  notes,
}: QuotePdfDownloadProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  async function downloadPdf() {
    const html2pdf = (await import("html2pdf.js")).default;
    const element = contentRef.current;
    if (!element) return;

    element.style.display = "block";
    await html2pdf()
      .set({
        margin: [15, 15, 15, 15],
        filename: `tilbud-${quoteNumber}.pdf`,
        html2canvas: { scale: 2 },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      })
      .from(element)
      .save();
    element.style.display = "none";
  }

  return (
    <>
      <Button variant="secondary" onClick={downloadPdf}>
        Last ned PDF
      </Button>

      {/* Hidden PDF template */}
      <div ref={contentRef} style={{ display: "none", fontFamily: "Inter, sans-serif", color: "#1E293B", fontSize: "12px" }}>
        <div style={{ borderBottom: "2px solid #1E40AF", paddingBottom: "12px", marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <div style={{ fontSize: "24px", fontWeight: "bold", color: "#1E40AF" }}>Argon</div>
            <div style={{ fontSize: "10px", color: "#64748B", marginTop: "4px" }}>Tilbud</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontWeight: "bold" }}>{quoteNumber}</div>
            <div style={{ color: "#64748B" }}>
              {new Date(createdAt).toLocaleDateString("nb-NO", { day: "numeric", month: "long", year: "numeric" })}
            </div>
          </div>
        </div>

        {leadName && (
          <div style={{ marginBottom: "24px" }}>
            <div style={{ fontWeight: "bold", marginBottom: "4px" }}>Kunde</div>
            <div>{leadName}</div>
            {leadOrgNumber && <div style={{ color: "#64748B" }}>Org.nr: {leadOrgNumber}</div>}
            {leadAddress && <div style={{ color: "#64748B" }}>{leadAddress}</div>}
          </div>
        )}

        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "24px" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #E2E8F0" }}>
              <th style={{ textAlign: "left", padding: "8px 0", color: "#64748B", fontWeight: 500 }}>Produkt</th>
              <th style={{ textAlign: "left", padding: "8px 0", color: "#64748B", fontWeight: 500 }}>Antall</th>
              <th style={{ textAlign: "left", padding: "8px 0", color: "#64748B", fontWeight: 500 }}>Enhet</th>
              <th style={{ textAlign: "right", padding: "8px 0", color: "#64748B", fontWeight: 500 }}>Pris</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={i} style={{ borderBottom: "1px solid #F1F5F9" }}>
                <td style={{ padding: "8px 0" }}>{item.name}</td>
                <td style={{ padding: "8px 0" }}>{item.quantity}</td>
                <td style={{ padding: "8px 0" }}>{item.unit}</td>
                <td style={{ padding: "8px 0", textAlign: "right" }}>XX kr</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ borderTop: "2px solid #E2E8F0" }}>
              <td colSpan={3} style={{ padding: "12px 0", textAlign: "right", fontWeight: "bold" }}>Totalsum:</td>
              <td style={{ padding: "12px 0", textAlign: "right", fontWeight: "bold" }}>XX kr</td>
            </tr>
          </tfoot>
        </table>

        {notes && (
          <div>
            <div style={{ fontWeight: "bold", marginBottom: "4px" }}>Notater</div>
            <div style={{ color: "#64748B", whiteSpace: "pre-wrap" }}>{notes}</div>
          </div>
        )}
      </div>
    </>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/QuotePdfDownload.tsx package.json package-lock.json
git commit -m "feat: add PDF download for quotes using html2pdf.js"
```

---

## Task 11: Sidebar Navigation

**Files:**
- Modify: `src/components/Sidebar.tsx`

- [ ] **Step 1: Add Produkter and Tilbud to navItems**

In `src/components/Sidebar.tsx`, add two entries to `navItems` after the Dashboard entry (index 0):

```typescript
{ href: "/produkter", label: "Produkter", icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" },
{ href: "/tilbud", label: "Tilbud", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
```

The full `navItems` array should be:

```typescript
const navItems = [
  { href: "/", label: "Dashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0h4" },
  { href: "/produkter", label: "Produkter", icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" },
  { href: "/tilbud", label: "Tilbud", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
  { href: "/sok", label: "Søk bedrifter", icon: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" },
  { href: "/scrape-leads", label: "Auto-scrape", icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" },
  { href: "/jobber", label: "Jobber", icon: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" },
  { href: "/oppfolging", label: "Oppfølging", icon: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" },
];
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Sidebar.tsx
git commit -m "feat: add Produkter and Tilbud to sidebar navigation"
```

---

## Task 12: Lead Detail — Quote Integration

**Files:**
- Create: `src/components/LeadQuotes.tsx`
- Modify: `src/app/leads/[id]/page.tsx`

- [ ] **Step 1: Create LeadQuotes component**

Create `src/components/LeadQuotes.tsx`:

```typescript
import { Badge } from "@/components/ui/Badge";
import Link from "next/link";

interface LeadQuote {
  id: number;
  quoteNumber: string;
  status: string;
  createdAt: string;
}

export function LeadQuotes({ leadId, quotes }: { leadId: number; quotes: LeadQuote[] }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-text">Tilbud</h3>
        <Link
          href={`/tilbud/ny?leadId=${leadId}`}
          className="text-xs text-primary hover:underline"
        >
          + Nytt tilbud
        </Link>
      </div>
      {quotes.length > 0 ? (
        <div className="space-y-2">
          {quotes.map((q) => (
            <div key={q.id} className="flex items-center justify-between text-sm">
              <Link href={`/tilbud/${q.id}`} className="text-primary hover:underline">
                {q.quoteNumber}
              </Link>
              <div className="flex items-center gap-2">
                <Badge label={q.status} />
                <span className="text-xs text-text-light">
                  {new Date(q.createdAt).toLocaleDateString("nb-NO")}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-text-light">Ingen tilbud for denne kunden</p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Add LeadQuotes to lead detail page**

In `src/app/leads/[id]/page.tsx`:

Add import at the top:
```typescript
import { LeadQuotes } from "@/components/LeadQuotes";
import { quotes } from "@/lib/db/schema";
```

Add query after `leadActivities` fetch (around line 26):
```typescript
const leadQuotes = await db.select({
  id: quotes.id,
  quoteNumber: quotes.quoteNumber,
  status: quotes.status,
  createdAt: quotes.createdAt,
}).from(quotes).where(eq(quotes.leadId, lead.id)).orderBy(desc(quotes.createdAt)).all();
```

Add LeadQuotes card in the right sidebar column, after the FollowUpStatus card (after line 123):
```typescript
<Card className="p-4">
  <LeadQuotes leadId={lead.id} quotes={leadQuotes} />
</Card>
```

- [ ] **Step 3: Commit**

```bash
git add src/components/LeadQuotes.tsx src/app/leads/[id]/page.tsx
git commit -m "feat: add quote list and create button to lead detail page"
```

---

## Task 13: Verification

- [ ] **Step 1: Start the dev server and verify**

Run:
```bash
cd argon-crm && npm run dev
```

- [ ] **Step 2: Manual verification checklist**

1. Navigate to `/produkter` — create a product with name, description, unit
2. Navigate to `/tilbud/ny` — create a quote without a lead, add products
3. Verify redirect to `/tilbud/{id}` with items showing "XX kr"
4. Test status flow: click "Merk som sendt" → "Merk som akseptert"
5. Test "Dupliser" — verify new quote created with status "utkast"
6. Click "Last ned PDF" — verify PDF downloads with correct content
7. Navigate to `/tilbud` — verify quotes list shows all quotes
8. Create a lead, then navigate to lead detail → click "Nytt tilbud"
9. Verify quote appears in lead's "Tilbud" section
10. Check activity log on lead — should show "Tilbud QT-001 opprettet" etc.
11. Verify sidebar has "Produkter" and "Tilbud" links
