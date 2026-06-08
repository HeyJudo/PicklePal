import { type HTMLAttributes } from "react";

type CardVariant =
  | "base"       // clean, no border — group with dividers or spacing
  | "bordered"   // warm green-gray border
  | "accented"   // left color-bar accent
  | "green"      // court-green background block
  | "blue"       // sky-blue background block
  | "dark"       // deep green-black (scoreboard dark)
  | "elevated";  // white with subtle elevation

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  readonly variant?: CardVariant;
  readonly accentColor?: "green" | "blue" | "gold" | "orange";
  readonly padding?: "none" | "sm" | "md" | "lg";
}

const variants: Record<CardVariant, string> = {
  base: "bg-surface",
  bordered: "bg-surface border border-border rounded-xl",
  accented: "bg-surface border border-border rounded-xl border-l-4",
  green: "bg-court-green text-white rounded-xl",
  blue: "bg-sky-blue text-white rounded-xl",
  dark: "bg-[#0d2118] text-white rounded-xl",
  elevated: "bg-surface-elevated rounded-xl shadow-[0_2px_8px_rgba(45,139,78,0.10)] border border-border-muted",
};

const accentColors: Record<string, string> = {
  green: "border-l-court-green",
  blue: "border-l-sky-blue",
  gold: "border-l-ball-yellow",
  orange: "border-l-hype-orange",
};

const paddings: Record<string, string> = {
  none: "",
  sm: "p-3",
  md: "p-4",
  lg: "p-6",
};

export function Card({
  variant = "bordered",
  accentColor = "green",
  padding = "md",
  className = "",
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={[
        variants[variant],
        variant === "accented" ? accentColors[accentColor] : "",
        paddings[padding],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {children}
    </div>
  );
}

/* Minimal semantic section wrapper with consistent spacing */
interface SectionProps extends HTMLAttributes<HTMLElement> {
  readonly as?: "section" | "div" | "article";
}

export function Section({
  as: Tag = "section",
  className = "",
  children,
  ...props
}: SectionProps) {
  return (
    <Tag className={["space-y-4", className].filter(Boolean).join(" ")} {...props}>
      {children}
    </Tag>
  );
}
