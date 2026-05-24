import { and, asc, eq, gt, sql } from "drizzle-orm";
import {
  currentItemPrices,
  itemPrices,
  items,
  priceFetchRuns,
  syncState
} from "@/db/schema";
import { getDb } from "@/lib/db";
import { env } from "@/lib/env";
import type { PriceProvider } from "@/lib/price-sync/types";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

type RunPriceSyncOptions = {
  database?: D1Database;
  maxItems?: number;
  delayMs?: number;
};

async function fetchWithRetry(
  provider: PriceProvider,
  marketHashName: string,
  delayMs: number
) {
  let delay = delayMs;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const result = await provider.fetchPrice(marketHashName);
    if (result.ok) return result;
    await sleep(delay);
    delay *= result.statusCode === 429 ? 3 : 2;
  }
  return provider.fetchPrice(marketHashName);
}

export async function runPriceSync(
  provider: PriceProvider,
  options: RunPriceSyncOptions = {}
) {
  const db = getDb(options.database);
  const maxItems = Math.max(1, options.maxItems ?? env.PRICE_SYNC_BATCH_SIZE);
  const delayMs = Math.max(0, options.delayMs ?? env.PRICE_SYNC_DELAY_MS);
  const cursorKey = `${provider.name}_price_cursor`;

  const [cursorRow] = await db
    .select({ value: syncState.value })
    .from(syncState)
    .where(eq(syncState.key, cursorKey));

  const selectBatch = (after?: string) =>
    db
      .select({
        id: items.id,
        marketHashName: items.marketHashName
      })
      .from(items)
      .where(
        and(
          eq(items.active, true),
          after ? gt(items.marketHashName, after) : undefined
        )
      )
      .orderBy(asc(items.marketHashName))
      .limit(maxItems);

  let activeItems = await selectBatch(cursorRow?.value);
  if (activeItems.length === 0 && cursorRow?.value) {
    activeItems = await selectBatch();
  }

  const [totalRow] = await db
    .select({
      count: sql<number>`count(*)`
    })
    .from(items)
    .where(eq(items.active, true));
  const totalActiveItems = Number(totalRow?.count ?? activeItems.length);

  const [run] = await db
    .insert(priceFetchRuns)
    .values({ status: "running", totalItems: totalActiveItems ?? activeItems.length })
    .returning();

  let successCount = 0;
  let failCount = 0;
  const errors: Array<{ marketHashName: string; error: string }> = [];

  for (let index = 0; index < activeItems.length; index += env.PRICE_SYNC_BATCH_SIZE) {
    const batch = activeItems.slice(index, index + maxItems);

    for (const item of batch) {
      const result = await fetchWithRetry(provider, item.marketHashName, delayMs);
      const now = new Date();

      if (result.ok) {
        successCount += 1;
        await db.insert(itemPrices).values({
          itemId: item.id,
          priceEur: Number(result.priceEur.toFixed(2)),
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
            priceEur: Number(result.priceEur.toFixed(2)),
            currency: "EUR",
            lastSuccessfulFetchAt: now,
            status: "success",
            updatedAt: now
          })
          .onConflictDoUpdate({
            target: currentItemPrices.itemId,
            set: {
              priceEur: Number(result.priceEur.toFixed(2)),
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
          priceEur: 0,
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

      await sleep(delayMs);
    }
  }

  const lastItem = activeItems.at(-1);
  if (lastItem) {
    await db
      .insert(syncState)
      .values({
        key: cursorKey,
        value: lastItem.marketHashName,
        updatedAt: new Date()
      })
      .onConflictDoUpdate({
        target: syncState.key,
        set: {
          value: lastItem.marketHashName,
          updatedAt: new Date()
        }
      });
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
