"use client";

import Link from "next/link";
import { PlayerAvatar } from "@/components/players";
import type { Player } from "@/lib/supabase";

interface PlayerCardProps {
  readonly player: Player;
  readonly groupSlug: string;
}

export function PlayerCard({ player, groupSlug }: PlayerCardProps) {
  return (
    <Link
      href={`/g/${groupSlug}/players/${player.id}`}
      className="flex items-center overflow-hidden rounded-xl border border-border bg-surface hover:bg-surface-muted/50 transition-all active:scale-[0.99] cursor-pointer group"
    >
      {/* Player color accent strip */}
      <div
        className="w-1.5 self-stretch shrink-0"
        style={{ backgroundColor: player.color ?? "#becabe" }}
        aria-hidden="true"
      />

      {/* Content */}
      <div className="flex items-center gap-3.5 flex-1 min-w-0 p-4">
        <PlayerAvatar
          displayName={player.display_name}
          color={player.color}
          avatarUrl={player.avatar_url}
          size="md"
        />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-text-primary truncate leading-tight">
            {player.display_name}
          </p>
          <p className="text-xs text-text-muted mt-0.5 font-label">View stats</p>
        </div>
        <svg
          className="h-4 w-4 text-text-muted shrink-0 group-hover:text-text-secondary transition-colors"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2.5}
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m8.25 4.5 7.5 7.5-7.5 7.5"
          />
        </svg>
      </div>
    </Link>
  );
}
