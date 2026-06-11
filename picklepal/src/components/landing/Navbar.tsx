"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { motion, useScroll, useMotionValueEvent } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import Logo from '@/components/Logo';

export default function Navbar() {
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);

  useMotionValueEvent(scrollY, 'change', (latest) => {
    setScrolled(latest > 24);
  });

  return (
    <motion.nav
      animate={{
        paddingTop: scrolled ? '10px' : '16px',
        paddingBottom: scrolled ? '10px' : '16px',
      }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={`fixed top-0 w-full z-50 flex justify-between items-center px-5 md:px-12 max-w-[1280px] mx-auto left-0 right-0 transition-[background,box-shadow,border-color] duration-300 ${
        scrolled
          ? 'bg-surface/98 backdrop-blur-lg shadow-sm shadow-black/8 border-b border-primary/15'
          : 'bg-surface/90 backdrop-blur-md border-b border-primary/10'
      }`}
    >
      <a href="#" className="hover:opacity-90 transition-opacity">
        <motion.div
          animate={{ scale: scrolled ? 0.92 : 1 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          <Logo size={52} />
        </motion.div>
      </a>

      <div className="hidden md:flex gap-8 items-center">
        {['How it works', 'Features', 'Demo', 'Beta'].map((item) => (
          <a
            key={item}
            href={`#${item.toLowerCase().replace(/ /g, '-')}`}
            className="text-on-surface-variant hover:text-primary transition-all duration-200 font-label text-xs uppercase font-semibold tracking-wider relative group"
          >
            {item}
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full rounded-full" />
          </a>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <Link
          href="/sign-in"
          className="text-on-surface-variant hover:text-primary transition-colors font-label text-xs uppercase font-semibold tracking-wider"
        >
          Sign In
        </Link>
        <Link
          href="/sign-up"
          className="bg-primary text-on-primary font-label text-xs uppercase font-semibold tracking-wider px-6 py-3 rounded-lg hover:scale-105 hover:shadow-lg transition-all duration-300 active:scale-95 flex items-center gap-2 relative overflow-hidden group"
        >
          <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
          Create Your Group <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </motion.nav>
  );
}
