import { listItemsWithPrices } from "@/lib/items";

export const dynamic = "force-dynamic";

export default async function AdminItemsPage() {
  const items = await listItemsWithPrices(500);

  return (
    <section className="grid gap-4">
      <div>
        <h2 className="text-xl font-black">Items and Prices</h2>
        <p className="text-sm text-muted-foreground">
          Active CS2 cases, knives, gloves, and covert skins used by gameplay.
        </p>
      </div>
      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full min-w-[760px] border-collapse text-sm">
          <thead className="bg-muted text-left">
            <tr>
              <th className="p-3">Item</th>
              <th className="p-3">Category</th>
              <th className="p-3">Price EUR</th>
              <th className="p-3">Status</th>
              <th className="p-3">Last successful fetch</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-t border-border">
                <td className="p-3 font-semibold">{item.displayName}</td>
                <td className="p-3">{item.category}</td>
                <td className="p-3">{item.priceEur ?? "None"}</td>
                <td className="p-3">{item.status ?? "missing"}</td>
                <td className="p-3">
                  {item.lastSuccessfulFetchAt
                    ? item.lastSuccessfulFetchAt.toISOString()
                    : "Never"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
