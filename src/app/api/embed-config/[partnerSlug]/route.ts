import { NextResponse, type NextRequest } from "next/server";
import { getEnabledPartner } from "@/lib/partners";
import { getRequestHostSource, isAllowedEmbedDomain } from "@/lib/security";
import { partnerSlugSchema } from "@/lib/validation";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ partnerSlug: string }> }
) {
  const parsed = partnerSlugSchema.safeParse((await params).partnerSlug);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid partner slug." }, { status: 400 });
  }

  const partner = await getEnabledPartner(parsed.data);
  if (!partner) {
    return NextResponse.json({ error: "Partner not found." }, { status: 404 });
  }

  const host = getRequestHostSource(request);
  if (!isAllowedEmbedDomain(host, partner.allowedDomains)) {
    return NextResponse.json({ error: "Embed domain not allowed." }, { status: 403 });
  }

  return NextResponse.json({
    id: partner.id,
    name: partner.name,
    slug: partner.slug,
    logoUrl: partner.logoUrl,
    primaryColor: partner.primaryColor,
    secondaryColor: partner.secondaryColor,
    backgroundColor: partner.backgroundColor,
    textColor: partner.textColor,
    borderRadius: partner.borderRadius,
    ctaLabel: partner.ctaLabel,
    ctaUrl: partner.ctaUrl
  });
}
