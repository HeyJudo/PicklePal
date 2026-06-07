import Link from "next/link";
import { RankBadge } from "@/components/ui";
import type { LeaderboardEntry } from "@/lib/stats";

interface LeaderboardPreviewProps {
  readonly entries: readonly LeaderboardEntry[];
  readonly groupSlug: string;
}

export function LeaderboardPreview({ entries, groupSlug }: LeaderboardPreviewProps) {
  return (
    <section aria-label="Leaderboard preview">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <PodiumIcon className="w-4 h-4 text-court-green" />
          <h2 className="text-base font-bold text-text-primary tracking-tight">Leaderboard</h2>
        </div>
        <Link
          href={`/g/${groupSlug}/board`}
          className="text-xs font-semibold text-court-green hover:text-court-green-dark transition-colors"
        >
          Full Board
        </Link>
      </div>

      {entries.length === 0 ? (
        <EmptyLeaderboard />
      ) : (
        <div className="rounded-xl border border-border bg-surface overflow-hidden">
          <ul className="divide-y divide-border-muted">
            {entries.map((entry, i) => (
              <LeaderboardRow key={entry.playerId} entry={entry} index={i} />
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

// ─── Row ─────────────────────────────────────────────────────────────────────

function LeaderboardRow({
  entry,
  index,
}: {
  readonly entry: LeaderboardEntry;
  readonly index: number;
}) {
  const isFirst = index === 0;

  return (
    <li
      className={[
        "fade-rise flex items-center gap-3 px-4 py-3 transition-colors",
        // #1 row: full bold gold background — unmistakably first place
        isFirst
          ? "bg-ball-yellow hover:bg-ball-yellow-light"
          : "hover:bg-surface-muted",
        `stagger-${Math.min(index + 1, 5)}`,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {/* Rank badge */}
      <RankBadge rank={entry.rank ?? index + 1} size="md" />

      {/* Player color dot + name */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span
          className="h-2.5 w-2.5 rounded-full shrink-0"
          style={{ backgroundColor: entry.color ?? "#6f7a70" }}
          aria-hidden="true"
        />
        <div className="min-w-0">
          <span
            className={[
              "text-sm font-semibold truncate block",
              isFirst ? "text-court-green-dark" : "text-text-primary",
            ].join(" ")}
          >
            {entry.displayName}
          </span>
          {!entry.isQualified && (
            <span className={["text-[10px]", isFirst ? "text-court-green-dark/60" : "text-text-muted"].join(" ")}>
              {entry.wins + entry.losses} / 3 games
            </span>
          )}
        </div>
      </div>

      {/* Win% — Anton on #1, Archivo Narrow on others */}
      <div className="text-right shrink-0">
        <span
          className={[
            "tabular-nums leading-none",
            isFirst
              ? "font-display text-2xl text-court-green-dark"
              : "font-score font-bold text-xl text-text-primary",
            !entry.isQualified && !isFirst ? "opacity-50" : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {(entry.winRate * 100).toFixed(0)}%
        </span>
        <p
          className={[
            "text-[10px] tabular-nums mt-0.5",
            isFirst ? "text-court-green-dark/60" : "text-text-muted",
          ].join(" ")}
        >
          {entry.wins}W {entry.losses}L
        </p>
      </div>
    </li>
  );
}

// ─── Empty ────────────────────────────────────────────────────────────────────

function EmptyLeaderboard() {
  return (
    <div className="rounded-xl bg-surface-muted border border-border-muted px-6 py-8 text-center">
      <PodiumIcon className="w-8 h-8 text-text-muted mx-auto mb-2" />
      <p className="text-sm font-medium text-text-secondary">No rankings yet</p>
      <p className="text-xs text-text-muted mt-1">
        Play a few games and the board lights up.
      </p>
    </div>
  );
}

function PodiumIcon({ className }: { readonly className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" aria-hidden="true">
      <rect x="2" y="13" width="6" height="9" rx="1" />
      <rect x="9" y="9" width="6" height="13" rx="1" />
      <rect x="16" y="11" width="6" height="11" rx="1" />
    </svg>
  );
}
