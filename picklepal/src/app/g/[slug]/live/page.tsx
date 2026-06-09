import { getActiveSession, getGroupPlayers, getSessionMatches } from "./actions";
import { getSessionPlayers } from "./session-player-actions";
import { getActiveMatch } from "./active-match-actions";
import { getLeaderboard } from "../board/actions";
import { getGroupSettings } from "../settings/settings-actions";
import { getViewerAccess } from "@/lib/auth";
import { LivePageClient } from "./LivePageClient";

interface LivePageProps {
  readonly params: Promise<{ slug: string }>;
}

export default async function LivePage({ params }: LivePageProps) {
  const { slug } = await params;

  const [sessionResult, players, leaderboardResult, groupSettingsResult, viewerAccess] = await Promise.all([
    getActiveSession(slug),
    getGroupPlayers(slug),
    getLeaderboard(slug),
    getGroupSettings(slug),
    getViewerAccess(slug),
  ]);

  const activeSession = sessionResult.success ? sessionResult.data ?? null : null;
  const groupSettings = groupSettingsResult.data?.settings ?? null;
  const clerkUserId = viewerAccess.clerkUserId;
  const isAdmin = viewerAccess.isAdmin;

  // Fetch session players and matches if there's an active session
  let sessionPlayers: { playerId: string; status: "active" | "benched" | "removed" }[] = [];
  let sessionMatches: Awaited<ReturnType<typeof getSessionMatches>>["data"] = [];
  let activeMatchData: {
    id: string;
    matchType: string;
    teamAPlayerIds: string[];
    teamBPlayerIds: string[];
    scorerClerkUserId: string | null;
    scorerHeartbeatAt: string | null;
    currentSnapshot: import("@/lib/supabase").MatchSnapshot | null;
    startingServerPlayerId: string | null;
    targetScore: number;
    winBy: number;
  } | null = null;

  if (activeSession) {
    const [spResult, matchesResult, activeMatchResult] = await Promise.all([
      getSessionPlayers(activeSession.id),
      getSessionMatches(activeSession.id),
      getActiveMatch(activeSession.id),
    ]);

    if (spResult.success && spResult.data) {
      sessionPlayers = spResult.data.map((sp) => ({
        playerId: sp.player_id,
        status: sp.status,
      }));
    }

    // Fallback: if no session_players records exist (legacy sessions),
    // treat all group players as active
    if (sessionPlayers.length === 0) {
      sessionPlayers = players.map((p: { id: string }) => ({
        playerId: p.id,
        status: "active" as const,
      }));
    }

    if (matchesResult.success && matchesResult.data) {
      sessionMatches = matchesResult.data;
    }

    if (activeMatchResult.success && activeMatchResult.data) {
      const am = activeMatchResult.data;
      activeMatchData = {
        id: am.id,
        matchType: am.match_type,
        teamAPlayerIds: am.team_a_player_ids,
        teamBPlayerIds: am.team_b_player_ids,
        scorerClerkUserId: am.scorer_clerk_user_id,
        scorerHeartbeatAt: am.scorer_heartbeat_at,
        currentSnapshot: am.current_snapshot,
        startingServerPlayerId: am.starting_server_player_id,
        targetScore: am.target_score,
        winBy: am.win_by,
      };
    }
  }

  return (
    <LivePageClient
      groupSlug={slug}
      initialSession={activeSession}
      players={players}
      initialSessionPlayers={sessionPlayers}
      initialSessionMatches={sessionMatches ?? []}
      leaderboardEntries={leaderboardResult.entries}
      groupSettings={groupSettings}
      clerkUserId={clerkUserId}
      isAdmin={isAdmin}
      initialActiveMatch={activeMatchData}
    />
  );
}
