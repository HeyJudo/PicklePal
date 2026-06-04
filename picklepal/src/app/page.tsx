'use client';

import Navbar from '../components/landing/Navbar';
import HeroSection from '../components/landing/HeroSection';
import ProblemSection from '../components/landing/ProblemSection';
import WorkflowSection from '../components/landing/WorkflowSection';
import FeaturesSection from '../components/landing/FeaturesSection';
import DemoSection from '../components/landing/DemoSection';
import BetaSection from '../components/landing/BetaSection';
import CtaSection from '../components/landing/CtaSection';
import Footer from '../components/landing/Footer';

export default function LandingPage() {
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
