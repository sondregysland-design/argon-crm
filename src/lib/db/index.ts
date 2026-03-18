import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { sql } from "drizzle-orm";
import * as schema from "./schema";
import { scrapeJobs } from "./schema";
import { join } from "path";
import { mkdirSync } from "fs";

const dbPath = join(process.cwd(), "data", "argon-crm.db");
mkdirSync(join(process.cwd(), "data"), { recursive: true });

const sqlite = new Database(dbPath);
sqlite.pragma("journal_mode = WAL");

export const db = drizzle(sqlite, { schema });

// Seed default jobs if empty
const jobCount = db.select({ count: sql<number>`count(*)` }).from(scrapeJobs).get();
if (jobCount && jobCount.count === 0) {
  db.insert(scrapeJobs).values([
    { name: "brreg_sync", cronExpression: "0 3 * * 1", status: "idle" },
    { name: "proff_enrich", cronExpression: "0 3 * * 2", status: "idle" },
    { name: "google_enrich", cronExpression: "0 3 * * 3", status: "idle" },
  ]).run();
}
