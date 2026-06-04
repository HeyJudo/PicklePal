import React from 'react';

export default function Footer() {
  return (
    <footer className="bg-primary-dark w-full py-12 border-t-4 border-primary">
      <div className="flex flex-col md:flex-row justify-between items-center px-5 md:px-12 max-w-[1280px] mx-auto gap-8">
        <a href="#" className="flex items-center gap-2 opacity-50 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-300">
          <img 
            src="https://lh3.googleusercontent.com/aida/AP1WRLv1XyoEZhLB2kLKzhr3OpMZAwiHw_IJkc83sHf02m1wBamfYyl9YKfLXMqrEKqoMeCDa9PykETHQopAsM9FFgYNcTCoJSF1oz0uHkMbVQlmDQ8XuC3tnR8Hsex8uYVHzyaohtV1g_qM1jUUaNtivfE4AnqwErez3ZIafjKMc1sg3kiVBhdQxiV6wNZiRG3WWvBelkDGqYmqMrUQfe8XB_38CYiVvPpAUYQFcGSE3-bSSq7FkaxRh-AAeA" 
            alt="DinkDay Logo" 
            className="h-8 w-auto filter brightness-0 invert" 
          />
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
