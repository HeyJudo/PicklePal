"use server";

import { unstable_cache } from "next/cache";
import { createServerClient } from "@/lib/supabase";
import type { Match, Session, Player } from "@/lib/supabase";
import { traceServerOperation } from "@/lib/performance/server";
import { cacheTag } from "@/lib/cache";
import { HISTORY_PAGE_SIZE } from "./constants";
import {
  historyCursorFilter,
  nextHistoryCursor,
  parseHistoryCursor,
  type HistoryCursor,
} from "./pagination";

export type MatchSummary = Pick<
  Match,
  | "id"
  | "session_id"
  | "status"
  | "source"
  | "match_type"
  | "team_a_player_ids"
  | "team_b_player_ids"
  | "team_a_score"
  | "team_b_score"
  | "winning_team"
  | "losing_team"
  | "target_score"
  | "win_by"
  | "started_at"
  | "completed_at"
  | "played_at"
  | "duration_seconds"
  | "created_at"
>;

export type PlayerInfoMap = Readonly<
  Record<string, { name: string; color: string | null; avatarUrl: string | null }>
>;

export interface SessionGroup {
  readonly session: Session;
  readonly matches: readonly MatchSummary[];
}

interface HistoryResult {
  readonly sessionGroups: readonly SessionGroup[];
  readonly players: readonly Player[];
  readonly playerInfo: PlayerInfoMap;
  readonly hasMore: boolean;
  readonly nextCursor: HistoryCursor | null;
  readonly error?: string;
}

export interface SessionOption {
  readonly id: string;
  readonly title: string | null;
  readonly started_at: string;
}

/**
 * Fetch match history for a group, grouped by session (newest first).
 * When includeCancelled is true (admin mode), returns cancelled matches too.
 * Includes player name lookup for display.
 *
 * Pagination: pass `offset` to skip the first N sessions. Returns `hasMore`
 * indicating whether additional sessions exist beyond this page.
 *
 * The first page (offset=0) is cached per group slug and invalidated on any
 * match write. Paginated pages (offset>0) are not cached.
 */
export async function getMatchHistory(
  groupSlug: string,
  options: { includeCancelled?: boolean; cursor?: HistoryCursor | null } = {},
): Promise<HistoryResult> {
  // Only cache the first page — subsequent pages are user-triggered
  if (!options.cursor) {
    return unstable_cache(
      () =>
        traceServerOperation(
          {
            name: "history.cache-miss",
            op: "cache.get",
            attributes: {
              route: "history",
              "cache.domain": "history",
              "cache.hit": false,
            },
          },
          () => _getMatchHistory(groupSlug, options),
        ),
      ["history", groupSlug, String(options.includeCancelled ?? false)],
      {
        tags: [`group-${groupSlug}`, cacheTag("history", groupSlug)],
        revalidate: 30,
      },
    )();
  }
  return _getMatchHistory(groupSlug, options);
}

async function _getMatchHistory(
  groupSlug: string,
  options: { includeCancelled?: boolean; cursor?: HistoryCursor | null } = {},
): Promise<HistoryResult> {
  const supabase = createServerClient();
  // Supabase's generated query types exceed TypeScript's instantiation depth
  // for these projected joins; keep the escape hatch at this single boundary.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const cursor = options.cursor ? parseHistoryCursor(options.cursor) : null;

  if (options.cursor && !cursor) {
    return emptyHistoryResult("Invalid history cursor");
  }

  // Get group ID from slug
  const { data: group, error: groupError } = await traceServerOperation(
    {
      name: "history.group",
      op: "db.query",
      attributes: { route: "history", stage: "group", "db.table": "groups" },
    },
    async () =>
      db.from("groups").select("id").eq("slug", groupSlug).single(),
  );

  if (groupError || !group) {
    return emptyHistoryResult("Group not found");
  }

  // Fetch one extra session beyond the page size to detect if more exist.
  // Players are fetched in parallel with sessions — both depend only on group.id.
  let sessionsQuery = db
    .from("sessions")
    .select(
      "id, group_id, title, status, default_match_type, target_score, win_by, track_scorers, started_at, ended_at, bucket_date, source",
    )
    .eq("group_id", group.id)
    .order("started_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(HISTORY_PAGE_SIZE + 1);

  if (cursor) {
    sessionsQuery = sessionsQuery.or(historyCursorFilter(cursor));
  }

  const [{ data: sessions, error: sessionsError }, { data: players }] = await Promise.all(
    [
      traceServerOperation(
        {
          name: "history.sessions",
          op: "db.query",
          attributes: { route: "history", stage: "sessions", "db.table": "sessions" },
        },
        async () => sessionsQuery,
      ),
      traceServerOperation(
        {
          name: "history.players",
          op: "db.query",
          attributes: { route: "history", stage: "players", "db.table": "players" },
        },
        async () =>
          db
            .from("players")
            .select("id, display_name, color, avatar_url, is_active")
            .eq("group_id", group.id)
            .order("display_name", { ascending: true }),
      ),
    ],
  );

  if (sessionsError || !sessions || sessions.length === 0) {
    return emptyHistoryResult();
  }

  // If we got PAGE_SIZE+1 results there are more pages; only display PAGE_SIZE
  const hasMore = sessions.length > HISTORY_PAGE_SIZE;
  const pageSessions = hasMore ? sessions.slice(0, HISTORY_PAGE_SIZE) : sessions;

  // Fetch matches for these sessions (depends on session IDs resolved above)
  const sessionIds = pageSessions.map((s: Session) => s.id);

  const statusFilter = options.includeCancelled
    ? ["completed", "cancelled"]
    : ["completed"];

  const { data: matches, error: matchesError } = await traceServerOperation(
    {
      name: "history.matches",
      op: "db.query",
      attributes: { route: "history", stage: "matches", "db.table": "matches" },
    },
    async () =>
      db
        .from("matches")
        .select(
          "id, session_id, status, source, match_type, team_a_player_ids, team_b_player_ids, team_a_score, team_b_score, winning_team, losing_team, target_score, win_by, started_at, completed_at, played_at, duration_seconds, created_at",
        )
        .in("session_id", sessionIds)
        .in("status", statusFilter)
        .order("played_at", { ascending: false }),
  );

  if (matchesError) {
    return emptyHistoryResult("Failed to load matches");
  }

  const playerInfoMap: Record<string, PlayerInfoMap[string]> = {};
  if (players) {
    for (const p of players as Player[]) {
      playerInfoMap[p.id] = {
        name: p.display_name,
        color: p.color,
        avatarUrl: p.avatar_url,
      };
    }
  }

  const activePlayers = ((players ?? []) as Player[]).filter((p) => p.is_active);

  // Group matches by session
  const matchesBySession = new Map<string, MatchSummary[]>();
  for (const match of (matches ?? []) as MatchSummary[]) {
    const sessionMatches = matchesBySession.get(match.session_id) ?? [];
    matchesBySession.set(match.session_id, [...sessionMatches, match]);
  }

  // Build session groups (only include sessions that have visible matches)
  const sessionGroups: SessionGroup[] = [];
  for (const session of pageSessions as Session[]) {
    const sessionMatches = matchesBySession.get(session.id);
    if (sessionMatches && sessionMatches.length > 0) {
      sessionGroups.push({ session, matches: sessionMatches });
    }
  }

  return {
    sessionGroups,
    players: activePlayers,
    playerInfo: playerInfoMap,
    hasMore,
    nextCursor: hasMore ? nextHistoryCursor(pageSessions) : null,
  };
}

/**
 * Load more session groups starting at the given offset.
 * Used by the client-side "Load more" button in MatchHistory.
 * Returns only the new groups (to be appended to existing state).
 */
export async function loadMoreHistory(
  groupSlug: string,
  options: { includeCancelled?: boolean; cursor: HistoryCursor },
): Promise<{
  sessionGroups: readonly SessionGroup[];
  playerInfo: PlayerInfoMap;
  hasMore: boolean;
  nextCursor: HistoryCursor | null;
  error?: string;
}> {
  const result = await getMatchHistory(groupSlug, options);
  return {
    sessionGroups: result.sessionGroups,
    playerInfo: result.playerInfo,
    hasMore: result.hasMore,
    nextCursor: result.nextCursor,
    error: result.error,
  };
}

function emptyHistoryResult(error?: string): HistoryResult {
  return {
    sessionGroups: [],
    players: [],
    playerInfo: {},
    hasMore: false,
    nextCursor: null,
    error,
  };
}

/**
 * Fetch recent live sessions for the session picker in PastMatchForm.
 * Returns up to 15 sessions with source='live', newest first.
 */
export async function getRecentSessionOptions(
  groupSlug: string,
): Promise<readonly SessionOption[]> {
  const supabase = createServerClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: group } = await (supabase as any)
    .from("groups")
    .select("id")
    .eq("slug", groupSlug)
    .single();

  if (!group) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: sessions } = await (supabase as any)
    .from("sessions")
    .select("id, title, started_at")
    .eq("group_id", group.id)
    .eq("source", "live")
    .eq("status", "completed")
    .order("started_at", { ascending: false })
    .limit(15);

  return (sessions ?? []) as SessionOption[];
}
