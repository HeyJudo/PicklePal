import React from 'react';
import { motion, Variants } from 'motion/react';
import { HelpCircle, Users, MessageCircle } from 'lucide-react';

export default function ProblemSection() {
  const container: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const item: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
  };

  return (
    <section className="py-24 px-5 md:px-12 bg-surface-container">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        className="max-w-[1280px] mx-auto text-center mb-16"
      >
        <h2 className="font-headline text-[48px] leading-tight font-extrabold text-primary-dark mb-4 tracking-tight">
          Stop asking 'who's serving?' every three points.
        </h2>
      </motion.div>

      <motion.div 
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-50px" }}
        className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8"
      >
        <motion.div variants={item} className="bg-surface p-8 rounded-2xl shadow-sm border border-outline-variant/20 text-center relative overflow-hidden hover:shadow-md hover:-translate-y-1 transition-all duration-300">
          <div className="absolute -top-4 -right-4 text-error opacity-10 transition-transform duration-500 hover:scale-110">
            <HelpCircle className="w-32 h-32" />
          </div>
          <div className="w-16 h-16 mx-auto bg-error-container text-error rounded-full flex items-center justify-center mb-6 relative z-10">
             <HelpCircle className="w-8 h-8" />
          </div>
          <h3 className="font-headline font-bold text-xl mb-2 relative z-10">Mystery score?</h3>
          <div className="font-score text-4xl font-bold text-on-surface-variant/40 line-through decoration-error decoration-4 mt-4 tracking-wider">7-5-2?</div>
        </motion.div>

        <motion.div variants={item} className="bg-surface p-8 rounded-2xl shadow-sm border border-outline-variant/20 text-center relative overflow-hidden hover:shadow-md hover:-translate-y-1 transition-all duration-300">
           <div className="absolute -top-4 -right-4 text-error opacity-10 transition-transform duration-500 hover:scale-110 hover:rotate-12">
            <Users className="w-32 h-32" />
          </div>
          <div className="w-16 h-16 mx-auto bg-error-container text-error rounded-full flex items-center justify-center mb-6 relative z-10">
             <Users className="w-8 h-8" />
          </div>
          <h3 className="font-headline font-bold text-xl mb-2 relative z-10">Same teams again?</h3>
          <div className="flex justify-center items-center gap-2 mt-4 text-on-surface-variant/60 font-body text-base">
            <span>A+B</span> <span className="font-bold text-xl mx-1">&rarr;</span> <span>C+D</span>
            <span className="text-error font-bold ml-2 font-body text-xl">X</span>
          </div>
        </motion.div>

        <motion.div variants={item} className="bg-surface p-8 rounded-2xl shadow-sm border border-outline-variant/20 text-center relative overflow-hidden hover:shadow-md hover:-translate-y-1 transition-all duration-300">
          <div className="absolute -top-4 -right-4 text-error opacity-10 transition-transform duration-500 hover:scale-110">
            <MessageCircle className="w-32 h-32" />
          </div>
          <div className="w-16 h-16 mx-auto bg-error-container text-error rounded-full flex items-center justify-center mb-6 relative z-10">
             <MessageCircle className="w-8 h-8" />
          </div>
          <h3 className="font-headline font-bold text-xl mb-2 relative z-10">Who sat last?</h3>
          <div className="flex justify-center gap-2 mt-4">
            <div className="w-8 h-8 rounded-full bg-surface-dim border border-outline-variant flex items-center justify-center text-xs font-bold hover:bg-surface-variant transition-colors cursor-default">J</div>
            <div className="w-8 h-8 rounded-full bg-surface-dim border border-outline-variant flex items-center justify-center text-xs font-bold hover:bg-surface-variant transition-colors cursor-default">S</div>
            <div className="w-8 h-8 rounded-full bg-error-container text-error border border-error/20 flex items-center justify-center text-xs font-bold hover:bg-error/20 transition-colors cursor-default animate-pulse">?</div>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
