import { desc } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import { priceFetchRuns } from "@/db/schema";
import { getDb } from "@/lib/db";
import { runMockPriceSyncAction } from "@/app/admin/price-sync/actions";
import { listRecentFailedPriceFetches } from "@/lib/items";

export const dynamic = "force-dynamic";

export default async function AdminPriceSyncPage() {
  const [runs, failedFetches] = await Promise.all([
    getDb()
      .select()
      .from(priceFetchRuns)
      .orderBy(desc(priceFetchRuns.startedAt))
      .limit(50),
    listRecentFailedPriceFetches(50)
  ]);

  return (
    <section className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
        <div>
          <h2 className="text-xl font-black">Price Sync</h2>
          <p className="text-sm text-muted-foreground">
            Manual mock sync is available for MVP testing. The Steam provider is
            implemented behind the same service abstraction for scheduled use.
          </p>
        </div>
        <form action={runMockPriceSyncAction}>
          <Button type="submit">Run mock sync</Button>
        </form>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full min-w-[760px] border-collapse text-sm">
          <thead className="bg-muted text-left">
            <tr>
              <th className="p-3">Started</th>
              <th className="p-3">Finished</th>
              <th className="p-3">Status</th>
              <th className="p-3">Total</th>
              <th className="p-3">Success</th>
              <th className="p-3">Failed</th>
            </tr>
          </thead>
          <tbody>
            {runs.map((run) => (
              <tr key={run.id} className="border-t border-border">
                <td className="p-3">{run.startedAt.toISOString()}</td>
                <td className="p-3">
                  {run.finishedAt ? run.finishedAt.toISOString() : "Running"}
                </td>
                <td className="p-3">{run.status}</td>
                <td className="p-3">{run.totalItems}</td>
                <td className="p-3">{run.successCount}</td>
                <td className="p-3">{run.failCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <div className="border-b border-border p-4">
          <h3 className="text-lg font-black">Recent stale or failed fetches</h3>
          <p className="text-sm text-muted-foreground">
            Gameplay keeps using the last successful current price when a fetch
            fails.
          </p>
        </div>
        <table className="w-full min-w-[760px] border-collapse text-sm">
          <thead className="bg-muted text-left">
            <tr>
              <th className="p-3">Item</th>
              <th className="p-3">Status</th>
              <th className="p-3">Source</th>
              <th className="p-3">Fetched</th>
            </tr>
          </thead>
          <tbody>
            {failedFetches.length === 0 ? (
              <tr className="border-t border-border">
                <td className="p-3 text-muted-foreground" colSpan={4}>
                  No stale or failed fetches recorded.
                </td>
              </tr>
            ) : (
              failedFetches.map((fetch) => (
                <tr key={fetch.id} className="border-t border-border">
                  <td className="p-3 font-semibold">{fetch.displayName}</td>
                  <td className="p-3">{fetch.status}</td>
                  <td className="p-3">{fetch.source}</td>
                  <td className="p-3">{fetch.fetchedAt.toISOString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
