import { motion } from 'framer-motion'
import { Container } from '@/components/ui'

const comparisonData = [
  { feature: 'LinkedIn automation', competitor: true, us: true },
  { feature: 'Multi-sender rotation', competitor: true, us: true },
  { feature: 'Unified inbox', competitor: 'LinkedIn only', us: 'LinkedIn + Email' },
  { feature: 'Native email sending', competitor: false, us: true, competitorNote: 'Need Instantly' },
  { feature: 'Email enrichment', competitor: false, us: true, competitorNote: 'Need Apollo' },
  { feature: 'Dedicated proxies', competitor: true, us: true },
]

export function PricingComparison() {
  return (
    <section className="bg-white py-12 sm:py-20 md:py-28">
      <Container>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-10 sm:mb-16"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#1E293B] mb-3 sm:mb-4">
            Why pay for 3 tools?
          </h2>
          <p className="text-[#64748B] text-base sm:text-lg max-w-2xl mx-auto px-4 sm:px-0">
            Most teams use HeyReach + Instantly + an enrichment tool.
            <br className="hidden md:block" />
            We combine all three.
          </p>
        </motion.div>

        {/* Comparison Table */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="max-w-3xl mx-auto"
        >
          <div className="bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0] overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4 px-3 sm:px-6 py-3 sm:py-4 bg-[#1E293B]">
              <div className="text-white/60 text-xs sm:text-sm font-medium">Feature</div>
              <div className="text-center text-white/60 text-xs sm:text-sm font-medium">Other Tools</div>
              <div className="text-center">
                <span className="px-2 sm:px-3 py-1 bg-[#14B8A6]/20 rounded-full text-[#14B8A6] text-xs sm:text-sm font-semibold">
                  SalesParrot
                </span>
              </div>
            </div>

            {/* Table Rows */}
            {comparisonData.map((row, index) => (
              <motion.div
                key={row.feature}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                className={`grid grid-cols-3 gap-2 sm:gap-4 px-3 sm:px-6 py-3 sm:py-4 items-center ${
                  index !== comparisonData.length - 1 ? 'border-b border-[#E2E8F0]' : ''
                }`}
              >
                <div className="text-[#1E293B] font-medium text-xs sm:text-sm">{row.feature}</div>
                <div className="text-center">
                  {row.competitor === true ? (
                    <CheckIcon className="text-[#64748B]" />
                  ) : row.competitor === false ? (
                    <div className="flex flex-col items-center">
                      <CrossIcon />
                      {row.competitorNote && (
                        <span className="text-[10px] text-[#94A3B8] mt-1">{row.competitorNote}</span>
                      )}
                    </div>
                  ) : (
                    <span className="text-[#94A3B8] text-sm">{row.competitor}</span>
                  )}
                </div>
                <div className="text-center">
                  {row.us === true ? (
                    <div className="flex items-center justify-center gap-1">
                      <CheckIcon className="text-[#14B8A6]" />
                      <span className="text-[#14B8A6] text-xs font-medium">Included</span>
                    </div>
                  ) : (
                    <span className="text-[#14B8A6] text-sm font-medium">{row.us}</span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Cost Comparison Cards - Redesigned */}
        <div className="mt-12 sm:mt-20">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center text-xs sm:text-sm font-medium text-[#64748B] uppercase tracking-wider mb-6 sm:mb-8"
          >
            Real cost comparison
          </motion.p>

          <div className="grid md:grid-cols-2 gap-6 sm:gap-8 max-w-5xl mx-auto">
            {/* Growth Plan Comparison */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="relative"
            >
              {/* Card */}
              <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden shadow-[0_4px_24px_rgba(30,41,59,0.06)]">
                {/* Header */}
                <div className="px-5 sm:px-8 pt-6 sm:pt-8 pb-4 sm:pb-6 border-b border-[#E2E8F0]">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-[#14B8A6]/10 to-[#14B8A6]/5 flex items-center justify-center">
                      <ChartIcon className="w-4 h-4 sm:w-5 sm:h-5 text-[#14B8A6]" />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-[#1E293B]">10 Senders</h3>
                      <p className="text-xs sm:text-sm text-[#64748B]">Growth teams</p>
                    </div>
                  </div>
                </div>

                {/* Their Stack */}
                <div className="px-5 sm:px-8 py-4 sm:py-6 bg-[#F8FAFC]">
                  <p className="text-xs font-medium text-[#94A3B8] uppercase tracking-wider mb-4">Their stack</p>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white border border-[#E2E8F0] flex items-center justify-center">
                          <span className="text-xs font-bold text-[#64748B]">HR</span>
                        </div>
                        <span className="text-sm text-[#64748B]">HeyReach Growth</span>
                      </div>
                      <span className="text-sm font-medium text-[#64748B]">$590</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white border border-[#E2E8F0] flex items-center justify-center">
                          <span className="text-xs font-bold text-[#64748B]">IN</span>
                        </div>
                        <span className="text-sm text-[#64748B]">Instantly</span>
                      </div>
                      <span className="text-sm font-medium text-[#64748B]">$97</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white border border-[#E2E8F0] flex items-center justify-center">
                          <span className="text-xs font-bold text-[#64748B]">AP</span>
                        </div>
                        <span className="text-sm text-[#64748B]">Enrichment tool</span>
                      </div>
                      <span className="text-sm font-medium text-[#64748B]">$99</span>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-[#E2E8F0] flex items-center justify-between">
                    <span className="text-sm font-medium text-[#64748B]">Total monthly cost</span>
                    <span className="text-lg font-bold text-[#94A3B8] line-through">$786/mo</span>
                  </div>
                </div>

                {/* SalesParrot */}
                <div className="px-5 sm:px-8 py-4 sm:py-6">
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-[#14B8A6] flex items-center justify-center">
                        <span className="text-white font-bold text-xs sm:text-sm">SP</span>
                      </div>
                      <span className="font-semibold text-[#1E293B] text-sm sm:text-base">SalesParrot</span>
                    </div>
                    <span className="text-xl sm:text-2xl font-bold text-[#1E293B]">$590<span className="text-xs sm:text-sm font-normal text-[#64748B]">/mo</span></span>
                  </div>

                  {/* Savings */}
                  <div className="bg-gradient-to-r from-[#F0FDFA] to-[#F0FDF4] rounded-xl p-3 sm:p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs sm:text-sm text-[#64748B] mb-0.5 sm:mb-1">You save</p>
                        <p className="text-lg sm:text-xl font-bold text-[#14B8A6]">$196/mo</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs sm:text-sm text-[#64748B] mb-0.5 sm:mb-1">Annually</p>
                        <p className="text-lg sm:text-xl font-bold text-[#14B8A6]">$2,352</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Agency Plan Comparison */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              {/* Popular badge */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                <span className="px-4 py-1.5 bg-[#FF6B35] text-white text-xs font-semibold rounded-full shadow-[0_4px_12px_rgba(255,107,53,0.3)]">
                  Most Popular
                </span>
              </div>

              {/* Card */}
              <div className="bg-white rounded-2xl border-2 border-[#FF6B35]/30 overflow-hidden shadow-[0_4px_24px_rgba(255,107,53,0.08)]">
                {/* Header */}
                <div className="px-8 pt-8 pb-6 border-b border-[#E2E8F0]">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF6B35]/10 to-[#FF6B35]/5 flex items-center justify-center">
                      <BuildingIcon className="w-5 h-5 text-[#FF6B35]" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-[#1E293B]">50 Senders</h3>
                      <p className="text-sm text-[#64748B]">Agencies & teams</p>
                    </div>
                  </div>
                </div>

                {/* Their Stack */}
                <div className="px-8 py-6 bg-[#FFFBF5]">
                  <p className="text-xs font-medium text-[#94A3B8] uppercase tracking-wider mb-4">Their stack</p>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white border border-[#E2E8F0] flex items-center justify-center">
                          <span className="text-xs font-bold text-[#64748B]">HR</span>
                        </div>
                        <span className="text-sm text-[#64748B]">HeyReach Agency</span>
                      </div>
                      <span className="text-sm font-medium text-[#64748B]">$999</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white border border-[#E2E8F0] flex items-center justify-center">
                          <span className="text-xs font-bold text-[#64748B]">IN</span>
                        </div>
                        <span className="text-sm text-[#64748B]">Instantly</span>
                      </div>
                      <span className="text-sm font-medium text-[#64748B]">$97</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white border border-[#E2E8F0] flex items-center justify-center">
                          <span className="text-xs font-bold text-[#64748B]">AP</span>
                        </div>
                        <span className="text-sm text-[#64748B]">Enrichment tool</span>
                      </div>
                      <span className="text-sm font-medium text-[#64748B]">$99</span>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-[#FFE4D6] flex items-center justify-between">
                    <span className="text-sm font-medium text-[#64748B]">Total monthly cost</span>
                    <span className="text-lg font-bold text-[#94A3B8] line-through">$1,195/mo</span>
                  </div>
                </div>

                {/* SalesParrot */}
                <div className="px-8 py-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#FF6B35] flex items-center justify-center">
                        <span className="text-white font-bold text-sm">SP</span>
                      </div>
                      <span className="font-semibold text-[#1E293B]">SalesParrot</span>
                    </div>
                    <span className="text-2xl font-bold text-[#1E293B]">$999<span className="text-sm font-normal text-[#64748B]">/mo</span></span>
                  </div>

                  {/* Savings */}
                  <div className="bg-gradient-to-r from-[#FFF7ED] to-[#FFFBEB] rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-[#64748B] mb-1">You save</p>
                        <p className="text-xl font-bold text-[#FF6B35]">$196/mo</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-[#64748B] mb-1">Annually</p>
                        <p className="text-xl font-bold text-[#FF6B35]">$2,352</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Bottom note */}
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="text-center text-sm text-[#94A3B8] mt-8"
          >
            Prices based on publicly available information as of January 2026
          </motion.p>
        </div>
      </Container>
    </section>
  )
}

function CheckIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={`w-5 h-5 mx-auto ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  )
}

function CrossIcon() {
  return (
    <svg className="w-5 h-5 mx-auto text-[#CBD5E1]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

function ChartIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  )
}

function BuildingIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
    </svg>
  )
}
