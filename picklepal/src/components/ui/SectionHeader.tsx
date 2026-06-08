import { type HTMLAttributes } from "react";

interface SectionHeaderProps extends HTMLAttributes<HTMLDivElement> {
  readonly title: string;
  readonly subtitle?: string;
  readonly icon?: React.ReactNode;
  readonly action?: React.ReactNode;
  readonly size?: "sm" | "md" | "lg";
}

const sizes = {
  sm: { title: "text-sm font-semibold text-text-primary", sub: "text-xs text-text-muted" },
  md: { title: "text-base font-bold text-text-primary", sub: "text-sm text-text-muted" },
  lg: { title: "text-xl font-bold text-text-primary", sub: "text-sm text-text-secondary" },
};

export function SectionHeader({
  title,
  subtitle,
  icon,
  action,
  size = "md",
  className = "",
  ...props
}: SectionHeaderProps) {
  const s = sizes[size];

  return (
    <div
      className={["flex items-start justify-between gap-3", className]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      <div className="flex items-center gap-2 min-w-0">
        {icon && (
          <span className="shrink-0 text-court-green" aria-hidden="true">
            {icon}
          </span>
        )}
        <div className="min-w-0">
          <h2 className={[s.title, "leading-tight truncate"].join(" ")}>{title}</h2>
          {subtitle && (
            <p className={[s.sub, "leading-snug mt-0.5"].join(" ")}>{subtitle}</p>
          )}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
