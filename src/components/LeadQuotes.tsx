import { Badge } from "@/components/ui/Badge";
import Link from "next/link";

interface LeadQuote {
  id: number;
  quoteNumber: string;
  status: string;
  createdAt: string;
}

export function LeadQuotes({ leadId, quotes }: { leadId: number; quotes: LeadQuote[] }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-text">Tilbud</h3>
        <Link
          href={`/tilbud/ny?leadId=${leadId}`}
          className="text-xs text-primary hover:underline"
        >
          + Nytt tilbud
        </Link>
      </div>
      {quotes.length > 0 ? (
        <div className="space-y-2">
          {quotes.map((q) => (
            <div key={q.id} className="flex items-center justify-between text-sm">
              <Link href={`/tilbud/${q.id}`} className="text-primary hover:underline">
                {q.quoteNumber}
              </Link>
              <div className="flex items-center gap-2">
                <Badge label={q.status} />
                <span className="text-xs text-text-light">
                  {new Date(q.createdAt).toLocaleDateString("nb-NO")}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-text-light">Ingen tilbud for denne kunden</p>
      )}
    </div>
  );
}
