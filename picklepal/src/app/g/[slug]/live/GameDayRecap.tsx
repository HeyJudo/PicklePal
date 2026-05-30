"use client";

import { useState } from "react";
import type { SessionAwards, MvpAward, HottestDuoAward, BestMatchAward } from "@/lib/stats";

interface RecapData {
  readonly gamesPlayed: number;
  readonly playerCount: number;
  readonly durationMinutes: number | null;
  readonly awards: SessionAwards;
  readonly playerNames: Record<string, string>;
}

interface GameDayRecapProps {
  readonly data: RecapData;
  readonly sessionId: string;
  readonly groupSlug: string;
  readonly onDone: () => void;
}

function formatDuration(minutes: number | null): string {
  if (minutes === null) return "—";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

// ─── Slide Components ────────────────────────────────────────────────────────

function SummarySlide({ gamesPlayed, playerCount, durationMinutes }: {
  readonly gamesPlayed: number;
  readonly playerCount: number;
  readonly durationMinutes: number | null;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center space-y-8">
      <div className="space-y-2">
        <p className="text-sm font-medium text-white/60 uppercase tracking-widest">
          Game Day Recap
        </p>
        <h1 className="text-4xl font-bold text-white">That&apos;s a wrap!</h1>
      </div>

      <div className="grid grid-cols-3 gap-6 w-full max-w-xs">
        <div className="flex flex-col items-center">
          <span className="text-4xl font-bold text-ball-yellow">{gamesPlayed}</span>
          <span className="text-xs text-white/60 mt-1">Games</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-4xl font-bold text-ball-yellow">{playerCount}</span>
          <span className="text-xs text-white/60 mt-1">Players</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-4xl font-bold text-ball-yellow">
            {formatDuration(durationMinutes)}
          </span>
          <span className="text-xs text-white/60 mt-1">Duration</span>
        </div>
      </div>
    </div>
  );
}

function MvpSlide({ mvp }: { readonly mvp: MvpAward }) {
  const initials = mvp.displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex flex-col items-center justify-center text-center space-y-6">
      <p className="text-sm font-medium text-white/60 uppercase tracking-widest">
        MVP of the Day
      </p>
      <span className="text-6xl">🏆</span>
      <div
        className="h-20 w-20 rounded-full flex items-center justify-center text-2xl font-bold text-white ring-4 ring-ball-yellow/50"
        style={{ backgroundColor: mvp.color ?? "#64748B" }}
      >
        {initials}
      </div>
      <div className="space-y-1">
        <h2 className="text-3xl font-bold text-white">{mvp.displayName}</h2>
        <p className="text-white/70">
          {mvp.wins} wins in {mvp.gamesPlayed} games
        </p>
        {mvp.pointDifferential > 0 && (
          <p className="text-ball-yellow font-semibold">
            +{mvp.pointDifferential} point differential
          </p>
        )}
      </div>
    </div>
  );
}

function HottestDuoSlide({ duo }: { readonly duo: HottestDuoAward }) {
  return (
    <div className="flex flex-col items-center justify-center text-center space-y-6">
      <p className="text-sm font-medium text-white/60 uppercase tracking-widest">
        Hottest Duo
      </p>
      <span className="text-6xl">🔥</span>
      <div className="space-y-1">
        <h2 className="text-3xl font-bold text-white">
          {duo.playerAName} & {duo.playerBName}
        </h2>
        <p className="text-white/70">
          {duo.wins}W–{duo.losses}L together
        </p>
        <p className="text-hype-orange font-semibold text-lg">
          {(duo.winRate * 100).toFixed(0)}% win rate
        </p>
      </div>
    </div>
  );
}

function BestMatchSlide({ match, playerNames }: {
  readonly match: BestMatchAward;
  readonly playerNames: Record<string, string>;
}) {
  const teamANames = match.teamAPlayerIds
    .map((id) => playerNames[id] ?? "Unknown")
    .join(" & ");
  const teamBNames = match.teamBPlayerIds
    .map((id) => playerNames[id] ?? "Unknown")
    .join(" & ");

  return (
    <div className="flex flex-col items-center justify-center text-center space-y-6">
      <p className="text-sm font-medium text-white/60 uppercase tracking-widest">
        Best Match
      </p>
      <span className="text-6xl">⚡</span>
      <div className="space-y-2">
        <p className="text-5xl font-bold text-white">
          {match.teamAScore}–{match.teamBScore}
        </p>
        <p className="text-white/70 text-sm">
          {teamANames}
        </p>
        <p className="text-white/50 text-xs">vs</p>
        <p className="text-white/70 text-sm">
          {teamBNames}
        </p>
        {match.scoreDifference <= 2 && (
          <p className="text-sky-blue-light font-semibold mt-2">
            Down to the wire!
          </p>
        )}
      </div>
    </div>
  );
}

function FinalSlide() {
  return (
    <div className="flex flex-col items-center justify-center text-center space-y-6">
      <span className="text-6xl">🎉</span>
      <div className="space-y-2">
        <h2 className="text-3xl font-bold text-white">Great session!</h2>
        <p className="text-white/70">See you next Game Day</p>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function GameDayRecap({ data, sessionId, groupSlug, onDone }: GameDayRecapProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Build slides dynamically based on available awards
  const slides: React.ReactNode[] = [
    <SummarySlide
      key="summary"
      gamesPlayed={data.gamesPlayed}
      playerCount={data.playerCount}
      durationMinutes={data.durationMinutes}
    />,
  ];

  if (data.awards.mvp) {
    slides.push(<MvpSlide key="mvp" mvp={data.awards.mvp} />);
  }

  if (data.awards.hottestDuo) {
    slides.push(<HottestDuoSlide key="duo" duo={data.awards.hottestDuo} />);
  }

  if (data.awards.bestMatch) {
    slides.push(
      <BestMatchSlide
        key="best"
        match={data.awards.bestMatch}
        playerNames={data.playerNames}
      />,
    );
  }

  slides.push(<FinalSlide key="final" />);

  const isLastSlide = currentSlide === slides.length - 1;

  const handleTap = () => {
    if (isLastSlide) {
      onDone();
    } else {
      setCurrentSlide((prev) => prev + 1);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex flex-col cursor-pointer select-none"
      onClick={handleTap}
    >
      {/* Progress dots */}
      <div className="flex items-center justify-center gap-1.5 pt-6 pb-4 px-4">
        {slides.map((_, i) => (
          <div
            key={i}
            className={`h-1 rounded-full transition-all duration-300 ${
              i === currentSlide
                ? "w-8 bg-white"
                : i < currentSlide
                  ? "w-4 bg-white/40"
                  : "w-4 bg-white/20"
            }`}
          />
        ))}
      </div>

      {/* Slide content */}
      <div className="flex-1 flex items-center justify-center px-8">
        {slides[currentSlide]}
      </div>

      {/* Bottom hint */}
      <div className="pb-8 text-center">
        <p className="text-xs text-white/40">
          {isLastSlide ? "Tap to finish" : "Tap to continue"}
        </p>
      </div>

      {/* Skip button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDone();
        }}
        className="absolute top-6 right-6 text-xs text-white/40 hover:text-white/70 transition-colors cursor-pointer"
      >
        Skip
      </button>
    </div>
  );
}
