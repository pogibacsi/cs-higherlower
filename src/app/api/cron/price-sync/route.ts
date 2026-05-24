import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/lib/env";
import { runPriceSync } from "@/lib/price-sync/run";
import { steamPriceProvider } from "@/lib/price-sync/steam-provider";

export async function POST(request: NextRequest) {
  const supplied = request.headers.get("x-cron-secret");
  if (!env.PRICE_SYNC_CRON_SECRET || supplied !== env.PRICE_SYNC_CRON_SECRET) {
    return new NextResponse("Not found.", { status: 404 });
  }

  return NextResponse.json(await runPriceSync(steamPriceProvider));
}
