"use client";

import Link from "next/link";
import { useState } from "react";
import type { Match, Session } from "@/lib/supabase";
import type { SessionSummary, SessionAwards, MvpAward, HottestDuoAward, BestMatchAward, LongestMatchAward } from "@/lib/stats";
import { formatMatchDuration, formatSessionDuration } from "@/lib/format/duration";
import { MvpShareButton, SessionRecapShareButton } from "@/components/share";

interface SessionDetailProps {
  readonly session: Session;
  readonly summary: SessionSummary;
  readonly awards: SessionAwards;
  readonly matches: readonly Match[];
  readonly playerNames: Record<string, string>;
  readonly groupSlug: string;
  /** Display name of the group, used in share card. */
  readonly groupName?: string;
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
  return formatSessionDuration(minutes);
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

function LongestMatchCard({
  match,
  playerNames,
}: {
  readonly match: LongestMatchAward;
  readonly playerNames: Record<string, string>;
}) {
  const teamANames = match.teamAPlayerIds.map((id) => playerNames[id] ?? "Unknown").join(" & ");
  const teamBNames = match.teamBPlayerIds.map((id) => playerNames[id] ?? "Unknown").join(" & ");

  return (
    <div className="rounded-xl border border-ball-yellow/30 bg-ball-yellow/5 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <svg className="h-4 w-4 text-ball-yellow" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <path strokeLinecap="round" d="M12 7v5l3 3" />
        </svg>
        <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider">
          Marathon Match
        </h3>
      </div>
      <div>
        <p className="font-bold text-text-primary">{formatMatchDuration(match.durationSeconds)}</p>
        <p className="text-xs text-text-secondary">
          {match.teamAScore}–{match.teamBScore} · {teamANames} vs {teamBNames}
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

// ─── Share Recap Section ─────────────────────────────────────────────────────

function ShareRecapSection({
  session,
  summary,
  awards,
  playerNames,
  groupSlug,
  groupName,
}: {
  readonly session: Session;
  readonly summary: SessionSummary;
  readonly awards: SessionAwards;
  readonly playerNames: Record<string, string>;
  readonly groupSlug: string;
  readonly groupName?: string;
}) {
  const [showShare, setShowShare] = useState(false);

  const sessionDate = new Date(session.started_at).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  if (!showShare) {
    return (
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider">
          Share
        </h2>
        <button
          onClick={() => setShowShare(true)}
          className="w-full rounded-xl border border-border bg-surface p-4 flex items-center gap-3 hover:bg-surface-muted transition-colors cursor-pointer"
        >
          <div className="w-10 h-10 rounded-full bg-court-green/10 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-court-green" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z" />
            </svg>
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-text-primary">Share Recap</p>
            <p className="text-xs text-text-muted">Transparent 9:16 stickers for Instagram and Snapchat stories</p>
          </div>
        </button>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider">
          Share
        </h2>
        <button
          onClick={() => setShowShare(false)}
          className="text-xs text-text-muted hover:text-text-secondary transition-colors cursor-pointer"
        >
          Collapse
        </button>
      </div>

      {/* One global helper line — no repetition per card */}
      <p className="text-xs text-text-muted">Transparent 9:16 stickers - layer over any photo in your story.</p>

      {/* Cards side-by-side on sm+, stacked on mobile */}
      <div className="flex flex-col sm:flex-row items-start gap-4">
        {/* MVP card — only when MVP data is available */}
        {awards.mvp && (
          <div className="flex flex-col items-center gap-2 flex-1 min-w-0 rounded-xl border border-border bg-slate-900 p-4">
            <p className="text-[10px] font-semibold text-ball-yellow/70 uppercase tracking-widest self-start">MVP</p>
            <MvpShareButton mvp={awards.mvp} date={sessionDate} />
          </div>
        )}

        {/* Recap card */}
        <div className="flex flex-col items-center gap-2 flex-1 min-w-0 rounded-xl border border-border bg-slate-900 p-4">
          <p className="text-[10px] font-semibold text-white/40 uppercase tracking-widest self-start">Recap</p>
          <SessionRecapShareButton
            groupName={groupName ?? groupSlug}
            date={sessionDate}
            awards={awards}
            gamesPlayed={summary.gamesPlayed}
            playerCount={summary.playerCount}
            durationMinutes={summary.durationMinutes ?? null}
            playerNames={playerNames}
          />
        </div>
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
  groupName,
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
      {(awards.mvp || awards.hottestDuo || awards.bestMatch || awards.longestMatch) && (
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
            {awards.longestMatch && (
              <LongestMatchCard match={awards.longestMatch} playerNames={playerNames} />
            )}
          </div>
        </section>
      )}

      {/* Share Recap */}
      {session.status === "completed" && (
        <ShareRecapSection
          session={session}
          summary={summary}
          awards={awards}
          playerNames={playerNames}
          groupSlug={groupSlug}
          groupName={groupName}
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
