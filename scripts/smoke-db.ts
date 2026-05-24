import { eq } from "drizzle-orm";
import { gameSessions, items } from "../src/db/schema";
import { getDb } from "../src/lib/db";
import { answerRound, startGame } from "../src/lib/game";
import { listLeaderboard, submitScore } from "../src/lib/leaderboard";
import { getEnabledPartner } from "../src/lib/partners";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

function expectedAnswer(leftPrice: number, rightPrice: number) {
  return rightPrice > leftPrice ? "higher" : "lower";
}

async function sessionSequence(sessionId: string) {
  const [session] = await getDb()
    .select()
    .from(gameSessions)
    .where(eq(gameSessions.id, sessionId))
    .limit(1);

  assert(Boolean(session), `Missing session ${sessionId}`);
  return session!.itemSequence;
}

async function verifySeedCounts() {
  const rows = await getDb()
    .select({ category: items.category })
    .from(items)
    .where(eq(items.active, true));

  const counts = rows.reduce<Record<string, number>>((acc, row) => {
    acc[row.category] = (acc[row.category] ?? 0) + 1;
    return acc;
  }, {});

  assert((counts.case ?? 0) >= 20, "Expected at least 20 active cases.");
  assert((counts.knife ?? 0) >= 30, "Expected at least 30 active knives.");
  assert((counts.glove ?? 0) >= 20, "Expected at least 20 active gloves.");
  assert(
    (counts.covert_skin ?? 0) >= 50,
    "Expected at least 50 active covert skins."
  );
}

async function smoke() {
  await verifySeedCounts();

  const partner = await getEnabledPartner("demo");
  assert(Boolean(partner), "Expected enabled demo partner from seed data.");

  const dailyA = await startGame({
    mode: "daily",
    partnerSlug: "demo",
    anonymousUserId: `smoke-a-${crypto.randomUUID()}`
  });
  const dailyB = await startGame({
    mode: "daily",
    partnerSlug: "demo",
    anonymousUserId: `smoke-b-${crypto.randomUUID()}`
  });

  const sequenceA = await sessionSequence(dailyA.sessionId);
  const sequenceB = await sessionSequence(dailyB.sessionId);
  assert(sequenceA.length >= 12, "Daily sequence should contain playable rounds.");
  assert(
    JSON.stringify(sequenceA.map((item) => item.id)) ===
      JSON.stringify(sequenceB.map((item) => item.id)),
    "Daily challenge should use the same ordered sequence for the same date."
  );

  const firstAnswer = expectedAnswer(sequenceA[0].priceEur, sequenceA[1].priceEur);
  const firstResult = await answerRound({
    sessionId: dailyA.sessionId,
    answer: firstAnswer
  });
  assert(firstResult.correct, "Expected first smoke answer to be correct.");

  const updatedSequence = await sessionSequence(dailyA.sessionId);
  const secondExpected = expectedAnswer(
    updatedSequence[1].priceEur,
    updatedSequence[2].priceEur
  );
  const wrongSecondAnswer = secondExpected === "higher" ? "lower" : "higher";
  const gameOver = await answerRound({
    sessionId: dailyA.sessionId,
    answer: wrongSecondAnswer
  });
  assert(gameOver.completed, "Wrong answer should complete the session.");

  const submitted = await submitScore({
    sessionId: dailyA.sessionId,
    nickname: "Smoke Test",
    userAgent: "smoke-db"
  });
  assert(submitted.score === 1, "Submitted score should come from server session.");

  let duplicateRejected = false;
  try {
    await submitScore({
      sessionId: dailyA.sessionId,
      nickname: "Smoke Test",
      userAgent: "smoke-db"
    });
  } catch {
    duplicateRejected = true;
  }
  assert(duplicateRejected, "Duplicate score submission should be rejected.");

  const rows = await listLeaderboard({
    mode: "daily",
    date: dailyA.challengeDate ?? undefined,
    partnerSlug: "demo",
    scope: "partner"
  });
  assert(
    rows.some((row) => row.nickname === "Smoke Test" && row.score === 1),
    "Leaderboard should include submitted smoke score."
  );

  console.log("Database smoke test passed.");
}

smoke().catch((error) => {
  console.error(error);
  process.exit(1);
});
