"use client";

import Link from "next/link";
import type { Player } from "@/lib/supabase";

interface PlayerCardProps {
  readonly player: Player;
  readonly groupSlug: string;
}

function PlayerAvatar({
  displayName,
  color,
}: {
  readonly displayName: string;
  readonly color: string | null;
}) {
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className="flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold text-white shrink-0"
      style={{ backgroundColor: color ?? "#64748B" }}
    >
      {initials}
    </div>
  );
}

export function PlayerCard({ player, groupSlug }: PlayerCardProps) {
  return (
    <Link
      href={`/g/${groupSlug}/players/${player.id}`}
      className="flex items-center gap-4 rounded-xl border border-border bg-surface p-4 hover:bg-surface-muted/50 transition-colors cursor-pointer"
    >
      <PlayerAvatar displayName={player.display_name} color={player.color} />
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
