import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { EmbedGame } from "@/components/game/embed-game";
import { recordAnalyticsEvent } from "@/lib/analytics";
import { getEnabledPartner } from "@/lib/partners";
import {
  getHostFromOriginOrReferer,
  isAllowedEmbedDomain
} from "@/lib/security";

export const dynamic = "force-dynamic";

export default async function EmbedPage({
  params
}: {
  params: Promise<{ partnerSlug: string }>;
}) {
  const { partnerSlug } = await params;
  const partner = await getEnabledPartner(partnerSlug);
  if (!partner) notFound();

  const headerBag = await headers();
  const host = getHostFromOriginOrReferer(
    headerBag.get("origin"),
    headerBag.get("referer")
  );

  if (!isAllowedEmbedDomain(host, partner.allowedDomains)) {
    return (
      <main className="grid min-h-screen place-items-center bg-background p-6 text-center text-foreground">
        <p>This embed is not enabled for this domain.</p>
      </main>
    );
  }

  await recordAnalyticsEvent({
    eventType: "partner_embed_loaded",
    partnerId: partner.id
  });

  return <EmbedGame partner={partner} />;
}
