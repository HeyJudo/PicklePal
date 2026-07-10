/**
 * playerCardColor — pure helpers that turn a player's hex color into a
 * high-contrast gradient for PlayerOverlayCard. No React, no DOM.
 */

const FALLBACK_HEX = "#64748B";

interface Rgb {
  readonly r: number;
  readonly g: number;
  readonly b: number;
}

// ─── Hex parsing ──────────────────────────────────────────────────────────────

/** Parses a "#rgb" or "#rrggbb" hex string. Returns null when invalid. */
export function parseHex(hex: string | null | undefined): Rgb | null {
  if (!hex) return null;
  const match = /^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.exec(hex.trim());
  if (!match) return null;

  const raw = match[1];
  const full =
    raw.length === 3
      ? raw
          .split("")
          .map((c) => c + c)
          .join("")
      : raw;

  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
}

function toHex(rgb: Rgb): string {
  const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
  const part = (n: number) => clamp(n).toString(16).padStart(2, "0");
  return `#${part(rgb.r)}${part(rgb.g)}${part(rgb.b)}`;
}

// ─── Relative luminance (WCAG) ────────────────────────────────────────────────

function channelLuminance(c: number): number {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

/** WCAG relative luminance, 0 (black) to 1 (white). */
export function relativeLuminance(rgb: Rgb): number {
  return (
    0.2126 * channelLuminance(rgb.r) +
    0.7152 * channelLuminance(rgb.g) +
    0.0722 * channelLuminance(rgb.b)
  );
}

// ─── Lighten / darken ─────────────────────────────────────────────────────────

function mix(rgb: Rgb, target: Rgb, amount: number): Rgb {
  const t = Math.max(0, Math.min(1, amount));
  return {
    r: rgb.r + (target.r - rgb.r) * t,
    g: rgb.g + (target.g - rgb.g) * t,
    b: rgb.b + (target.b - rgb.b) * t,
  };
}

function lighten(rgb: Rgb, amount: number): Rgb {
  return mix(rgb, { r: 255, g: 255, b: 255 }, amount);
}

function darken(rgb: Rgb, amount: number): Rgb {
  return mix(rgb, { r: 0, g: 0, b: 0 }, amount);
}

// ─── Gradient stops ───────────────────────────────────────────────────────────

export interface CardGradient {
  readonly from: string;
  readonly to: string;
}

/**
 * Max luminance a gradient stop is allowed to have white text sit directly on.
 * 0.30 keeps white text at >= 3:1 (WCAG AA large text) even before the card's
 * text shadows help: (1.0 + 0.05) / (0.30 + 0.05) = 3.0.
 */
const MAX_SAFE_LUMINANCE = 0.3;

/** Darkens `base` in increasing steps until it's safe for unscrimmed white text. */
function darkenToLuminance(base: Rgb, maxLuminance: number): Rgb {
  let amount = 0;
  let current = base;
  while (relativeLuminance(current) > maxLuminance && amount < 0.95) {
    amount += 0.08;
    current = darken(base, amount);
  }
  return current;
}

/**
 * Builds the 135deg background gradient stops for a player card: a slightly
 * lightened top-left stop and a strongly deepened bottom-right stop, both
 * derived from the same hue.
 *
 * Contrast guardrail: light input colors (ball yellow, amber, ...) would
 * otherwise produce a top-left stop too bright for white text — both stops
 * are pushed darker until they're safe, which is why light colors end up
 * with visibly darker gradient bases than dark colors.
 */
export function buildCardGradient(hex: string | null | undefined): CardGradient {
  const parsed = parseHex(hex) ?? parseHex(FALLBACK_HEX)!;

  const lightened = lighten(parsed, 0.15);
  const deepened = darken(parsed, 0.55);

  const from = darkenToLuminance(lightened, MAX_SAFE_LUMINANCE);
  const to = darkenToLuminance(deepened, 0.28);

  return { from: toHex(from), to: toHex(to) };
}

export { FALLBACK_HEX };
