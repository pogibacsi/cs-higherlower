import { headers } from "next/headers";
import { env } from "@/lib/env";
import { iframeSnippet, listPartners } from "@/lib/partners";
import {
  createPartnerAction,
  updatePartnerAction
} from "@/app/admin/partners/actions";

export const dynamic = "force-dynamic";

async function appOrigin() {
  if (env.NEXT_PUBLIC_APP_URL) return env.NEXT_PUBLIC_APP_URL;

  const headerBag = await headers();
  const host = headerBag.get("x-forwarded-host") ?? headerBag.get("host");
  if (!host) return "http://localhost:3000";

  const proto = headerBag.get("x-forwarded-proto") ?? "https";
  return `${proto}://${host}`;
}

export default async function AdminPartnersPage() {
  const partners = await listPartners();
  const appUrl = await appOrigin();

  return (
    <section className="grid gap-6">
      <div>
        <h2 className="text-xl font-black">Partners</h2>
        <p className="text-sm text-muted-foreground">
          Manage partner themes, allowed domains, and generated iframe snippets.
        </p>
      </div>

      <form
        action={createPartnerAction}
        className="grid gap-4 rounded-lg border border-border bg-card p-4"
      >
        <h3 className="text-lg font-black">Create partner</h3>
        <PartnerFields
          partner={{
            name: "",
            slug: "",
            logoUrl: "",
            primaryColor: "#d9a441",
            secondaryColor: "#6f9f87",
            backgroundColor: "#10140f",
            textColor: "#f8efe2",
            borderRadius: "12px",
            ctaLabel: "",
            ctaUrl: "",
            allowedDomains: [],
            enabled: true
          }}
        />
        <button className="min-h-11 rounded-md bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">
          Create partner
        </button>
      </form>

      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full min-w-[900px] border-collapse text-sm">
          <thead className="bg-muted text-left">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Slug</th>
              <th className="p-3">Status</th>
              <th className="p-3">Allowed domains</th>
              <th className="p-3">Iframe</th>
            </tr>
          </thead>
          <tbody>
            {partners.map((partner) => (
              <tr key={partner.id} className="border-t border-border align-top">
                <td className="p-3 font-semibold">{partner.name}</td>
                <td className="p-3">{partner.slug}</td>
                <td className="p-3">{partner.enabled ? "Enabled" : "Disabled"}</td>
                <td className="p-3">
                  {partner.allowedDomains.length
                    ? partner.allowedDomains.join(", ")
                    : "Any"}
                </td>
                <td className="p-3">
                  <code className="block max-w-xl whitespace-pre-wrap rounded-md bg-muted p-3 text-xs">
                    {iframeSnippet(appUrl, partner.slug)}
                  </code>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-4">
        <h3 className="text-lg font-black">Edit partners</h3>
        {partners.map((partner) => (
          <form
            key={partner.id}
            action={updatePartnerAction}
            className="grid gap-4 rounded-lg border border-border bg-card p-4"
          >
            <input type="hidden" name="id" value={partner.id} />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h4 className="font-black">{partner.name}</h4>
                <p className="text-sm text-muted-foreground">/{partner.slug}</p>
              </div>
              <button className="min-h-11 rounded-md bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">
                Save changes
              </button>
            </div>
            <PartnerFields partner={partner} />
          </form>
        ))}
      </div>
    </section>
  );
}

type PartnerFieldsValue = {
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

function PartnerFields({ partner }: { partner: PartnerFieldsValue }) {
  const inputClass =
    "min-h-11 rounded-md border border-border bg-background px-3 py-2 text-sm";
  const labelClass = "grid gap-1 text-sm font-semibold";

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      <label className={labelClass}>
        Name
        <input className={inputClass} name="name" defaultValue={partner.name} />
      </label>
      <label className={labelClass}>
        Slug
        <input className={inputClass} name="slug" defaultValue={partner.slug} />
      </label>
      <label className={labelClass}>
        Logo URL
        <input
          className={inputClass}
          name="logoUrl"
          defaultValue={partner.logoUrl ?? ""}
        />
      </label>
      <label className={labelClass}>
        Border radius
        <input
          className={inputClass}
          name="borderRadius"
          defaultValue={partner.borderRadius}
        />
      </label>
      <label className={labelClass}>
        Primary color
        <input
          className={inputClass}
          name="primaryColor"
          defaultValue={partner.primaryColor}
        />
      </label>
      <label className={labelClass}>
        Secondary color
        <input
          className={inputClass}
          name="secondaryColor"
          defaultValue={partner.secondaryColor}
        />
      </label>
      <label className={labelClass}>
        Background color
        <input
          className={inputClass}
          name="backgroundColor"
          defaultValue={partner.backgroundColor}
        />
      </label>
      <label className={labelClass}>
        Text color
        <input
          className={inputClass}
          name="textColor"
          defaultValue={partner.textColor}
        />
      </label>
      <label className={labelClass}>
        CTA label
        <input
          className={inputClass}
          name="ctaLabel"
          defaultValue={partner.ctaLabel ?? ""}
        />
      </label>
      <label className={labelClass}>
        CTA URL
        <input
          className={inputClass}
          name="ctaUrl"
          defaultValue={partner.ctaUrl ?? ""}
        />
      </label>
      <label className={`${labelClass} xl:col-span-2`}>
        Allowed domains
        <input
          className={inputClass}
          name="allowedDomains"
          defaultValue={partner.allowedDomains.join(", ")}
          placeholder="example.com, *.example.org"
        />
      </label>
      <label className="flex min-h-11 items-center gap-2 text-sm font-semibold">
        <input type="hidden" name="enabled" value="false" />
        <input
          type="checkbox"
          name="enabled"
          value="true"
          defaultChecked={partner.enabled}
          className="size-4"
        />
        Enabled
      </label>
    </div>
  );
}
