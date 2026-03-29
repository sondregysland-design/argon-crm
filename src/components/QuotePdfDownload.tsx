"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/Button";

interface QuotePdfDownloadProps {
  quoteNumber: string;
  createdAt: string;
  leadName?: string;
  leadOrgNumber?: string;
  leadAddress?: string;
  items: { name: string; quantity: number; unit: string }[];
  notes?: string | null;
}

export function QuotePdfDownload({
  quoteNumber,
  createdAt,
  leadName,
  leadOrgNumber,
  leadAddress,
  items,
  notes,
}: QuotePdfDownloadProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  async function downloadPdf() {
    const html2pdf = (await import("html2pdf.js")).default;
    const element = contentRef.current;
    if (!element) return;

    element.style.display = "block";
    await html2pdf()
      .set({
        margin: [15, 15, 15, 15],
        filename: `tilbud-${quoteNumber}.pdf`,
        html2canvas: { scale: 2 },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      })
      .from(element)
      .save();
    element.style.display = "none";
  }

  return (
    <>
      <Button variant="secondary" onClick={downloadPdf}>
        Last ned PDF
      </Button>

      {/* Hidden PDF template */}
      <div ref={contentRef} style={{ display: "none", fontFamily: "Inter, sans-serif", color: "#1E293B", fontSize: "12px" }}>
        <div style={{ borderBottom: "2px solid #1E40AF", paddingBottom: "12px", marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <div style={{ fontSize: "24px", fontWeight: "bold", color: "#1E40AF" }}>Argon</div>
            <div style={{ fontSize: "10px", color: "#64748B", marginTop: "4px" }}>Tilbud</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontWeight: "bold" }}>{quoteNumber}</div>
            <div style={{ color: "#64748B" }}>
              {new Date(createdAt).toLocaleDateString("nb-NO", { day: "numeric", month: "long", year: "numeric" })}
            </div>
          </div>
        </div>

        {leadName && (
          <div style={{ marginBottom: "24px" }}>
            <div style={{ fontWeight: "bold", marginBottom: "4px" }}>Kunde</div>
            <div>{leadName}</div>
            {leadOrgNumber && <div style={{ color: "#64748B" }}>Org.nr: {leadOrgNumber}</div>}
            {leadAddress && <div style={{ color: "#64748B" }}>{leadAddress}</div>}
          </div>
        )}

        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "24px" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #E2E8F0" }}>
              <th style={{ textAlign: "left", padding: "8px 0", color: "#64748B", fontWeight: 500 }}>Produkt</th>
              <th style={{ textAlign: "left", padding: "8px 0", color: "#64748B", fontWeight: 500 }}>Antall</th>
              <th style={{ textAlign: "left", padding: "8px 0", color: "#64748B", fontWeight: 500 }}>Enhet</th>
              <th style={{ textAlign: "right", padding: "8px 0", color: "#64748B", fontWeight: 500 }}>Pris</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={i} style={{ borderBottom: "1px solid #F1F5F9" }}>
                <td style={{ padding: "8px 0" }}>{item.name}</td>
                <td style={{ padding: "8px 0" }}>{item.quantity}</td>
                <td style={{ padding: "8px 0" }}>{item.unit}</td>
                <td style={{ padding: "8px 0", textAlign: "right" }}>XX kr</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ borderTop: "2px solid #E2E8F0" }}>
              <td colSpan={3} style={{ padding: "12px 0", textAlign: "right", fontWeight: "bold" }}>Totalsum:</td>
              <td style={{ padding: "12px 0", textAlign: "right", fontWeight: "bold" }}>XX kr</td>
            </tr>
          </tfoot>
        </table>

        {notes && (
          <div>
            <div style={{ fontWeight: "bold", marginBottom: "4px" }}>Notater</div>
            <div style={{ color: "#64748B", whiteSpace: "pre-wrap" }}>{notes}</div>
          </div>
        )}
      </div>
    </>
  );
}
