import { createFileRoute } from '@tanstack/react-router';
import { Hero } from '@/components/sections/Hero';
import { TrustBar } from '@/components/sections/TrustBar';
import { TestimonialCarousel } from '@/components/sections/TestimonialCarousel';
import { FeaturesHeader } from '@/components/sections/FeaturesHeader';
import { Feature } from '@/components/sections/Feature';
import { FinalCTA } from '@/components/sections/FinalCTA';
import { FAQ } from '@/components/sections/FAQ';
import { lazy, Suspense, useEffect } from 'react';
import { startGlobalSimulation, stopGlobalSimulation } from '@/lib/simulationStore';

const SequenceBuilderPanel = lazy(() =>
  import('@/components/panels/SequenceBuilderPanel').then((m) => ({
    default: m.SequenceBuilderPanel,
  }))
);
const UnifiedInboxPanel = lazy(() =>
  import('@/components/panels/UnifiedInboxPanel').then((m) => ({ default: m.UnifiedInboxPanel }))
);
const LeadEnrichmentPanel = lazy(() =>
  import('@/components/panels/LeadEnrichmentPanel').then((m) => ({
    default: m.LeadEnrichmentPanel,
  }))
);
const SendersPanel = lazy(() =>
  import('@/components/panels/SendersPanel').then((m) => ({ default: m.SendersPanel }))
);
const AIReplyAgentPanel = lazy(() =>
  import('@/components/panels/AIReplyAgentPanel').then((m) => ({ default: m.AIReplyAgentPanel }))
);

const PanelLoading = () => (
  <div className="flex aspect-video w-full animate-pulse items-center justify-center rounded-2xl bg-slate-100/50 backdrop-blur-sm">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-teal-500" />
  </div>
);

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
      <Hero />

      <TrustBar />

      <TestimonialCarousel />

      <FeaturesHeader />

      <Suspense fallback={<PanelLoading />}>
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
      </Suspense>
      <FinalCTA />

      <FAQ />
    </>
  );
}
