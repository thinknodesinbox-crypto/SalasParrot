import { createFileRoute } from '@tanstack/react-router';
import { Hero } from '@/components/sections/Hero';
import { TrustBar } from '@/components/sections/TrustBar';
import { TestimonialCarousel } from '@/components/sections/TestimonialCarousel';
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
  AIReplyAgentPanel,
} from '@/components/panels';

export const Route = createFileRoute('/')({
  component: HomePage,
});

function HomePage() {
  return (
    <>
      <Hero />

      <TrustBar />

      <TestimonialCarousel />

      <FeaturesHeader />

      {/* Feature 1 - White background, image right */}
      <Feature
        headline="One sequence. LinkedIn first. Email when they don't connect."
        body="Connection requests, messages, and profile views run on LinkedIn. Prospects who don't accept get followed up by email automatically. No one falls through."
        imagePosition="right"
        background="white"
        panel={<SequenceBuilderPanel variant="feature" />}
      />

      {/* Feature 2 - Cream background, image left */}
      <Feature
        headline="Every reply. One inbox. Nothing missed."
        body="LinkedIn DMs and email responses across your whole team in one place. No switching tabs. No missed replies."
        imagePosition="left"
        background="cream"
        panel={<UnifiedInboxPanel variant="feature" />}
      />

      {/* Feature 3 - White background, image right */}
      <Feature
        headline="Find anyone's email. No credits. Ever."
        body="Import from Sales Navigator or CSV. Verified emails found automatically, included in every plan."
        imagePosition="right"
        background="white"
        panel={<LeadEnrichmentPanel variant="feature" />}
      />

      {/* Feature 4 - Cream background, image left */}
      <Feature
        headline="Scale your team's LinkedIn without risking it."
        body="Dedicated proxies, human-like sending, and smart daily limits. Run 3 accounts or 30. Every account stays safe."
        imagePosition="left"
        background="cream"
        panel={<SendersPanel variant="feature" />}
      />

      {/* Feature 5 - AI Reply Agent - White background, image right */}
      <Feature
        headline="Turns replies into booked meetings."
        body="When a prospect replies, the AI picks it up, responds in your tone, checks your calendar, and books the call. You just show up."
        imagePosition="right"
        background="white"
        panel={<AIReplyAgentPanel variant="feature" />}
      />

      <DarkSection />

      <FinalCTA />

      <FAQ />
    </>
  );
}
