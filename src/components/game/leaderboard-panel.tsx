import type { LeaderboardRow } from "@/components/game/types";

export function LeaderboardPanel({ rows }: { rows: LeaderboardRow[] }) {
  return (
    <aside className="rounded-[var(--partner-radius,12px)] border border-white/12 bg-black/18 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-black uppercase tracking-[0.12em] text-white/70">
          Leaderboard
        </h2>
        <span className="text-xs text-white/45">Top 50</span>
      </div>
      <ol className="space-y-2">
        {rows.length === 0 ? (
          <li className="rounded-md border border-dashed border-white/15 p-3 text-sm text-white/55">
            No scores yet.
          </li>
        ) : (
          rows.slice(0, 10).map((row, index) => (
            <li
              key={`${row.nickname}-${row.createdAt}-${index}`}
              className="grid grid-cols-[2rem_1fr_auto] items-center gap-3 rounded-md bg-white/[0.055] px-3 py-2"
            >
              <span className="text-sm font-black text-white/45">{index + 1}</span>
              <span className="truncate text-sm font-semibold text-white/85">
                {row.nickname}
              </span>
              <span className="text-sm font-black text-white">
                {row.score}
              </span>
            </li>
          ))
        )}
      </ol>
    </aside>
  );
}
