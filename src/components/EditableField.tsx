"use client";

import { useState, useRef, useEffect } from "react";

interface EditableFieldProps {
  leadId: number;
  field: string;
  value: string | number | null | undefined;
  label: string;
  type?: "text" | "url" | "number";
}

export function EditableField({ leadId, field, value, label, type = "text" }: EditableFieldProps) {
  const [editing, setEditing] = useState(false);
  const [currentValue, setCurrentValue] = useState(value != null ? String(value) : "");
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editing]);

  async function save() {
    const originalValue = value != null ? String(value) : "";
    if (currentValue === originalValue) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      let patchValue: string | number | null = currentValue || null;
      if (type === "number" && currentValue) {
        patchValue = parseInt(currentValue, 10);
        if (isNaN(patchValue)) patchValue = null;
      }
      await fetch(`/api/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: patchValue }),
      });
      setEditing(false);
    } catch {
      setCurrentValue(value != null ? String(value) : "");
    } finally {
      setSaving(false);
    }
  }

  function formatDisplay(): string {
    if (!currentValue) return "—";
    if (type === "number") {
      const num = parseInt(currentValue, 10);
      return isNaN(num) ? currentValue : num.toLocaleString("nb-NO") + " kr";
    }
    return currentValue;
  }

  return (
    <div>
      <dt className="text-text-light">{label}</dt>
      <dd className="flex items-center gap-2 font-medium text-text">
        {editing ? (
          <input
            ref={inputRef}
            type={type === "number" ? "number" : type === "url" ? "url" : "text"}
            value={currentValue}
            onChange={(e) => setCurrentValue(e.target.value)}
            onBlur={save}
            onKeyDown={(e) => {
              if (e.key === "Enter") save();
              if (e.key === "Escape") {
                setCurrentValue(value != null ? String(value) : "");
                setEditing(false);
              }
            }}
            disabled={saving}
            placeholder={type === "url" ? "https://..." : undefined}
            className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        ) : (
          <>
            {type === "url" && currentValue ? (
              <a
                href={currentValue}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-primary hover:underline"
              >
                <span className="truncate max-w-[200px]">{currentValue.replace(/^https?:\/\//, "")}</span>
                <svg className="h-3 w-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            ) : (
              <span>{formatDisplay()}</span>
            )}
            <button
              onClick={() => setEditing(true)}
              className="text-text-light opacity-0 transition group-hover:opacity-100 hover:text-primary"
              title={`Rediger ${label.toLowerCase()}`}
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
          </>
        )}
      </dd>
    </div>
  );
}
