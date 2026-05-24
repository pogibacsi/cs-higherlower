CREATE TABLE `analytics_events` (
	`id` text PRIMARY KEY NOT NULL,
	`event_type` text NOT NULL,
	`partner_id` text,
	`mode` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`partner_id`) REFERENCES `partners`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `current_item_prices` (
	`item_id` text PRIMARY KEY NOT NULL,
	`price_eur` real NOT NULL,
	`currency` text DEFAULT 'EUR' NOT NULL,
	`last_successful_fetch_at` integer NOT NULL,
	`status` text NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`item_id`) REFERENCES `items`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `daily_challenges` (
	`id` text PRIMARY KEY NOT NULL,
	`challenge_date` text NOT NULL,
	`timezone` text NOT NULL,
	`seed` text NOT NULL,
	`item_sequence` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `daily_challenges_date_idx` ON `daily_challenges` (`challenge_date`);--> statement-breakpoint
CREATE TABLE `game_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`mode` text NOT NULL,
	`partner_id` text,
	`challenge_date` text,
	`anonymous_user_id` text NOT NULL,
	`current_score` integer DEFAULT 0 NOT NULL,
	`current_round` integer DEFAULT 0 NOT NULL,
	`item_sequence` text NOT NULL,
	`completed` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`partner_id`) REFERENCES `partners`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `item_prices` (
	`id` text PRIMARY KEY NOT NULL,
	`item_id` text NOT NULL,
	`currency` text DEFAULT 'EUR' NOT NULL,
	`price_eur` real NOT NULL,
	`volume` integer,
	`source` text DEFAULT 'steam_market' NOT NULL,
	`fetched_at` integer NOT NULL,
	`status` text NOT NULL,
	`raw_response` text,
	FOREIGN KEY (`item_id`) REFERENCES `items`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `item_prices_item_fetched_idx` ON `item_prices` (`item_id`,`fetched_at`);--> statement-breakpoint
CREATE TABLE `items` (
	`id` text PRIMARY KEY NOT NULL,
	`market_hash_name` text NOT NULL,
	`display_name` text NOT NULL,
	`category` text NOT NULL,
	`rarity` text,
	`weapon_name` text,
	`exterior` text,
	`is_stattrak` integer DEFAULT false NOT NULL,
	`is_souvenir` integer DEFAULT false NOT NULL,
	`image_url` text NOT NULL,
	`steam_market_url` text NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `items_market_hash_name_idx` ON `items` (`market_hash_name`);--> statement-breakpoint
CREATE TABLE `partners` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`logo_url` text,
	`primary_color` text DEFAULT '#d39f32' NOT NULL,
	`secondary_color` text DEFAULT '#5f8f78' NOT NULL,
	`background_color` text DEFAULT '#11140f' NOT NULL,
	`text_color` text DEFAULT '#f5f0e8' NOT NULL,
	`border_radius` text DEFAULT '12px' NOT NULL,
	`cta_label` text,
	`cta_url` text,
	`allowed_domains` text DEFAULT '[]' NOT NULL,
	`enabled` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `partners_slug_idx` ON `partners` (`slug`);--> statement-breakpoint
CREATE TABLE `price_fetch_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`started_at` integer NOT NULL,
	`finished_at` integer,
	`status` text DEFAULT 'running' NOT NULL,
	`total_items` integer DEFAULT 0 NOT NULL,
	`success_count` integer DEFAULT 0 NOT NULL,
	`fail_count` integer DEFAULT 0 NOT NULL,
	`error_summary` text
);
--> statement-breakpoint
CREATE TABLE `score_session_uniques` (
	`session_id` text PRIMARY KEY NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `game_sessions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `scores` (
	`id` text PRIMARY KEY NOT NULL,
	`mode` text NOT NULL,
	`challenge_date` text,
	`partner_id` text,
	`nickname` text NOT NULL,
	`score` integer NOT NULL,
	`rounds_played` integer NOT NULL,
	`anonymous_user_id` text NOT NULL,
	`session_id` text,
	`user_agent_hash` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`partner_id`) REFERENCES `partners`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`session_id`) REFERENCES `game_sessions`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `scores_daily_idx` ON `scores` (`mode`,`challenge_date`,`score`);--> statement-breakpoint
CREATE INDEX `scores_partner_idx` ON `scores` (`partner_id`,`mode`,`score`);--> statement-breakpoint
CREATE TABLE `sync_state` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`updated_at` integer NOT NULL
);
