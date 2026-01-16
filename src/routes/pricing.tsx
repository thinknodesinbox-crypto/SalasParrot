import { createFileRoute } from '@tanstack/react-router';
import {
  PricingHero,
  PricingPlans,
  PricingComparison,
  PricingFAQ,
  PricingCTA,
} from '@/components/sections/pricing';

export const Route = createFileRoute('/pricing')({
  component: PricingPage,
});

function PricingPage() {
  return (
    <>
      <PricingHero />
      <PricingPlans />
      <PricingComparison />
      <PricingFAQ />
      <PricingCTA />
    </>
  );
}
