import { desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { priceFetchRuns } from "@/db/schema";
import { getDb } from "@/lib/db";

export async function GET() {
  const runs = await getDb()
    .select()
    .from(priceFetchRuns)
    .orderBy(desc(priceFetchRuns.startedAt))
    .limit(50);
  return NextResponse.json(runs);
}
