import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import Logo from '@/components/Logo';

export default function Navbar() {
  return (
    <nav className="fixed top-0 w-full z-50 bg-surface/90 backdrop-blur-md border-b border-primary/10 flex justify-between items-center px-5 md:px-12 py-4 max-w-[1280px] mx-auto left-0 right-0 transition-transform duration-300">
      <a href="#" className="hover:opacity-90 transition-opacity">
        <Logo size={52} />
      </a>
      
      <div className="hidden md:flex gap-8 items-center">
        {['How it works', 'Features', 'Demo', 'Beta'].map((item) => (
          <a 
            key={item}
            href={`#${item.toLowerCase().replace(/ /g, '-')}`} 
            className="text-on-surface-variant hover:text-primary transition-all duration-200 font-label text-xs uppercase font-semibold tracking-wider hover:opacity-80 relative group"
          >
            {item}
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full"></span>
          </a>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <Link href="/sign-in" className="text-on-surface-variant hover:text-primary transition-colors font-label text-xs uppercase font-semibold tracking-wider">
          Sign In
        </Link>
        <Link href="/sign-up" className="bg-primary text-on-primary font-label text-xs uppercase font-semibold tracking-wider px-6 py-3 rounded-lg hover:scale-105 hover:shadow-lg transition-all duration-300 active:scale-95 flex items-center gap-2 relative overflow-hidden group">
          <span className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></span>
          Create Your Group <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </nav>
  );
}
