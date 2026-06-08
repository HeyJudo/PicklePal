import Link from "next/link";
import { Settings, ChevronRight, Play } from "lucide-react";
import type { ActiveSessionInfo } from "../actions";

interface HeroSectionProps {
  readonly groupName: string;
  readonly groupSlug: string;
  readonly activeSession: ActiveSessionInfo | null;
  readonly totalGamesPlayed: number;
  readonly totalSessions: number;
  readonly isAdmin?: boolean;
}

export function HeroSection({
  groupName,
  groupSlug,
  activeSession,
  totalGamesPlayed,
  totalSessions,
  isAdmin,
}: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden rounded-2xl bg-court-green-dark p-6 sm:p-8 min-h-[200px]">
      {/* Real pickleball court SVG — brand-specific, not generic grid */}
      <CourtSvgBackground />

      {/* Gradient overlay — keeps text readable over the court */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-court-green-dark/95 via-court-green/80 to-sky-blue-dark/70"
        aria-hidden="true"
      />

      <div className="relative z-10">
        {/* Top row */}
        <div className="flex items-start justify-between gap-3 mb-5">
          <div>
            <p className="text-white/50 text-[11px] font-label font-semibold uppercase tracking-widest mb-1">
              DinkDay
            </p>
            {/* Anton — display font for the group name */}
            <h1 className="font-display text-3xl sm:text-4xl text-white leading-tight">
              {groupName}
            </h1>
          </div>

          {isAdmin && (
            <Link
              href={`/g/${groupSlug}/settings`}
              className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-white/15 backdrop-blur-sm px-3 py-1.5 text-xs font-medium text-white border border-white/25 transition-all hover:bg-white/25"
              aria-label="Group settings"
            >
              <Settings className="h-3.5 w-3.5" />
              Settings
            </Link>
          )}
        </div>

        {activeSession ? (
          <ActiveSessionBanner activeSession={activeSession} groupSlug={groupSlug} />
        ) : (
          <IdleState
            groupSlug={groupSlug}
            totalGamesPlayed={totalGamesPlayed}
            totalSessions={totalSessions}
          />
        )}
      </div>
    </section>
  );
}

// ─── Pickleball court SVG background ─────────────────────────────────────────
// Top-down view: baselines, sidelines, NVZ (kitchen) lines, center line.
// Simplified for decorative use — proportions evoke the court.

function CourtSvgBackground() {
  return (
    <div className="absolute inset-0 opacity-25" aria-hidden="true">
      <svg
        viewBox="0 0 400 200"
        preserveAspectRatio="xMidYMid slice"
        className="w-full h-full"
        fill="none"
        stroke="white"
        strokeWidth="1.5"
      >
        {/* Outer court boundary */}
        <rect x="20" y="20" width="360" height="160" rx="2" />

        {/* Center line (net) */}
        <line x1="200" y1="20" x2="200" y2="180" strokeWidth="2" />

        {/* NVZ / Kitchen lines — 7ft from net each side */}
        <line x1="130" y1="20" x2="130" y2="180" strokeDasharray="4 4" />
        <line x1="270" y1="20" x2="270" y2="180" strokeDasharray="4 4" />

        {/* Center service lines (horizontal) */}
        <line x1="20" y1="100" x2="130" y2="100" />
        <line x1="270" y1="100" x2="380" y2="100" />

        {/* Pickleball (ball) — top right decorative */}
        <circle cx="350" cy="50" r="18" strokeWidth="1.5" />
        <circle cx="344" cy="46" r="2.5" fill="white" stroke="none" />
        <circle cx="356" cy="46" r="2.5" fill="white" stroke="none" />
        <circle cx="344" cy="54" r="2.5" fill="white" stroke="none" />
        <circle cx="356" cy="54" r="2.5" fill="white" stroke="none" />
        <circle cx="350" cy="50" r="2.5" fill="white" stroke="none" />
      </svg>
    </div>
  );
}

// ─── Active Session Banner ────────────────────────────────────────────────────

function ActiveSessionBanner({
  activeSession,
  groupSlug,
}: {
  readonly activeSession: ActiveSessionInfo;
  readonly groupSlug: string;
}) {
  return (
    <Link
      href={`/g/${groupSlug}/live`}
      className="group block rounded-xl bg-white/12 backdrop-blur-sm border border-white/20 p-4 transition-all hover:bg-white/18"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className="relative flex h-3 w-3 shrink-0" aria-label="Live">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-hype-orange opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-hype-orange" />
          </span>
          <div className="min-w-0">
            <p className="text-white font-bold text-sm leading-tight">Game Day Live</p>
            <p className="text-white/60 text-xs mt-0.5 truncate">
              {activeSession.title ?? "Session in progress"}
              {" · "}
              {activeSession.matchesPlayed} match
              {activeSession.matchesPlayed !== 1 ? "es" : ""} played
            </p>
          </div>
        </div>

        {activeSession.activeMatch ? (
          <div className="text-right shrink-0">
            {/* Anton for live match score */}
            <p className="font-display text-white text-3xl leading-none tabular-nums">
              {activeSession.activeMatch.teamAScore}
              <span className="text-white/35 text-xl mx-1">-</span>
              {activeSession.activeMatch.teamBScore}
            </p>
            <p className="text-white/50 text-[10px] mt-1">in progress</p>
          </div>
        ) : (
          <ChevronRight className="w-5 h-5 text-white/50 group-hover:text-white transition-colors shrink-0" />
        )}
      </div>
    </Link>
  );
}

// ─── Idle State ───────────────────────────────────────────────────────────────

function IdleState({
  groupSlug,
  totalGamesPlayed,
  totalSessions,
}: {
  readonly groupSlug: string;
  readonly totalGamesPlayed: number;
  readonly totalSessions: number;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5">
      {/* Quick stats — Anton numbers */}
      <div className="flex gap-8">
        <div>
          <p className="font-display text-white text-4xl leading-none tabular-nums">
            {totalGamesPlayed}
          </p>
          <p className="text-white/55 text-[11px] font-label font-semibold uppercase tracking-widest mt-1.5">
            Games
          </p>
        </div>
        <div>
          <p className="font-display text-white text-4xl leading-none tabular-nums">
            {totalSessions}
          </p>
          <p className="text-white/55 text-[11px] font-label font-semibold uppercase tracking-widest mt-1.5">
            Sessions
          </p>
        </div>
      </div>

      {/* CTA */}
      <Link
        href={`/g/${groupSlug}/live`}
        className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-bold text-court-green-dark shadow-lg transition-all hover:bg-ball-yellow active:scale-[0.97] w-fit"
      >
        <Play className="w-4 h-4" fill="currentColor" />
        Start Game Day
        <ChevronRight className="w-4 h-4 opacity-70" />
      </Link>
    </div>
  );
}
