import { access, readFile } from "node:fs/promises";
import { seedItems } from "./seed";

const requiredFiles = [
  "components.json",
  "docker-compose.yml",
  "scripts/smoke-db.ts",
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
  "drizzle/0000_colorful_hardball.sql",
  "drizzle/0001_aberrant_colleen_wing.sql"
];

const requiredEnv = [
  "DATABASE_URL",
  "NEXT_PUBLIC_APP_URL",
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
    'gt(currentItemPrices.priceEur, "0")'
  ]);

  await fileIncludes("src/lib/validation.ts", [
    "Only http and https URLs are allowed.",
    "httpUrlSchema"
  ]);

  await fileIncludes("src/components/game/embed-game.tsx", [
    "isHttpUrl(partner.ctaUrl)"
  ]);

  await fileIncludes("package.json", [
    "\"db:local:up\"",
    "\"smoke:db\"",
    "\"@radix-ui/react-slot\"",
    "\"class-variance-authority\""
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
    "onConflictDoUpdate",
    'status: "stale"'
  ]);

  await fileIncludes("scripts/smoke-db.ts", [
    "Database smoke test passed.",
    "Daily challenge should use the same ordered sequence",
    "Duplicate score submission should be rejected."
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
