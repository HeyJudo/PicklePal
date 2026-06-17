import React from 'react';
import Logo from '@/components/Logo';

export default function Footer() {
  return (
    <footer className="bg-primary-dark w-full py-14 border-t-4 border-primary court-lines">
      <div className="flex flex-col md:flex-row justify-between items-center px-5 md:px-12 max-w-[1280px] mx-auto gap-8">
        <a href="#" className="opacity-70 hover:opacity-100 transition-opacity duration-300">
          <Logo size={46} variant="inverse" />
        </a>
        
        <div className="flex gap-6 flex-wrap justify-center mt-6 md:mt-0">
          {['Privacy Policy', 'Terms of Play', 'Sponsorships', 'Contact'].map((link) => (
            <a 
              key={link} 
              href="#" 
              className="text-surface-dim/70 hover:text-white font-body text-base hover:underline decoration-primary decoration-2 underline-offset-4 opacity-100 hover:opacity-80 transition-opacity"
            >
              {link}
            </a>
          ))}
        </div>
        
        <div className="text-surface-dim/50 font-body text-sm mt-6 md:mt-0">
          © {new Date().getFullYear()} DinkDay Sports Media. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
