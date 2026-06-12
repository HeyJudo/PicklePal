"use client";

import Link from "next/link";
import { useState } from "react";
import type { Match, Session } from "@/lib/supabase";
import type { SessionSummary, SessionAwards, MvpAward, HottestDuoAward, BestMatchAward } from "@/lib/stats";
import { OverlayRenderer } from "@/components/share";

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
  const isManual = match.source === "manual";
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
        {isManual && (
          <span className="text-[9px] font-medium text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-1.5 py-0.5">
            Manual
          </span>
        )}
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

// ─── Share Overlay Section ───────────────────────────────────────────────────

function ShareOverlaySection({
  session,
  summary,
  awards,
}: {
  readonly session: Session;
  readonly summary: SessionSummary;
  readonly awards: SessionAwards;
}) {
  const [showOverlay, setShowOverlay] = useState(false);

  if (!showOverlay) {
    return (
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider">
          Share
        </h2>
        <button
          onClick={() => setShowOverlay(true)}
          className="w-full rounded-xl border border-border bg-surface p-4 flex items-center gap-3 hover:bg-surface-muted transition-colors cursor-pointer"
        >
          <div className="w-10 h-10 rounded-full bg-court-green/10 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-court-green" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-text-primary">Download Overlay</p>
            <p className="text-xs text-text-muted">Get a transparent PNG sticker for your IG story</p>
          </div>
        </button>
      </section>
    );
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider">
          Share
        </h2>
        <button
          onClick={() => setShowOverlay(false)}
          className="text-xs text-text-muted hover:text-text-secondary transition-colors cursor-pointer"
        >
          Collapse
        </button>
      </div>
      <div className="rounded-xl border border-border bg-slate-900 p-6">
        <OverlayRenderer
          data={{
            sessionTitle: session.title ?? "Game Day",
            date: new Date(session.started_at).toLocaleDateString(undefined, {
              month: "long",
              day: "numeric",
              year: "numeric",
            }),
            matchCount: summary.gamesPlayed,
            playerCount: summary.playerCount,
            mvpName: awards.mvp?.displayName ?? null,
          }}
        />
      </div>
    </section>
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
  const isBucket = (session as { source?: string }).source === "manual_bucket";
  const sessionDisplayTitle = isBucket ? "Logged matches" : (session.title ?? "Game Day");

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

      {/* Session header — branded hero */}
      <header className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-court-green-dark via-court-green to-sky-blue-dark px-5 py-5 sm:px-6">
        {/* Court lines watermark */}
        <div className="absolute inset-0 opacity-[0.07]" aria-hidden="true">
          <svg viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice" className="w-full h-full" fill="none" stroke="white" strokeWidth="1.5">
            <rect x="20" y="20" width="360" height="160" rx="2" />
            <line x1="200" y1="20" x2="200" y2="180" strokeWidth="2" />
            <line x1="130" y1="20" x2="130" y2="180" strokeDasharray="4 4" />
            <line x1="270" y1="20" x2="270" y2="180" strokeDasharray="4 4" />
            <line x1="20" y1="100" x2="130" y2="100" />
            <line x1="270" y1="100" x2="380" y2="100" />
          </svg>
        </div>

        <div className="relative">
          <p className="text-white/50 text-[11px] font-label font-semibold uppercase tracking-widest mb-1">
            {isBucket ? "Logged Matches" : session.status === "completed" ? "Completed Session" : session.status === "active" ? "Active Session" : "Session"}
          </p>
          <h1 className="font-display text-3xl text-white leading-tight">
            {sessionDisplayTitle}
          </h1>
          <p className="text-white/65 text-sm mt-1">{formatDate(session.started_at)}</p>

          {/* Quick stats row — hide duration for bucket sessions */}
          <div className="flex gap-6 mt-4">
            {[
              { value: String(summary.gamesPlayed), label: "Games" },
              { value: String(summary.playerCount), label: "Players" },
              ...(!isBucket ? [{ value: formatDuration(summary.durationMinutes), label: "Duration" }] : []),
            ].map(({ value, label }) => (
              <div key={label}>
                <p className="font-display text-2xl text-ball-yellow leading-none tabular-nums">{value}</p>
                <p className="text-white/55 text-[10px] font-label font-semibold uppercase tracking-widest mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </header>

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

      {/* Share Overlay */}
      {session.status === "completed" && (
        <ShareOverlaySection
          session={session}
          summary={summary}
          awards={awards}
        />
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
