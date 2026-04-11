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
  productPrice: number | null;
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
      { productId: product.id, productName: product.name, productUnit: product.unit, productPrice: product.price ?? null, quantity },
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
                  <td className="py-2 text-text-light">
                    {item.productPrice != null
                      ? `${(item.productPrice * item.quantity).toLocaleString("nb-NO")} kr`
                      : "—"}
                  </td>
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
                <td className="pt-3 font-semibold text-text">
                  {items.every((i) => i.productPrice != null)
                    ? `${items.reduce((sum, i) => sum + (i.productPrice ?? 0) * i.quantity, 0).toLocaleString("nb-NO")} kr`
                    : "—"}
                </td>
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
