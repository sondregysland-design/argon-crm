"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

interface PendingItem {
  id: number;
  generatedContent: string;
  createdAt: string;
  subject: string;
  followUpCount: number;
  leadId: number;
  leadName: string;
  contactPerson: string | null;
  email: string;
}

export default function OppfolgingPage() {
  const [pending, setPending] = useState<PendingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editedContent, setEditedContent] = useState("");
  const [processing, setProcessing] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/email/pending")
      .then((r) => r.json())
      .then(setPending)
      .finally(() => setLoading(false));
  }, []);

  async function handleAction(id: number, action: "approve" | "reject") {
    setProcessing(id);
    try {
      const res = await fetch(`/api/email/pending/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          editedContent: editingId === id ? editedContent : undefined,
        }),
      });
      if (!res.ok) {
        alert(`Handling feilet: ${res.statusText}`);
        return;
      }
      setPending((prev) => prev.filter((p) => p.id !== id));
      setEditingId(null);
    } finally {
      setProcessing(null);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-text">Oppfølging</h1>

      {loading ? (
        <div className="text-text-light">Laster...</div>
      ) : pending.length === 0 ? (
        <Card>
          <div className="py-8 text-center text-text-light">
            Ingen ventende oppfølginger
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {pending.map((item) => (
            <Card key={item.id}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <Link href={`/leads/${item.leadId}`} className="font-semibold text-text hover:text-primary">
                    {item.leadName}
                  </Link>
                  <div className="text-sm text-text-light">
                    {item.contactPerson ?? item.email} &middot; Oppfølging #{item.followUpCount + 1}
                  </div>
                </div>
                <div className="text-xs text-text-light">
                  {new Date(item.createdAt).toLocaleDateString("nb-NO")}
                </div>
              </div>

              <div className="mb-3 text-sm text-text-light">Re: {item.subject}</div>

              {editingId === item.id ? (
                <textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  rows={4}
                  className="mb-3 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              ) : (
                <div className="mb-3 rounded-lg bg-gray-50 p-3 text-sm text-text whitespace-pre-wrap">
                  {item.generatedContent}
                </div>
              )}

              <div className="flex gap-2 justify-end">
                {editingId === item.id ? (
                  <Button variant="ghost" onClick={() => setEditingId(null)}>Avbryt redigering</Button>
                ) : (
                  <Button
                    variant="ghost"
                    onClick={() => { setEditingId(item.id); setEditedContent(item.generatedContent); }}
                  >
                    Rediger
                  </Button>
                )}
                <Button
                  variant="danger"
                  onClick={() => handleAction(item.id, "reject")}
                  disabled={processing === item.id}
                >
                  Avvis
                </Button>
                <Button
                  onClick={() => handleAction(item.id, "approve")}
                  disabled={processing === item.id}
                >
                  {processing === item.id ? "Sender..." : "Godkjenn & send"}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
