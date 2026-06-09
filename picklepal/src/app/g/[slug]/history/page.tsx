import { getMatchHistory } from "./actions";
import { MatchHistory } from "./MatchHistory";

interface HistoryPageProps {
  readonly params: Promise<{ slug: string }>;
}

export default async function HistoryPage({ params }: HistoryPageProps) {
  const { slug } = await params;
  const { sessionGroups, error } = await getMatchHistory(slug);

  const totalMatches = sessionGroups.reduce((sum, g) => sum + g.matches.length, 0);

  return (
    <div className="space-y-6">
      {/* Branded header */}
      <header className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-sky-blue-dark to-sky-blue px-5 py-5 sm:px-6">
        {/* Clock watermark */}
        <div className="absolute -right-4 -top-4 opacity-10 pointer-events-none" aria-hidden="true">
          <svg className="w-36 h-36 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z" />
          </svg>
        </div>

        <div className="relative flex items-end justify-between gap-4">
          <div>
            <p className="text-white/55 text-[11px] font-label font-semibold uppercase tracking-widest mb-1">
              Match Record
            </p>
            <h1 className="font-display text-3xl text-white leading-tight">History</h1>
            <p className="text-white/65 text-sm mt-1">
              {sessionGroups.length} session{sessionGroups.length !== 1 ? "s" : ""}
            </p>
          </div>
          {totalMatches > 0 && (
            <div className="text-right shrink-0">
              <p className="font-display text-4xl text-ball-yellow leading-none tabular-nums">
                {totalMatches}
              </p>
              <p className="text-white/55 text-[10px] mt-1 font-label font-semibold uppercase tracking-widest">
                Total matches
              </p>
            </div>
          )}
        </div>
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
