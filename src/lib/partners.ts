import { eq } from "drizzle-orm";
import { partners } from "@/db/schema";
import { getDb } from "@/lib/db";
import { partnerInputSchema } from "@/lib/validation";

export type PartnerTheme = {
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
  allowedDomains: string[];
  enabled: boolean;
};

export async function getPartnerBySlug(slug: string) {
  const db = getDb();
  const [partner] = await db
    .select()
    .from(partners)
    .where(eq(partners.slug, slug))
    .limit(1);

  return partner ?? null;
}

export async function getEnabledPartner(slug: string) {
  const partner = await getPartnerBySlug(slug);
  if (!partner?.enabled) return null;
  return partner;
}

export async function listPartners() {
  return getDb().select().from(partners).orderBy(partners.createdAt);
}

export async function createPartner(input: unknown) {
  const parsed = partnerInputSchema.parse(input);
  const [partner] = await getDb().insert(partners).values(parsed).returning();
  return partner;
}

export async function updatePartner(id: string, input: unknown) {
  const parsed = partnerInputSchema.partial().parse(input);
  const [partner] = await getDb()
    .update(partners)
    .set({ ...parsed, updatedAt: new Date() })
    .where(eq(partners.id, id))
    .returning();
  return partner ?? null;
}

export function iframeSnippet(appUrl: string, partnerSlug: string) {
  return `<iframe
  src="${appUrl.replace(/\/$/, "")}/embed/${partnerSlug}"
  width="100%"
  height="650"
  style="border:0; border-radius:12px; overflow:hidden;"
  loading="lazy"
></iframe>`;
}
