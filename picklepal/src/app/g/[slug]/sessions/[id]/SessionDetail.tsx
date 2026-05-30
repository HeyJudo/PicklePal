"use client";

import Link from "next/link";
import type { Match, Session } from "@/lib/supabase";
import type { SessionSummary, SessionAwards, MvpAward, HottestDuoAward, BestMatchAward } from "@/lib/stats";

interface SessionDetailProps {
  readonly session: Session;
  readonly summary: SessionSummary;
  readonly awards: SessionAwards;
  readonly matches: readonly Match[];
  readonly playerNames: Record<string, string>;
  readonly groupSlug: string;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatDuration(minutes: number | null): string {
  if (minutes === null) return "In progress";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

function formatWinRate(rate: number): string {
  return `${(rate * 100).toFixed(0)}%`;
}

// ─── Award Cards ─────────────────────────────────────────────────────────────

function MvpCard({ mvp }: { readonly mvp: MvpAward }) {
  const initials = mvp.displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="rounded-xl border border-ball-yellow/30 bg-ball-yellow/5 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-lg" aria-hidden="true">🏆</span>
        <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider">
          MVP of the Day
        </h3>
      </div>
      <div className="flex items-center gap-3">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white shrink-0"
          style={{ backgroundColor: mvp.color ?? "#64748B" }}
        >
          {initials}
        </div>
        <div>
          <p className="font-bold text-text-primary">{mvp.displayName}</p>
          <p className="text-xs text-text-secondary">
            {mvp.wins}W in {mvp.gamesPlayed} games · +{mvp.pointDifferential > 0 ? mvp.pointDifferential : 0} pts
          </p>
        </div>
      </div>
    </div>
  );
}

function HottestDuoCard({ duo }: { readonly duo: HottestDuoAward }) {
  return (
    <div className="rounded-xl border border-hype-orange/30 bg-hype-orange/5 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-lg" aria-hidden="true">🔥</span>
        <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider">
          Hottest Duo
        </h3>
      </div>
      <div>
        <p className="font-bold text-text-primary">
          {duo.playerAName} & {duo.playerBName}
        </p>
        <p className="text-xs text-text-secondary">
          {duo.wins}W–{duo.losses}L ({formatWinRate(duo.winRate)}) in {duo.gamesPlayed} games together
        </p>
      </div>
    </div>
  );
}

function BestMatchCard({
  match,
  playerNames,
}: {
  readonly match: BestMatchAward;
  readonly playerNames: Record<string, string>;
}) {
  const teamANames = match.teamAPlayerIds.map((id) => playerNames[id] ?? "Unknown").join(" & ");
  const teamBNames = match.teamBPlayerIds.map((id) => playerNames[id] ?? "Unknown").join(" & ");

  return (
    <div className="rounded-xl border border-sky-blue/30 bg-sky-blue/5 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-lg" aria-hidden="true">⚡</span>
        <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider">
          Best Match
        </h3>
      </div>
      <div>
        <p className="font-bold text-text-primary">
          {match.teamAScore}–{match.teamBScore}
        </p>
        <p className="text-xs text-text-secondary">
          {teamANames} vs {teamBNames}
        </p>
      </div>
    </div>
  );
}

// ─── Match List ──────────────────────────────────────────────────────────────

function MatchRow({
  match,
  playerNames,
}: {
  readonly match: Match;
  readonly playerNames: Record<string, string>;
}) {
  const teamAWon = match.winning_team === "A";
  const teamANames = match.team_a_player_ids.map((id) => playerNames[id] ?? "Unknown").join(" & ");
  const teamBNames = match.team_b_player_ids.map((id) => playerNames[id] ?? "Unknown").join(" & ");

  return (
    <div className="flex items-center gap-3 py-3 border-b border-border-muted last:border-0">
      <div className={`flex-1 min-w-0 ${teamAWon ? "" : "opacity-70"}`}>
        <p className={`text-sm truncate ${teamAWon ? "font-semibold text-text-primary" : "text-text-secondary"}`}>
          {teamANames}
        </p>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <span className={`text-sm font-bold tabular-nums ${teamAWon ? "text-court-green" : "text-text-secondary"}`}>
          {match.team_a_score}
        </span>
        <span className="text-text-muted text-xs">–</span>
        <span className={`text-sm font-bold tabular-nums ${!teamAWon ? "text-court-green" : "text-text-secondary"}`}>
          {match.team_b_score}
        </span>
      </div>
      <div className={`flex-1 min-w-0 ${!teamAWon ? "" : "opacity-70"}`}>
        <p className={`text-sm truncate text-right ${!teamAWon ? "font-semibold text-text-primary" : "text-text-secondary"}`}>
          {teamBNames}
        </p>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function SessionDetail({
  session,
  summary,
  awards,
  matches,
  playerNames,
  groupSlug,
}: SessionDetailProps) {
  const completedMatches = matches.filter((m) => m.status === "completed");

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href={`/g/${groupSlug}/history`}
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
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
        </svg>
        History
      </Link>

      {/* Session header */}
      <header>
        <h1 className="text-2xl font-bold text-text-primary">
          {session.title ?? "Game Day"}
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          {formatDate(session.started_at)}
        </p>
      </header>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="flex flex-col items-center rounded-lg border border-border bg-surface-muted px-3 py-3">
          <span className="text-xl font-bold text-text-primary">{summary.gamesPlayed}</span>
          <span className="text-xs text-text-muted mt-0.5">Games</span>
        </div>
        <div className="flex flex-col items-center rounded-lg border border-border bg-surface-muted px-3 py-3">
          <span className="text-xl font-bold text-text-primary">{summary.playerCount}</span>
          <span className="text-xs text-text-muted mt-0.5">Players</span>
        </div>
        <div className="flex flex-col items-center rounded-lg border border-border bg-surface-muted px-3 py-3">
          <span className="text-xl font-bold text-text-primary">
            {formatDuration(summary.durationMinutes)}
          </span>
          <span className="text-xs text-text-muted mt-0.5">Duration</span>
        </div>
      </div>

      {/* Awards */}
      {(awards.mvp || awards.hottestDuo || awards.bestMatch) && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider">
            Awards
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {awards.mvp && <MvpCard mvp={awards.mvp} />}
            {awards.hottestDuo && <HottestDuoCard duo={awards.hottestDuo} />}
            {awards.bestMatch && (
              <BestMatchCard match={awards.bestMatch} playerNames={playerNames} />
            )}
          </div>
        </section>
      )}

      {/* Match list */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider">
          Matches ({completedMatches.length})
        </h2>
        {completedMatches.length === 0 ? (
          <div className="rounded-xl border border-border bg-surface-muted p-6 text-center">
            <p className="text-text-muted text-sm">No completed matches in this session.</p>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-surface px-4">
            {completedMatches.map((match) => (
              <MatchRow key={match.id} match={match} playerNames={playerNames} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
