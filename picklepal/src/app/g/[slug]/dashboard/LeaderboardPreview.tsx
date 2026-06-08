import Link from "next/link";
import { RankBadge } from "@/components/ui";
import type { LeaderboardEntry } from "@/lib/stats";

interface LeaderboardPreviewProps {
  readonly entries: readonly LeaderboardEntry[];
  readonly groupSlug: string;
}

export function LeaderboardPreview({ entries, groupSlug }: LeaderboardPreviewProps) {
  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);
  const hasPodium = top3.length === 3;

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
          {hasPodium && (
            <div className="px-4 pt-5 pb-0">
              <PodiumSection top3={top3} />
            </div>
          )}
          {(!hasPodium || rest.length > 0) && (
            <ul
              className={[
                "divide-y divide-border-muted",
                hasPodium ? "border-t border-border-muted" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {(hasPodium ? rest : entries).map((entry, i) => (
                <LeaderboardRow
                  key={entry.playerId}
                  entry={entry}
                  index={hasPodium ? i + 3 : i}
                />
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}

// ─── Olympic Podium (top 3) ───────────────────────────────────────────────────

const PODIUM_CONFIG = {
  1: { stepH: "h-16", stepBg: "bg-ball-yellow",  nameColor: "text-court-green-dark", statColor: "text-court-green-dark", statSize: "text-xl", medal: "🥇", crown: true  },
  2: { stepH: "h-9",  stepBg: "bg-gray-300",     nameColor: "text-text-primary",     statColor: "text-text-primary",     statSize: "text-lg", medal: "🥈", crown: false },
  3: { stepH: "h-5",  stepBg: "bg-amber-600",    nameColor: "text-text-primary",     statColor: "text-text-primary",     statSize: "text-base", medal: "🥉", crown: false },
} as const;

function PodiumSection({ top3 }: { readonly top3: readonly LeaderboardEntry[] }) {
  const [gold, silver, bronze] = top3;
  // Podium display order: 2nd left | 1st center | 3rd right
  const slots: Array<{ entry: LeaderboardEntry; rank: 1 | 2 | 3 }> = [
    { entry: silver, rank: 2 },
    { entry: gold,   rank: 1 },
    { entry: bronze, rank: 3 },
  ];

  return (
    <div className="flex items-end gap-2">
      {slots.map(({ entry, rank }) => {
        const cfg = PODIUM_CONFIG[rank];
        return (
          <div key={entry.playerId} className="flex-1 flex flex-col items-center">
            {/* Player info above the platform */}
            <div className="flex flex-col items-center text-center px-1 mb-2 w-full">
              {cfg.crown && (
                <span className="text-sm leading-none mb-1 select-none" role="img" aria-label="Champion">👑</span>
              )}
              <PlayerAvatar
                displayName={entry.displayName}
                color={entry.color}
                avatarUrl={entry.avatarUrl}
                size={rank === 1 ? "lg" : "md"}
              />
              <p className={`text-xs font-bold truncate w-full leading-tight mt-1.5 ${cfg.nameColor}`}>
                {entry.displayName}
              </p>
              <p className={`font-score font-bold tabular-nums leading-none mt-0.5 ${cfg.statSize} ${cfg.statColor}`}>
                {(entry.winRate * 100).toFixed(0)}
                <span className="text-xs">%</span>
              </p>
              <p className="text-[10px] text-text-muted tabular-nums mt-0.5 leading-none">
                {entry.wins}W {entry.losses}L
              </p>
            </div>
            {/* Podium step */}
            <div
              className={`w-full ${cfg.stepH} ${cfg.stepBg} rounded-t-lg flex items-center justify-center`}
            >
              <span className="text-base leading-none select-none" role="img" aria-label={`Rank ${rank}`}>
                {cfg.medal}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Regular row (rank 4+) ────────────────────────────────────────────────────

function LeaderboardRow({
  entry,
  index,
}: {
  readonly entry: LeaderboardEntry;
  readonly index: number;
}) {
  return (
    <li
      className={[
        "fade-rise flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-muted",
        `stagger-${Math.min(index + 1, 5)}`,
      ].join(" ")}
    >
      <RankBadge rank={entry.rank ?? index + 1} size="md" />

      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span
          className="h-2.5 w-2.5 rounded-full shrink-0"
          style={{ backgroundColor: entry.color ?? "#6f7a70" }}
          aria-hidden="true"
        />
        <div className="min-w-0">
          <span className="text-sm font-semibold truncate block text-text-primary">
            {entry.displayName}
          </span>
          {!entry.isQualified && (
            <span className="text-[10px] text-text-muted">
              {entry.wins + entry.losses} / 3 games
            </span>
          )}
        </div>
      </div>

      <div className="text-right shrink-0">
        <span
          className={[
            "font-score font-bold text-xl tabular-nums leading-none text-text-primary",
            !entry.isQualified ? "opacity-50" : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {(entry.winRate * 100).toFixed(0)}%
        </span>
        <p className="text-[10px] tabular-nums mt-0.5 text-text-muted">
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

// ─── Player Avatar ────────────────────────────────────────────────────────────

function PlayerAvatar({
  displayName,
  color,
  avatarUrl,
  size = "md",
}: {
  readonly displayName: string;
  readonly color: string | null;
  readonly avatarUrl: string | null;
  readonly size?: "md" | "lg";
}) {
  const initials = displayName.trim().slice(0, 2).toUpperCase();
  const dim = size === "lg" ? "w-10 h-10 text-sm" : "w-8 h-8 text-xs";

  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt={displayName}
        className={`${dim} rounded-full object-cover ring-2 ring-surface shadow-sm shrink-0`}
      />
    );
  }

  return (
    <span
      className={`${dim} rounded-full ring-2 ring-surface shadow-sm shrink-0 flex items-center justify-center font-bold text-white`}
      style={{ backgroundColor: color ?? "#6f7a70" }}
      aria-hidden="true"
    >
      {initials}
    </span>
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
