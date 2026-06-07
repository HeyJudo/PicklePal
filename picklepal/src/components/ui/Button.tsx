"use client";

import { type ButtonHTMLAttributes, forwardRef } from "react";
import { ChevronRight, Loader2 } from "lucide-react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "gold";
type ButtonSize = "sm" | "md" | "lg" | "xl";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly variant?: ButtonVariant;
  readonly size?: ButtonSize;
  readonly loading?: boolean;
  readonly trailingIcon?: React.ReactNode;
  readonly leadingIcon?: React.ReactNode;
  readonly fullWidth?: boolean;
}

const base =
  "relative inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.97] select-none";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-court-green text-white hover:bg-court-green-dark focus-visible:ring-court-green shadow-sm",
  secondary:
    "bg-sky-blue text-white hover:bg-sky-blue-dark focus-visible:ring-sky-blue shadow-sm",
  ghost:
    "bg-transparent text-text-primary hover:bg-surface-muted focus-visible:ring-court-green border border-border",
  danger:
    "bg-error text-white hover:bg-red-700 focus-visible:ring-error shadow-sm",
  gold:
    "bg-ball-yellow text-text-primary hover:bg-ball-yellow-light focus-visible:ring-ball-yellow shadow-sm font-bold",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base",
  xl: "h-14 px-8 text-lg min-w-[160px]", // courtside tablet size
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      trailingIcon,
      leadingIcon,
      fullWidth = false,
      className = "",
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const showTrailing = !loading && (trailingIcon ?? variant === "primary");

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={[
          base,
          variants[variant],
          sizes[size],
          fullWidth ? "w-full" : "",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        {...props}
      >
        {loading && (
          <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden="true" />
        )}
        {!loading && leadingIcon && (
          <span className="shrink-0" aria-hidden="true">
            {leadingIcon}
          </span>
        )}
        {children}
        {showTrailing && (
          <span className="shrink-0 opacity-80" aria-hidden="true">
            {trailingIcon ?? <ChevronRight className="w-4 h-4" />}
          </span>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
