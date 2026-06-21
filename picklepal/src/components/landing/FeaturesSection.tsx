"use client";
import React from 'react';
import Image from 'next/image';
import { motion, useReducedMotion } from 'motion/react';

export default function FeaturesSection() {
  const reduce = useReducedMotion();

  return (
    <section id="features" className="py-24 px-5 md:px-12 bg-surface-container">
      <div className="max-w-[1280px] mx-auto space-y-20">

        {/* Feature 1: Live Scoring — text left, phone right */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={reduce ? false : { opacity: 0, x: -28 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col gap-5"
          >
            <div className="w-10 h-1 bg-primary rounded-full" />
            <h3 className="font-display text-[36px] uppercase text-primary-dark leading-tight tracking-tighter">
              Live Scoring
            </h3>
            <p className="text-on-surface-variant text-lg leading-relaxed max-w-md">
              Keep everyone on the same page. Tap a winner, the score updates for the whole crew instantly.
            </p>
            <ul className="flex flex-col gap-3">
              {['One tap per rally', 'Undo at any time', 'Everyone sees it live'].map((pt) => (
                <li key={pt} className="flex items-center gap-2.5 text-on-surface-variant font-body text-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                  {pt}
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={reduce ? false : { opacity: 0, x: 28 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="flex justify-center lg:justify-end"
          >
            <div className="w-full rounded-xl overflow-hidden border border-outline-variant/30 shadow-xl">
              {/* Browser chrome */}
              <div className="bg-surface-container-high px-3 py-2 flex items-center gap-2 border-b border-outline-variant/20">
                <div className="flex gap-1 shrink-0">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                </div>
                <div className="flex-1 bg-surface rounded-full px-3 py-1 flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-outline-variant/40 shrink-0" />
                  <span className="font-label text-[10px] text-on-surface-variant truncate">dinkday.site/g/picklepal</span>
                </div>
              </div>
              <div className="relative w-full overflow-hidden max-h-[280px]">
                <Image
                  src="/screenshots/features-desktop.webp"
                  alt="DinkDay group home with live stats"
                  width={1440}
                  height={900}
                  className="w-full h-auto object-top"
                />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Feature 2: Fair Rotations — mockup left, text right */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={reduce ? false : { opacity: 0, x: -28 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-3xl overflow-hidden border border-outline-variant/20 shadow-sm lg:order-1"
          >
            <Image
              src="/screenshots/fair-rotations.png"
              alt="DinkDay fair rotations showing court matchups and bench queue"
              width={800}
              height={500}
              className="w-full h-auto"
            />
          </motion.div>

          <motion.div
            initial={reduce ? false : { opacity: 0, x: 28 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col gap-5 lg:order-2"
          >
            <div className="w-10 h-1 bg-accent rounded-full" />
            <h3 className="font-display text-[36px] uppercase text-primary-dark leading-tight tracking-tighter">
              Fair Rotations
            </h3>
            <p className="text-on-surface-variant text-lg leading-relaxed max-w-md">
              No more guessing who's up next. The algorithm ensures everyone plays with everyone.
            </p>
            <ul className="flex flex-col gap-3">
              {['No repeated pairings', 'Bench queue always visible', 'Works for any group size'].map((pt) => (
                <li key={pt} className="flex items-center gap-2.5 text-on-surface-variant font-body text-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                  {pt}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>

      {/* Feature 3: Leaderboards — full-width dark band */}
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 32 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-[1280px] mx-auto mt-20"
      >
        <div className="bg-primary-dark rounded-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-2 min-h-[340px] relative">
          <div className="absolute inset-0 court-lines opacity-20 pointer-events-none" />

          {/* Left: copy */}
          <div className="relative z-10 p-10 md:p-14 flex flex-col justify-center gap-5">
            <div className="w-10 h-1 bg-celebration rounded-full" />
            <h3 className="font-display text-[36px] uppercase text-white leading-tight tracking-tighter">
              Leaderboards and Recaps
            </h3>
            <p className="text-white/60 text-lg leading-relaxed max-w-sm">
              Track wins, streaks, and who the real MVP is at the end of every session.
            </p>
            <ul className="flex flex-col gap-3">
              {['Win rate over time', 'Hottest duo each session', 'Full match history'].map((pt) => (
                <li key={pt} className="flex items-center gap-2.5 text-white/50 font-body text-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-celebration shrink-0" />
                  {pt}
                </li>
              ))}
            </ul>
          </div>

          {/* Right: real leaderboard screenshot */}
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 flex items-end justify-center pt-10 px-10 overflow-hidden"
          >
            <div className="w-[220px] bg-[#111] rounded-t-[2.2rem] p-2 shadow-2xl">
              <div className="rounded-t-[1.8rem] overflow-hidden">
                <Image
                  src="/screenshots/leaderboard-phone.webp"
                  alt="DinkDay leaderboard"
                  width={390}
                  height={844}
                  className="w-full h-auto"
                />
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
