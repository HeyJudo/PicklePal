import React from 'react';
import { motion } from 'motion/react';
import { Star } from 'lucide-react';

export default function FeaturesSection() {
  return (
    <section id="features" className="py-24 px-5 md:px-12 bg-surface-container">
      <div className="max-w-[1280px] mx-auto space-y-24">
        
        {/* Feature 1: Live Scoring */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
          >
            <h3 className="font-headline text-[32px] font-bold text-primary-dark mb-4">Live Scoring</h3>
            <p className="text-on-surface-variant text-lg">Keep everyone on the same page, whether they're on the court or waiting their turn.</p>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
            className="bg-primary text-on-primary rounded-3xl p-6 shadow-md border border-outline-variant/20 flex flex-col items-center justify-center h-64 relative overflow-hidden court-lines hover:shadow-xl transition-all"
          >
            <div className="absolute inset-0 bg-primary/80"></div>
            <div className="relative z-10 w-full max-w-[240px]">
              <div className="bg-primary-dark/40 rounded-lg p-3 mb-2 flex justify-between items-center border border-white/10 hover:bg-primary-dark/60 transition-colors">
                <span className="font-headline text-lg font-bold">Team A</span>
                <span className="font-score text-3xl font-bold text-celebration animate-pulse tracking-wide">11</span>
              </div>
              <div className="bg-primary-dark/20 rounded-lg p-3 mb-4 flex justify-between items-center border border-white/5 hover:bg-primary-dark/40 transition-colors">
                <span className="font-headline text-lg font-bold">Team B</span>
                <span className="font-score text-3xl font-bold tracking-wide">9</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="h-8 bg-primary-fixed rounded hover:bg-primary-fixed/80 transition-colors"></div>
                <div className="h-8 bg-surface/10 border border-white/20 rounded hover:bg-surface/20 transition-colors"></div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Feature 2: Rotations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center lg:flex-row-reverse">
          <motion.div className="lg:order-2" initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <h3 className="font-headline text-[32px] font-bold text-primary-dark mb-4">Fair Rotations</h3>
            <p className="text-on-surface-variant text-lg">No more guessing who's up next. Our algorithm ensures everyone plays with everyone.</p>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
            className="bg-surface rounded-3xl p-8 shadow-sm border border-outline-variant/20 flex flex-col items-center justify-center h-64 lg:order-1 relative hover:shadow-md transition-shadow"
          >
            <div className="w-full max-w-[300px] bg-surface-container rounded-xl p-4 border border-outline-variant/30 mb-6 hover:border-primary/50 transition-colors shadow-sm">
              <div className="text-center font-label text-[10px] font-semibold text-on-surface-variant uppercase mb-2 tracking-widest">Court 1</div>
              <div className="flex justify-between items-center text-sm font-bold font-headline">
                <span>Maya + Gio</span> <span className="text-outline-variant font-label text-xs uppercase px-2">vs</span> <span>Andre + Kai</span>
              </div>
            </div>
            
            <div className="w-full max-w-[280px] flex items-center justify-center gap-3">
              <span className="font-label text-[10px] uppercase font-semibold text-on-surface-variant">Bench:</span>
              <div className="flex -space-x-3">
                <div className="w-10 h-10 rounded-full bg-primary-fixed text-primary-dark border-2 border-surface flex items-center justify-center text-sm font-bold hover:-translate-y-1 hover:z-10 transition-transform shadow-sm">J</div>
                <div className="w-10 h-10 rounded-full bg-secondary-fixed text-on-secondary-container border-2 border-surface flex items-center justify-center text-sm font-bold hover:-translate-y-1 hover:z-10 transition-transform shadow-sm">S</div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Feature 3: Leaderboards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <h3 className="font-headline text-[32px] font-bold text-primary-dark mb-4">Leaderboards & Recaps</h3>
            <p className="text-on-surface-variant text-lg">Track wins, points, and who the real MVP is at the end of the day.</p>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
            className="bg-primary-dark rounded-3xl p-8 shadow-xl border border-outline-variant/20 flex flex-col items-center justify-center h-64 relative overflow-hidden group hover:shadow-2xl transition-all"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(246,195,67,0.1),transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
            <div className="w-full max-w-[260px] bg-surface/5 rounded-xl p-5 border border-white/10 backdrop-blur-sm group-hover:border-celebration/30 transition-colors relative z-10">
              <div className="flex items-center gap-4 mb-5 border-b border-white/5 pb-4">
                <div className="w-12 h-12 rounded-full bg-celebration flex items-center justify-center text-primary-dark shadow-[0_0_15px_rgba(246,195,67,0.4)] group-hover:shadow-[0_0_25px_rgba(246,195,67,0.6)] transition-shadow duration-300">
                  <Star className="w-6 h-6 group-hover:rotate-[360deg] transition-transform duration-1000 fill-primary-dark" />
                </div>
                <div>
                  <div className="font-label text-[10px] font-semibold text-surface-variant uppercase tracking-widest">MVP of the Day</div>
                  <div className="font-headline text-2xl font-bold text-celebration tracking-tight">Jordan</div>
                </div>
              </div>
              <div className="space-y-3 font-body">
                <div className="flex justify-between text-sm text-surface-dim hover:text-white transition-colors cursor-default"><span className="font-bold">1. Jordan</span><span>82% Win</span></div>
                <div className="flex justify-between text-sm text-surface-dim/70 hover:text-white transition-colors cursor-default"><span>2. Maya</span><span>75% Win</span></div>
                <div className="flex justify-between text-sm text-surface-dim/50 hover:text-white transition-colors cursor-default"><span>3. Sam</span><span>60% Win</span></div>
              </div>
            </div>
          </motion.div>
        </div>

      </div>
    </section>
  );
}
