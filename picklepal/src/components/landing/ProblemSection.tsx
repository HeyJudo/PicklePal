"use client";
import React from 'react';
import { motion, useReducedMotion } from 'motion/react';

export default function ProblemSection() {
  const reduce = useReducedMotion();

  return (
    <section className="px-5 md:px-12 py-16 bg-surface-container">
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-[1280px] mx-auto"
      >
        <div className="bg-[#0d2118] rounded-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2 min-h-[260px]">
          {/* Left: chaos */}
          <motion.div
            initial={reduce ? false : { opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.55, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="p-10 md:p-14 flex flex-col justify-center border-b md:border-b-0 md:border-r border-white/10"
          >
            <div className="font-score text-[80px] md:text-[96px] leading-none font-bold tracking-tight mb-4 text-white/20 line-through decoration-red-500 decoration-[6px]">
              7-5-2?
            </div>
            <p className="font-headline text-lg font-bold text-white/50">
              "Wait, who's serving?"
            </p>
            <p className="font-body text-sm text-white/25 mt-1">
              Every game. Every rotation. Same chaos.
            </p>
          </motion.div>

          {/* Right: resolution */}
          <motion.div
            initial={reduce ? false : { opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.55, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="p-10 md:p-14 flex flex-col justify-center relative border-l-[5px] border-celebration"
          >
            <motion.div
              initial={reduce ? false : { scale: 0.85, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.5, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="font-score text-[80px] md:text-[96px] leading-none font-bold text-celebration tracking-tight mb-4"
            >
              11-9
            </motion.div>
            <p className="font-headline text-lg font-bold text-white">
              Maya wins. Jordan's up next.
            </p>
            <p className="font-body text-sm text-white/40 mt-1">
              DinkDay tracks it all. No arguments.
            </p>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
