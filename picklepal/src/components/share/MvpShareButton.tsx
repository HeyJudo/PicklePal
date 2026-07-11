"use client";

/**
 * MvpShareButton — share widget for the MVP overlay sticker.
 *
 * Composes OverlayShareButton with MvpOverlayCard.
 * Drop this on the MVP slide of GameDayRecap and on SessionDetail's award area.
 */

import { OverlayShareButton } from "./OverlayShareButton";
import { MvpOverlayCard, type MvpOverlayCardProps } from "./MvpOverlayCard";

export interface MvpShareButtonProps extends MvpOverlayCardProps {
  /** Optional label override (default: "Share MVP") */
  readonly label?: string;
}

export function MvpShareButton({ mvp, date, label = "Share MVP" }: MvpShareButtonProps) {
  const dateSlug = date.toLowerCase().replace(/[\s,]+/g, "-");
  const filename = `dinkday-mvp-${dateSlug}.png`;
  const shareTitle = `DinkDay MVP - ${date}`;
  const shareText = `${mvp.displayName} is today's DinkDay MVP! Check it out at dinkday.site`;

  return (
    <OverlayShareButton
      filename={filename}
      shareTitle={shareTitle}
      shareText={shareText}
      label={label}
    >
      <MvpOverlayCard mvp={mvp} date={date} />
    </OverlayShareButton>
  );
}
