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
}: {
  readonly displayName: string;
  readonly color: string | null;
}) {
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white shrink-0"
      style={{ backgroundColor: color ?? "#64748B" }}
    >
      {initials}
    </div>
  );
}

function RankBadge({ rank }: { readonly rank: number | null }) {
  if (rank === null) {
    return (
      <span className="text-text-muted text-xs font-medium">—</span>
    );
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
    <span className="text-text-secondary text-sm font-semibold">
      {rank}
    </span>
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
      {/* Main leaderboard table */}
      <div className="overflow-x-auto rounded-xl border border-border bg-surface">
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
                +/−
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-muted">
            {qualified.map((entry) => (
              <tr
                key={entry.playerId}
                className="hover:bg-surface-muted/50 transition-colors"
              >
                <td className="px-3 py-3 text-center">
                  <RankBadge rank={entry.rank} />
                </td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2.5">
                    <PlayerAvatar
                      displayName={entry.displayName}
                      color={entry.color}
                    />
                    <span className="font-medium text-text-primary truncate">
                      {entry.displayName}
                    </span>
                  </div>
                </td>
                <td className="px-3 py-3 text-center font-medium text-court-green">
                  {entry.wins}
                </td>
                <td className="px-3 py-3 text-center font-medium text-hype-red">
                  {entry.losses}
                </td>
                <td className="px-3 py-3 text-center text-text-secondary">
                  {entry.gamesPlayed}
                </td>
                <td className="px-3 py-3 text-center font-semibold text-text-primary">
                  {formatWinRate(entry.winRate)}
                </td>
                <td
                  className={`px-3 py-3 text-center font-medium ${
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

      {/* Unqualified players section */}
      {unqualified.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider px-1">
            Needs 3 games to qualify
          </h3>
          <div className="overflow-x-auto rounded-xl border border-border-muted bg-surface">
            <table className="w-full text-left text-sm">
              <tbody className="divide-y divide-border-muted">
                {unqualified.map((entry) => (
                  <tr
                    key={entry.playerId}
                    className="opacity-70 hover:opacity-100 transition-opacity"
                  >
                    <td className="px-3 py-3 text-center w-12">
                      <RankBadge rank={null} />
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2.5">
                        <PlayerAvatar
                          displayName={entry.displayName}
                          color={entry.color}
                        />
                        <span className="font-medium text-text-secondary truncate">
                          {entry.displayName}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center text-text-muted">
                      {entry.wins}
                    </td>
                    <td className="px-3 py-3 text-center text-text-muted">
                      {entry.losses}
                    </td>
                    <td className="px-3 py-3 text-center text-text-muted">
                      {entry.gamesPlayed}
                    </td>
                    <td className="px-3 py-3 text-center text-text-muted">
                      {entry.gamesPlayed > 0 ? formatWinRate(entry.winRate) : "—"}
                    </td>
                    <td className="px-3 py-3 text-center text-text-muted">
                      {entry.gamesPlayed > 0
                        ? formatPointDiff(entry.pointDifferential)
                        : "—"}
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
