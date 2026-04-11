import { db } from "@/lib/db";
import { quotes, quoteItems, products, leads } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { QuoteStatusActions } from "@/components/QuoteStatusActions";
import { QuotePdfDownload } from "@/components/QuotePdfDownload";
import { QuoteItemsEditor } from "@/components/QuoteItemsEditor";
import Link from "next/link";

export const dynamic = "force-dynamic";

const unitLabels: Record<string, string> = { stk: "Stk", time: "Time", måned: "Måned", prosjekt: "Prosjekt" };

export default async function TilbudDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const quote = await db.select().from(quotes).where(eq(quotes.id, parseInt(id))).get();
  if (!quote) notFound();

  const items = await db.select({
    id: quoteItems.id,
    productId: quoteItems.productId,
    quantity: quoteItems.quantity,
    sortOrder: quoteItems.sortOrder,
    productName: products.name,
    productDescription: products.description,
    productUnit: products.unit,
    productPrice: products.price,
  })
    .from(quoteItems)
    .leftJoin(products, eq(quoteItems.productId, products.id))
    .where(eq(quoteItems.quoteId, quote.id))
    .orderBy(quoteItems.sortOrder)
    .all();

  const allProducts = await db.select({ id: products.id, name: products.name })
    .from(products)
    .orderBy(products.name)
    .all();

  let lead = null;
  if (quote.leadId) {
    lead = await db.select().from(leads).where(eq(leads.id, quote.leadId)).get();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/tilbud" className="text-text-light hover:text-text">&larr;</Link>
        <div>
          <h1 className="text-2xl font-bold text-text">{quote.quoteNumber}</h1>
          <p className="text-sm text-text-light">
            Opprettet {new Date(quote.createdAt).toLocaleDateString("nb-NO")}
          </p>
        </div>
        <Badge label={quote.status} className="ml-auto" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <h2 className="mb-4 text-lg font-semibold text-text">Produkter</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-text-light">
                  <th className="pb-3 font-medium">Produkt</th>
                  <th className="pb-3 font-medium">Antall</th>
                  <th className="pb-3 font-medium">Enhet</th>
                  <th className="pb-3 font-medium">Pris</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="py-3">
                      <div className="font-medium text-text">{item.productName}</div>
                      {item.productDescription && (
                        <div className="text-xs text-text-light">{item.productDescription}</div>
                      )}
                    </td>
                    <td className="py-3 text-text-light">{item.quantity}</td>
                    <td className="py-3 text-text-light">{unitLabels[item.productUnit ?? "stk"]}</td>
                    <td className="py-3 text-text-light">
                      {item.productPrice != null
                        ? `${(item.productPrice * item.quantity).toLocaleString("nb-NO")} kr`
                        : "—"}
                    </td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-text-light">Ingen produkter lagt til</td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr className="border-t border-gray-200">
                  <td colSpan={3} className="pt-3 text-right font-semibold text-text">Totalsum:</td>
                  <td className="pt-3 font-semibold text-text">
                    {items.every((i) => i.productPrice != null)
                      ? `${items.reduce((sum, i) => sum + (i.productPrice ?? 0) * i.quantity, 0).toLocaleString("nb-NO")} kr`
                      : "—"}
                  </td>
                </tr>
              </tfoot>
            </table>

            {quote.status === "utkast" && (
              <div className="mt-4 border-t border-gray-100 pt-4">
                <h3 className="mb-3 text-sm font-semibold text-text">Rediger produkter</h3>
                <QuoteItemsEditor
                  quoteId={quote.id}
                  products={allProducts}
                  items={items.map((i) => ({ id: i.id, productName: i.productName }))}
                />
              </div>
            )}
          </Card>

          {quote.notes && (
            <Card>
              <h2 className="mb-2 text-lg font-semibold text-text">Notater</h2>
              <p className="text-sm text-text-light whitespace-pre-wrap">{quote.notes}</p>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card className="p-4">
            <h3 className="mb-3 text-sm font-semibold text-text">Handlinger</h3>
            <QuoteStatusActions quoteId={quote.id} status={quote.status} />
            <div className="mt-3">
              <QuotePdfDownload
                quoteNumber={quote.quoteNumber}
                createdAt={quote.createdAt}
                leadName={lead?.name}
                leadOrgNumber={lead?.orgNumber}
                leadAddress={lead ? [lead.address, lead.postalCode, lead.city].filter(Boolean).join(", ") : undefined}
                items={items.map((i) => ({
                  name: i.productName ?? "",
                  quantity: i.quantity,
                  unit: unitLabels[i.productUnit ?? "stk"],
                  price: i.productPrice,
                }))}
                notes={quote.notes}
              />
            </div>
          </Card>

          {lead && (
            <Card className="p-4">
              <h3 className="mb-2 text-sm font-semibold text-text">Kunde</h3>
              <Link href={`/leads/${lead.id}`} className="text-sm text-primary hover:underline">
                {lead.name}
              </Link>
              <div className="mt-1 text-xs text-text-light">{lead.orgNumber}</div>
              {lead.address && (
                <div className="mt-1 text-xs text-text-light">
                  {[lead.address, lead.postalCode, lead.city].filter(Boolean).join(", ")}
                </div>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
