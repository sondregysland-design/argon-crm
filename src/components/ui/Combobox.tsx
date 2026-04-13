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

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && open) {
        setOpen(false);
        setSearch("");
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

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
