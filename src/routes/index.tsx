import { createFileRoute } from '@tanstack/react-router';
import { Hero } from '@/components/sections/Hero';
import { TrustBar } from '@/components/sections/TrustBar';
import { FeaturesHeader } from '@/components/sections/FeaturesHeader';
import { Feature } from '@/components/sections/Feature';
import { DarkSection } from '@/components/sections/DarkSection';
import { FinalCTA } from '@/components/sections/FinalCTA';
import { FAQ } from '@/components/sections/FAQ';
import {
  SequenceBuilderPanel,
  UnifiedInboxPanel,
  LeadEnrichmentPanel,
  SendersPanel,
} from '@/components/panels';

export const Route = createFileRoute('/')({
  component: HomePage,
});

function HomePage() {
  return (
    <>
      <Hero />

      <TrustBar />

      <FeaturesHeader />

      {/* Feature 1 - White background, image right */}
      <Feature
        headline="LinkedIn + Email. One sequence."
        body="Connection requests, messages, profile views, and email follow-ups — all in one flow. Branch logic handles the rest."
        imagePosition="right"
        background="white"
        panel={<SequenceBuilderPanel variant="feature" />}
      />

      {/* Feature 2 - Cream background, image left */}
      <Feature
        headline="All replies. One inbox."
        body="LinkedIn DMs and email responses in one place. No switching tabs. No missed messages."
        imagePosition="left"
        background="cream"
        panel={<UnifiedInboxPanel variant="feature" />}
      />

      {/* Feature 3 - White background, image right */}
      <Feature
        headline="Emails found automatically."
        body="Import leads from Sales Navigator or CSV. We find verified emails in the background."
        imagePosition="right"
        background="white"
        panel={<LeadEnrichmentPanel variant="feature" />}
      />

      {/* Feature 4 - Cream background, image left */}
      <Feature
        headline="Scale without limits."
        body="Multiple LinkedIn accounts, one campaign. Auto-rotation keeps each account safe."
        imagePosition="left"
        background="cream"
        panel={<SendersPanel variant="feature" />}
      />

      <DarkSection />

      <FinalCTA />

      <FAQ />
    </>
  );
}
