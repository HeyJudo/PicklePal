import Link from "next/link";
import type { RecentMatch } from "../actions";

interface RecentMatchesProps {
  readonly matches: readonly RecentMatch[];
  readonly groupSlug: string;
}

export function RecentMatches({ matches, groupSlug }: RecentMatchesProps) {
  if (matches.length === 0) {
    return (
      <section aria-label="Recent matches">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">
            Recent Matches
          </h2>
        </div>
        <div className="rounded-xl border border-border-muted bg-surface-muted p-6 text-center">
          <p className="text-sm text-text-muted">
            No matches played yet. Start a Game Day to see results here.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section aria-label="Recent matches">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">
          Recent Matches
        </h2>
        <Link
          href={`/g/${groupSlug}/history`}
          className="text-xs font-medium text-court-green hover:text-court-green-dark transition-colors cursor-pointer"
        >
          View All →
        </Link>
      </div>

      <div className="space-y-2">
        {matches.map((match) => (
          <MatchCard key={match.matchId} match={match} />
        ))}
      </div>
    </section>
  );
}

function MatchCard({ match }: { readonly match: RecentMatch }) {
  const teamAWon = match.winningTeam === "A";
  const teamBWon = match.winningTeam === "B";
  const timeAgo = match.completedAt ? formatTimeAgo(match.completedAt) : "";

  return (
    <div className="rounded-xl border border-border bg-surface p-3 sm:p-4 transition-all duration-200 hover:shadow-sm">
      <div className="flex items-center justify-between gap-3">
        {/* Team A */}
        <div className="flex-1 min-w-0 text-right">
          <p
            className={`text-sm truncate ${
              teamAWon
                ? "font-bold text-text-primary"
                : "font-medium text-text-secondary"
            }`}
          >
            {match.teamAPlayerNames.join(" & ")}
          </p>
        </div>

        {/* Score */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span
            className={`text-lg font-extrabold tabular-nums ${
              teamAWon ? "text-court-green" : "text-text-secondary"
            }`}
          >
            {match.teamAScore}
          </span>
          <span className="text-text-muted text-xs font-medium">–</span>
          <span
            className={`text-lg font-extrabold tabular-nums ${
              teamBWon ? "text-court-green" : "text-text-secondary"
            }`}
          >
            {match.teamBScore}
          </span>
        </div>

        {/* Team B */}
        <div className="flex-1 min-w-0 text-left">
          <p
            className={`text-sm truncate ${
              teamBWon
                ? "font-bold text-text-primary"
                : "font-medium text-text-secondary"
            }`}
          >
            {match.teamBPlayerNames.join(" & ")}
          </p>
        </div>
      </div>

      {/* Meta row */}
      <div className="flex items-center justify-center gap-2 mt-1.5">
        <span className="text-[11px] text-text-muted uppercase tracking-wide">
          {match.matchType}
        </span>
        {timeAgo && (
          <>
            <span className="text-text-muted">·</span>
            <span className="text-[11px] text-text-muted">{timeAgo}</span>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Time Formatting ─────────────────────────────────────────────────────────

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}
