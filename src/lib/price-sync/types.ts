export type PriceFetchResult =
  | {
      ok: true;
      priceEur: number;
      volume: number | null;
      raw: unknown;
    }
  | {
      ok: false;
      statusCode?: number;
      error: string;
      raw?: unknown;
    };

export interface PriceProvider {
  name: string;
  fetchPrice(marketHashName: string): Promise<PriceFetchResult>;
}
