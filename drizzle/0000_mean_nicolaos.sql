CREATE TABLE `activities` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`lead_id` integer NOT NULL,
	`type` text NOT NULL,
	`description` text NOT NULL,
	`metadata` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`lead_id`) REFERENCES `leads`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `leads` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`org_number` text NOT NULL,
	`name` text NOT NULL,
	`stage` text DEFAULT 'ny' NOT NULL,
	`stage_order` integer DEFAULT 0 NOT NULL,
	`industry_code` text,
	`industry_name` text,
	`address` text,
	`postal_code` text,
	`city` text,
	`kommune` text,
	`county` text,
	`website` text,
	`phone` text,
	`email` text,
	`contact_person` text,
	`contact_title` text,
	`revenue` integer,
	`employees` integer,
	`founded_date` text,
	`google_rating` real,
	`google_reviews_count` integer,
	`latitude` real,
	`longitude` real,
	`notes` text,
	`brreg_synced_at` text,
	`proff_synced_at` text,
	`google_synced_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `leads_org_number_unique` ON `leads` (`org_number`);--> statement-breakpoint
CREATE TABLE `scrape_jobs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`status` text DEFAULT 'idle' NOT NULL,
	`last_run_at` text,
	`next_run_at` text,
	`cron_expression` text,
	`last_error` text,
	`records_processed` integer,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `search_cache` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`org_number` text NOT NULL,
	`data` text NOT NULL,
	`fetched_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `search_cache_org_number_unique` ON `search_cache` (`org_number`);