"use client";

/**
 * PlayerOverlayCard — branded 4:5 stat card for a roster player's profile.
 *
 * Follows the same html2canvas safety contract as MvpOverlayCard:
 *  - ALL styles are inline style={{}} with explicit hex/rgb values only.
 *  - NO Tailwind utilities on exported nodes.
 *  - NO oklch / CSS custom properties.
 *  - NO external <img> or next/image (CORS taints canvas).
 *  - NO box-shadow (renders inconsistently).
 *  - Wordmark + icons = inline SVG only.
 *  - Gradient + court-line texture computed/inlined, no external assets.
 *
 * Export dimensions: 540 × 675 base (4:5) @ scale 3 → 1620 × 2025 PNG output.
 */

import { buildCardGradient } from "./playerCardColor";

// ─── Public Props ─────────────────────────────────────────────────────────────

export interface PlayerCardData {
  readonly displayName: string;
  readonly color: string | null;
  readonly winRate: number; // 0-100
  readonly wins: number;
  readonly losses: number;
  readonly gamesPlayed: number;
  readonly rank: number | null;
  readonly streak: number;
  readonly beltNames: readonly string[];
  readonly groupName: string;
  readonly groupSlug: string;
}

export interface PlayerOverlayCardProps {
  readonly data: PlayerCardData;
}

// ─── Dimension constants ──────────────────────────────────────────────────────

const W = 540;
const H = 675;
const PAD_H = 36;
const PAD_TOP = 40;
const PAD_B = 44;

// ─── Color constants (all hex/rgb — NO CSS vars, NO oklch) ───────────────────

const C = {
  gold: "#F5C518",
  white: "#ffffff",
  courtGreen: "#2D8B4E",
  shadow: "0 1px 6px rgba(0,0,0,0.85), 0 2px 12px rgba(0,0,0,0.6)",
  shadowSm: "0 1px 4px rgba(0,0,0,0.9)",
  white80: "rgba(255,255,255,0.80)",
  white60: "rgba(255,255,255,0.60)",
  white40: "rgba(255,255,255,0.40)",
  white20: "rgba(255,255,255,0.20)",
} as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Responsive name font size (Anton, condensed) by character count.
 * Safe width = 540 - 2*36 = 468px for the name block.
 */
function nameFontSize(name: string): number {
  const len = name.length;
  if (len <= 8) return 64;
  if (len <= 12) return 52;
  if (len <= 16) return 42;
  if (len <= 20) return 34;
  return 26;
}

// ─── Inline SVG: DinkDay wordmark (copied from MvpOverlayCard) ───────────────

function DinkDayWordmark() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <svg
        width={16}
        height={16}
        viewBox="0 0 24 24"
        fill="none"
        style={{ flexShrink: 0 }}
      >
        <circle
          cx="12"
          cy="12"
          r="9"
          fill={C.courtGreen}
          stroke={C.courtGreen}
          strokeWidth="1.6"
        />
        <circle cx="9" cy="9" r="1.2" fill={C.white} />
        <circle cx="15" cy="9" r="1.2" fill={C.white} />
        <circle cx="12" cy="13" r="1.2" fill={C.white} />
        <circle cx="8" cy="14" r="1.2" fill={C.white} />
        <circle cx="16" cy="14" r="1.2" fill={C.white} />
      </svg>
      <span
        style={{
          fontSize: 15,
          fontWeight: 700,
          color: C.white,
          fontFamily: "system-ui, -apple-system, sans-serif",
          letterSpacing: "0.3px",
          lineHeight: 1,
          textShadow: C.shadow,
        }}
      >
        <span style={{ color: C.courtGreen }}>D</span>inkDay
      </span>
    </div>
  );
}

// ─── Inline SVG: tiny crown (belt chip icon) ─────────────────────────────────

function CrownIcon({ size = 12 }: { readonly size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={C.gold}
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      <path d="M3 18h18l-1.5-9-4.5 4-3-6-3 6-4.5-4L3 18z" />
      <rect x="3" y="19" width="18" height="2" rx="1" />
    </svg>
  );
}

// ─── Inline SVG: faint pickleball court line motif (decorative texture) ──────

function CourtTexture() {
  return (
    <svg
      width={W * 1.4}
      height={H * 1.4}
      viewBox={`0 0 ${W * 1.4} ${H * 1.4}`}
      style={{
        position: "absolute",
        top: -H * 0.15,
        left: -W * 0.2,
        transform: "rotate(-8deg)",
        opacity: 0.08,
      }}
      aria-hidden="true"
    >
      {/* Baseline */}
      <line
        x1="0"
        y1={H * 0.3}
        x2={W * 1.4}
        y2={H * 0.3}
        stroke={C.white}
        strokeWidth="3"
      />
      {/* Net band */}
      <line
        x1="0"
        y1={H * 0.62}
        x2={W * 1.4}
        y2={H * 0.62}
        stroke={C.white}
        strokeWidth="5"
      />
      {/* Kitchen line */}
      <line
        x1="0"
        y1={H * 0.94}
        x2={W * 1.4}
        y2={H * 0.94}
        stroke={C.white}
        strokeWidth="3"
      />
      {/* Center service line */}
      <line
        x1={W * 0.7}
        y1={H * 0.3}
        x2={W * 0.7}
        y2={H * 0.94}
        stroke={C.white}
        strokeWidth="3"
      />
    </svg>
  );
}

// ─── Bottom scrim behind the stat block ───────────────────────────────────────

function BottomScrim() {
  return (
    <div
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: 380,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 120,
          backgroundColor: "rgba(0,0,0,0.55)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 120,
          left: 0,
          right: 0,
          height: 100,
          backgroundColor: "rgba(0,0,0,0.32)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 220,
          left: 0,
          right: 0,
          height: 160,
          backgroundColor: "rgba(0,0,0,0.12)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.3) 45%, rgba(0,0,0,0) 100%)",
        }}
      />
    </div>
  );
}

// ─── Main Card ────────────────────────────────────────────────────────────────

export function PlayerOverlayCard({ data }: PlayerOverlayCardProps) {
  const { from, to } = buildCardGradient(data.color);

  const displayName = data.displayName.toUpperCase();
  const fontSize = nameFontSize(displayName);
  const nameMaxWidth = W - PAD_H * 2;

  const isRookie = data.gamesPlayed === 0;
  const heroText = isRookie ? "ROOKIE" : `${Math.round(data.winRate)}%`;
  const heroFontSize = isRookie ? 92 : heroText.length > 3 ? 120 : 140;

  const rankLabel = data.rank !== null ? `#${data.rank}` : "N/A";
  const streakLabel = data.streak > 0 ? `${data.streak}W` : "0";
  const streakColor = data.streak >= 3 ? C.gold : C.white;

  const belts = data.beltNames.slice(0, 2);

  return (
    <div
      style={{
        width: W,
        height: H,
        position: "relative",
        overflow: "hidden",
        fontFamily: "system-ui, -apple-system, sans-serif",
        background: `linear-gradient(135deg, ${from} 0%, ${to} 100%)`,
      }}
    >
      {/* Radial highlight near the top for depth */}
      <div
        style={{
          position: "absolute",
          top: -80,
          left: -60,
          width: W * 0.9,
          height: W * 0.9,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0) 70%)",
          pointerEvents: "none",
        }}
        aria-hidden="true"
      />

      {/* Decorative court-line texture */}
      <CourtTexture />

      {/* Scrim behind the stat block so text always reads */}
      <BottomScrim />

      {/* ── TOP BAR ── */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 2,
          padding: `${PAD_TOP}px ${PAD_H}px 0`,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <DinkDayWordmark />
          <span
            style={{
              fontSize: 12,
              fontFamily: "system-ui, -apple-system, sans-serif",
              color: C.white80,
              textShadow: C.shadowSm,
              letterSpacing: "0.3px",
              maxWidth: 200,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {data.groupName}
          </span>
        </div>
        <div style={{ height: 1, backgroundColor: C.white20, marginTop: 12 }} />
      </div>

      {/* ── Player name ── */}
      <div
        style={{
          position: "absolute",
          top: 96,
          left: PAD_H,
          right: PAD_H,
          zIndex: 2,
        }}
      >
        <div
          style={{
            fontSize,
            fontFamily: "Anton, Impact, system-ui, sans-serif",
            fontWeight: 400,
            color: C.white,
            lineHeight: 1.05,
            textTransform: "uppercase" as const,
            letterSpacing: "1px",
            textShadow: C.shadow,
            maxWidth: nameMaxWidth,
            wordBreak: "break-word" as const,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical" as const,
            overflow: "hidden",
          }}
        >
          {displayName}
        </div>
      </div>

      {/* ── Hero stat: win rate ── */}
      <div
        style={{
          position: "absolute",
          top: 210,
          left: PAD_H,
          right: PAD_H,
          zIndex: 2,
          display: "flex",
          flexDirection: "column" as const,
          alignItems: "flex-start",
        }}
      >
        <span
          style={{
            fontSize: heroFontSize,
            fontFamily: "Anton, Impact, system-ui, sans-serif",
            fontWeight: 400,
            color: C.white,
            lineHeight: 1,
            textShadow: C.shadow,
          }}
        >
          {heroText}
        </span>
        {!isRookie && (
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              fontFamily: "system-ui, -apple-system, sans-serif",
              color: C.white60,
              textTransform: "uppercase" as const,
              letterSpacing: "3px",
              textShadow: C.shadowSm,
              marginTop: 4,
            }}
          >
            WIN RATE
          </span>
        )}
      </div>

      {/* ── BOTTOM BLOCK ── */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 2,
          padding: `0 ${PAD_H}px ${PAD_B}px`,
        }}
      >
        {/* Belt badge row */}
        {belts.length > 0 && (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap" as const,
              gap: 8,
              marginBottom: 16,
            }}
          >
            {belts.map((belt) => (
              <div
                key={belt}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "5px 10px",
                  borderRadius: 999,
                  backgroundColor: "rgba(245,197,24,0.18)",
                  border: "1px solid rgba(245,197,24,0.5)",
                }}
              >
                <CrownIcon size={11} />
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    fontFamily: "system-ui, -apple-system, sans-serif",
                    color: C.gold,
                    textTransform: "uppercase" as const,
                    letterSpacing: "1px",
                    textShadow: C.shadowSm,
                  }}
                >
                  {belt}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Stat strip: RECORD · RANK · STREAK */}
        <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 18 }}>
          <div
            style={{ flex: 1, display: "flex", flexDirection: "column" as const, gap: 2 }}
          >
            <span
              style={{
                fontSize: 24,
                fontFamily: "Archivo Narrow, Arial Narrow, system-ui, sans-serif",
                fontWeight: 700,
                color: C.white,
                lineHeight: 1,
                textShadow: C.shadow,
              }}
            >
              {data.wins}-{data.losses}
            </span>
            <span
              style={{
                fontSize: 9,
                fontFamily: "system-ui, -apple-system, sans-serif",
                fontWeight: 600,
                color: C.white60,
                textTransform: "uppercase" as const,
                letterSpacing: "2px",
                textShadow: C.shadowSm,
              }}
            >
              RECORD
            </span>
          </div>

          <div
            style={{ width: 1, height: 34, backgroundColor: C.white20, flexShrink: 0 }}
          />

          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column" as const,
              gap: 2,
              paddingLeft: 16,
            }}
          >
            <span
              style={{
                fontSize: 24,
                fontFamily: "Archivo Narrow, Arial Narrow, system-ui, sans-serif",
                fontWeight: 700,
                color: C.white,
                lineHeight: 1,
                textShadow: C.shadow,
              }}
            >
              {rankLabel}
            </span>
            <span
              style={{
                fontSize: 9,
                fontFamily: "system-ui, -apple-system, sans-serif",
                fontWeight: 600,
                color: C.white60,
                textTransform: "uppercase" as const,
                letterSpacing: "2px",
                textShadow: C.shadowSm,
              }}
            >
              RANK
            </span>
          </div>

          <div
            style={{ width: 1, height: 34, backgroundColor: C.white20, flexShrink: 0 }}
          />

          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column" as const,
              gap: 2,
              paddingLeft: 16,
            }}
          >
            <span
              style={{
                fontSize: 24,
                fontFamily: "Archivo Narrow, Arial Narrow, system-ui, sans-serif",
                fontWeight: 700,
                color: streakColor,
                lineHeight: 1,
                textShadow: C.shadow,
              }}
            >
              {streakLabel}
            </span>
            <span
              style={{
                fontSize: 9,
                fontFamily: "system-ui, -apple-system, sans-serif",
                fontWeight: 600,
                color: C.white60,
                textTransform: "uppercase" as const,
                letterSpacing: "2px",
                textShadow: C.shadowSm,
              }}
            >
              STREAK
            </span>
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span
            style={{
              fontSize: 11,
              fontFamily: "system-ui, -apple-system, sans-serif",
              fontWeight: 600,
              color: C.white80,
              textShadow: C.shadowSm,
              letterSpacing: "0.2px",
            }}
          >
            dinkday.site/g/{data.groupSlug}
          </span>
          <span style={{ color: C.white20, fontSize: 10 }}>&middot;</span>
          <span
            style={{
              fontSize: 11,
              fontFamily: "system-ui, -apple-system, sans-serif",
              color: C.white40,
              textShadow: C.shadowSm,
              letterSpacing: "0.2px",
            }}
          >
            Game day, handled.
          </span>
        </div>
      </div>
    </div>
  );
}
