"use client";

/**
 * OverlayShareButton — generic rasterise-and-share orchestrator for DinkDay
 * transparent overlay sticker cards.
 *
 * BUG-1 FIX (low-quality export): html2canvas now captures a fully off-screen
 * node rendered at the true 540×960 base size with NO transform applied to it.
 * The on-screen preview uses a SEPARATE scaled div (transform: scale()) for
 * visual preview only — it is never passed to html2canvas.
 *
 * Export pipeline:
 *   1. Off-screen capture node: position fixed; left -10000px; top 0;
 *      width 540px; height 960px; NO transform.
 *   2. html2canvas(captureNode, { backgroundColor: null, scale: 3, useCORS: true,
 *      windowWidth: 540, windowHeight: 960 }) → 1620×2880 crisp PNG.
 *   3. Tries Web Share API with the PNG File (native share sheet on mobile).
 *   4. Falls back to anchor download on desktop / unsupported browsers.
 *
 * Font safety: awaits document.fonts.ready + explicit loads for Anton and
 * Archivo Narrow at all sizes used on the card before rasterising.
 */

import { useRef, useState, useCallback, type ReactNode } from "react";
import html2canvas from "html2canvas";

// ─── Dimension constants ──────────────────────────────────────────────────────

const DEFAULT_W = 540;
const DEFAULT_H = 960;
const EXPORT_SCALE = 3; // → 1620 × 2880 crisp story quality

// ─── Font loading helpers ─────────────────────────────────────────────────────

/**
 * Preload Anton and Archivo Narrow before html2canvas so the export
 * never renders with a fallback system font.
 */
async function preloadFonts(): Promise<void> {
  if (typeof document === "undefined") return;

  await document.fonts.ready;

  const fontLoads: Promise<FontFace[]>[] = [
    document.fonts.load("400 80px Anton"),
    document.fonts.load("400 62px Anton"),
    document.fonts.load("400 54px Anton"),
    document.fonts.load("700 20px Anton"),
    document.fonts.load("700 28px 'Archivo Narrow'"),
    document.fonts.load("700 26px 'Archivo Narrow'"),
    // Player card hero stat + name — bigger Anton sizes
    document.fonts.load("400 140px Anton"),
    document.fonts.load("400 120px Anton"),
    document.fonts.load("400 70px Anton"),
    document.fonts.load("400 58px Anton"),
    document.fonts.load("400 46px Anton"),
    document.fonts.load("700 22px 'Archivo Narrow'"),
  ];

  await Promise.allSettled(fontLoads);
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface OverlayShareButtonProps {
  /** The card component to rasterise (MvpOverlayCard or SessionRecapOverlayCard) */
  readonly children: ReactNode;
  /** Used in the download filename */
  readonly filename: string;
  /** Web Share API share title */
  readonly shareTitle: string;
  /** Web Share API share text */
  readonly shareText: string;
  /** Primary button label, e.g. "Share MVP" or "Share Recap" */
  readonly label?: string;
  /** Preview width in px for the on-screen thumbnail (default 160) */
  readonly previewWidth?: number;
  /** Capture node width in px (default 540) */
  readonly width?: number;
  /** Capture node height in px (default 960) */
  readonly height?: number;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function OverlayShareButton({
  children,
  filename,
  shareTitle,
  shareText,
  label = "Share",
  previewWidth = 160,
  width = DEFAULT_W,
  height = DEFAULT_H,
}: OverlayShareButtonProps) {
  // captureRef → off-screen full-size node (the one html2canvas reads)
  const captureRef = useRef<HTMLDivElement>(null);

  const [isExporting, setIsExporting] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const previewHeight = Math.round(previewWidth * (height / width));
  const previewScale = previewWidth / width;

  /** Preload fonts, then rasterise the off-screen full-size card, return a Blob. */
  const rasterise = useCallback(async (): Promise<Blob> => {
    if (!captureRef.current) throw new Error("Capture ref not ready");

    // Preload Anton + Archivo Narrow before rasterising
    await preloadFonts();

    // Capture the off-screen node — it is 540×960 with NO transform applied
    const canvas = await html2canvas(captureRef.current, {
      backgroundColor: null, // transparent PNG
      scale: EXPORT_SCALE, // → 3x base size
      useCORS: true,
      logging: false,
      scrollX: 0,
      scrollY: 0,
      windowWidth: width,
      windowHeight: height,
    });

    return new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Canvas toBlob returned null"));
      }, "image/png");
    });
  }, [width, height]);

  /** Try Web Share API (files), fall back to anchor download. */
  const handleShare = useCallback(async () => {
    if (isExporting) return;
    setIsExporting(true);
    setError(null);
    setDownloaded(false);

    try {
      const blob = await rasterise();
      const file = new File([blob], filename, { type: "image/png" });

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
      } else {
        // Desktop / unsupported: download instead
        triggerDownload(blob, filename);
        setDownloaded(true);
      }
    } catch (err) {
      // User cancelled share dialog — not an error
      if (err instanceof Error && err.name === "AbortError") {
        // no-op
      } else {
        setError("Export failed. Try again.");
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
    setDownloaded(false);

    try {
      const blob = await rasterise();
      triggerDownload(blob, filename);
      setDownloaded(true);
    } catch {
      setError("Download failed. Try again.");
    } finally {
      setIsExporting(false);
    }
  }, [isExporting, rasterise, filename]);

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      {/* ── Off-screen capture target (full 540×960, NO transform) ── */}
      {/*    Fixed far off-screen so it has layout but is never visible.    */}
      <div
        ref={captureRef}
        style={{
          position: "fixed",
          left: -10000,
          top: 0,
          width,
          height,
          // NO transform — this is what html2canvas captures at true size
          pointerEvents: "none",
          zIndex: -1,
        }}
        aria-hidden="true"
      >
        {children}
      </div>

      {/* ── Preview thumbnail (scaled for display only, NOT captured) ── */}
      <div
        className="relative flex-shrink-0 overflow-hidden rounded-xl border border-white/10"
        style={{ width: previewWidth, height: previewHeight }}
        aria-label="Overlay sticker preview"
      >
        {/* Checkerboard to show transparency */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "repeating-conic-gradient(#1e293b 0% 25%, #0f172a 0% 50%)",
            backgroundSize: "12px 12px",
          }}
        />
        {/* Scaled visual clone — display only */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width,
            height,
            transformOrigin: "top left",
            transform: `scale(${previewScale})`,
            pointerEvents: "none",
          }}
          aria-hidden="true"
        >
          {children}
        </div>
      </div>

      {/* ── Action row: Share + Download ── */}
      <div className="flex items-center gap-2 w-full">
        {/* Primary: Share (Web Share on mobile, download on desktop) */}
        <button
          onClick={handleShare}
          disabled={isExporting}
          className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-court-green px-4 py-2.5 text-sm font-bold text-white transition-all duration-150 hover:brightness-110 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {isExporting ? (
            <>
              <SpinnerIcon className="w-4 h-4 animate-spin" />
              <span>Exporting...</span>
            </>
          ) : (
            <>
              <ShareIcon className="w-4 h-4" />
              <span>{label}</span>
            </>
          )}
        </button>

        {/* Secondary: Download (icon-only button) */}
        <button
          onClick={handleDownload}
          disabled={isExporting}
          title="Download PNG"
          aria-label="Download PNG"
          className="inline-flex items-center justify-center rounded-lg border border-white/15 bg-white/5 p-2.5 text-white/60 transition-all duration-150 hover:bg-white/10 hover:text-white active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          <DownloadIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Transient confirmation — disappears on next action */}
      {downloaded && !isExporting && (
        <p className="text-xs text-court-green font-medium">Saved to your device!</p>
      )}

      {/* Error */}
      {error && <p className="text-xs text-red-400">{error}</p>}
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
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z"
      />
    </svg>
  );
}

function DownloadIcon({ className }: { readonly className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
      />
    </svg>
  );
}

function SpinnerIcon({ className }: { readonly className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" aria-hidden="true">
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}
