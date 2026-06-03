"use server";

import { createServerClient } from "@/lib/supabase";

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

  return { success: true };
}
