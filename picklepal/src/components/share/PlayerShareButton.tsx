"use client";

/**
 * PlayerShareButton — share widget for a roster player's stat card.
 *
 * Composes OverlayShareButton with PlayerOverlayCard.
 * Drop this on the player profile page (/g/[slug]/players/[id]).
 */

import { OverlayShareButton } from "./OverlayShareButton";
import { PlayerOverlayCard, type PlayerCardData } from "./PlayerOverlayCard";

export interface PlayerShareButtonProps {
  readonly data: PlayerCardData;
  /** Optional label override (default: "Share card") */
  readonly label?: string;
}

function slugifyName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function PlayerShareButton({
  data,
  label = "Share card",
}: PlayerShareButtonProps) {
  const filename = `dinkday-player-${slugifyName(data.displayName)}.png`;
  const shareTitle = `${data.displayName}'s DinkDay stats`;
  const shareText = `${data.displayName}'s DinkDay stats - check it out at dinkday.site`;

  return (
    <OverlayShareButton
      filename={filename}
      shareTitle={shareTitle}
      shareText={shareText}
      label={label}
      width={540}
      height={675}
    >
      <PlayerOverlayCard data={data} />
    </OverlayShareButton>
  );
}
