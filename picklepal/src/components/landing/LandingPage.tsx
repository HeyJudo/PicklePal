'use client';

import Navbar from './Navbar';
import HeroSection from './HeroSection';
import ProblemSection from './ProblemSection';
import WorkflowSection from './WorkflowSection';
import FeaturesSection from './FeaturesSection';
import DemoSection from './DemoSection';
import BetaSection from './BetaSection';
import CtaSection from './CtaSection';
import Footer from './Footer';

export function LandingPage() {
  return (
    <div className="bg-background text-on-background font-body antialiased overflow-x-hidden">
      <Navbar />
      <HeroSection />
      <ProblemSection />
      <WorkflowSection />
      <FeaturesSection />
      <DemoSection />
      <BetaSection />
      <CtaSection />
      <Footer />
    </div>
  );
}
