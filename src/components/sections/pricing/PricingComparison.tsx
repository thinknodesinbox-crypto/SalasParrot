import { motion } from 'framer-motion';
import { Container } from '@/components/ui';

export function PricingComparison() {
  return (
    <section className="bg-white py-12 sm:py-20 md:py-28">
      <Container>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0.3, y: 6 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="mb-10 text-center sm:mb-16"
        >
          <h2 className="mb-3 text-2xl font-bold text-[#1E293B] sm:mb-4 sm:text-3xl md:text-4xl">
            Why pay for 3 tools?
          </h2>
          <p className="mx-auto max-w-2xl px-4 text-base text-[#64748B] sm:px-0 sm:text-lg">
            Most teams use HeyReach + Instantly + an enrichment tool.
            <br className="hidden md:block" />
            We combine all three, plus an AI agent that books meetings.
          </p>
        </motion.div>

        {/* Cost Comparison Cards */}
        <div className="mt-12 sm:mt-20">
          <motion.p
            initial={{ opacity: 0.5 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3 }}
            className="mb-6 text-center text-xs font-medium uppercase tracking-wider text-[#64748B] sm:mb-8 sm:text-sm"
          >
            Real cost comparison
          </motion.p>

          <div className="mx-auto grid max-w-5xl gap-6 sm:gap-8 md:grid-cols-2">
            {/* Growth Plan Comparison */}
            <motion.div
              initial={{ opacity: 0.2, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="relative"
            >
              {/* Card */}
              <div className="overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-[0_4px_24px_rgba(30,41,59,0.06)]">
                {/* Header */}
                <div className="border-b border-[#E2E8F0] px-5 pb-4 pt-6 sm:px-8 sm:pb-6 sm:pt-8">
                  <div className="mb-2 flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#14B8A6]/10 to-[#14B8A6]/5 sm:h-10 sm:w-10">
                      <ChartIcon className="h-4 w-4 text-[#14B8A6] sm:h-5 sm:w-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-[#1E293B] sm:text-lg">3 Senders</h3>
                      <p className="text-xs text-[#64748B] sm:text-sm">Growth teams</p>
                    </div>
                  </div>
                </div>

                {/* Their Stack */}
                <div className="bg-[#F8FAFC] px-5 py-4 sm:px-8 sm:py-6">
                  <p className="mb-4 text-xs font-medium uppercase tracking-wider text-[#94A3B8]">
                    Their stack
                  </p>
                  <div className="space-y-3">
                    <CompetitorLineItem label="HR" name="HeyReach Growth" price="$207" />
                    <CompetitorLineItem label="IN" name="Instantly" price="$97" />
                    <CompetitorLineItem label="AP" name="Enrichment tool" price="$99" />
                    <CompetitorLineItem label="AI" name="AI SDR / VA for replies" price="$300+" />
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-[#E2E8F0] pt-4">
                    <span className="text-sm font-medium text-[#64748B]">Total monthly cost</span>
                    <span className="text-lg font-bold text-[#94A3B8] line-through">$703/mo</span>
                  </div>
                </div>

                {/* SalesParrot */}
                <div className="px-5 py-4 sm:px-8 sm:py-6">
                  <div className="mb-3 flex items-center justify-between sm:mb-4">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#14B8A6] sm:h-10 sm:w-10">
                        <span className="text-xs font-bold text-white sm:text-sm">SP</span>
                      </div>
                      <span className="text-sm font-semibold text-[#1E293B] sm:text-base">
                        SalesParrot
                      </span>
                    </div>
                    <span className="text-xl font-bold text-[#1E293B] sm:text-2xl">
                      $297<span className="text-xs font-normal text-[#64748B] sm:text-sm">/mo</span>
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Agency Plan Comparison */}
            <motion.div
              initial={{ opacity: 0.2, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="relative"
            >
              {/* Popular badge */}
              <div className="absolute -top-3 left-1/2 z-10 -translate-x-1/2">
                <span className="rounded-full bg-[#FF6B35] px-4 py-1.5 text-xs font-semibold text-white shadow-[0_4px_12px_rgba(255,107,53,0.3)]">
                  Most Popular
                </span>
              </div>

              {/* Card */}
              <div className="overflow-hidden rounded-2xl border-2 border-[#FF6B35]/30 bg-white shadow-[0_4px_24px_rgba(255,107,53,0.08)]">
                {/* Header */}
                <div className="border-b border-[#E2E8F0] px-8 pb-6 pt-8">
                  <div className="mb-2 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF6B35]/10 to-[#FF6B35]/5">
                      <BuildingIcon className="h-5 w-5 text-[#FF6B35]" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-[#1E293B]">30 Senders</h3>
                      <p className="text-sm text-[#64748B]">Agencies &amp; teams</p>
                    </div>
                  </div>
                </div>

                {/* Their Stack */}
                <div className="bg-[#FFFBF5] px-8 py-6">
                  <p className="mb-4 text-xs font-medium uppercase tracking-wider text-[#94A3B8]">
                    Their stack
                  </p>
                  <div className="space-y-3">
                    <CompetitorLineItem label="HR" name="HeyReach Agency" price="$999" />
                    <CompetitorLineItem label="IN" name="Instantly" price="$97" />
                    <CompetitorLineItem label="AP" name="Enrichment tool" price="$99" />
                    <CompetitorLineItem label="AI" name="AI SDR / VA for replies" price="$300+" />
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-[#FFE4D6] pt-4">
                    <span className="text-sm font-medium text-[#64748B]">Total monthly cost</span>
                    <span className="text-lg font-bold text-[#94A3B8] line-through">$1,495/mo</span>
                  </div>
                </div>

                {/* SalesParrot */}
                <div className="px-8 py-6">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FF6B35]">
                        <span className="text-sm font-bold text-white">SP</span>
                      </div>
                      <span className="font-semibold text-[#1E293B]">SalesParrot</span>
                    </div>
                    <span className="text-2xl font-bold text-[#1E293B]">
                      $999<span className="text-sm font-normal text-[#64748B]">/mo</span>
                    </span>
                  </div>

                  {/* Savings */}
                  <div className="rounded-xl bg-gradient-to-r from-[#FFF7ED] to-[#FFFBEB] p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="mb-1 text-sm text-[#64748B]">You save</p>
                        <p className="text-xl font-bold text-[#FF6B35]">$496/mo</p>
                      </div>
                      <div className="text-right">
                        <p className="mb-1 text-sm text-[#64748B]">Annually</p>
                        <p className="text-xl font-bold text-[#FF6B35]">$5,952</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Bottom note */}
          <motion.p
            initial={{ opacity: 0.5 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="mt-8 text-center text-sm text-[#94A3B8]"
          >
            Prices based on publicly available information as of March 2026
          </motion.p>
        </div>
      </Container>
    </section>
  );
}

/* ── Sub-components ── */

function CompetitorLineItem({
  label,
  name,
  price,
}: {
  label: string;
  name: string;
  price: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E2E8F0] bg-white">
          <span className="text-xs font-bold text-[#64748B]">{label}</span>
        </div>
        <span className="text-sm text-[#64748B]">{name}</span>
      </div>
      <span className="text-sm font-medium text-[#64748B]">{price}</span>
    </div>
  );
}

function ChartIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
      />
    </svg>
  );
}

function BuildingIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21"
      />
    </svg>
  );
}
