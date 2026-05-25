import { access, readFile } from "node:fs/promises";
import { seedItems } from "./seed";

const requiredFiles = [
  "components.json",
  "scripts/smoke-db.ts",
  "scripts/set-d1-database-id.ts",
  "scripts/update-steam-images.ts",
  "scripts/verify-cloudflare-deploy.ts",
  "wrangler.jsonc",
  "open-next.config.ts",
  "worker.ts",
  "middleware.ts",
  "src/app/embed/[partnerSlug]/page.tsx",
  "src/app/play/page.tsx",
  "src/app/admin/partners/page.tsx",
  "src/app/admin/items/page.tsx",
  "src/app/admin/leaderboards/page.tsx",
  "src/app/admin/price-sync/page.tsx",
  "src/app/api/embed-config/[partnerSlug]/route.ts",
  "src/app/api/game/start/route.ts",
  "src/app/api/game/answer/route.ts",
  "src/app/api/scores/submit/route.ts",
  "src/app/api/leaderboard/route.ts",
  "src/app/api/admin/partners/route.ts",
  "src/app/api/admin/partners/[id]/route.ts",
  "src/app/api/admin/price-sync/run/route.ts",
  "src/app/api/admin/price-sync/runs/route.ts",
  "src/app/api/admin/items/route.ts",
  "src/app/api/cron/price-sync/route.ts",
  "src/db/schema.ts",
  "src/lib/price-sync/types.ts",
  "src/lib/price-sync/steam-provider.ts",
  "src/lib/price-sync/mock-provider.ts",
  "drizzle.config.ts"
];

const requiredEnv = [
  "ADMIN_PASSWORD",
  "PRICE_SYNC_BATCH_SIZE",
  "PRICE_SYNC_DELAY_MS",
  "PRICE_SYNC_CRON_SECRET",
  "DEFAULT_TIMEZONE"
];

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

async function fileIncludes(path: string, required: string[]) {
  const contents = await readFile(path, "utf8");
  for (const needle of required) {
    assert(contents.includes(needle), `${path} is missing ${needle}`);
  }
}

async function verify() {
  for (const file of requiredFiles) {
    await access(file);
  }

  const counts = seedItems.reduce<Record<string, number>>((acc, item) => {
    acc[item.category] = (acc[item.category] ?? 0) + 1;
    return acc;
  }, {});

  assert(counts.case >= 20, `Expected at least 20 cases, got ${counts.case ?? 0}`);
  assert(counts.knife >= 30, `Expected at least 30 knives, got ${counts.knife ?? 0}`);
  assert(counts.glove >= 20, `Expected at least 20 gloves, got ${counts.glove ?? 0}`);
  assert(
    counts.covert_skin >= 50,
    `Expected at least 50 covert skins, got ${counts.covert_skin ?? 0}`
  );

  await fileIncludes("src/app/api/game/start/route.ts", [
    "export async function GET",
    "export async function POST",
    "startGameSchema.safeParse"
  ]);

  await fileIncludes("src/lib/game.ts", [
    "Round has already been answered.",
    "eq(gameSessions.currentRound",
    "eq(gameSessions.currentScore",
    'eventType: "answer_submitted"',
    'eventType: "game_over"'
  ]);

  await fileIncludes("src/lib/leaderboard.ts", [
    "onConflictDoNothing",
    "Score has already been submitted."
  ]);

  await fileIncludes("src/lib/items.ts", [
    'inArray(currentItemPrices.status, ["success", "stale"])',
    "gt(currentItemPrices.priceEur, 0)"
  ]);

  await fileIncludes("src/lib/validation.ts", [
    "Only http and https URLs are allowed.",
    "httpUrlSchema"
  ]);

  await fileIncludes("src/components/game/embed-game.tsx", [
    "isHttpUrl(partner.ctaUrl)"
  ]);

  await fileIncludes("package.json", [
    "\"db:migrate:local\"",
    "\"db:migrate:remote\"",
    "\"db:images:remote\"",
    "\"cf:build\"",
    "\"cf:preflight\"",
    "\"cf:set-d1\"",
    "--keep-vars",
    "\"@opennextjs/cloudflare\"",
    "\"wrangler\"",
    "\"@radix-ui/react-slot\"",
    "\"class-variance-authority\""
  ]);

  await fileIncludes("wrangler.jsonc", [
    "\"d1_databases\"",
    "\"binding\": \"DB\"",
    "\"triggers\"",
    "\"nodejs_compat\""
  ]);

  await fileIncludes("worker.ts", [
    "scheduled",
    "runPriceSync",
    "PRICE_SYNC_BATCH_SIZE"
  ]);

  await fileIncludes("scripts/verify-cloudflare-deploy.ts", [
    "REPLACE_WITH_CLOUDFLARE_D1_DATABASE_ID",
    "Cloudflare deploy preflight passed."
  ]);

  await fileIncludes("scripts/set-d1-database-id.ts", [
    "npm run cf:set-d1 -- <database_id>",
    "Updated wrangler.jsonc DB database_id"
  ]);

  await fileIncludes("scripts/update-steam-images.ts", [
    "skins.json",
    "crates.json",
    "og:image",
    "--offset=",
    "steam-images.sql",
    "Updated ${resolved} item images"
  ]);

  await fileIncludes("next.config.ts", [
    "community.akamai.steamstatic.com"
  ]);

  const seedScript = await readFile("scripts/seed.ts", "utf8");
  assert(
    !seedScript.includes("BEGIN TRANSACTION") && !seedScript.includes("COMMIT;"),
    "D1 seed SQL must not emit explicit transaction statements."
  );

  await fileIncludes("middleware.ts", [
    "ADMIN_PASSWORD",
    "Basic realm",
    "/api/admin/:path*"
  ]);

  await fileIncludes("components.json", ["ui.shadcn.com", "@/components/ui"]);

  await fileIncludes("src/components/game/embed-game.tsx", [
    "cs2-higherlower:resize",
    "Higher",
    "Lower",
    "localStorage",
    "Not affiliated with or endorsed by Valve or Steam"
  ]);

  await fileIncludes("src/lib/price-sync/steam-provider.ts", [
    "appid",
    "730",
    "currency",
    "3",
    "market_hash_name"
  ]);

  await fileIncludes("src/lib/price-sync/run.ts", [
    "PRICE_SYNC_BATCH_SIZE",
    "PRICE_SYNC_DELAY_MS",
    "syncState",
    "marketHashName",
    "onConflictDoUpdate",
    'status: "stale"'
  ]);

  await fileIncludes("scripts/smoke-db.ts", [
    "Cloudflare preview smoke test passed.",
    "CF_PREVIEW_URL",
    "/api/game/start",
    "/api/admin/items"
  ]);

  const envExample = await readFile(".env.example", "utf8");
  for (const name of requiredEnv) {
    assert(envExample.includes(name), `.env.example is missing ${name}`);
  }

  console.log("MVP structural verification passed.");
  console.log(
    `Seed counts: ${counts.case} cases, ${counts.knife} knives, ${counts.glove} gloves, ${counts.covert_skin} covert skins.`
  );
}

verify().catch((error) => {
  console.error(error);
  process.exit(1);
});
