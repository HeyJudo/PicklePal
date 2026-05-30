import { getMatchHistory } from "./actions";
import { MatchHistory } from "./MatchHistory";

interface HistoryPageProps {
  readonly params: Promise<{ slug: string }>;
}

export default async function HistoryPage({ params }: HistoryPageProps) {
  const { slug } = await params;
  const { sessionGroups, error } = await getMatchHistory(slug);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-text-primary">History</h1>
        <p className="text-text-secondary mt-1">
          All past matches grouped by session.
        </p>
      </header>

      {error ? (
        <div className="rounded-xl border border-hype-red/20 bg-hype-red/5 p-6 text-center">
          <p className="text-hype-red text-sm font-medium">{error}</p>
        </div>
      ) : (
        <MatchHistory sessionGroups={sessionGroups} groupSlug={slug} />
      )}
    </div>
  );
}
