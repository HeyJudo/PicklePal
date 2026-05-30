"use server";

import { createServerClient } from "@/lib/supabase";
import type { Match, Player, Session } from "@/lib/supabase";
import { computeLeaderboard } from "@/lib/stats";
import { computeDuoStats } from "@/lib/stats";
import { computeSessionAwards } from "@/lib/stats";
import type { LeaderboardEntry, DuoStats } from "@/lib/stats";
import type { MvpAward } from "@/lib/stats";
import { verifyPin } from "@/lib/utils/pin";

// ─── Host PIN Verification ──────────────────────────────────────────────────

interface VerifyPinResult {
  readonly success: boolean;
  readonly error?: string;
}

async function getGroupPinHash(
  slug: string,
): Promise<{ host_pin_hash: string | null } | null> {
  const supabase = createServerClient();
  const { data } = await supabase
    .from("groups")
    .select("host_pin_hash")
    .eq("slug", slug)
    .single();

  return data;
}

/**
 * Server action to verify a host PIN against the stored hash for a group.
 * Returns success: true if the PIN is correct.
 */
export async function verifyHostPin(
  groupSlug: string,
  pin: string,
): Promise<VerifyPinResult> {
  if (!pin || pin.trim().length === 0) {
    return { success: false, error: "PIN is required" };
  }

  const group = await getGroupPinHash(groupSlug);

  if (!group) {
    return { success: false, error: "Group not found" };
  }

  if (!group.host_pin_hash) {
    // No PIN set — allow access (group hasn't configured a PIN yet)
    return { success: true };
  }

  const isValid = await verifyPin(pin.trim(), group.host_pin_hash);

  if (!isValid) {
    return { success: false, error: "Incorrect PIN" };
  }

  return { success: true };
}

// ─── Dashboard Types ─────────────────────────────────────────────────────────

export interface ActiveSessionInfo {
  readonly sessionId: string;
  readonly title: string | null;
  readonly matchesPlayed: number;
  readonly activeMatch: {
    readonly teamAScore: number;
    readonly teamBScore: number;
    readonly teamAPlayerIds: readonly string[];
    readonly teamBPlayerIds: readonly string[];
  } | null;
}

export interface DashboardData {
  readonly groupName: string;
  readonly activeSession: ActiveSessionInfo | null;
  readonly topPlayer: LeaderboardEntry | null;
  readonly hottestDuo: DuoStats | null;
  readonly latestMvp: (MvpAward & { readonly sessionTitle: string | null }) | null;
  readonly leaderboardPreview: readonly LeaderboardEntry[];
  readonly recentMatches: readonly RecentMatch[];
  readonly totalGamesPlayed: number;
  readonly totalSessions: number;
}

export interface RecentMatch {
  readonly matchId: string;
  readonly matchType: string;
  readonly teamAPlayerNames: readonly string[];
  readonly teamBPlayerNames: readonly string[];
  readonly teamAScore: number;
  readonly teamBScore: number;
  readonly winningTeam: string | null;
  readonly completedAt: string | null;
}

interface DashboardResult {
  readonly data: DashboardData | null;
  readonly error?: string;
}

// ─── Server Action ───────────────────────────────────────────────────────────

/**
 * Fetch all dashboard data for a group in a single server action.
 * Returns leaderboard preview, active session, highlights, and recent matches.
 */
export async function getDashboardData(groupSlug: string): Promise<DashboardResult> {
  const supabase = createServerClient();

  // 1. Get group
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: group, error: groupError } = await (supabase as any)
    .from("groups")
    .select("*")
    .eq("slug", groupSlug)
    .single();

  if (groupError || !group) {
    return { data: null, error: "Group not found" };
  }

  // 2. Get all active players
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: players } = await (supabase as any)
    .from("players")
    .select("*")
    .eq("group_id", group.id)
    .eq("is_active", true)
    .order("display_name");

  const allPlayers: Player[] = players ?? [];

  // 3. Get all sessions
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: sessions } = await (supabase as any)
    .from("sessions")
    .select("*")
    .eq("group_id", group.id)
    .order("started_at", { ascending: false });

  const allSessions: Session[] = sessions ?? [];

  // 4. Get all matches across sessions
  const sessionIds = allSessions.map((s) => s.id);
  let allMatches: Match[] = [];

  if (sessionIds.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: matches } = await (supabase as any)
      .from("matches")
      .select("*")
      .in("session_id", sessionIds)
      .order("completed_at", { ascending: false });

    allMatches = matches ?? [];
  }

  const completedMatches = allMatches.filter((m) => m.status === "completed");

  // 5. Compute active session info
  const activeSession = buildActiveSessionInfo(allSessions, allMatches);

  // 6. Compute leaderboard (top 5 preview)
  const fullLeaderboard = computeLeaderboard(allPlayers, completedMatches);
  const leaderboardPreview = fullLeaderboard.slice(0, 5);
  const topPlayer = fullLeaderboard.find((e) => e.rank === 1) ?? null;

  // 7. Compute hottest duo (all-time)
  const allDuos = computeDuoStats(allPlayers, completedMatches);
  const hottestDuo = allDuos.length > 0 ? allDuos[0] : null;

  // 8. Compute latest MVP (from most recent completed session)
  const latestMvp = buildLatestMvp(allSessions, allMatches, allPlayers);

  // 9. Build recent matches (last 5 completed)
  const recentMatches = buildRecentMatches(completedMatches.slice(0, 5), allPlayers);

  // 10. Summary stats
  const totalGamesPlayed = completedMatches.length;
  const totalSessions = allSessions.filter((s) => s.status === "completed").length;

  return {
    data: {
      groupName: group.name,
      activeSession,
      topPlayer,
      hottestDuo,
      latestMvp,
      leaderboardPreview,
      recentMatches,
      totalGamesPlayed,
      totalSessions,
    },
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildActiveSessionInfo(
  sessions: readonly Session[],
  matches: readonly Match[],
): ActiveSessionInfo | null {
  const active = sessions.find((s) => s.status === "active");
  if (!active) return null;

  const sessionMatches = matches.filter((m) => m.session_id === active.id);
  const completedInSession = sessionMatches.filter((m) => m.status === "completed");
  const activeMatch = sessionMatches.find((m) => m.status === "active");

  return {
    sessionId: active.id,
    title: active.title,
    matchesPlayed: completedInSession.length,
    activeMatch: activeMatch
      ? {
          teamAScore: activeMatch.team_a_score,
          teamBScore: activeMatch.team_b_score,
          teamAPlayerIds: activeMatch.team_a_player_ids,
          teamBPlayerIds: activeMatch.team_b_player_ids,
        }
      : null,
  };
}

function buildLatestMvp(
  sessions: readonly Session[],
  matches: readonly Match[],
  players: readonly Player[],
): (MvpAward & { readonly sessionTitle: string | null }) | null {
  // Find most recent completed session
  const completedSessions = sessions
    .filter((s) => s.status === "completed")
    .sort((a, b) => {
      const aTime = a.ended_at ?? a.started_at;
      const bTime = b.ended_at ?? b.started_at;
      return bTime.localeCompare(aTime);
    });

  if (completedSessions.length === 0) return null;

  const latestSession = completedSessions[0];
  const sessionMatches = matches.filter(
    (m) => m.session_id === latestSession.id && m.status === "completed",
  );

  const awards = computeSessionAwards(players, sessionMatches);

  if (!awards.mvp) return null;

  return {
    ...awards.mvp,
    sessionTitle: latestSession.title,
  };
}

function buildRecentMatches(
  matches: readonly Match[],
  players: readonly Player[],
): readonly RecentMatch[] {
  const nameMap = new Map<string, string>();
  for (const p of players) {
    nameMap.set(p.id, p.display_name);
  }

  return matches.map((m) => ({
    matchId: m.id,
    matchType: m.match_type,
    teamAPlayerNames: m.team_a_player_ids.map((id) => nameMap.get(id) ?? "Unknown"),
    teamBPlayerNames: m.team_b_player_ids.map((id) => nameMap.get(id) ?? "Unknown"),
    teamAScore: m.team_a_score,
    teamBScore: m.team_b_score,
    winningTeam: m.winning_team,
    completedAt: m.completed_at,
  }));
}
