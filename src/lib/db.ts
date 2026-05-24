import { getCloudflareContext } from "@opennextjs/cloudflare";
import { drizzle, type DrizzleD1Database } from "drizzle-orm/d1";
import * as schema from "@/db/schema";

export type CloudflareBindings = {
  DB: D1Database;
  ADMIN_PASSWORD?: string;
  PRICE_SYNC_BATCH_SIZE?: string;
  PRICE_SYNC_DELAY_MS?: string;
  PRICE_SYNC_CRON_SECRET?: string;
  DEFAULT_TIMEZONE?: string;
  NEXT_PUBLIC_APP_URL?: string;
};

export type Db = DrizzleD1Database<typeof schema>;

export function createDb(database: D1Database): Db {
  return drizzle(database, { schema });
}

export function getCloudflareEnv() {
  return getCloudflareContext().env as CloudflareBindings;
}

export function getDb(database?: D1Database): Db {
  if (database) return createDb(database);

  const binding = getCloudflareEnv().DB;
  if (!binding) {
    throw new Error("Cloudflare D1 binding DB is required.");
  }

  return createDb(binding);
}
