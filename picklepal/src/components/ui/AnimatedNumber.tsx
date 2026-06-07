"use client";

import { useEffect, useRef } from "react";
import { animate } from "motion";

interface AnimatedNumberProps {
  readonly value: number;
  readonly duration?: number;
  readonly className?: string;
  readonly suffix?: string;
  readonly prefix?: string;
  readonly decimals?: number;
}

export function AnimatedNumber({
  value,
  duration = 0.8,
  className,
  suffix = "",
  prefix = "",
  decimals = 0,
}: AnimatedNumberProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const prevValue = useRef(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const from = prevValue.current;
    prevValue.current = value;

    const controls = animate(from, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate(latest) {
        el.textContent =
          prefix +
          (decimals > 0 ? latest.toFixed(decimals) : Math.round(latest).toString()) +
          suffix;
      },
    });

    return () => controls.stop();
  }, [value, duration, prefix, suffix, decimals]);

  const display =
    prefix +
    (decimals > 0 ? value.toFixed(decimals) : value.toString()) +
    suffix;

  return (
    <span ref={ref} className={className} aria-live="polite" aria-atomic="true">
      {display}
    </span>
  );
}
