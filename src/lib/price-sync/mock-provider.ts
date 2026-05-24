import type { PriceProvider } from "@/lib/price-sync/types";

function hashName(name: string) {
  let hash = 0;
  for (let index = 0; index < name.length; index += 1) {
    hash = (hash * 31 + name.charCodeAt(index)) >>> 0;
  }
  return hash;
}

export const mockPriceProvider: PriceProvider = {
  name: "mock_price_provider",
  async fetchPrice(marketHashName) {
    const hash = hashName(marketHashName);
    const priceEur = Number(((hash % 250000) / 100 + 0.35).toFixed(2));
    return {
      ok: true,
      priceEur,
      volume: hash % 2000,
      raw: { mocked: true, marketHashName }
    };
  }
};
