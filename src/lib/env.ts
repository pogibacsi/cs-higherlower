import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    ADMIN_PASSWORD: z.string().min(1).optional(),
    PRICE_SYNC_BATCH_SIZE: z.coerce.number().int().positive().default(10),
    PRICE_SYNC_DELAY_MS: z.coerce.number().int().nonnegative().default(1200),
    PRICE_SYNC_CRON_SECRET: z.string().min(1).optional(),
    DEFAULT_TIMEZONE: z.string().default("Europe/Brussels")
  },
  client: {
    NEXT_PUBLIC_APP_URL: z.string().url().optional()
  },
  runtimeEnv: {
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
    PRICE_SYNC_BATCH_SIZE: process.env.PRICE_SYNC_BATCH_SIZE,
    PRICE_SYNC_DELAY_MS: process.env.PRICE_SYNC_DELAY_MS,
    PRICE_SYNC_CRON_SECRET: process.env.PRICE_SYNC_CRON_SECRET,
    DEFAULT_TIMEZONE: process.env.DEFAULT_TIMEZONE,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL
  }
});
