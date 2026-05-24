import { NextResponse, type NextRequest } from "next/server";
import { randomUUID } from "node:crypto";
import { startGame } from "@/lib/game";
import { getEnabledPartner } from "@/lib/partners";
import {
  getRequestHostSource,
  isAllowedEmbedDomain,
  rateLimit,
  requestIp
} from "@/lib/security";
import { startGameSchema } from "@/lib/validation";

async function handleStart(request: NextRequest, input: unknown) {
  const limited = rateLimit(`game:start:${requestIp(request)}`, 40, 60_000);
  if (!limited.ok) return new NextResponse("Rate limit exceeded.", { status: 429 });

  const parsed = startGameSchema.safeParse(input);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  if (parsed.data.partnerSlug) {
    const partner = await getEnabledPartner(parsed.data.partnerSlug);
    if (!partner) return new NextResponse("Partner not found.", { status: 404 });
    const host = getRequestHostSource(request);
    if (!isAllowedEmbedDomain(host, partner.allowedDomains)) {
      return new NextResponse("Embed domain not allowed.", { status: 403 });
    }
  }

  try {
    return NextResponse.json(await startGame(parsed.data));
  } catch (error) {
    return new NextResponse(
      error instanceof Error ? error.message : "Could not start game.",
      { status: 400 }
    );
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  return handleStart(request, {
    mode: searchParams.get("mode") ?? undefined,
    partnerSlug: searchParams.get("partnerSlug") ?? undefined,
    anonymousUserId: searchParams.get("anonymousUserId") ?? randomUUID()
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  return handleStart(request, body);
}
