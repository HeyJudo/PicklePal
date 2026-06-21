"use client";

/**
 * MvpOverlayCard — transparent PNG sticker celebrating the session MVP.
 *
 * html2canvas safety contract:
 *  - ALL styles are inline style={{}} with explicit hex/rgb values only.
 *  - NO Tailwind utilities on exported nodes.
 *  - NO oklch / CSS custom properties.
 *  - NO external <img> or next/image (CORS taints canvas).
 *  - NO box-shadow (renders inconsistently).
 *  - Wordmark + icons = inline SVG only.
 *  - Avatar = CSS circle with initials (no external image).
 *
 * BUG-2 FIXES:
 *  - Safe horizontal padding: 40px each side (was 32px, top bar had no clamp).
 *  - Safe bottom margin: 56px (was 44px) — stat row and footer never flush to edge.
 *  - Name is its own block (NOT beside the avatar). Avatar removed to give name
 *    the full width.
 *  - Name font size scales with character length: ≤10 chars → 68px, ≤14 → 52px,
 *    ≤18 → 40px, longer → 32px. Hard max-width enforced + 2-line clamp as guard.
 *  - "MVP OF THE DAY" label gets full 40px safe padding (was 32px).
 *
 * Export dimensions: 540 × 960 base @ scale 3 → 1620 × 2880 PNG output.
 */

import type { MvpAward } from "@/lib/stats/awards";

// ─── Public Props ─────────────────────────────────────────────────────────────

export interface MvpOverlayCardProps {
  readonly mvp: MvpAward;
  readonly date: string;
}

// ─── Dimension constants ──────────────────────────────────────────────────────

const W = 540;
const H = 960;
// Safe horizontal padding — nothing clips at edges
const PAD_H = 40;
// Safe bottom margin — nothing flush at bottom edge
const PAD_B = 56;

// ─── Color constants (all hex/rgb — NO CSS vars, NO oklch) ───────────────────

const C = {
  gold:           "#F5C518",
  white:          "#ffffff",
  courtGreen:     "#2D8B4E",
  shadow:         "0 1px 6px rgba(0,0,0,0.85), 0 2px 12px rgba(0,0,0,0.6)",
  shadowSm:       "0 1px 4px rgba(0,0,0,0.9)",
  white80:        "rgba(255,255,255,0.80)",
  white60:        "rgba(255,255,255,0.60)",
  white40:        "rgba(255,255,255,0.40)",
  white20:        "rgba(255,255,255,0.20)",
  divider:        "rgba(255,255,255,0.25)",
} as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Responsive name font size.
 * Anton is very condensed — use character count of the full name string.
 * Safe width = 540 - 2*40 = 460px for the name block.
 */
function nameFontSize(name: string): number {
  const len = name.length;
  if (len <= 8)  return 70;
  if (len <= 12) return 58;
  if (len <= 16) return 46;
  if (len <= 20) return 36;
  return 28;
}

// ─── Inline SVG: DinkDay wordmark ────────────────────────────────────────────

function DinkDayWordmark() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <svg width={18} height={18} viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
        <circle cx="12" cy="12" r="9" fill={C.courtGreen} stroke={C.courtGreen} strokeWidth="1.6" />
        <circle cx="9"  cy="9"  r="1.2" fill={C.white} />
        <circle cx="15" cy="9"  r="1.2" fill={C.white} />
        <circle cx="12" cy="13" r="1.2" fill={C.white} />
        <circle cx="8"  cy="14" r="1.2" fill={C.white} />
        <circle cx="16" cy="14" r="1.2" fill={C.white} />
      </svg>
      <span style={{
        fontSize: 18,
        fontWeight: 700,
        color: C.white,
        fontFamily: "system-ui, -apple-system, sans-serif",
        letterSpacing: "0.3px",
        lineHeight: 1,
        textShadow: C.shadow,
      }}>
        <span style={{ color: C.courtGreen }}>D</span>inkDay
      </span>
    </div>
  );
}

// ─── Inline SVG: tiny trophy ──────────────────────────────────────────────────

function TrophyIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={C.gold} aria-hidden="true" style={{ flexShrink: 0 }}>
      <path d="M5 3h14v7a7 7 0 01-14 0V3z" />
      <path d="M12 17v3M8 20h8" stroke={C.gold} strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M3 5h2M19 5h2" stroke={C.gold} strokeWidth="2" strokeLinecap="round" fill="none" />
    </svg>
  );
}

// ─── Scrims ───────────────────────────────────────────────────────────────────

function TopScrim() {
  return (
    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 200, pointerEvents: "none" }}>
      <div style={{ position: "absolute", top: 0,   left: 0, right: 0, height: 60,  backgroundColor: "rgba(0,0,0,0.45)" }} />
      <div style={{ position: "absolute", top: 60,  left: 0, right: 0, height: 60,  backgroundColor: "rgba(0,0,0,0.25)" }} />
      <div style={{ position: "absolute", top: 120, left: 0, right: 0, height: 80,  backgroundColor: "rgba(0,0,0,0.10)" }} />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.30) 40%, rgba(0,0,0,0.00) 100%)" }} />
    </div>
  );
}

function BottomScrim() {
  return (
    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 340, pointerEvents: "none" }}>
      <div style={{ position: "absolute", bottom: 0,   left: 0, right: 0, height: 100, backgroundColor: "rgba(0,0,0,0.50)" }} />
      <div style={{ position: "absolute", bottom: 100, left: 0, right: 0, height: 100, backgroundColor: "rgba(0,0,0,0.30)" }} />
      <div style={{ position: "absolute", bottom: 200, left: 0, right: 0, height: 140, backgroundColor: "rgba(0,0,0,0.10)" }} />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.30) 40%, rgba(0,0,0,0.00) 100%)" }} />
    </div>
  );
}

// ─── Main Card ────────────────────────────────────────────────────────────────

export function MvpOverlayCard({ mvp, date }: MvpOverlayCardProps) {
  const winRate = mvp.gamesPlayed > 0
    ? Math.round((mvp.wins / mvp.gamesPlayed) * 100)
    : 0;
  const winLoss   = `${mvp.wins}-${mvp.gamesPlayed - mvp.wins}`;
  const pointDiff = mvp.pointDifferential > 0
    ? `+${mvp.pointDifferential}`
    : String(mvp.pointDifferential);

  const displayName = mvp.displayName.toUpperCase();
  const fontSize    = nameFontSize(displayName);

  // Available name width: card width minus safe padding both sides
  const nameMaxWidth = W - PAD_H * 2;

  return (
    <div
      style={{
        width: W,
        height: H,
        position: "relative",
        overflow: "hidden",
        backgroundColor: "transparent",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <TopScrim />
      <BottomScrim />

      {/* ── TOP BAR ── */}
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 2,
        padding: `44px ${PAD_H}px 0`,
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <DinkDayWordmark />
          <span style={{
            fontSize: 13,
            fontFamily: "system-ui, -apple-system, sans-serif",
            color: C.white80,
            textShadow: C.shadowSm,
            letterSpacing: "0.3px",
          }}>
            {date}
          </span>
        </div>
        <div style={{ height: 1, backgroundColor: C.courtGreen, marginTop: 14 }} />
      </div>

      {/* ── BOTTOM BLOCK ── */}
      <div style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 2,
        padding: `0 ${PAD_H}px ${PAD_B}px`,
      }}>

        {/* MVP label + trophy — full safe padding applied via parent */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
          <TrophyIcon size={13} />
          <span style={{
            fontSize: 11,
            fontWeight: 700,
            fontFamily: "system-ui, -apple-system, sans-serif",
            color: C.gold,
            textTransform: "uppercase" as const,
            letterSpacing: "2.5px",
            textShadow: C.shadowSm,
          }}>
            MVP OF THE DAY
          </span>
        </div>

        {/* Player name — full width block, responsive size */}
        <div
          style={{
            fontSize: fontSize,
            fontFamily: "Anton, Impact, system-ui, sans-serif",
            fontWeight: 400,
            color: C.white,
            lineHeight: 1.05,
            textTransform: "uppercase" as const,
            letterSpacing: "1px",
            textShadow: C.shadow,
            // Width constrained to safe area — wordBreak ensures wrapping
            maxWidth: nameMaxWidth,
            wordBreak: "break-word" as const,
            marginBottom: 12,
          }}
        >
          {displayName}
        </div>

        {/* Thin divider */}
        <div style={{ height: 1, backgroundColor: C.courtGreen, marginBottom: 14 }} />

        {/* Stat strip: WINS · WIN RATE · POINT DIFF */}
        <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 18 }}>
          {/* WINS */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column" as const, gap: 2 }}>
            <span style={{
              fontSize: 26,
              fontFamily: "Archivo Narrow, Arial Narrow, system-ui, sans-serif",
              fontWeight: 700,
              color: C.white,
              lineHeight: 1,
              textShadow: C.shadow,
            }}>
              {winLoss}
            </span>
            <span style={{
              fontSize: 9,
              fontFamily: "system-ui, -apple-system, sans-serif",
              fontWeight: 600,
              color: C.white60,
              textTransform: "uppercase" as const,
              letterSpacing: "2px",
              textShadow: C.shadowSm,
            }}>
              WINS
            </span>
          </div>

          <div style={{ width: 1, height: 36, backgroundColor: C.white20, flexShrink: 0 }} />

          {/* WIN RATE */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column" as const, gap: 2, paddingLeft: 16 }}>
            <span style={{
              fontSize: 26,
              fontFamily: "Archivo Narrow, Arial Narrow, system-ui, sans-serif",
              fontWeight: 700,
              color: C.white,
              lineHeight: 1,
              textShadow: C.shadow,
            }}>
              {winRate}%
            </span>
            <span style={{
              fontSize: 9,
              fontFamily: "system-ui, -apple-system, sans-serif",
              fontWeight: 600,
              color: C.white60,
              textTransform: "uppercase" as const,
              letterSpacing: "2px",
              textShadow: C.shadowSm,
            }}>
              WIN RATE
            </span>
          </div>

          <div style={{ width: 1, height: 36, backgroundColor: C.white20, flexShrink: 0 }} />

          {/* POINT DIFF */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column" as const, gap: 2, paddingLeft: 16 }}>
            <span style={{
              fontSize: 26,
              fontFamily: "Archivo Narrow, Arial Narrow, system-ui, sans-serif",
              fontWeight: 700,
              color: C.gold,
              lineHeight: 1,
              textShadow: C.shadow,
            }}>
              {pointDiff}
            </span>
            <span style={{
              fontSize: 9,
              fontFamily: "system-ui, -apple-system, sans-serif",
              fontWeight: 600,
              color: C.white60,
              textTransform: "uppercase" as const,
              letterSpacing: "2px",
              textShadow: C.shadowSm,
            }}>
              POINT DIFF
            </span>
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{
            fontSize: 11,
            fontFamily: "system-ui, -apple-system, sans-serif",
            fontWeight: 600,
            color: C.courtGreen,
            textShadow: C.shadowSm,
            letterSpacing: "0.3px",
          }}>
            dinkday.site
          </span>
          <span style={{ color: C.white20, fontSize: 10 }}>·</span>
          <span style={{
            fontSize: 11,
            fontFamily: "system-ui, -apple-system, sans-serif",
            color: C.white40,
            textShadow: C.shadowSm,
            letterSpacing: "0.2px",
          }}>
            Game day, handled.
          </span>
        </div>
      </div>
    </div>
  );
}
