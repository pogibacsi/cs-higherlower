import { NextResponse, type NextRequest } from "next/server";
import { listLeaderboard } from "@/lib/leaderboard";
import { leaderboardQuerySchema } from "@/lib/validation";

export async function GET(request: NextRequest) {
  const parsed = leaderboardQuerySchema.safeParse(
    Object.fromEntries(request.nextUrl.searchParams)
  );
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  return NextResponse.json(await listLeaderboard(parsed.data));
}
