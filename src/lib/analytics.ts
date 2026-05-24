import { analyticsEvents, type gameModeEnum } from "@/db/schema";
import { getDb } from "@/lib/db";

type EventType =
  | "game_started"
  | "answer_submitted"
  | "game_over"
  | "score_submitted"
  | "partner_embed_loaded";

type Mode = (typeof gameModeEnum.enumValues)[number];

export async function recordAnalyticsEvent(input: {
  eventType: EventType;
  partnerId?: string | null;
  mode?: Mode | null;
}) {
  await getDb().insert(analyticsEvents).values({
    eventType: input.eventType,
    partnerId: input.partnerId ?? null,
    mode: input.mode ?? null
  });
}
