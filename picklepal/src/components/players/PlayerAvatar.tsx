"use client";

import Image from "next/image";

interface PlayerAvatarProps {
  readonly displayName: string;
  readonly color: string | null;
  readonly avatarUrl: string | null;
  readonly size?: "sm" | "md" | "lg" | "xl";
  readonly className?: string;
}

const sizeClasses = {
  sm: "h-8 w-8 text-xs",
  md: "h-12 w-12 text-sm",
  lg: "h-16 w-16 text-xl",
  xl: "h-24 w-24 text-2xl",
} as const;

const imageSizes = {
  sm: 32,
  md: 48,
  lg: 64,
  xl: 96,
} as const;

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function PlayerAvatar({
  displayName,
  color,
  avatarUrl,
  size = "md",
  className = "",
}: PlayerAvatarProps) {
  const sizeClass = sizeClasses[size];
  const imgSize = imageSizes[size];

  if (avatarUrl) {
    return (
      <div
        className={`relative overflow-hidden rounded-full shrink-0 ${sizeClass} ${className}`}
      >
        <Image
          src={avatarUrl}
          alt={`${displayName}'s avatar`}
          width={imgSize}
          height={imgSize}
          className="h-full w-full object-cover"
          unoptimized
        />
      </div>
    );
  }

  return (
    <div
      className={`flex items-center justify-center rounded-full font-bold text-white shrink-0 ${sizeClass} ${className}`}
      style={{ backgroundColor: color ?? "#64748B" }}
      aria-label={`${displayName}'s avatar`}
    >
      {getInitials(displayName)}
    </div>
  );
}
