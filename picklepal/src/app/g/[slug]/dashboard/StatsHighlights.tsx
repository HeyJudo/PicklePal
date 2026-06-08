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

// ─── Shared card interaction styles ──────────────────────────────────────────

const cardInteraction =
  "transition-all duration-150 hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.97] active:shadow-sm select-none";

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
    <div className={`fade-rise stagger-1 relative overflow-hidden rounded-xl bg-ball-yellow p-4 ${cardInteraction}`}>
      {/* Trophy watermark */}
      <div className="absolute -top-3 -right-3 opacity-15 pointer-events-none" aria-hidden="true">
        <TrophyWatermark className="w-28 h-28 text-court-green-dark" />
      </div>

      <div className="relative">
        <div className="flex items-center gap-1.5 mb-2">
          <TrophyIcon className="w-4 h-4 text-court-green-dark shrink-0" />
          <span className="text-[11px] font-label font-semibold uppercase tracking-widest text-court-green-dark">
            Win Leader
          </span>
        </div>

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
    <div className={`fade-rise stagger-2 relative overflow-hidden rounded-xl bg-hype-orange p-4 ${cardInteraction}`}>
      {/* Fire watermark */}
      <div className="absolute -top-3 -right-3 opacity-15 pointer-events-none" aria-hidden="true">
        <FireWatermark className="w-28 h-28 text-white" />
      </div>

      <div className="relative">
        <div className="flex items-center gap-1.5 mb-2">
          <FireIcon className="w-4 h-4 text-white shrink-0" />
          <span className="text-[11px] font-label font-semibold uppercase tracking-widest text-white/90">
            Hottest Duo
          </span>
        </div>

        <p className="font-bold text-white text-base leading-tight truncate mb-0.5">
          {duo.playerAName}
        </p>
        <p className="text-white text-sm font-medium leading-tight truncate mb-2">
          &amp; {duo.playerBName}
        </p>

        <div className="flex items-baseline gap-2">
          <span className="font-display text-4xl text-white leading-none tabular-nums">
            {(duo.winRate * 100).toFixed(0)}
            <span className="text-2xl">%</span>
          </span>
          <span className="text-white/70 text-xs tabular-nums">
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
    <div className={`fade-rise stagger-3 relative overflow-hidden rounded-xl bg-sky-blue p-4 ${cardInteraction}`}>
      {/* Star watermark */}
      <div className="absolute -top-3 -right-3 opacity-15 pointer-events-none" aria-hidden="true">
        <StarWatermark className="w-28 h-28 text-white" />
      </div>

      <div className="relative">
        <div className="flex items-center gap-1.5 mb-2">
          <StarIcon className="w-4 h-4 text-white shrink-0" />
          <span className="text-[11px] font-label font-semibold uppercase tracking-widest text-white/90">
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
          <span className="text-white/70 text-xs tabular-nums">
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

// ─── Watermark icons (filled, used as background decoration) ─────────────────

function TrophyWatermark({ className }: { readonly className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z" />
    </svg>
  );
}

function FireWatermark({ className }: { readonly className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.36 3.6-1.21 4.62-2.58.39 1.29.59 2.65.59 4.04 0 2.65-2.15 4.8-4.8 4.8z" />
    </svg>
  );
}

function StarWatermark({ className }: { readonly className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
    </svg>
  );
}
