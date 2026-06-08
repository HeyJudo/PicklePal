import React from 'react';
import { motion } from 'motion/react';
import { Star, Flame, BarChart2 } from 'lucide-react';

export default function DemoSection() {
  return (
    <section id="demo" className="py-24 px-5 md:px-12 bg-surface">
      <div className="max-w-[1280px] mx-auto text-center">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <h2 className="font-headline text-[48px] font-extrabold text-primary-dark mb-4">Try a fake game day before you create yours.</h2>
          <p className="font-body text-on-surface-variant text-lg max-w-2xl mx-auto mb-2">Open a fictional group and see DinkDay with live scoring, leaderboards, match history, and recaps already filled in.</p>
          <p className="font-label text-[10px] font-semibold text-outline uppercase tracking-widest mb-12">Demo data is fictional.</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }}
          className="max-w-4xl mx-auto bg-surface-container rounded-[2rem] p-8 shadow-lg border border-outline-variant/20 mb-12 relative hover:shadow-xl transition-shadow duration-300"
        >
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-on-primary font-label text-xs font-semibold uppercase tracking-wider px-4 py-1.5 rounded-full shadow-md border border-primary-dark/20 z-10">
            Demo Group: Saturday Dink Crew
          </div>

          <div className="flex justify-between items-center mb-8 border-b border-outline-variant/20 pb-4 mt-2">
            <div className="flex flex-col md:flex-row md:items-center gap-3">
              <div className="flex items-center gap-2">
                 <span className="w-3 h-3 rounded-full bg-celebration animate-pulse"></span>
                 <span className="font-headline text-xl font-bold text-primary-dark">Active Game Day</span>
              </div>
            </div>
            <div className="font-body text-sm text-on-surface-variant bg-surface px-4 py-1.5 rounded-full border border-outline-variant/30">
              Court 1 live · <span className="font-bold">Maya + Gio lead 11–9</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            <div className="bg-surface p-6 rounded-xl border border-outline-variant/20 shadow-sm hover:border-celebration/50 hover:shadow-md hover:-translate-y-1 transition-all duration-300 cursor-pointer group">
              <h4 className="font-label text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-4 flex items-center gap-2">
                <Star className="w-4 h-4 text-celebration fill-celebration group-hover:rotate-180 transition-transform" /> MVP
              </h4>
              <div className="flex items-baseline gap-2">
                <span className="font-headline text-3xl font-bold text-primary-dark group-hover:text-celebration transition-colors">Jordan</span>
                <span className="text-celebration font-bold">+8</span>
              </div>
            </div>

            <div className="bg-surface p-6 rounded-xl border border-outline-variant/20 shadow-sm hover:border-accent/50 hover:shadow-md hover:-translate-y-1 transition-all duration-300 cursor-pointer group">
              <h4 className="font-label text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-4 flex items-center gap-2">
                <Flame className="w-4 h-4 text-accent fill-accent" /> Hottest Duo
              </h4>
              <span className="font-headline text-3xl font-bold text-primary-dark group-hover:text-accent transition-colors">Maya + Gio</span>
            </div>

            <div className="bg-surface p-6 rounded-xl border border-outline-variant/20 shadow-sm hover:border-primary/50 hover:shadow-md transition-all duration-300 col-span-1 md:col-span-1 row-span-2 group">
              <h4 className="font-label text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-4 flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-primary" /> Top 3
              </h4>
              <ol className="space-y-4 font-body text-lg text-on-surface">
                <li className="flex justify-between items-center border-b border-outline-variant/10 pb-3 hover:bg-surface-variant/50 px-2 -mx-2 rounded transition-colors"><span className="font-bold flex items-center gap-3"><span className="text-sm font-label text-outline font-semibold">1</span> Jordan</span> <span className="text-sm text-on-surface-variant font-medium">82%</span></li>
                <li className="flex justify-between items-center border-b border-outline-variant/10 pb-3 hover:bg-surface-variant/50 px-2 -mx-2 rounded transition-colors"><span className="flex items-center gap-3"><span className="text-sm font-label text-outline font-semibold">2</span> Maya</span> <span className="text-sm text-on-surface-variant font-medium">75%</span></li>
                <li className="flex justify-between items-center hover:bg-surface-variant/50 px-2 -mx-2 pt-1 rounded transition-colors"><span className="flex items-center gap-3"><span className="text-sm font-label text-outline font-semibold">3</span> Sam</span> <span className="text-sm text-on-surface-variant font-medium">60%</span></li>
              </ol>
            </div>

            <div className="bg-surface p-6 rounded-xl border border-outline-variant/20 shadow-sm hover:border-primary/50 hover:shadow-md hover:-translate-y-1 transition-all duration-300 md:col-span-2 flex justify-between items-center cursor-pointer group">
              <div>
                <h4 className="font-label text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2 group-hover:text-primary transition-colors">Recent Match</h4>
                <div className="font-body text-lg text-on-surface"><span className="font-bold">Jordan + Sam</span> def. Nina + Leo</div>
              </div>
              <div className="font-score text-[40px] leading-none font-bold text-primary group-hover:scale-110 transition-transform">11-9</div>
            </div>
          </div>
        </motion.div>

        <motion.button 
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="bg-surface text-primary border-2 border-primary/20 font-label text-xs font-semibold uppercase tracking-wider px-8 py-4 rounded-lg hover:border-primary hover:bg-surface-container transition-all duration-300 flex items-center justify-center mx-auto shadow-sm hover:shadow-md hover:-translate-y-1"
        >
          View Demo Group
        </motion.button>
      </div>
    </section>
  );
}
