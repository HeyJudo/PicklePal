"use client";

import { useState } from "react";
import Link from "next/link";
import { Handshake, Swords, ChevronDown } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { PlayerAvatar } from "@/components/players";
import { EditPlayerForm } from "./EditPlayerForm";
import type { PlayerStats, DuoStats, RivalryStats, MatchSummary } from "@/lib/stats";
import type { Player } from "@/lib/supabase";

interface PlayerProfileProps {
  readonly stats: PlayerStats;
  readonly duos: readonly DuoStats[];
  readonly rivalries: readonly RivalryStats[];
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

function winRateColorClass(winRateNum: number): string {
  if (winRateNum >= 60) return "text-court-green";
  if (winRateNum < 40) return "text-hype-red";
  return "text-text-primary";
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

  const dateTs = match.playedAt ?? match.completedAt;
  const completedDate = dateTs
    ? new Date(dateTs).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    : "-";
  const isManual = match.source === "manual";

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

      {/* Manual badge */}
      {isManual && (
        <span className="inline-flex items-center rounded-full bg-amber-50 border border-amber-200 px-1.5 py-0.5 text-[9px] font-label font-semibold uppercase tracking-wide text-amber-600 shrink-0">
          Manual
        </span>
      )}

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
    <div className="flex items-center gap-3 py-3 border-b border-border-muted last:border-0">
      <PlayerAvatar
        displayName={partnerName}
        color={null}
        avatarUrl={null}
        size="xs"
      />
      <p className="text-sm font-semibold text-text-primary truncate flex-1">
        {partnerName}
      </p>
      <div className="flex items-center gap-3 shrink-0">
        <span className="text-xs font-label text-text-muted tabular-nums">
          {duo.wins}W&nbsp;{duo.losses}L
        </span>
        <span
          className={`font-score text-base font-bold tabular-nums ${winRateColorClass(winRateNum)}`}
        >
          {winRatePct}%
        </span>
      </div>
    </div>
  );
}

// ─── Featured chemistry card (top duo by win rate) ────────────────────────────

function BestChemistryCard({
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
  const diff = duo.pointDifferential;

  return (
    <div className="rounded-xl border border-sky-200 bg-gradient-to-br from-sky-50 to-white p-4 flex items-center gap-4 shadow-sm">
      <div className="relative shrink-0">
        <PlayerAvatar
          displayName={partnerName}
          color={null}
          avatarUrl={null}
          size="md"
        />
        <span className="absolute -bottom-1 -right-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-sky-blue ring-2 ring-white">
          <Handshake className="h-3 w-3 text-white" strokeWidth={2.5} />
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-label font-semibold uppercase tracking-widest text-sky-500 mb-0.5">
          Best Chemistry
        </p>
        <p className="text-sm font-bold text-text-primary truncate">{partnerName}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs font-label text-text-muted tabular-nums">
            {duo.wins}W&nbsp;{duo.losses}L
          </span>
          <span className="text-text-muted/40 text-xs">·</span>
          <span className="text-xs font-label text-text-muted tabular-nums">
            {diff > 0 ? `+${diff}` : diff} pts
          </span>
        </div>
      </div>
      <div className="shrink-0 text-right">
        <span
          className={`font-score text-2xl font-bold tabular-nums leading-none ${winRateColorClass(winRateNum)}`}
        >
          {winRatePct}%
        </span>
        <p className="text-[10px] font-label text-text-muted mt-0.5">win rate</p>
      </div>
    </div>
  );
}

// ─── Rivalry row (compact) ────────────────────────────────────────────────────

function RivalryRow({
  rivalry,
}: {
  readonly rivalry: RivalryStats;
}) {
  const winRatePct = (rivalry.winRate * 100).toFixed(0);
  const winRateNum = Number(winRatePct);
  const diff = rivalry.pointDifferential;

  return (
    <div className="flex items-center gap-3 py-3 border-b border-border-muted last:border-0">
      <PlayerAvatar
        displayName={rivalry.opponentName}
        color={rivalry.opponentColor}
        avatarUrl={rivalry.opponentAvatarUrl}
        size="xs"
      />
      <p className="text-sm font-semibold text-text-primary truncate flex-1">
        {rivalry.opponentName}
      </p>
      <div className="flex items-center gap-3 shrink-0">
        <span className="text-xs font-label text-text-muted tabular-nums">
          {rivalry.wins}W&nbsp;{rivalry.losses}L
        </span>
        <span
          className={`font-score text-base font-bold tabular-nums ${winRateColorClass(winRateNum)}`}
        >
          {winRatePct}%
        </span>
        <span
          className={`text-xs font-label tabular-nums ${
            diff > 0 ? "text-court-green" : diff < 0 ? "text-hype-red" : "text-text-muted"
          }`}
        >
          {diff > 0 ? `+${diff}` : diff}
        </span>
      </div>
    </div>
  );
}

// ─── Featured rivalry card (biggest rival) ────────────────────────────────────

function BiggestRivalCard({
  rivalry,
}: {
  readonly rivalry: RivalryStats;
}) {
  const winRatePct = (rivalry.winRate * 100).toFixed(0);
  const winRateNum = Number(winRatePct);
  const diff = rivalry.pointDifferential;

  const isWinning = rivalry.wins > rivalry.losses;
  const isLosing = rivalry.losses > rivalry.wins;

  return (
    <div
      className={`rounded-xl border p-4 flex items-center gap-4 shadow-sm ${
        isWinning
          ? "border-court-green/30 bg-gradient-to-br from-court-green/5 to-white"
          : isLosing
            ? "border-hype-red/30 bg-gradient-to-br from-hype-red/5 to-white"
            : "border-border bg-gradient-to-br from-surface-muted to-white"
      }`}
    >
      <div className="relative shrink-0">
        <PlayerAvatar
          displayName={rivalry.opponentName}
          color={rivalry.opponentColor}
          avatarUrl={rivalry.opponentAvatarUrl}
          size="md"
        />
        <span
          className={`absolute -bottom-1 -right-1 inline-flex h-5 w-5 items-center justify-center rounded-full ring-2 ring-white ${
            isWinning
              ? "bg-court-green"
              : isLosing
                ? "bg-hype-red"
                : "bg-text-muted"
          }`}
        >
          <Swords className="h-3 w-3 text-white" strokeWidth={2.5} />
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-label font-semibold uppercase tracking-widest text-text-muted mb-0.5">
          Biggest Rival
        </p>
        <p className="text-sm font-bold text-text-primary truncate">
          {rivalry.opponentName}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs font-label text-text-muted tabular-nums">
            {rivalry.gamesPlayed} game{rivalry.gamesPlayed !== 1 ? "s" : ""}
          </span>
          <span className="text-text-muted/40 text-xs">·</span>
          <span
            className={`text-xs font-label tabular-nums ${
              diff > 0 ? "text-court-green" : diff < 0 ? "text-hype-red" : "text-text-muted"
            }`}
          >
            {diff > 0 ? `+${diff}` : diff} pts
          </span>
        </div>
      </div>
      <div className="shrink-0 text-right">
        <div className="flex items-baseline gap-1 justify-end">
          <span
            className={`font-score text-2xl font-bold tabular-nums leading-none ${
              isWinning ? "text-court-green" : isLosing ? "text-hype-red" : "text-text-primary"
            }`}
          >
            {rivalry.wins}
          </span>
          <span className="text-text-muted text-lg font-light">–</span>
          <span
            className={`font-score text-2xl font-bold tabular-nums leading-none ${
              isLosing ? "text-hype-red" : isWinning ? "text-text-muted" : "text-text-primary"
            }`}
          >
            {rivalry.losses}
          </span>
        </div>
        <span
          className={`text-[11px] font-label tabular-nums ${winRateColorClass(winRateNum)}`}
        >
          {winRatePct}% win
        </span>
      </div>
    </div>
  );
}

// ─── Collapsible list wrapper ─────────────────────────────────────────────────

const COLLAPSE_THRESHOLD = 5;

function CollapsibleList({
  children,
  totalCount,
}: {
  readonly children: React.ReactNode[];
  readonly totalCount: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const reduce = useReducedMotion();

  // If at or below threshold, render everything with no toggle
  if (totalCount <= COLLAPSE_THRESHOLD) {
    return <>{children}</>;
  }

  const visibleChildren = children.slice(0, COLLAPSE_THRESHOLD);
  const hiddenChildren = children.slice(COLLAPSE_THRESHOLD);

  return (
    <>
      {visibleChildren}

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="overflow"
            initial={reduce ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            style={{ overflow: "hidden" }}
          >
            {hiddenChildren}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle row */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-center gap-1.5 py-3 border-t border-border-muted text-xs font-label font-semibold text-text-muted hover:text-text-secondary transition-colors cursor-pointer select-none"
        aria-expanded={expanded}
      >
        <span>
          {expanded ? "Show less" : `Show all (${totalCount})`}
        </span>
        <motion.span
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={reduce ? { duration: 0 } : { duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          style={{ display: "inline-flex" }}
        >
          <ChevronDown className="h-3.5 w-3.5" strokeWidth={2.5} />
        </motion.span>
      </button>
    </>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function PlayerProfile({
  stats,
  duos,
  rivalries,
  groupSlug,
  player,
  isAdmin = false,
}: PlayerProfileProps) {
  const playerColor = player.color ?? "#2D8B4E";

  // Best chemistry: top duo by win rate (already sorted by computeDuoStats)
  const topDuo = duos.length > 0 ? duos[0] : null;
  const otherDuos = duos.length > 1 ? duos.slice(1) : [];

  // Biggest rival: first entry (sorted by games played desc)
  const topRival = rivalries.length > 0 ? rivalries[0] : null;
  const otherRivals = rivalries.length > 1 ? rivalries.slice(1) : [];

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

      {/* ── Partner Stats ── */}
      {duos.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-xs font-label font-semibold text-text-muted uppercase tracking-widest px-1">
            Partner Stats
          </h2>
          <div className="space-y-2">
            {/* Featured best chemistry card */}
            {topDuo && (
              <BestChemistryCard duo={topDuo} playerId={stats.playerId} />
            )}
            {/* Other partners list */}
            {otherDuos.length > 0 && (
              <div className="rounded-xl border border-border bg-surface px-4">
                <CollapsibleList totalCount={otherDuos.length}>
                  {otherDuos.map((duo) => (
                    <DuoRow
                      key={`${duo.playerAId}-${duo.playerBId}`}
                      duo={duo}
                      playerId={stats.playerId}
                    />
                  ))}
                </CollapsibleList>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── Rivalries ── */}
      <section className="space-y-2">
        <h2 className="text-xs font-label font-semibold text-text-muted uppercase tracking-widest px-1">
          Rivalries
        </h2>
        {rivalries.length === 0 ? (
          <div className="rounded-xl border border-border bg-surface-muted p-6 text-center">
            <p className="text-text-muted text-sm">
              Play more games to build rivalries.
            </p>
            <p className="text-text-muted/60 text-xs mt-1">
              Face the same opponent at least twice to appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Featured biggest rival card */}
            {topRival && <BiggestRivalCard rivalry={topRival} />}
            {/* Other rivals list */}
            {otherRivals.length > 0 && (
              <div className="rounded-xl border border-border bg-surface px-4">
                <CollapsibleList totalCount={otherRivals.length}>
                  {otherRivals.map((rivalry) => (
                    <RivalryRow
                      key={rivalry.opponentId}
                      rivalry={rivalry}
                    />
                  ))}
                </CollapsibleList>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
