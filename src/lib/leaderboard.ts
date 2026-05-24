import { and, desc, eq, isNull } from "drizzle-orm";
import { scoreSessionUniq, scores, type gameModeEnum } from "@/db/schema";
import { recordAnalyticsEvent } from "@/lib/analytics";
import { getDb } from "@/lib/db";
import { getEnabledPartner } from "@/lib/partners";
import { hashUserAgent, sanitizeNickname } from "@/lib/security";
import { getSessionForScore } from "@/lib/game";

type Mode = (typeof gameModeEnum.enumValues)[number];

export async function listLeaderboard(input: {
  mode: Mode;
  date?: string;
  partnerSlug?: string;
  scope: "global" | "partner";
}) {
  const partner = input.partnerSlug
    ? await getEnabledPartner(input.partnerSlug)
    : null;

  const rows = await getDb()
    .select({
      nickname: scores.nickname,
      score: scores.score,
      roundsPlayed: scores.roundsPlayed,
      createdAt: scores.createdAt
    })
    .from(scores)
    .where(
      and(
        eq(scores.mode, input.mode),
        input.mode === "daily" && input.date
          ? eq(scores.challengeDate, input.date)
          : undefined,
        input.scope === "partner" && partner
          ? eq(scores.partnerId, partner.id)
          : input.scope === "partner"
            ? isNull(scores.partnerId)
            : undefined
      )
    )
    .orderBy(desc(scores.score), scores.createdAt)
    .limit(50);

  return rows;
}

export async function submitScore(input: {
  sessionId: string;
  nickname: string;
  userAgent: string | null;
}) {
  const db = getDb();
  const session = await getSessionForScore(input.sessionId);
  if (!session) throw new Error("Session not found.");
  if (!session.completed) throw new Error("Score can only be submitted after game over.");

  const nickname = sanitizeNickname(input.nickname) || "Player";

  const [submissionLock] = await db
    .insert(scoreSessionUniq)
    .values({ sessionId: session.id })
    .onConflictDoNothing()
    .returning();

  if (!submissionLock) {
    throw new Error("Score has already been submitted.");
  }

  const [score] = await db
    .insert(scores)
    .values({
      mode: session.mode,
      challengeDate: session.challengeDate,
      partnerId: session.partnerId,
      nickname,
      score: session.currentScore,
      roundsPlayed: session.currentRound + 1,
      anonymousUserId: session.anonymousUserId,
      sessionId: session.id,
      userAgentHash: hashUserAgent(input.userAgent)
    })
    .returning();

  await recordAnalyticsEvent({
    eventType: "score_submitted",
    partnerId: session.partnerId,
    mode: session.mode
  });

  return score;
}
