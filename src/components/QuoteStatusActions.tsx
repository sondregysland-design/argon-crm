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
