"use client";

/**
 * RecapShareCard — html2canvas-safe 9:16 share card for DinkDay game day recaps.
 *
 * Design contract:
 *  - All styles are inline style={{}} objects with explicit hex/rgb values.
 *  - NO Tailwind utilities, NO CSS custom properties (oklch tokens), NO gradients
 *    that html2canvas can't handle.
 *  - NO box-shadow on critical content (html2canvas renders it inconsistently).
 *  - Solid fills only, with the exception of the court-line SVG patterns (fully
 *    inline SVG, no external refs).
 *  - Base canvas size: 540 × 960 px @ scale 2 → 1080 × 1920 output.
 *
 * Brand tokens (resolved to static hex here so html2canvas is reliable):
 *   Court green:      #2D8B4E  (dark: #1E6B3A)
 *   Sky blue:         #2196F3
 *   Ball yellow/gold: #F5C518  (used ONLY for MVP celebration)
 *   Hype orange:      #FF6B35  (Hottest Duo)
 *   Near-white:       #f8fff9
 *   Background:       #0e2018  (dark court green)
 */

import type { SessionAwards } from "@/lib/stats";

// ─── Public Props ─────────────────────────────────────────────────────────────

export interface RecapShareCardProps {
  /** Group name, e.g. "Thursday Crew" */
  readonly groupName: string;
  /** Formatted date string, e.g. "June 17, 2026" */
  readonly date: string;
  /** Session awards data */
  readonly awards: SessionAwards;
  /** Total games played */
  readonly gamesPlayed: number;
  /** Total unique players */
  readonly playerCount: number;
  /** Player name lookup by ID */
  readonly playerNames: Record<string, string>;
}

// ─── Dimension constants ──────────────────────────────────────────────────────

const W = 540;
const H = 960;

// ─── Color constants (all hex — do NOT use CSS vars here) ────────────────────

const C = {
  bg:          "#0e2018",
  bgMid:       "#132a1c",
  courtGreen:  "#2D8B4E",
  courtDark:   "#1E6B3A",
  skyBlue:     "#2196F3",
  gold:        "#F5C518",
  goldDim:     "#c99e0f",
  orange:      "#FF6B35",
  white:       "#ffffff",
  white80:     "rgba(255,255,255,0.80)",
  white60:     "rgba(255,255,255,0.60)",
  white40:     "rgba(255,255,255,0.40)",
  white15:     "rgba(255,255,255,0.15)",
  white08:     "rgba(255,255,255,0.08)",
  goldBg:      "rgba(245,197,24,0.12)",
  goldBorder:  "rgba(245,197,24,0.35)",
  greenBg:     "rgba(45,139,78,0.18)",
  greenBorder: "rgba(45,139,78,0.40)",
  blueBg:      "rgba(33,150,243,0.15)",
  blueBorder:  "rgba(33,150,243,0.35)",
  orangeBg:    "rgba(255,107,53,0.15)",
  orangeBorder:"rgba(255,107,53,0.35)",
  cardBg:      "rgba(255,255,255,0.06)",
  divider:     "rgba(255,255,255,0.10)",
  fallbackAvatar: "#64748B",
} as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

// ─── Sub-components (all inline styles, html2canvas-safe) ─────────────────────

/** DinkDay wordmark row — rendered inline, no next/image (not capturable cross-origin) */
function InlineDinkDayWordmark() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 7, justifyContent: "center" }}>
      {/* Pickleball icon inline SVG — no external src */}
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={C.white} strokeWidth="1.5">
        <circle cx="12" cy="12" r="9" />
        <circle cx="9" cy="9" r="1.3" fill={C.courtGreen} stroke="none" />
        <circle cx="15" cy="9" r="1.3" fill={C.courtGreen} stroke="none" />
        <circle cx="12" cy="13" r="1.3" fill={C.courtGreen} stroke="none" />
        <circle cx="8" cy="14" r="1.3" fill={C.white} stroke="none" />
        <circle cx="16" cy="14" r="1.3" fill={C.white} stroke="none" />
      </svg>
      <span style={{
        fontSize: 20,
        fontWeight: 700,
        color: C.white,
        letterSpacing: "0.2px",
        lineHeight: 1,
        fontFamily: "system-ui, sans-serif",
      }}>
        <span style={{ color: C.courtGreen }}>D</span>inkDay
      </span>
    </div>
  );
}

/** Court-line texture as inline SVG grid — no CSS background-image */
function CourtLinesTexture() {
  // 5x5 grid of fine court lines across the full card background
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <svg
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ position: "absolute", top: 0, left: 0 }}
      >
        {/* Vertical grid lines */}
        {[108, 216, 324, 432].map((x) => (
          <line key={`v${x}`} x1={x} y1={0} x2={x} y2={H} stroke={C.white08} strokeWidth="1" />
        ))}
        {/* Horizontal grid lines */}
        {[192, 384, 576, 768].map((y) => (
          <line key={`h${y}`} x1={0} y1={y} x2={W} y2={y} stroke={C.white08} strokeWidth="1" />
        ))}
        {/* Center court line (thicker) */}
        <line x1={W / 2} y1={0} x2={W / 2} y2={H} stroke={C.white15} strokeWidth="1.5" />
        {/* Kitchen line (no-volley zone) */}
        <line x1={0} y1={H * 0.42} x2={W} y2={H * 0.42} stroke={C.white15} strokeWidth="1" strokeDasharray="10 8" />
        {/* Service boxes */}
        <rect x={40} y={H * 0.42} width={220} height={180} stroke={C.white08} strokeWidth="1" fill="none" />
        <rect x={280} y={H * 0.42} width={220} height={180} stroke={C.white08} strokeWidth="1" fill="none" />
      </svg>
    </div>
  );
}

/** Diagonal accent bar — top right corner energy stripe */
function DiagonalAccent() {
  return (
    <div style={{ position: "absolute", top: 0, right: 0, overflow: "hidden", width: 120, height: 120, pointerEvents: "none" }}>
      <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
        {/* Three stacked diagonal stripes in top-right corner */}
        <polygon points="120,0 120,80 40,0" fill={C.courtGreen} opacity="0.25" />
        <polygon points="120,0 120,50 70,0" fill={C.courtGreen} opacity="0.20" />
        <polygon points="120,0 120,24 96,0" fill={C.gold} opacity="0.55" />
      </svg>
    </div>
  );
}

/** MVP avatar circle with initials (no external image — html2canvas cross-origin safe) */
function MvpAvatar({ name, color, size }: { name: string; color: string | null; size: number }) {
  const initials = getInitials(name);
  const bg = color ?? C.fallbackAvatar;
  return (
    <div style={{
      width: size,
      height: size,
      borderRadius: "50%",
      backgroundColor: bg,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: size * 0.33,
      fontWeight: 700,
      color: C.white,
      fontFamily: "system-ui, sans-serif",
      border: `3px solid ${C.gold}`,
      flexShrink: 0,
    }}>
      {initials}
    </div>
  );
}

/** Small avatar circle for duo players */
function SmallAvatar({ name, color, size = 32 }: { name: string; color?: string | null; size?: number }) {
  const initials = getInitials(name);
  return (
    <div style={{
      width: size,
      height: size,
      borderRadius: "50%",
      backgroundColor: color ?? C.fallbackAvatar,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: size * 0.33,
      fontWeight: 700,
      color: C.white,
      fontFamily: "system-ui, sans-serif",
      border: `2px solid ${C.white15}`,
      flexShrink: 0,
    }}>
      {initials}
    </div>
  );
}

/** Crown/trophy icon inline */
function CrownIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={C.gold} xmlns="http://www.w3.org/2000/svg">
      <path d="M2 18h20l-2-9-5 4-3-7-3 7-5-4-2 9z" />
      <rect x="2" y="19" width="20" height="2" rx="1" />
    </svg>
  );
}

/** Fire icon for Hottest Duo */
function FireIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={C.orange} xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2c0 0-4 4-4 8.5a4 4 0 0 0 8 0c0-1-0.5-2-0.5-2S17 10 17 13.5C17 17.09 14.76 20 12 20S7 17.09 7 13.5C7 9 12 2 12 2z" />
      <path d="M12 14c0 0-1.5 1.5-1.5 2.5a1.5 1.5 0 0 0 3 0C13.5 15.5 12 14 12 14z" fill={C.white} opacity="0.7" />
    </svg>
  );
}

/** Crossed paddles icon for Best Match */
function PaddlesIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={C.skyBlue} strokeWidth="1.5" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="8.5" cy="9" rx="4" ry="5.5" transform="rotate(-25 8.5 9)" />
      <line x1="6.5" y1="13.5" x2="4" y2="20" strokeLinecap="round" strokeWidth="2" />
      <ellipse cx="15.5" cy="9" rx="4" ry="5.5" transform="rotate(25 15.5 9)" />
      <line x1="17.5" y1="13.5" x2="20" y2="20" strokeLinecap="round" strokeWidth="2" />
    </svg>
  );
}

// ─── Main Card ────────────────────────────────────────────────────────────────

/**
 * The exported card at 540×960 base size.
 * Ref this element and pass to html2canvas with scale: 2.
 */
export function RecapShareCard({
  groupName,
  date,
  awards,
  gamesPlayed,
  playerCount,
  playerNames,
}: RecapShareCardProps) {
  const mvp = awards.mvp;
  const duo = awards.hottestDuo;
  const best = awards.bestMatch;

  const hasDuo = !!duo;
  const hasBest = !!best;

  const teamANames = best
    ? best.teamAPlayerIds.map((id) => playerNames[id] ?? "?").join(" & ")
    : "";
  const teamBNames = best
    ? best.teamBPlayerIds.map((id) => playerNames[id] ?? "?").join(" & ")
    : "";

  return (
    <div
      style={{
        width: W,
        height: H,
        position: "relative",
        overflow: "hidden",
        backgroundColor: C.bg,
        fontFamily: "system-ui, -apple-system, sans-serif",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* ── Background texture layer ── */}
      <CourtLinesTexture />

      {/* ── Diagonal top-right accent ── */}
      <DiagonalAccent />

      {/* ── Bottom gradient fade ── */}
      <div style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: 200,
        background: "linear-gradient(to top, #0e2018 0%, transparent 100%)",
        pointerEvents: "none",
      }} />

      {/* ── Content ── */}
      <div style={{
        position: "relative",
        zIndex: 1,
        display: "flex",
        flexDirection: "column",
        height: "100%",
        padding: "44px 36px 36px",
      }}>

        {/* HEADER: brand + group + date */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          <InlineDinkDayWordmark />
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6 }}>
            <span style={{
              fontSize: 13,
              fontWeight: 600,
              color: C.courtGreen,
              textTransform: "uppercase",
              letterSpacing: "1.5px",
              fontFamily: "system-ui, sans-serif",
            }}>
              {groupName}
            </span>
            <span style={{ color: C.white40, fontSize: 10 }}>|</span>
            <span style={{
              fontSize: 13,
              color: C.white60,
              fontFamily: "system-ui, sans-serif",
            }}>
              {date}
            </span>
          </div>
        </div>

        {/* HEADLINE */}
        <div style={{ textAlign: "center", marginTop: 28, marginBottom: 28 }}>
          <div style={{
            fontSize: 52,
            fontWeight: 900,
            color: C.white,
            lineHeight: 1.0,
            textTransform: "uppercase",
            letterSpacing: "-0.5px",
            fontFamily: "system-ui, sans-serif",
            textShadow: "0 2px 0 rgba(0,0,0,0.4)",
          }}>
            GAME DAY
          </div>
          <div style={{
            fontSize: 52,
            fontWeight: 900,
            color: C.courtGreen,
            lineHeight: 1.0,
            textTransform: "uppercase",
            letterSpacing: "-0.5px",
            fontFamily: "system-ui, sans-serif",
            textShadow: "0 2px 0 rgba(0,0,0,0.4)",
          }}>
            RECAP
          </div>
          {/* Accent underline bar */}
          <div style={{ display: "flex", justifyContent: "center", marginTop: 10, gap: 3 }}>
            <div style={{ height: 3, width: 48, borderRadius: 2, backgroundColor: C.courtGreen }} />
            <div style={{ height: 3, width: 16, borderRadius: 2, backgroundColor: C.gold }} />
            <div style={{ height: 3, width: 8, borderRadius: 2, backgroundColor: C.skyBlue }} />
          </div>
        </div>

        {/* MVP HERO SECTION */}
        {mvp ? (
          <div style={{
            backgroundColor: C.goldBg,
            border: `1.5px solid ${C.goldBorder}`,
            borderRadius: 16,
            padding: "22px 24px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 14,
            marginBottom: 16,
          }}>
            {/* MVP label with crown */}
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <CrownIcon size={22} />
              <span style={{
                fontSize: 11,
                fontWeight: 700,
                color: C.gold,
                textTransform: "uppercase",
                letterSpacing: "2px",
                fontFamily: "system-ui, sans-serif",
              }}>
                MVP of the Day
              </span>
              <CrownIcon size={22} />
            </div>

            {/* Avatar + stats row */}
            <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
              <MvpAvatar name={mvp.displayName} color={mvp.color} size={72} />
              <div>
                <div style={{
                  fontSize: 28,
                  fontWeight: 800,
                  color: C.white,
                  lineHeight: 1.1,
                  fontFamily: "system-ui, sans-serif",
                }}>
                  {mvp.displayName}
                </div>
                <div style={{
                  fontSize: 15,
                  color: C.white60,
                  marginTop: 4,
                  fontFamily: "system-ui, sans-serif",
                }}>
                  {mvp.wins}W in {mvp.gamesPlayed} games
                </div>
                {mvp.pointDifferential > 0 && (
                  <div style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: C.gold,
                    marginTop: 2,
                    fontFamily: "system-ui, sans-serif",
                  }}>
                    +{mvp.pointDifferential} pts
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : null}

        {/* SECONDARY TILES: Hottest Duo + Best Match */}
        {(hasDuo || hasBest) && (
          <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
            {/* Hottest Duo tile */}
            {hasDuo && duo && (
              <div style={{
                flex: 1,
                backgroundColor: C.orangeBg,
                border: `1.5px solid ${C.orangeBorder}`,
                borderRadius: 12,
                padding: "14px 14px",
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <FireIcon size={16} />
                  <span style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: C.orange,
                    textTransform: "uppercase",
                    letterSpacing: "1.5px",
                    fontFamily: "system-ui, sans-serif",
                  }}>
                    Hottest Duo
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <SmallAvatar name={duo.playerAName} size={28} />
                  <SmallAvatar name={duo.playerBName} size={28} />
                </div>
                <div>
                  <div style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: C.white80,
                    lineHeight: 1.2,
                    fontFamily: "system-ui, sans-serif",
                  }}>
                    {duo.playerAName.split(" ")[0]} & {duo.playerBName.split(" ")[0]}
                  </div>
                  <div style={{
                    fontSize: 18,
                    fontWeight: 800,
                    color: C.orange,
                    fontFamily: "system-ui, sans-serif",
                    marginTop: 2,
                  }}>
                    {(duo.winRate * 100).toFixed(0)}%
                  </div>
                  <div style={{
                    fontSize: 11,
                    color: C.white40,
                    fontFamily: "system-ui, sans-serif",
                  }}>
                    {duo.wins}W–{duo.losses}L
                  </div>
                </div>
              </div>
            )}

            {/* Best Match tile */}
            {hasBest && best && (
              <div style={{
                flex: 1,
                backgroundColor: C.blueBg,
                border: `1.5px solid ${C.blueBorder}`,
                borderRadius: 12,
                padding: "14px 14px",
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <PaddlesIcon size={16} />
                  <span style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: C.skyBlue,
                    textTransform: "uppercase",
                    letterSpacing: "1.5px",
                    fontFamily: "system-ui, sans-serif",
                  }}>
                    Best Match
                  </span>
                </div>
                <div style={{
                  fontSize: 30,
                  fontWeight: 800,
                  color: C.white,
                  lineHeight: 1,
                  fontFamily: "system-ui, sans-serif",
                  letterSpacing: "-0.5px",
                }}>
                  {best.teamAScore}–{best.teamBScore}
                </div>
                <div>
                  <div style={{
                    fontSize: 11,
                    color: C.white60,
                    lineHeight: 1.4,
                    fontFamily: "system-ui, sans-serif",
                  }}>
                    {teamANames}
                  </div>
                  <div style={{
                    fontSize: 11,
                    color: C.white40,
                    fontFamily: "system-ui, sans-serif",
                  }}>
                    vs {teamBNames}
                  </div>
                </div>
              </div>
            )}

            {/* If only one tile — fill the other half with stats summary */}
            {!hasDuo && hasBest && (
              <div style={{
                flex: 1,
                backgroundColor: C.greenBg,
                border: `1.5px solid ${C.greenBorder}`,
                borderRadius: 12,
                padding: "14px 14px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                gap: 4,
              }}>
                <div style={{
                  fontSize: 36,
                  fontWeight: 800,
                  color: C.courtGreen,
                  fontFamily: "system-ui, sans-serif",
                }}>
                  {gamesPlayed}
                </div>
                <div style={{
                  fontSize: 11,
                  color: C.white40,
                  textTransform: "uppercase",
                  letterSpacing: "1.5px",
                  fontFamily: "system-ui, sans-serif",
                }}>
                  Games
                </div>
              </div>
            )}

            {hasDuo && !hasBest && (
              <div style={{
                flex: 1,
                backgroundColor: C.greenBg,
                border: `1.5px solid ${C.greenBorder}`,
                borderRadius: 12,
                padding: "14px 14px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                gap: 4,
              }}>
                <div style={{
                  fontSize: 36,
                  fontWeight: 800,
                  color: C.courtGreen,
                  fontFamily: "system-ui, sans-serif",
                }}>
                  {gamesPlayed}
                </div>
                <div style={{
                  fontSize: 11,
                  color: C.white40,
                  textTransform: "uppercase",
                  letterSpacing: "1.5px",
                  fontFamily: "system-ui, sans-serif",
                }}>
                  Games
                </div>
              </div>
            )}
          </div>
        )}

        {/* SUMMARY STATS BAR */}
        <div style={{
          backgroundColor: C.cardBg,
          border: `1px solid ${C.divider}`,
          borderRadius: 10,
          padding: "14px 20px",
          display: "flex",
          justifyContent: "space-around",
          alignItems: "center",
          marginBottom: 16,
        }}>
          {[
            { value: String(gamesPlayed), label: "Games" },
            { value: String(playerCount), label: "Players" },
          ].map(({ value, label }, i) => (
            <div key={label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
              <span style={{
                fontSize: 32,
                fontWeight: 800,
                color: C.gold,
                fontFamily: "system-ui, sans-serif",
                lineHeight: 1,
              }}>
                {value}
              </span>
              <span style={{
                fontSize: 10,
                fontWeight: 600,
                color: C.white40,
                textTransform: "uppercase",
                letterSpacing: "1.5px",
                fontFamily: "system-ui, sans-serif",
              }}>
                {label}
              </span>
            </div>
          ))}
        </div>

        {/* SPACER — pushes footer to bottom */}
        <div style={{ flex: 1 }} />

        {/* FOOTER */}
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 4,
          paddingTop: 12,
          borderTop: `1px solid ${C.divider}`,
        }}>
          <span style={{
            fontSize: 13,
            fontWeight: 700,
            color: C.white60,
            letterSpacing: "0.5px",
            fontFamily: "system-ui, sans-serif",
          }}>
            dinkday.site
          </span>
          <span style={{
            fontSize: 11,
            color: C.white40,
            letterSpacing: "0.5px",
            fontFamily: "system-ui, sans-serif",
          }}>
            Game day, handled.
          </span>
        </div>
      </div>
    </div>
  );
}
