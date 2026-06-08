"use client";

import type { LeaderboardEntry } from "@/lib/stats";

interface LeaderboardTableProps {
  readonly entries: readonly LeaderboardEntry[];
}

function formatWinRate(rate: number): string {
  return `${(rate * 100).toFixed(0)}%`;
}

function formatPointDiff(diff: number): string {
  if (diff > 0) return `+${diff}`;
  return `${diff}`;
}

function PlayerAvatar({
  displayName,
  color,
  avatarUrl,
  size = "md",
}: {
  readonly displayName: string;
  readonly color: string | null;
  readonly avatarUrl?: string | null;
  readonly size?: "sm" | "md";
}) {
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const sizeClasses = size === "sm" ? "h-7 w-7 text-xs" : "h-9 w-9 text-sm";

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={displayName}
        className={`${sizeClasses} rounded-full object-cover shrink-0`}
      />
    );
  }

  return (
    <div
      className={`flex ${sizeClasses} items-center justify-center rounded-full font-bold text-white shrink-0`}
      style={{ backgroundColor: color ?? "#64748B" }}
      aria-hidden="true"
    >
      {initials}
    </div>
  );
}

// Desktop: subtle row tinting for top 3
const ROW_TINT: Record<number, string> = {
  1: "bg-ball-yellow/10 hover:bg-ball-yellow/20",
  2: "bg-gray-50 hover:bg-gray-100/80",
  3: "bg-amber-50/70 hover:bg-amber-100/70",
};

// Mobile card styling per rank
const CARD_RANK_STYLE: Record<number, { bg: string; border: string; winColor: string }> = {
  1: { bg: "bg-ball-yellow/12", border: "border-ball-yellow/50", winColor: "text-court-green-dark" },
  2: { bg: "bg-gray-50",        border: "border-border",          winColor: "text-text-primary" },
  3: { bg: "bg-amber-50/60",    border: "border-amber-200/60",    winColor: "text-amber-800" },
};
const CARD_DEFAULT = { bg: "bg-surface", border: "border-border-muted", winColor: "text-text-primary" };

function RankBadge({ rank }: { readonly rank: number | null }) {
  if (rank === null) {
    return <span className="text-text-muted text-xs font-medium tabular-nums">-</span>;
  }
  if (rank <= 3) {
    const medals = ["🥇", "🥈", "🥉"];
    return (
      <span className="text-lg leading-none" aria-label={`Rank ${rank}`}>
        {medals[rank - 1]}
      </span>
    );
  }
  return (
    <span className="font-score text-base font-semibold text-text-secondary tabular-nums">
      {rank}
    </span>
  );
}

function RankCard({ entry }: { readonly entry: LeaderboardEntry }) {
  const style =
    entry.rank !== null && entry.rank <= 3
      ? CARD_RANK_STYLE[entry.rank]
      : CARD_DEFAULT;
  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div
      className={`rounded-xl border ${style.border} ${style.bg} p-3.5 flex items-center gap-3 transition-all active:scale-[0.98]`}
    >
      {/* Rank / medal */}
      <div className="w-8 text-center shrink-0">
        {entry.rank !== null && entry.rank <= 3 ? (
          <span className="text-xl" aria-label={`Rank ${entry.rank}`}>
            {medals[entry.rank - 1]}
          </span>
        ) : (
          <span className="font-score text-lg font-bold tabular-nums text-text-muted">
            {entry.rank ?? "-"}
          </span>
        )}
      </div>

      {/* Avatar */}
      <PlayerAvatar
        displayName={entry.displayName}
        color={entry.color}
        avatarUrl={entry.avatarUrl}
        size="md"
      />

      {/* Name + record */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-text-primary text-sm truncate">
          {entry.displayName}
        </p>
        <p className="text-xs text-text-muted mt-0.5 tabular-nums font-label">
          {entry.wins}W&nbsp;&nbsp;{entry.losses}L&nbsp;&nbsp;{entry.gamesPlayed}&nbsp;GP
        </p>
      </div>

      {/* Win% + point diff */}
      <div className="text-right shrink-0">
        <p className={`font-score text-lg font-bold tabular-nums leading-none ${style.winColor}`}>
          {formatWinRate(entry.winRate)}
        </p>
        <p
          className={`text-xs tabular-nums mt-0.5 font-label ${
            entry.pointDifferential > 0
              ? "text-court-green"
              : entry.pointDifferential < 0
                ? "text-hype-red"
                : "text-text-muted"
          }`}
        >
          {formatPointDiff(entry.pointDifferential)}
        </p>
      </div>
    </div>
  );
}

export function LeaderboardTable({ entries }: LeaderboardTableProps) {
  if (entries.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface-muted p-8 text-center">
        <p className="text-text-muted text-sm">
          No players yet. Add players to start tracking rankings.
        </p>
      </div>
    );
  }

  const qualified = entries.filter((e) => e.isQualified);
  const unqualified = entries.filter((e) => !e.isQualified);

  return (
    <div className="space-y-6">
      {/* ── MOBILE: Stacked rank cards ── */}
      <div className="md:hidden space-y-2">
        {qualified.map((entry) => (
          <RankCard key={entry.playerId} entry={entry} />
        ))}
      </div>

      {/* ── DESKTOP: Table with winner-tinted top rows ── */}
      <div className="hidden md:block overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-muted">
              <th className="px-3 py-3 text-center text-xs font-semibold text-text-muted uppercase tracking-wider w-12">
                #
              </th>
              <th className="px-3 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">
                Player
              </th>
              <th className="px-3 py-3 text-center text-xs font-semibold text-text-muted uppercase tracking-wider">
                W
              </th>
              <th className="px-3 py-3 text-center text-xs font-semibold text-text-muted uppercase tracking-wider">
                L
              </th>
              <th className="px-3 py-3 text-center text-xs font-semibold text-text-muted uppercase tracking-wider">
                GP
              </th>
              <th className="px-3 py-3 text-center text-xs font-semibold text-text-muted uppercase tracking-wider">
                Win%
              </th>
              <th className="px-3 py-3 text-center text-xs font-semibold text-text-muted uppercase tracking-wider">
                +/-
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-muted">
            {qualified.map((entry) => (
              <tr
                key={entry.playerId}
                className={`transition-colors ${
                  entry.rank !== null && entry.rank <= 3
                    ? ROW_TINT[entry.rank]
                    : "hover:bg-surface-muted/50"
                }`}
              >
                <td className="px-3 py-3 text-center">
                  <RankBadge rank={entry.rank} />
                </td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2.5">
                    <PlayerAvatar
                      displayName={entry.displayName}
                      color={entry.color}
                      avatarUrl={entry.avatarUrl}
                    />
                    <span className="font-medium text-text-primary truncate">
                      {entry.displayName}
                    </span>
                  </div>
                </td>
                <td className="px-3 py-3 text-center font-semibold text-court-green tabular-nums">
                  {entry.wins}
                </td>
                <td className="px-3 py-3 text-center font-semibold text-hype-red tabular-nums">
                  {entry.losses}
                </td>
                <td className="px-3 py-3 text-center text-text-secondary tabular-nums">
                  {entry.gamesPlayed}
                </td>
                <td className="px-3 py-3 text-center">
                  <span className="font-score text-base font-bold tabular-nums text-text-primary">
                    {formatWinRate(entry.winRate)}
                  </span>
                </td>
                <td
                  className={`px-3 py-3 text-center font-medium tabular-nums ${
                    entry.pointDifferential > 0
                      ? "text-court-green"
                      : entry.pointDifferential < 0
                        ? "text-hype-red"
                        : "text-text-muted"
                  }`}
                >
                  {formatPointDiff(entry.pointDifferential)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Unqualified players ── */}
      {unqualified.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider px-1 font-label">
            Needs 3 games to qualify
          </p>

          {/* Mobile */}
          <div className="md:hidden space-y-2">
            {unqualified.map((entry) => (
              <div
                key={entry.playerId}
                className="flex items-center gap-3 rounded-xl border border-border-muted bg-surface p-3.5 opacity-55"
              >
                <div className="w-8 shrink-0" />
                <PlayerAvatar
                  displayName={entry.displayName}
                  color={entry.color}
                  avatarUrl={entry.avatarUrl}
                  size="md"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-text-secondary text-sm truncate">
                    {entry.displayName}
                  </p>
                  <p className="text-xs text-text-muted mt-0.5 font-label">
                    {entry.gamesPlayed} GP
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop */}
          <div className="hidden md:block overflow-x-auto rounded-xl border border-border-muted bg-surface">
            <table className="w-full text-left text-sm">
              <tbody className="divide-y divide-border-muted">
                {unqualified.map((entry) => (
                  <tr
                    key={entry.playerId}
                    className="opacity-55 hover:opacity-80 transition-opacity"
                  >
                    <td className="px-3 py-3 text-center w-12">
                      <RankBadge rank={null} />
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2.5">
                        <PlayerAvatar
                          displayName={entry.displayName}
                          color={entry.color}
                          avatarUrl={entry.avatarUrl}
                        />
                        <span className="font-medium text-text-secondary truncate">
                          {entry.displayName}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center text-text-muted tabular-nums">
                      {entry.wins}
                    </td>
                    <td className="px-3 py-3 text-center text-text-muted tabular-nums">
                      {entry.losses}
                    </td>
                    <td className="px-3 py-3 text-center text-text-muted tabular-nums">
                      {entry.gamesPlayed}
                    </td>
                    <td className="px-3 py-3 text-center text-text-muted tabular-nums">
                      {entry.gamesPlayed > 0 ? formatWinRate(entry.winRate) : "-"}
                    </td>
                    <td className="px-3 py-3 text-center text-text-muted tabular-nums">
                      {entry.gamesPlayed > 0
                        ? formatPointDiff(entry.pointDifferential)
                        : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
