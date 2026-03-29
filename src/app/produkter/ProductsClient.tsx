"use client";

import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { ProductForm } from "@/components/ProductForm";
import type { Product } from "@/lib/db/schema";

const unitLabels: Record<string, string> = {
  stk: "Stk",
  time: "Time",
  måned: "Måned",
  prosjekt: "Prosjekt",
};

const unitOptions = ["stk", "time", "måned", "prosjekt"] as const;

function EditableCell({
  productId,
  field,
  value,
  onUpdated,
  displayValue,
}: {
  productId: number;
  field: string;
  value: string;
  onUpdated: (product: Product) => void;
  displayValue?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [currentValue, setCurrentValue] = useState(value);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setCurrentValue(value);
  }, [value]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  async function save() {
    if (currentValue === value) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: currentValue || null }),
      });
      if (res.ok) {
        const updated = await res.json();
        onUpdated(updated);
      } else {
        setCurrentValue(value);
      }
    } catch {
      setCurrentValue(value);
    } finally {
      setSaving(false);
      setEditing(false);
    }
  }

  function cancel() {
    setCurrentValue(value);
    setEditing(false);
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={currentValue}
        onChange={(e) => setCurrentValue(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => {
          if (e.key === "Enter") save();
          if (e.key === "Escape") cancel();
        }}
        disabled={saving}
        className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
      />
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <span>{displayValue ?? (currentValue || "—")}</span>
      <button
        onClick={() => setEditing(true)}
        className="text-text-light opacity-0 transition group-hover:opacity-100 hover:text-primary"
        title={`Rediger ${field}`}
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
      </button>
    </div>
  );
}

function EditableUnitCell({
  productId,
  value,
  onUpdated,
}: {
  productId: number;
  value: string;
  onUpdated: (product: Product) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [currentValue, setCurrentValue] = useState(value);
  const [saving, setSaving] = useState(false);
  const selectRef = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    setCurrentValue(value);
  }, [value]);

  useEffect(() => {
    if (editing && selectRef.current) {
      selectRef.current.focus();
    }
  }, [editing]);

  async function save(newValue: string) {
    if (newValue === value) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ unit: newValue }),
      });
      if (res.ok) {
        const updated = await res.json();
        onUpdated(updated);
      } else {
        setCurrentValue(value);
      }
    } catch {
      setCurrentValue(value);
    } finally {
      setSaving(false);
      setEditing(false);
    }
  }

  if (editing) {
    return (
      <select
        ref={selectRef}
        value={currentValue}
        onChange={(e) => {
          setCurrentValue(e.target.value);
          save(e.target.value);
        }}
        onBlur={() => setEditing(false)}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            setCurrentValue(value);
            setEditing(false);
          }
        }}
        disabled={saving}
        className="rounded border border-gray-300 px-2 py-1 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
      >
        {unitOptions.map((u) => (
          <option key={u} value={u}>
            {unitLabels[u]}
          </option>
        ))}
      </select>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <span>{unitLabels[currentValue] ?? currentValue}</span>
      <button
        onClick={() => setEditing(true)}
        className="text-text-light opacity-0 transition group-hover:opacity-100 hover:text-primary"
        title="Rediger enhet"
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
      </button>
    </div>
  );
}

export function ProductsClient({ initialProducts }: { initialProducts: Product[] }) {
  const [productList, setProductList] = useState(initialProducts);

  function handleUpdated(updated: Product) {
    setProductList((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  }

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
                <td className="py-3 font-medium text-text">
                  <EditableCell
                    productId={p.id}
                    field="name"
                    value={p.name}
                    onUpdated={handleUpdated}
                  />
                </td>
                <td className="py-3 text-text-light">
                  <EditableCell
                    productId={p.id}
                    field="description"
                    value={p.description || ""}
                    onUpdated={handleUpdated}
                  />
                </td>
                <td className="py-3 text-text-light">
                  <EditableUnitCell
                    productId={p.id}
                    value={p.unit}
                    onUpdated={handleUpdated}
                  />
                </td>
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
