CREATE TABLE `email_threads` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`lead_id` integer NOT NULL,
	`gmail_thread_id` text,
	`gmail_message_id` text,
	`subject` text NOT NULL,
	`follow_up_count` integer DEFAULT 0 NOT NULL,
	`next_follow_up_at` text,
	`auto_send` integer DEFAULT 1 NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`last_email_content` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`lead_id`) REFERENCES `leads`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `pending_followups` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email_thread_id` integer NOT NULL,
	`generated_content` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`email_thread_id`) REFERENCES `email_threads`(`id`) ON UPDATE no action ON DELETE cascade
);
