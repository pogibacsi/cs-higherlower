import { pathToFileURL } from "node:url";
import { eq } from "drizzle-orm";
import { getDb } from "../src/lib/db";
import {
  currentItemPrices,
  itemPrices,
  items,
  partners,
  type items as itemsTable
} from "../src/db/schema";

type SeedItem = typeof itemsTable.$inferInsert & { seedPrice: number };

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

async function seed() {
  const db = getDb();

  const [existingPartner] = await db
    .select()
    .from(partners)
    .where(eq(partners.slug, "demo"));

  if (!existingPartner) {
    await db.insert(partners).values({
      name: "Demo Partner",
      slug: "demo",
      primaryColor: "#d9a441",
      secondaryColor: "#6f9f87",
      backgroundColor: "#10140f",
      textColor: "#f8efe2",
      borderRadius: "12px",
      ctaLabel: "Visit partner",
      ctaUrl: null,
      allowedDomains: [],
      enabled: true
    });
  }

  const now = new Date();
  for (const seedItem of seedItems) {
    const { seedPrice, ...insertItem } = seedItem;
    await db
      .insert(items)
      .values(insertItem)
      .onConflictDoUpdate({
        target: items.marketHashName,
        set: {
          displayName: insertItem.displayName,
          category: insertItem.category,
          rarity: insertItem.rarity,
          weaponName: insertItem.weaponName,
          exterior: insertItem.exterior,
          isStatTrak: insertItem.isStatTrak,
          isSouvenir: insertItem.isSouvenir,
          imageUrl: insertItem.imageUrl,
          steamMarketUrl: insertItem.steamMarketUrl,
          active: true,
          updatedAt: now
        }
      });

    const [created] = await db
      .select({ id: items.id })
      .from(items)
      .where(eq(items.marketHashName, insertItem.marketHashName));

    if (!created) continue;

    await db.insert(itemPrices).values({
      itemId: created.id,
      priceEur: seedPrice.toFixed(2),
      status: "success",
      source: "seed",
      rawResponse: { seeded: true }
    });

    await db
      .insert(currentItemPrices)
      .values({
        itemId: created.id,
        priceEur: seedPrice.toFixed(2),
        currency: "EUR",
        lastSuccessfulFetchAt: now,
        status: "success",
        updatedAt: now
      })
      .onConflictDoUpdate({
        target: currentItemPrices.itemId,
        set: {
          priceEur: seedPrice.toFixed(2),
          currency: "EUR",
          lastSuccessfulFetchAt: now,
          status: "success",
          updatedAt: now
        }
      });
  }

  console.log(`Seeded ${seedItems.length} items and demo partner.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  seed().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
