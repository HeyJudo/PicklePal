import Link from "next/link";
import { Chip } from "@/components/ui";
import type { RecentMatch } from "../actions";

interface RecentMatchesProps {
  readonly matches: readonly RecentMatch[];
  readonly groupSlug: string;
}

export function RecentMatches({ matches, groupSlug }: RecentMatchesProps) {
  return (
    <section aria-label="Recent matches">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <CourtIcon className="w-4 h-4 text-court-green" />
          <h2 className="text-base font-bold text-text-primary tracking-tight">Recent Matches</h2>
        </div>
        <Link
          href={`/g/${groupSlug}/history`}
          className="text-xs font-semibold text-court-green hover:text-court-green-dark transition-colors"
        >
          All History
        </Link>
      </div>

      {matches.length === 0 ? (
        <EmptyMatches />
      ) : (
        <div className="rounded-xl border border-border bg-surface overflow-hidden">
          <ul className="divide-y divide-border-muted">
            {matches.map((match, i) => (
              <MatchRow key={match.matchId} match={match} index={i} />
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

// ─── Match Row ────────────────────────────────────────────────────────────────

function MatchRow({
  match,
  index,
}: {
  readonly match: RecentMatch;
  readonly index: number;
}) {
  const teamAWon = match.winningTeam === "A";
  const teamBWon = match.winningTeam === "B";
  const timeAgo = match.completedAt ? formatTimeAgo(match.completedAt) : null;

  return (
    <li
      className={[
        "fade-rise px-4 py-3.5 hover:bg-surface-muted transition-colors",
        `stagger-${Math.min(index + 1, 5)}`,
      ].join(" ")}
    >
      {/* Score row */}
      <div className="flex items-center gap-2">
        {/* Team A — right aligned */}
        <div className="flex-1 min-w-0 text-right">
          <p
            className={[
              "text-sm leading-tight truncate",
              teamAWon ? "font-bold text-text-primary" : "font-medium text-text-muted/60",
            ].join(" ")}
          >
            {match.teamAPlayerNames.join(" & ")}
          </p>
        </div>

        {/* Scores — Anton for winner's score, muted for loser */}
        <div className="flex items-center gap-0.5 shrink-0 min-w-[72px] justify-center">
          <span
            className={[
              "tabular-nums leading-none w-8 text-right",
              teamAWon
                ? "font-display text-3xl text-court-green"
                : "font-score font-bold text-2xl text-text-muted/40",
            ].join(" ")}
          >
            {match.teamAScore}
          </span>
          <span className="text-border-muted text-base font-medium px-0.5">-</span>
          <span
            className={[
              "tabular-nums leading-none w-8 text-left",
              teamBWon
                ? "font-display text-3xl text-court-green"
                : "font-score font-bold text-2xl text-text-muted/40",
            ].join(" ")}
          >
            {match.teamBScore}
          </span>
        </div>

        {/* Team B — left aligned */}
        <div className="flex-1 min-w-0 text-left">
          <p
            className={[
              "text-sm leading-tight truncate",
              teamBWon ? "font-bold text-text-primary" : "font-medium text-text-muted/60",
            ].join(" ")}
          >
            {match.teamBPlayerNames.join(" & ")}
          </p>
        </div>
      </div>

      {/* Meta row */}
      <div className="flex items-center justify-center gap-2 mt-2">
        <Chip variant="neutral" size="sm">{match.matchType}</Chip>
        {timeAgo && (
          <span className="text-[11px] text-text-muted">{timeAgo}</span>
        )}
      </div>
    </li>
  );
}

// ─── Empty ────────────────────────────────────────────────────────────────────

function EmptyMatches() {
  return (
    <div className="rounded-xl bg-surface-muted border border-border-muted px-6 py-8 text-center">
      <CourtIcon className="w-8 h-8 text-text-muted mx-auto mb-2" />
      <p className="text-sm font-medium text-text-secondary">No matches yet</p>
      <p className="text-xs text-text-muted mt-1">Start a Game Day to see results here.</p>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

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
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function CourtIcon({ className }: { readonly className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" aria-hidden="true">
      <rect x="2" y="4" width="20" height="16" rx="1.5" />
      <line x1="12" y1="4" x2="12" y2="20" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <line x1="7" y1="4" x2="7" y2="20" strokeDasharray="2 2" />
      <line x1="17" y1="4" x2="17" y2="20" strokeDasharray="2 2" />
    </svg>
  );
}
