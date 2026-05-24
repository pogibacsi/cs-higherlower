import { asc, eq } from "drizzle-orm";
import {
  currentItemPrices,
  itemPrices,
  items,
  priceFetchRuns
} from "@/db/schema";
import { getDb } from "@/lib/db";
import { env } from "@/lib/env";
import type { PriceProvider } from "@/lib/price-sync/types";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(provider: PriceProvider, marketHashName: string) {
  let delay = env.PRICE_SYNC_DELAY_MS;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const result = await provider.fetchPrice(marketHashName);
    if (result.ok) return result;
    await sleep(delay);
    delay *= result.statusCode === 429 ? 3 : 2;
  }
  return provider.fetchPrice(marketHashName);
}

export async function runPriceSync(provider: PriceProvider) {
  const db = getDb();
  const activeItems = await db
    .select({
      id: items.id,
      marketHashName: items.marketHashName
    })
    .from(items)
    .where(eq(items.active, true))
    .orderBy(asc(items.marketHashName));

  const [run] = await db
    .insert(priceFetchRuns)
    .values({ status: "running", totalItems: activeItems.length })
    .returning();

  let successCount = 0;
  let failCount = 0;
  const errors: Array<{ marketHashName: string; error: string }> = [];

  for (let index = 0; index < activeItems.length; index += env.PRICE_SYNC_BATCH_SIZE) {
    const batch = activeItems.slice(index, index + env.PRICE_SYNC_BATCH_SIZE);

    for (const item of batch) {
      const result = await fetchWithRetry(provider, item.marketHashName);
      const now = new Date();

      if (result.ok) {
        successCount += 1;
        await db.insert(itemPrices).values({
          itemId: item.id,
          priceEur: result.priceEur.toFixed(2),
          volume: result.volume,
          source: provider.name,
          fetchedAt: now,
          status: "success",
          rawResponse: result.raw
        });

        await db
          .insert(currentItemPrices)
          .values({
            itemId: item.id,
            priceEur: result.priceEur.toFixed(2),
            currency: "EUR",
            lastSuccessfulFetchAt: now,
            status: "success",
            updatedAt: now
          })
          .onConflictDoUpdate({
            target: currentItemPrices.itemId,
            set: {
              priceEur: result.priceEur.toFixed(2),
              currency: "EUR",
              lastSuccessfulFetchAt: now,
              status: "success",
              updatedAt: now
            }
          });
      } else {
        failCount += 1;
        errors.push({ marketHashName: item.marketHashName, error: result.error });
        await db.insert(itemPrices).values({
          itemId: item.id,
          priceEur: "0.00",
          volume: null,
          source: provider.name,
          fetchedAt: now,
          status: "failed",
          rawResponse: result.raw ?? { error: result.error }
        });

        await db
          .update(currentItemPrices)
          .set({
            status: "stale",
            updatedAt: now
          })
          .where(eq(currentItemPrices.itemId, item.id));
      }

      await sleep(env.PRICE_SYNC_DELAY_MS);
    }
  }

  const status = failCount > 0 && successCount === 0 ? "failed" : "completed";
  const [updatedRun] = await db
    .update(priceFetchRuns)
    .set({
      status,
      finishedAt: new Date(),
      successCount,
      failCount,
      errorSummary: errors.slice(0, 100)
    })
    .where(eq(priceFetchRuns.id, run.id))
    .returning();

  return updatedRun;
}
