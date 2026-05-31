"use server";

import { createServerClient } from "@/lib/supabase";
import type { SessionPlayerStatus } from "@/lib/supabase";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ActionResult<T = void> {
  readonly success: boolean;
  readonly data?: T;
  readonly error?: string;
}

export interface SessionPlayerData {
  readonly id: string;
  readonly player_id: string;
  readonly status: SessionPlayerStatus;
  readonly joined_at: string;
}

// ─── Get Session Players ─────────────────────────────────────────────────────

export async function getSessionPlayers(
  sessionId: string,
): Promise<ActionResult<SessionPlayerData[]>> {
  const supabase = createServerClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("session_players")
    .select("id, player_id, status, joined_at")
    .eq("session_id", sessionId)
    .neq("status", "removed")
    .order("joined_at");

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data: data ?? [] };
}

// ─── Create Session Players (on session start) ──────────────────────────────

export async function createSessionPlayers(
  sessionId: string,
  playerIds: readonly string[],
): Promise<ActionResult> {
  if (playerIds.length === 0) {
    return { success: false, error: "No players provided" };
  }

  const supabase = createServerClient();

  const rows = playerIds.map((playerId) => ({
    session_id: sessionId,
    player_id: playerId,
    status: "active" as const,
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("session_players")
    .insert(rows);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

// ─── Bench a Player ──────────────────────────────────────────────────────────

export async function benchPlayer(
  sessionId: string,
  playerId: string,
): Promise<ActionResult> {
  const supabase = createServerClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("session_players")
    .update({
      status: "benched",
      updated_at: new Date().toISOString(),
    })
    .eq("session_id", sessionId)
    .eq("player_id", playerId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

// ─── Activate a Player (un-bench or late arrival) ────────────────────────────

export async function activatePlayer(
  sessionId: string,
  playerId: string,
): Promise<ActionResult> {
  const supabase = createServerClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await (supabase as any)
    .from("session_players")
    .select("id")
    .eq("session_id", sessionId)
    .eq("player_id", playerId)
    .maybeSingle();

  if (existing) {
    // Player already in session — update status
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from("session_players")
      .update({
        status: "active",
        updated_at: new Date().toISOString(),
      })
      .eq("session_id", sessionId)
      .eq("player_id", playerId);

    if (error) {
      return { success: false, error: error.message };
    }
  } else {
    // Late arrival — insert new record
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from("session_players")
      .insert({
        session_id: sessionId,
        player_id: playerId,
        status: "active",
      });

    if (error) {
      return { success: false, error: error.message };
    }
  }

  return { success: true };
}

// ─── Remove a Player from Session ────────────────────────────────────────────

export async function removePlayerFromSession(
  sessionId: string,
  playerId: string,
): Promise<ActionResult> {
  const supabase = createServerClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("session_players")
    .update({
      status: "removed",
      updated_at: new Date().toISOString(),
    })
    .eq("session_id", sessionId)
    .eq("player_id", playerId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}
