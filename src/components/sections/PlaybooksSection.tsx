import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Container } from '@/components/ui';

interface PlaybookItem {
  title: string;
  desc: string;
  bestFor?: string;
  ctaText: string;
  isActive: boolean;
  image?: string;
}

const activePlaybooks: PlaybookItem[] = [
  {
    title: 'Signal-Led Prospecting',
    desc: 'Start outreach from real buyer signals instead of broad title lists.',
    bestFor: 'Hiring, funding, tech stack, role changes, market triggers.',
    ctaText: 'Start this playbook',
    isActive: true,
    image: '/images/img12.png',
  },
  {
    title: 'Event-Led Relationship Selling',
    desc: 'Turn events into pipeline before, during, and after the room.',
    bestFor: 'Dinners, webinars, conferences, private events, meetups.',
    ctaText: 'Start this playbook',
    isActive: true,
    image: '/images/img13.png',
  },
  {
    title: 'Founder-Led Sales',
    desc: "Scale the founder's voice without losing the founder's edge.",
    bestFor: 'POV, story, offer, or insight into a repeatable motion.',
    ctaText: 'Start this playbook',
    isActive: true,
    image: '/images/img14.png',
  },
];

const upcomingPlaybooks: PlaybookItem[] = [
  {
    title: 'Lead Reactivation',
    desc: 'Wake up old pipeline and surface new meetings.',
    ctaText: 'Preview',
    isActive: false,
    image: '/playbooks/lead-reactivation.png',
  },
  {
    title: 'Referral Partner Engine',
    desc: 'Build a repeatable referral and partnership channel.',
    ctaText: 'Preview',
    isActive: false,
    image: '/playbooks/referral-partner-engine.png',
  },
  {
    title: 'Local Market Domination',
    desc: 'Cover a local market with one coordinated motion.',
    ctaText: 'Preview',
    isActive: false,
    image: '/playbooks/local-market-domination.png',
  },
];

export function PlaybooksSection() {
  return (
    <section className="border-t border-slate-100 bg-slate-50/50 py-20 md:py-28">
      <Container>
        <div className="mx-auto max-w-[1000px]">
          {/* Header */}
          <div className="mx-auto mb-16 max-w-2xl px-4 text-center">
            <h2 className="mb-4 text-[28px] font-semibold leading-[1.15] tracking-[-0.03em] text-[#1E293B] md:text-[38px]">
              Start with a proven growth motion. <br className="hidden sm:block" />
              Not a blank page.
            </h2>
            <p className="text-[15px] font-medium leading-relaxed text-slate-500 md:text-[16px]">
              Choose a ready-to-run playbook, answer a few guided prompts, and SalesParrot helps you
              build the audience, campaign, reply path, and follow-up motion.
            </p>
          </div>

          {/* Active Playbooks Grid */}
          <div className="mb-10 grid grid-cols-1 gap-6 px-2 sm:px-0 md:grid-cols-3">
            {activePlaybooks.map((pb, idx) => (
              <motion.div
                key={pb.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.08, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -4 }}
                className="group flex flex-col rounded-3xl border border-slate-200/60 bg-white p-6 transition-all duration-200"
              >
                {pb.image && (
                  <div className="relative -mx-6 -mt-6 mb-5 flex aspect-[1.4] w-full items-center justify-center overflow-hidden rounded-t-3xl border-b border-slate-100 bg-slate-50">
                    <img
                      src={pb.image}
                      alt={pb.title}
                      className="group-hover:scale-103 h-full w-full object-cover transition-transform duration-500"
                    />
                  </div>
                )}

                <div className="flex-1">
                  <span className="mb-4 inline-flex rounded-full border border-orange-100/30 bg-[#FFEDD5] px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-[#EA580C]">
                    Ready to run
                  </span>
                  <h3 className="mb-2 text-[18px] font-semibold tracking-tight text-[#1E293B]">
                    {pb.title}
                  </h3>
                  <p className="mb-4 text-[13px] font-medium leading-relaxed text-slate-500">
                    {pb.desc}
                  </p>
                </div>

                <div className="mt-4 border-t border-slate-100 pt-4">
                  <span className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Best For
                  </span>
                  <p className="mb-5 text-[12px] font-semibold leading-relaxed text-slate-600">
                    {pb.bestFor}
                  </p>
                  <button className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#EA580C] py-2.5 text-[13px] font-semibold text-white transition-all duration-200 hover:bg-[#C2410C]">
                    {pb.ctaText}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Upcoming Playbooks Row */}
          <div className="grid grid-cols-1 gap-6 px-2 sm:px-0 md:grid-cols-3">
            {upcomingPlaybooks.map((pb, idx) => (
              <motion.div
                key={pb.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.08 + 0.2, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -2 }}
                className="flex items-center justify-between rounded-2xl border border-slate-200/40 bg-white/70 p-4 transition-all duration-200"
              >
                <div className="flex min-w-0 flex-1 items-center pr-4">
                  <div className="min-w-0">
                    <h4 className="text-[14px] font-semibold tracking-tight text-[#1E293B]">
                      {pb.title}
                    </h4>
                    <p className="mt-0.5 truncate text-[12px] font-medium text-slate-500">
                      {pb.desc}
                    </p>
                  </div>
                </div>
                <button className="shrink-0 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-[12px] font-semibold text-slate-600 transition-all duration-200 hover:bg-slate-50">
                  {pb.ctaText}
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
