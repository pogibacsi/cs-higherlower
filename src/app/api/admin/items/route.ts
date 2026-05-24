import { NextResponse } from "next/server";
import { listItemsWithPrices } from "@/lib/items";

export async function GET() {
  return NextResponse.json(await listItemsWithPrices());
}
