"use client";

import Link from "next/link";
import { useState } from "react";
import type { Match, Session } from "@/lib/supabase";
import type { SessionSummary, SessionAwards, MvpAward, HottestDuoAward, BestMatchAward, LongestMatchAward } from "@/lib/stats";
import { formatMatchDuration, formatSessionDuration } from "@/lib/format/duration";
import { MvpShareButton, SessionRecapShareButton } from "@/components/share";
import { PlayerAvatar } from "@/components/players";

interface SessionDetailProps {
  readonly session: Session;
  readonly summary: SessionSummary;
  readonly awards: SessionAwards;
  readonly matches: readonly Match[];
  readonly playerNames: Record<string, string>;
  readonly playerColors: Record<string, string | null>;
  readonly playerAvatars: Record<string, string | null>;
  readonly groupSlug: string;
  /** Display name of the group, used in share card. */
  readonly groupName?: string;
}

// ─── Decorative background glyph (large faded "shadow" icon behind card) ──────

const GLYPH_PATHS: Record<string, string> = {
  trophy:
    "M5.166 2.621v.858c-1.035.148-2.059.33-3.071.543a.75.75 0 0 0-.584.859 6.753 6.753 0 0 0 6.138 5.6 6.73 6.73 0 0 0 2.743 1.346A6.707 6.707 0 0 1 9.279 15H8.54c-1.036 0-1.875.84-1.875 1.875V19.5h-.75a2.25 2.25 0 0 0-2.25 2.25c0 .414.336.75.75.75h15a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-2.25-2.25h-.75v-2.625c0-1.036-.84-1.875-1.875-1.875h-.739a6.706 6.706 0 0 1-1.112-3.173 6.73 6.73 0 0 0 2.743-1.347 6.753 6.753 0 0 0 6.139-5.6.75.75 0 0 0-.585-.858 47.077 47.077 0 0 0-3.07-.543V2.62a.75.75 0 0 0-.658-.744 49.22 49.22 0 0 0-6.093-.377c-2.063 0-4.096.128-6.093.377a.75.75 0 0 0-.657.744Zm0 2.629c0 1.196.312 2.32.857 3.294A5.266 5.266 0 0 1 3.16 5.337a45.6 45.6 0 0 1 2.006-.343v.256Zm13.5 0v-.256c.674.1 1.343.214 2.006.343a5.265 5.265 0 0 1-2.863 3.207 6.72 6.72 0 0 0 .857-3.294Z",
  fire:
    "M12.963 2.286a.75.75 0 0 0-1.071-.136 9.742 9.742 0 0 0-3.539 6.176 7.547 7.547 0 0 1-1.705-1.715.75.75 0 0 0-1.152-.082A9 9 0 1 0 15.68 4.534a7.46 7.46 0 0 1-2.717-2.248ZM15.75 14.25a3.75 3.75 0 1 1-7.313-1.172c.628.465 1.35.81 2.133 1a5.99 5.99 0 0 1 1.925-3.547 3.75 3.75 0 0 1 3.255 3.719Z",
  bolt: "M14.615 1.595a.75.75 0 0 1 .359.852L12.982 9.75h7.268a.75.75 0 0 1 .548 1.262l-10.5 11.25a.75.75 0 0 1-1.272-.71l1.992-7.302H3.75a.75.75 0 0 1-.548-1.262l10.5-11.25a.75.75 0 0 1 .913-.143Z",
  clock:
    "M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM12.75 6a.75.75 0 0 0-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 0 0 0-1.5h-3.75V6Z",
};

function CardGlyph({ type }: { readonly type: keyof typeof GLYPH_PATHS }) {
  return (
    <svg
      className="pointer-events-none absolute -bottom-8 -right-6 h-44 w-44 rotate-12 opacity-[0.12]"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d={GLYPH_PATHS[type]} />
    </svg>
  );
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

// ─── Shared avatar helpers ────────────────────────────────────────────────────

/** Two overlapping avatars for a doubles team, colored per-player. */
function TeamAvatars({
  playerIds,
  playerNames,
  playerColors,
  playerAvatars,
  ringClassName = "ring-2 ring-white",
}: {
  readonly playerIds: readonly string[];
  readonly playerNames: Record<string, string>;
  readonly playerColors: Record<string, string | null>;
  readonly playerAvatars: Record<string, string | null>;
  readonly ringClassName?: string;
}) {
  return (
    <div className="flex -space-x-3 shrink-0">
      {playerIds.map((id) => (
        <PlayerAvatar
          key={id}
          displayName={playerNames[id] ?? "Unknown"}
          color={playerColors[id] ?? null}
          avatarUrl={playerAvatars[id] ?? null}
          size="sm"
          className={ringClassName}
        />
      ))}
    </div>
  );
}

// ─── Award Cards (bento grid) ────────────────────────────────────────────────

function MvpCard({
  mvp,
  playerAvatars,
}: {
  readonly mvp: MvpAward;
  readonly playerAvatars: Record<string, string | null>;
}) {
  return (
    <div className="col-span-2 relative overflow-hidden rounded-2xl bg-ball-yellow p-4 sm:p-5 flex flex-col justify-between min-h-[180px] shadow-sm anim-spring-pop delay-200 opacity-0 snappy-hover hover:scale-[1.02] hover:shadow-[0_0_25px_rgba(245,197,24,0.5)] cursor-pointer">
      <div className="absolute inset-0 effect-shimmer pointer-events-none" aria-hidden="true" />
      <div className="text-black"><CardGlyph type="trophy" /></div>
      <div className="relative z-10 flex items-center gap-2 text-black mb-3">
        <span className="text-3xl effect-pulse" aria-hidden="true">🏆</span>
        <span className="font-display text-xl sm:text-2xl uppercase tracking-tight leading-none">MVP of the Day</span>
      </div>
      <div className="relative z-10 flex items-center gap-4 mt-auto">
        <PlayerAvatar
          displayName={mvp.displayName}
          color={mvp.color}
          avatarUrl={playerAvatars[mvp.playerId] ?? null}
          size="xl"
          className="snappy-hover hover:rotate-6 hover:scale-110 shadow-sm shrink-0"
        />
        <div className="min-w-0">
          <div className="font-display text-2xl sm:text-3xl text-black uppercase leading-none mb-1 truncate">
            {mvp.displayName}
          </div>
          <div className="font-score text-black/80 font-bold text-sm sm:text-base uppercase">
            {mvp.wins}W in {mvp.gamesPlayed} games · +{mvp.pointDifferential > 0 ? mvp.pointDifferential : 0} pts
          </div>
        </div>
      </div>
    </div>
  );
}

function HottestDuoCard({
  duo,
  playerColors,
  playerAvatars,
}: {
  readonly duo: HottestDuoAward;
  readonly playerColors: Record<string, string | null>;
  readonly playerAvatars: Record<string, string | null>;
}) {
  return (
    <div className="row-span-2 relative overflow-hidden rounded-2xl bg-hype-orange text-white p-4 flex flex-col min-h-[280px] shadow-sm anim-spring-pop delay-300 opacity-0 snappy-hover hover:scale-[1.02] hover:shadow-[0_0_25px_rgba(255,107,53,0.5)] cursor-pointer">
      <div className="absolute inset-0 effect-shimmer pointer-events-none" style={{ animationDelay: "1s" }} aria-hidden="true" />
      <CardGlyph type="fire" />
      <div className="absolute top-4 right-4 flex -space-x-4 z-10">
        <PlayerAvatar
          displayName={duo.playerAName}
          color={playerColors[duo.playerAId] ?? null}
          avatarUrl={playerAvatars[duo.playerAId] ?? null}
          size="sm"
          className="ring-2 ring-hype-orange snappy-hover hover:z-20 hover:scale-110"
        />
        <PlayerAvatar
          displayName={duo.playerBName}
          color={playerColors[duo.playerBId] ?? null}
          avatarUrl={playerAvatars[duo.playerBId] ?? null}
          size="sm"
          className="ring-2 ring-hype-orange snappy-hover hover:z-20 hover:scale-110"
        />
      </div>
      <div className="relative z-10 flex flex-col items-start mb-2">
        <span className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/25 shadow-sm">
          <span className="text-2xl streak-flame" aria-hidden="true">🔥</span>
        </span>
        <span className="font-display text-xl uppercase tracking-tight leading-none">Hottest Duo</span>
      </div>
      <div className="relative z-10 font-display text-2xl mt-auto mb-2 leading-none uppercase">
        {duo.playerAName} &amp; {duo.playerBName}
      </div>
      <div className="relative z-10 font-score font-bold text-xs uppercase bg-black/20 rounded px-2 py-1 inline-block">
        {duo.wins}W–{duo.losses}L ({formatWinRate(duo.winRate)}) in {duo.gamesPlayed} games together
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
    <div className="relative overflow-hidden rounded-2xl bg-sky-blue text-white p-4 flex flex-col justify-between min-h-[130px] shadow-sm anim-spring-pop delay-400 opacity-0 snappy-hover hover:scale-[1.02] hover:shadow-[0_0_25px_rgba(33,150,243,0.5)] cursor-pointer">
      <div className="absolute inset-0 effect-shimmer pointer-events-none" style={{ animationDelay: "2s" }} aria-hidden="true" />
      <CardGlyph type="bolt" />
      <div className="relative z-10 flex items-center gap-1.5 mb-2">
        <span className="text-lg" aria-hidden="true">⚡</span>
        <span className="font-display text-lg uppercase tracking-tight leading-none">Best Match</span>
      </div>
      <div className="relative z-10">
        <div className="font-display text-3xl mb-1 leading-none">
          {match.teamAScore}–{match.teamBScore}
        </div>
        <div className="font-score font-bold text-[11px] leading-snug uppercase bg-black/20 rounded px-2 py-1 inline-block">
          {teamANames} vs {teamBNames}
        </div>
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
    <div className="relative overflow-hidden rounded-2xl bg-court-green text-white p-4 flex flex-col justify-between min-h-[130px] shadow-sm anim-spring-pop delay-500 opacity-0 snappy-hover hover:scale-[1.02] hover:shadow-[0_0_25px_rgba(45,139,78,0.5)] cursor-pointer">
      <div className="absolute inset-0 effect-shimmer pointer-events-none" style={{ animationDelay: "3s" }} aria-hidden="true" />
      <CardGlyph type="clock" />
      <div className="relative z-10 flex items-center gap-1.5 mb-2">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <path strokeLinecap="round" d="M12 7v5l3 3" />
        </svg>
        <span className="font-display text-lg uppercase tracking-tight leading-none">Marathon</span>
      </div>
      <div className="relative z-10">
        <div className="font-display text-2xl sm:text-3xl mb-1 leading-none">{formatMatchDuration(match.durationSeconds)}</div>
        <div className="font-score font-bold text-[11px] leading-snug uppercase bg-black/20 rounded px-2 py-1 inline-block">
          {match.teamAScore}–{match.teamBScore} · {teamANames} vs {teamBNames}
        </div>
      </div>
    </div>
  );
}

// ─── Match List ──────────────────────────────────────────────────────────────

function MatchRow({
  match,
  playerNames,
  playerColors,
  playerAvatars,
  delayIndex,
}: {
  readonly match: Match;
  readonly playerNames: Record<string, string>;
  readonly playerColors: Record<string, string | null>;
  readonly playerAvatars: Record<string, string | null>;
  readonly delayIndex: number;
}) {
  const teamAWon = match.winning_team === "A";
  const isManual = match.source === "manual";
  const teamANames = match.team_a_player_ids.map((id) => playerNames[id] ?? "Unknown").join(" & ");
  const teamBNames = match.team_b_player_ids.map((id) => playerNames[id] ?? "Unknown").join(" & ");
  const delayClass = `match-delay-${Math.min(delayIndex + 1, 5)}`;

  return (
    <div
      className={`flex items-center justify-between gap-2 p-3 sm:p-4 bg-surface-elevated rounded-2xl shadow-sm anim-slide-up ${delayClass} opacity-0 hover:shadow-md transition-shadow duration-300`}
    >
      <div className={`flex items-center gap-2 sm:gap-3 min-w-0 flex-1 ${teamAWon ? "" : "opacity-60"}`}>
        <TeamAvatars playerIds={match.team_a_player_ids} playerNames={playerNames} playerColors={playerColors} playerAvatars={playerAvatars} />
        <p
          className={`text-xs sm:text-sm truncate leading-tight ${
            teamAWon ? "font-bold text-text-primary" : "text-text-secondary"
          }`}
        >
          {teamANames}
        </p>
      </div>

      <div className="flex flex-col items-center justify-center shrink-0 px-1">
        {isManual && (
          <span
            className="mb-1 inline-flex items-center rounded bg-surface-muted px-1.5 py-0.5 text-[9px] font-label font-black uppercase tracking-widest text-text-muted anim-stretch-tag opacity-0"
            style={{ animationDelay: `${800 + delayIndex * 100}ms` }}
          >
            Manual
          </span>
        )}
        <div className="font-score text-xl sm:text-2xl font-bold flex items-center gap-1.5 tabular-nums">
          <span className={teamAWon ? "text-court-green" : "text-text-secondary"}>{match.team_a_score}</span>
          <span className="text-text-muted text-sm opacity-50">–</span>
          <span className={!teamAWon ? "text-court-green" : "text-text-secondary"}>{match.team_b_score}</span>
        </div>
      </div>

      <div className={`flex items-center justify-end gap-2 sm:gap-3 min-w-0 flex-1 text-right ${!teamAWon ? "" : "opacity-60"}`}>
        <p
          className={`text-xs sm:text-sm truncate leading-tight ${
            !teamAWon ? "font-bold text-text-primary" : "text-text-secondary"
          }`}
        >
          {teamBNames}
        </p>
        <TeamAvatars playerIds={match.team_b_player_ids} playerNames={playerNames} playerColors={playerColors} playerAvatars={playerAvatars} />
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
      <section className="space-y-3 anim-slide-up delay-600 opacity-0">
        <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider">
          Share
        </h2>
        <button
          onClick={() => setShowShare(true)}
          className="w-full rounded-2xl bg-surface-elevated p-4 flex items-center gap-3 text-left relative overflow-hidden group shadow-sm snappy-hover hover:shadow-md hover:-translate-y-0.5 cursor-pointer"
        >
          <div className="absolute inset-0 bg-court-green translate-y-full group-hover:translate-y-0 snappy-hover ease-out z-0" />
          <div className="relative z-10 w-10 h-10 rounded-full bg-court-green/10 flex items-center justify-center flex-shrink-0 group-hover:bg-white/20 snappy-hover">
            <svg className="w-5 h-5 text-court-green group-hover:text-white snappy-hover" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z" />
            </svg>
          </div>
          <div className="relative z-10 text-left">
            <p className="text-sm font-semibold text-text-primary group-hover:text-white snappy-hover">Share Recap</p>
            <p className="text-xs text-text-muted group-hover:text-white/80 snappy-hover">Transparent 9:16 stickers for Instagram and Snapchat stories</p>
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
  playerColors,
  playerAvatars,
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
        className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-secondary snappy-hover transition-colors cursor-pointer anim-slide-up opacity-0"
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
      <header className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-court-green-dark via-court-green to-sky-blue-dark px-5 py-5 sm:px-6 sm:py-6 anim-reveal-hero opacity-0 shadow-md">
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
          <span className="inline-block bg-white/20 text-white font-label text-[10px] font-semibold uppercase tracking-widest mb-2 px-2 py-1 rounded">
            {isBucket ? "Logged Matches" : session.status === "completed" ? "Completed Session" : session.status === "active" ? "Active Session" : "Session"}
          </span>
          <h1 className="font-display text-3xl sm:text-4xl text-white leading-tight uppercase tracking-tight drop-shadow-sm">
            {sessionDisplayTitle}
          </h1>
          <p className="font-score text-white font-bold uppercase text-sm mt-2 inline-block px-2 py-1 bg-black/20 rounded">
            {formatDate(session.started_at)}
          </p>

          {/* Quick stats row — hide duration for bucket sessions */}
          <div className="flex gap-6 mt-4">
            {[
              { value: String(summary.gamesPlayed), label: "Games" },
              { value: String(summary.playerCount), label: "Players" },
              ...(!isBucket ? [{ value: formatDuration(summary.durationMinutes), label: "Duration" }] : []),
            ].map(({ value, label }) => (
              <div key={label}>
                <p className="font-display text-2xl text-ball-yellow leading-none tabular-nums drop-shadow-sm">{value}</p>
                <p className="text-white/55 text-[10px] font-label font-semibold uppercase tracking-widest mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* Awards — bento grid */}
      {(awards.mvp || awards.hottestDuo || awards.bestMatch || awards.longestMatch) && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider anim-slide-up delay-100 opacity-0">
            Awards
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {awards.mvp && <MvpCard mvp={awards.mvp} playerAvatars={playerAvatars} />}
            {awards.hottestDuo && <HottestDuoCard duo={awards.hottestDuo} playerColors={playerColors} playerAvatars={playerAvatars} />}
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
        <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider anim-slide-up delay-600 opacity-0">
          Matches ({completedMatches.length})
        </h2>
        {completedMatches.length === 0 ? (
          <div className="rounded-xl border border-border bg-surface-muted p-6 text-center">
            <p className="text-text-muted text-sm">No completed matches in this session.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {completedMatches.map((match, i) => (
              <MatchRow key={match.id} match={match} playerNames={playerNames} playerColors={playerColors} playerAvatars={playerAvatars} delayIndex={i} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
