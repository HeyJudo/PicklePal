"use client";
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowRight, Star } from 'lucide-react';

export default function HeroSection() {
  const reduce = useReducedMotion();

  return (
    <section
      id="hero"
      className="relative min-h-[100dvh] flex items-center overflow-hidden bg-surface pt-24 clip-diagonal-bottom"
    >
      {/* Background: court-lines + gradient */}
      <div className="absolute inset-0 z-0 court-lines opacity-30 pointer-events-none" />
      <div className="absolute inset-0 z-0 bg-gradient-to-r from-surface via-surface/95 to-surface/50 pointer-events-none" />
      {/* Watermark */}
      <div
        className="absolute right-0 top-0 bottom-0 flex items-center pointer-events-none z-0 translate-x-1/3 opacity-[0.05]"
        aria-hidden="true"
      >
        <img src="/assets/logo-mark.svg" alt="" className="w-[640px] h-[640px]" />
      </div>

      <div className="max-w-[1280px] mx-auto w-full relative z-20 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center px-5 md:px-12 pb-16">
        {/* Left: headline + CTAs */}
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-6 flex flex-col items-start gap-6"
        >
          <h1 className="font-display text-[72px] md:text-[80px] leading-[1.1] text-primary-dark tracking-tighter uppercase italic relative group pb-2">
            Game day,
            <br />
            <span className="relative z-10">handled.</span>
            <motion.span
              initial={reduce ? false : { scaleX: 0, originX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.6, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="absolute bottom-2 left-0 w-full h-3 bg-celebration -z-10 rounded-sm skew-x-[-15deg]"
            />
          </h1>

          <motion.p
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="font-body text-on-surface-variant max-w-sm text-lg leading-relaxed"
          >
            Keep the games moving from first serve to final recap.
          </motion.p>

          <motion.div
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="flex flex-wrap items-center gap-4 mt-2"
          >
            <Link
              href="/sign-up"
              className="bg-primary text-on-primary font-label text-xs font-semibold uppercase tracking-wider px-8 py-4 rounded-lg hover:bg-primary-container hover:-translate-y-1 transition-all duration-300 flex items-center gap-2 shadow-[0_4px_0_#065a33] hover:shadow-[0_6px_0_#065a33] active:translate-y-1 active:shadow-none relative overflow-hidden group"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              Create Your Group <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/g/picklepal"
              className="bg-surface text-primary border-2 border-primary/20 font-label text-xs font-semibold uppercase tracking-wider px-8 py-4 rounded-lg hover:border-primary hover:bg-primary/5 transition-all duration-300 flex items-center gap-2 hover:-translate-y-1"
            >
              View Demo Group
            </Link>
          </motion.div>

          {/* Live indicator strip */}
          <motion.div
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.55 }}
            className="flex items-center gap-3 mt-2"
          >
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-60" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
            <span className="font-label text-[11px] uppercase tracking-wider text-on-surface-variant font-semibold">
              Game in progress · <span className="text-primary">Maya 11</span> vs <span className="text-primary">Jordan 9</span>
            </span>
          </motion.div>
        </motion.div>

        {/* Right: real phone screenshot + MVP chip */}
        <div className="lg:col-span-6 relative h-[620px] hidden lg:block">
          {/* Phone frame */}
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 40, rotate: -2 }}
            animate={{ opacity: 1, y: 0, rotate: -2 }}
            transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="absolute right-8 top-1/2 -translate-y-1/2 w-[268px]"
          >
            <motion.div
              animate={reduce ? {} : { y: [0, -8, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              className="relative bg-[#111] rounded-[2.8rem] p-2.5 shadow-[0_32px_64px_rgba(0,0,0,0.3)]"
            >
              <div className="rounded-[2.2rem] overflow-hidden border border-white/5">
                <Image
                  src="/screenshots/group-home-phone.webp"
                  alt="DinkDay group home"
                  width={390}
                  height={844}
                  className="w-full h-auto"
                  priority
                />
              </div>
            </motion.div>
          </motion.div>

          {/* Single floating chip: MVP */}
          <motion.div
            initial={reduce ? false : { opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <motion.div
              animate={reduce ? {} : { y: [10, -10, 10], rotate: [-4, -6, -4] }}
              transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -right-2 bottom-28 bg-primary-dark text-surface p-4 rounded-xl shadow-xl border border-white/10 z-30 flex items-center gap-3 w-[180px]"
            >
              <div className="w-10 h-10 rounded-full bg-celebration/20 flex items-center justify-center text-celebration border border-celebration/30 shrink-0">
                <Star className="w-5 h-5" />
              </div>
              <div>
                <div className="font-label text-[10px] font-semibold text-white/40 uppercase">
                  MVP Race
                </div>
                <div className="font-headline text-2xl leading-tight font-bold text-celebration">
                  Sadie 65%
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
