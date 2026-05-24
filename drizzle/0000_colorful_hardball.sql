CREATE EXTENSION IF NOT EXISTS "pgcrypto";--> statement-breakpoint
CREATE TYPE "public"."event_type" AS ENUM('game_started', 'answer_submitted', 'game_over', 'score_submitted', 'partner_embed_loaded');--> statement-breakpoint
CREATE TYPE "public"."game_mode" AS ENUM('daily', 'classic');--> statement-breakpoint
CREATE TYPE "public"."item_category" AS ENUM('case', 'knife', 'glove', 'covert_skin');--> statement-breakpoint
CREATE TYPE "public"."price_status" AS ENUM('success', 'failed', 'stale');--> statement-breakpoint
CREATE TYPE "public"."price_fetch_run_status" AS ENUM('running', 'completed', 'failed');--> statement-breakpoint
CREATE TABLE "analytics_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_type" "event_type" NOT NULL,
	"partner_id" uuid,
	"mode" "game_mode",
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "current_item_prices" (
	"item_id" uuid PRIMARY KEY NOT NULL,
	"price_eur" numeric(12, 2) NOT NULL,
	"currency" text DEFAULT 'EUR' NOT NULL,
	"last_successful_fetch_at" timestamp with time zone NOT NULL,
	"status" "price_status" NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "daily_challenges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"challenge_date" text NOT NULL,
	"timezone" text NOT NULL,
	"seed" text NOT NULL,
	"item_sequence" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "game_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"mode" "game_mode" NOT NULL,
	"partner_id" uuid,
	"challenge_date" text,
	"anonymous_user_id" text NOT NULL,
	"current_score" integer DEFAULT 0 NOT NULL,
	"current_round" integer DEFAULT 0 NOT NULL,
	"item_sequence" jsonb NOT NULL,
	"completed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "item_prices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"item_id" uuid NOT NULL,
	"currency" text DEFAULT 'EUR' NOT NULL,
	"price_eur" numeric(12, 2) NOT NULL,
	"volume" integer,
	"source" text DEFAULT 'steam_market' NOT NULL,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL,
	"status" "price_status" NOT NULL,
	"raw_response" jsonb
);
--> statement-breakpoint
CREATE TABLE "items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"market_hash_name" text NOT NULL,
	"display_name" text NOT NULL,
	"category" "item_category" NOT NULL,
	"rarity" text,
	"weapon_name" text,
	"exterior" text,
	"is_stattrak" boolean DEFAULT false NOT NULL,
	"is_souvenir" boolean DEFAULT false NOT NULL,
	"image_url" text NOT NULL,
	"steam_market_url" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "partners" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"logo_url" text,
	"primary_color" text DEFAULT '#d39f32' NOT NULL,
	"secondary_color" text DEFAULT '#5f8f78' NOT NULL,
	"background_color" text DEFAULT '#11140f' NOT NULL,
	"text_color" text DEFAULT '#f5f0e8' NOT NULL,
	"border_radius" text DEFAULT '12px' NOT NULL,
	"cta_label" text,
	"cta_url" text,
	"allowed_domains" text[] DEFAULT '{}' NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "price_fetch_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone,
	"status" "price_fetch_run_status" DEFAULT 'running' NOT NULL,
	"total_items" integer DEFAULT 0 NOT NULL,
	"success_count" integer DEFAULT 0 NOT NULL,
	"fail_count" integer DEFAULT 0 NOT NULL,
	"error_summary" jsonb
);
--> statement-breakpoint
CREATE TABLE "score_session_uniques" (
	"session_id" uuid NOT NULL,
	CONSTRAINT "score_session_uniques_session_id_pk" PRIMARY KEY("session_id")
);
--> statement-breakpoint
CREATE TABLE "scores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"mode" "game_mode" NOT NULL,
	"challenge_date" text,
	"partner_id" uuid,
	"nickname" text NOT NULL,
	"score" integer NOT NULL,
	"rounds_played" integer NOT NULL,
	"anonymous_user_id" text NOT NULL,
	"session_id" uuid,
	"user_agent_hash" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "current_item_prices" ADD CONSTRAINT "current_item_prices_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_sessions" ADD CONSTRAINT "game_sessions_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "item_prices" ADD CONSTRAINT "item_prices_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "score_session_uniques" ADD CONSTRAINT "score_session_uniques_session_id_game_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."game_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scores" ADD CONSTRAINT "scores_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scores" ADD CONSTRAINT "scores_session_id_game_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."game_sessions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "daily_challenges_date_idx" ON "daily_challenges" USING btree ("challenge_date");--> statement-breakpoint
CREATE UNIQUE INDEX "items_market_hash_name_idx" ON "items" USING btree ("market_hash_name");--> statement-breakpoint
CREATE UNIQUE INDEX "partners_slug_idx" ON "partners" USING btree ("slug");
