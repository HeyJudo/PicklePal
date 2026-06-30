import { getBeltHistory } from "./actions";
import type { BeltSection, ReignView } from "./actions";
import { BeltMedallion } from "@/components/belts/BeltMedallion";
import { getBeltMeta } from "@/components/belts/BeltBadge";
import { PlayerAvatar } from "@/components/players/PlayerAvatar";
import { formatReignDuration } from "@/lib/belts/formatReignDuration";
import type { BeltType } from "@/lib/belts/recomputeBelts";

interface BeltsPageProps {
  readonly params: Promise<{ slug: string }>;
}

// ─── Per-belt visual identity ──────────────────────────────────────────────────

const BELT_ACCENT: Record<
  BeltType,
  {
    cardBg: string;
    cardBorder: string;
    leftBar: string;
    nameColor: string;
    tagBg: string;
    tagText: string;
    avatarRing: string;
    watermarkColor: string;
  }
> = {
  king_of_the_kitchen: {
    cardBg: "bg-ball-yellow/8",
    cardBorder: "border-ball-yellow/40",
    leftBar: "bg-ball-yellow",
    nameColor: "text-court-green-dark",
    tagBg: "bg-ball-yellow",
    tagText: "text-court-green-dark",
    avatarRing: "ring-2 ring-ball-yellow/70",
    watermarkColor: "text-ball-yellow",
  },
  poacher: {
    cardBg: "bg-sky-blue/8",
    cardBorder: "border-sky-blue/40",
    leftBar: "bg-sky-blue",
    nameColor: "text-sky-blue-dark",
    tagBg: "bg-sky-blue",
    tagText: "text-white",
    avatarRing: "ring-2 ring-sky-blue/60",
    watermarkColor: "text-sky-blue",
  },
  pickler: {
    cardBg: "bg-hype-red/8",
    cardBorder: "border-hype-red/40",
    leftBar: "bg-hype-red",
    nameColor: "text-hype-red",
    tagBg: "bg-hype-red",
    tagText: "text-white",
    avatarRing: "ring-2 ring-hype-red/60",
    watermarkColor: "text-hype-red",
  },
};

// ─── Duration parsing (for hero number display) ────────────────────────────────

interface ParsedDuration {
  value: string;
  unit: string;
}

function parseDuration(ms: number): ParsedDuration {
  const MINUTE = 60_000;
  const HOUR = 60 * MINUTE;
  const DAY = 24 * HOUR;
  const WEEK = 7 * DAY;
  const MONTH = 30 * DAY;
  const EIGHT_WEEKS = 8 * WEEK;

  if (!Number.isFinite(ms) || ms < HOUR) return { value: "NEW", unit: "<1 DAY" };
  if (ms < DAY) return { value: `${Math.floor(ms / HOUR)}`, unit: "HRS" };
  if (ms < WEEK) return { value: `${Math.floor(ms / DAY)}`, unit: ms < 2 * DAY ? "DAY" : "DAYS" };
  if (ms < EIGHT_WEEKS) return { value: `${Math.floor(ms / WEEK)}`, unit: ms < 2 * WEEK ? "WEEK" : "WEEKS" };
  return { value: `${Math.floor(ms / MONTH)}`, unit: ms < 2 * MONTH ? "MO" : "MOS" };
}

// ─── Date helpers ──────────────────────────────────────────────────────────────

function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatDateRange(startedAt: string, endedAt: string | null): string {
  const start = formatShortDate(startedAt);
  return endedAt ? `${start} - ${formatShortDate(endedAt)}` : `Since ${start}`;
}

// ─── Context line builders ─────────────────────────────────────────────────────

function KingContextLine({ reign }: { readonly reign: ReignView }) {
  const streak = (reign.context as { streak?: number } | null)?.streak;
  if (!streak) return null;
  return (
    <p className="text-sm text-text-secondary mt-0.5 font-medium">
      <span aria-hidden="true">🔥</span> {streak}-win streak
    </p>
  );
}

function PoacherContextLine() {
  return (
    <p className="text-sm text-text-secondary mt-0.5 font-medium">
      Dethroned the #1 ranked player
    </p>
  );
}

function PicklerContextLine({ reign }: { readonly reign: ReignView }) {
  const ctx = reign.context as { wins?: number; losses?: number; winRate?: number } | null;
  const wins = ctx?.wins ?? 0;
  const losses = ctx?.losses ?? 0;
  const winRate = ctx?.winRate != null ? Math.round(ctx.winRate * 100) : null;
  const subject = reign.subjectName ?? "opponent";

  return (
    <p className="text-sm text-text-secondary mt-0.5 font-medium">
      owns {subject} · {wins}-{losses}{winRate != null ? ` (${winRate}%)` : ""}
    </p>
  );
}

function ContextLine({ reign }: { readonly reign: ReignView }) {
  if (reign.beltType === "king_of_the_kitchen") return <KingContextLine reign={reign} />;
  if (reign.beltType === "poacher") return <PoacherContextLine />;
  if (reign.beltType === "pickler") return <PicklerContextLine reign={reign} />;
  return null;
}

// ─── Belt watermark emoji map ──────────────────────────────────────────────────

const BELT_EMOJI: Record<BeltType, string> = {
  king_of_the_kitchen: "👑",
  poacher: "🐍",
  pickler: "⚔️",
};

// ─── Champion card ─────────────────────────────────────────────────────────────

function ChampionCard({
  reign,
  staggerClass = "",
}: {
  readonly reign: ReignView;
  readonly staggerClass?: string;
}) {
  const accent = BELT_ACCENT[reign.beltType];
  const isKing = reign.beltType === "king_of_the_kitchen";
  const duration = parseDuration(reign.durationMs);

  return (
    <div
      className={[
        "relative rounded-2xl border overflow-hidden",
        "fade-rise",
        staggerClass,
        accent.cardBorder,
        accent.cardBg,
        "hover:-translate-y-0.5 transition-transform duration-200",
        isKing ? "belt-crown-glow" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {/* Belt accent left bar */}
      <div className={`absolute inset-y-0 left-0 w-1 ${accent.leftBar}`} aria-hidden="true" />

      {/* Faded belt emoji watermark */}
      <div
        className={`absolute top-2 right-3 text-5xl opacity-[0.07] pointer-events-none select-none leading-none ${accent.watermarkColor}`}
        aria-hidden="true"
      >
        {BELT_EMOJI[reign.beltType]}
      </div>

      <div className="pl-5 pr-4 py-4 flex items-center gap-4 max-w-2xl">
        {/* Avatar with belt-colored ring */}
        <div className="shrink-0">
          <PlayerAvatar
            displayName={reign.holderName}
            color={reign.holderColor}
            avatarUrl={reign.holderAvatarUrl}
            size="lg"
            className={accent.avatarRing}
          />
        </div>

        {/* Middle: name + context + date */}
        <div className="flex-1 min-w-0">
          {/* CURRENT pill with pulse dot */}
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 font-label text-[10px] font-bold uppercase tracking-widest ${accent.tagBg} ${accent.tagText}`}
            >
              <span className="relative flex h-1.5 w-1.5" aria-hidden="true">
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isKing ? "bg-court-green-dark" : "bg-white"}`}
                />
                <span
                  className={`relative inline-flex h-1.5 w-1.5 rounded-full ${isKing ? "bg-court-green-dark" : "bg-white"}`}
                />
              </span>
              Current
            </span>
          </div>

          <p className={`font-semibold text-base leading-tight truncate ${accent.nameColor}`}>
            {reign.holderName}
          </p>
          <ContextLine reign={reign} />
          <p className="text-[11px] font-label text-text-muted mt-1 uppercase tracking-wide">
            {formatDateRange(reign.startedAt, reign.endedAt)}
          </p>
        </div>

        {/* Right: hero duration number */}
        <div className="shrink-0 text-right pl-2 border-l border-border-muted ml-1">
          {duration.value === "NEW" ? (
            <>
              <p className="font-display text-2xl text-text-primary leading-none">NEW</p>
              <p className="font-label text-[10px] uppercase tracking-widest text-text-muted mt-1">
                {duration.unit}
              </p>
            </>
          ) : (
            <>
              <p className="font-display text-3xl text-text-primary leading-none tabular-nums">
                {duration.value}
              </p>
              <p className="font-label text-[10px] uppercase tracking-widest text-text-muted mt-1">
                {duration.unit}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Past reign row ────────────────────────────────────────────────────────────

function PastReignRow({ reign, beltType }: { readonly reign: ReignView; readonly beltType: BeltType }) {
  const accent = BELT_ACCENT[beltType];
  return (
    <li className="flex items-center gap-3 py-2.5 border-b border-border-muted last:border-0">
      {/* Accent dot */}
      <span className={`h-1.5 w-1.5 rounded-full shrink-0 opacity-50 ${accent.leftBar}`} aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-text-primary truncate">{reign.holderName}</p>
        <p className="text-[11px] font-label text-text-muted uppercase tracking-wide">
          {formatDateRange(reign.startedAt, reign.endedAt)}
        </p>
      </div>
      <span className="font-score text-sm font-bold tabular-nums text-text-secondary shrink-0">
        {formatReignDuration(reign.durationMs)}
      </span>
    </li>
  );
}

// ─── Belt section block ────────────────────────────────────────────────────────

function BeltSectionBlock({
  section,
  sectionIndex,
}: {
  readonly section: BeltSection;
  readonly sectionIndex: number;
}) {
  const meta = getBeltMeta(section.beltType);
  const accent = BELT_ACCENT[section.beltType];
  const hasAny = section.current.length > 0 || section.past.length > 0;
  const staggerClasses = ["stagger-1", "stagger-2", "stagger-3"] as const;
  const sectionStagger = staggerClasses[sectionIndex] ?? "stagger-3";

  return (
    <section className={`space-y-4 fade-rise ${sectionStagger}`}>
      {/* Section header */}
      <div className="flex items-start gap-3">
        <BeltMedallion beltType={section.beltType} size="md" className="mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className={`text-base font-semibold leading-tight ${accent.nameColor}`}>
                {meta.label}
              </h2>
              <p className="text-xs text-text-muted mt-0.5 leading-snug">{meta.description}</p>
            </div>
            {section.longest && (
              <div className="shrink-0 text-right">
                <p className="font-label text-[10px] uppercase tracking-widest text-text-muted">
                  Longest reign
                </p>
                <p className="text-xs font-semibold text-text-secondary mt-0.5">
                  {section.longest.holderName} · {formatReignDuration(section.longest.durationMs)}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      {!hasAny ? (
        <div className="rounded-2xl border border-border bg-surface-muted p-6 text-center">
          <p className="text-sm text-text-muted">No reigns yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {section.current.map((reign, i) => (
            <ChampionCard
              key={reign.id}
              reign={reign}
              staggerClass={staggerClasses[i] ?? "stagger-3"}
            />
          ))}

          {section.past.length > 0 && (
            <div className="rounded-xl border border-border bg-surface px-4 pt-3 pb-1">
              <p className="font-label text-[10px] font-semibold uppercase tracking-widest text-text-muted mb-1">
                Past reigns
              </p>
              <ul>
                {section.past.map((reign) => (
                  <PastReignRow key={reign.id} reign={reign} beltType={section.beltType} />
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default async function BeltsPage({ params }: BeltsPageProps) {
  const { slug } = await params;
  const history = await getBeltHistory(slug);

  return (
    <div className="space-y-6">
      {/* Branded hero header */}
      <header className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-court-green-dark to-court-green px-5 pt-6 pb-5 sm:px-6">
        {/* Court lines texture */}
        <div className="absolute inset-0 court-lines opacity-30 pointer-events-none" aria-hidden="true" />

        {/* Crown watermark */}
        <div
          className="absolute -right-4 -top-4 opacity-10 pointer-events-none"
          aria-hidden="true"
        >
          <svg className="w-36 h-36 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .55-.45 1-1 1H6c-.55 0-1-.45-1-1v-1h14v1z" />
          </svg>
        </div>

        <div className="relative flex items-end justify-between gap-4">
          <div>
            <p className="text-white/55 text-[11px] font-label font-semibold uppercase tracking-widest mb-1">
              Belts
            </p>
            <h1 className="font-display text-3xl text-white leading-tight">Hall of Fame</h1>
            <p className="text-white/65 text-sm mt-1">Every belt reign, immortalized.</p>
          </div>
          {history.totalReigns > 0 && (
            <div className="text-right shrink-0">
              <p className="font-display text-4xl text-ball-yellow leading-none tabular-nums">
                {history.totalReigns}
              </p>
              <p className="text-white/55 text-[10px] mt-1 font-label font-semibold uppercase tracking-widest">
                {history.totalReigns === 1 ? "Reign" : "Reigns"}
              </p>
            </div>
          )}
        </div>
      </header>

      {history.totalReigns === 0 ? (
        <div className="rounded-2xl border border-border bg-surface-muted p-10 text-center">
          <p className="text-4xl mb-3" aria-hidden="true">
            🏆
          </p>
          <p className="text-text-primary font-semibold">No titles won yet</p>
          <p className="text-text-muted text-sm mt-1">
            Play some matches - belts will start changing hands and show up here.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {history.sections.map((section, i) => (
            <BeltSectionBlock key={section.beltType} section={section} sectionIndex={i} />
          ))}
        </div>
      )}
    </div>
  );
}
