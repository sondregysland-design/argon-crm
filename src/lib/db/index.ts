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
