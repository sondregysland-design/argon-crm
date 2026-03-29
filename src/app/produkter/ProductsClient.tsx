"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ProductForm } from "@/components/ProductForm";
import type { Product } from "@/lib/db/schema";

const unitLabels: Record<string, string> = {
  stk: "Stk",
  time: "Time",
  m\u00e5ned: "M\u00e5ned",
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
                <td className="py-3 text-text-light">{p.description || "\u2014"}</td>
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
                  Ingen produkter enda. Legg til det f\u00f8rste!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
