import { useEffect, useState, useRef } from 'react';
import { useInView } from 'framer-motion';
import { Container } from '@/components/ui';

interface Testimonial {
  quote: string;
  body: string;
  author: string;
  role: string;
  company: string;
  logoText: string;
}

function AnimatedNumber({ value, duration = 1.2 }: { value: number; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });

  useEffect(() => {
    if (!isInView) return;

    let startTimestamp: number | null = null;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / (duration * 1000), 1);
      const easeProgress = progress * (2 - progress); // easeOutQuad
      setCount(Math.floor(easeProgress * value));

      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setCount(value);
      }
    };

    window.requestAnimationFrame(step);
  }, [isInView, value, duration]);

  return <span ref={ref}>{count}</span>;
}

const stats = [
  { num: 47, suffix: '', label: 'Meetings in 30 days' },
  { num: 60, suffix: '%', label: 'Lower outbound software spend' },
  { num: 5, suffix: '', label: 'LinkedIn accounts managed in one view' },
];

const testimonials: Testimonial[] = [
  {
    quote: "“I woke up to meetings I didn't book.”",
    body: 'The AI replied to my LinkedIn messages overnight, handled the back and forth, and scheduled calls while I slept. Like having an SDR that never clocks out.',
    author: 'Samuel A',
    role: 'Director of Sales',
    company: 'KP',
    logoText: 'KP logo',
  },
  {
    quote: '“We canceled 3 tools in our first week.”',
    body: 'We were paying for a LinkedIn tool, a cold email tool, and enrichment credits separately. SalesParrot replaced all three. Setup took 20 minutes. Our outbound bill dropped by 60%.',
    author: 'Eric Thomas',
    company: 'Catalyst Commerce',
    role: 'CEO',
    logoText: 'Catalyst Commerce logo',
  },
  {
    quote: '“47 meetings in 30 days. All decision makers.”',
    body: 'I imported our list from Sales Navigator, launched one sequence, and the replies started within 48 hours. Not tire kickers. VPs, founders, C-suite. Exactly who we needed.',
    author: 'Garrison Kemp',
    company: 'Apex Dynamics',
    role: 'Founder & CEO',
    logoText: 'Apex Dynamics logo',
  },
  {
    quote: "“I finally see my whole team's pipeline in one place.”",
    body: "5 reps, 5 LinkedIn accounts, one dashboard. I know who's sending, who's getting replies, and what's converting. No more chasing anyone for updates.",
    author: 'Jennifer Moore',
    company: 'Prism',
    role: 'Head of Growth',
    logoText: 'Prism logo',
  },
  {
    quote: '“30% of our meetings came from people who ignored us on LinkedIn.”',
    body: "They didn't accept the connection request. SalesParrot found their email and followed up automatically. That's pipeline we would've lost with any other tool.",
    author: 'Luna Northcott',
    company: 'Maven Digital',
    role: 'VP of Sales',
    logoText: 'Maven Digital logo',
  },
  {
    quote: '“Outbound finally runs without me.”',
    body: 'I used to spend 2 hours a day in LinkedIn DMs. Now I launch a sequence, the AI handles replies, and I just show up to the calls. Got my mornings back.',
    author: 'Anthony Harris',
    company: 'Obsidian Partners',
    role: 'COO',
    logoText: 'Obsidian Partners logo',
  },
];

export function TestimonialsSection() {
  return (
    <section className="border-t border-slate-100 bg-white py-20 md:py-28">
      <Container>
        <div className="mx-auto max-w-[1000px]">
          {/* Header */}
          <div className="mx-auto mb-16 max-w-2xl px-4 text-center">
            <h2 className="mb-4 text-[28px] font-semibold leading-[1.15] tracking-[-0.03em] text-[#1E293B] md:text-[38px]">
              Trusted by entrepreneurs, teams and enterprise operators.
            </h2>
            <p className="text-[15px] font-medium leading-relaxed text-slate-500 md:text-[16px]">
              From founder-led outbound to multi-rep pipeline operations, SalesParrot helps revenue
              teams launch faster, consolidate tooling, and keep more conversations moving.
            </p>
          </div>

          {/* Flat Stats Banner */}
          <div className="mx-auto mb-16 grid max-w-[860px] grid-cols-3 gap-0 rounded-[20px] border border-slate-200/50 bg-slate-50/60 p-1 sm:rounded-3xl sm:p-2">
            {stats.map((stat, i) => (
              <div
                key={i}
                className={`px-2 py-3 text-center sm:px-6 sm:py-6 ${
                  i < 2 ? 'border-r border-slate-200/40' : ''
                }`}
              >
                <span className="xs:text-[24px] mb-1 block text-[20px] font-semibold leading-none tracking-tight text-[#EA580C] sm:mb-2 sm:text-[36px]">
                  <AnimatedNumber value={stat.num} />
                  {stat.suffix}
                </span>
                <span className="xs:text-[10.5px] block text-[9.5px] font-medium leading-tight text-slate-500 sm:text-[13.5px] sm:leading-normal">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>

          {/* Inline keyframe style for hardware-accelerated vertical marquees */}
          <style>{`
            @keyframes marqueeVertical {
              0% { transform: translate3d(0, 0, 0); }
              100% { transform: translate3d(0, -50%, 0); }
            }
            .animate-marquee-v-slow {
              animation: marqueeVertical 24s linear infinite;
            }
            .animate-marquee-v-medium {
              animation: marqueeVertical 18s linear infinite;
            }
            .animate-marquee-v-fast {
              animation: marqueeVertical 15s linear infinite;
            }
            .animate-marquee-v-slow:hover,
            .animate-marquee-v-medium:hover,
            .animate-marquee-v-fast:hover {
              animation-play-state: paused;
            }
          `}</style>

          {/* 3-Column Bottomless Vertical Marquee Wall */}
          <div className="relative mt-8 h-[600px] w-full overflow-hidden px-2 sm:px-0">
            {/* Top and Bottom Fade Gradients */}
            <div className="pointer-events-none absolute left-0 right-0 top-0 z-10 h-32 bg-gradient-to-b from-white via-white/80 to-transparent" />
            <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-10 h-32 bg-gradient-to-t from-white via-white/80 to-transparent" />

            <div className="grid h-full grid-cols-1 gap-6 md:grid-cols-3">
              {/* Column 1 */}
              <div className="relative h-full overflow-hidden">
                <div className="animate-marquee-v-slow flex w-full flex-col gap-6">
                  {[testimonials[0], testimonials[3], testimonials[0], testimonials[3]].map(
                    (t, idx) => (
                      <div
                        key={idx}
                        className="flex shrink-0 flex-col justify-between rounded-2xl border border-slate-200/50 bg-slate-50/40 p-6 transition-all duration-200 hover:border-slate-300/80"
                      >
                        <div>
                          {/* Company Logo Badge */}
                          <span className="mb-4 inline-block rounded-full border border-slate-100 bg-white px-3 py-1 text-[11px] font-extrabold uppercase tracking-widest text-[#EA580C]">
                            {t.logoText.replace(' logo', '')}
                          </span>
                          <h4 className="mb-3 text-[14px] font-semibold leading-snug tracking-tight text-[#1E293B]">
                            {t.quote}
                          </h4>
                          <p className="mb-6 text-[13px] font-medium leading-relaxed text-slate-500">
                            {t.body}
                          </p>
                        </div>

                        <div className="border-t border-slate-200/40 pt-4">
                          <span className="block text-[13px] font-semibold text-[#1E293B]">
                            {t.author}
                          </span>
                          <span className="mt-0.5 block text-[11px] font-semibold text-slate-400">
                            {t.role} · {t.company}
                          </span>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* Column 2 */}
              <div className="relative hidden h-full overflow-hidden md:block">
                <div className="animate-marquee-v-medium flex w-full flex-col gap-6">
                  {[testimonials[1], testimonials[4], testimonials[1], testimonials[4]].map(
                    (t, idx) => (
                      <div
                        key={idx}
                        className="flex shrink-0 flex-col justify-between rounded-2xl border border-slate-200/50 bg-slate-50/40 p-6 transition-all duration-200 hover:border-slate-300/80"
                      >
                        <div>
                          {/* Company Logo Badge */}
                          <span className="mb-4 inline-block rounded-full border border-slate-100 bg-white px-3 py-1 text-[11px] font-extrabold uppercase tracking-widest text-[#EA580C]">
                            {t.logoText.replace(' logo', '')}
                          </span>
                          <h4 className="mb-3 text-[14px] font-semibold leading-snug tracking-tight text-[#1E293B]">
                            {t.quote}
                          </h4>
                          <p className="mb-6 text-[13px] font-medium leading-relaxed text-slate-500">
                            {t.body}
                          </p>
                        </div>

                        <div className="border-t border-slate-200/40 pt-4">
                          <span className="block text-[13px] font-semibold text-[#1E293B]">
                            {t.author}
                          </span>
                          <span className="mt-0.5 block text-[11px] font-semibold text-slate-400">
                            {t.role} · {t.company}
                          </span>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* Column 3 */}
              <div className="relative hidden h-full overflow-hidden md:block">
                <div className="animate-marquee-v-fast flex w-full flex-col gap-6">
                  {[testimonials[2], testimonials[5], testimonials[2], testimonials[5]].map(
                    (t, idx) => (
                      <div
                        key={idx}
                        className="flex shrink-0 flex-col justify-between rounded-2xl border border-slate-200/50 bg-slate-50/40 p-6 transition-all duration-200 hover:border-slate-300/80"
                      >
                        <div>
                          {/* Company Logo Badge */}
                          <span className="mb-4 inline-block rounded-full border border-slate-100 bg-white px-3 py-1 text-[11px] font-extrabold uppercase tracking-widest text-[#EA580C]">
                            {t.logoText.replace(' logo', '')}
                          </span>
                          <h4 className="mb-3 text-[14px] font-semibold leading-snug tracking-tight text-[#1E293B]">
                            {t.quote}
                          </h4>
                          <p className="mb-6 text-[13px] font-medium leading-relaxed text-slate-500">
                            {t.body}
                          </p>
                        </div>

                        <div className="border-t border-slate-200/40 pt-4">
                          <span className="block text-[13px] font-semibold text-[#1E293B]">
                            {t.author}
                          </span>
                          <span className="mt-0.5 block text-[11px] font-semibold text-slate-400">
                            {t.role} · {t.company}
                          </span>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
