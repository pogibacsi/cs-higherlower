import { z } from "zod";

export const partnerSlugSchema = z
  .string()
  .trim()
  .min(2)
  .max(60)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

export const gameModeSchema = z.enum(["daily", "classic"]);

const httpUrlSchema = z
  .string()
  .url()
  .refine((value) => {
    try {
      const url = new URL(value);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch {
      return false;
    }
  }, "Only http and https URLs are allowed.");

export const answerSchema = z.object({
  sessionId: z.string().uuid(),
  answer: z.enum(["higher", "lower"])
});

export const startGameSchema = z.object({
  mode: gameModeSchema.default("daily"),
  partnerSlug: partnerSlugSchema.optional(),
  anonymousUserId: z.string().trim().min(12).max(120)
});

export const submitScoreSchema = z.object({
  sessionId: z.string().uuid(),
  nickname: z.string().trim().min(1).max(32)
});

export const leaderboardQuerySchema = z.object({
  mode: gameModeSchema.default("daily"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  partnerSlug: partnerSlugSchema.optional(),
  scope: z.enum(["global", "partner"]).default("partner")
});

export const partnerInputSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: partnerSlugSchema,
  logoUrl: httpUrlSchema.nullable().optional(),
  primaryColor: z.string().trim().min(3).max(64),
  secondaryColor: z.string().trim().min(3).max(64),
  backgroundColor: z.string().trim().min(3).max(64),
  textColor: z.string().trim().min(3).max(64),
  borderRadius: z.string().trim().min(1).max(32),
  ctaLabel: z.string().trim().max(60).nullable().optional(),
  ctaUrl: httpUrlSchema.nullable().optional(),
  allowedDomains: z.array(z.string().trim().min(1).max(253)).max(30).default([]),
  enabled: z.boolean().default(true)
});
