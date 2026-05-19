import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Container } from '@/components/ui';
import {
  Target,
  Mail,
  Search,
  CheckCircle2,
  XCircle,
  Plus,
  PlusSquare,
  Zap,
  MousePointerClick,
} from 'lucide-react';

export function JourneySection() {
  const [isHoveredPlus, setIsHoveredPlus] = useState(false);

  return (
    <section className="relative overflow-hidden border-t border-slate-100 bg-slate-50/60 py-20 md:py-28">
      <Container>
        {/* Header */}
        <div className="mx-auto mb-12 max-w-2xl px-4 text-center">
          <h2 className="mb-4 text-[28px] font-semibold leading-[1.15] tracking-[-0.03em] text-[#1E293B] md:text-[38px]">
            One system for the full growth journey.
          </h2>
          <p className="text-[15px] font-medium leading-relaxed text-slate-500 md:text-[16px]">
            Move from first signal to lasting customer relationship without stitching together
            disconnected tools.
          </p>
        </div>

        {/* Visual Pipeline Dotted Canvas Grid Container */}
        <div
          className="relative mx-auto flex min-h-[880px] w-full max-w-[860px] select-none flex-col items-center justify-start overflow-hidden rounded-[32px] border border-slate-200/80 bg-white p-6 pb-16 shadow-[0_4px_30px_rgba(0,0,0,0.015)] md:p-12 md:pb-20"
          style={{
            backgroundImage: 'radial-gradient(#CBD5E1 1.2px, transparent 1.2px)',
            backgroundSize: '24px 24px',
          }}
        >
          {/* NODE 1: FIND */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45 }}
            className="z-10 w-full max-w-[340px] rounded-[20px] border border-slate-200/90 bg-white p-5 shadow-[0_4px_20px_rgba(0,0,0,0.02)]"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-100 bg-slate-50 text-slate-400">
                  <Target className="h-4.5 w-4.5 text-slate-400" />
                </div>
                <div>
                  <span className="block text-[13px] font-semibold leading-none text-[#1E293B]">
                    Find
                  </span>
                  <span className="mt-1.5 block text-[11px] font-medium leading-none text-slate-400">
                    01 Signal Discovery
                  </span>
                </div>
              </div>
              <span className="rounded-full border border-slate-200/50 bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                1 Task
              </span>
            </div>

            <div className="mt-3.5 flex flex-wrap gap-1.5 border-t border-slate-100 pt-3.5">
              <span className="rounded-lg border border-slate-200 bg-slate-50/50 px-2.5 py-0.5 text-[10px] font-medium text-slate-500">
                Scan target hire triggers
              </span>
            </div>
          </motion.div>

          {/* CONNECTOR LINE WITH INTERACTIVE PLUS STAGE TRIGGER */}
          <div className="relative z-20 h-12 w-[1.5px] bg-slate-200">
            <div
              onMouseEnter={() => setIsHoveredPlus(true)}
              onMouseLeave={() => setIsHoveredPlus(false)}
              className="h-6.5 w-6.5 absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-[#EA580C] text-white shadow-md shadow-orange-100 transition-all duration-200 hover:scale-110"
            >
              <Plus className="h-4 w-4 stroke-[3]" />

              {/* Dynamic Flyout Popup Menu styled exactly like the screenshot */}
              <AnimatePresence>
                {isHoveredPlus && (
                  <motion.div
                    initial={{ opacity: 0, x: -10, y: '-50%' }}
                    animate={{ opacity: 1, x: 0, y: '-50%' }}
                    exit={{ opacity: 0, x: -10, y: '-50%' }}
                    className="absolute left-8 top-1/2 z-50 flex min-w-[140px] flex-col gap-1 rounded-xl border border-slate-200/80 bg-white p-1.5 shadow-lg"
                  >
                    <div className="flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-1.5 text-[10.5px] font-bold text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-800">
                      <PlusSquare className="h-3.5 w-3.5 text-slate-400" />
                      <span>Add Stage</span>
                    </div>
                    <div className="flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-1.5 text-[10.5px] font-bold text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-800">
                      <Zap className="h-3.5 w-3.5 text-slate-400" />
                      <span>Add Trigger</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* NODE 2: ENGAGE */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: 0.05 }}
            className="z-10 w-full max-w-[340px] rounded-[20px] border border-slate-200/90 bg-white p-5 shadow-[0_4px_20px_rgba(0,0,0,0.02)]"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-100 bg-slate-50 text-slate-400">
                  <Mail className="h-4.5 w-4.5 text-slate-400" />
                </div>
                <div>
                  <span className="block text-[13px] font-semibold leading-none text-[#1E293B]">
                    Engage
                  </span>
                  <span className="mt-1.5 block text-[11px] font-medium leading-none text-slate-400">
                    02 Multi-Channel Outbound
                  </span>
                </div>
              </div>
              <span className="rounded-full border border-slate-200/50 bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                2 Tasks
              </span>
            </div>

            <div className="mt-3.5 flex flex-wrap gap-1.5 border-t border-slate-100 pt-3.5">
              <span className="rounded-lg border border-slate-200 bg-slate-50/50 px-2.5 py-0.5 text-[10px] font-medium text-slate-500">
                Founder Sequence Email
              </span>
              <span className="rounded-lg border border-slate-200 bg-slate-50/50 px-2.5 py-0.5 text-[10px] font-medium text-slate-500">
                LinkedIn Connection
              </span>
            </div>
          </motion.div>

          {/* CONNECTOR LINE */}
          <div className="z-10 h-10 w-[1.5px] bg-slate-200" />

          {/* NODE 3: CLOSE */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: 0.1 }}
            className="group relative z-10 w-full max-w-[340px] rounded-[20px] border border-slate-200/90 bg-white p-5 shadow-[0_4px_20px_rgba(0,0,0,0.02)]"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-100 bg-slate-50 text-slate-400">
                  <Search className="h-4.5 w-4.5 text-slate-400" />
                </div>
                <div>
                  <span className="block text-[13px] font-semibold leading-none text-[#1E293B]">
                    Close
                  </span>
                  <span className="mt-1.5 block text-[11px] font-medium leading-none text-slate-400">
                    03 Conversion Agent
                  </span>
                </div>
              </div>
              <div className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-slate-100 bg-slate-50 text-slate-400 transition-colors hover:bg-orange-50 hover:text-[#EA580C]">
                <MousePointerClick className="h-3.5 w-3.5" />
              </div>
            </div>

            <div className="mt-3.5 flex flex-wrap gap-1.5 border-t border-slate-100 pt-3.5">
              <span className="rounded-lg border border-slate-200 bg-slate-50/50 px-2.5 py-0.5 text-[10px] font-medium text-slate-500">
                AI Auto-Booked Invite
              </span>
            </div>
          </motion.div>

          {/* TRIGGERS OUTCOME BRIDGE */}
          <div className="z-10 mt-4 flex w-[180px] items-center justify-between rounded-full border border-slate-200/80 bg-slate-50 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500 shadow-sm">
            <span>2 Outcomes</span>
            <span className="text-slate-400">→</span>
          </div>

          {/* CONNECTOR LINE TO SPLIT */}
          <div className="z-10 h-5 w-[1.5px] bg-slate-200" />

          {/* MULTI-BRANCH FLOW SPLIT (Left: Retain, Right: Expand) */}
          <div className="relative z-10 flex w-full flex-col items-center">
            {/* Horizontal Branching Split Bar */}
            <div className="hidden h-6 w-[380px] rounded-t-xl border-x-2 border-t-2 border-slate-200 md:block" />

            {/* Branches Row */}
            <div className="flex w-full flex-col justify-center gap-6 md:-mt-[2px] md:flex-row md:gap-12">
              {/* BRANCH LEFT: RETAIN */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.15 }}
                className="flex w-full flex-col items-center md:w-auto"
              >
                {/* Mobile vertical helper connector */}
                <div className="block h-4 w-[1.5px] bg-slate-200 md:hidden" />

                <div className="w-full rounded-[20px] border border-slate-200/90 bg-white p-5 shadow-[0_4px_20px_rgba(0,0,0,0.02)] md:w-[245px]">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-100 bg-slate-50 text-slate-400">
                      <CheckCircle2 className="h-4.5 w-4.5 text-slate-400" />
                    </div>
                    <div>
                      <span className="block text-[13px] font-semibold leading-none text-[#1E293B]">
                        Retain
                      </span>
                      <span className="mt-1.5 block text-[11px] font-medium leading-none text-slate-400">
                        04 Client Retention
                      </span>
                    </div>
                  </div>

                  <div className="mt-3.5 flex flex-wrap gap-1.5 border-t border-slate-100 pt-3.5">
                    <span className="rounded-lg border border-slate-200 bg-slate-50/50 px-2.5 py-0.5 text-[10px] font-medium text-slate-500">
                      QBR Flow
                    </span>
                    <span className="rounded-lg border border-slate-200 bg-slate-50/50 px-2.5 py-0.5 text-[10px] font-medium text-slate-500">
                      Monthly Warmup
                    </span>
                  </div>

                  <div className="border-slate-150 mt-3.5 flex w-full items-center justify-between rounded-full border bg-slate-50 px-3 py-1.5 text-[9px] font-medium text-slate-500">
                    <span>3 Triggers</span>
                    <span className="text-slate-400">→</span>
                  </div>
                </div>
              </motion.div>

              {/* BRANCH RIGHT: EXPAND */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="flex w-full flex-col items-center md:w-auto"
              >
                {/* Mobile vertical helper connector */}
                <div className="block h-4 w-[1.5px] bg-slate-200 md:hidden" />

                <div className="w-full rounded-[20px] border border-slate-200/90 bg-white p-5 shadow-[0_4px_20px_rgba(0,0,0,0.02)] md:w-[245px]">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-100 bg-slate-50 text-slate-400">
                      <XCircle className="h-4.5 w-4.5 text-slate-400" />
                    </div>
                    <div>
                      <span className="block text-[13px] font-semibold leading-none text-[#1E293B]">
                        Expand
                      </span>
                      <span className="mt-1.5 block text-[11px] font-medium leading-none text-slate-400">
                        05 Account Expansion
                      </span>
                    </div>
                  </div>

                  <div className="mt-3.5 flex flex-wrap gap-1.5 border-t border-slate-100 pt-3.5">
                    <span className="rounded-lg border border-slate-200 bg-slate-50/50 px-2.5 py-0.5 text-[10px] font-medium text-slate-500">
                      Upsell Engine
                    </span>
                    <span className="rounded-lg border border-slate-200 bg-slate-50/50 px-2.5 py-0.5 text-[10px] font-medium text-slate-500">
                      Custom Reminders
                    </span>
                  </div>

                  <div className="border-slate-150 mt-3.5 flex w-full items-center justify-between rounded-full border bg-slate-50 px-3 py-1.5 text-[9px] font-medium text-slate-500">
                    <span>2 Triggers</span>
                    <span className="text-slate-400">→</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
