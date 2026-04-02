import { createFileRoute, Link } from '@tanstack/react-router';
import { Container } from '@/components/ui';

const LIFETIME_APPLY_URL = 'https://deals.salesparrot.com/apply';

export const Route = createFileRoute('/openlists/pricing')({
  component: OpenListsPricingPage,
});

function OpenListsPricingPage() {
  return (
    <section className="bg-[#FFF7ED] py-10 sm:py-16">
      <Container>
        <div className="mx-auto max-w-5xl">
          <div className="mb-8 text-center sm:mb-10">
            <p className="mb-2 inline-flex rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#9A3412]">
              Next Step
            </p>
            <h1 className="text-2xl font-bold tracking-tight text-[#0F172A] sm:text-4xl">
              Continue Enrichment and Outreach with SalesParrot
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-[#475569] sm:text-base">
              You already have the open list. Use SalesParrot to enrich contacts, personalize messaging,
              and launch outreach campaigns from one place.
            </p>
          </div>

          <div className="grid gap-4 sm:gap-5 md:grid-cols-2">
            <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-[0_8px_30px_rgba(30,41,59,0.08)] sm:p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[#14B8A6]">Growth</p>
              <p className="mt-3 text-3xl font-bold text-[#0F172A] sm:text-4xl">$99</p>
              <p className="text-sm text-[#64748B]">per sender / month</p>
              <ul className="mt-5 space-y-2 text-sm text-[#334155]">
                <li>Unlimited outreach sequences</li>
                <li>LinkedIn and email in one inbox</li>
                <li>AI-assisted response handling</li>
                <li>Lead enrichment workflows</li>
              </ul>
              <Link
                to="/signup"
                className="mt-6 inline-flex w-full justify-center rounded-lg bg-[#14B8A6] px-4 py-2.5 font-semibold text-white transition-colors hover:bg-[#0F766E]"
              >
                Start Growth
              </Link>
            </div>

            <div className="rounded-2xl border-2 border-[#FF6B35] bg-white p-5 shadow-[0_12px_40px_rgba(255,107,53,0.16)] sm:p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[#FF6B35]">Agency</p>
              <p className="mt-3 text-3xl font-bold text-[#0F172A] sm:text-4xl">$999</p>
              <p className="text-sm text-[#64748B]">per month (30 senders included)</p>
              <ul className="mt-5 space-y-2 text-sm text-[#334155]">
                <li>Whitelabel and client workspaces</li>
                <li>Advanced campaign scaling controls</li>
                <li>Priority support channel</li>
                <li>Team and permission management</li>
              </ul>
              <a
                href="https://cal.com/akinthinks/sales-parrot"
                target="_blank"
                rel="noreferrer"
                className="mt-6 inline-flex w-full justify-center rounded-lg bg-[#FF6B35] px-4 py-2.5 font-semibold text-white transition-colors hover:bg-[#E85A2A]"
              >
                Book Demo
              </a>
            </div>
          </div>

          <div className="mt-7 rounded-2xl border border-[#FDBA74] bg-white p-5 text-center shadow-[0_8px_30px_rgba(249,115,22,0.12)] sm:mt-8 sm:p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[#9A3412]">
              Lifetime Access Option
            </p>
            <p className="mt-2 text-base text-[#7C2D12] sm:text-lg">
              Apply for lifetime access by paying a one-time fee.
            </p>
            <a
              href={LIFETIME_APPLY_URL}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex w-full items-center justify-center rounded-lg bg-[#9A3412] px-5 py-2.5 font-semibold text-white transition-colors hover:bg-[#7C2D12] sm:w-auto"
            >
              Apply at deals.salesparrot.com
            </a>
          </div>
        </div>
      </Container>
    </section>
  );
}
