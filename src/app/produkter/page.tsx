import { db } from "@/lib/db";
import { products } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { ProductsClient } from "./ProductsClient";

export const dynamic = "force-dynamic";

export default async function ProdukterPage() {
  const allProducts = await db.select().from(products).orderBy(desc(products.createdAt)).all();
  return <ProductsClient initialProducts={allProducts} />;
}
