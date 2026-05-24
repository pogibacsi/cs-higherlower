import type { PriceProvider } from "@/lib/price-sync/types";
import { env } from "@/lib/env";

function parseSteamPrice(value: string | undefined) {
  if (!value) return null;
  const normalized = value
    .replace(/[^\d,.-]/g, "")
    .replace(/\.(?=\d{3}(?:\D|$))/g, "")
    .replace(",", ".");
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

export const steamPriceProvider: PriceProvider = {
  name: "steam_market",
  async fetchPrice(marketHashName) {
    const url = new URL(
      "https://steamcommunity.com/market/priceoverview/"
    );
    url.searchParams.set("appid", "730");
    url.searchParams.set("currency", "3");
    url.searchParams.set("market_hash_name", marketHashName);

    const response = await fetch(url, {
      headers: {
        "User-Agent":
          `CS2HigherLower/0.1 (+${env.NEXT_PUBLIC_APP_URL ?? "https://cs2-higherlower.local"}; price sync; contact admin)`
      },
      cache: "no-store"
    });

    const raw = (await response.json().catch(() => null)) as
      | { success?: boolean; lowest_price?: string; median_price?: string; volume?: string }
      | null;

    if (response.status === 429) {
      return { ok: false, statusCode: 429, error: "Rate limited", raw };
    }

    if (!response.ok || !raw?.success) {
      return {
        ok: false,
        statusCode: response.status,
        error: "Steam priceoverview returned an unsuccessful response.",
        raw
      };
    }

    const price = parseSteamPrice(raw.lowest_price ?? raw.median_price);
    if (!price) {
      return { ok: false, statusCode: response.status, error: "No EUR price found.", raw };
    }

    return {
      ok: true,
      priceEur: price,
      volume: raw.volume ? Number.parseInt(raw.volume.replace(/\D/g, ""), 10) : null,
      raw
    };
  }
};
