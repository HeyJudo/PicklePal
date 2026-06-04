import React from 'react';
import { motion, Variants } from 'motion/react';
import { UserX, MonitorSmartphone, Users } from 'lucide-react';

export default function BetaSection() {
  const container: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const item: Variants = {
    hidden: { opacity: 0, scale: 0.9 },
    show: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 100 } }
  };

  return (
    <section id="beta" className="py-24 px-5 md:px-12 bg-primary text-on-primary">
      <div className="max-w-[1280px] mx-auto text-center">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="font-headline text-[48px] font-extrabold leading-tight mb-16 tracking-tight"
        >
          Built for real pickleball crews.<br/>Now opening public beta.
        </motion.h2>

        <motion.div 
          variants={container} initial="hidden" whileInView="show" viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-4xl mx-auto"
        >
          <motion.div variants={item} className="flex flex-col items-center group">
            <UserX className="w-12 h-12 text-primary-fixed mb-6 group-hover:scale-125 transition-transform duration-300" />
            <h3 className="font-headline text-2xl font-bold">No player accounts required</h3>
          </motion.div>
          <motion.div variants={item} className="flex flex-col items-center group">
            <MonitorSmartphone className="w-12 h-12 text-primary-fixed mb-6 group-hover:scale-125 transition-transform duration-300" />
            <h3 className="font-headline text-2xl font-bold">Works courtside on phone or tablet</h3>
          </motion.div>
          <motion.div variants={item} className="flex flex-col items-center group">
            <Users className="w-12 h-12 text-primary-fixed mb-6 group-hover:scale-125 transition-transform duration-300" />
            <h3 className="font-headline text-2xl font-bold">Made for casual groups and clubs</h3>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
