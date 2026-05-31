import { getActiveSession, getGroupPlayers } from "./actions";
import { getSessionPlayers } from "./session-player-actions";
import { LivePageClient } from "./LivePageClient";

interface LivePageProps {
  readonly params: Promise<{ slug: string }>;
}

export default async function LivePage({ params }: LivePageProps) {
  const { slug } = await params;

  const [sessionResult, players] = await Promise.all([
    getActiveSession(slug),
    getGroupPlayers(slug),
  ]);

  const activeSession = sessionResult.success ? sessionResult.data ?? null : null;

  // Fetch session players if there's an active session
  let sessionPlayers: { playerId: string; status: "active" | "benched" | "removed" }[] = [];
  if (activeSession) {
    const spResult = await getSessionPlayers(activeSession.id);
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
  }

  return (
    <LivePageClient
      groupSlug={slug}
      initialSession={activeSession}
      players={players}
      initialSessionPlayers={sessionPlayers}
    />
  );
}
