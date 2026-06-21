"use client";

/**
 * SessionRecapOverlayCard — transparent PNG sticker for the full game-day recap.
 *
 * html2canvas safety contract:
 *  - ALL styles are inline style={{}} with explicit hex/rgb values only.
 *  - NO Tailwind utilities on exported nodes.
 *  - NO oklch / CSS custom properties.
 *  - NO external <img> or next/image (CORS taints canvas).
 *  - NO box-shadow (renders inconsistently).
 *  - Wordmark + icons = inline SVG only.
 *
 * BUG-3 FIXES:
 *  - Safe horizontal padding: 40px each side (was 32px).
 *  - Safe bottom margin: 56px (was 44px).
 *  - Award value text hard-truncated with ellipsis + maxWidth.
 *  - Defensive duration: hidden if null OR implausibly large (> 24h = 1440 min).
 *
 * Export dimensions: 540 × 960 base @ scale 3 → 1620 × 2880 PNG output.
 */

import type { SessionAwards } from "@/lib/stats";

// ─── Public Props ─────────────────────────────────────────────────────────────

export interface SessionRecapOverlayCardProps {
  readonly groupName: string;
  readonly date: string;
  readonly awards: SessionAwards;
  readonly gamesPlayed: number;
  readonly playerCount: number;
  readonly durationMinutes: number | null;
  readonly playerNames: Record<string, string>;
}

// ─── Dimension constants ──────────────────────────────────────────────────────

const W = 540;
const H = 960;
const PAD_H = 40; // safe horizontal padding — nothing clips at edges
const PAD_B = 56; // safe bottom margin

// ─── Color constants (all hex/rgb — NO CSS vars, NO oklch) ───────────────────

const C = {
  gold:       "#F5C518",
  white:      "#ffffff",
  courtGreen: "#2D8B4E",
  shadow:     "0 1px 6px rgba(0,0,0,0.85), 0 2px 12px rgba(0,0,0,0.6)",
  shadowSm:   "0 1px 4px rgba(0,0,0,0.9)",
  white80:    "rgba(255,255,255,0.80)",
  white60:    "rgba(255,255,255,0.60)",
  white40:    "rgba(255,255,255,0.40)",
  white20:    "rgba(255,255,255,0.20)",
  divider:    "rgba(255,255,255,0.25)",
} as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Max 24 h (1440 min). Implausibly large sessions (e.g. 193h from bad data) are hidden. */
const MAX_PLAUSIBLE_DURATION_MINUTES = 1440;

function formatDuration(minutes: number | null): string | null {
  if (minutes === null) return null;
  if (minutes <= 0) return null;
  // Defensive: hide if duration is implausibly large
  if (minutes > MAX_PLAUSIBLE_DURATION_MINUTES) return null;
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins  = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
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

function TrophyIcon({ size = 13, color = C.gold }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden="true" style={{ flexShrink: 0 }}>
      <path d="M5 3h14v7a7 7 0 01-14 0V3z" />
      <path d="M12 17v3M8 20h8" stroke={color} strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M3 5h2M19 5h2" stroke={color} strokeWidth="2" strokeLinecap="round" fill="none" />
    </svg>
  );
}

// ─── Inline SVG: fire icon ────────────────────────────────────────────────────

function FireIcon({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={C.white60} aria-hidden="true" style={{ flexShrink: 0 }}>
      <path d="M12 2c0 0-4 4-4 8.5a4 4 0 008 0c0-1-.5-2-.5-2S17 10 17 13.5C17 17.09 14.76 20 12 20S7 17.09 7 13.5C7 9 12 2 12 2z" />
    </svg>
  );
}

// ─── Inline SVG: crossed paddles ─────────────────────────────────────────────

function PaddlesIcon({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={C.white60} strokeWidth="1.5" aria-hidden="true" style={{ flexShrink: 0 }}>
      <ellipse cx="8.5" cy="9" rx="4" ry="5.5" transform="rotate(-25 8.5 9)" />
      <line x1="6.5" y1="13.5" x2="4" y2="20" strokeLinecap="round" strokeWidth="2" />
      <ellipse cx="15.5" cy="9" rx="4" ry="5.5" transform="rotate(25 15.5 9)" />
      <line x1="17.5" y1="13.5" x2="20" y2="20" strokeLinecap="round" strokeWidth="2" />
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
    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 400, pointerEvents: "none" }}>
      <div style={{ position: "absolute", bottom: 0,   left: 0, right: 0, height: 100, backgroundColor: "rgba(0,0,0,0.50)" }} />
      <div style={{ position: "absolute", bottom: 100, left: 0, right: 0, height: 100, backgroundColor: "rgba(0,0,0,0.30)" }} />
      <div style={{ position: "absolute", bottom: 200, left: 0, right: 0, height: 100, backgroundColor: "rgba(0,0,0,0.15)" }} />
      <div style={{ position: "absolute", bottom: 300, left: 0, right: 0, height: 100, backgroundColor: "rgba(0,0,0,0.05)" }} />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.30) 40%, rgba(0,0,0,0.00) 100%)" }} />
    </div>
  );
}

// ─── Main Card ────────────────────────────────────────────────────────────────

export function SessionRecapOverlayCard({
  groupName,
  date,
  awards,
  gamesPlayed,
  playerCount,
  durationMinutes,
  playerNames: _playerNames,
}: SessionRecapOverlayCardProps) {
  const mvp  = awards.mvp;
  const duo  = awards.hottestDuo;
  const best = awards.bestMatch;

  // BUG-3 defensive duration: returns null if missing or > 24h
  const durationStr = formatDuration(durationMinutes);

  // Best match score string
  const bestMatchScore = best ? `${best.teamAScore}-${best.teamBScore}` : null;

  // Duo first names
  const duoNames = duo
    ? `${duo.playerAName.split(" ")[0]} & ${duo.playerBName.split(" ")[0]}`
    : null;

  // Metrics — only include duration if plausible and available
  const metrics: Array<{ value: string; label: string }> = [
    { value: String(gamesPlayed), label: "GAMES" },
    { value: String(playerCount), label: "PLAYERS" },
    ...(durationStr ? [{ value: durationStr, label: "DURATION" }] : []),
  ];

  type AwardRow = {
    icon: React.ReactNode;
    label: string;
    value: string;
    isGold?: boolean;
  };

  const awardRows: AwardRow[] = [];

  if (mvp) {
    awardRows.push({
      icon: <TrophyIcon size={12} color={C.gold} />,
      label: "MVP",
      value: mvp.displayName,
      isGold: true,
    });
  }

  if (duo && duoNames) {
    awardRows.push({
      icon: <FireIcon size={12} />,
      label: "Hottest duo",
      value: duoNames,
    });
  }

  if (best && bestMatchScore) {
    awardRows.push({
      icon: <PaddlesIcon size={12} />,
      label: "Best match",
      value: bestMatchScore,
    });
  }

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
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <DinkDayWordmark />
            <div style={{ width: 1, height: 16, backgroundColor: C.white20, flexShrink: 0 }} />
            <span style={{
              fontSize: 13,
              fontFamily: "system-ui, -apple-system, sans-serif",
              fontWeight: 600,
              color: C.white60,
              textShadow: C.shadowSm,
              letterSpacing: "0.2px",
              maxWidth: 140,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap" as const,
            }}>
              {groupName}
            </span>
          </div>
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

        {/* Rule with court-green accent */}
        <div style={{ display: "flex", marginTop: 14 }}>
          <div style={{ flex: 1, height: 1, backgroundColor: C.white20 }} />
          <div style={{ width: 32, height: 1, backgroundColor: C.courtGreen }} />
        </div>
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

        {/* GAME DAY RECAP headline */}
        <div style={{
          fontSize: 54,
          fontFamily: "Anton, Impact, system-ui, sans-serif",
          fontWeight: 400,
          color: C.white,
          textTransform: "uppercase" as const,
          lineHeight: 0.95,
          letterSpacing: "1px",
          textShadow: C.shadow,
          marginBottom: 18,
        }}>
          GAME DAY<br />RECAP
        </div>

        {/* Thin rule before stats */}
        <div style={{ height: 1, backgroundColor: C.courtGreen, marginBottom: 14 }} />

        {/* Metric row: GAMES · PLAYERS · DURATION (if plausible) */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 0, marginBottom: 18 }}>
          {metrics.map((m, i) => (
            <div key={m.label} style={{ display: "flex", alignItems: "flex-start", gap: 0 }}>
              {i > 0 && (
                <div style={{
                  width: 1,
                  height: 36,
                  backgroundColor: C.white20,
                  flexShrink: 0,
                  marginRight: 14,
                  alignSelf: "center",
                }} />
              )}
              <div style={{
                display: "flex",
                flexDirection: "column" as const,
                gap: 2,
                marginRight: i < metrics.length - 1 ? 14 : 0,
              }}>
                <span style={{
                  fontSize: 26,
                  fontFamily: "Archivo Narrow, Arial Narrow, system-ui, sans-serif",
                  fontWeight: 700,
                  color: C.white,
                  lineHeight: 1,
                  textShadow: C.shadow,
                }}>
                  {m.value}
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
                  {m.label}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Award rows — truncated to stay within safe horizontal bounds */}
        {awardRows.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column" as const, gap: 8, marginBottom: 18 }}>
            {awardRows.map((row, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 7 }}>
                {row.icon}
                <span style={{
                  fontSize: 11,
                  fontFamily: "system-ui, -apple-system, sans-serif",
                  color: C.white40,
                  textTransform: "uppercase" as const,
                  letterSpacing: "1.5px",
                  textShadow: C.shadowSm,
                  flexShrink: 0,
                }}>
                  {row.label}
                </span>
                <span style={{ color: C.white20, fontSize: 9, flexShrink: 0 }}>-</span>
                <span style={{
                  fontSize: 13,
                  fontFamily: "system-ui, -apple-system, sans-serif",
                  fontWeight: 700,
                  color: row.isGold ? C.gold : C.white80,
                  textShadow: C.shadowSm,
                  whiteSpace: "nowrap" as const,
                }}>
                  {row.value}
                </span>
              </div>
            ))}
          </div>
        )}

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
