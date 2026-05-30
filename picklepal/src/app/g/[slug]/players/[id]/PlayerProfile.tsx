"use client";

import Link from "next/link";
import type { PlayerStats, DuoStats } from "@/lib/stats";

interface PlayerProfileProps {
  readonly stats: PlayerStats;
  readonly duos: readonly DuoStats[];
  readonly groupSlug: string;
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
      className="flex h-16 w-16 items-center justify-center rounded-full text-xl font-bold text-white"
      style={{ backgroundColor: color ?? "#64748B" }}
    >
      {initials}
    </div>
  );
}

function StatBox({
  label,
  value,
  colorClass,
}: {
  readonly label: string;
  readonly value: string | number;
  readonly colorClass?: string;
}) {
  return (
    <div className="flex flex-col items-center rounded-lg border border-border bg-surface-muted px-3 py-3">
      <span className={`text-xl font-bold ${colorClass ?? "text-text-primary"}`}>
        {value}
      </span>
      <span className="text-xs text-text-muted mt-0.5">{label}</span>
    </div>
  );
}

function RecentMatchRow({
  match,
  playerId,
}: {
  readonly match: MatchSummary;
  readonly playerId: string;
}) {
  const isTeamA = match.teamAPlayerIds.includes(playerId);
  const teamAWon = match.winningTeam === "A";
  const playerWon = isTeamA ? teamAWon : !teamAWon;

  const playerScore = isTeamA ? match.teamAScore : match.teamBScore;
  const opponentScore = isTeamA ? match.teamBScore : match.teamAScore;

  const completedDate = match.completedAt
    ? new Date(match.completedAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    : "—";

  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border-muted last:border-0">
      <div className="flex items-center gap-3">
        <span
          className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white ${
            playerWon ? "bg-court-green" : "bg-hype-red"
          }`}
        >
          {playerWon ? "W" : "L"}
        </span>
        <span className="text-sm text-text-secondary capitalize">
          {match.matchType}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm font-semibold text-text-primary">
          {playerScore}–{opponentScore}
        </span>
        <span className="text-xs text-text-muted w-12 text-right">
          {completedDate}
        </span>
      </div>
    </div>
  );
}

function DuoRow({
  duo,
  playerId,
}: {
  readonly duo: DuoStats;
  readonly playerId: string;
}) {
  const partnerName =
    duo.playerAId === playerId ? duo.playerBName : duo.playerAName;

  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border-muted last:border-0">
      <span className="text-sm font-medium text-text-primary truncate">
        {partnerName}
      </span>
      <div className="flex items-center gap-4 shrink-0">
        <span className="text-sm text-text-secondary">
          {duo.wins}W–{duo.losses}L
        </span>
        <span className="text-sm font-semibold text-text-primary w-10 text-right">
          {formatWinRate(duo.winRate)}
        </span>
      </div>
    </div>
  );
}

export function PlayerProfile({ stats, duos, groupSlug }: PlayerProfileProps) {
  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href={`/g/${groupSlug}/players`}
        className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-secondary transition-colors cursor-pointer"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.75 19.5 8.25 12l7.5-7.5"
          />
        </svg>
        All Players
      </Link>

      {/* Player header */}
      <div className="flex items-center gap-4">
        <PlayerAvatar displayName={stats.displayName} color={stats.color} />
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            {stats.displayName}
          </h1>
          <p className="text-text-secondary text-sm mt-0.5">
            {stats.gamesPlayed} game{stats.gamesPlayed !== 1 ? "s" : ""} played
          </p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-4 gap-2">
        <StatBox label="Wins" value={stats.wins} colorClass="text-court-green" />
        <StatBox label="Losses" value={stats.losses} colorClass="text-hype-red" />
        <StatBox
          label="Win%"
          value={stats.gamesPlayed > 0 ? formatWinRate(stats.winRate) : "—"}
        />
        <StatBox
          label="+/−"
          value={stats.gamesPlayed > 0 ? formatPointDiff(stats.pointDifferential) : "—"}
          colorClass={
            stats.pointDifferential > 0
              ? "text-court-green"
              : stats.pointDifferential < 0
                ? "text-hype-red"
                : undefined
          }
        />
      </div>

      {/* Recent matches */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider">
          Recent Matches
        </h2>
        {stats.recentMatches.length === 0 ? (
          <div className="rounded-xl border border-border bg-surface-muted p-6 text-center">
            <p className="text-text-muted text-sm">No matches played yet.</p>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-surface px-4">
            {stats.recentMatches.map((match) => (
              <RecentMatchRow
                key={match.matchId}
                match={match}
                playerId={stats.playerId}
              />
            ))}
          </div>
        )}
      </section>

      {/* Duo partners */}
      {duos.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider">
            Partner Stats
          </h2>
          <div className="rounded-xl border border-border bg-surface px-4">
            {duos.map((duo) => (
              <DuoRow
                key={`${duo.playerAId}-${duo.playerBId}`}
                duo={duo}
                playerId={stats.playerId}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
