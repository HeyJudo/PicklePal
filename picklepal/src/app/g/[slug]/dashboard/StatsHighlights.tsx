import type { LeaderboardEntry, DuoStats } from "@/lib/stats";
import type { MvpAward } from "@/lib/stats";

interface StatsHighlightsProps {
  readonly topPlayer: LeaderboardEntry | null;
  readonly hottestDuo: DuoStats | null;
  readonly latestMvp: (MvpAward & { readonly sessionTitle: string | null }) | null;
}

export function StatsHighlights({
  topPlayer,
  hottestDuo,
  latestMvp,
}: StatsHighlightsProps) {
  return (
    <section aria-label="Stats highlights">
      <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-3">
        Highlights
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <TopPlayerCard player={topPlayer} />
        <HottestDuoCard duo={hottestDuo} />
        <MvpCard mvp={latestMvp} />
      </div>
    </section>
  );
}

// ─── #1 Player Card ──────────────────────────────────────────────────────────

function TopPlayerCard({
  player,
}: {
  readonly player: LeaderboardEntry | null;
}) {
  if (!player) {
    return (
      <EmptyCard
        icon={<TrophyIcon className="w-6 h-6 text-ball-yellow" />}
        title="#1 Player"
        message="Play 3+ games to unlock"
      />
    );
  }

  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-surface p-4 transition-all duration-200 hover:shadow-md hover:border-ball-yellow/40 cursor-default">
      {/* Accent stripe */}
      <div
        className="absolute top-0 left-0 w-1 h-full rounded-l-xl"
        style={{ backgroundColor: player.color ?? "#F5C518" }}
      />

      <div className="flex items-start gap-3 pl-2">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-ball-yellow/10 flex items-center justify-center">
          <TrophyIcon className="w-5 h-5 text-ball-yellow" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-text-muted uppercase tracking-wide">
            #1 Player
          </p>
          <p className="text-base font-bold text-text-primary truncate mt-0.5">
            {player.displayName}
          </p>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-sm font-semibold text-court-green tabular-nums">
              {(player.winRate * 100).toFixed(0)}%
            </span>
            <span className="text-xs text-text-muted">
              {player.wins}W – {player.losses}L
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Hottest Duo Card ────────────────────────────────────────────────────────

function HottestDuoCard({ duo }: { readonly duo: DuoStats | null }) {
  if (!duo) {
    return (
      <EmptyCard
        icon={<FireIcon className="w-6 h-6 text-hype-orange" />}
        title="Hottest Duo"
        message="Play 3+ doubles to unlock"
      />
    );
  }

  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-surface p-4 transition-all duration-200 hover:shadow-md hover:border-hype-orange/40 cursor-default">
      {/* Accent stripe */}
      <div className="absolute top-0 left-0 w-1 h-full rounded-l-xl bg-hype-orange" />

      <div className="flex items-start gap-3 pl-2">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-hype-orange/10 flex items-center justify-center">
          <FireIcon className="w-5 h-5 text-hype-orange" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-text-muted uppercase tracking-wide">
            Hottest Duo
          </p>
          <p className="text-base font-bold text-text-primary truncate mt-0.5">
            {duo.playerAName}
          </p>
          <p className="text-sm text-text-secondary truncate -mt-0.5">
            &amp; {duo.playerBName}
          </p>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-sm font-semibold text-hype-orange tabular-nums">
              {(duo.winRate * 100).toFixed(0)}%
            </span>
            <span className="text-xs text-text-muted">
              {duo.wins}W – {duo.losses}L together
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── MVP Card ────────────────────────────────────────────────────────────────

function MvpCard({
  mvp,
}: {
  readonly mvp: (MvpAward & { readonly sessionTitle: string | null }) | null;
}) {
  if (!mvp) {
    return (
      <EmptyCard
        icon={<StarIcon className="w-6 h-6 text-sky-blue" />}
        title="Latest MVP"
        message="Complete a session to unlock"
      />
    );
  }

  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-surface p-4 transition-all duration-200 hover:shadow-md hover:border-sky-blue/40 cursor-default">
      {/* Accent stripe */}
      <div
        className="absolute top-0 left-0 w-1 h-full rounded-l-xl"
        style={{ backgroundColor: mvp.color ?? "#2196F3" }}
      />

      <div className="flex items-start gap-3 pl-2">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-sky-blue/10 flex items-center justify-center">
          <StarIcon className="w-5 h-5 text-sky-blue" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-text-muted uppercase tracking-wide">
            Latest MVP
          </p>
          <p className="text-base font-bold text-text-primary truncate mt-0.5">
            {mvp.displayName}
          </p>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-sm font-semibold text-sky-blue tabular-nums">
              {mvp.score} pts
            </span>
            <span className="text-xs text-text-muted truncate">
              {mvp.wins}W · {mvp.gamesPlayed} GP
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Empty State Card ────────────────────────────────────────────────────────

function EmptyCard({
  icon,
  title,
  message,
}: {
  readonly icon: React.ReactNode;
  readonly title: string;
  readonly message: string;
}) {
  return (
    <div className="rounded-xl border border-border-muted bg-surface-muted p-4 cursor-default">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-surface flex items-center justify-center border border-border-muted">
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-text-muted uppercase tracking-wide">
            {title}
          </p>
          <p className="text-sm text-text-muted mt-1">{message}</p>
        </div>
      </div>
    </div>
  );
}

// ─── SVG Icons ───────────────────────────────────────────────────────────────

function TrophyIcon({ className }: { readonly className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.996.178-1.768.65-2.08 1.377-.312.728-.076 1.566.548 2.308a5.584 5.584 0 003.53 1.985m0 0h.002M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.996.178 1.768.65 2.08 1.377.312.728.076 1.566-.548 2.308a5.584 5.584 0 01-3.53 1.985m0 0h-.002m.002 0c-1.514 1.238-2.48 3.12-2.48 5.228V4.5m0-.264V2.721"
      />
    </svg>
  );
}

function FireIcon({ className }: { readonly className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.047 8.287 8.287 0 009 9.601a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 18a3.75 3.75 0 00.495-7.468 5.99 5.99 0 00-1.925 3.547 5.975 5.975 0 01-2.133-1.001A3.75 3.75 0 0012 18z"
      />
    </svg>
  );
}

function StarIcon({ className }: { readonly className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.562.562 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
      />
    </svg>
  );
}
