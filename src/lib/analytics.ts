import { analyticsEvents, type EventType, type GameMode } from "@/db/schema";
import { getDb } from "@/lib/db";

export async function recordAnalyticsEvent(input: {
  eventType: EventType;
  partnerId?: string | null;
  mode?: GameMode | null;
}) {
  await getDb().insert(analyticsEvents).values({
    eventType: input.eventType,
    partnerId: input.partnerId ?? null,
    mode: input.mode ?? null
  });
}
