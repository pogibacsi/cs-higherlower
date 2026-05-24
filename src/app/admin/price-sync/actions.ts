"use server";

import { revalidatePath } from "next/cache";
import { mockPriceProvider } from "@/lib/price-sync/mock-provider";
import { runPriceSync } from "@/lib/price-sync/run";

export async function runMockPriceSyncAction() {
  await runPriceSync(mockPriceProvider);
  revalidatePath("/admin/price-sync");
  revalidatePath("/admin/items");
}
