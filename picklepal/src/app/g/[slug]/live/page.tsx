import { getActiveSession, getGroupPlayers } from "./actions";
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

  return (
    <LivePageClient
      groupSlug={slug}
      initialSession={activeSession}
      players={players}
    />
  );
}
