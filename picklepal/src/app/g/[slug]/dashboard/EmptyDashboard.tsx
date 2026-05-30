import Link from "next/link";

interface EmptyDashboardProps {
  readonly groupName: string;
  readonly groupSlug: string;
}

/**
 * Welcoming empty state shown when a group has no matches or sessions yet.
 * Guides the host to add players and start their first Game Day.
 */
export function EmptyDashboard({ groupName, groupSlug }: EmptyDashboardProps) {
  return (
    <div className="space-y-8">
      {/* Welcome hero */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-court-green via-court-green-dark to-sky-blue-dark p-8 sm:p-10 text-center">
        <div className="absolute inset-0 opacity-10" aria-hidden="true">
          <div className="absolute top-6 right-8 w-24 h-24 rounded-full border-4 border-white" />
          <div className="absolute bottom-6 left-8 w-16 h-16 rounded-full border-2 border-white" />
        </div>

        <div className="relative z-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/15 backdrop-blur-sm mb-4">
            <PickleballIcon className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Welcome to {groupName}
          </h1>
          <p className="text-white/70 text-sm sm:text-base mt-2 max-w-md mx-auto">
            Your crew&apos;s pickleball scoreboard is ready. Add your players
            and start your first Game Day to see stats, rankings, and awards
            here.
          </p>
        </div>
      </section>

      {/* Getting started steps */}
      <section className="max-w-lg mx-auto">
        <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-4 text-center">
          Get Started
        </h2>
        <div className="space-y-3">
          <StepCard
            step={1}
            title="Add your players"
            description="Build your roster so everyone shows up in matchups and stats."
            href={`/g/${groupSlug}/players`}
            linkLabel="Go to Players"
          />
          <StepCard
            step={2}
            title="Start a Game Day"
            description="Select who's playing, generate matchups, and score live."
            href={`/g/${groupSlug}/live`}
            linkLabel="Go to Live"
          />
          <StepCard
            step={3}
            title="Track your crew"
            description="After a few games, leaderboards, awards, and stats unlock automatically."
            href={null}
            linkLabel={null}
          />
        </div>
      </section>
    </div>
  );
}

// ─── Step Card ───────────────────────────────────────────────────────────────

function StepCard({
  step,
  title,
  description,
  href,
  linkLabel,
}: {
  readonly step: number;
  readonly title: string;
  readonly description: string;
  readonly href: string | null;
  readonly linkLabel: string | null;
}) {
  return (
    <div className="flex items-start gap-4 rounded-xl border border-border bg-surface p-4 transition-all duration-200 hover:shadow-sm">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-court-green/10 flex items-center justify-center">
        <span className="text-sm font-bold text-court-green">{step}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-text-primary">{title}</p>
        <p className="text-xs text-text-secondary mt-0.5">{description}</p>
        {href && linkLabel && (
          <Link
            href={href}
            className="inline-block text-xs font-medium text-court-green hover:text-court-green-dark mt-2 transition-colors cursor-pointer"
          >
            {linkLabel} →
          </Link>
        )}
      </div>
    </div>
  );
}

// ─── Icon ────────────────────────────────────────────────────────────────────

function PickleballIcon({ className }: { readonly className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <circle cx="9" cy="10" r="1" fill="currentColor" />
      <circle cx="15" cy="10" r="1" fill="currentColor" />
      <circle cx="12" cy="14" r="1" fill="currentColor" />
      <circle cx="9" cy="14" r="1" fill="currentColor" />
      <circle cx="15" cy="14" r="1" fill="currentColor" />
    </svg>
  );
}
