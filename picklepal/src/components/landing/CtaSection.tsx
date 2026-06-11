"use client";
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowRight } from 'lucide-react';

export default function CtaSection() {
  const reduce = useReducedMotion();

  return (
    <section className="py-32 px-5 md:px-12 bg-surface overflow-hidden">
      <div className="max-w-[1280px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

        {/* Left: headline + CTAs */}
        <div className="lg:col-span-7 flex flex-col gap-8">
          <motion.h2
            initial={reduce ? false : { opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="font-display text-[64px] md:text-[72px] text-primary-dark tracking-tighter leading-none uppercase italic"
          >
            Ready for your next DinkDay?
          </motion.h2>

          <motion.p
            initial={reduce ? false : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="font-body text-lg text-on-surface-variant max-w-md"
          >
            Create your group, invite your crew, and keep the games moving from first serve to final recap.
          </motion.p>

          <motion.div
            initial={reduce ? false : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-wrap gap-4"
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
              className="bg-surface text-primary border-2 border-primary/20 font-label text-xs font-semibold uppercase tracking-wider px-8 py-4 rounded-lg hover:border-primary hover:bg-primary/5 hover:-translate-y-1 transition-all duration-300 flex items-center gap-2"
            >
              View Demo Group
            </Link>
          </motion.div>
        </div>

        {/* Right: real history screenshot, tilted */}
        <motion.div
          initial={reduce ? false : { opacity: 0, x: 32, rotate: 4 }}
          whileInView={{ opacity: 1, x: 0, rotate: 3 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-5 flex justify-center lg:justify-end"
        >
          <motion.div
            animate={reduce ? {} : { y: [0, -10, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            className="w-[220px] bg-[#111] rounded-[2.2rem] p-2 shadow-2xl"
          >
            <div className="rounded-[1.8rem] overflow-hidden">
              <Image
                src="/screenshots/history-phone.png"
                alt="DinkDay match history recap"
                width={390}
                height={844}
                className="w-full h-auto"
              />
            </div>
          </motion.div>
        </motion.div>

      </div>
    </section>
  );
}
