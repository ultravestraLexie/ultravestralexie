import type { SupabaseClient } from "@supabase/supabase-js";

/** North Star event instrumentation (Phase 1 Build 4).
 *
 * API routes call this AFTER a meaningful business action has
 * succeeded, to append one row to public.creator_events. The North
 * Star — Weekly Active Creators Completing Meaningful Business
 * Actions — is computed from these rows (lib/metrics/north-star.ts).
 *
 * Rules:
 * - Append-only and additive: events exist only from the day this
 *   instrumentation shipped. Nothing historical is ever backfilled,
 *   and reports must say so.
 * - NEVER throws and never fails the request: a lost event is a
 *   measurement gap, a broken proposal save is a product failure.
 *   Failures are logged server-side, mirroring the pay-first attach
 *   doctrine.
 * - Written with the caller's session client, so RLS (own-rows
 *   insert) applies exactly as it does to the action itself. */

export const CREATOR_EVENT_TYPES = [
  "proposal_created",
  "proposal_status_changed",
  "deal_created",
  "deal_stage_changed",
  "revenue_recorded",
  "brief_generated",
  "post_logged",
  "goal_created",
] as const;

export type CreatorEventType = (typeof CREATOR_EVENT_TYPES)[number];

export async function logCreatorEvent(
  supabase: SupabaseClient,
  userId: string,
  eventType: CreatorEventType,
  entityType: string,
  entityId: string | null,
  metadata: Record<string, unknown> = {}
): Promise<void> {
  try {
    const { error } = await supabase.from("creator_events").insert({
      user_id: userId,
      event_type: eventType,
      entity_type: entityType,
      entity_id: entityId,
      metadata,
    });
    if (error) {
      console.error(
        `[creator-events] insert failed (${eventType} for ${userId}): ${error.message}`
      );
    }
  } catch (err) {
    console.error(
      `[creator-events] insert threw (${eventType} for ${userId}): ${
        err instanceof Error ? err.message : String(err)
      }`
    );
  }
}

/** Append one row to public.deal_stage_history (Build 4). Same
 *  never-throws doctrine as logCreatorEvent. fromStage is null for
 *  the creation row. */
export async function logDealStageChange(
  supabase: SupabaseClient,
  userId: string,
  dealId: string,
  fromStage: string | null,
  toStage: string
): Promise<void> {
  try {
    const { error } = await supabase.from("deal_stage_history").insert({
      deal_id: dealId,
      user_id: userId,
      from_stage: fromStage,
      to_stage: toStage,
    });
    if (error) {
      console.error(
        `[deal-stage-history] insert failed (deal ${dealId}): ${error.message}`
      );
    }
  } catch (err) {
    console.error(
      `[deal-stage-history] insert threw (deal ${dealId}): ${
        err instanceof Error ? err.message : String(err)
      }`
    );
  }
}
