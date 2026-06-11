"use client";
import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { UserX, MonitorSmartphone, Users } from 'lucide-react';

const claims = [
  { Icon: UserX,           text: 'No player accounts required' },
  { Icon: MonitorSmartphone, text: 'Works courtside on phone or tablet' },
  { Icon: Users,           text: 'Made for casual groups and clubs' },
];

export default function BetaSection() {
  const reduce = useReducedMotion();

  return (
    <section id="beta" className="py-24 px-5 md:px-12 bg-primary text-on-primary relative overflow-hidden">
      <div className="absolute inset-0 court-lines opacity-10 pointer-events-none" />

      <div className="max-w-[1280px] mx-auto relative z-10">
        <motion.h2
          initial={reduce ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="font-headline text-[42px] md:text-[52px] font-extrabold leading-tight mb-16 tracking-tight max-w-2xl"
        >
          Built for real pickleball crews. Now in public beta.
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-16">
          {claims.map(({ Icon, text }, i) => (
            <motion.div
              key={text}
              initial={reduce ? false : { opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="flex items-start gap-5"
            >
              <Icon className="w-7 h-7 text-primary-fixed shrink-0 mt-0.5" strokeWidth={1.75} />
              <h3 className="font-headline text-xl font-bold leading-snug">{text}</h3>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
