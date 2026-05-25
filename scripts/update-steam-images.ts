import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { spawn } from "node:child_process";
import { seedItems } from "./seed";

const CSGO_API_SKINS_URL =
  "https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/en/skins.json";
const CSGO_API_CRATES_URL =
  "https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/en/crates.json";
const STEAM_LISTING_BASE = "https://steamcommunity.com/market/listings/730/";

type CatalogItem = {
  name?: string;
  market_hash_name?: string;
  image?: string;
  wears?: Array<string | { name?: string }>;
};

function sqlString(value: string) {
  return `'${value.replace(/'/g, "''")}'`;
}

function itemId(marketHashName: string) {
  return marketHashName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 96);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function stripExterior(marketHashName: string) {
  return marketHashName.replace(/\s+\((Factory New|Minimal Wear|Field-Tested|Well-Worn|Battle-Scarred)\)$/u, "");
}

function wearName(wear: string | { name?: string }) {
  return typeof wear === "string" ? wear : wear.name;
}

async function fetchCatalogItems(url: string) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "CS2HigherLower/0.1 image resolver"
    },
    redirect: "follow"
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }

  return (await response.json()) as CatalogItem[];
}

async function buildCatalogImageMap() {
  const [skins, crates] = await Promise.all([
    fetchCatalogItems(CSGO_API_SKINS_URL),
    fetchCatalogItems(CSGO_API_CRATES_URL)
  ]);
  const images = new Map<string, string>();

  for (const crate of crates) {
    if (!crate.image) continue;
    if (crate.market_hash_name) images.set(crate.market_hash_name, crate.image);
    if (crate.name) images.set(crate.name, crate.image);
  }

  for (const skin of skins) {
    if (!skin.name || !skin.image) continue;

    images.set(skin.name, skin.image);
    for (const wear of skin.wears ?? []) {
      const exterior = wearName(wear);
      if (exterior) {
        images.set(`${skin.name} (${exterior})`, skin.image);
      }
    }
  }

  return images;
}

async function resolveSteamImage(marketHashName: string) {
  const response = await fetch(
    `${STEAM_LISTING_BASE}${encodeURIComponent(marketHashName)}?l=english`,
    {
      headers: {
        "User-Agent":
          "CS2HigherLower/0.1 image resolver; contact site administrator"
      },
      redirect: "follow"
    }
  );

  if (!response.ok) return null;

  const html = await response.text();
  const match = html.match(
    /<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i
  );
  return match ? decodeHtml(match[1]) : null;
}

async function resolveImage(
  marketHashName: string,
  catalogImages: Map<string, string>,
  fallbackDelayMs: number
) {
  const catalogImage =
    catalogImages.get(marketHashName) ?? catalogImages.get(stripExterior(marketHashName));
  if (catalogImage) {
    return { imageUrl: catalogImage, source: "CSGO API" };
  }

  const steamImage = await resolveSteamImage(marketHashName);
  await sleep(fallbackDelayMs);
  return steamImage ? { imageUrl: steamImage, source: "Steam" } : null;
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

async function main() {
  const mode = process.argv.includes("--remote") ? "--remote" : "--local";
  const limitArg = process.argv.find((arg) => arg.startsWith("--limit="));
  const offsetArg = process.argv.find((arg) => arg.startsWith("--offset="));
  const delayArg = process.argv.find((arg) => arg.startsWith("--delay="));
  const offset = offsetArg ? Number(offsetArg.split("=")[1]) : 0;
  const limit = limitArg ? Number(limitArg.split("=")[1]) : seedItems.length - offset;
  const delay = delayArg ? Number(delayArg.split("=")[1]) : 1250;
  const now = Date.now();
  const lines = ["PRAGMA foreign_keys = ON;"];
  let resolved = 0;
  const catalogImages = await buildCatalogImageMap();

  for (const seedItem of seedItems.slice(offset, offset + limit)) {
    const image = await resolveImage(seedItem.marketHashName, catalogImages, delay);
    if (!image) {
      console.warn(`No catalog or Steam image found for ${seedItem.marketHashName}`);
      continue;
    }

    resolved += 1;
    lines.push(
      `UPDATE items SET image_url = ${sqlString(image.imageUrl)}, updated_at = ${now} WHERE id = ${sqlString(itemId(seedItem.marketHashName))};`
    );
    console.log(`Resolved ${seedItem.marketHashName} via ${image.source}`);
  }

  if (resolved === 0) {
    throw new Error("No item images were resolved.");
  }

  const tmpDir = ".tmp";
  const imageSqlPath = join(tmpDir, "steam-images.sql");
  await mkdir(tmpDir, { recursive: true });
  await writeFile(imageSqlPath, `${lines.join("\n")}\n`, "utf8");
  await run("wrangler", ["d1", "execute", "cs-higherlower", mode, "--file", imageSqlPath]);

  console.log(`Updated ${resolved} item images via D1 ${mode}.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
