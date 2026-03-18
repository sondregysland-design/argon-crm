import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import { join } from "path";
import { mkdirSync } from "fs";

const dbPath = join(process.cwd(), "data", "argon-crm.db");
mkdirSync(join(process.cwd(), "data"), { recursive: true });

const sqlite = new Database(dbPath);
sqlite.pragma("journal_mode = WAL");

export const db = drizzle(sqlite, { schema });

// Seed default jobs — deduplicate by name
const seedJobs = [
  { name: "brreg_sync", cron: "0 3 * * 1" },
  { name: "proff_enrich", cron: "0 3 * * 2" },
  { name: "google_enrich", cron: "0 3 * * 3" },
];

for (const job of seedJobs) {
  sqlite.exec(`INSERT OR IGNORE INTO scrape_jobs (name, cron_expression, status) VALUES ('${job.name}', '${job.cron}', 'idle')`);
}

// Clean up any duplicate rows from earlier seeding bug
sqlite.exec(`
  DELETE FROM scrape_jobs WHERE id NOT IN (
    SELECT MIN(id) FROM scrape_jobs GROUP BY name
  )
`);
