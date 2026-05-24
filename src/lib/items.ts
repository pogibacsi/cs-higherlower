import { and, desc, eq, gt, inArray } from "drizzle-orm";
import {
  currentItemPrices,
  itemPrices,
  items,
  type ItemSequenceEntry
} from "@/db/schema";
import { getDb } from "@/lib/db";

export async function getPlayableItems(): Promise<ItemSequenceEntry[]> {
  const rows = await getDb()
    .select({
      id: items.id,
      displayName: items.displayName,
      marketHashName: items.marketHashName,
      category: items.category,
      imageUrl: items.imageUrl,
      priceEur: currentItemPrices.priceEur
    })
    .from(items)
    .innerJoin(currentItemPrices, eq(items.id, currentItemPrices.itemId))
    .where(
      and(
        eq(items.active, true),
        inArray(currentItemPrices.status, ["success", "stale"]),
        gt(currentItemPrices.priceEur, 0)
      )
    )
    .orderBy(desc(currentItemPrices.priceEur));

  return rows.map((row) => ({
    ...row,
    priceEur: row.priceEur
  }));
}

export async function listItemsWithPrices(limit = 250) {
  return getDb()
    .select({
      id: items.id,
      marketHashName: items.marketHashName,
      displayName: items.displayName,
      category: items.category,
      rarity: items.rarity,
      active: items.active,
      priceEur: currentItemPrices.priceEur,
      status: currentItemPrices.status,
      lastSuccessfulFetchAt: currentItemPrices.lastSuccessfulFetchAt
    })
    .from(items)
    .leftJoin(currentItemPrices, eq(items.id, currentItemPrices.itemId))
    .limit(limit);
}

export async function listRecentFailedPriceFetches(limit = 50) {
  return getDb()
    .select({
      id: itemPrices.id,
      itemId: itemPrices.itemId,
      displayName: items.displayName,
      marketHashName: items.marketHashName,
      status: itemPrices.status,
      source: itemPrices.source,
      fetchedAt: itemPrices.fetchedAt,
      rawResponse: itemPrices.rawResponse
    })
    .from(itemPrices)
    .innerJoin(items, eq(items.id, itemPrices.itemId))
    .where(inArray(itemPrices.status, ["failed", "stale"]))
    .orderBy(desc(itemPrices.fetchedAt))
    .limit(limit);
}
