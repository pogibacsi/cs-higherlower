import { listLeaderboard } from "@/lib/leaderboard";

export const dynamic = "force-dynamic";

function todayBrussels() {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: "Europe/Brussels",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(new Date());
  return `${parts.find((p) => p.type === "year")?.value}-${parts.find((p) => p.type === "month")?.value}-${parts.find((p) => p.type === "day")?.value}`;
}

export default async function AdminLeaderboardsPage() {
  const today = todayBrussels();
  const [daily, classic] = await Promise.all([
    listLeaderboard({ mode: "daily", date: today, scope: "global" }),
    listLeaderboard({ mode: "classic", scope: "global" })
  ]);

  return (
    <section className="grid gap-6 lg:grid-cols-2">
      {[
        ["Daily", daily],
        ["Classic", classic]
      ].map(([title, rows]) => (
        <div key={title as string} className="rounded-lg border border-border bg-card">
          <div className="border-b border-border p-4">
            <h2 className="text-xl font-black">{title as string}</h2>
          </div>
          <table className="w-full border-collapse text-sm">
            <thead className="bg-muted text-left">
              <tr>
                <th className="p-3">Name</th>
                <th className="p-3">Score</th>
                <th className="p-3">Rounds</th>
                <th className="p-3">Time</th>
              </tr>
            </thead>
            <tbody>
              {(rows as Awaited<ReturnType<typeof listLeaderboard>>).map((row) => (
                <tr
                  key={`${row.nickname}-${row.createdAt.toISOString()}`}
                  className="border-t border-border"
                >
                  <td className="p-3 font-semibold">{row.nickname}</td>
                  <td className="p-3">{row.score}</td>
                  <td className="p-3">{row.roundsPlayed}</td>
                  <td className="p-3">{row.createdAt.toISOString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </section>
  );
}
