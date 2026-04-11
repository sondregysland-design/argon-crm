"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { PRODUCT_UNITS } from "@/lib/constants";

export function ProductForm({ onCreated }: { onCreated: (product: any) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [unit, setUnit] = useState("stk");
  const [price, setPrice] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, unit, price: price ? parseInt(price) : null }),
      });
      const product = await res.json();
      onCreated(product);
      setName("");
      setDescription("");
      setUnit("stk");
      setPrice("");
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
      <input
        type="number"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        placeholder="Pris (kr)"
        min="0"
        className="w-28 rounded-lg border border-gray-200 px-4 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
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
