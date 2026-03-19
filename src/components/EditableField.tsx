"use client";

import { useState, useRef, useEffect } from "react";

interface EditableFieldProps {
  leadId: number;
  field: string;
  value: string | null | undefined;
  label: string;
}

export function EditableField({ leadId, field, value, label }: EditableFieldProps) {
  const [editing, setEditing] = useState(false);
  const [currentValue, setCurrentValue] = useState(value || "");
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editing]);

  async function save() {
    if (currentValue === (value || "")) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      await fetch(`/api/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: currentValue || null }),
      });
      setEditing(false);
    } catch {
      setCurrentValue(value || "");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <dt className="text-text-light">{label}</dt>
      <dd className="flex items-center gap-2 font-medium text-text">
        {editing ? (
          <input
            ref={inputRef}
            type="text"
            value={currentValue}
            onChange={(e) => setCurrentValue(e.target.value)}
            onBlur={save}
            onKeyDown={(e) => {
              if (e.key === "Enter") save();
              if (e.key === "Escape") {
                setCurrentValue(value || "");
                setEditing(false);
              }
            }}
            disabled={saving}
            className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        ) : (
          <>
            <span>{currentValue || "—"}</span>
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
