"use client";
import React from 'react';
import Image from 'next/image';
import { motion, useReducedMotion } from 'motion/react';

interface Step {
  verb: string;
  label: string;
  src: string;
  alt: string;
  position?: string;
}

const steps: Step[] = [
  {
    verb: 'Pick',
    label: "who's playing",
    src: '/screenshots/workflow-pick.webp',
    alt: 'Player selection screen',
    position: 'object-top',
  },
  {
    verb: 'Rotate',
    label: 'fairly',
    src: '/screenshots/workflow-rotate.webp',
    alt: 'Court positions and rotation screen',
    position: 'object-top',
  },
  {
    verb: 'Score',
    label: 'live',
    src: '/screenshots/workflow-score.webp',
    alt: 'Live scoring screen',
    position: 'object-top',
  },
  {
    verb: 'Recap',
    label: 'the day',
    src: '/screenshots/workflow-recap.webp',
    alt: 'Session recap screen',
    position: 'object-center',
  },
];

export default function WorkflowSection() {
  const reduce = useReducedMotion();

  return (
    <section id="how-it-works" className="py-24 px-5 md:px-12 bg-surface relative overflow-hidden">
      <div className="max-w-[1280px] mx-auto">
        <motion.h2
          initial={reduce ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="font-display text-[42px] md:text-[52px] text-primary-dark mb-12 tracking-tighter leading-none uppercase"
        >
          From first serve to final recap.
        </motion.h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={reduce ? false : { opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col gap-3 group"
            >
              {/* Preview card */}
              <div className="rounded-xl overflow-hidden bg-surface-container border border-outline-variant/20 h-[200px]">
                <div className="relative w-full h-full">
                  <Image
                    src={step.src}
                    alt={step.alt}
                    fill
                    className={`object-cover ${step.position ?? 'object-top'} group-hover:scale-105 transition-transform duration-500`}
                  />
                </div>
              </div>
              {/* Step label */}
              <div className="flex items-baseline gap-2">
                <span className="font-display text-[28px] uppercase text-primary-dark tracking-tighter leading-none">
                  {step.verb}
                </span>
                <span className="font-label text-xs font-semibold uppercase tracking-wide text-on-surface-variant">{step.label}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
