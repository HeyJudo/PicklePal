// ─── Existing (preserved) ────────────────────────────────────────────────────
export { OverlayRenderer } from "./OverlayRenderer";
export type { OverlayData } from "./OverlayRenderer";

// RecapShareCard + RecapShareButton remain for the dark full-background card flow
export { RecapShareCard } from "./RecapShareCard";
export type { RecapShareCardProps } from "./RecapShareCard";
export { RecapShareButton } from "./RecapShareButton";

// ─── New transparent overlay stickers ────────────────────────────────────────

// Cards (html2canvas targets)
export { MvpOverlayCard } from "./MvpOverlayCard";
export type { MvpOverlayCardProps } from "./MvpOverlayCard";
export { SessionRecapOverlayCard } from "./SessionRecapOverlayCard";
export type { SessionRecapOverlayCardProps } from "./SessionRecapOverlayCard";
export { PlayerOverlayCard } from "./PlayerOverlayCard";
export type { PlayerOverlayCardProps, PlayerCardData } from "./PlayerOverlayCard";

// Generic rasterise-and-share orchestrator
export { OverlayShareButton } from "./OverlayShareButton";
export type { OverlayShareButtonProps } from "./OverlayShareButton";

// Convenience wrappers (card + share button composed)
export { MvpShareButton } from "./MvpShareButton";
export type { MvpShareButtonProps } from "./MvpShareButton";
export { SessionRecapShareButton } from "./SessionRecapShareButton";
export type { SessionRecapShareButtonProps } from "./SessionRecapShareButton";
export { PlayerShareButton } from "./PlayerShareButton";
export type { PlayerShareButtonProps } from "./PlayerShareButton";
