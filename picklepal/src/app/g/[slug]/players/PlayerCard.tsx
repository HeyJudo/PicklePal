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
      className="flex items-center gap-4 rounded-xl border border-border bg-surface p-4 hover:bg-surface-muted/50 transition-colors cursor-pointer"
    >
      <PlayerAvatar
        displayName={player.display_name}
        color={player.color}
        avatarUrl={player.avatar_url}
        size="md"
      />
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-text-primary truncate">
          {player.display_name}
        </p>
        <p className="text-xs text-text-muted mt-0.5">Tap to view stats</p>
      </div>
      <svg
        className="h-5 w-5 text-text-muted shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={2}
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="m8.25 4.5 7.5 7.5-7.5 7.5"
        />
      </svg>
    </Link>
  );
}
