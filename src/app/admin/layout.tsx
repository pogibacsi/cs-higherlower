import Link from "next/link";

const nav = [
  ["Partners", "/admin/partners"],
  ["Items", "/admin/items"],
  ["Leaderboards", "/admin/leaderboards"],
  ["Price Sync", "/admin/price-sync"]
] as const;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto grid w-full max-w-7xl gap-6 p-4 sm:p-8">
        <header className="grid gap-4 border-b border-border pb-5 sm:grid-cols-[1fr_auto] sm:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
              Admin
            </p>
            <h1 className="text-3xl font-black">CS2 Higher / Lower</h1>
          </div>
          <nav className="flex flex-wrap gap-2">
            {nav.map(([label, href]) => (
              <Link
                key={href}
                href={href}
                className="rounded-md border border-border bg-card px-3 py-2 text-sm font-semibold hover:bg-muted"
              >
                {label}
              </Link>
            ))}
          </nav>
        </header>
        {children}
      </div>
    </main>
  );
}
