"use server";

import { createServerClient } from "@/lib/supabase";
import type { MatchType } from "@/lib/supabase";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ActionResult<T = void> {
  readonly success: boolean;
  readonly data?: T;
  readonly error?: string;
}

interface SessionData {
  readonly id: string;
  readonly title: string | null;
  readonly status: string;
  readonly default_match_type: string;
  readonly target_score: number;
  readonly win_by: number;
  readonly started_at: string;
}

interface StartSessionInput {
  readonly groupSlug: string;
  readonly title?: string;
  readonly matchType?: MatchType;
  readonly targetScore?: number;
  readonly winBy?: number;
  readonly presentPlayerIds: readonly string[];
}

// ─── Get Active Session ──────────────────────────────────────────────────────

export async function getActiveSession(
  groupSlug: string,
): Promise<ActionResult<SessionData | null>> {
  const supabase = createServerClient();

  // Get group ID from slug
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: group, error: groupError } = await (supabase as any)
    .from("groups")
    .select("id")
    .eq("slug", groupSlug)
    .single();

  if (groupError || !group) {
    return { success: false, error: "Group not found" };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: session, error: sessionError } = await (supabase as any)
    .from("sessions")
    .select("id, title, status, default_match_type, target_score, win_by, started_at")
    .eq("group_id", group.id)
    .eq("status", "active")
    .maybeSingle();

  if (sessionError) {
    return { success: false, error: sessionError.message };
  }

  return { success: true, data: session };
}

// ─── Start Session ───────────────────────────────────────────────────────────

export async function startSession(
  input: StartSessionInput,
): Promise<ActionResult<SessionData>> {
  const supabase = createServerClient();

  // Get group ID
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: group, error: groupError } = await (supabase as any)
    .from("groups")
    .select("id")
    .eq("slug", input.groupSlug)
    .single();

  if (groupError || !group) {
    return { success: false, error: "Group not found" };
  }

  // Enforce: only one active session per group
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await (supabase as any)
    .from("sessions")
    .select("id")
    .eq("group_id", group.id)
    .eq("status", "active")
    .maybeSingle();

  if (existing) {
    return { success: false, error: "A session is already active for this group" };
  }

  // Validate minimum players
  if (input.presentPlayerIds.length < 2) {
    return { success: false, error: "At least 2 players are required" };
  }

  const matchType = input.matchType ?? "doubles";
  if (matchType === "doubles" && input.presentPlayerIds.length < 4) {
    return { success: false, error: "At least 4 players are required for doubles" };
  }

  // Create session
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: session, error: sessionError } = await (supabase as any)
    .from("sessions")
    .insert({
      group_id: group.id,
      title: input.title || null,
      status: "active",
      default_match_type: matchType,
      target_score: input.targetScore ?? 11,
      win_by: input.winBy ?? 2,
      started_at: new Date().toISOString(),
    })
    .select("id, title, status, default_match_type, target_score, win_by, started_at")
    .single();

  if (sessionError || !session) {
    return { success: false, error: sessionError?.message ?? "Failed to create session" };
  }

  return { success: true, data: session };
}

// ─── End Session ─────────────────────────────────────────────────────────────

export async function endSession(
  sessionId: string,
): Promise<ActionResult> {
  const supabase = createServerClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("sessions")
    .update({
      status: "completed",
      ended_at: new Date().toISOString(),
    })
    .eq("id", sessionId)
    .eq("status", "active");

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

// ─── Get Group Players ───────────────────────────────────────────────────────

export async function getGroupPlayers(groupSlug: string) {
  const supabase = createServerClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: group } = await (supabase as any)
    .from("groups")
    .select("id")
    .eq("slug", groupSlug)
    .single();

  if (!group) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: players } = await (supabase as any)
    .from("players")
    .select("id, display_name, color, is_active")
    .eq("group_id", group.id)
    .eq("is_active", true)
    .order("display_name");

  return players ?? [];
}
