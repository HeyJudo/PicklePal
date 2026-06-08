import { type HTMLAttributes } from "react";

type ChipVariant = "default" | "green" | "blue" | "gold" | "orange" | "red" | "neutral";
type ChipSize = "sm" | "md";

interface ChipProps extends HTMLAttributes<HTMLSpanElement> {
  readonly variant?: ChipVariant;
  readonly size?: ChipSize;
  readonly icon?: React.ReactNode;
  readonly dot?: boolean;
}

const variantMap: Record<ChipVariant, string> = {
  default: "bg-sky-blue/10 text-sky-blue-dark border border-sky-blue/20",
  green: "bg-court-green/10 text-court-green-dark border border-court-green/20",
  blue: "bg-sky-blue/10 text-sky-blue-dark border border-sky-blue/20",
  gold: "bg-ball-yellow/15 text-[#7a5e00] border border-ball-yellow/30",
  orange: "bg-hype-orange/10 text-orange-800 border border-hype-orange/20",
  red: "bg-error/10 text-error border border-error/20",
  neutral: "bg-surface-muted text-text-secondary border border-border-muted",
};

const sizeMap: Record<ChipSize, string> = {
  sm: "px-2 py-0.5 text-[10px] gap-1",
  md: "px-2.5 py-1 text-xs gap-1.5",
};

export function Chip({
  variant = "default",
  size = "sm",
  icon,
  dot = false,
  className = "",
  children,
  ...props
}: ChipProps) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-full font-label font-semibold uppercase tracking-wide shrink-0",
        variantMap[variant],
        sizeMap[size],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {dot && (
        <span
          className={[
            "rounded-full shrink-0",
            size === "sm" ? "h-1.5 w-1.5" : "h-2 w-2",
            variant === "green"
              ? "bg-court-green"
              : variant === "gold"
              ? "bg-ball-yellow"
              : variant === "red"
              ? "bg-error"
              : "bg-current",
          ].join(" ")}
          aria-hidden="true"
        />
      )}
      {icon && (
        <span className="shrink-0" aria-hidden="true">
          {icon}
        </span>
      )}
      {children}
    </span>
  );
}
