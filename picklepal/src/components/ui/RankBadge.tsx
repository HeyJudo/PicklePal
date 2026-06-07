import { type HTMLAttributes } from "react";

interface RankBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  readonly rank: number;
  readonly size?: "sm" | "md" | "lg";
}

const sizeMap = {
  sm: "w-6 h-6 text-xs",
  md: "w-8 h-8 text-sm",
  lg: "w-10 h-10 text-base",
};

const podiumColors: Record<number, string> = {
  1: "bg-ball-yellow text-[#5a4000] font-bold shadow-[0_0_0_2px_rgba(245,197,24,0.35)]",
  2: "bg-[#c0c0c0] text-[#3a3a3a] font-bold shadow-[0_0_0_2px_rgba(192,192,192,0.35)]",
  3: "bg-[#cd7f32] text-white font-bold shadow-[0_0_0_2px_rgba(205,127,50,0.35)]",
};

export function RankBadge({
  rank,
  size = "md",
  className = "",
  ...props
}: RankBadgeProps) {
  const isPodium = rank <= 3;
  const podiumStyle = podiumColors[rank];

  return (
    <span
      className={[
        "inline-flex items-center justify-center rounded-full font-score tabular-nums shrink-0",
        sizeMap[size],
        isPodium
          ? podiumStyle
          : "bg-surface-muted text-text-muted border border-border-muted",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label={`Rank ${rank}`}
      {...props}
    >
      {rank}
    </span>
  );
}
