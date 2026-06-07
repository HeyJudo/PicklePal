import { type HTMLAttributes } from "react";

type StatColor = "green" | "blue" | "gold" | "neutral" | "red";

interface StatTileProps extends HTMLAttributes<HTMLDivElement> {
  readonly value: string | number;
  readonly label: string;
  readonly color?: StatColor;
  readonly icon?: React.ReactNode;
  readonly trend?: "up" | "down" | "neutral";
  readonly size?: "sm" | "md" | "lg";
  readonly sublabel?: string;
}

const colorMap: Record<StatColor, { value: string; label: string; bg: string }> = {
  green: {
    value: "text-court-green",
    label: "text-court-green-dark",
    bg: "bg-court-green/8",
  },
  blue: {
    value: "text-sky-blue",
    label: "text-sky-blue-dark",
    bg: "bg-sky-blue/8",
  },
  gold: {
    value: "text-ball-yellow",
    label: "text-[#8a6f00]",
    bg: "bg-ball-yellow/10",
  },
  neutral: {
    value: "text-text-primary",
    label: "text-text-muted",
    bg: "bg-surface-muted",
  },
  red: {
    value: "text-error",
    label: "text-red-800",
    bg: "bg-error/8",
  },
};

const sizeMap = {
  sm: { value: "text-2xl", label: "text-[10px]", pad: "p-3" },
  md: { value: "text-3xl", label: "text-[11px]", pad: "p-4" },
  lg: { value: "text-4xl", label: "text-xs", pad: "p-5" },
};

const trendIcon: Record<string, string> = {
  up: "↑",
  down: "↓",
  neutral: "",
};

export function StatTile({
  value,
  label,
  color = "neutral",
  icon,
  trend,
  size = "md",
  sublabel,
  className = "",
  ...props
}: StatTileProps) {
  const c = colorMap[color];
  const s = sizeMap[size];

  return (
    <div
      className={[
        "rounded-xl flex flex-col items-center justify-center text-center min-w-0",
        c.bg,
        s.pad,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {icon && (
        <span className={["mb-1 text-base", c.value].join(" ")} aria-hidden="true">
          {icon}
        </span>
      )}

      <div className="flex items-baseline gap-1">
        <span
          className={[
            "font-score font-bold tabular-nums leading-none",
            s.value,
            c.value,
          ].join(" ")}
        >
          {value}
        </span>
        {trend && trend !== "neutral" && (
          <span
            className={[
              "text-xs font-bold",
              trend === "up" ? "text-court-green" : "text-error",
            ].join(" ")}
            aria-label={trend === "up" ? "trending up" : "trending down"}
          >
            {trendIcon[trend]}
          </span>
        )}
      </div>

      <span
        className={[
          "font-label font-semibold uppercase tracking-wide mt-1 leading-tight",
          s.label,
          c.label,
        ].join(" ")}
      >
        {label}
      </span>

      {sublabel && (
        <span className="text-[10px] text-text-muted mt-0.5 leading-tight">{sublabel}</span>
      )}
    </div>
  );
}

/* Convenience grid wrapper matching the old 4-up StatBox grid */
interface StatGridProps {
  readonly children: React.ReactNode;
  readonly cols?: 2 | 3 | 4;
  readonly className?: string;
}

export function StatGrid({ children, cols = 4, className = "" }: StatGridProps) {
  const colMap = {
    2: "grid-cols-2",
    3: "grid-cols-3",
    4: "grid-cols-2 sm:grid-cols-4",
  };

  return (
    <div className={["grid gap-2", colMap[cols], className].filter(Boolean).join(" ")}>
      {children}
    </div>
  );
}
