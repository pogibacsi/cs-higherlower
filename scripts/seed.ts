import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { spawn } from "node:child_process";
import type { ItemCategory } from "../src/db/schema";

type SeedItem = {
  marketHashName: string;
  displayName: string;
  category: ItemCategory;
  rarity: string | null;
  weaponName: string | null;
  exterior: string | null;
  isStatTrak: boolean;
  isSouvenir: boolean;
  imageUrl: string;
  steamMarketUrl: string;
  active: boolean;
  seedPrice: number;
};

const PLACEHOLDER_BASE =
  "https://placehold.co/512x384/151a14/f2eadf/png?text=";

function marketUrl(marketHashName: string) {
  return `https://steamcommunity.com/market/listings/730/${encodeURIComponent(
    marketHashName
  )}`;
}

function imageUrl(name: string) {
  return `${PLACEHOLDER_BASE}${encodeURIComponent(name.replace(/\|/g, ""))}`;
}

function item(
  marketHashName: string,
  category: SeedItem["category"],
  seedPrice: number,
  extras: Partial<SeedItem> = {}
): SeedItem {
  return {
    marketHashName,
    displayName: marketHashName,
    category,
    rarity: extras.rarity ?? null,
    weaponName: extras.weaponName ?? null,
    exterior: extras.exterior ?? null,
    isStatTrak: extras.isStatTrak ?? false,
    isSouvenir: extras.isSouvenir ?? false,
    imageUrl: imageUrl(marketHashName),
    steamMarketUrl: marketUrl(marketHashName),
    active: true,
    seedPrice
  };
}

const caseItems: SeedItem[] = [
  "Revolution Case",
  "Recoil Case",
  "Dreams & Nightmares Case",
  "Snakebite Case",
  "Fracture Case",
  "Prisma 2 Case",
  "CS20 Case",
  "Prisma Case",
  "Danger Zone Case",
  "Horizon Case",
  "Clutch Case",
  "Spectrum 2 Case",
  "Operation Hydra Case",
  "Spectrum Case",
  "Glove Case",
  "Gamma 2 Case",
  "Gamma Case",
  "Chroma 3 Case",
  "Operation Wildfire Case",
  "Falchion Case"
].map((name, index) => item(name, "case", 0.45 + index * 0.24));

const knifeBases = [
  "Bayonet",
  "M9 Bayonet",
  "Karambit",
  "Butterfly Knife",
  "Flip Knife",
  "Gut Knife",
  "Huntsman Knife",
  "Falchion Knife",
  "Bowie Knife",
  "Shadow Daggers",
  "Navaja Knife",
  "Stiletto Knife",
  "Talon Knife",
  "Ursus Knife",
  "Classic Knife"
];

const knifeItems: SeedItem[] = knifeBases.flatMap((base, index) => [
  item(`★ ${base} | Doppler (Factory New)`, "knife", 320 + index * 38, {
    rarity: "Covert",
    weaponName: base,
    exterior: "Factory New"
  }),
  item(`★ ${base} | Fade (Factory New)`, "knife", 410 + index * 42, {
    rarity: "Covert",
    weaponName: base,
    exterior: "Factory New"
  })
]);

const gloveNames = [
  "★ Sport Gloves | Vice (Field-Tested)",
  "★ Sport Gloves | Pandora's Box (Field-Tested)",
  "★ Sport Gloves | Amphibious (Field-Tested)",
  "★ Sport Gloves | Omega (Field-Tested)",
  "★ Specialist Gloves | Fade (Field-Tested)",
  "★ Specialist Gloves | Crimson Kimono (Field-Tested)",
  "★ Specialist Gloves | Mogul (Field-Tested)",
  "★ Specialist Gloves | Emerald Web (Field-Tested)",
  "★ Driver Gloves | King Snake (Field-Tested)",
  "★ Driver Gloves | Imperial Plaid (Field-Tested)",
  "★ Driver Gloves | Snow Leopard (Field-Tested)",
  "★ Driver Gloves | Crimson Weave (Field-Tested)",
  "★ Hand Wraps | Cobalt Skulls (Field-Tested)",
  "★ Hand Wraps | Overprint (Field-Tested)",
  "★ Hand Wraps | Slaughter (Field-Tested)",
  "★ Hand Wraps | CAUTION! (Field-Tested)",
  "★ Moto Gloves | Spearmint (Field-Tested)",
  "★ Moto Gloves | Polygon (Field-Tested)",
  "★ Moto Gloves | POW! (Field-Tested)",
  "★ Moto Gloves | Turtle (Field-Tested)"
];

const gloveItems = gloveNames.map((name, index) =>
  item(name, "glove", 120 + index * 57, {
    rarity: "Extraordinary",
    exterior: "Field-Tested"
  })
);

const covertSkinNames = [
  "AK-47 | Redline (Field-Tested)",
  "AK-47 | Fire Serpent (Field-Tested)",
  "AK-47 | Fuel Injector (Field-Tested)",
  "AK-47 | The Empress (Field-Tested)",
  "AK-47 | Asiimov (Field-Tested)",
  "AK-47 | Legion of Anubis (Field-Tested)",
  "AK-47 | Neon Rider (Field-Tested)",
  "AK-47 | Bloodsport (Factory New)",
  "AWP | Dragon Lore (Field-Tested)",
  "AWP | Asiimov (Field-Tested)",
  "AWP | Medusa (Field-Tested)",
  "AWP | The Prince (Field-Tested)",
  "AWP | Wildfire (Field-Tested)",
  "AWP | Neo-Noir (Field-Tested)",
  "AWP | Containment Breach (Field-Tested)",
  "AWP | Hyper Beast (Field-Tested)",
  "M4A4 | Howl (Field-Tested)",
  "M4A4 | The Emperor (Field-Tested)",
  "M4A4 | Asiimov (Field-Tested)",
  "M4A4 | Desolate Space (Field-Tested)",
  "M4A4 | Neo-Noir (Field-Tested)",
  "M4A4 | Buzz Kill (Field-Tested)",
  "M4A4 | Bullet Rain (Factory New)",
  "M4A1-S | Printstream (Field-Tested)",
  "M4A1-S | Golden Coil (Field-Tested)",
  "M4A1-S | Hyper Beast (Field-Tested)",
  "M4A1-S | Chantico's Fire (Field-Tested)",
  "M4A1-S | Mecha Industries (Field-Tested)",
  "M4A1-S | Player Two (Field-Tested)",
  "M4A1-S | Cyrex (Factory New)",
  "Desert Eagle | Blaze (Factory New)",
  "Desert Eagle | Printstream (Field-Tested)",
  "Desert Eagle | Code Red (Field-Tested)",
  "Desert Eagle | Fennec Fox (Field-Tested)",
  "USP-S | Kill Confirmed (Field-Tested)",
  "USP-S | Printstream (Field-Tested)",
  "USP-S | Neo-Noir (Field-Tested)",
  "USP-S | The Traitor (Field-Tested)",
  "Glock-18 | Fade (Factory New)",
  "Glock-18 | Neo-Noir (Field-Tested)",
  "Glock-18 | Bullet Queen (Field-Tested)",
  "FAMAS | Commemoration (Factory New)",
  "P90 | Death by Kitty (Factory New)",
  "P90 | Asiimov (Field-Tested)",
  "MAC-10 | Stalker (Field-Tested)",
  "SSG 08 | Dragonfire (Factory New)",
  "AUG | Akihabara Accept (Field-Tested)",
  "SG 553 | Integrale (Field-Tested)",
  "Five-SeveN | Hyper Beast (Field-Tested)",
  "Tec-9 | Decimator (Factory New)"
];

const covertItems = covertSkinNames.map((name, index) => {
  const weaponName = name.split("|")[0]?.trim() ?? null;
  const exterior = name.match(/\(([^)]+)\)/)?.[1] ?? null;
  return item(name, "covert_skin", 12 + index * 18.5, {
    rarity: "Covert",
    weaponName,
    exterior
  });
});

export const seedItems = [...caseItems, ...knifeItems, ...gloveItems, ...covertItems];

function sqlString(value: string | null) {
  return value === null ? "NULL" : `'${value.replace(/'/g, "''")}'`;
}

function sqlBool(value: boolean) {
  return value ? "1" : "0";
}

function seedSql() {
  const now = Date.now();
  const lines = [
    "PRAGMA foreign_keys = ON;",
    "BEGIN TRANSACTION;",
    `INSERT INTO partners (id, name, slug, logo_url, primary_color, secondary_color, background_color, text_color, border_radius, cta_label, cta_url, allowed_domains, enabled, created_at, updated_at)
VALUES ('demo', 'Demo Partner', 'demo', NULL, '#d9a441', '#6f9f87', '#10140f', '#f8efe2', '12px', 'Visit partner', NULL, '[]', 1, ${now}, ${now})
ON CONFLICT(slug) DO UPDATE SET
  name = excluded.name,
  primary_color = excluded.primary_color,
  secondary_color = excluded.secondary_color,
  background_color = excluded.background_color,
  text_color = excluded.text_color,
  border_radius = excluded.border_radius,
  cta_label = excluded.cta_label,
  enabled = excluded.enabled,
  updated_at = excluded.updated_at;`
  ];

  for (const seedItem of seedItems) {
    const id = seedItem.marketHashName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 96);

    lines.push(`INSERT INTO items (id, market_hash_name, display_name, category, rarity, weapon_name, exterior, is_stattrak, is_souvenir, image_url, steam_market_url, active, created_at, updated_at)
VALUES (${sqlString(id)}, ${sqlString(seedItem.marketHashName)}, ${sqlString(seedItem.displayName)}, ${sqlString(seedItem.category)}, ${sqlString(seedItem.rarity)}, ${sqlString(seedItem.weaponName)}, ${sqlString(seedItem.exterior)}, ${sqlBool(seedItem.isStatTrak)}, ${sqlBool(seedItem.isSouvenir)}, ${sqlString(seedItem.imageUrl)}, ${sqlString(seedItem.steamMarketUrl)}, ${sqlBool(seedItem.active)}, ${now}, ${now})
ON CONFLICT(market_hash_name) DO UPDATE SET
  display_name = excluded.display_name,
  category = excluded.category,
  rarity = excluded.rarity,
  weapon_name = excluded.weapon_name,
  exterior = excluded.exterior,
  is_stattrak = excluded.is_stattrak,
  is_souvenir = excluded.is_souvenir,
  image_url = excluded.image_url,
  steam_market_url = excluded.steam_market_url,
  active = excluded.active,
  updated_at = excluded.updated_at;`);

    lines.push(`INSERT INTO item_prices (id, item_id, currency, price_eur, volume, source, fetched_at, status, raw_response)
VALUES (${sqlString(`${id}-seed`)}, (SELECT id FROM items WHERE market_hash_name = ${sqlString(seedItem.marketHashName)}), 'EUR', ${seedItem.seedPrice.toFixed(2)}, NULL, 'seed', ${now}, 'success', '{"seeded":true}')
ON CONFLICT(id) DO NOTHING;`);

    lines.push(`INSERT INTO current_item_prices (item_id, price_eur, currency, last_successful_fetch_at, status, updated_at)
VALUES ((SELECT id FROM items WHERE market_hash_name = ${sqlString(seedItem.marketHashName)}), ${seedItem.seedPrice.toFixed(2)}, 'EUR', ${now}, 'success', ${now})
ON CONFLICT(item_id) DO UPDATE SET
  price_eur = excluded.price_eur,
  currency = excluded.currency,
  last_successful_fetch_at = excluded.last_successful_fetch_at,
  status = excluded.status,
  updated_at = excluded.updated_at;`);
  }

  lines.push("COMMIT;");
  return `${lines.join("\n\n")}\n`;
}

async function run(command: string, args: string[]) {
  await new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, { stdio: "inherit", shell: true });
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} ${args.join(" ")} exited with ${code}`));
    });
    child.on("error", reject);
  });
}

async function seed() {
  const mode = process.argv.includes("--remote") ? "--remote" : "--local";
  const tmpDir = ".tmp";
  const seedPath = join(tmpDir, "seed.sql");

  await mkdir(tmpDir, { recursive: true });
  await writeFile(seedPath, seedSql(), "utf8");
  await run("wrangler", ["d1", "execute", "cs-higherlower", mode, "--file", seedPath]);

  console.log(`Seeded ${seedItems.length} items and demo partner via D1 ${mode}.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  seed().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
