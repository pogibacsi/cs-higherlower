import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid
} from "drizzle-orm/pg-core";

export const itemCategoryEnum = pgEnum("item_category", [
  "case",
  "knife",
  "glove",
  "covert_skin"
]);

export const priceStatusEnum = pgEnum("price_status", [
  "success",
  "failed",
  "stale"
]);

export const runStatusEnum = pgEnum("price_fetch_run_status", [
  "running",
  "completed",
  "failed"
]);

export const gameModeEnum = pgEnum("game_mode", ["daily", "classic"]);

export const eventTypeEnum = pgEnum("event_type", [
  "game_started",
  "answer_submitted",
  "game_over",
  "score_submitted",
  "partner_embed_loaded"
]);

export const items = pgTable(
  "items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    marketHashName: text("market_hash_name").notNull(),
    displayName: text("display_name").notNull(),
    category: itemCategoryEnum("category").notNull(),
    rarity: text("rarity"),
    weaponName: text("weapon_name"),
    exterior: text("exterior"),
    isStatTrak: boolean("is_stattrak").notNull().default(false),
    isSouvenir: boolean("is_souvenir").notNull().default(false),
    imageUrl: text("image_url").notNull(),
    steamMarketUrl: text("steam_market_url").notNull(),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    marketHashNameIdx: uniqueIndex("items_market_hash_name_idx").on(
      table.marketHashName
    )
  })
);

export const itemPrices = pgTable("item_prices", {
  id: uuid("id").defaultRandom().primaryKey(),
  itemId: uuid("item_id")
    .notNull()
    .references(() => items.id, { onDelete: "cascade" }),
  currency: text("currency").notNull().default("EUR"),
  priceEur: numeric("price_eur", { precision: 12, scale: 2 }).notNull(),
  volume: integer("volume"),
  source: text("source").notNull().default("steam_market"),
  fetchedAt: timestamp("fetched_at", { withTimezone: true }).notNull().defaultNow(),
  status: priceStatusEnum("status").notNull(),
  rawResponse: jsonb("raw_response")
}, (table) => ({
  itemFetchedIdx: index("item_prices_item_fetched_idx").on(
    table.itemId,
    table.fetchedAt
  )
}));

export const currentItemPrices = pgTable("current_item_prices", {
  itemId: uuid("item_id")
    .primaryKey()
    .references(() => items.id, { onDelete: "cascade" }),
  priceEur: numeric("price_eur", { precision: 12, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("EUR"),
  lastSuccessfulFetchAt: timestamp("last_successful_fetch_at", {
    withTimezone: true
  }).notNull(),
  status: priceStatusEnum("status").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
});

export const priceFetchRuns = pgTable("price_fetch_runs", {
  id: uuid("id").defaultRandom().primaryKey(),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
  status: runStatusEnum("status").notNull().default("running"),
  totalItems: integer("total_items").notNull().default(0),
  successCount: integer("success_count").notNull().default(0),
  failCount: integer("fail_count").notNull().default(0),
  errorSummary: jsonb("error_summary")
});

export const partners = pgTable(
  "partners",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    logoUrl: text("logo_url"),
    primaryColor: text("primary_color").notNull().default("#d39f32"),
    secondaryColor: text("secondary_color").notNull().default("#5f8f78"),
    backgroundColor: text("background_color").notNull().default("#11140f"),
    textColor: text("text_color").notNull().default("#f5f0e8"),
    borderRadius: text("border_radius").notNull().default("12px"),
    ctaLabel: text("cta_label"),
    ctaUrl: text("cta_url"),
    allowedDomains: text("allowed_domains").array().notNull().default([]),
    enabled: boolean("enabled").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    slugIdx: uniqueIndex("partners_slug_idx").on(table.slug)
  })
);

export type ItemSequenceEntry = {
  id: string;
  displayName: string;
  marketHashName: string;
  category: "case" | "knife" | "glove" | "covert_skin";
  imageUrl: string;
  priceEur: number;
};

export const dailyChallenges = pgTable(
  "daily_challenges",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    challengeDate: text("challenge_date").notNull(),
    timezone: text("timezone").notNull(),
    seed: text("seed").notNull(),
    itemSequence: jsonb("item_sequence").$type<ItemSequenceEntry[]>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    challengeDateIdx: uniqueIndex("daily_challenges_date_idx").on(
      table.challengeDate
    )
  })
);

export const gameSessions = pgTable("game_sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  mode: gameModeEnum("mode").notNull(),
  partnerId: uuid("partner_id").references(() => partners.id, {
    onDelete: "set null"
  }),
  challengeDate: text("challenge_date"),
  anonymousUserId: text("anonymous_user_id").notNull(),
  currentScore: integer("current_score").notNull().default(0),
  currentRound: integer("current_round").notNull().default(0),
  itemSequence: jsonb("item_sequence").$type<ItemSequenceEntry[]>().notNull(),
  completed: boolean("completed").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
});

export const scores = pgTable("scores", {
  id: uuid("id").defaultRandom().primaryKey(),
  mode: gameModeEnum("mode").notNull(),
  challengeDate: text("challenge_date"),
  partnerId: uuid("partner_id").references(() => partners.id, {
    onDelete: "set null"
  }),
  nickname: text("nickname").notNull(),
  score: integer("score").notNull(),
  roundsPlayed: integer("rounds_played").notNull(),
  anonymousUserId: text("anonymous_user_id").notNull(),
  sessionId: uuid("session_id").references(() => gameSessions.id, {
    onDelete: "set null"
  }),
  userAgentHash: text("user_agent_hash"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => ({
  dailyIdx: index("scores_daily_idx").on(
    table.mode,
    table.challengeDate,
    table.score
  ),
  partnerIdx: index("scores_partner_idx").on(
    table.partnerId,
    table.mode,
    table.score
  )
}));

export const analyticsEvents = pgTable("analytics_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  eventType: eventTypeEnum("event_type").notNull(),
  partnerId: uuid("partner_id").references(() => partners.id, {
    onDelete: "set null"
  }),
  mode: gameModeEnum("mode"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
});

export const scoreSessionUniq = pgTable(
  "score_session_uniques",
  {
    sessionId: uuid("session_id")
      .notNull()
      .references(() => gameSessions.id, { onDelete: "cascade" })
  },
  (table) => ({
    pk: primaryKey({ columns: [table.sessionId] })
  })
);
