import { and, eq } from "drizzle-orm";
import { dailyChallenges, gameSessions, type ItemSequenceEntry } from "@/db/schema";
import { recordAnalyticsEvent } from "@/lib/analytics";
import { getDb } from "@/lib/db";
import { env } from "@/lib/env";
import { getPlayableItems } from "@/lib/items";
import { getEnabledPartner } from "@/lib/partners";

const MIN_SEQUENCE_LENGTH = 12;
const MIN_PRICE_DIFF_RATIO = 0.035;

type GameMode = "daily" | "classic";

function dateInTimezone(timezone: string) {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(new Date());

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;
  return `${year}-${month}-${day}`;
}

function hashSeed(seed: string) {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mulberry32(seed: number) {
  return () => {
    let value = (seed += 0x6d2b79f5);
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(input: T[], seed: string) {
  const output = [...input];
  const random = mulberry32(hashSeed(seed));
  for (let index = output.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [output[index], output[swapIndex]] = [output[swapIndex], output[index]];
  }
  return output;
}

function priceDiffOk(a: ItemSequenceEntry, b: ItemSequenceEntry) {
  const base = Math.max(Math.min(a.priceEur, b.priceEur), 0.01);
  return Math.abs(a.priceEur - b.priceEur) / base >= MIN_PRICE_DIFF_RATIO;
}

function buildSequence(items: ItemSequenceEntry[], seed: string) {
  const shuffled = shuffle(items, seed);
  const sequence: ItemSequenceEntry[] = [];
  const used = new Set<string>();

  for (const candidate of shuffled) {
    const previous = sequence.at(-1);
    if (used.has(candidate.id)) continue;
    if (previous && !priceDiffOk(previous, candidate)) continue;

    sequence.push(candidate);
    used.add(candidate.id);
    if (sequence.length >= Math.min(40, items.length)) break;
  }

  if (sequence.length < MIN_SEQUENCE_LENGTH) {
    throw new Error("Not enough playable items with distinct prices.");
  }

  return sequence;
}

async function getDailySequence(challengeDate: string, timezone: string) {
  const db = getDb();
  const [existing] = await db
    .select()
    .from(dailyChallenges)
    .where(eq(dailyChallenges.challengeDate, challengeDate))
    .limit(1);

  if (existing) return existing.itemSequence;

  const seed = `cs2-higherlower:${challengeDate}:${timezone}`;
  const sequence = buildSequence(await getPlayableItems(), seed);

  const [created] = await db
    .insert(dailyChallenges)
    .values({
      challengeDate,
      timezone,
      seed,
      itemSequence: sequence
    })
    .onConflictDoNothing()
    .returning();

  if (created) return created.itemSequence;

  const [raced] = await db
    .select()
    .from(dailyChallenges)
    .where(eq(dailyChallenges.challengeDate, challengeDate))
    .limit(1);

  return raced.itemSequence;
}

function publicRound(sequence: ItemSequenceEntry[], round: number, reveal = false) {
  const left = sequence[round];
  const right = sequence[round + 1];
  return {
    left,
    right: reveal ? right : { ...right, priceEur: null }
  };
}

export async function startGame(input: {
  mode: GameMode;
  partnerSlug?: string;
  anonymousUserId: string;
}) {
  const timezone = env.DEFAULT_TIMEZONE;
  const challengeDate = input.mode === "daily" ? dateInTimezone(timezone) : null;
  const partner = input.partnerSlug
    ? await getEnabledPartner(input.partnerSlug)
    : null;

  if (input.partnerSlug && !partner) {
    throw new Error("Partner not found or disabled.");
  }

  const sequence =
    input.mode === "daily"
      ? await getDailySequence(challengeDate!, timezone)
      : buildSequence(
          await getPlayableItems(),
          `${input.anonymousUserId}:${Date.now()}:${Math.random()}`
        );

  const [session] = await getDb()
    .insert(gameSessions)
    .values({
      mode: input.mode,
      partnerId: partner?.id ?? null,
      challengeDate,
      anonymousUserId: input.anonymousUserId,
      itemSequence: sequence
    })
    .returning();

  await recordAnalyticsEvent({
    eventType: "game_started",
    partnerId: partner?.id ?? null,
    mode: input.mode
  });

  return {
    sessionId: session.id,
    mode: input.mode,
    challengeDate,
    score: 0,
    round: 0,
    ...publicRound(sequence, 0)
  };
}

export async function answerRound(input: {
  sessionId: string;
  answer: "higher" | "lower";
}) {
  const db = getDb();
  const [session] = await db
    .select()
    .from(gameSessions)
    .where(and(eq(gameSessions.id, input.sessionId), eq(gameSessions.completed, false)))
    .limit(1);

  if (!session) {
    throw new Error("Active session not found.");
  }

  const sequence = session.itemSequence;
  const left = sequence[session.currentRound];
  const right = sequence[session.currentRound + 1];
  if (!left || !right) {
    throw new Error("Round not available.");
  }

  const expected = right.priceEur > left.priceEur ? "higher" : "lower";
  const correct = input.answer === expected;
  const nextScore = correct ? session.currentScore + 1 : session.currentScore;
  const nextRound = correct ? session.currentRound + 1 : session.currentRound;
  const completed = !correct || nextRound >= sequence.length - 1;

  await db
    .update(gameSessions)
    .set({
      currentScore: nextScore,
      currentRound: nextRound,
      completed,
      updatedAt: new Date()
    })
    .where(
      and(
        eq(gameSessions.id, session.id),
        eq(gameSessions.completed, false),
        eq(gameSessions.currentRound, session.currentRound),
        eq(gameSessions.currentScore, session.currentScore)
      )
    )
    .returning({ id: gameSessions.id })
    .then((updated) => {
      if (updated.length === 0) {
        throw new Error("Round has already been answered.");
      }
    });

  await recordAnalyticsEvent({
    eventType: "answer_submitted",
    partnerId: session.partnerId,
    mode: session.mode
  });

  if (completed) {
    await recordAnalyticsEvent({
      eventType: "game_over",
      partnerId: session.partnerId,
      mode: session.mode
    });
  }

  return {
    correct,
    expected,
    score: nextScore,
    round: nextRound,
    completed,
    revealedRight: right,
    nextRound: completed ? null : publicRound(sequence, nextRound)
  };
}

export async function getSessionForScore(sessionId: string) {
  const [session] = await getDb()
    .select()
    .from(gameSessions)
    .where(eq(gameSessions.id, sessionId))
    .limit(1);
  return session ?? null;
}
