import React from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { CheckCircle2, ArrowRight, Clock, Cloud, Star } from 'lucide-react';

export default function HeroSection() {
  return (
    <section id="hero" className="relative pt-32 pb-24 md:pt-48 md:pb-32 px-5 md:px-12 min-h-screen flex items-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-r from-surface via-surface/90 to-surface/40 z-10"></div>
        <img 
          src="https://lh3.googleusercontent.com/aida/AP1WRLueJKbY0BDV3kWCpG5K1Gveg_908VI3_7P0PeWruOWU4ONR3ebMo2aWv1prxp1D3vSDIrof7p2eR0OxHJpMfKbjQjiT2b1s27mCAjZNq3xpnv8KrY_1bjV-FJNoC4nMov9GvEZN2YSFAawIvV2P0qZUKSrTnbeYStDXlKMZf3xmguqbpRHRlhTp12ee9myiOz05541coUC9qMGWRlztYVyLlheEW55Q1BPg7esB5nUnGdvdw8RSBnaIZg" 
          alt="Pickleball court background" 
          className="w-full h-full object-cover object-center opacity-80 mix-blend-multiply scale-105" 
        />
      </div>

      <div className="max-w-[1280px] mx-auto w-full relative z-20 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left: Typography & CTAs */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="lg:col-span-6 flex flex-col items-start gap-6 relative z-30"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary-fixed text-on-surface-variant font-label text-xs font-semibold uppercase tracking-wider border border-secondary-fixed-dim/30 hover:bg-secondary-fixed-dim transition-colors cursor-default">
            <span className="w-2 h-2 rounded-full bg-accent"></span>
            Pickleball game day, organized
          </div>
          
          <h1 className="font-display text-[72px] leading-none text-primary-dark tracking-tighter uppercase italic relative group">
            Game day,<br/>
            <span className="relative z-10">handled.</span>
            <span className="absolute bottom-2 left-0 w-full h-3 bg-celebration -z-10 rounded-sm skew-x-[-15deg] group-hover:h-5 transition-all duration-300"></span>
          </h1>
          
          <p className="font-body text-on-surface-variant max-w-md text-lg">
            Keep the games moving from first serve to final recap.
          </p>

          <div className="flex flex-wrap items-center gap-4 mt-4">
            <Link href="/sign-up" className="bg-primary text-on-primary font-label text-xs font-semibold uppercase tracking-wider px-8 py-4 rounded-lg hover:bg-primary-container hover:-translate-y-1 transition-all duration-300 flex items-center gap-2 shadow-[0_4px_0_#065a33] hover:shadow-[0_6px_0_#065a33] active:translate-y-1 active:shadow-none relative overflow-hidden group">
               <span className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></span>
               Create Your Group <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/g/default" className="bg-surface text-primary border-2 border-primary/20 font-label text-xs font-semibold uppercase tracking-wider px-8 py-4 rounded-lg hover:border-primary hover:bg-primary/5 transition-all duration-300 flex items-center gap-2 hover:-translate-y-1">
                View Demo Group
            </Link>
          </div>

          <div className="flex flex-wrap items-center gap-4 mt-8 pt-6 border-t-2 border-outline-variant/30 text-on-surface-variant font-label text-xs font-semibold uppercase tracking-wider">
            {['Live scoring', 'Fair rotations', 'Recaps'].map((feature, i) => (
              <React.Fragment key={feature}>
                <span className="flex items-center gap-1 hover:text-primary transition-colors cursor-default">
                  <CheckCircle2 className="w-4 h-4 text-primary" /> {feature}
                </span>
                {i < 2 && <span className="w-1 h-1 rounded-full bg-outline-variant"></span>}
              </React.Fragment>
            ))}
          </div>
        </motion.div>

        {/* Right: Asymmetric Mockup Cluster */}
        <div className="lg:col-span-6 relative h-[600px] hidden lg:block" style={{ perspective: '1000px' }}>
          {/* Main Phone Mockup */}
          <motion.div 
            initial={{ rotate: -2, y: '-50%' }}
            animate={{ 
              rotate: [-2, 0, -2],
              y: ['-50%', '-52%', '-50%']
            }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute right-12 top-1/2 w-[320px] bg-primary-dark rounded-[2.5rem] shadow-2xl border-8 border-inverse-surface overflow-hidden z-20 hover:shadow-primary/20"
          >
            {/* App UI: Accurate Live Score */}
            <div className="bg-primary text-on-primary p-6 h-[640px] flex flex-col relative court-lines">
              <div className="absolute inset-0 bg-primary/80 z-0"></div>
              <div className="relative z-10 flex flex-col h-full">
                
                <div className="flex justify-between items-center mb-6 pt-4">
                  <span className="font-label text-xs font-semibold uppercase text-primary-fixed">Game to 11</span>
                  <div className="flex items-center gap-2 text-xs font-medium text-primary-fixed opacity-80">
                    <span className="w-2 h-2 rounded-full bg-celebration animate-pulse"></span> Live
                  </div>
                </div>

                {/* Winning Team */}
                <div className="bg-primary-dark/40 rounded-xl p-4 mb-4 border border-white/10 hover:bg-primary-dark/60 transition-colors cursor-pointer relative overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-celebration"></div>
                  <div className="flex justify-between items-center mb-1">
                    <div className="font-headline text-2xl font-bold flex items-center gap-2">
                      Maya + Gio
                    </div>
                    <div className="font-score text-[56px] leading-none font-bold text-celebration tracking-tight">11</div>
                  </div>
                  <div className="font-label text-[10px] uppercase font-semibold text-primary-fixed/80">Serving: Maya • Server 2</div>
                </div>

                {/* Losing Team */}
                <div className="bg-primary-dark/20 rounded-xl p-4 border border-white/5 opacity-80 hover:opacity-100 transition-opacity cursor-pointer">
                  <div className="flex justify-between items-center">
                    <div className="font-headline text-2xl font-bold text-white/90">Andre + Kai</div>
                    <div className="font-score text-[56px] leading-none font-bold text-white/90 tracking-tight">9</div>
                  </div>
                </div>

                <div className="mt-auto flex flex-col gap-3 pb-8">
                  <button className="bg-primary-fixed text-primary py-4 rounded-xl font-label text-xs font-semibold uppercase shadow-[0_4px_0_#7ada9b] active:translate-y-1 active:shadow-none hover:bg-primary-fixed/90 transition-all">
                      Maya + Gio won rally
                  </button>
                  <button className="bg-surface/10 text-on-primary py-4 rounded-xl font-label text-xs font-semibold uppercase hover:bg-surface/20 border border-white/20 transition-all active:scale-95">
                      Andre + Kai won rally
                  </button>
                  <div className="text-center mt-2">
                    <button className="text-white/60 font-label text-[10px] font-semibold uppercase hover:text-white underline underline-offset-2 transition-colors">Undo</button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Floating Element: Next Match */}
          <motion.div 
            initial={{ rotate: 3, y: 0 }}
            animate={{ y: [-10, 10, -10] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute right-[300px] top-32 bg-surface p-4 rounded-xl shadow-xl border border-outline-variant/30 z-30 flex items-center gap-4 w-[280px] hover:scale-105 transition-transform cursor-default"
          >
            <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="font-label text-xs font-semibold text-on-surface-variant uppercase mb-1">Next Match</div>
              <div className="font-body text-sm text-on-surface whitespace-nowrap"><span className="font-bold">Jordan + Sam</span> vs <span className="font-bold">Nina + Leo</span></div>
            </div>
          </motion.div>

          {/* Floating Element: Sync Chip */}
          <div className="absolute right-32 top-12 bg-surface-container-high px-4 py-2 rounded-full shadow-md border border-outline-variant/20 z-10 flex items-center gap-2 hover:bg-surface transition-colors cursor-default">
            <Cloud className="w-3.5 h-3.5 text-primary animate-pulse" />
            <span className="font-label text-[10px] font-semibold uppercase text-on-surface-variant">Synced · 24 rallies</span>
          </div>

          {/* Floating Element: MVP */}
          <motion.div 
            initial={{ rotate: -5, y: 0 }}
            animate={{ y: [10, -10, 10], rotate: [-4, -6, -4] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -right-8 bottom-24 bg-primary-dark text-surface p-4 rounded-xl shadow-xl border border-outline-variant/10 z-30 flex items-center gap-4 w-[200px] hover:scale-105 transition-transform cursor-default"
          >
            <div className="w-12 h-12 rounded-full bg-celebration/20 flex items-center justify-center text-celebration border border-celebration/30">
              <Star className="w-6 h-6 animate-[spin_4s_linear_infinite]" />
            </div>
            <div>
              <div className="font-label text-xs font-semibold text-surface-variant uppercase">MVP Race</div>
              <div className="font-headline text-[28px] leading-tight font-bold text-celebration">Jordan +8</div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
