import { NextResponse, type NextRequest } from "next/server";
import { submitScore } from "@/lib/leaderboard";
import { rateLimit, requestIp } from "@/lib/security";
import { submitScoreSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  const limited = rateLimit(`scores:submit:${requestIp(request)}`, 15, 60_000);
  if (!limited.ok) return new NextResponse("Rate limit exceeded.", { status: 429 });

  const body = await request.json().catch(() => null);
  const parsed = submitScoreSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const score = await submitScore({
      ...parsed.data,
      userAgent: request.headers.get("user-agent")
    });
    return NextResponse.json(score);
  } catch (error) {
    return new NextResponse(
      error instanceof Error ? error.message : "Could not submit score.",
      { status: 400 }
    );
  }
}
