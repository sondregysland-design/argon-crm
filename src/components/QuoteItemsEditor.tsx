"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

type Product = {
  id: number;
  name: string;
};

type QuoteItem = {
  id: number;
  productName: string | null;
};

export function QuoteItemsEditor({
  quoteId,
  products,
  items,
}: {
  quoteId: number;
  products: Product[];
  items: QuoteItem[];
}) {
  const router = useRouter();
  const [productId, setProductId] = useState<number | "">(products[0]?.id ?? "");
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);

  async function handleAdd() {
    if (!productId) return;
    setLoading(true);
    try {
      await fetch(`/api/quotes/${quoteId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity }),
      });
      setQuantity(1);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function handleRemove(itemId: number) {
    setLoading(true);
    try {
      await fetch(`/api/quotes/${quoteId}/items/${itemId}`, {
        method: "DELETE",
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Delete buttons on existing items */}
      {items.length > 0 && (
        <div className="space-y-1">
          {items.map((item) => (
            <div key={item.id} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm">
              <span className="text-text">{item.productName ?? "Ukjent produkt"}</span>
              <button
                onClick={() => handleRemove(item.id)}
                disabled={loading}
                className="text-xs text-red-600 hover:text-red-800 disabled:opacity-50"
              >
                Fjern
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add new item */}
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <label className="mb-1 block text-xs font-medium text-text-light">Produkt</label>
          <select
            value={productId}
            onChange={(e) => setProductId(e.target.value ? parseInt(e.target.value) : "")}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-text focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="" disabled>Velg produkt</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
        <div className="w-20">
          <label className="mb-1 block text-xs font-medium text-text-light">Antall</label>
          <input
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-text focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <Button onClick={handleAdd} disabled={loading || !productId}>
          Legg til
        </Button>
      </div>
    </div>
  );
}
