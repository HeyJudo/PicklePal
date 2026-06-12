"server only";

import { createServerClient } from "@/lib/supabase";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase";
import { playedDateToTimestamp } from "@/lib/matches/validation";

// ─── Types ────────────────────────────────────────────────────────────────────

type Supabase = SupabaseClient<Database>;

interface BucketResult {
  readonly sessionId: string;
}

interface BucketError {
  readonly error: string;
}

// ─── findOrCreateManualBucket ─────────────────────────────────────────────────

/**
 * Find or create a manual-bucket session for a given group + played date.
 * Uses the 23505 unique-violation re-select pattern for race safety.
 * Bucket sessions are created with status='completed', started_at=ended_at=noon-UTC.
 */
export async function findOrCreateManualBucket(
  supabase: Supabase,
  groupId: string,
  playedDate: string, // YYYY-MM-DD
): Promise<BucketResult | BucketError> {
  // 1. Try to find an existing bucket
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await (supabase as any)
    .from("sessions")
    .select("id")
    .eq("group_id", groupId)
    .eq("source", "manual_bucket")
    .eq("bucket_date", playedDate)
    .maybeSingle();

  if (existing) {
    return { sessionId: existing.id };
  }

  // 2. Attempt to insert a new bucket
  const noonUtc = playedDateToTimestamp(playedDate);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: created, error: insertError } = await (supabase as any)
    .from("sessions")
    .insert({
      group_id: groupId,
      title: null,
      status: "completed",
      source: "manual_bucket",
      bucket_date: playedDate,
      default_match_type: "doubles",
      target_score: 11,
      win_by: 2,
      track_scorers: false,
      started_at: noonUtc,
      ended_at: noonUtc,
    })
    .select("id")
    .single();

  if (!insertError && created) {
    return { sessionId: created.id };
  }

  // 3. On unique-violation (23505), re-select
  if (insertError?.code === "23505") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: retry } = await (supabase as any)
      .from("sessions")
      .select("id")
      .eq("group_id", groupId)
      .eq("source", "manual_bucket")
      .eq("bucket_date", playedDate)
      .maybeSingle();

    if (retry) {
      return { sessionId: retry.id };
    }
  }

  return { error: insertError?.message ?? "Failed to find or create bucket session" };
}

export function createManualBucketClient() {
  return createServerClient();
}
