"use server";

import { createServerClient } from "@/lib/supabase";
import { authorizeGroupWrite } from "@/lib/auth";
import { invalidateGroupMutation, revalidateGroupCache } from "@/lib/cache";

interface ActionResult {
  readonly success: boolean;
  readonly error?: string;
}

/**
 * Hard-delete a session and all its matches (cascade).
 * Rally events are also deleted via ON DELETE CASCADE.
 */
export async function deleteSession(sessionId: string): Promise<ActionResult> {
  const supabase = createServerClient();

  // Look up the group for this session to perform authorization
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: sessionData, error: lookupError } = await (supabase as any)
    .from("sessions")
    .select("group_id")
    .eq("id", sessionId)
    .maybeSingle();

  if (lookupError || !sessionData) {
    return { success: false, error: "Session not found" };
  }

  const groupId = sessionData.group_id;
  const auth = await authorizeGroupWrite(groupId);
  if (!auth.authorized) {
    return { success: false, error: auth.error ?? "Unauthorized" };
  }

  // Delete matches first (rally_events cascade from matches)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: matchesError } = await (supabase as any)
    .from("matches")
    .delete()
    .eq("session_id", sessionId);

  if (matchesError) {
    return { success: false, error: "Failed to delete matches: " + matchesError.message };
  }

  // Delete session_players
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: spError } = await (supabase as any)
    .from("session_players")
    .delete()
    .eq("session_id", sessionId);

  if (spError) {
    // Non-fatal — continue
    console.error("Failed to delete session_players:", spError);
  }

  // Delete the session
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: sessionError } = await (supabase as any)
    .from("sessions")
    .delete()
    .eq("id", sessionId);

  if (sessionError) {
    return { success: false, error: "Failed to delete session: " + sessionError.message };
  }

  await invalidateGroupMutation(groupId, "match-result", sessionId);
  await revalidateGroupCache(groupId);
  return { success: true };
}
