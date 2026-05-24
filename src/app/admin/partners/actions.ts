"use server";

import { revalidatePath } from "next/cache";
import { createPartner, updatePartner } from "@/lib/partners";

function textValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function nullableTextValue(formData: FormData, key: string) {
  const value = textValue(formData, key);
  return value.length > 0 ? value : null;
}

function domainsValue(formData: FormData) {
  return textValue(formData, "allowedDomains")
    .split(",")
    .map((domain) => domain.trim())
    .filter(Boolean);
}

function partnerPayload(formData: FormData) {
  const enabledValues = formData.getAll("enabled");
  const enabled = enabledValues.at(-1) === "true";

  return {
    name: textValue(formData, "name"),
    slug: textValue(formData, "slug"),
    logoUrl: nullableTextValue(formData, "logoUrl"),
    primaryColor: textValue(formData, "primaryColor"),
    secondaryColor: textValue(formData, "secondaryColor"),
    backgroundColor: textValue(formData, "backgroundColor"),
    textColor: textValue(formData, "textColor"),
    borderRadius: textValue(formData, "borderRadius"),
    ctaLabel: nullableTextValue(formData, "ctaLabel"),
    ctaUrl: nullableTextValue(formData, "ctaUrl"),
    allowedDomains: domainsValue(formData),
    enabled
  };
}

export async function createPartnerAction(formData: FormData) {
  await createPartner(partnerPayload(formData));
  revalidatePath("/admin/partners");
}

export async function updatePartnerAction(formData: FormData) {
  const id = textValue(formData, "id");
  await updatePartner(id, partnerPayload(formData));
  revalidatePath("/admin/partners");
}
