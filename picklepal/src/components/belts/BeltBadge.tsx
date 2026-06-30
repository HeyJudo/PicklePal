import type { BeltType } from "@/lib/belts/recomputeBelts";

// ─── Belt metadata ────────────────────────────────────────────────────────────

const BELT_META: Record<BeltType, { emoji: string; label: string; description: string }> = {
  king_of_the_kitchen: {
    emoji: "👑",
    label: "King of the Kitchen",
    description: "Longest active win streak",
  },
  poacher: {
    emoji: "🐍",
    label: "The Poacher",
    description: "Most recently beat the #1 ranked player",
  },
  pickler: {
    emoji: "⚔️",
    label: "The Pickler",
    description: "Owns a head-to-head rivalry (4+ games, 70%+ wins)",
  },
};

export function getBeltMeta(beltType: BeltType) {
  return BELT_META[beltType];
}

// Per-belt label tint, matching the medallion identity (gold / sky / red).
const LABEL_COLOR: Record<BeltType, string> = {
  king_of_the_kitchen: "text-court-green-dark",
  poacher: "text-sky-blue-dark",
  pickler: "text-hype-red",
};

// ─── BeltBadge component ──────────────────────────────────────────────────────

interface BeltBadgeProps {
  readonly beltType: BeltType;
  /** Optional player name(s) to show alongside the belt */
  readonly holderNames?: readonly string[];
  /**
   * Pickler only: the name of the dominated opponent.
   * When provided, renders "Holder owns Subject" after the belt label.
   */
  readonly subjectName?: string | null;
  /** Visual size variant */
  readonly size?: "sm" | "md" | "lg";
  readonly className?: string;
}

/**
 * Labeled belt pill (emoji + name). Used mainly inside the legend.
 * Belt text uses the body font (Outfit), never the heavy Anton display font.
 */
export function BeltBadge({
  beltType,
  holderNames,
  subjectName,
  size = "md",
  className = "",
}: BeltBadgeProps) {
  const meta = getBeltMeta(beltType);

  const sizeClasses = {
    sm: "px-2 py-1 text-[11px] gap-1",
    md: "px-3 py-1.5 text-xs gap-1.5",
    lg: "px-4 py-2 text-sm gap-2",
  }[size];

  const emojiSizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  }[size];

  return (
    <div
      className={`inline-flex items-center rounded-full border border-ball-yellow/40 bg-ball-yellow/10 ${sizeClasses} ${className}`}
      title={meta.description}
    >
      <span className={emojiSizeClasses} aria-hidden="true">
        {meta.emoji}
      </span>
      <span className={`font-semibold leading-none ${LABEL_COLOR[beltType]}`}>{meta.label}</span>
      {holderNames && holderNames.length > 0 && (
        <>
          <span className="text-text-muted font-normal">·</span>
          <span className="text-text-secondary font-medium truncate max-w-[120px]">
            {holderNames.join(", ")}
            {subjectName && (
              <span className="font-normal text-text-muted"> owns {subjectName}</span>
            )}
          </span>
        </>
      )}
    </div>
  );
}
