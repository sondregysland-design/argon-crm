import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { products } from "@/lib/db/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  const result = await db.select().from(products).orderBy(desc(products.createdAt)).all();
  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const result = await db.insert(products).values({
    name: body.name,
    description: body.description ?? null,
    unit: body.unit ?? "stk",
    price: body.price ?? null,
  }).returning();
  return NextResponse.json(result[0], { status: 201 });
}
