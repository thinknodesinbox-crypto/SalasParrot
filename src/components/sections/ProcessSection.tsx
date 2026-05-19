import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Container } from '@/components/ui';
import { MessageSquareText, FileSpreadsheet, ArrowUpRight } from 'lucide-react';

const steps = [
  {
    id: 1,
    num: '01',
    title: 'Describe the motion',
    desc: 'Tell SalesParrot who you want to reach, what signal matters, what event you are running, or which growth outcome you want.',
    icon: MessageSquareText,
  },
  {
    id: 2,
    num: '02',
    title: 'SalesParrot builds the path',
    desc: 'Find the audience, enrich contacts, draft the campaign, map the reply flow, and prepare the motion for launch.',
    icon: FileSpreadsheet,
  },
  {
    id: 3,
    num: '03',
    title: 'Launch and learn',
    desc: 'Go live across LinkedIn and email, manage replies, book meetings, and improve every motion over time.',
    icon: ArrowUpRight,
  },
];

export function ProcessSection() {
  const [activeStep, setActiveStep] = useState(1);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [typedText, setTypedText] = useState('');
  const fullPromptText =
    'Find SaaS founders in SF hiring reps on LinkedIn, verify their business emails, and launch founder sequences...';

  // Typing effect for Step 1
  useEffect(() => {
    if (activeStep !== 1) {
      setTypedText('');
      return;
    }

    let currentIndex = 0;
    setTypedText('');
    const interval = setInterval(() => {
      if (currentIndex < fullPromptText.length) {
        setTypedText(fullPromptText.slice(0, currentIndex + 1));
        currentIndex++;
      } else {
        clearInterval(interval);
      }
    }, 25); // super slick 25ms per character typing speed

    return () => clearInterval(interval);
  }, [activeStep]);

  // Auto-play steps rotation
  useEffect(() => {
    setProgress(0);
    if (intervalRef.current) clearInterval(intervalRef.current);

    const duration = 7500; // 7.5 seconds per step
    const intervalTime = 100;
    const stepIncrement = (intervalTime / duration) * 100;

    intervalRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setActiveStep((current) => (current === 3 ? 1 : current + 1));
          return 0;
        }
        return prev + stepIncrement;
      });
    }, intervalTime);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [activeStep]);

  const handleStepClick = (stepId: number) => {
    setActiveStep(stepId);
    setProgress(0);
  };

  const renderSimulator = () => {
    return (
      <div className="relative flex min-h-[380px] w-full flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white font-sans text-[#1E293B] sm:min-h-[400px]">
        {/* Custom Premium Header Bar */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200/60 bg-slate-50 px-5 py-3.5">
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-[#EA580C]" />
            <span className="text-[12px] font-semibold text-slate-700">Campaign Creator</span>
          </div>

          {/* Segmented View Mode Tabs */}
          <div className="hidden items-center gap-1 rounded-lg border border-slate-200/40 bg-slate-100 p-0.5 sm:flex">
            <span className="rounded border border-slate-200/50 bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-800">
              Editor
            </span>
            <span className="rounded px-2 py-0.5 text-[11px] font-semibold text-slate-400">
              Prospects
            </span>
            <span className="rounded px-2 py-0.5 text-[11px] font-semibold text-slate-400">
              Analytics
            </span>
          </div>

          <div className="flex items-center gap-1 rounded-full border border-orange-100 bg-[#FFEDD5] px-2.5 py-0.5 text-[11px] font-semibold text-[#EA580C]">
            Connected
          </div>
        </div>

        {/* Simulated SaaS Dashboard Body */}
        <div className="relative flex flex-1 flex-col justify-between bg-white p-4 sm:p-6">
          <AnimatePresence mode="wait">
            {/* STEP 1: AI CAMPAIGN PROMPT BUILDER */}
            {activeStep === 1 && (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className="flex flex-1 flex-col justify-between"
              >
                <div>
                  <div className="mb-3 flex items-center gap-1.5 text-[12.5px] font-semibold text-slate-400">
                    Describe your growth motion in plain English
                  </div>

                  <div className="flex min-h-[110px] flex-col justify-between rounded-2xl border border-slate-200/80 bg-slate-50 p-4 sm:p-5">
                    <div className="relative text-[13px] font-semibold leading-relaxed text-[#1E293B] sm:text-[14px]">
                      {/* Beautiful Inline Quotes respecting container padding */}
                      <span className="mr-1 select-none text-slate-400">“</span>
                      <span>{typedText}</span>
                      <span className="ml-1 select-none text-slate-400">”</span>
                      <span className="ml-0.5 inline-block h-4 w-[2px] animate-pulse bg-[#EA580C] align-middle" />
                    </div>

                    {/* Processed Pill Badges */}
                    <div className="mt-4 flex flex-wrap gap-1.5 border-t border-slate-200/60 pt-3 sm:gap-2">
                      <span className="rounded-full border border-slate-200/30 bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-600 sm:px-3 sm:text-[11px]">
                        Signal: Hiring Outreach
                      </span>
                      <span className="rounded-full border border-orange-100/50 bg-[#FFEDD5] px-2.5 py-1 text-[10px] font-semibold text-[#EA580C] sm:px-3 sm:text-[11px]">
                        Target: SaaS Founders
                      </span>
                      <span className="rounded-full border border-indigo-100/30 bg-indigo-50 px-2.5 py-1 text-[10px] font-semibold text-indigo-600 sm:px-3 sm:text-[11px]">
                        Channels: Email + LinkedIn
                      </span>
                    </div>
                  </div>
                </div>

                {/* Interactive dynamic visual feedback */}
                <div className="mt-4 flex items-center gap-3 rounded-2xl border border-emerald-100/60 bg-emerald-50 px-4 py-3 text-emerald-700">
                  <span className="text-[11.5px] font-semibold leading-none sm:text-[12px]">
                    Playbook mapped successfully: Initiating automated audience building...
                  </span>
                </div>
              </motion.div>
            )}

            {/* STEP 2: PROSPECT TABLE & ENRICHMENT */}
            {activeStep === 2 && (
              <motion.div
                key="step-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className="flex flex-1 flex-col justify-between"
              >
                <div>
                  <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-2 text-slate-400">
                    <span className="flex items-center gap-2 text-[12.5px] font-semibold text-slate-500">
                      <span>Enriching Contacts & Verifying Emails</span>
                    </span>
                    <span className="flex items-center gap-1 rounded-full border border-orange-100 bg-[#FFEDD5] px-2.5 py-0.5 text-[10px] font-semibold text-[#EA580C] sm:px-3 sm:text-[11px]">
                      <span>210 In Queue</span>
                    </span>
                  </div>

                  {/* Contact enrichment items list */}
                  <div className="flex flex-col gap-2">
                    {/* Target 1 */}
                    <div className="flex items-center justify-between rounded-xl border border-slate-200/50 bg-slate-50/50 p-2.5 sm:p-3">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-[10px] font-semibold text-slate-600 sm:h-7 sm:w-7 sm:text-[11px]">
                          ET
                        </div>
                        <div>
                          <span className="block text-[11.5px] font-semibold text-[#1E293B] sm:text-[12px]">
                            Eric Thomas
                          </span>
                          <span className="block text-[10px] font-semibold text-slate-400 sm:text-[11px]">
                            CEO @ Catalyst Commerce
                          </span>
                        </div>
                      </div>
                      <span className="rounded border border-emerald-100/60 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 sm:px-2.5 sm:text-[11px]">
                        <span>eric@catalyst.com</span>
                      </span>
                    </div>

                    {/* Target 2 */}
                    <div className="flex items-center justify-between rounded-xl border border-slate-200/50 bg-slate-50/50 p-2.5 sm:p-3">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-[10px] font-semibold text-slate-600 sm:h-7 sm:w-7 sm:text-[11px]">
                          SA
                        </div>
                        <div>
                          <span className="block text-[11.5px] font-semibold text-[#1E293B] sm:text-[12px]">
                            Samuel A
                          </span>
                          <span className="block text-[10px] font-semibold text-slate-400 sm:text-[11px]">
                            Director of Sales @ KP
                          </span>
                        </div>
                      </div>
                      <span className="rounded border border-emerald-100/60 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 sm:px-2.5 sm:text-[11px]">
                        <span>samuel@kp.com</span>
                      </span>
                    </div>

                    {/* Target 3 */}
                    <div className="flex items-center justify-between rounded-xl border border-slate-200/30 bg-slate-50/50 p-2.5 opacity-60 sm:p-3">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-[10px] font-semibold text-slate-600 sm:h-7 sm:w-7 sm:text-[11px]">
                          LN
                        </div>
                        <div>
                          <span className="block text-[11.5px] font-semibold text-[#1E293B] sm:text-[12px]">
                            Luna Northcott
                          </span>
                          <span className="block text-[10px] font-semibold text-slate-400 sm:text-[11px]">
                            VP of Sales @ Maven Digital
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] font-semibold text-slate-500 sm:text-[11px]">
                        <span>Enriching...</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-2 text-right text-[10.5px] font-semibold text-slate-400 sm:text-[11.5px]">
                  100% compliant enrichment pipeline
                </div>
              </motion.div>
            )}

            {/* STEP 3: LIVE LAUNCH & MULTI-CHANNEL SEQUENCING */}
            {activeStep === 3 && (
              <motion.div
                key="step-3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className="flex flex-1 flex-col justify-between"
              >
                <div>
                  <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-2 text-slate-400">
                    <span className="text-[12.5px] font-semibold text-slate-500">
                      Live Campaign Sequence Path
                    </span>
                    <span className="animate-pulse rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
                      <span>Live</span>
                    </span>
                  </div>

                  {/* Message Flow visual timeline */}
                  <div className="relative flex flex-col gap-3">
                    {/* vertical timeline connector line */}
                    <div className="absolute bottom-[15px] left-[13px] top-[15px] w-[1px] bg-slate-200 sm:left-[15px]" />

                    <div className="relative flex items-start gap-3 sm:gap-4">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-[10px] font-semibold text-slate-600 sm:h-8 sm:w-8 sm:text-[11px]">
                        01
                      </div>
                      <div className="flex-1 rounded-xl border border-slate-200/50 bg-slate-50/50 p-2.5 sm:p-3">
                        <span className="block text-[11.5px] font-semibold text-[#1E293B] sm:text-[12px]">
                          LinkedIn DM Sent
                        </span>
                        <span className="mt-0.5 block text-[10.5px] font-semibold text-slate-500 sm:mt-1 sm:text-[11.5px]">
                          "Hi Eric, noticed you are hiring a rep... do you have a system in place?"
                        </span>
                      </div>
                    </div>

                    <div className="relative flex items-start gap-3 sm:gap-4">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-orange-100 bg-orange-50 text-[10px] font-semibold text-[#EA580C] sm:h-8 sm:w-8 sm:text-[11px]">
                        02
                      </div>
                      <div className="flex-1 rounded-xl border border-orange-100 bg-[#FFEDD5]/40 p-2.5 sm:p-3">
                        <span className="block text-[11.5px] font-semibold text-[#1E293B] sm:text-[12px]">
                          Prospect Reply
                        </span>
                        <span className="mt-0.5 block text-[10.5px] font-semibold text-[#EA580C] sm:mt-1 sm:text-[11.5px]">
                          "Yeah, looking for something that handles both email and LinkedIn. Do you
                          have a demo?"
                        </span>
                      </div>
                    </div>

                    <div className="relative flex items-start gap-3 sm:gap-4">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#FED7AA] bg-[#FFEDD5] text-[10px] font-semibold text-[#EA580C] sm:h-8 sm:w-8 sm:text-[11px]">
                        03
                      </div>
                      <div className="flex-1 rounded-xl border border-[#FED7AA] bg-[#FFF7ED] p-2.5 sm:p-3">
                        <span className="block text-[11.5px] font-semibold text-[#EA580C] sm:text-[12px]">
                          AI Auto-Booked Invite
                        </span>
                        <span className="mt-0.5 block text-[10.5px] font-semibold text-slate-500 sm:mt-1 sm:text-[11.5px]">
                          "Sure, Eric! I booked us for Friday at 2 PM. Details are in your inbox."
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 w-fit rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-[11.5px] font-semibold text-emerald-700 sm:text-[12px]">
                  <span>Meeting auto-synced to Google Calendar</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  };

  return (
    <section className="relative overflow-hidden border-t border-slate-100 bg-slate-50/50 py-20 md:py-28">
      <Container>
        <div className="mx-auto max-w-[1000px]">
          {/* Header */}
          <div className="mx-auto mb-16 max-w-xl px-4 text-center">
            <h2 className="mb-3 text-[28px] font-semibold leading-tight tracking-[-0.03em] text-[#1E293B] md:text-[38px]">
              From growth goal to live campaign in minutes.
            </h2>
            <p className="text-[14px] font-semibold text-slate-400 md:text-[15px]">
              Launch at pure speed
            </p>
          </div>

          {/* Interactive Split Workspace */}
          <div className="grid grid-cols-1 items-stretch gap-8 px-2 sm:px-0 md:grid-cols-12">
            {/* Left Column: Interactive Steps List */}
            <div className="flex flex-col justify-center gap-4 md:col-span-5">
              {steps.map((step) => {
                const Icon = step.icon;
                const isActive = activeStep === step.id;

                return (
                  <div key={step.id} className="flex w-full flex-col">
                    <button
                      onClick={() => handleStepClick(step.id)}
                      className={`relative flex items-start gap-4 overflow-hidden rounded-2xl border p-5 text-left transition-all duration-300 ${
                        isActive
                          ? 'border-slate-200 bg-white text-[#1E293B]'
                          : 'border-transparent bg-transparent text-slate-500 hover:bg-slate-100/50 hover:text-slate-800'
                      }`}
                    >
                      {/* Active Progress Timeline Line on Left */}
                      {isActive && (
                        <div className="absolute bottom-0 left-0 top-0 w-[3px] bg-[#EA580C]">
                          <motion.div
                            className="w-full bg-[#C2410C]"
                            initial={{ height: '0%' }}
                            animate={{ height: `${progress}%` }}
                            transition={{ ease: 'linear', duration: 0.1 }}
                          />
                        </div>
                      )}

                      {/* Step Icon Badge */}
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-all duration-300 ${
                          isActive
                            ? 'border-orange-100 bg-[#FFEDD5] text-[#EA580C]'
                            : 'border-slate-200/50 bg-slate-100 text-slate-400'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>

                      <div className="min-w-0">
                        <span className="mb-0.5 block text-[11px] font-semibold text-[#EA580C]">
                          Step {step.num}
                        </span>
                        <h3 className="mb-1 text-[16px] font-semibold tracking-tight text-[#1E293B]">
                          {step.title}
                        </h3>
                        <p className="text-[13px] font-medium leading-relaxed text-slate-500">
                          {step.desc}
                        </p>
                      </div>
                    </button>

                    {/* Inline Mobile Dashboard Simulator */}
                    {isActive && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25 }}
                        className="mt-3 block w-full overflow-hidden md:hidden"
                      >
                        {renderSimulator()}
                      </motion.div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Right Column: Premium Light-Mode SaaS Dashboard Simulator (Desktop only) */}
            <div className="hidden md:col-span-7 md:flex">{renderSimulator()}</div>
          </div>
        </div>
      </Container>
    </section>
  );
}
