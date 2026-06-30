"use client";

import { useEffect, useRef, useState } from "react";
import type { BeltType } from "@/lib/belts/recomputeBelts";
import { getBeltMeta } from "./BeltBadge";
import { BeltMedallion } from "./BeltMedallion";

const BELT_ORDER: readonly BeltType[] = ["king_of_the_kitchen", "poacher", "pickler"];

const NAME_COLOR: Record<BeltType, string> = {
  king_of_the_kitchen: "text-court-green-dark",
  poacher: "text-sky-blue-dark",
  pickler: "text-hype-red",
};

/**
 * A small "Titles" trigger that opens a tasteful popover explaining each belt.
 * Closes on outside click, Escape, or the close button. No external deps.
 */
export function BeltLegend({
  className = "",
  hallOfFameHref,
}: {
  readonly className?: string;
  readonly hallOfFameHref?: string;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="dialog"
        className="inline-flex items-center gap-1 rounded-full border border-border-muted bg-surface px-2.5 py-1 text-[11px] font-label font-semibold uppercase tracking-widest text-text-muted transition-colors hover:border-ball-yellow/50 hover:text-court-green-dark active:scale-[0.97]"
      >
        <span aria-hidden="true" className="text-xs">ⓘ</span>
        Titles
      </button>

      <div
        role="dialog"
        aria-label="What the belts mean"
        className={`absolute right-0 z-20 mt-2 w-72 origin-top-right rounded-xl border border-border bg-surface-elevated p-3 shadow-lg transition-all duration-150 ${
          open
            ? "pointer-events-auto scale-100 opacity-100"
            : "pointer-events-none scale-95 opacity-0"
        }`}
      >
        <div className="mb-2 flex items-center justify-between">
          <p className="font-label text-[11px] font-semibold uppercase tracking-widest text-text-muted">
            Belts &amp; how you earn them
          </p>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close"
            className="text-text-muted transition-colors hover:text-text-primary"
          >
            ✕
          </button>
        </div>

        <ul className="space-y-2.5">
          {BELT_ORDER.map((beltType) => {
            const meta = getBeltMeta(beltType);
            return (
              <li key={beltType} className="flex items-start gap-2.5">
                <BeltMedallion beltType={beltType} size="md" className="mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className={`text-sm font-semibold leading-tight ${NAME_COLOR[beltType]}`}>
                    {meta.label}
                  </p>
                  <p className="text-xs text-text-secondary leading-snug">{meta.description}</p>
                </div>
              </li>
            );
          })}
        </ul>

        {hallOfFameHref && (
          <a
            href={hallOfFameHref}
            className="mt-3 block border-t border-border-muted pt-2.5 text-right text-xs font-semibold text-court-green transition-colors hover:text-court-green-dark"
          >
            View Hall of Fame →
          </a>
        )}
      </div>
    </div>
  );
}
