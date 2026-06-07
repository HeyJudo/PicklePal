import type { LeaderboardEntry, DuoStats, MvpAward } from "@/lib/stats";

interface StatsHighlightsProps {
  readonly topPlayer: LeaderboardEntry | null;
  readonly hottestDuo: DuoStats | null;
  readonly latestMvp: (MvpAward & { readonly sessionTitle: string | null }) | null;
}

export function StatsHighlights({ topPlayer, hottestDuo, latestMvp }: StatsHighlightsProps) {
  return (
    <section aria-label="Stats highlights">
      <div className="flex items-center gap-2 mb-3">
        <SparkleIcon className="w-4 h-4 text-ball-yellow" />
        <h2 className="text-base font-bold text-text-primary tracking-tight">Highlights</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <TopPlayerCard player={topPlayer} />
        <HottestDuoCard duo={hottestDuo} />
        <MvpCard mvp={latestMvp} />
      </div>
    </section>
  );
}

// ─── Win Leader — ball-yellow card ───────────────────────────────────────────

function TopPlayerCard({ player }: { readonly player: LeaderboardEntry | null }) {
  if (!player) {
    return (
      <LockedCard
        icon={<TrophyIcon className="w-6 h-6 text-text-muted" />}
        label="Win Leader"
        message="Play 3+ games to unlock"
      />
    );
  }

  return (
    <div className="fade-rise stagger-1 relative overflow-hidden rounded-xl bg-ball-yellow p-4">
      {/* Decorative ball holes pattern */}
      <div className="absolute top-3 right-3 opacity-15" aria-hidden="true">
        <BallDotsIcon className="w-16 h-16 text-court-green-dark" />
      </div>

      <div className="relative">
        <div className="flex items-center gap-1.5 mb-2">
          <TrophyIcon className="w-4 h-4 text-court-green-dark shrink-0" />
          <span className="text-[11px] font-label font-semibold uppercase tracking-widest text-court-green-dark/70">
            Win Leader
          </span>
        </div>

        {/* Player dot + name */}
        <div className="flex items-center gap-2 mb-2">
          <span
            className="h-2.5 w-2.5 rounded-full shrink-0 ring-2 ring-court-green-dark/20"
            style={{ backgroundColor: player.color ?? "#1E6B3A" }}
            aria-hidden="true"
          />
          <p className="font-bold text-court-green-dark text-base leading-tight truncate">
            {player.displayName}
          </p>
        </div>

        {/* Big Archivo Narrow win% */}
        <div className="flex items-baseline gap-2">
          <span className="font-display text-4xl text-court-green-dark leading-none tabular-nums">
            {(player.winRate * 100).toFixed(0)}
            <span className="text-2xl">%</span>
          </span>
          <span className="text-court-green-dark/60 text-xs tabular-nums">
            {player.wins}W {player.losses}L
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Hottest Duo — hype-orange card ──────────────────────────────────────────

function HottestDuoCard({ duo }: { readonly duo: DuoStats | null }) {
  if (!duo) {
    return (
      <LockedCard
        icon={<FireIcon className="w-6 h-6 text-text-muted" />}
        label="Hottest Duo"
        message="Play 3+ doubles to unlock"
      />
    );
  }

  return (
    <div className="fade-rise stagger-2 relative overflow-hidden rounded-xl bg-hype-orange p-4">
      <div className="absolute top-3 right-3 opacity-15" aria-hidden="true">
        <BallDotsIcon className="w-16 h-16 text-white" />
      </div>

      <div className="relative">
        <div className="flex items-center gap-1.5 mb-2">
          <FireIcon className="w-4 h-4 text-white shrink-0" />
          <span className="text-[11px] font-label font-semibold uppercase tracking-widest text-white/70">
            Hottest Duo
          </span>
        </div>

        <p className="font-bold text-white text-base leading-tight truncate mb-0.5">
          {duo.playerAName}
        </p>
        <p className="text-white/65 text-sm leading-tight truncate mb-2">
          &amp; {duo.playerBName}
        </p>

        <div className="flex items-baseline gap-2">
          <span className="font-display text-4xl text-white leading-none tabular-nums">
            {(duo.winRate * 100).toFixed(0)}
            <span className="text-2xl">%</span>
          </span>
          <span className="text-white/55 text-xs tabular-nums">
            {duo.wins}W {duo.losses}L
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Latest MVP — sky-blue card ───────────────────────────────────────────────

function MvpCard({
  mvp,
}: {
  readonly mvp: (MvpAward & { readonly sessionTitle: string | null }) | null;
}) {
  if (!mvp) {
    return (
      <LockedCard
        icon={<StarIcon className="w-6 h-6 text-text-muted" />}
        label="Latest MVP"
        message="Complete a session to unlock"
      />
    );
  }

  return (
    <div className="fade-rise stagger-3 relative overflow-hidden rounded-xl bg-sky-blue p-4">
      <div className="absolute top-3 right-3 opacity-15" aria-hidden="true">
        <BallDotsIcon className="w-16 h-16 text-white" />
      </div>

      <div className="relative">
        <div className="flex items-center gap-1.5 mb-2">
          <StarIcon className="w-4 h-4 text-white shrink-0" />
          <span className="text-[11px] font-label font-semibold uppercase tracking-widest text-white/70">
            Latest MVP
          </span>
        </div>

        <div className="flex items-center gap-2 mb-2">
          <span
            className="h-2.5 w-2.5 rounded-full shrink-0 ring-2 ring-white/20"
            style={{ backgroundColor: mvp.color ?? "#1565C0" }}
            aria-hidden="true"
          />
          <p className="font-bold text-white text-base leading-tight truncate">
            {mvp.displayName}
          </p>
        </div>

        <div className="flex items-baseline gap-2">
          <span className="font-display text-4xl text-white leading-none tabular-nums">
            {mvp.wins}
            <span className="text-2xl">W</span>
          </span>
          <span className="text-white/55 text-xs tabular-nums">
            {mvp.gamesPlayed} GP
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Locked card ─────────────────────────────────────────────────────────────

function LockedCard({
  icon,
  label,
  message,
}: {
  readonly icon: React.ReactNode;
  readonly label: string;
  readonly message: string;
}) {
  return (
    <div className="rounded-xl bg-surface-muted border border-border-muted p-4 flex flex-col gap-2">
      <div className="flex items-center gap-1.5">
        {icon}
        <span className="text-[11px] font-label font-semibold uppercase tracking-widest text-text-muted">
          {label}
        </span>
      </div>
      <p className="text-sm text-text-muted leading-snug">{message}</p>
    </div>
  );
}

// ─── Icons ───────────────────────────────────────────────────────────────────

function TrophyIcon({ className }: { readonly className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.996.178-1.768.65-2.08 1.377-.312.728-.076 1.566.548 2.308a5.584 5.584 0 003.53 1.985m0 0h.002M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.996.178 1.768.65 2.08 1.377.312.728.076 1.566-.548 2.308a5.584 5.584 0 01-3.53 1.985m0 0h-.002m.002 0c-1.514 1.238-2.48 3.12-2.48 5.228V4.5m0-.264V2.721" />
    </svg>
  );
}

function FireIcon({ className }: { readonly className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.047 8.287 8.287 0 009 9.601a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 00.495-7.468 5.99 5.99 0 00-1.925 3.547 5.975 5.975 0 01-2.133-1.001A3.75 3.75 0 0012 18z" />
    </svg>
  );
}

function StarIcon({ className }: { readonly className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.562.562 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
    </svg>
  );
}

function SparkleIcon({ className }: { readonly className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2l1.5 5.5L19 9l-5.5 1.5L12 16l-1.5-5.5L5 9l5.5-1.5L12 2z" />
    </svg>
  );
}

/* Pickleball ball holes — used as decorative watermark on highlight cards */
function BallDotsIcon({ className }: { readonly className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="currentColor" aria-hidden="true">
      <circle cx="16" cy="16" r="5" />
      <circle cx="32" cy="16" r="5" />
      <circle cx="48" cy="16" r="5" />
      <circle cx="8"  cy="32" r="5" />
      <circle cx="24" cy="32" r="5" />
      <circle cx="40" cy="32" r="5" />
      <circle cx="56" cy="32" r="5" />
      <circle cx="16" cy="48" r="5" />
      <circle cx="32" cy="48" r="5" />
      <circle cx="48" cy="48" r="5" />
    </svg>
  );
}
