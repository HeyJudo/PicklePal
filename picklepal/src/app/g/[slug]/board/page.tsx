import { getLeaderboard } from "./actions";
import { LeaderboardTable } from "./LeaderboardTable";

interface BoardPageProps {
  readonly params: Promise<{ slug: string }>;
}

export default async function BoardPage({ params }: BoardPageProps) {
  const { slug } = await params;
  const { entries, error } = await getLeaderboard(slug);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-text-primary">Leaderboard</h1>
        <p className="text-text-secondary mt-1">
          Rankings based on all completed matches.
        </p>
      </header>

      {error ? (
        <div className="rounded-xl border border-hype-red/20 bg-hype-red/5 p-6 text-center">
          <p className="text-hype-red text-sm font-medium">{error}</p>
        </div>
      ) : (
        <LeaderboardTable entries={entries} />
      )}
    </div>
  );
}
