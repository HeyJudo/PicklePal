import { getPlayers } from "./actions";
import { PlayerCard } from "./PlayerCard";

interface PlayersPageProps {
  readonly params: Promise<{ slug: string }>;
}

export default async function PlayersPage({ params }: PlayersPageProps) {
  const { slug } = await params;
  const { players, error } = await getPlayers(slug);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-text-primary">Players</h1>
        <p className="text-text-secondary mt-1">
          Your crew roster — {players.length} player{players.length !== 1 ? "s" : ""}.
        </p>
      </header>

      {error ? (
        <div className="rounded-xl border border-hype-red/20 bg-hype-red/5 p-6 text-center">
          <p className="text-hype-red text-sm font-medium">{error}</p>
        </div>
      ) : players.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface-muted p-8 text-center">
          <p className="text-text-muted text-sm">
            No players yet. Add players to get started.
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {players.map((player) => (
            <PlayerCard key={player.id} player={player} groupSlug={slug} />
          ))}
        </div>
      )}
    </div>
  );
}
