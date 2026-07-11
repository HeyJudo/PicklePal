"use client";

/**
 * SessionRecapShareButton — share widget for the Session Recap overlay sticker.
 *
 * Composes OverlayShareButton with SessionRecapOverlayCard.
 * Drop this on the Final slide of GameDayRecap, the overlay step in LivePageClient,
 * and the Share section of SessionDetail.
 */

import { OverlayShareButton } from "./OverlayShareButton";
import { SessionRecapOverlayCard, type SessionRecapOverlayCardProps } from "./SessionRecapOverlayCard";

export interface SessionRecapShareButtonProps extends SessionRecapOverlayCardProps {
  /** Optional label override (default: "Share Recap") */
  readonly label?: string;
}

export function SessionRecapShareButton({
  groupName,
  date,
  awards,
  gamesPlayed,
  playerCount,
  durationMinutes,
  playerNames,
  label = "Share Recap",
}: SessionRecapShareButtonProps) {
  const dateSlug = date.toLowerCase().replace(/[\s,]+/g, "-");
  const filename = `dinkday-recap-${dateSlug}.png`;
  const shareTitle = `DinkDay Recap - ${date}`;
  const shareText = `Our DinkDay Game Day Recap - ${date}. See the full stats at dinkday.site`;

  return (
    <OverlayShareButton
      filename={filename}
      shareTitle={shareTitle}
      shareText={shareText}
      label={label}
    >
      <SessionRecapOverlayCard
        groupName={groupName}
        date={date}
        awards={awards}
        gamesPlayed={gamesPlayed}
        playerCount={playerCount}
        durationMinutes={durationMinutes}
        playerNames={playerNames}
      />
    </OverlayShareButton>
  );
}
