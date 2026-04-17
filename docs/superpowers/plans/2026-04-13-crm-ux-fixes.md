# CRM UX Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the 6 highest-impact UX problems identified in the site review of argon-crm-live.vercel.app, while preserving all existing data.

**Architecture:** All changes are client-side UI improvements. No schema changes, no data migrations. New reusable UI primitives (Combobox, ConfirmDialog) go in `src/components/ui/`. Utility functions go in `src/lib/utils.ts`.

**Tech Stack:** Next.js 16 / React 19 / Tailwind CSS 4 / TypeScript 5

**CRM source directory:** `/c/Users/sondr/Google/argon-crm/`

---

### Task 1: Searchable Combobox for NACE Codes

The NACE dropdown has 78 options in a plain `<select>`. Users must scroll through all of them. Build a searchable combobox and replace the NACE selects on the search and scrape pages.

**Files:**
- Create: `src/components/ui/Combobox.tsx`
- Modify: `src/components/SearchFilters.tsx`
- Modify: `src/components/ScrapeConfig.tsx`

- [ ] **Step 1: Create the Combobox component**

```tsx
// src/components/ui/Combobox.tsx
"use client";

import { useState, useRef, useEffect } from "react";

interface ComboboxOption {
  value: string;
  label: string;
}

interface ComboboxProps {
  name: string;
  options: ComboboxOption[];
  placeholder?: string;
  className?: string;
}

export function Combobox({ name, options, placeholder = "Søk...", className = "" }: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(options[0] ?? { value: "", label: "" });
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = search
    ? options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()))
    : options;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelect(option: ComboboxOption) {
    setSelected(option);
    setOpen(false);
    setSearch("");
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <input type="hidden" name={name} value={selected.value} />
      <button
        type="button"
        onClick={() => {
          setOpen(!open);
          if (!open) setTimeout(() => inputRef.current?.focus(), 0);
        }}
        className="flex w-full items-center justify-between rounded-lg border border-gray-200 px-4 py-2.5 text-left text-sm transition focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
      >
        <span className={selected.value ? "text-text" : "text-text-light"}>
          {selected.label || placeholder}
        </span>
        <svg className={`ml-2 h-4 w-4 shrink-0 text-text-light transition ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg">
          <div className="p-2">
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={placeholder}
              className="w-full rounded border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <ul className="max-h-60 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-4 py-2 text-sm text-text-light">Ingen treff</li>
            ) : (
              filtered.map((o) => (
                <li key={o.value}>
                  <button
                    type="button"
                    onClick={() => handleSelect(o)}
                    className={`w-full px-4 py-2 text-left text-sm transition hover:bg-gray-50 ${
                      o.value === selected.value ? "bg-primary/5 font-medium text-primary" : "text-text"
                    }`}
                  >
                    {o.label}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Replace NACE select in SearchFilters**

In `src/components/SearchFilters.tsx`, replace the NACE `<Select>` with the new Combobox:

```tsx
// Replace import
import { Combobox } from "@/components/ui/Combobox";

// Replace the NACE <Select> block (the div with "Bransje (NACE)" label):
<div className="w-full sm:w-64">
  <label className="mb-1 block text-sm font-medium text-text">Bransje (NACE)</label>
  <Combobox name="naeringskode" options={NACE_CODES} placeholder="Søk bransje..." />
</div>
```

- [ ] **Step 3: Replace NACE select in ScrapeConfig**

In `src/components/ScrapeConfig.tsx`, same replacement:

```tsx
// Add import
import { Combobox } from "@/components/ui/Combobox";

// Replace the NACE <Select> block:
<div className="w-full sm:w-64">
  <label className="mb-1 block text-sm font-medium text-text">Bransje (NACE)</label>
  <Combobox name="naeringskode" options={NACE_CODES} placeholder="Søk bransje..." />
</div>
```

- [ ] **Step 4: Verify build compiles**

Run: `cd /c/Users/sondr/Google/argon-crm && npx next build 2>&1 | tail -20`
Expected: Build succeeds

- [ ] **Step 5: Commit**

```bash
cd /c/Users/sondr/Google/argon-crm
git add src/components/ui/Combobox.tsx src/components/SearchFilters.tsx src/components/ScrapeConfig.tsx
git commit -m "feat: add searchable combobox for NACE code selection"
```

---

### Task 2: Confirmation Modal for "Slett alle"

The current `confirm()` is a browser native dialog. Replace with a proper modal that makes the destructive action feel weighty. Reuse for any future destructive actions.

**Files:**
- Create: `src/components/ui/ConfirmDialog.tsx`
- Modify: `src/components/KanbanBoard.tsx`

- [ ] **Step 1: Create the ConfirmDialog component**

```tsx
// src/components/ui/ConfirmDialog.tsx
"use client";

import { useRef, useEffect } from "react";
import { Button } from "@/components/ui/Button";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ open, title, description, confirmLabel = "Slett", onConfirm, onCancel }: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  if (!open) return null;

  return (
    <dialog
      ref={dialogRef}
      onClose={onCancel}
      className="fixed inset-0 z-50 m-auto w-full max-w-sm rounded-xl border border-gray-200 bg-white p-0 shadow-xl backdrop:bg-black/30"
    >
      <div className="p-6">
        <h3 className="text-lg font-semibold text-text">{title}</h3>
        <p className="mt-2 text-sm text-text-light">{description}</p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" onClick={onCancel}>Avbryt</Button>
          <Button variant="danger" onClick={onConfirm}>{confirmLabel}</Button>
        </div>
      </div>
    </dialog>
  );
}
```

- [ ] **Step 2: Use ConfirmDialog in KanbanBoard**

Replace `confirm()` in `src/components/KanbanBoard.tsx`:

```tsx
"use client";

import { useState } from "react";
import { DndContext, DragEndEvent, closestCorners, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { KanbanColumn } from "@/components/KanbanColumn";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { Lead } from "@/lib/db/schema";

const STAGES = ["ny", "kontaktet", "kvalifisert", "kunde"] as const;

export function KanbanBoard({ initialLeads }: { initialLeads: Lead[] }) {
  const [leads, setLeads] = useState(initialLeads);
  const [deleteStage, setDeleteStage] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const deleteCount = deleteStage ? leads.filter((l) => l.stage === deleteStage).length : 0;

  function moveLead(leadId: number, newStage: string) {
    const lead = leads.find((l) => l.id === leadId);
    if (!lead || lead.stage === newStage) return;

    setLeads((prev) => prev.map((l) => l.id === leadId ? { ...l, stage: newStage as typeof STAGES[number] } : l));

    fetch("/api/pipeline", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadId, newStage, newOrder: 0 }),
    }).catch(() => {
      setLeads((prev) => prev.map((l) => l.id === leadId ? { ...l, stage: lead.stage } : l));
    });
  }

  async function confirmDeleteAll() {
    if (!deleteStage) return;
    const stageLeads = leads.filter((l) => l.stage === deleteStage);
    setLeads((prev) => prev.filter((l) => l.stage !== deleteStage));
    setDeleteStage(null);
    for (const lead of stageLeads) {
      await fetch(`/api/leads/${lead.id}`, { method: "DELETE" }).catch(() => {});
    }
  }

  function deleteLead(leadId: number) {
    setLeads((prev) => prev.filter((l) => l.id !== leadId));
    fetch(`/api/leads/${leadId}`, { method: "DELETE" }).catch(() => {});
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    const leadId = active.id as number;
    const newStage = over.id as typeof STAGES[number];
    if (!STAGES.includes(newStage)) return;
    moveLead(leadId, newStage);
  }

  return (
    <>
      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
          {STAGES.map((stage) => (
            <KanbanColumn
              key={stage}
              stage={stage}
              leads={leads.filter((l) => l.stage === stage)}
              onDeleteAll={stage === "ny" ? () => setDeleteStage("ny") : undefined}
              onMoveLead={moveLead}
              onDeleteLead={deleteLead}
            />
          ))}
        </div>
      </DndContext>
      <ConfirmDialog
        open={deleteStage !== null}
        title="Slett alle leads"
        description={`Er du sikker på at du vil slette ${deleteCount} leads fra «Ny»-kolonnen? Denne handlingen kan ikke angres.`}
        confirmLabel={`Slett ${deleteCount} leads`}
        onConfirm={confirmDeleteAll}
        onCancel={() => setDeleteStage(null)}
      />
    </>
  );
}
```

- [ ] **Step 3: Verify build compiles**

Run: `cd /c/Users/sondr/Google/argon-crm && npx next build 2>&1 | tail -20`
Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
cd /c/Users/sondr/Google/argon-crm
git add src/components/ui/ConfirmDialog.tsx src/components/KanbanBoard.tsx
git commit -m "feat: replace browser confirm with proper modal for delete-all"
```

---

### Task 3: Human-Readable Cron Expressions

The jobs page shows raw cron expressions like `0 3 * * 1`. Translate to Norwegian human-readable text.

**Files:**
- Modify: `src/lib/utils.ts`
- Modify: `src/components/JobStatusTable.tsx`

- [ ] **Step 1: Read current utils.ts**

Read `src/lib/utils.ts` to see existing exports.

- [ ] **Step 2: Add cronToHuman utility**

Append to `src/lib/utils.ts`:

```ts
const WEEKDAYS: Record<string, string> = {
  "0": "søndager", "1": "mandager", "2": "tirsdager", "3": "onsdager",
  "4": "torsdager", "5": "fredager", "6": "lørdager", "7": "søndager",
};

export function cronToHuman(cron: string): string {
  const parts = cron.trim().split(/\s+/);
  if (parts.length !== 5) return cron;
  const [minute, hour, dayOfMonth, , dayOfWeek] = parts;

  const time = `${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`;

  if (dayOfWeek !== "*" && dayOfMonth === "*") {
    return `Hver ${WEEKDAYS[dayOfWeek] ?? `dag ${dayOfWeek}`} kl. ${time}`;
  }
  if (dayOfMonth !== "*") {
    return `Den ${dayOfMonth}. hver måned kl. ${time}`;
  }
  return `Daglig kl. ${time}`;
}
```

- [ ] **Step 3: Use cronToHuman in JobStatusTable**

In `src/components/JobStatusTable.tsx`, import and use:

```tsx
// Add import at top
import { cronToHuman } from "@/lib/utils";

// Replace the cron cell (line ~99-101):
// Old: {job.cronExpression}
// New:
<td className="hidden px-4 py-3 text-text-light text-xs sm:table-cell">
  {job.cronExpression ? cronToHuman(job.cronExpression) : "—"}
</td>
```

Remove the `font-mono` class from that `<td>` since it's now human text.

- [ ] **Step 4: Verify build compiles**

Run: `cd /c/Users/sondr/Google/argon-crm && npx next build 2>&1 | tail -20`

- [ ] **Step 5: Commit**

```bash
cd /c/Users/sondr/Google/argon-crm
git add src/lib/utils.ts src/components/JobStatusTable.tsx
git commit -m "feat: show human-readable cron schedule in job status table"
```

---

### Task 4: Dashboard Search/Filter

Add a search bar above the Kanban board so users can quickly find leads by name.

**Files:**
- Modify: `src/components/KanbanBoard.tsx`

- [ ] **Step 1: Add search state and filter logic**

In the `KanbanBoard` component (after the fix from Task 2), add a search input and filter leads:

Add a `search` state:
```tsx
const [search, setSearch] = useState("");
```

Add filtered leads computation:
```tsx
const filteredLeads = search
  ? leads.filter((l) => l.name.toLowerCase().includes(search.toLowerCase()) ||
      (l.city ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (l.summary ?? "").toLowerCase().includes(search.toLowerCase()))
  : leads;
```

Add search input above the grid:
```tsx
<div className="mb-4">
  <input
    type="text"
    value={search}
    onChange={(e) => setSearch(e.target.value)}
    placeholder="Søk leads..."
    className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm transition focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:max-w-xs"
  />
</div>
```

Change `leads.filter((l) => l.stage === stage)` to `filteredLeads.filter((l) => l.stage === stage)` in the KanbanColumn rendering.

Also update `deleteCount` to use `leads` (not `filteredLeads`) so the count is accurate.

- [ ] **Step 2: Verify build compiles**

Run: `cd /c/Users/sondr/Google/argon-crm && npx next build 2>&1 | tail -20`

- [ ] **Step 3: Commit**

```bash
cd /c/Users/sondr/Google/argon-crm
git add src/components/KanbanBoard.tsx
git commit -m "feat: add search filter to dashboard kanban board"
```

---

### Task 5: Condense Empty Fields on Lead Detail

The lead detail page shows "—" for many empty fields, creating noise. Conditionally hide fields that have no data, keeping editable fields always visible.

**Files:**
- Modify: `src/app/leads/[id]/page.tsx`

- [ ] **Step 1: Filter static info fields**

In the `Bedriftsinformasjon` card, change the static fields array to filter out empty ones:

```tsx
{[
  ["Bransje", lead.industryName],
  ["NACE-kode", lead.industryCode],
  ["Adresse", [lead.address, lead.postalCode, lead.city].filter(Boolean).join(", ")],
  ["Kommune", lead.kommune],
].filter(([, value]) => value).map(([label, value]) => (
  <div key={label as string}>
    <dt className="text-text-light">{label}</dt>
    <dd className="font-medium text-text">{value}</dd>
  </div>
))}
```

Note: Keep editable fields (email, contactPerson) always visible since users need to fill them in.

Also filter the second static block:

```tsx
{[
  ["Ansatte", lead.employees?.toString()],
  ["Stiftet", lead.foundedDate],
].filter(([, value]) => value).map(([label, value]) => (
  <div key={label as string}>
    <dt className="text-text-light">{label}</dt>
    <dd className="font-medium text-text">{value}</dd>
  </div>
))}
```

And for website/phone — wrap them conditionally:

```tsx
{(lead.website || lead.googleWebsite) && (
  <div>
    <dt className="text-text-light">Nettside</dt>
    <dd className="font-medium text-text">
      <a href={lead.website || lead.googleWebsite || ""} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
        {(lead.website || lead.googleWebsite || "").replace(/^https?:\/\//, "")}
      </a>
    </dd>
  </div>
)}
{(lead.phone || lead.googlePhone) && (
  <div>
    <dt className="text-text-light">Telefon</dt>
    <dd className="font-medium text-text">{lead.phone || lead.googlePhone}</dd>
  </div>
)}
```

- [ ] **Step 2: Verify build compiles**

Run: `cd /c/Users/sondr/Google/argon-crm && npx next build 2>&1 | tail -20`

- [ ] **Step 3: Commit**

```bash
cd /c/Users/sondr/Google/argon-crm
git add src/app/leads/\\[id\\]/page.tsx
git commit -m "feat: hide empty fields on lead detail to reduce noise"
```

---

### Task 6: Oppfølging Error Handling

The Oppfølging page only shows "Laster..." with no error state. If the API fails, users see an infinite loading spinner. Add proper error handling.

**Files:**
- Modify: `src/app/oppfolging/page.tsx`

- [ ] **Step 1: Add error state**

Add an `error` state and catch API failures:

```tsx
const [error, setError] = useState<string | null>(null);

// Replace the useEffect:
useEffect(() => {
  fetch("/api/email/pending")
    .then((r) => {
      if (!r.ok) throw new Error(`Feil: ${r.status}`);
      return r.json();
    })
    .then(setPending)
    .catch((e) => setError(e.message))
    .finally(() => setLoading(false));
}, []);
```

Add error display in the JSX, after the loading check:

```tsx
{loading ? (
  <div className="text-text-light">Laster...</div>
) : error ? (
  <Card>
    <div className="py-8 text-center">
      <p className="text-red-600">{error}</p>
      <button
        onClick={() => {
          setError(null);
          setLoading(true);
          fetch("/api/email/pending")
            .then((r) => {
              if (!r.ok) throw new Error(`Feil: ${r.status}`);
              return r.json();
            })
            .then(setPending)
            .catch((e) => setError(e.message))
            .finally(() => setLoading(false));
        }}
        className="mt-3 text-sm text-primary hover:underline"
      >
        Prøv igjen
      </button>
    </div>
  </Card>
) : pending.length === 0 ? (
  // ... rest unchanged
```

- [ ] **Step 2: Verify build compiles**

Run: `cd /c/Users/sondr/Google/argon-crm && npx next build 2>&1 | tail -20`

- [ ] **Step 3: Commit**

```bash
cd /c/Users/sondr/Google/argon-crm
git add src/app/oppfolging/page.tsx
git commit -m "feat: add error state and retry to oppfølging page"
```
