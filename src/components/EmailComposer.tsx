"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

interface Props {
  leadId: number;
  leadName: string;
  hasEmail: boolean;
}

export function EmailComposer({ leadId, leadName, hasEmail }: Props) {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");
  const [subject, setSubject] = useState("");
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleGenerate() {
    setGenerating(true);
    try {
      const res = await fetch("/api/email/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId, type: "initial" }),
      });
      const data = await res.json();
      setContent(data.content);
      setSubject(data.subject);
    } finally {
      setGenerating(false);
    }
  }

  async function handleSend() {
    if (!content.trim() || !subject.trim()) return;
    setSending(true);
    try {
      await fetch("/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId, content, subject }),
      });
      setSent(true);
      setTimeout(() => {
        setOpen(false);
        setSent(false);
        setContent("");
        setSubject("");
        window.location.reload();
      }, 1500);
    } finally {
      setSending(false);
    }
  }

  if (!hasEmail) return null;

  return (
    <>
      <Button onClick={() => { setOpen(true); handleGenerate(); }} variant="primary">
        Send e-post
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />
          <div className="relative max-h-[90vh] w-full overflow-y-auto rounded-t-xl bg-white p-5 shadow-xl sm:mx-4 sm:max-w-lg sm:rounded-xl sm:p-6">
            <h2 className="mb-4 text-lg font-semibold text-text">Send e-post til {leadName}</h2>

            {sent ? (
              <div className="py-8 text-center text-green-600 font-medium">E-post sendt!</div>
            ) : (
              <>
                <div className="mb-3">
                  <label className="mb-1 block text-sm text-text-light">Emne</label>
                  <input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder={generating ? "Genererer..." : "Emnelinje"}
                  />
                </div>

                <div className="mb-4">
                  <label className="mb-1 block text-sm text-text-light">Innhold</label>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={6}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder={generating ? "AI genererer utkast..." : "Skriv e-postinnhold..."}
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <Button variant="ghost" onClick={() => setOpen(false)}>Avbryt</Button>
                  <Button variant="secondary" onClick={handleGenerate} disabled={generating}>
                    {generating ? "Genererer..." : "Regenerer"}
                  </Button>
                  <Button onClick={handleSend} disabled={sending || !content.trim()}>
                    {sending ? "Sender..." : "Send"}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
