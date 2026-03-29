import { db } from "@/lib/db";
import { quotes, leads } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import Link from "next/link";
import { TilbudClient } from "./TilbudClient";

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

      <TilbudClient quotes={allQuotes} />
    </div>
  );
}
