import { motion } from 'framer-motion';
import { Container } from '@/components/ui';
import { Workflow, Inbox, Zap, Database, ShieldCheck, Compass } from 'lucide-react';

const features = [
  {
    title: 'Smart Outreach Sequencing',
    desc: 'Build multi-channel sequences across LinkedIn and email.',
    icon: Workflow,
  },
  {
    title: 'Unified Inbox',
    desc: 'Manage every reply from one place across your team and channels.',
    icon: Inbox,
  },
  {
    title: 'AI Reply Agent',
    desc: 'Responds in your voice, follows up, handles replies, books meetings.',
    icon: Zap,
  },
  {
    title: 'Lead Enrichment',
    desc: 'Find and verify emails without wasting enrichment credits.',
    icon: Database,
  },
  {
    title: 'Safe LinkedIn Execution',
    desc: 'Multiple accounts with smart limits, warm-up, and safe sending.',
    icon: ShieldCheck,
  },
  {
    title: 'Growth Playbooks',
    desc: 'Guided motions for prospecting, events, reactivation, partnerships.',
    icon: Compass,
  },
];

export function FeaturesSection() {
  return (
    <section className="border-t border-slate-100 bg-slate-50/50 py-20 md:py-28">
      <Container>
        <div className="mx-auto max-w-[1000px]">
          {/* Header */}
          <div className="mx-auto mb-16 max-w-2xl px-4 text-center">
            <h2 className="mb-4 text-[28px] font-semibold leading-[1.15] tracking-[-0.03em] text-[#1E293B] md:text-[38px]">
              Your AI sales employee, <br />
              connected to your growth engine.
            </h2>
            <p className="text-[14px] font-semibold uppercase tracking-widest text-slate-400 md:text-[15px]">
              Unified outbound stack
            </p>
          </div>

          {/* Bento Features Grid */}
          <div className="grid grid-cols-1 gap-6 px-2 sm:px-0 md:grid-cols-3">
            {features.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <motion.div
                  key={feat.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: idx * 0.05, ease: [0.22, 1, 0.36, 1] }}
                  whileHover={{ y: -2 }}
                  className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_4px_20px_rgba(0,0,0,0.01)] transition-all duration-200 hover:shadow-[0_8px_30px_rgba(99,102,241,0.04)]"
                >
                  <div className="mb-5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-100 bg-slate-50 text-slate-400">
                    <Icon className="h-5 w-5 stroke-[1.8]" />
                  </div>
                  <h3 className="mb-2 text-[16px] font-bold tracking-tight text-[#1E293B]">
                    {feat.title}
                  </h3>
                  <p className="text-[13px] font-medium leading-relaxed text-slate-500">
                    {feat.desc}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </Container>
    </section>
  );
}
