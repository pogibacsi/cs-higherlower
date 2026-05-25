type StartGameResponse = {
  sessionId: string;
  left: { priceEur: number };
  right: { priceEur: null };
};

type AnswerResponse = {
  correct: boolean;
  completed: boolean;
  revealedRight: { priceEur: number };
};

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function baseUrl() {
  return (process.env.CF_PREVIEW_URL ?? "http://localhost:8787").replace(/\/$/, "");
}

async function request(path: string, init?: RequestInit) {
  const response = await fetch(`${baseUrl()}${path}`, init);
  const text = await response.text();
  const body = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(`${init?.method ?? "GET"} ${path} failed: ${response.status} ${text}`);
  }

  return body as unknown;
}

async function smoke() {
  const anon = `smoke-${crypto.randomUUID()}`;
  const started = (await request(
    `/api/game/start?mode=daily&anonymousUserId=${encodeURIComponent(anon)}`
  )) as StartGameResponse;

  assert(Boolean(started.sessionId), "Game start should return a session id.");
  assert(typeof started.left.priceEur === "number", "Left item price should be revealed.");
  assert(started.right.priceEur === null, "Right item price should be hidden.");

  const answer = (await request("/api/game/answer", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ sessionId: started.sessionId, answer: "higher" })
  })) as AnswerResponse;

  assert(
    typeof answer.revealedRight.priceEur === "number",
    "Answer response should reveal the right item price."
  );
  assert(typeof answer.completed === "boolean", "Answer response should include completion state.");
  assert(typeof answer.correct === "boolean", "Answer response should include correctness.");

  const items = (await request("/api/admin/items")) as unknown[];
  assert(Array.isArray(items) && items.length >= 100, "Admin item list should return seeded items.");

  const leaderboard = (await request("/api/leaderboard?mode=daily&scope=global")) as unknown[];
  assert(Array.isArray(leaderboard), "Leaderboard should return an array.");

  console.log("Cloudflare preview smoke test passed.");
}

smoke().catch((error) => {
  console.error(error);
  process.exit(1);
});

export {};
