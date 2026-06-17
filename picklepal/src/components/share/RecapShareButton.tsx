"use client";

/**
 * RecapShareButton
 *
 * Renders a preview of RecapShareCard (scaled down) alongside two actions:
 *   1. "Share recap" — Web Share API with file (direct-to-story on mobile).
 *      Falls back to download when Web Share Files API is not available.
 *   2. "Download" — always available as a secondary option.
 *
 * html2canvas is used to rasterise the card at scale 2 (1080×1920 output).
 * The canvas element is off-screen (visually hidden, not display:none — html2canvas
 * needs the element to be in the DOM and have layout).
 *
 * Usage:
 *   <RecapShareButton
 *     groupName="Thursday Crew"
 *     date="June 17, 2026"
 *     awards={awards}
 *     gamesPlayed={8}
 *     playerCount={6}
 *     playerNames={playerNames}
 *   />
 */

import { useRef, useState, useCallback } from "react";
import html2canvas from "html2canvas";
import { RecapShareCard, type RecapShareCardProps } from "./RecapShareCard";

// ─── Export Dimensions ────────────────────────────────────────────────────────

const BASE_W = 540;
const BASE_H = 960;
const EXPORT_SCALE = 2; // → 1080 × 1920

// ─── Component ────────────────────────────────────────────────────────────────

export function RecapShareButton(props: RecapShareCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exported, setExported] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Rasterise the card and return a Blob. */
  const rasterise = useCallback(async (): Promise<Blob> => {
    if (!cardRef.current) throw new Error("Card ref not ready");

    const canvas = await html2canvas(cardRef.current, {
      backgroundColor: null,
      scale: EXPORT_SCALE,
      useCORS: true,
      logging: false,
      // Prevent html2canvas from scrolling the page
      scrollX: 0,
      scrollY: 0,
      windowWidth: BASE_W,
      windowHeight: BASE_H,
    });

    return new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Canvas toBlob returned null"));
      }, "image/png");
    });
  }, []);

  const dateSlug = props.date.toLowerCase().replace(/[\s,]+/g, "-");
  const filename = `dinkday-recap-${dateSlug}.png`;
  const shareTitle = `DinkDay Recap - ${props.date}`;
  const shareText = `Our DinkDay Game Day Recap - ${props.date}. Check out the full stats at dinkday.site`;

  /** Try Web Share API (files), fall back to anchor download. */
  const handleShare = useCallback(async () => {
    if (isExporting) return;
    setIsExporting(true);
    setError(null);
    try {
      const blob = await rasterise();
      const file = new File([blob], filename, { type: "image/png" });

      // Feature-detect Web Share API with file support
      const canShareFiles =
        typeof navigator !== "undefined" &&
        "canShare" in navigator &&
        navigator.canShare({ files: [file] });

      if (canShareFiles) {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          files: [file],
        });
        setExported(true);
      } else {
        // Fallback: download
        triggerDownload(blob, filename);
        setExported(true);
      }
    } catch (err) {
      // User cancelled share dialog — not a real error
      if (err instanceof Error && err.name === "AbortError") {
        setExported(false);
      } else {
        setError("Export failed. Please try again.");
      }
    } finally {
      setIsExporting(false);
    }
  }, [isExporting, rasterise, filename, shareTitle, shareText]);

  /** Always-available download (secondary CTA). */
  const handleDownload = useCallback(async () => {
    if (isExporting) return;
    setIsExporting(true);
    setError(null);
    try {
      const blob = await rasterise();
      triggerDownload(blob, filename);
      setExported(true);
    } catch {
      setError("Download failed. Please try again.");
    } finally {
      setIsExporting(false);
    }
  }, [isExporting, rasterise, filename]);

  return (
    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 w-full max-w-2xl mx-auto">
      {/* Preview (scaled-down card) */}
      <div
        className="relative flex-shrink-0 overflow-hidden rounded-2xl border border-white/10"
        style={{ width: 180, height: 320 }}
        aria-label="Recap card preview"
      >
        {/* Off-screen capture target — must stay in DOM with layout */}
        <div
          ref={cardRef}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: BASE_W,
            height: BASE_H,
            transformOrigin: "top left",
            transform: `scale(${180 / BASE_W})`,
            // NOT display:none — html2canvas needs layout
            pointerEvents: "none",
          }}
          aria-hidden="true"
        >
          <RecapShareCard {...props} />
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col items-center sm:items-start gap-4 flex-1 min-w-0">
        <div className="text-center sm:text-left">
          <h3 className="text-base font-bold text-white">Share Your Recap</h3>
          <p className="text-sm text-white/50 mt-0.5">
            Post to your story or send in the group chat.
          </p>
        </div>

        {/* Primary: share (Web Share on mobile, download fallback on desktop) */}
        <button
          onClick={handleShare}
          disabled={isExporting}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-court-green px-6 py-3 text-sm font-bold text-white transition-all duration-200 hover:bg-court-green-dark disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer w-full max-w-xs"
        >
          {isExporting ? (
            <>
              <SpinnerIcon className="w-4 h-4 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <ShareIcon className="w-4 h-4" />
              Share recap
            </>
          )}
        </button>

        {/* Secondary: always-available download */}
        <button
          onClick={handleDownload}
          disabled={isExporting}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-6 py-2.5 text-sm font-semibold text-white/70 transition-all duration-200 hover:bg-white/10 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer w-full max-w-xs"
        >
          <DownloadIcon className="w-4 h-4" />
          Download PNG
        </button>

        {/* Success feedback */}
        {exported && !isExporting && (
          <p className="text-xs text-court-green font-medium">
            Recap saved!
          </p>
        )}

        {/* Error feedback */}
        {error && (
          <p className="text-xs text-red-400">
            {error}
          </p>
        )}

        {/* Hint: what this file is for */}
        <p className="text-xs text-white/30 max-w-xs text-center sm:text-left">
          9:16 PNG - perfect for Instagram and Snapchat stories.
        </p>
      </div>
    </div>
  );
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function ShareIcon({ className }: { readonly className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z" />
    </svg>
  );
}

function DownloadIcon({ className }: { readonly className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
  );
}

function SpinnerIcon({ className }: { readonly className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}
