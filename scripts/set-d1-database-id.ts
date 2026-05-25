import { readFile, writeFile } from "node:fs/promises";

type WranglerConfig = {
  d1_databases?: Array<{
    binding?: string;
    database_name?: string;
    database_id?: string;
    migrations_dir?: string;
  }>;
};

const databaseId = process.argv[2]?.trim();

if (!databaseId) {
  throw new Error("Usage: npm run cf:set-d1 -- <database_id>");
}

if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(databaseId)) {
  throw new Error("D1 database_id should be a UUID returned by `wrangler d1 create`.");
}

const configPath = "wrangler.jsonc";
const config = JSON.parse(await readFile(configPath, "utf8")) as WranglerConfig;
const database = config.d1_databases?.find((entry) => entry.binding === "DB");

if (!database) {
  throw new Error("wrangler.jsonc must define a D1 database binding named DB.");
}

database.database_id = databaseId;

await writeFile(`${configPath}`, `${JSON.stringify(config, null, 2)}\n`);

console.log(`Updated wrangler.jsonc DB database_id to ${databaseId}.`);
