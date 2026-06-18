"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { SessionAwards, MvpAward, HottestDuoAward, BestMatchAward, LongestMatchAward } from "@/lib/stats";
import { formatMatchDuration, formatSessionDuration } from "@/lib/format/duration";
import { RecapShareButton, MvpShareButton, SessionRecapShareButton } from "@/components/share";

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
  /** Display name of the group, e.g. "Thursday Crew". Falls back to groupSlug. */
  readonly groupName?: string;
  /** Formatted session date string, e.g. "June 17, 2026". */
  readonly sessionDate?: string;
  readonly onDone: () => void;
}

// ─── Slide Components ────────────────────────────────────────────────────────

function SummarySlide({ gamesPlayed, playerCount, durationMinutes }: {
  readonly gamesPlayed: number;
  readonly playerCount: number;
  readonly durationMinutes: number | null;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center space-y-8 w-full">
      <motion.div
        className="space-y-2"
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.45, ease: "easeOut" }}
      >
        <p className="text-xs font-semibold text-white/50 uppercase tracking-widest">
          DinkDay Recap
        </p>
        <h1 className="font-display text-5xl text-white leading-tight">That&apos;s a wrap!</h1>
      </motion.div>

      <div className="grid grid-cols-3 gap-6 w-full max-w-xs">
        {[
          { value: String(gamesPlayed), label: "Games", delay: 0.25 },
          { value: String(playerCount), label: "Players", delay: 0.35 },
          { value: formatSessionDuration(durationMinutes), label: "Duration", delay: 0.45 },
        ].map(({ value, label, delay }) => (
          <motion.div
            key={label}
            className="flex flex-col items-center"
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay, type: "spring", stiffness: 300, damping: 20 }}
          >
            <span className="font-display text-5xl text-ball-yellow leading-none tabular-nums">{value}</span>
            <span className="text-xs text-white/60 mt-2 font-label font-semibold uppercase tracking-widest">{label}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function MvpSlide({ mvp, date }: { readonly mvp: MvpAward; readonly date: string }) {
  const [showMvpShare, setShowMvpShare] = useState(false);

  const initials = mvp.displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex flex-col items-center justify-center text-center space-y-6 w-full">
      <motion.p
        className="text-xs font-semibold text-ball-yellow/80 uppercase tracking-widest"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.3 }}
      >
        MVP of the Day
      </motion.p>

      <motion.div
        className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-ball-yellow/20"
        initial={{ scale: 0, rotate: -30 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 280, damping: 18 }}
      >
        <svg className="w-8 h-8 text-ball-yellow" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      </motion.div>

      <motion.div
        className="h-20 w-20 rounded-full flex items-center justify-center text-2xl font-bold text-white ring-4 ring-ball-yellow/50 shadow-lg shadow-ball-yellow/30"
        style={{ backgroundColor: mvp.color ?? "#64748B" }}
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.3, type: "spring", stiffness: 260, damping: 18 }}
      >
        {initials}
      </motion.div>

      <motion.div
        className="space-y-1"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45, duration: 0.4, ease: "easeOut" }}
      >
        <h2 className="font-display text-4xl text-white leading-tight">{mvp.displayName}</h2>
        <p className="text-white/70">
          {mvp.wins} wins in {mvp.gamesPlayed} games
        </p>
        {mvp.pointDifferential > 0 && (
          <p className="text-ball-yellow font-semibold">
            +{mvp.pointDifferential} point differential
          </p>
        )}
      </motion.div>

      {/* MVP overlay share button */}
      {!showMvpShare && (
        <motion.button
          onClick={(e) => { e.stopPropagation(); setShowMvpShare(true); }}
          className="inline-flex items-center gap-2 rounded-xl border border-ball-yellow/40 bg-ball-yellow/10 px-5 py-2.5 text-sm font-bold text-ball-yellow cursor-pointer hover:bg-ball-yellow/20 transition-colors"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65, duration: 0.35, ease: "easeOut" }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z" />
          </svg>
          Share MVP
        </motion.button>
      )}

      {showMvpShare && (
        <motion.div
          className="w-full"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          onClick={(e) => e.stopPropagation()}
        >
          <MvpShareButton mvp={mvp} date={date} />
        </motion.div>
      )}
    </div>
  );
}

function HottestDuoSlide({ duo }: { readonly duo: HottestDuoAward }) {
  return (
    <div className="flex flex-col items-center justify-center text-center space-y-6 w-full">
      <motion.p
        className="text-xs font-semibold text-hype-orange/80 uppercase tracking-widest"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.3 }}
      >
        Hottest Duo
      </motion.p>

      <motion.div
        className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-hype-orange/20"
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 280, damping: 18 }}
      >
        <svg className="w-8 h-8 text-hype-orange" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.047 8.287 8.287 0 009 9.601a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 00.495-7.468 5.99 5.99 0 00-1.925 3.547 5.975 5.975 0 01-2.133-1.001A3.75 3.75 0 0012 18z" />
        </svg>
      </motion.div>

      <motion.div
        className="space-y-1"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.32, duration: 0.4, ease: "easeOut" }}
      >
        <h2 className="font-display text-4xl text-white leading-tight">
          {duo.playerAName} &amp; {duo.playerBName}
        </h2>
        <p className="text-white/70">
          {duo.wins}W–{duo.losses}L together
        </p>
      </motion.div>

      <motion.p
        className="font-display text-5xl text-hype-orange leading-none tabular-nums"
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5, type: "spring", stiffness: 250, damping: 16 }}
      >
        {(duo.winRate * 100).toFixed(0)}%
      </motion.p>
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
    <div className="flex flex-col items-center justify-center text-center space-y-6 w-full">
      <motion.p
        className="text-xs font-semibold text-sky-blue/80 uppercase tracking-widest"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.3 }}
      >
        Best Match
      </motion.p>

      <motion.div
        className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-sky-blue/20"
        initial={{ scale: 0, rotate: 20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 280, damping: 18 }}
      >
        <svg className="w-8 h-8 text-sky-blue" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5" />
        </svg>
      </motion.div>

      <motion.p
        className="font-display text-6xl text-white leading-none tabular-nums"
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, type: "spring", stiffness: 260, damping: 18 }}
      >
        {match.teamAScore}–{match.teamBScore}
      </motion.p>

      <motion.div
        className="space-y-2"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45, duration: 0.4, ease: "easeOut" }}
      >
        <p className="text-white/70 text-sm">{teamANames}</p>
        <p className="text-white/50 text-xs">vs</p>
        <p className="text-white/70 text-sm">{teamBNames}</p>
        {match.scoreDifference <= 2 && (
          <p className="text-ball-yellow font-bold mt-2">Down to the wire!</p>
        )}
      </motion.div>
    </div>
  );
}

function LongestMatchSlide({ match, playerNames }: {
  readonly match: LongestMatchAward;
  readonly playerNames: Record<string, string>;
}) {
  const teamANames = match.teamAPlayerIds
    .map((id) => playerNames[id] ?? "Unknown")
    .join(" & ");
  const teamBNames = match.teamBPlayerIds
    .map((id) => playerNames[id] ?? "Unknown")
    .join(" & ");

  return (
    <div className="flex flex-col items-center justify-center text-center space-y-6 w-full">
      <motion.p
        className="text-xs font-semibold text-ball-yellow/80 uppercase tracking-widest"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.3 }}
      >
        Marathon Match
      </motion.p>

      <motion.div
        className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-ball-yellow/20"
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 280, damping: 18 }}
      >
        <svg className="w-8 h-8 text-ball-yellow" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <path strokeLinecap="round" d="M12 7v5l3 3" />
        </svg>
      </motion.div>

      <motion.p
        className="font-display text-5xl text-ball-yellow leading-none tabular-nums"
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, type: "spring", stiffness: 260, damping: 18 }}
      >
        {formatMatchDuration(match.durationSeconds)}
      </motion.p>

      <motion.div
        className="space-y-2"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45, duration: 0.4, ease: "easeOut" }}
      >
        <p className="font-display text-3xl text-white leading-none tabular-nums">
          {match.teamAScore}–{match.teamBScore}
        </p>
        <p className="text-white/70 text-sm">{teamANames}</p>
        <p className="text-white/50 text-xs">vs</p>
        <p className="text-white/70 text-sm">{teamBNames}</p>
      </motion.div>
    </div>
  );
}

function FinalSlide({
  shareProps,
}: {
  readonly shareProps: {
    groupName: string;
    date: string;
    awards: SessionAwards;
    gamesPlayed: number;
    playerCount: number;
    durationMinutes: number | null;
    playerNames: Record<string, string>;
  } | null;
}) {
  const [showShare, setShowShare] = useState(false);

  return (
    <div className="flex flex-col items-center justify-center text-center space-y-5 w-full">
      <motion.div
        className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/15 ring-2 ring-white/25"
        initial={{ scale: 0, rotate: -45 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: 0.15, type: "spring", stiffness: 260, damping: 18 }}
      >
        <svg className="w-10 h-10 text-ball-yellow" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
          <ellipse cx="12" cy="10" rx="6" ry="7" />
          <line x1="8.5" y1="7" x2="15.5" y2="13" strokeLinecap="round" />
          <line x1="8.5" y1="10" x2="15.5" y2="10" strokeLinecap="round" />
          <line x1="8.5" y1="13" x2="15.5" y2="7" strokeLinecap="round" />
          <rect x="11" y="17" width="2" height="5.5" rx="1" fill="currentColor" stroke="none" />
        </svg>
      </motion.div>

      <motion.div
        className="space-y-2"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.45, ease: "easeOut" }}
      >
        <h2 className="font-display text-4xl text-white leading-tight">Great session!</h2>
        <p className="text-white/70 text-sm">See you next Game Day</p>
      </motion.div>

      {/* Share section — uses new transparent overlay card */}
      {shareProps && !showShare && (
        <motion.button
          onClick={(e) => { e.stopPropagation(); setShowShare(true); }}
          className="inline-flex items-center gap-2 rounded-xl bg-court-green px-6 py-3 text-sm font-bold text-white cursor-pointer hover:bg-court-green-dark transition-colors"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.35, ease: "easeOut" }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z" />
          </svg>
          Share recap
        </motion.button>
      )}

      {shareProps && showShare && (
        <motion.div
          className="w-full"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          onClick={(e) => e.stopPropagation()}
        >
          <SessionRecapShareButton
            groupName={shareProps.groupName}
            date={shareProps.date}
            awards={shareProps.awards}
            gamesPlayed={shareProps.gamesPlayed}
            playerCount={shareProps.playerCount}
            durationMinutes={shareProps.durationMinutes}
            playerNames={shareProps.playerNames}
          />
        </motion.div>
      )}

      <motion.p
        className="text-ball-yellow text-xs font-semibold"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7, duration: 0.4 }}
      >
        DinkDay - Game day, handled.
      </motion.p>
    </div>
  );
}

// ─── Slide keys for AnimatePresence ─────────────────────────────────────────

interface SlideEntry {
  readonly key: string;
  readonly node: React.ReactNode;
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function GameDayRecap({ data, sessionId: _sessionId, groupSlug, groupName, sessionDate, onDone }: GameDayRecapProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);

  // Resolve share card props
  const resolvedDate = sessionDate ?? new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  const shareProps = {
    groupName: groupName ?? groupSlug,
    date: resolvedDate,
    awards: data.awards,
    gamesPlayed: data.gamesPlayed,
    playerCount: data.playerCount,
    durationMinutes: data.durationMinutes,
    playerNames: data.playerNames,
  };

  // Build slides dynamically based on available awards
  const slides: SlideEntry[] = [
    {
      key: "summary",
      node: (
        <SummarySlide
          gamesPlayed={data.gamesPlayed}
          playerCount={data.playerCount}
          durationMinutes={data.durationMinutes}
        />
      ),
    },
  ];

  if (data.awards.mvp) {
    slides.push({ key: "mvp", node: <MvpSlide mvp={data.awards.mvp} date={resolvedDate} /> });
  }

  if (data.awards.hottestDuo) {
    slides.push({ key: "duo", node: <HottestDuoSlide duo={data.awards.hottestDuo} /> });
  }

  if (data.awards.bestMatch) {
    slides.push({
      key: "best",
      node: <BestMatchSlide match={data.awards.bestMatch} playerNames={data.playerNames} />,
    });
  }

  if (data.awards.longestMatch) {
    slides.push({
      key: "longest",
      node: <LongestMatchSlide match={data.awards.longestMatch} playerNames={data.playerNames} />,
    });
  }

  slides.push({ key: "final", node: <FinalSlide shareProps={shareProps} /> });

  const isLastSlide = currentSlide === slides.length - 1;

  const handleTap = () => {
    if (isLastSlide) {
      onDone();
    } else {
      setDirection(1);
      setCurrentSlide((prev) => prev + 1);
    }
  };

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? "100%" : "-100%",
      opacity: 0,
      scale: 0.96,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? "-100%" : "100%",
      opacity: 0,
      scale: 0.96,
    }),
  };

  return (
    <div
      className="fixed inset-0 z-[100] bg-gradient-to-b from-court-green-dark via-[#1a3a26] to-[#0e2018] flex flex-col cursor-pointer select-none overflow-hidden"
      onClick={handleTap}
    >
      {/* Progress bar indicators */}
      <div className="flex items-center justify-center gap-1.5 pt-safe pt-6 pb-4 px-6">
        {slides.map((slide, i) => (
          <div
            key={slide.key}
            className="relative h-1 rounded-full overflow-hidden flex-1 max-w-[48px] bg-white/20"
          >
            {i < currentSlide && (
              <div className="absolute inset-0 bg-white/60 rounded-full" />
            )}
            {i === currentSlide && (
              <motion.div
                className="absolute inset-0 bg-white rounded-full origin-left"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Slide content — animated with AnimatePresence */}
      <div className="flex-1 relative flex items-center justify-center px-8 overflow-hidden">
        <AnimatePresence mode="popLayout" custom={direction}>
          <motion.div
            key={slides[currentSlide].key}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 320, damping: 32, mass: 0.8 },
              opacity: { duration: 0.2 },
              scale: { duration: 0.25 },
            }}
            className="w-full flex items-center justify-center"
          >
            {slides[currentSlide].node}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom hint */}
      <div className="pb-safe pb-8 text-center">
        <motion.p
          key={isLastSlide ? "finish" : "continue"}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="text-xs text-white/40"
        >
          {isLastSlide ? "Tap to finish" : "Tap to continue"}
        </motion.p>
      </div>

      {/* Skip button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDone();
        }}
        className="absolute top-6 right-6 text-xs text-white/40 hover:text-white/70 transition-colors cursor-pointer px-2 py-1 rounded"
      >
        Skip
      </button>
    </div>
  );
}
