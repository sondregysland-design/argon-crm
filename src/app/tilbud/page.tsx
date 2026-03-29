import { db } from "@/lib/db";
import { quotes, leads } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function TilbudPage() {
  const allQuotes = await db.select({
    id: quotes.id,
    quoteNumber: quotes.quoteNumber,
    leadId: quotes.leadId,
    leadName: leads.name,
    status: quotes.status,
    createdAt: quotes.createdAt,
  })
    .from(quotes)
    .leftJoin(leads, eq(quotes.leadId, leads.id))
    .orderBy(desc(quotes.createdAt))
    .all();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text">Tilbud</h1>
        <Link
          href="/tilbud/ny"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-dark"
        >
          + Nytt tilbud
        </Link>
      </div>

      <Card>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-text-light">
              <th className="pb-3 font-medium">Nummer</th>
              <th className="pb-3 font-medium">Kunde</th>
              <th className="pb-3 font-medium">Status</th>
              <th className="pb-3 font-medium">Dato</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {allQuotes.map((q) => (
              <tr key={q.id} className="group hover:bg-gray-50">
                <td className="py-3">
                  <Link href={`/tilbud/${q.id}`} className="font-medium text-primary hover:underline">
                    {q.quoteNumber}
                  </Link>
                </td>
                <td className="py-3 text-text">
                  {q.leadId && q.leadName ? (
                    <Link href={`/leads/${q.leadId}`} className="hover:underline">{q.leadName}</Link>
                  ) : (
                    <span className="text-text-light">Ingen kunde</span>
                  )}
                </td>
                <td className="py-3"><Badge label={q.status} /></td>
                <td className="py-3 text-text-light">
                  {new Date(q.createdAt).toLocaleDateString("nb-NO")}
                </td>
              </tr>
            ))}
            {allQuotes.length === 0 && (
              <tr>
                <td colSpan={4} className="py-8 text-center text-text-light">
                  Ingen tilbud enda. Opprett det første!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
