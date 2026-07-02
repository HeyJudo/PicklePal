import type { BeltType } from "@/lib/belts/recomputeBelts";
import { getBeltMeta } from "./BeltBadge";

// ─── Per-belt visual identity ──────────────────────────────────────────────────
// King → gold, Poacher → sky blue, Pickler → red. Each renders as a circular
// medallion: tinted fill + colored ring + centered emoji.

export const BELT_MEDALLION_STYLE: Record<
  BeltType,
  { ring: string; bg: string; countBg: string }
> = {
  king_of_the_kitchen: {
    ring: "border-ball-yellow/70",
    bg: "bg-ball-yellow/20",
    countBg: "bg-ball-yellow text-court-green-dark",
  },
  poacher: {
    ring: "border-sky-blue/60",
    bg: "bg-sky-blue/15",
    countBg: "bg-sky-blue text-white",
  },
  pickler: {
    ring: "border-hype-red/60",
    bg: "bg-hype-red/12",
    countBg: "bg-hype-red text-white",
  },
};

interface BeltMedallionProps {
  readonly beltType: BeltType;
  readonly size?: "sm" | "md";
  /** Pickler may be held multiple times — show a "×N" count bubble when > 1 */
  readonly count?: number;
  /** Tooltip / accessible label. Falls back to the belt label + description. */
  readonly title?: string;
  readonly className?: string;
}

/**
 * Icon-only circular belt medallion for inline use inside leaderboard rows.
 * The King medallion gets a gentle gold ring pulse (disabled under reduced motion
 * via the global `.belt-crown-glow` utility).
 */
export function BeltMedallion({
  beltType,
  size = "md",
  count,
  title,
  className = "",
}: BeltMedallionProps) {
  const meta = getBeltMeta(beltType);
  const style = BELT_MEDALLION_STYLE[beltType];
  const isKing = beltType === "king_of_the_kitchen";

  const sizeClasses = size === "sm" ? "h-6 w-6 text-[13px]" : "h-7 w-7 text-[15px]";
  const label = title ?? `${meta.label} — ${meta.description}`;

  return (
    <span
      className={`relative inline-flex items-center justify-center rounded-full border ${style.ring} ${style.bg} ${sizeClasses} ${isKing ? "belt-crown-glow" : ""} ${className}`}
      title={label}
      role="img"
      aria-label={label}
    >
      <span aria-hidden="true" className="leading-none">
        {meta.emoji}
      </span>
      {count && count > 1 && (
        <span
          className={`absolute -bottom-1 -right-1 min-w-[15px] h-[15px] px-[3px] flex items-center justify-center rounded-full border border-surface ${style.countBg} font-label text-[9px] font-bold leading-none tabular-nums`}
          aria-hidden="true"
        >
          ×{count}
        </span>
      )}
    </span>
  );
}
