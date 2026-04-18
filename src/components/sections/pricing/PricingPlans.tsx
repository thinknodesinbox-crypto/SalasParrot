/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Container } from '@/components/ui';
import { Link } from '@tanstack/react-router';
import { useAuthStore } from '@/lib/auth';
import { getCalApi } from '@calcom/embed-react';

const PRICE_PER_SENDER = 99;

// Growth plan: 6 visible bullets
const growthBullets = [
  'Unlimited LinkedIn outreach (safe daily limits applied)',
  'Unlimited email follow-ups',
  'Unlimited email enrichment. No credits.',
  'AI Reply Agent. Handles responses, books meetings.',
  'Unified inbox. LinkedIn and email in one place.',
  'Dedicated proxy per account. Your account stays safe.',
];

// Growth plan: expanded feature groups
const growthExpandedGroups = [
  {
    title: 'LINKEDIN',
    items: [
      'Connection requests (up to safe daily limits)',
      'Direct messages and InMails',
      'Profile views and follows',
    ],
  },
  {
    title: 'EMAIL',
    items: ['Gmail, Outlook, or SMTP', 'Deliverability monitoring'],
  },
  {
    title: 'ENRICHMENT',
    items: ['Auto-find emails from LinkedIn', 'Verified business emails'],
  },
  {
    title: 'AI REPLY AGENT',
    items: [
      'AI-powered reply handling',
      'Intent detection (interested, question, objection, not now)',
      'Calendar integration and auto-booking',
      'Responds in your tone',
    ],
  },
  {
    title: 'CORE',
    items: [
      'Unified inbox (LinkedIn + Email)',
      'Multichannel sequences',
      'Dedicated proxy per account',
      'Campaign analytics',
      'API and Webhooks',
    ],
  },
];

// Agency plan: 6 visible bullets
const agencyBullets = [
  '30 LinkedIn senders included (add more at $20/mo each)',
  'Whitelabel. Your brand, your client dashboard.',
  'Unlimited workspaces and client-level reporting',
  'Sender rotation across campaigns',
  'Dedicated Customer Success Manager',
  'Private Slack channel. Sub-4-hour response time.',
];

// Agency plan: expanded feature groups
const agencyExpandedGroups = [
  {
    title: 'SCALE',
    items: [
      '30 LinkedIn senders included',
      'Sender rotation across campaigns',
      'Add more senders at $20/mo each',
    ],
  },
  {
    title: 'AGENCY FEATURES',
    items: [
      'Whitelabel (your brand)',
      'Unlimited workspaces',
      'Client-level reporting',
      'Team permissions and roles',
    ],
  },
  {
    title: 'DEDICATED SUPPORT',
    items: [
      'Dedicated Customer Success Manager',
      'Private Slack channel',
      'Sub-4-hour response time',
      'Migration assistance',
    ],
  },
];

export function PricingPlans() {
  const [senderCount, setSenderCount] = useState(1);
  const totalPrice = PRICE_PER_SENDER * senderCount;
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [growthExpanded, setGrowthExpanded] = useState(false);
  const [agencyExpanded, setAgencyExpanded] = useState(false);

  useEffect(() => {
    (async function () {
      const cal = await getCalApi({ namespace: 'sales-parrot' });
      cal('ui', { hideEventTypeDetails: true, layout: 'month_view' });
    })();
  }, []);

  return (
    <section className="bg-[#FFFBEB] py-12 sm:py-16">
      <Container>
        <div className="mx-auto grid max-w-5xl gap-6 sm:gap-8 lg:grid-cols-2">
          {/* Growth Plan */}
          <motion.div
            initial={{ opacity: 0.2, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="relative rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-[0_8px_30px_rgba(30,41,59,0.06)] sm:p-8"
          >
            <div className="relative z-10">
              {/* Header */}
              <div className="mb-2 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#14B8A6]/10">
                  <svg
                    className="h-5 w-5 text-[#14B8A6]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-[#1E293B]">Growth</h3>
              </div>
              <p className="mb-6 text-sm text-[#64748B]">For founders and small teams</p>

              {/* Price display */}
              <div className="mb-4 sm:mb-6">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-[#1E293B] sm:text-5xl">
                    ${PRICE_PER_SENDER}
                  </span>
                  <span className="text-base text-[#64748B] sm:text-lg">/month</span>
                </div>
                <p className="mt-1 text-sm text-[#94A3B8]">per sender</p>
              </div>

              {/* Sender slider */}
              <div className="mb-6 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 sm:mb-8 sm:p-5">
                <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center sm:gap-0">
                  <span className="text-sm font-semibold text-[#1E293B]">Number of senders</span>
                  <div className="flex items-center justify-center gap-3">
                    <button
                      onClick={() => setSenderCount(Math.max(1, senderCount - 1))}
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E2E8F0] bg-white text-lg font-medium text-[#64748B] transition-all hover:border-[#14B8A6] hover:text-[#14B8A6]"
                    >
                      −
                    </button>
                    <span className="w-8 text-center text-xl font-bold text-[#1E293B]">
                      {senderCount}
                    </span>
                    <button
                      onClick={() => setSenderCount(Math.min(20, senderCount + 1))}
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E2E8F0] bg-white text-lg font-medium text-[#64748B] transition-all hover:border-[#14B8A6] hover:text-[#14B8A6]"
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
                    className="slider-thumb-teal h-2 w-full cursor-pointer appearance-none rounded-full bg-[#E2E8F0]"
                    style={{
                      background: `linear-gradient(to right, #14B8A6 0%, #14B8A6 ${((senderCount - 1) / 19) * 100}%, #E2E8F0 ${((senderCount - 1) / 19) * 100}%, #E2E8F0 100%)`,
                    }}
                  />
                  <div className="mt-2 flex justify-between">
                    <span className="text-xs text-[#94A3B8]">1</span>
                    <span className="text-xs text-[#94A3B8]">20</span>
                  </div>
                </div>

                {/* Total */}
                <div className="mt-5 flex items-center justify-between border-t border-[#E2E8F0] pt-5">
                  <span className="text-sm font-medium text-[#64748B]">Total monthly</span>
                  <span className="text-2xl font-bold text-[#1E293B]">${totalPrice}</span>
                </div>
              </div>

              {/* CTA */}
              <Link
                to={isAuthenticated ? '/dashboard' : '/signup'}
                onClick={() => {
                  if (!isAuthenticated && senderCount > 1) {
                    localStorage.setItem('onboarding_senders', String(senderCount));
                  }
                }}
              >
                <motion.button
                  whileHover={{ scale: 1.01, y: -1 }}
                  whileTap={{ scale: 0.99 }}
                  className="w-full rounded-xl bg-[#14B8A6] px-6 py-4 font-semibold text-white shadow-[0_4px_14px_rgba(20,184,166,0.25)] transition-all duration-200 hover:bg-[#0D9488] hover:shadow-[0_6px_20px_rgba(20,184,166,0.35)]"
                >
                  {isAuthenticated ? 'Go to Dashboard' : 'Get Started'}
                </motion.button>
              </Link>
              {!isAuthenticated && (
                <p className="mt-3 text-center text-xs text-[#94A3B8]">
                  Pay monthly. Cancel anytime.
                </p>
              )}

              {/* 6 Visible Feature Bullets */}
              <div className="mt-8 space-y-3">
                {growthBullets.map((item, i) => (
                  <FeatureBullet key={i} text={item} color="teal" />
                ))}
              </div>

              {/* See all features expandable */}
              <ExpandableFeatures
                expanded={growthExpanded}
                onToggle={() => setGrowthExpanded(!growthExpanded)}
                groups={growthExpandedGroups}
                color="teal"
              />
            </div>
          </motion.div>

          {/* Agency Plan */}
          <motion.div
            initial={{ opacity: 0.2, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="relative rounded-2xl border-2 border-[#FF6B35] bg-white p-5 shadow-[0_8px_30px_rgba(255,107,53,0.12)] sm:p-8"
          >
            {/* Best value badge */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <div className="rounded-full bg-[#FF6B35] px-4 py-2 shadow-[0_4px_14px_rgba(255,107,53,0.3)]">
                <span className="text-xs font-bold tracking-wide text-white">
                  BEST FOR AGENCIES
                </span>
              </div>
            </div>

            <div className="relative z-10 pt-2">
              {/* Header */}
              <div className="mb-2 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FF6B35]/10">
                  <svg
                    className="h-5 w-5 text-[#FF6B35]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-[#1E293B]">Agency</h3>
              </div>
              <p className="mb-6 text-sm text-[#64748B]">For agencies &amp; large sales teams</p>

              {/* Price */}
              <div className="mb-6 sm:mb-8">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-[#1E293B] sm:text-5xl">$999</span>
                  <span className="text-base text-[#64748B] sm:text-lg">/month</span>
                </div>
                <p className="mt-1 text-sm text-[#94A3B8]">30 senders included</p>
                <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#FF6B35]/10 px-3 py-1.5">
                  <span className="text-xs font-semibold text-[#FF6B35]">
                    Annual: $749/mo (save 25%)
                  </span>
                </div>
              </div>

              {/* CTA */}
              <motion.button
                whileHover={{ scale: 1.01, y: -1 }}
                whileTap={{ scale: 0.99 }}
                data-cal-namespace="sales-parrot"
                data-cal-link="akinthinks/sales-parrot"
                data-cal-config='{"layout":"month_view","useSlotsViewOnSmallScreen":"true"}'
                className="w-full rounded-xl bg-[#FF6B35] px-6 py-4 font-semibold text-white shadow-[0_4px_14px_rgba(255,107,53,0.25)] transition-all duration-200 hover:bg-[#E85A2A] hover:shadow-[0_6px_20px_rgba(255,107,53,0.35)]"
              >
                Book a Demo
              </motion.button>
              <p className="mt-3 text-center text-xs text-[#94A3B8]">
                Get a personalized walkthrough
              </p>

              {/* Everything in Growth */}
              <div className="mb-6 mt-8 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
                <div className="flex items-center gap-2">
                  <svg
                    className="h-4 w-4 text-[#14B8A6]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm font-medium text-[#1E293B]">
                    Everything in Growth, plus:
                  </span>
                </div>
              </div>

              {/* 6 Visible Feature Bullets */}
              <div className="space-y-3">
                {agencyBullets.map((item, i) => (
                  <FeatureBullet key={i} text={item} color="orange" />
                ))}
              </div>

              {/* See all features expandable */}
              <ExpandableFeatures
                expanded={agencyExpanded}
                onToggle={() => setAgencyExpanded(!agencyExpanded)}
                groups={agencyExpandedGroups}
                color="orange"
              />
            </div>
          </motion.div>
        </div>

        {/* Agency recommendation note */}
        <motion.div
          initial={{ opacity: 0.3, y: 6 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="mt-12 text-center"
        >
          <p className="text-sm text-[#64748B]">
            Need 11+ senders? Agency plan is better value at $33/sender.
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
  );
}

/* ── Shared sub-components ── */

function FeatureBullet({ text, color }: { text: string; color: 'teal' | 'orange' }) {
  const checkColor = color === 'orange' ? 'text-[#FF6B35]' : 'text-[#14B8A6]';
  return (
    <div className="flex items-start gap-2.5">
      <svg
        className={`h-4 w-4 ${checkColor} mt-0.5 flex-shrink-0`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2.5}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
      <span className="text-sm text-[#64748B]">{text}</span>
    </div>
  );
}

function ExpandableFeatures({
  expanded,
  onToggle,
  groups,
  color,
}: {
  expanded: boolean;
  onToggle: () => void;
  groups: { title: string; items: string[] }[];
  color: 'teal' | 'orange';
}) {
  const accentColor = color === 'orange' ? 'text-[#FF6B35]' : 'text-[#14B8A6]';
  const checkColor = color === 'orange' ? 'text-[#FF6B35]' : 'text-[#14B8A6]';

  return (
    <div className="mt-6">
      <button
        onClick={onToggle}
        className={`group flex items-center gap-1.5 text-sm font-semibold ${accentColor} transition-colors duration-200 hover:opacity-80`}
      >
        <span>{expanded ? 'Hide details' : 'See all features'}</span>
        <motion.svg
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.25 }}
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </motion.svg>
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="mt-5 space-y-5 border-t border-[#E2E8F0] pt-5">
              {groups.map((group) => (
                <div key={group.title}>
                  <h4 className="mb-3 text-[10px] font-bold tracking-[0.15em] text-[#94A3B8]">
                    {group.title}
                  </h4>
                  <ul className="space-y-2">
                    {group.items.map((item, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <svg
                          className={`h-4 w-4 ${checkColor} mt-0.5 flex-shrink-0`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2.5}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-sm text-[#64748B]">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
