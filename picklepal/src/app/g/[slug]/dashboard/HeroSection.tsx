import Link from "next/link";
import type { ActiveSessionInfo } from "../actions";

interface HeroSectionProps {
  readonly groupName: string;
  readonly groupSlug: string;
  readonly activeSession: ActiveSessionInfo | null;
  readonly totalGamesPlayed: number;
  readonly totalSessions: number;
}

export function HeroSection({
  groupName,
  groupSlug,
  activeSession,
  totalGamesPlayed,
  totalSessions,
}: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-court-green via-court-green-dark to-sky-blue-dark p-6 sm:p-8">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10" aria-hidden="true">
        <div className="absolute top-4 right-4 w-32 h-32 rounded-full border-4 border-white" />
        <div className="absolute bottom-4 left-4 w-20 h-20 rounded-full border-2 border-white" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full border border-white" />
      </div>

      <div className="relative z-10">
        {/* Group name & tagline */}
        <div className="mb-4">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {groupName}
          </h1>
          <p className="text-white/70 text-sm sm:text-base mt-1 font-medium">
            Your pickleball crew scoreboard
          </p>
        </div>

        {/* Active session banner OR idle state */}
        {activeSession ? (
          <ActiveSessionBanner
            activeSession={activeSession}
            groupSlug={groupSlug}
          />
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

// ─── Active Session Banner ───────────────────────────────────────────────────

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
      className="group block mt-4 rounded-xl bg-white/15 backdrop-blur-sm border border-white/20 p-4 transition-all duration-200 hover:bg-white/20 cursor-pointer"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Pulsing live indicator */}
          <span className="relative flex h-3 w-3" aria-label="Live">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-hype-orange opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-hype-orange" />
          </span>
          <div>
            <p className="text-white font-bold text-sm sm:text-base">
              Game Day Live
            </p>
            <p className="text-white/70 text-xs sm:text-sm">
              {activeSession.title ?? "Session in progress"}
              {" · "}
              {activeSession.matchesPlayed} match
              {activeSession.matchesPlayed !== 1 ? "es" : ""} played
            </p>
          </div>
        </div>

        {/* Live score or arrow */}
        {activeSession.activeMatch ? (
          <div className="text-right">
            <p className="text-white font-extrabold text-xl tabular-nums">
              {activeSession.activeMatch.teamAScore}
              {" – "}
              {activeSession.activeMatch.teamBScore}
            </p>
            <p className="text-white/60 text-xs">Match in progress</p>
          </div>
        ) : (
          <ArrowRightIcon className="w-5 h-5 text-white/60 group-hover:text-white transition-colors" />
        )}
      </div>
    </Link>
  );
}

// ─── Idle State ──────────────────────────────────────────────────────────────

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
    <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      {/* Quick stats */}
      <div className="flex gap-6">
        <div>
          <p className="text-white font-extrabold text-2xl tabular-nums">
            {totalGamesPlayed}
          </p>
          <p className="text-white/60 text-xs font-medium uppercase tracking-wide">
            Games
          </p>
        </div>
        <div>
          <p className="text-white font-extrabold text-2xl tabular-nums">
            {totalSessions}
          </p>
          <p className="text-white/60 text-xs font-medium uppercase tracking-wide">
            Sessions
          </p>
        </div>
      </div>

      {/* CTA */}
      <Link
        href={`/g/${groupSlug}/live`}
        className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-bold text-court-green-dark shadow-lg transition-all duration-200 hover:bg-ball-yellow hover:text-court-green-dark hover:shadow-xl cursor-pointer"
      >
        <PlayIcon className="w-4 h-4" />
        Start Game Day
      </Link>
    </div>
  );
}

// ─── Inline SVG Icons ────────────────────────────────────────────────────────

function ArrowRightIcon({ className }: { readonly className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
      />
    </svg>
  );
}

function PlayIcon({ className }: { readonly className?: string }) {
  return (
    <svg
      className={className}
      fill="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}
