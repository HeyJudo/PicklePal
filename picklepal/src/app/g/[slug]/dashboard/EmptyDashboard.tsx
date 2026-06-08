import Link from "next/link";
import { Settings, ChevronRight } from "lucide-react";

interface EmptyDashboardProps {
  readonly groupName: string;
  readonly groupSlug: string;
  readonly isAdmin?: boolean;
}

export function EmptyDashboard({ groupName, groupSlug, isAdmin }: EmptyDashboardProps) {
  return (
    <div className="space-y-6">
      {/* Welcome hero — same brand treatment as HeroSection */}
      <section className="relative overflow-hidden rounded-2xl bg-court-green-dark p-8 sm:p-10 text-center">
        <div className="absolute inset-0 court-lines opacity-100" aria-hidden="true" />
        <div
          className="absolute inset-0 bg-gradient-to-br from-court-green-dark via-court-green to-sky-blue-dark opacity-90"
          aria-hidden="true"
        />

        {isAdmin && (
          <Link
            href={`/g/${groupSlug}/settings`}
            className="absolute top-4 right-4 z-20 inline-flex items-center gap-1.5 rounded-full bg-white/15 backdrop-blur-sm px-3 py-1.5 text-xs font-medium text-white border border-white/25 transition-all hover:bg-white/25"
            aria-label="Group settings"
          >
            <Settings className="h-3.5 w-3.5" />
            Settings
          </Link>
        )}

        <div className="relative z-10">
          {/* Paddle icon */}
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/15 backdrop-blur-sm mb-5">
            <PaddleIcon className="w-8 h-8 text-white" />
          </div>

          <h1 className="font-display text-3xl sm:text-4xl text-white leading-tight mb-2">
            Welcome to {groupName}
          </h1>
          <p className="text-white/65 text-sm sm:text-base max-w-md mx-auto leading-relaxed">
            Your crew&apos;s scoreboard is ready. Add players and start your
            first Game Day to unlock stats, rankings, and awards.
          </p>

          {/* Primary CTA */}
          <Link
            href={`/g/${groupSlug}/live`}
            className="inline-flex items-center gap-2 mt-6 rounded-lg bg-white px-6 py-3 text-sm font-bold text-court-green-dark shadow-lg transition-all hover:bg-ball-yellow active:scale-[0.97]"
          >
            Start Game Day
            <ChevronRight className="w-4 h-4 opacity-70" />
          </Link>
        </div>
      </section>

      {/* Getting started steps */}
      <section>
        <h2 className="text-base font-bold text-text-primary tracking-tight mb-4 text-center">
          How it works
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <StepCard
            step={1}
            title="Add your players"
            description="Build your roster so everyone shows up in matchups and stats."
            href={`/g/${groupSlug}/players`}
            linkLabel="Go to Players"
            color="green"
          />
          <StepCard
            step={2}
            title="Start a Game Day"
            description="Select who's playing, generate fair matchups, and score live."
            href={`/g/${groupSlug}/live`}
            linkLabel="Go to Live"
            color="blue"
          />
          <StepCard
            step={3}
            title="Track your crew"
            description="After a few games, leaderboards, awards, and stats unlock automatically."
            href={null}
            linkLabel={null}
            color="gold"
          />
        </div>
      </section>
    </div>
  );
}

// ─── Step Card ────────────────────────────────────────────────────────────────

type StepColor = "green" | "blue" | "gold";

const stepColors: Record<StepColor, { num: string; bg: string; ring: string }> = {
  green: {
    num: "text-white bg-court-green",
    bg: "bg-surface border border-border",
    ring: "ring-court-green/20",
  },
  blue: {
    num: "text-white bg-sky-blue",
    bg: "bg-surface border border-border",
    ring: "ring-sky-blue/20",
  },
  gold: {
    num: "text-court-green-dark bg-ball-yellow",
    bg: "bg-surface border border-border",
    ring: "ring-ball-yellow/20",
  },
};

function StepCard({
  step,
  title,
  description,
  href,
  linkLabel,
  color,
}: {
  readonly step: number;
  readonly title: string;
  readonly description: string;
  readonly href: string | null;
  readonly linkLabel: string | null;
  readonly color: StepColor;
}) {
  const c = stepColors[color];

  return (
    <div
      className={[
        "fade-rise rounded-xl p-4",
        c.bg,
        `stagger-${step}`,
      ].join(" ")}
    >
      {/* Step number */}
      <div
        className={[
          "w-8 h-8 rounded-full flex items-center justify-center mb-3 font-score font-bold text-sm",
          c.num,
        ].join(" ")}
      >
        {step}
      </div>

      <p className="text-sm font-bold text-text-primary leading-tight mb-1">{title}</p>
      <p className="text-xs text-text-secondary leading-snug mb-3">{description}</p>

      {href && linkLabel && (
        <Link
          href={href}
          className="inline-flex items-center gap-1 text-xs font-semibold text-court-green hover:text-court-green-dark transition-colors"
        >
          {linkLabel}
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      )}
    </div>
  );
}

// ─── Icon ─────────────────────────────────────────────────────────────────────

function PaddleIcon({ className }: { readonly className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
      <ellipse cx="12" cy="10" rx="6" ry="7" />
      <line x1="8.5" y1="7" x2="15.5" y2="13" strokeLinecap="round" />
      <line x1="8.5" y1="10" x2="15.5" y2="10" strokeLinecap="round" />
      <line x1="8.5" y1="13" x2="15.5" y2="7" strokeLinecap="round" />
      <rect x="11" y="17" width="2" height="5.5" rx="1" fill="currentColor" stroke="none" />
    </svg>
  );
}
