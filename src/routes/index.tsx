import { createFileRoute } from '@tanstack/react-router';
import {
  Hero,
  PlaybooksSection,
  TestimonialsSection,
  ProcessSection,
  JourneySection,
  FeaturesSection,
  LearningSection,
  ArchitectSection,
  FinalCTASection,
  FAQ,
} from '@/components/sections';
import { useEffect } from 'react';
import { startGlobalSimulation, stopGlobalSimulation } from '@/lib/simulationStore';

export const Route = createFileRoute('/')({
  component: HomePage,
});

function HomePage() {
  useEffect(() => {
    startGlobalSimulation();
    return () => stopGlobalSimulation();
  }, []);

  return (
    <>
      {/* 1. Hero Section (Custom typewriter + split pane playbooks console) */}
      <Hero />

      {/* 2. Playbooks Showcase Section */}
      <PlaybooksSection />

      {/* 3. Social Proof & Statistics Section */}
      <TestimonialsSection />

      {/* 4. Three-Step Process Timeline Section */}
      <ProcessSection />

      {/* 5. Horizontal Journey Section */}
      <JourneySection />

      {/* 6. Unified Outbound Feature Grid (Bento style) */}
      <FeaturesSection />

      {/* 7. Smarter Learning Engine Section */}
      <LearningSection />

      {/* 8. Revenue Growth Architect Manifesto Section */}
      <ArchitectSection />

      {/* 9. Final Call to Action Section */}
      <FinalCTASection />

      {/* 10. Frequently Asked Questions Section */}
      <FAQ />
    </>
  );
}
