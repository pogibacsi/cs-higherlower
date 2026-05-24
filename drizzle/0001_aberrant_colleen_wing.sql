CREATE INDEX "item_prices_item_fetched_idx" ON "item_prices" USING btree ("item_id","fetched_at");--> statement-breakpoint
CREATE INDEX "scores_daily_idx" ON "scores" USING btree ("mode","challenge_date","score");--> statement-breakpoint
CREATE INDEX "scores_partner_idx" ON "scores" USING btree ("partner_id","mode","score");