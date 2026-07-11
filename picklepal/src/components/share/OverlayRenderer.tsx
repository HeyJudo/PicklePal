"use client";

import { useRef, useState, useCallback } from "react";
import html2canvas from "html2canvas";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface OverlayData {
  readonly sessionTitle: string;
  readonly date: string;
  readonly matchCount: number;
  readonly playerCount: number;
  readonly mvpName: string | null;
}

interface OverlayRendererProps {
  readonly data: OverlayData;
  readonly onDownload?: () => void;
}

const MAX_TITLE_LENGTH = 20;

// ─── Component ───────────────────────────────────────────────────────────────

export function OverlayRenderer({ data, onDownload }: OverlayRendererProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [title, setTitle] = useState(data.sessionTitle.slice(0, MAX_TITLE_LENGTH));
  const [isExporting, setIsExporting] = useState(false);

  const handleTitleChange = useCallback((value: string) => {
    if (value.length <= MAX_TITLE_LENGTH) {
      setTitle(value);
    }
  }, []);

  const handleDownload = useCallback(async () => {
    if (!canvasRef.current || isExporting) return;

    setIsExporting(true);
    try {
      const canvas = await html2canvas(canvasRef.current, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
        logging: false,
      });

      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `dinkday-${title.toLowerCase().replace(/\s+/g, "-")}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        onDownload?.();
      }, "image/png");
    } finally {
      setIsExporting(false);
    }
  }, [title, isExporting, onDownload]);

  return (
    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-10 w-full max-w-2xl mx-auto">
      {/* Left: Preview card (compact) */}
      <div
        className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl flex-shrink-0"
        style={{ width: 200, height: 356 }}
      >
        {/* Dark preview background */}
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(180deg, #1e293b 0%, #0f172a 100%)",
          }}
        />

        {/* Scaled overlay content */}
        <div
          ref={canvasRef}
          className="absolute top-0 left-0 origin-top-left"
          style={{ width: 540, height: 960, transform: "scale(0.37)" }}
        >
          <OverlayContent
            title={title}
            date={data.date}
            matchCount={data.matchCount}
            playerCount={data.playerCount}
            mvpName={data.mvpName}
          />
        </div>
      </div>

      {/* Right: Controls */}
      <div className="flex flex-col items-center sm:items-start gap-5 flex-1">
        {/* Header */}
        <div className="text-center sm:text-left">
          <h3 className="text-lg font-bold text-white">Your Overlay</h3>
          <p className="text-sm text-white/50 mt-0.5">
            Edit the title, then download as a transparent PNG sticker.
          </p>
        </div>

        {/* Title editor */}
        <div className="w-full max-w-xs">
          <label htmlFor="overlay-title" className="block text-xs font-medium text-white/50 mb-1.5">
            Session Title
          </label>
          <div className="relative">
            <input
              id="overlay-title"
              type="text"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              maxLength={MAX_TITLE_LENGTH}
              className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-court-green/50 focus:border-court-green transition-all"
              placeholder="Game Day #2"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-white/30">
              {title.length}/{MAX_TITLE_LENGTH}
            </span>
          </div>
        </div>

        {/* How it works */}
        <div className="space-y-2 w-full max-w-xs">
          <p className="text-[11px] font-medium text-white/40 uppercase tracking-wider">How to use</p>
          <div className="flex items-start gap-2.5">
            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-court-green/20 flex items-center justify-center text-[10px] font-bold text-court-green">1</span>
            <p className="text-xs text-white/50">Download the transparent overlay</p>
          </div>
          <div className="flex items-start gap-2.5">
            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-court-green/20 flex items-center justify-center text-[10px] font-bold text-court-green">2</span>
            <p className="text-xs text-white/50">Open your photo in IG Stories</p>
          </div>
          <div className="flex items-start gap-2.5">
            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-court-green/20 flex items-center justify-center text-[10px] font-bold text-court-green">3</span>
            <p className="text-xs text-white/50">Add the PNG as a sticker on top</p>
          </div>
        </div>

        {/* Download button */}
        <button
          onClick={handleDownload}
          disabled={isExporting}
          className="inline-flex items-center gap-2 rounded-lg bg-court-green px-6 py-3 text-sm font-bold text-white shadow-lg shadow-court-green/20 transition-all duration-200 hover:bg-court-green-dark hover:shadow-xl hover:shadow-court-green/30 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer w-full max-w-xs justify-center"
        >
          <DownloadIcon className="w-4 h-4" />
          {isExporting ? "Exporting..." : "Download Overlay"}
        </button>
      </div>
    </div>
  );
}

// ─── Overlay Content (exported to PNG) ───────────────────────────────────────

function OverlayContent({
  title,
  date,
  matchCount,
  playerCount,
  mvpName,
}: {
  readonly title: string;
  readonly date: string;
  readonly matchCount: number;
  readonly playerCount: number;
  readonly mvpName: string | null;
}) {
  return (
    <div
      style={{
        width: 540,
        height: 960,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "48px 40px 56px",
        position: "relative",
      }}
    >
      {/* TOP: DinkDay branding */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
        <span
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: "white",
            textShadow: "0 2px 8px rgba(0,0,0,0.7)",
            letterSpacing: "0.5px",
          }}
        >
          <span style={{ color: "#2D8B4E" }}>D</span>inkDay
        </span>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))" }}>
          <circle cx="12" cy="12" r="9" />
          <circle cx="9" cy="9" r="1.2" fill="white" />
          <circle cx="15" cy="9" r="1.2" fill="white" />
          <circle cx="12" cy="13" r="1.2" fill="white" />
          <circle cx="8" cy="14" r="1.2" fill="white" />
          <circle cx="16" cy="14" r="1.2" fill="white" />
        </svg>
      </div>

      {/* BOTTOM: Stats cluster */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0 }}>
        {/* Gradient accent line */}
        <div
          style={{
            width: 80,
            height: 3,
            borderRadius: 4,
            background: "linear-gradient(90deg, #2D8B4E, #2196F3)",
            boxShadow: "0 0 10px rgba(45,139,78,0.5)",
            marginBottom: 16,
          }}
        />

        {/* Crossed paddles icon */}
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.2" style={{ filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.6))", marginBottom: 12 }}>
          <ellipse cx="9" cy="9" rx="4" ry="5.5" transform="rotate(-20 9 9)" />
          <line x1="7" y1="14" x2="5" y2="20" strokeWidth="1.5" strokeLinecap="round" />
          <ellipse cx="15" cy="9" rx="4" ry="5.5" transform="rotate(20 15 9)" />
          <line x1="17" y1="14" x2="19" y2="20" strokeWidth="1.5" strokeLinecap="round" />
        </svg>

        {/* Session title */}
        <div
          style={{
            fontSize: 52,
            fontWeight: 800,
            color: "white",
            textAlign: "center",
            fontStyle: "italic",
            textShadow: "0 3px 12px rgba(0,0,0,0.8), 0 1px 4px rgba(0,0,0,0.6)",
            letterSpacing: "-1px",
            lineHeight: 1.1,
            marginBottom: 8,
          }}
        >
          {title}
        </div>

        {/* Date */}
        <div
          style={{
            fontSize: 16,
            color: "rgba(255,255,255,0.7)",
            textAlign: "center",
            textShadow: "0 2px 6px rgba(0,0,0,0.6)",
            marginBottom: 24,
          }}
        >
          {date}
        </div>

        {/* Stats row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginBottom: 20 }}>
          <span style={{ fontSize: 18, fontWeight: 600, color: "white", textShadow: "0 2px 6px rgba(0,0,0,0.6)" }}>
            {matchCount} matches
          </span>
          <span style={{ fontSize: 18, color: "#2D8B4E", textShadow: "0 0 8px rgba(45,139,78,0.6)", fontWeight: 700 }}>
            ·
          </span>
          <span style={{ fontSize: 18, fontWeight: 600, color: "white", textShadow: "0 2px 6px rgba(0,0,0,0.6)" }}>
            {playerCount} players
          </span>
        </div>

        {/* MVP */}
        {mvpName && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 28 }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F5C518" strokeWidth="1.5" style={{ filter: "drop-shadow(0 0 6px rgba(245,197,24,0.6))" }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.996.178-1.768.65-2.08 1.377-.312.728-.076 1.566.548 2.308a5.584 5.584 0 003.53 1.985m0 0h.002M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.996.178 1.768.65 2.08 1.377.312.728.076 1.566-.548 2.308a5.584 5.584 0 01-3.53 1.985m0 0h-.002m.002 0c-1.514 1.238-2.48 3.12-2.48 5.228V4.5m0-.264V2.721" />
            </svg>
            <span style={{ fontSize: 22, fontWeight: 700, color: "white", textShadow: "0 2px 8px rgba(0,0,0,0.7)" }}>
              MVP: {mvpName}
            </span>
          </div>
        )}

        {/* Branding footer */}
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", textAlign: "center", textShadow: "0 1px 4px rgba(0,0,0,0.4)", letterSpacing: "1px" }}>
          dinkday.site
        </div>
      </div>
    </div>
  );
}

// ─── Icons ───────────────────────────────────────────────────────────────────

function DownloadIcon({ className }: { readonly className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
  );
}
