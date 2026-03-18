import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const leads = sqliteTable("leads", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orgNumber: text("org_number").unique().notNull(),
  name: text("name").notNull(),
  stage: text("stage", { enum: ["ny", "kontaktet", "kvalifisert", "kunde"] }).notNull().default("ny"),
  stageOrder: integer("stage_order").notNull().default(0),
  industryCode: text("industry_code"),
  industryName: text("industry_name"),
  address: text("address"),
  postalCode: text("postal_code"),
  city: text("city"),
  kommune: text("kommune"),
  county: text("county"),
  website: text("website"),
  phone: text("phone"),
  email: text("email"),
  contactPerson: text("contact_person"),
  contactTitle: text("contact_title"),
  revenue: integer("revenue"),
  employees: integer("employees"),
  foundedDate: text("founded_date"),
  googleRating: real("google_rating"),
  googleReviewsCount: integer("google_reviews_count"),
  latitude: real("latitude"),
  longitude: real("longitude"),
  notes: text("notes"),
  brregSyncedAt: text("brreg_synced_at"),
  proffSyncedAt: text("proff_synced_at"),
  googleSyncedAt: text("google_synced_at"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const activities = sqliteTable("activities", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  leadId: integer("lead_id").notNull().references(() => leads.id, { onDelete: "cascade" }),
  type: text("type", { enum: ["note", "email", "call", "stage_change", "data_enriched"] }).notNull(),
  description: text("description").notNull(),
  metadata: text("metadata"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const scrapeJobs = sqliteTable("scrape_jobs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  status: text("status", { enum: ["idle", "running", "success", "failed"] }).notNull().default("idle"),
  lastRunAt: text("last_run_at"),
  nextRunAt: text("next_run_at"),
  cronExpression: text("cron_expression"),
  lastError: text("last_error"),
  recordsProcessed: integer("records_processed"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const searchCache = sqliteTable("search_cache", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orgNumber: text("org_number").unique().notNull(),
  data: text("data").notNull(),
  fetchedAt: text("fetched_at").notNull(),
});

export type Lead = typeof leads.$inferSelect;
export type NewLead = typeof leads.$inferInsert;
export type Activity = typeof activities.$inferSelect;
export type ScrapeJob = typeof scrapeJobs.$inferSelect;
