import { getLeaderboard } from "./actions";
import { LeaderboardTable } from "./LeaderboardTable";

interface BoardPageProps {
  readonly params: Promise<{ slug: string }>;
}

export default async function BoardPage({ params }: BoardPageProps) {
  const { slug } = await params;
  const { entries, error } = await getLeaderboard(slug);

  const qualified = entries.filter((e) => e.isQualified);

  return (
    <div className="space-y-6">
      {/* Branded header */}
      <header className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-court-green-dark to-court-green px-5 py-5 sm:px-6">
        {/* Trophy watermark */}
        <div className="absolute -right-4 -top-4 opacity-10 pointer-events-none" aria-hidden="true">
          <svg className="w-36 h-36 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z" />
          </svg>
        </div>

        <div className="relative flex items-end justify-between gap-4">
          <div>
            <p className="text-white/55 text-[11px] font-label font-semibold uppercase tracking-widest mb-1">
              Rankings
            </p>
            <h1 className="font-display text-3xl text-white leading-tight">Leaderboard</h1>
            <p className="text-white/65 text-sm mt-1">
              {qualified.length} qualified player{qualified.length !== 1 ? "s" : ""}
            </p>
          </div>
          {qualified.length > 0 && (
            <div className="text-right shrink-0">
              <p className="font-display text-4xl text-ball-yellow leading-none">
                {(qualified[0]?.winRate ? qualified[0].winRate * 100 : 0).toFixed(0)}%
              </p>
              <p className="text-white/55 text-[10px] mt-1 font-label font-semibold uppercase tracking-widest">
                Top win rate
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
        <LeaderboardTable entries={entries} />
      )}
    </div>
  );
}
