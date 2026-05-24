import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@/db/schema";
import { env } from "@/lib/env";

let client: postgres.Sql | null = null;
let database: PostgresJsDatabase<typeof schema> | null = null;

export function getDb() {
  if (!env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required for database-backed routes.");
  }

  if (!client) {
    client = postgres(env.DATABASE_URL, {
      max: 5,
      prepare: false
    });
    database = drizzle(client, { schema });
  }

  return database!;
}

export type Db = ReturnType<typeof getDb>;
