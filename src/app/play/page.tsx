import { EmbedGame } from "@/components/game/embed-game";
import { getEnabledPartner } from "@/lib/partners";

export const dynamic = "force-dynamic";

export default async function PlayPage() {
  const partner = await getEnabledPartner("demo");

  if (!partner) {
    return (
      <main className="grid min-h-screen place-items-center p-6 text-center">
        <div className="max-w-lg rounded-lg border border-border bg-card p-6">
          <h1 className="text-2xl font-black">Seed data required</h1>
          <p className="mt-2 text-muted-foreground">
            Run the database migration and seed script to create the demo partner.
          </p>
        </div>
      </main>
    );
  }

  return <EmbedGame partner={partner} framed={false} />;
}
