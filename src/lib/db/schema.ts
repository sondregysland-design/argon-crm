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
  googlePhone: text("google_phone"),
  googleWebsite: text("google_website"),
  summary: text("summary"),
  detailedSummary: text("detailed_summary"),
  latitude: real("latitude"),
  longitude: real("longitude"),
  notes: text("notes"),
  projectType: text("project_type"),
  source: text("source"),
  meetingUrl: text("meeting_url"),
  discoveryUrl: text("discovery_url"),
  proposalUrl: text("proposal_url"),
  quote: integer("quote"),
  brregSyncedAt: text("brreg_synced_at"),
  proffSyncedAt: text("proff_synced_at"),
  googleSyncedAt: text("google_synced_at"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const activities = sqliteTable("activities", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  leadId: integer("lead_id").notNull().references(() => leads.id, { onDelete: "cascade" }),
  type: text("type", { enum: ["note", "email", "call", "stage_change", "data_enriched", "quote"] }).notNull(),
  description: text("description").notNull(),
  metadata: text("metadata"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const scrapeJobs = sqliteTable("scrape_jobs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").unique().notNull(),
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

export const emailThreads = sqliteTable("email_threads", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  leadId: integer("lead_id").notNull().references(() => leads.id, { onDelete: "cascade" }),
  gmailThreadId: text("gmail_thread_id"),
  gmailMessageId: text("gmail_message_id"),
  subject: text("subject").notNull(),
  followUpCount: integer("follow_up_count").notNull().default(0),
  nextFollowUpAt: text("next_follow_up_at"),
  autoSend: integer("auto_send").notNull().default(1),
  status: text("status", { enum: ["active", "replied", "completed", "paused"] }).notNull().default("active"),
  lastEmailContent: text("last_email_content"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const pendingFollowups = sqliteTable("pending_followups", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  emailThreadId: integer("email_thread_id").notNull().references(() => emailThreads.id, { onDelete: "cascade" }),
  generatedContent: text("generated_content").notNull(),
  status: text("status", { enum: ["pending", "approved", "rejected"] }).notNull().default("pending"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const products = sqliteTable("products", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description"),
  unit: text("unit", { enum: ["stk", "time", "måned", "prosjekt"] }).notNull().default("stk"),
  price: integer("price"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const quotes = sqliteTable("quotes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  quoteNumber: text("quote_number").unique().notNull(),
  leadId: integer("lead_id").references(() => leads.id),
  status: text("status", { enum: ["utkast", "sendt", "akseptert", "avvist"] }).notNull().default("utkast"),
  notes: text("notes"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const quoteItems = sqliteTable("quote_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  quoteId: integer("quote_id").notNull().references(() => quotes.id, { onDelete: "cascade" }),
  productId: integer("product_id").notNull().references(() => products.id),
  quantity: integer("quantity").notNull().default(1),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export type Lead = typeof leads.$inferSelect;
export type NewLead = typeof leads.$inferInsert;
export type Activity = typeof activities.$inferSelect;
export type ScrapeJob = typeof scrapeJobs.$inferSelect;
export type EmailThread = typeof emailThreads.$inferSelect;
export type NewEmailThread = typeof emailThreads.$inferInsert;
export type PendingFollowup = typeof pendingFollowups.$inferSelect;
export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type Quote = typeof quotes.$inferSelect;
export type NewQuote = typeof quotes.$inferInsert;
export type QuoteItem = typeof quoteItems.$inferSelect;