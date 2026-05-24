import { NextResponse, type NextRequest } from "next/server";
import { mockPriceProvider } from "@/lib/price-sync/mock-provider";
import { runPriceSync } from "@/lib/price-sync/run";
import { steamPriceProvider } from "@/lib/price-sync/steam-provider";

export async function POST(request: NextRequest) {
  const provider =
    request.nextUrl.searchParams.get("provider") === "steam"
      ? steamPriceProvider
      : mockPriceProvider;

  try {
    return NextResponse.json(await runPriceSync(provider));
  } catch (error) {
    return new NextResponse(
      error instanceof Error ? error.message : "Price sync failed.",
      { status: 500 }
    );
  }
}
