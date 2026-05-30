import Link from "next/link";
import type { LeaderboardEntry } from "@/lib/stats";

interface LeaderboardPreviewProps {
  readonly entries: readonly LeaderboardEntry[];
  readonly groupSlug: string;
}

export function LeaderboardPreview({
  entries,
  groupSlug,
}: LeaderboardPreviewProps) {
  if (entries.length === 0) {
    return (
      <section aria-label="Leaderboard preview">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">
            Leaderboard
          </h2>
        </div>
        <div className="rounded-xl border border-border-muted bg-surface-muted p-6 text-center">
          <p className="text-sm text-text-muted">
            No rankings yet. Play some games to see the leaderboard.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section aria-label="Leaderboard preview">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">
          Leaderboard
        </h2>
        <Link
          href={`/g/${groupSlug}/board`}
          className="text-xs font-medium text-court-green hover:text-court-green-dark transition-colors cursor-pointer"
        >
          View Full Board →
        </Link>
      </div>

      <div className="rounded-xl border border-border bg-surface overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-muted bg-surface-muted">
              <th className="text-left py-2.5 px-3 text-xs font-medium text-text-muted uppercase tracking-wide w-10">
                #
              </th>
              <th className="text-left py-2.5 px-3 text-xs font-medium text-text-muted uppercase tracking-wide">
                Player
              </th>
              <th className="text-right py-2.5 px-3 text-xs font-medium text-text-muted uppercase tracking-wide">
                Win%
              </th>
              <th className="text-right py-2.5 px-3 text-xs font-medium text-text-muted uppercase tracking-wide hidden sm:table-cell">
                W-L
              </th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, index) => (
              <tr
                key={entry.playerId}
                className={`border-b border-border-muted last:border-b-0 transition-colors hover:bg-surface-muted ${
                  index === 0 ? "bg-ball-yellow/5" : ""
                }`}
              >
                <td className="py-2.5 px-3">
                  <RankBadge rank={entry.rank} index={index} />
                </td>
                <td className="py-2.5 px-3">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: entry.color ?? "#94A3B8" }}
                    />
                    <span className="font-medium text-text-primary truncate">
                      {entry.displayName}
                    </span>
                    {!entry.isQualified && (
                      <span className="text-[10px] text-text-muted bg-surface-muted px-1.5 py-0.5 rounded">
                        &lt;3 GP
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-2.5 px-3 text-right">
                  <span
                    className={`font-semibold tabular-nums ${
                      entry.isQualified
                        ? "text-text-primary"
                        : "text-text-muted"
                    }`}
                  >
                    {(entry.winRate * 100).toFixed(0)}%
                  </span>
                </td>
                <td className="py-2.5 px-3 text-right hidden sm:table-cell">
                  <span className="text-text-secondary tabular-nums">
                    {entry.wins}-{entry.losses}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function RankBadge({
  rank,
  index,
}: {
  readonly rank: number | null;
  readonly index: number;
}) {
  if (rank === 1) {
    return (
      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-ball-yellow/20 text-ball-yellow font-bold text-xs">
        1
      </span>
    );
  }
  if (rank === 2) {
    return (
      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-200 text-text-secondary font-bold text-xs">
        2
      </span>
    );
  }
  if (rank === 3) {
    return (
      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-hype-orange/15 text-hype-orange font-bold text-xs">
        3
      </span>
    );
  }
  return (
    <span className="inline-flex items-center justify-center w-6 h-6 text-text-muted text-xs font-medium">
      {rank ?? index + 1}
    </span>
  );
}
