import { sql } from "drizzle-orm";
import {
  index,
  integer,
  primaryKey,
  real,
  sqliteTable,
  text,
  uniqueIndex
} from "drizzle-orm/sqlite-core";

export const itemCategories = ["case", "knife", "glove", "covert_skin"] as const;
export const priceStatuses = ["success", "failed", "stale"] as const;
export const runStatuses = ["running", "completed", "failed"] as const;
export const gameModes = ["daily", "classic"] as const;
export const eventTypes = [
  "game_started",
  "answer_submitted",
  "game_over",
  "score_submitted",
  "partner_embed_loaded"
] as const;

export type ItemCategory = (typeof itemCategories)[number];
export type PriceStatus = (typeof priceStatuses)[number];
export type RunStatus = (typeof runStatuses)[number];
export type GameMode = (typeof gameModes)[number];
export type EventType = (typeof eventTypes)[number];

export type ItemSequenceEntry = {
  id: string;
  displayName: string;
  marketHashName: string;
  category: ItemCategory;
  imageUrl: string;
  priceEur: number;
};

const nowMs = () => new Date();

export const items = sqliteTable(
  "items",
  {
    id: text("id")
      .$defaultFn(() => crypto.randomUUID())
      .primaryKey(),
    marketHashName: text("market_hash_name").notNull(),
    displayName: text("display_name").notNull(),
    category: text("category").$type<ItemCategory>().notNull(),
    rarity: text("rarity"),
    weaponName: text("weapon_name"),
    exterior: text("exterior"),
    isStatTrak: integer("is_stattrak", { mode: "boolean" }).notNull().default(false),
    isSouvenir: integer("is_souvenir", { mode: "boolean" }).notNull().default(false),
    imageUrl: text("image_url").notNull(),
    steamMarketUrl: text("steam_market_url").notNull(),
    active: integer("active", { mode: "boolean" }).notNull().default(true),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(nowMs),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(nowMs)
  },
  (table) => ({
    marketHashNameIdx: uniqueIndex("items_market_hash_name_idx").on(
      table.marketHashName
    )
  })
);

export const itemPrices = sqliteTable(
  "item_prices",
  {
    id: text("id")
      .$defaultFn(() => crypto.randomUUID())
      .primaryKey(),
    itemId: text("item_id")
      .notNull()
      .references(() => items.id, { onDelete: "cascade" }),
    currency: text("currency").notNull().default("EUR"),
    priceEur: real("price_eur").notNull(),
    volume: integer("volume"),
    source: text("source").notNull().default("steam_market"),
    fetchedAt: integer("fetched_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(nowMs),
    status: text("status").$type<PriceStatus>().notNull(),
    rawResponse: text("raw_response", { mode: "json" }).$type<unknown>()
  },
  (table) => ({
    itemFetchedIdx: index("item_prices_item_fetched_idx").on(
      table.itemId,
      table.fetchedAt
    )
  })
);

export const currentItemPrices = sqliteTable("current_item_prices", {
  itemId: text("item_id")
    .primaryKey()
    .references(() => items.id, { onDelete: "cascade" }),
  priceEur: real("price_eur").notNull(),
  currency: text("currency").notNull().default("EUR"),
  lastSuccessfulFetchAt: integer("last_successful_fetch_at", {
    mode: "timestamp_ms"
  }).notNull(),
  status: text("status").$type<PriceStatus>().notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(nowMs)
});

export const priceFetchRuns = sqliteTable("price_fetch_runs", {
  id: text("id")
    .$defaultFn(() => crypto.randomUUID())
    .primaryKey(),
  startedAt: integer("started_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(nowMs),
  finishedAt: integer("finished_at", { mode: "timestamp_ms" }),
  status: text("status").$type<RunStatus>().notNull().default("running"),
  totalItems: integer("total_items").notNull().default(0),
  successCount: integer("success_count").notNull().default(0),
  failCount: integer("fail_count").notNull().default(0),
  errorSummary: text("error_summary", { mode: "json" }).$type<unknown>()
});

export const partners = sqliteTable(
  "partners",
  {
    id: text("id")
      .$defaultFn(() => crypto.randomUUID())
      .primaryKey(),
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
    allowedDomains: text("allowed_domains", { mode: "json" })
      .$type<string[]>()
      .notNull()
      .default(sql`'[]'`),
    enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(nowMs),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(nowMs)
  },
  (table) => ({
    slugIdx: uniqueIndex("partners_slug_idx").on(table.slug)
  })
);

export const dailyChallenges = sqliteTable(
  "daily_challenges",
  {
    id: text("id")
      .$defaultFn(() => crypto.randomUUID())
      .primaryKey(),
    challengeDate: text("challenge_date").notNull(),
    timezone: text("timezone").notNull(),
    seed: text("seed").notNull(),
    itemSequence: text("item_sequence", { mode: "json" })
      .$type<ItemSequenceEntry[]>()
      .notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(nowMs)
  },
  (table) => ({
    challengeDateIdx: uniqueIndex("daily_challenges_date_idx").on(
      table.challengeDate
    )
  })
);

export const gameSessions = sqliteTable("game_sessions", {
  id: text("id")
    .$defaultFn(() => crypto.randomUUID())
    .primaryKey(),
  mode: text("mode").$type<GameMode>().notNull(),
  partnerId: text("partner_id").references(() => partners.id, {
    onDelete: "set null"
  }),
  challengeDate: text("challenge_date"),
  anonymousUserId: text("anonymous_user_id").notNull(),
  currentScore: integer("current_score").notNull().default(0),
  currentRound: integer("current_round").notNull().default(0),
  itemSequence: text("item_sequence", { mode: "json" })
    .$type<ItemSequenceEntry[]>()
    .notNull(),
  completed: integer("completed", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(nowMs),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(nowMs)
});

export const scores = sqliteTable(
  "scores",
  {
    id: text("id")
      .$defaultFn(() => crypto.randomUUID())
      .primaryKey(),
    mode: text("mode").$type<GameMode>().notNull(),
    challengeDate: text("challenge_date"),
    partnerId: text("partner_id").references(() => partners.id, {
      onDelete: "set null"
    }),
    nickname: text("nickname").notNull(),
    score: integer("score").notNull(),
    roundsPlayed: integer("rounds_played").notNull(),
    anonymousUserId: text("anonymous_user_id").notNull(),
    sessionId: text("session_id").references(() => gameSessions.id, {
      onDelete: "set null"
    }),
    userAgentHash: text("user_agent_hash"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(nowMs)
  },
  (table) => ({
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
  })
);

export const analyticsEvents = sqliteTable("analytics_events", {
  id: text("id")
    .$defaultFn(() => crypto.randomUUID())
    .primaryKey(),
  eventType: text("event_type").$type<EventType>().notNull(),
  partnerId: text("partner_id").references(() => partners.id, {
    onDelete: "set null"
  }),
  mode: text("mode").$type<GameMode>(),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(nowMs)
});

export const scoreSessionUniq = sqliteTable(
  "score_session_uniques",
  {
    sessionId: text("session_id")
      .notNull()
      .references(() => gameSessions.id, { onDelete: "cascade" })
  },
  (table) => ({
    pk: primaryKey({ columns: [table.sessionId] })
  })
);

export const syncState = sqliteTable("sync_state", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(nowMs)
});
