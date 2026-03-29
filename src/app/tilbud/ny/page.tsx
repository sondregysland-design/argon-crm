import { db } from "@/lib/db";
import { products, leads } from "@/lib/db/schema";
import { CreateQuoteForm } from "./CreateQuoteForm";

export const dynamic = "force-dynamic";

export default async function NyttTilbudPage() {
  const allProducts = await db.select().from(products).orderBy(products.name).all();
  const allLeads = await db.select({ id: leads.id, name: leads.name })
    .from(leads)
    .orderBy(leads.name)
    .all();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-text">Nytt tilbud</h1>
      <CreateQuoteForm products={allProducts} leads={allLeads} />
    </div>
  );
}
