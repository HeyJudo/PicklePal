"use client";
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowRight } from 'lucide-react';

export default function DemoSection() {
  const reduce = useReducedMotion();

  return (
    <section id="demo" className="py-24 px-5 md:px-12 bg-surface">
      <div className="max-w-[1280px] mx-auto">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mb-10"
        >
          <h2 className="font-display text-[42px] md:text-[52px] text-primary-dark tracking-tighter leading-none uppercase mb-4">
            See it before you create yours.
          </h2>
          <p className="font-body text-on-surface-variant text-lg max-w-lg">
            A real group with fictional data. Live scoring, leaderboards, match history, and recaps already filled in.
          </p>
        </motion.div>

        {/* Browser frame with real desktop screenshot */}
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-2xl overflow-hidden border border-outline-variant/30 shadow-2xl mb-8"
        >
          {/* Browser chrome */}
          <div className="bg-surface-container-high px-4 py-3 flex items-center gap-3 border-b border-outline-variant/20">
            <div className="flex gap-1.5 shrink-0">
              <div className="w-3 h-3 rounded-full bg-red-400/80" />
              <div className="w-3 h-3 rounded-full bg-yellow-400/80" />
              <div className="w-3 h-3 rounded-full bg-green-500/80" />
            </div>
            <div className="flex-1 bg-surface rounded-full px-4 py-1.5 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-outline-variant/40 shrink-0" />
              <span className="font-label text-[11px] text-on-surface-variant truncate">
                dinkday.site/g/picklepal
              </span>
            </div>
          </div>
          <div className="relative w-full">
            <Image
              src="/screenshots/group-home-desktop.webp"
              alt="DinkDay demo group home"
              width={1440}
              height={900}
              className="w-full h-auto"
              priority
            />
          </div>
        </motion.div>

        <motion.div
          initial={reduce ? false : { opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex flex-col sm:flex-row items-start sm:items-center gap-4"
        >
          <Link
            href="/g/picklepal"
            className="bg-primary text-on-primary font-label text-xs uppercase font-semibold tracking-wider px-8 py-4 rounded-lg hover:-translate-y-1 transition-all duration-300 flex items-center gap-2 shadow-[0_4px_0_#065a33] hover:shadow-[0_6px_0_#065a33] active:translate-y-1 active:shadow-none relative overflow-hidden group"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            View Demo Group <ArrowRight className="w-4 h-4" />
          </Link>
          <span className="font-body text-xs text-on-surface-variant/60">
            Demo data is fictional.
          </span>
        </motion.div>
      </div>
    </section>
  );
}
