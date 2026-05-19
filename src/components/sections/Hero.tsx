import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Zap,
  ArrowRight,
  Radio,
  CalendarDays,
  UserRound,
  ChevronRight,
  Check,
} from 'lucide-react';
import { Container, Button } from '@/components/ui';
import { Link } from '@tanstack/react-router';

type Playbook = {
  id: string;
  title: string;
  shortLabel: string;
  promptCount?: string;
  tagline: string;
  color: string;
  lightColor: string;
  borderColor: string;
  icon: React.ReactNode;
  bullets: string[];
};

const playbooks: Playbook[] = [
  {
    id: 'signal-led',
    title: 'Signal-Led Prospecting',
    shortLabel: 'Prospecting',
    promptCount: '5 prompts',
    tagline: 'Start outreach from real buyer signals, not broad title lists.',
    color: 'text-indigo-600',
    lightColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200',
    icon: <Radio className="h-4 w-4" />,
    bullets: [
      'Source strategy for web, LinkedIn & target sites',
      'Ranked audience list with signal proof',
      'First-message angle tied to detected signal',
      'Campaign draft with safety checks',
    ],
  },
  {
    id: 'event-led',
    title: 'Event-Led Relationship Selling',
    shortLabel: 'Event Pipeline',
    tagline: 'Turn events into pipeline before, during, and after the room.',
    color: 'text-violet-600',
    lightColor: 'bg-violet-50',
    borderColor: 'border-violet-200',
    icon: <CalendarDays className="h-4 w-4" />,
    bullets: [
      'Build the right ICP invite list',
      'Pre-event outreach & warm-up sequences',
      'Capture event conversations & follow-ups',
      'Turn attendees into meetings & pipeline',
    ],
  },
  {
    id: 'founder-led',
    title: 'Founder-Led Sales',
    shortLabel: 'Founder Motion',
    promptCount: '4 prompts',
    tagline: 'Turn your founder POV into a repeatable outbound motion.',
    color: 'text-[#EA580C]',
    lightColor: 'bg-[#FFEDD5]',
    borderColor: 'border-orange-200',
    icon: <UserRound className="h-4 w-4" />,
    bullets: [
      'Shape your founder-led angle',
      'Build the right audience around your POV',
      'Create personalized first-touch messaging',
      'Launch a motion that still sounds like you',
    ],
  },
];

const placeholders = [
  'B2B SaaS companies hiring RevOps leaders in London',
  'Founders in New York who recently raised seed funding',
  'Agencies serving ecommerce brands doing $1M+ in revenue',
  'Healthcare clinics expanding into new locations',
  'Marketing leaders at companies hiring SDRs',
];

export function Hero() {
  const [activeTab, setActiveTab] = useState<'prospects' | 'playbooks'>('prospects');
  const [inputText, setInputText] = useState('');
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [currentPlaceholder, setCurrentPlaceholder] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activePlaybook, setActivePlaybook] = useState<string>('signal-led');

  // Typewriter effect for placeholders
  useEffect(() => {
    if (inputText) return;
    let charIndex = 0;
    let isDeleting = false;
    let typingTimer: ReturnType<typeof setTimeout>;

    const tick = () => {
      const fullText = placeholders[placeholderIndex];
      if (!isDeleting) {
        setCurrentPlaceholder(fullText.substring(0, charIndex + 1));
        charIndex++;
        if (charIndex === fullText.length) {
          typingTimer = setTimeout(() => {
            isDeleting = true;
            tick();
          }, 2000);
          return;
        }
      } else {
        setCurrentPlaceholder(fullText.substring(0, charIndex - 1));
        charIndex--;
        if (charIndex === 0) {
          isDeleting = false;
          setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
        }
      }
      typingTimer = setTimeout(tick, isDeleting ? 30 : 60);
    };

    tick();
    return () => clearTimeout(typingTimer);
  }, [placeholderIndex, inputText]);

  const handleBuildMotion = (e: React.FormEvent) => {
    e.preventDefault();
    setIsModalOpen(true);
  };

  const selected = playbooks.find((p) => p.id === activePlaybook)!;

  return (
    <section
      className="relative -mt-20 overflow-hidden bg-cover bg-center bg-no-repeat pb-20 pt-36 md:-mt-24 md:pb-28 md:pt-44 lg:pt-48"
      style={{ backgroundImage: 'url(/hero.png)' }}
    >
      <Container>
        <div className="mx-auto max-w-[1100px] px-2 sm:px-4">
          {/* Header */}
          <div className="mb-10 text-center">
            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="text-[36px] font-semibold leading-[1.08] tracking-[-0.04em] text-white sm:text-[46px] md:text-[52px]"
            >
              <span className="block">Revenue Growth,</span>
              <span className="mt-1.5 block sm:mt-2">Run From One Place.</span>
            </motion.h1>
          </div>

          {/* Toggle Tabs */}
          <div className="mb-14 flex justify-center">
            <div className="inline-flex rounded-full border border-slate-200/50 bg-slate-100 p-1">
              <button
                onClick={() => setActiveTab('prospects')}
                className={`rounded-full px-4 py-2 text-[12.5px] font-semibold transition-all duration-200 sm:px-6 sm:py-2.5 sm:text-[14px] ${
                  activeTab === 'prospects'
                    ? 'bg-white text-[#1E293B] shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <span className="hidden sm:inline">Find Prospects</span>
                <span className="sm:hidden">Prospects</span>
              </button>
              <button
                onClick={() => setActiveTab('playbooks')}
                className={`rounded-full px-4 py-2 text-[12.5px] font-semibold transition-all duration-200 sm:px-6 sm:py-2.5 sm:text-[14px] ${
                  activeTab === 'playbooks'
                    ? 'bg-white text-[#1E293B] shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <span className="hidden sm:inline">Use Growth Playbooks</span>
                <span className="sm:hidden">Playbooks</span>
              </button>
            </div>
          </div>

          {/* Main Card */}
          <div className="relative mx-auto max-w-[860px] rounded-[32px] border border-[#E9EDFB]/70 bg-[#F4F6FC]/60 p-6 backdrop-blur-sm md:p-8">
            <AnimatePresence mode="wait">
              {/* ── FIND PROSPECTS ── */}
              {activeTab === 'prospects' ? (
                <motion.div
                  key="prospects"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                >
                  <div className="mb-6">
                    <h2 className="text-[22px] font-bold tracking-tight text-[#1E293B] sm:text-[26px]">
                      Who do you want to reach?
                    </h2>
                    <p className="mt-1.5 text-[14px] font-medium leading-relaxed text-slate-500">
                      Describe your audience, market signal, event, or growth goal.
                    </p>
                  </div>

                  <form onSubmit={handleBuildMotion}>
                    <div className="relative flex items-center rounded-full border border-slate-100/80 bg-white p-2.5 transition-all focus-within:ring-2 focus-within:ring-[#EA580C] focus-within:ring-offset-2">
                      <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder={inputText ? '' : currentPlaceholder}
                        className="w-full border-none bg-transparent pl-4 text-[14px] font-semibold text-slate-700 placeholder-slate-400 outline-none focus:shadow-none focus:outline-none focus:ring-0 focus-visible:shadow-none focus-visible:outline-none focus-visible:ring-0"
                      />
                      <button
                        type="submit"
                        className="ml-2 shrink-0 rounded-full bg-[#EA580C] px-6 py-2.5 text-[14px] font-bold text-white transition-all hover:bg-[#C2410C]"
                      >
                        Build motion
                      </button>
                    </div>
                  </form>
                </motion.div>
              ) : (
                /* ── GROWTH PLAYBOOKS ── */
                <motion.div
                  key="playbooks"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                  className="flex min-h-[320px] flex-col gap-4 md:flex-row"
                >
                  {/* Left — Compact list */}
                  <div className="flex shrink-0 flex-col gap-2 md:w-[44%]">
                    {playbooks.map((pb) => {
                      const isActive = pb.id === activePlaybook;
                      return (
                        <button
                          key={pb.id}
                          onClick={() => setActivePlaybook(pb.id)}
                          className={`group flex items-center justify-between rounded-2xl border px-4 py-3.5 text-left transition-all duration-200 ${
                            isActive
                              ? 'border-slate-200 bg-white text-[#1E293B]'
                              : 'border-transparent text-slate-500 hover:bg-white/40 hover:text-slate-800'
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <span
                              className={`block text-[13.5px] font-bold leading-tight ${isActive ? 'text-[#1E293B]' : 'text-slate-600 group-hover:text-slate-800'}`}
                            >
                              {pb.shortLabel}
                            </span>
                            {pb.promptCount && (
                              <span className="mt-0.5 block text-[11px] font-semibold text-slate-400">
                                {pb.promptCount}
                              </span>
                            )}
                          </div>
                          <ChevronRight
                            className={`h-4 w-4 shrink-0 transition-all duration-200 ${isActive ? 'text-[#EA580C] opacity-100' : 'text-slate-300 opacity-0 group-hover:opacity-100'}`}
                          />
                        </button>
                      );
                    })}

                    {/* Step indicator — compact inline */}
                    <div className="mt-auto flex items-center gap-2 px-1 pt-4">
                      {['Pick', 'Prompts', 'Built'].map((label, i) => (
                        <div key={i} className="flex items-center gap-1.5">
                          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-slate-300/30 bg-slate-200 text-[10px] font-extrabold text-slate-700">
                            {i + 1}
                          </div>
                          <span className="text-[11px] font-bold text-slate-400">{label}</span>
                          {i < 2 && <ArrowRight className="h-3 w-3 text-slate-300" />}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right — Animated detail pane */}
                  <div className="flex-1 overflow-hidden rounded-2xl border border-[#EBEFFC]/50 bg-white">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={activePlaybook}
                        initial={{ opacity: 0, x: 12 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -12 }}
                        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                        className="flex h-full flex-col p-5"
                      >
                        <span className="mb-2 text-[11px] font-extrabold uppercase tracking-widest text-[#EA580C]">
                          {selected.promptCount ? `Ready · ${selected.promptCount}` : 'Ready now'}
                        </span>
                        <h3 className="mb-2 text-[17px] font-bold leading-tight tracking-tight text-[#1E293B]">
                          {selected.title}
                        </h3>
                        <p className="mb-5 text-[13px] font-medium leading-relaxed text-slate-500">
                          {selected.tagline}
                        </p>

                        <ul className="flex-1 space-y-3">
                          {selected.bullets.map((bullet, i) => (
                            <motion.li
                              key={i}
                              initial={{ opacity: 0, x: 6 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.06, duration: 0.2 }}
                              className="flex items-start gap-2 text-[13px] font-semibold text-slate-600"
                            >
                              <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                              <span>{bullet}</span>
                            </motion.li>
                          ))}
                        </ul>

                        <button
                          onClick={() => setIsModalOpen(true)}
                          className="mt-6 inline-flex w-fit items-center justify-center gap-2 self-start rounded-full bg-[#EA580C] px-6 py-2.5 text-[13px] font-bold text-white transition-all duration-200 hover:bg-[#C2410C]"
                        >
                          Start this playbook
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </Container>

      {/* Sign-up Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-full max-w-[440px] rounded-3xl border border-slate-100 bg-white p-6"
            >
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute right-4 top-4 rounded-full p-1 text-slate-400 transition-all hover:bg-slate-50 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full border border-orange-100 bg-[#FFEDD5] text-[#EA580C]">
                <Zap className="h-6 w-6 fill-current" />
              </div>

              <h3 className="text-[20px] font-bold tracking-tight text-[#1E293B]">
                Create your free account
              </h3>
              <p className="mt-2 text-[14px] font-medium leading-relaxed text-slate-500">
                Build this audience and launch your first motion with SalesParrot.
              </p>

              <div className="mt-6 flex flex-col gap-2.5">
                <Link to="/signup">
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full justify-center text-[14px] font-bold"
                  >
                    Sign up now
                  </Button>
                </Link>
                <Link to="/login" search={{ next: undefined }}>
                  <button
                    type="button"
                    className="inline-flex w-full items-center justify-center rounded-full border-[1.5px] border-slate-200 bg-white py-3 text-[14px] font-bold text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50"
                  >
                    Already have an account? Log in
                  </button>
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
