import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { scrapeJobs } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export async function GET() {
  const jobs = db.select().from(scrapeJobs).all();
  return NextResponse.json(jobs);
}
