import { motion } from 'framer-motion'
import { useState } from 'react'
import { Container } from '@/components/ui'
import { Link } from '@tanstack/react-router'

// Volume pricing tiers
const volumePricing = [
  { min: 1, max: 1, price: 79 },
  { min: 2, max: 4, price: 69 },
  { min: 5, max: 9, price: 62 },
  { min: 10, max: 50, price: 59 },
]

function getPricePerSender(senders: number): number {
  const tier = volumePricing.find((t) => senders >= t.min && senders <= t.max)
  return tier?.price ?? 59
}

function getDiscount(senders: number): number {
  if (senders === 1) return 0
  if (senders <= 4) return 13
  if (senders <= 9) return 22
  return 25
}

export function PricingPlans() {
  const [senderCount, setSenderCount] = useState(1)
  const pricePerSender = getPricePerSender(senderCount)
  const totalPrice = pricePerSender * senderCount
  const discount = getDiscount(senderCount)

  return (
    <section className="bg-[#FFFBEB] py-12 sm:py-16">
      <Container>
        <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 max-w-5xl mx-auto">
          {/* Growth Plan */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="relative bg-white rounded-2xl border border-[#E2E8F0] p-5 sm:p-8 shadow-[0_8px_30px_rgba(30,41,59,0.06)]"
          >
            <div className="relative z-10">
              {/* Header */}
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-[#14B8A6]/10 flex items-center justify-center">
                  <svg className="w-5 h-5 text-[#14B8A6]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-[#1E293B]">Growth</h3>
              </div>
              <p className="text-[#64748B] text-sm mb-6">For sales teams & individuals</p>

              {/* Price display */}
              <div className="mb-4 sm:mb-6">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl sm:text-5xl font-bold text-[#1E293B]">${pricePerSender}</span>
                  <span className="text-[#64748B] text-base sm:text-lg">/month</span>
                </div>
                <p className="text-[#94A3B8] text-sm mt-1">per sender</p>
                {discount > 0 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 bg-[#14B8A6]/10 rounded-full"
                  >
                    <span className="text-[#14B8A6] text-xs font-semibold">{discount}% volume discount applied</span>
                  </motion.div>
                )}
              </div>

              {/* Sender slider */}
              <div className="mb-6 sm:mb-8 p-4 sm:p-5 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 mb-4">
                  <span className="text-[#1E293B] text-sm font-semibold">Number of senders</span>
                  <div className="flex items-center justify-center gap-3">
                    <button
                      onClick={() => setSenderCount(Math.max(1, senderCount - 1))}
                      className="w-9 h-9 rounded-lg bg-white border border-[#E2E8F0] text-[#64748B] hover:border-[#14B8A6] hover:text-[#14B8A6] transition-all flex items-center justify-center text-lg font-medium"
                    >
                      −
                    </button>
                    <span className="text-[#1E293B] font-bold text-xl w-8 text-center">{senderCount}</span>
                    <button
                      onClick={() => setSenderCount(Math.min(20, senderCount + 1))}
                      className="w-9 h-9 rounded-lg bg-white border border-[#E2E8F0] text-[#64748B] hover:border-[#14B8A6] hover:text-[#14B8A6] transition-all flex items-center justify-center text-lg font-medium"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Slider */}
                <div className="relative">
                  <input
                    type="range"
                    min="1"
                    max="20"
                    value={senderCount}
                    onChange={(e) => setSenderCount(parseInt(e.target.value))}
                    className="w-full h-2 bg-[#E2E8F0] rounded-full appearance-none cursor-pointer slider-thumb-teal"
                    style={{
                      background: `linear-gradient(to right, #14B8A6 0%, #14B8A6 ${((senderCount - 1) / 19) * 100}%, #E2E8F0 ${((senderCount - 1) / 19) * 100}%, #E2E8F0 100%)`,
                    }}
                  />
                  <div className="flex justify-between mt-2">
                    <span className="text-[#94A3B8] text-xs">1</span>
                    <span className="text-[#94A3B8] text-xs">20</span>
                  </div>
                </div>

                {/* Total */}
                <div className="mt-5 pt-5 border-t border-[#E2E8F0] flex items-center justify-between">
                  <span className="text-[#64748B] text-sm font-medium">Total monthly</span>
                  <span className="text-[#1E293B] font-bold text-2xl">${totalPrice}</span>
                </div>
              </div>

              {/* CTA */}
              <Link to="/signup">
                <motion.button
                  whileHover={{ scale: 1.01, y: -1 }}
                  whileTap={{ scale: 0.99 }}
                  className="w-full py-4 px-6 bg-[#14B8A6] text-white font-semibold rounded-xl hover:bg-[#0D9488] transition-all duration-200 shadow-[0_4px_14px_rgba(20,184,166,0.25)] hover:shadow-[0_6px_20px_rgba(20,184,166,0.35)]"
                >
                  Start $1 Trial
                </motion.button>
              </Link>
              <p className="text-center text-[#94A3B8] text-xs mt-3">7-day full access. Cancel anytime.</p>

              {/* Features */}
              <div className="mt-8 space-y-5">
                <FeatureGroup title="UNLIMITED LINKEDIN" items={[
                  'Connection requests (up to safe daily limits)',
                  'Direct messages & InMails',
                  'Profile views & follows',
                ]} />
                <FeatureGroup title="UNLIMITED EMAIL" items={[
                  'Gmail, Outlook, or SMTP',
                  'Deliverability monitoring',
                ]} />
                <FeatureGroup title="UNLIMITED ENRICHMENT" items={[
                  'Auto-find emails from LinkedIn',
                  'Verified business emails',
                ]} />
                <FeatureGroup title="CORE FEATURES" items={[
                  'Unified inbox (LinkedIn + Email)',
                  'Multichannel sequences',
                  'Dedicated proxy per account',
                  'Campaign analytics',
                  'API & Webhooks',
                ]} />
              </div>
            </div>
          </motion.div>

          {/* Agency Plan */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="relative bg-white rounded-2xl border-2 border-[#FF6B35] p-5 sm:p-8 shadow-[0_8px_30px_rgba(255,107,53,0.12)]"
          >
            {/* Best value badge */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <div className="px-4 py-2 bg-[#FF6B35] rounded-full shadow-[0_4px_14px_rgba(255,107,53,0.3)]">
                <span className="text-white text-xs font-bold tracking-wide">BEST FOR AGENCIES</span>
              </div>
            </div>

            <div className="relative z-10 pt-2">
              {/* Header */}
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-[#FF6B35]/10 flex items-center justify-center">
                  <svg className="w-5 h-5 text-[#FF6B35]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-[#1E293B]">Agency</h3>
              </div>
              <p className="text-[#64748B] text-sm mb-6">For agencies & large sales teams</p>

              {/* Price */}
              <div className="mb-6 sm:mb-8">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl sm:text-5xl font-bold text-[#1E293B]">$999</span>
                  <span className="text-[#64748B] text-base sm:text-lg">/month</span>
                </div>
                <p className="text-[#94A3B8] text-sm mt-1">50 senders included</p>
                <div className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 bg-[#FF6B35]/10 rounded-full">
                  <span className="text-[#FF6B35] text-xs font-semibold">Annual: $749/mo (save 25%)</span>
                </div>
              </div>

              {/* CTA */}
              <motion.button
                whileHover={{ scale: 1.01, y: -1 }}
                whileTap={{ scale: 0.99 }}
                className="w-full py-4 px-6 bg-[#FF6B35] text-white font-semibold rounded-xl hover:bg-[#E85A2A] transition-all duration-200 shadow-[0_4px_14px_rgba(255,107,53,0.25)] hover:shadow-[0_6px_20px_rgba(255,107,53,0.35)]"
              >
                Book a Demo
              </motion.button>
              <p className="text-center text-[#94A3B8] text-xs mt-3">Get a personalized walkthrough</p>

              {/* Everything in Growth */}
              <div className="mt-8 mb-6 p-4 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-[#14B8A6]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-[#1E293B] text-sm font-medium">Everything in Growth, plus:</span>
                </div>
              </div>

              {/* Features */}
              <div className="space-y-5">
                <FeatureGroup title="SCALE" color="orange" items={[
                  '50 LinkedIn senders included',
                  'Sender rotation across campaigns',
                  'Add more senders at $20/mo each',
                ]} />
                <FeatureGroup title="AGENCY FEATURES" color="orange" items={[
                  'Whitelabel (your brand)',
                  'Unlimited workspaces',
                  'Client-level reporting',
                  'Team permissions & roles',
                ]} />
                <FeatureGroup title="DEDICATED SUPPORT" color="orange" items={[
                  'Dedicated Customer Success Manager',
                  'Private Slack channel',
                  'Sub-4-hour response time',
                  'Migration assistance',
                ]} />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Volume pricing note */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-12 text-center"
        >
          <p className="text-[#64748B] text-sm">
            Need 15+ senders? Agency plan is better value at $20/sender.
          </p>
        </motion.div>
      </Container>

      {/* Custom slider styles */}
      <style>{`
        .slider-thumb-teal::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: white;
          border: 3px solid #14B8A6;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(20, 184, 166, 0.3);
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .slider-thumb-teal::-webkit-slider-thumb:hover {
          transform: scale(1.1);
          box-shadow: 0 4px 12px rgba(20, 184, 166, 0.4);
        }
        .slider-thumb-teal::-moz-range-thumb {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: white;
          border: 3px solid #14B8A6;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(20, 184, 166, 0.3);
        }
      `}</style>
    </section>
  )
}

function FeatureGroup({ title, items, color = 'teal' }: { title: string; items: string[]; color?: 'teal' | 'orange' }) {
  const checkColor = color === 'orange' ? 'text-[#FF6B35]' : 'text-[#14B8A6]'

  return (
    <div>
      <h4 className="text-[#94A3B8] text-[10px] font-bold tracking-[0.15em] mb-3">{title}</h4>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2.5">
            <svg className={`w-4 h-4 ${checkColor} flex-shrink-0 mt-0.5`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-[#64748B] text-sm">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
