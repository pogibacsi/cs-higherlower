import { NextResponse, type NextRequest } from "next/server";
import { answerRound } from "@/lib/game";
import { rateLimit, requestIp } from "@/lib/security";
import { answerSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  const limited = rateLimit(`game:answer:${requestIp(request)}`, 120, 60_000);
  if (!limited.ok) return new NextResponse("Rate limit exceeded.", { status: 429 });

  const body = await request.json().catch(() => null);
  const parsed = answerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    return NextResponse.json(await answerRound(parsed.data));
  } catch (error) {
    return new NextResponse(
      error instanceof Error ? error.message : "Could not submit answer.",
      { status: 400 }
    );
  }
}
