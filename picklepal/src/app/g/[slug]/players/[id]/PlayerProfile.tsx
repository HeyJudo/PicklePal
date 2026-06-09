"use client";

import Link from "next/link";
import { PlayerAvatar } from "@/components/players";
import { EditPlayerForm } from "./EditPlayerForm";
import type { PlayerStats, DuoStats, MatchSummary } from "@/lib/stats";
import type { Player } from "@/lib/supabase";

interface PlayerProfileProps {
  readonly stats: PlayerStats;
  readonly duos: readonly DuoStats[];
  readonly groupSlug: string;
  readonly player: Player;
  readonly isAdmin?: boolean;
}

function formatWinRate(rate: number): string {
  return `${(rate * 100).toFixed(0)}%`;
}

function formatPointDiff(diff: number): string {
  if (diff > 0) return `+${diff}`;
  return `${diff}`;
}

// ─── Stat Tile — replaces the bordered StatBox ───────────────────────────────

function StatTile({
  label,
  value,
  colorClass,
}: {
  readonly label: string;
  readonly value: string | number;
  readonly colorClass?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-4">
      <span
        className={`font-score text-3xl font-bold tabular-nums leading-none ${colorClass ?? "text-text-primary"}`}
      >
        {value}
      </span>
      <span className="text-[10px] font-label font-semibold uppercase tracking-widest text-text-muted mt-1.5">
        {label}
      </span>
    </div>
  );
}

// ─── Recent match row ─────────────────────────────────────────────────────────

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
    : "-";

  return (
    <div className="flex items-center justify-between py-3 border-b border-border-muted last:border-0 gap-3">
      {/* W / L badge */}
      <span
        className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${
          playerWon ? "bg-court-green" : "bg-hype-red"
        }`}
      >
        {playerWon ? "W" : "L"}
      </span>

      {/* Match type */}
      <span className="text-xs font-label text-text-muted capitalize shrink-0">
        {match.matchType === "doubles" ? "2v2" : "1v1"}
      </span>

      {/* Score */}
      <div className="flex items-baseline gap-1 flex-1 justify-center">
        <span
          className={`font-score text-2xl font-bold tabular-nums leading-none ${
            playerWon ? "text-court-green" : "text-text-muted"
          }`}
        >
          {playerScore}
        </span>
        <span className="text-text-muted text-sm font-light">-</span>
        <span
          className={`font-score text-2xl font-bold tabular-nums leading-none ${
            !playerWon ? "text-hype-red" : "text-text-muted"
          }`}
        >
          {opponentScore}
        </span>
      </div>

      {/* Date */}
      <span className="text-xs text-text-muted font-label shrink-0">
        {completedDate}
      </span>
    </div>
  );
}

// ─── Duo partner row ──────────────────────────────────────────────────────────

function DuoRow({
  duo,
  playerId,
}: {
  readonly duo: DuoStats;
  readonly playerId: string;
}) {
  const partnerName =
    duo.playerAId === playerId ? duo.playerBName : duo.playerAName;
  const winRatePct = (duo.winRate * 100).toFixed(0);
  const winRateNum = Number(winRatePct);

  return (
    <div className="flex items-center justify-between py-3 border-b border-border-muted last:border-0 gap-3">
      <p className="text-sm font-semibold text-text-primary truncate flex-1">
        {partnerName}
      </p>
      <div className="flex items-center gap-4 shrink-0">
        <span className="text-xs font-label text-text-muted tabular-nums">
          {duo.wins}W&nbsp;{duo.losses}L
        </span>
        <span
          className={`font-score text-base font-bold tabular-nums ${
            winRateNum >= 60
              ? "text-court-green"
              : winRateNum < 40
                ? "text-hype-red"
                : "text-text-primary"
          }`}
        >
          {winRatePct}%
        </span>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function PlayerProfile({
  stats,
  duos,
  groupSlug,
  player,
  isAdmin = false,
}: PlayerProfileProps) {
  const playerColor = player.color ?? "#2D8B4E";

  return (
    <div className="space-y-5">
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

      {/* ── Profile hero ── */}
      <div
        className="relative rounded-2xl overflow-hidden"
        style={{ backgroundColor: "#1E6B3A" }}
      >
        {/* Player color wash */}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, ${playerColor}cc 0%, ${playerColor}44 50%, transparent 80%)`,
          }}
          aria-hidden="true"
        />
        {/* Subtle court-line texture */}
        <div
          className="absolute inset-0 opacity-10 court-lines"
          aria-hidden="true"
        />

        <div className="relative p-5 flex items-center gap-4">
          <PlayerAvatar
            displayName={stats.displayName}
            color={stats.color}
            avatarUrl={player.avatar_url}
            size="lg"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-display text-3xl text-white leading-tight truncate">
                {stats.displayName}
              </h1>
              {isAdmin && <EditPlayerForm player={player} groupSlug={groupSlug} />}
            </div>
            <p className="text-white/60 text-sm mt-0.5 font-label">
              {stats.gamesPlayed} game{stats.gamesPlayed !== 1 ? "s" : ""} played
            </p>
          </div>
        </div>
      </div>

      {/* ── Stats tiles ── */}
      <div className="rounded-xl border border-border bg-surface grid grid-cols-4 divide-x divide-border-muted">
        <StatTile label="Wins" value={stats.wins} colorClass="text-court-green" />
        <StatTile
          label="Losses"
          value={stats.losses}
          colorClass="text-hype-red"
        />
        <StatTile
          label="Win%"
          value={
            stats.gamesPlayed > 0 ? formatWinRate(stats.winRate) : "-"
          }
        />
        <StatTile
          label="+/-"
          value={
            stats.gamesPlayed > 0
              ? formatPointDiff(stats.pointDifferential)
              : "-"
          }
          colorClass={
            stats.pointDifferential > 0
              ? "text-court-green"
              : stats.pointDifferential < 0
                ? "text-hype-red"
                : undefined
          }
        />
      </div>

      {/* ── Recent matches ── */}
      <section className="space-y-2">
        <h2 className="text-xs font-label font-semibold text-text-muted uppercase tracking-widest px-1">
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

      {/* ── Duo partners ── */}
      {duos.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-xs font-label font-semibold text-text-muted uppercase tracking-widest px-1">
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
