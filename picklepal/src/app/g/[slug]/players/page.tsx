import { getPlayers } from "./actions";
import { PlayerCard } from "./PlayerCard";
import { AddPlayerForm } from "./AddPlayerForm";

interface PlayersPageProps {
  readonly params: Promise<{ slug: string }>;
}

export default async function PlayersPage({ params }: PlayersPageProps) {
  const { slug } = await params;
  const { players, error } = await getPlayers(slug);

  const activePlayers = players.filter((p) => p.is_active !== false);

  return (
    <div className="space-y-6">
      {/* Branded header */}
      <header className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-court-green to-court-green-dark px-5 py-5 sm:px-6">
        {/* People watermark */}
        <div className="absolute -right-4 -top-4 opacity-10 pointer-events-none" aria-hidden="true">
          <svg className="w-36 h-36 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
          </svg>
        </div>

        <div className="relative flex items-end justify-between gap-4">
          <div>
            <p className="text-white/55 text-[11px] font-label font-semibold uppercase tracking-widest mb-1">
              Crew Roster
            </p>
            <h1 className="font-display text-3xl text-white leading-tight">Players</h1>
            <p className="text-white/65 text-sm mt-1">
              {activePlayers.length} active player{activePlayers.length !== 1 ? "s" : ""}
            </p>
          </div>
          <AddPlayerForm groupSlug={slug} />
        </div>
      </header>

      {error ? (
        <div className="rounded-xl border border-hype-red/20 bg-hype-red/5 p-6 text-center">
          <p className="text-hype-red text-sm font-medium">{error}</p>
        </div>
      ) : players.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface-muted p-10 text-center space-y-3">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-court-green/10 mb-1">
            <svg className="w-6 h-6 text-court-green" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
          </div>
          <p className="text-text-primary font-semibold">No players yet</p>
          <p className="text-text-muted text-sm">Add your crew to start tracking games and rankings.</p>
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
