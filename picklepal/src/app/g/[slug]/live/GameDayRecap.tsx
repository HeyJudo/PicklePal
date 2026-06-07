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
        <p className="text-xs font-semibold text-white/50 uppercase tracking-widest">
          DinkDay Recap
        </p>
        <h1 className="font-display text-5xl text-white leading-tight">That&apos;s a wrap!</h1>
      </div>

      <div className="grid grid-cols-3 gap-6 w-full max-w-xs">
        <div className="flex flex-col items-center">
          <span className="font-display text-5xl text-ball-yellow leading-none tabular-nums">{gamesPlayed}</span>
          <span className="text-xs text-white/60 mt-2 font-label font-semibold uppercase tracking-widest">Games</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="font-display text-5xl text-ball-yellow leading-none tabular-nums">{playerCount}</span>
          <span className="text-xs text-white/60 mt-2 font-label font-semibold uppercase tracking-widest">Players</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="font-display text-4xl text-ball-yellow leading-none tabular-nums">
            {formatDuration(durationMinutes)}
          </span>
          <span className="text-xs text-white/60 mt-2 font-label font-semibold uppercase tracking-widest">Duration</span>
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
      <p className="text-xs font-semibold text-ball-yellow/80 uppercase tracking-widest">
        MVP of the Day
      </p>
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-ball-yellow/20">
        <svg className="w-8 h-8 text-ball-yellow" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      </div>
      <div
        className="h-20 w-20 rounded-full flex items-center justify-center text-2xl font-bold text-white ring-4 ring-ball-yellow/50"
        style={{ backgroundColor: mvp.color ?? "#64748B" }}
      >
        {initials}
      </div>
      <div className="space-y-1">
        <h2 className="font-display text-4xl text-white leading-tight">{mvp.displayName}</h2>
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
      <p className="text-xs font-semibold text-hype-orange/80 uppercase tracking-widest">
        Hottest Duo
      </p>
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-hype-orange/20">
        <svg className="w-8 h-8 text-hype-orange" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.047 8.287 8.287 0 009 9.601a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 00.495-7.468 5.99 5.99 0 00-1.925 3.547 5.975 5.975 0 01-2.133-1.001A3.75 3.75 0 0012 18z" />
        </svg>
      </div>
      <div className="space-y-1">
        <h2 className="font-display text-4xl text-white leading-tight">
          {duo.playerAName} &amp; {duo.playerBName}
        </h2>
        <p className="text-white/70">
          {duo.wins}W–{duo.losses}L together
        </p>
        <p className="font-display text-3xl text-hype-orange leading-none tabular-nums">
          {(duo.winRate * 100).toFixed(0)}%
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
      <p className="text-xs font-semibold text-sky-blue/80 uppercase tracking-widest">
        Best Match
      </p>
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-sky-blue/20">
        <svg className="w-8 h-8 text-sky-blue" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5" />
        </svg>
      </div>
      <div className="space-y-2">
        <p className="font-display text-6xl text-white leading-none tabular-nums">
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
          <p className="text-ball-yellow font-bold mt-2">
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
      {/* Paddle icon */}
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/15 backdrop-blur-sm">
        <svg className="w-10 h-10 text-ball-yellow" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
          <ellipse cx="12" cy="10" rx="6" ry="7" />
          <line x1="8.5" y1="7" x2="15.5" y2="13" strokeLinecap="round" />
          <line x1="8.5" y1="10" x2="15.5" y2="10" strokeLinecap="round" />
          <line x1="8.5" y1="13" x2="15.5" y2="7" strokeLinecap="round" />
          <rect x="11" y="17" width="2" height="5.5" rx="1" fill="currentColor" stroke="none" />
        </svg>
      </div>
      <div className="space-y-2">
        <h2 className="font-display text-4xl text-white leading-tight">Great session!</h2>
        <p className="text-white/70">See you next Game Day</p>
        <p className="text-ball-yellow text-sm font-semibold mt-2">DinkDay · Game day, handled.</p>
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
      className="fixed inset-0 z-[100] bg-gradient-to-b from-court-green-dark via-[#1a3a26] to-[#0e2018] flex flex-col cursor-pointer select-none"
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
