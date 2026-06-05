import React from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { ArrowRight, Star } from 'lucide-react';

export default function CtaSection() {
  return (
    <section className="py-32 px-5 md:px-12 bg-surface text-center overflow-hidden">
      <div className="max-w-4xl mx-auto">
        <motion.h2 
          initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="font-display text-[72px] text-primary-dark tracking-tighter leading-none uppercase italic mb-12"
        >
          Ready for your next DinkDay?
        </motion.h2>

        {/* Recap Mini Card Visual */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, rotate: 2 }} whileInView={{ opacity: 1, scale: 1, rotate: 1 }} viewport={{ once: true }}
          className="bg-surface-container-high rounded-2xl p-6 shadow-md border border-outline-variant/30 max-w-2xl mx-auto mb-16 flex flex-col md:flex-row gap-6 md:gap-0 items-center justify-between hover:rotate-0 hover:scale-105 hover:shadow-xl transition-all duration-500"
        >
          <div className="text-center px-8 border-b md:border-b-0 md:border-r border-outline-variant/40 pb-4 md:pb-0 w-full group">
            <div className="font-label text-[10px] font-semibold text-on-surface-variant uppercase tracking-widest mb-2">MVP</div>
            <div className="font-headline text-xl font-bold text-celebration flex items-center justify-center gap-2">
              <Star className="w-4 h-4 fill-celebration group-hover:animate-spin" /> Jordan
            </div>
          </div>
          <div className="text-center px-8 border-b md:border-b-0 md:border-r border-outline-variant/40 pb-4 md:pb-0 w-full group">
            <div className="font-label text-[10px] font-semibold text-on-surface-variant uppercase tracking-widest mb-2">Hottest Duo</div>
            <div className="font-headline text-xl font-bold text-primary-dark group-hover:text-accent transition-colors">Maya + Gio</div>
          </div>
          <div className="text-center px-8 w-full group">
            <div className="font-label text-[10px] font-semibold text-on-surface-variant uppercase tracking-widest mb-2">Best Match</div>
            <div className="font-score text-3xl font-bold text-primary group-hover:scale-110 transition-transform inline-block">11–9</div>
          </div>
        </motion.div>

        <motion.p 
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="font-body text-xl text-on-surface-variant mb-12 max-w-2xl mx-auto"
        >
          Create your group, invite your crew, and keep the games moving from first serve to final recap.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="flex flex-col sm:flex-row justify-center items-center gap-4"
        >
          <Link href="/sign-up" className="bg-primary text-on-primary font-label text-xs font-semibold uppercase tracking-wider px-8 py-4 rounded-lg hover:bg-primary-container hover:-translate-y-1 transition-all duration-300 flex items-center gap-2 shadow-[0_4px_0_#065a33] hover:shadow-[0_6px_0_#065a33] active:translate-y-1 active:shadow-none relative overflow-hidden group">
             <span className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></span>
             Create Your Group <ArrowRight className="w-4 h-4" />
          </Link>
          <Link href="/g/default" className="bg-surface text-primary border-2 border-primary/20 font-label text-xs font-semibold uppercase tracking-wider px-8 py-4 rounded-lg hover:border-primary hover:bg-primary/5 hover:-translate-y-1 transition-all duration-300 flex items-center gap-2">
            View Demo Group
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
