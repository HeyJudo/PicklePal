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
  readonly track_scorers: boolean;
  readonly started_at: string;
}

interface StartSessionInput {
  readonly groupSlug: string;
  readonly title?: string;
  readonly matchType?: MatchType;
  readonly targetScore?: number;
  readonly winBy?: number;
  readonly trackScorers?: boolean;
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
    .select("id, title, status, default_match_type, target_score, win_by, track_scorers, started_at")
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
      track_scorers: input.trackScorers ?? false,
      started_at: new Date().toISOString(),
    })
    .select("id, title, status, default_match_type, target_score, win_by, track_scorers, started_at")
    .single();

  if (sessionError || !session) {
    return { success: false, error: sessionError?.message ?? "Failed to create session" };
  }

  // Create session_players records for all present players
  const sessionPlayerRows = input.presentPlayerIds.map((playerId) => ({
    session_id: session.id,
    player_id: playerId,
    status: "active",
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: spError } = await (supabase as any)
    .from("session_players")
    .insert(sessionPlayerRows);

  if (spError) {
    // Non-fatal: session was created, log but don't fail
    console.error("Failed to create session_players:", spError);
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
    .select("id, display_name, color, avatar_url, is_active")
    .eq("group_id", group.id)
    .eq("is_active", true)
    .order("display_name");

  return players ?? [];
}

// ─── Save Completed Match ────────────────────────────────────────────────────

interface SaveMatchInput {
  readonly sessionId: string;
  readonly matchType: MatchType;
  readonly teamAPlayerIds: readonly string[];
  readonly teamBPlayerIds: readonly string[];
  readonly teamAScore: number;
  readonly teamBScore: number;
  readonly winningTeam: string;
  readonly losingTeam: string;
  readonly startingServerPlayerId: string;
  readonly targetScore: number;
  readonly winBy: number;
  readonly rallyEvents: readonly RallyEventInput[];
}

interface RallyEventInput {
  readonly sequenceNumber: number;
  readonly rallyWinnerTeam: string;
  readonly resultingTeamAScore: number;
  readonly resultingTeamBScore: number;
  readonly serverPlayerId: string;
  readonly serverNumber: number | null;
  readonly sideOutOccurred: boolean;
}

export async function saveCompletedMatch(
  input: SaveMatchInput,
): Promise<ActionResult<{ matchId: string }>> {
  const supabase = createServerClient();

  // Create match record
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: match, error: matchError } = await (supabase as any)
    .from("matches")
    .insert({
      session_id: input.sessionId,
      match_type: input.matchType,
      status: "completed",
      team_a_player_ids: input.teamAPlayerIds,
      team_b_player_ids: input.teamBPlayerIds,
      team_a_score: input.teamAScore,
      team_b_score: input.teamBScore,
      winning_team: input.winningTeam,
      losing_team: input.losingTeam,
      starting_server_player_id: input.startingServerPlayerId,
      target_score: input.targetScore,
      win_by: input.winBy,
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (matchError || !match) {
    return {
      success: false,
      error: matchError?.message ?? "Failed to save match",
    };
  }

  // Save rally events
  if (input.rallyEvents.length > 0) {
    const rallyRows = input.rallyEvents.map((event) => ({
      match_id: match.id,
      sequence_number: event.sequenceNumber,
      rally_winner_team: event.rallyWinnerTeam,
      resulting_team_a_score: event.resultingTeamAScore,
      resulting_team_b_score: event.resultingTeamBScore,
      server_player_id: event.serverPlayerId,
      server_number: event.serverNumber,
      side_out_occurred: event.sideOutOccurred,
    }));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: rallyError } = await (supabase as any)
      .from("rally_events")
      .insert(rallyRows);

    if (rallyError) {
      // Match saved but rally events failed — log but don't fail
      console.error("Failed to save rally events:", rallyError);
    }
  }

  return { success: true, data: { matchId: match.id } };
}

// ─── Get Session Recap Data ──────────────────────────────────────────────────

import type { Match, Player, Session } from "@/lib/supabase";
import { computeSessionSummary, computeSessionAwards } from "@/lib/stats";
import type { SessionAwards } from "@/lib/stats";

export interface RecapResult {
  readonly success: boolean;
  readonly data?: {
    readonly gamesPlayed: number;
    readonly playerCount: number;
    readonly durationMinutes: number | null;
    readonly awards: SessionAwards;
    readonly playerNames: Record<string, string>;
  };
  readonly error?: string;
}

export async function getSessionRecap(sessionId: string): Promise<RecapResult> {
  const supabase = createServerClient();

  // Fetch session
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: session, error: sessionError } = await (supabase as any)
    .from("sessions")
    .select("*")
    .eq("id", sessionId)
    .single();

  if (sessionError || !session) {
    return { success: false, error: "Session not found" };
  }

  // Fetch matches
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: matches } = await (supabase as any)
    .from("matches")
    .select("*")
    .eq("session_id", sessionId)
    .eq("status", "completed");

  const allMatches: Match[] = matches ?? [];

  // Fetch players
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: players } = await (supabase as any)
    .from("players")
    .select("*")
    .eq("group_id", (session as Session).group_id);

  const allPlayers: Player[] = players ?? [];
  const playerNames: Record<string, string> = {};
  for (const p of allPlayers) {
    playerNames[p.id] = p.display_name;
  }

  // Compute summary and awards
  const summary = computeSessionSummary(session as Session, allMatches);
  const awards = computeSessionAwards(allPlayers, allMatches);

  return {
    success: true,
    data: {
      gamesPlayed: summary.gamesPlayed,
      playerCount: summary.playerCount,
      durationMinutes: summary.durationMinutes,
      awards,
      playerNames,
    },
  };
}

// ─── Get Session Completed Matches ───────────────────────────────────────────

export interface SessionMatchData {
  readonly id: string;
  readonly match_type: string;
  readonly team_a_player_ids: string[];
  readonly team_b_player_ids: string[];
  readonly team_a_score: number;
  readonly team_b_score: number;
  readonly winning_team: string | null;
  readonly completed_at: string | null;
  readonly source: string;
}

export async function getSessionMatches(
  sessionId: string,
): Promise<ActionResult<SessionMatchData[]>> {
  const supabase = createServerClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("matches")
    .select("id, match_type, team_a_player_ids, team_b_player_ids, team_a_score, team_b_score, winning_team, completed_at, source")
    .eq("session_id", sessionId)
    .eq("status", "completed")
    .order("completed_at", { ascending: false });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data: data ?? [] };
}
