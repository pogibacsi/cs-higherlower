import { access, readFile } from "node:fs/promises";

type WranglerConfig = {
  d1_databases?: Array<{
    binding?: string;
    database_name?: string;
    database_id?: string;
    migrations_dir?: string;
  }>;
};

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const config = JSON.parse(
  await readFile("wrangler.jsonc", "utf8")
) as WranglerConfig;
const database = config.d1_databases?.find((entry) => entry.binding === "DB");

if (!database) {
  throw new Error("wrangler.jsonc must define a D1 database binding named DB.");
}
assert(
  database.database_name === "cs-higherlower",
  "D1 database_name must be cs-higherlower."
);
assert(
  database.database_id !== "REPLACE_WITH_CLOUDFLARE_D1_DATABASE_ID",
  "Replace REPLACE_WITH_CLOUDFLARE_D1_DATABASE_ID in wrangler.jsonc before deploying."
);
assert(Boolean(database.database_id), "wrangler.jsonc must include a D1 database_id.");
assert(
  database.migrations_dir === "drizzle",
  "wrangler.jsonc must point D1 migrations_dir at drizzle."
);

await access("drizzle/0000_fast_norrin_radd.sql");
await access("worker.ts");
await access("open-next.config.ts");

console.log("Cloudflare deploy preflight passed.");
