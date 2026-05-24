"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowDown, ArrowUp, RotateCcw, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ItemCard } from "@/components/game/item-card";
import { LeaderboardPanel } from "@/components/game/leaderboard-panel";
import type {
  AnswerResponse,
  GameStartResponse,
  LeaderboardRow,
  PublicItem
} from "@/components/game/types";
import { cn } from "@/lib/cn";

type PartnerConfig = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  borderRadius: string;
  ctaLabel: string | null;
  ctaUrl: string | null;
};

function anonymousId() {
  const key = "cs2hl:anonymous-user-id";
  const existing = window.localStorage.getItem(key);
  if (existing) return existing;
  const created = crypto.randomUUID();
  window.localStorage.setItem(key, created);
  return created;
}

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function EmbedGame({
  partner,
  initialMode = "daily",
  framed = true
}: {
  partner: PartnerConfig;
  initialMode?: "daily" | "classic";
  framed?: boolean;
}) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [mode, setMode] = useState<"daily" | "classic">(initialMode);
  const [game, setGame] = useState<GameStartResponse | null>(null);
  const [answer, setAnswer] = useState<AnswerResponse | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([]);
  const [nickname, setNickname] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [bestClassic, setBestClassic] = useState(0);

  const currentCards = useMemo(() => {
    if (!game) return null;
    if (answer?.revealedRight) {
      return {
        left: game.left,
        right: answer.revealedRight as PublicItem
      };
    }
    return { left: game.left, right: game.right };
  }, [answer, game]);

  const fetchLeaderboard = useCallback(
    async (targetMode = mode, date = game?.challengeDate ?? undefined) => {
      const params = new URLSearchParams({
        mode: targetMode,
        partnerSlug: partner.slug,
        scope: "partner"
      });
      if (targetMode === "daily" && date) params.set("date", date);
      const response = await fetch(`/api/leaderboard?${params.toString()}`);
      if (response.ok) setLeaderboard(await response.json());
    },
    [game?.challengeDate, mode, partner.slug]
  );

  const start = useCallback(
    async (targetMode = mode) => {
      setLoading(true);
      setMessage(null);
      setAnswer(null);
      try {
        const response = await fetch("/api/game/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode: targetMode,
            partnerSlug: partner.slug,
            anonymousUserId: anonymousId()
          })
        });
        if (!response.ok) throw new Error(await response.text());
        const nextGame = (await response.json()) as GameStartResponse;
        setGame(nextGame);
        setMode(targetMode);
        await fetchLeaderboard(targetMode, nextGame.challengeDate ?? undefined);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Could not start game.");
      } finally {
        setLoading(false);
      }
    },
    [fetchLeaderboard, mode, partner.slug]
  );

  const submitAnswer = useCallback(
    async (choice: "higher" | "lower") => {
      if (!game || answer || loading) return;
      setLoading(true);
      setMessage(null);
      try {
        const response = await fetch("/api/game/answer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId: game.sessionId, answer: choice })
        });
        if (!response.ok) throw new Error(await response.text());
        const result = (await response.json()) as AnswerResponse;
        setAnswer(result);
        if (mode === "classic" && result.score > bestClassic) {
          window.localStorage.setItem("cs2hl:best-classic", String(result.score));
          setBestClassic(result.score);
        }
        if (result.completed) await fetchLeaderboard(mode, game.challengeDate ?? undefined);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Could not submit answer.");
      } finally {
        setLoading(false);
      }
    },
    [answer, bestClassic, fetchLeaderboard, game, loading, mode]
  );

  const continueRound = useCallback(() => {
    if (!game || !answer?.nextRound) return;
    setGame({
      ...game,
      score: answer.score,
      round: answer.round,
      left: answer.nextRound.left,
      right: answer.nextRound.right
    });
    setAnswer(null);
  }, [answer, game]);

  const submitScore = useCallback(async () => {
    if (!game || !answer?.completed) return;
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch("/api/scores/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: game.sessionId, nickname })
      });
      if (!response.ok) throw new Error(await response.text());
      setMessage("Score submitted.");
      await fetchLeaderboard(mode, game.challengeDate ?? undefined);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not submit score.");
    } finally {
      setLoading(false);
    }
  }, [answer?.completed, fetchLeaderboard, game, mode, nickname]);

  useEffect(() => {
    setBestClassic(Number(window.localStorage.getItem("cs2hl:best-classic") ?? "0"));
    void start(initialMode);
  }, [initialMode, start]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "h") void submitAnswer("higher");
      if (event.key.toLowerCase() === "l") void submitAnswer("lower");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [submitAnswer]);

  useEffect(() => {
    if (!framed || !rootRef.current) return;
    const observer = new ResizeObserver(([entry]) => {
      window.parent?.postMessage(
        {
          type: "cs2-higherlower:resize",
          height: Math.ceil(entry.contentRect.height)
        },
        "*"
      );
    });
    observer.observe(rootRef.current);
    return () => observer.disconnect();
  }, [framed]);

  const themeStyle = {
    "--partner-primary": partner.primaryColor,
    "--partner-secondary": partner.secondaryColor,
    "--partner-bg": partner.backgroundColor,
    "--partner-text": partner.textColor,
    "--partner-radius": partner.borderRadius
  } as React.CSSProperties;

  return (
    <main ref={rootRef} className="embed-root p-4 sm:p-6" style={themeStyle}>
      <div className="mx-auto grid w-full max-w-6xl gap-5">
        <header className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/50">
              CS2 Higher / Lower
            </p>
            <h1 className="text-balance text-3xl font-black leading-none sm:text-5xl">
              {partner.name}
            </h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant={mode === "daily" ? "primary" : "ghost"}
              disabled={loading}
              onClick={() => void start("daily")}
              className="bg-[var(--partner-primary)] text-black hover:brightness-105"
            >
              Daily
            </Button>
            <Button
              type="button"
              variant={mode === "classic" ? "primary" : "ghost"}
              disabled={loading}
              onClick={() => void start("classic")}
              className={cn(
                mode === "classic" &&
                  "bg-[var(--partner-secondary)] text-white hover:brightness-105"
              )}
            >
              Classic
            </Button>
          </div>
        </header>

        <section className="grid gap-4 lg:grid-cols-[1fr_18rem]">
          <div className="grid gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--partner-radius,12px)] border border-white/12 bg-black/18 px-4 py-3">
              <div className="flex gap-6">
                <span>
                  <span className="block text-xs uppercase tracking-[0.12em] text-white/45">
                    Score
                  </span>
                  <strong className="text-2xl">{answer?.score ?? game?.score ?? 0}</strong>
                </span>
                {mode === "classic" ? (
                  <span>
                    <span className="block text-xs uppercase tracking-[0.12em] text-white/45">
                      Best
                    </span>
                    <strong className="text-2xl">{bestClassic}</strong>
                  </span>
                ) : (
                  <span>
                    <span className="block text-xs uppercase tracking-[0.12em] text-white/45">
                      Date
                    </span>
                    <strong className="text-lg">{game?.challengeDate ?? "..."}</strong>
                  </span>
                )}
              </div>
              <Button
                type="button"
                variant="ghost"
                disabled={loading}
                onClick={() => void start(mode)}
                className="text-white hover:bg-white/10"
              >
                <RotateCcw className="mr-2 size-4" />
                Restart
              </Button>
            </div>

            {currentCards ? (
              <div className="grid gap-4 md:grid-cols-2">
                <ItemCard item={currentCards.left} label="Known price" />
                <ItemCard
                  item={currentCards.right}
                  label="Guess this"
                  state={
                    answer ? (answer.correct ? "correct" : "wrong") : "default"
                  }
                />
              </div>
            ) : (
              <div className="min-h-[26rem] rounded-[var(--partner-radius,12px)] border border-white/12 bg-white/[0.05]" />
            )}

            {message ? (
              <p className="rounded-md border border-white/12 bg-black/20 px-3 py-2 text-sm text-white/75">
                {message}
              </p>
            ) : null}

            {!answer?.completed ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <Button
                  type="button"
                  disabled={!game || loading || Boolean(answer)}
                  onClick={() => void submitAnswer("higher")}
                  className="min-h-14 bg-[var(--partner-primary)] text-base text-black hover:brightness-105"
                >
                  <ArrowUp className="mr-2 size-5" />
                  Higher
                </Button>
                <Button
                  type="button"
                  disabled={!game || loading || Boolean(answer)}
                  onClick={() => void submitAnswer("lower")}
                  className="min-h-14 bg-[var(--partner-secondary)] text-base text-white hover:brightness-105"
                >
                  <ArrowDown className="mr-2 size-5" />
                  Lower
                </Button>
              </div>
            ) : null}

            {answer && !answer.completed ? (
              <Button
                type="button"
                disabled={loading}
                onClick={continueRound}
                className="min-h-14 bg-white text-black hover:bg-white/90"
              >
                Next item
              </Button>
            ) : null}

            {answer?.completed ? (
              <div className="grid gap-3 rounded-[var(--partner-radius,12px)] border border-white/12 bg-black/20 p-4 sm:grid-cols-[1fr_auto]">
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-white/75">
                    Display name
                  </span>
                  <input
                    value={nickname}
                    onChange={(event) => setNickname(event.target.value)}
                    maxLength={32}
                    className="min-h-12 rounded-md border border-white/12 bg-white/10 px-3 text-white placeholder:text-white/35"
                    placeholder="Player"
                  />
                </label>
                <Button
                  type="button"
                  disabled={loading}
                  onClick={() => void submitScore()}
                  className="self-end bg-[var(--partner-primary)] text-black"
                >
                  <Send className="mr-2 size-4" />
                  Submit score
                </Button>
              </div>
            ) : null}
          </div>

          <LeaderboardPanel rows={leaderboard} />
        </section>

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4 text-xs text-white/45">
          <span>
            Not affiliated with or endorsed by Valve or Steam. Prices are
            approximate and may be delayed.
          </span>
          {partner.ctaUrl && partner.ctaLabel && isHttpUrl(partner.ctaUrl) ? (
            <a
              href={partner.ctaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-white/70 underline-offset-4 hover:underline"
            >
              {partner.ctaLabel}
            </a>
          ) : null}
        </footer>
      </div>
    </main>
  );
}
