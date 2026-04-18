/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { lazy, Suspense } from 'react';
import { Link } from '@tanstack/react-router';
import { Container, Button } from '@/components/ui';
const HeroDemo = lazy(() => import('./HeroDemo').then((m) => ({ default: m.HeroDemo })));
import { useAuthStore } from '@/lib/auth';
import { getCalApi } from '@calcom/embed-react';

const fadeInUp = {
  hidden: { opacity: 0.15, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  },
};

const stagger = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1 },
  },
};

export function Hero() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const rotatingWords = ['working', 'learning'];
  const [wordIndex, setWordIndex] = useState(0);

  useEffect(() => {
    (async function () {
      const cal = await getCalApi({ namespace: 'sales-parrot' });
      cal('ui', { hideEventTypeDetails: true, layout: 'month_view' });
    })();
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setWordIndex((current) => (current + 1) % rotatingWords.length);
    }, 2400);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <section className="bg-gradient-to-b from-white to-[#FFFBEB] py-16 md:py-20 lg:py-24">
      <Container>
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="flex flex-col items-center text-center"
        >
          {/* Headline - ONE line only on desktop */}
          <motion.h1
            variants={fadeInUp}
            className="mb-4 max-w-[340px] px-3 text-center text-[34px] font-bold leading-[0.98] tracking-[-0.045em] text-[#1E293B] sm:mb-5 sm:max-w-[620px] sm:px-0 sm:text-[46px] sm:leading-[0.98] md:max-w-[760px] md:text-[58px] lg:max-w-[920px] lg:text-[68px]"
          >
            <span className="block">Your AI sales employee</span>
            <span className="mt-1.5 block sm:mt-2">
              Always{' '}
              <span className="relative inline-flex w-[5.9ch] justify-start text-left align-baseline">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={rotatingWords[wordIndex]}
                    initial={{ opacity: 0, y: 16, filter: 'blur(6px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, y: -16, filter: 'blur(6px)' }}
                    transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                    className="inline-block"
                  >
                    {rotatingWords[wordIndex]}
                  </motion.span>
                </AnimatePresence>
              </span>
            </span>
          </motion.h1>

          {/* Subheadline with colored pills */}
          <motion.p
            variants={fadeInUp}
            className="mb-6 max-w-[352px] px-4 text-center text-[15px] font-medium leading-[1.74] text-[#475569] sm:mb-8 sm:max-w-[700px] sm:px-0 sm:text-[18px] sm:leading-[1.82]"
          >
            Handles your{' '}
            <span
              className="inline whitespace-nowrap rounded-full px-2.5 py-0.5 font-semibold"
              style={{ backgroundColor: 'rgba(20, 184, 166, 0.15)', color: '#0D9488' }}
            >
              email outreach
            </span>{' '}
            and{' '}
            <span
              className="inline whitespace-nowrap rounded-full px-2.5 py-0.5 font-semibold"
              style={{ backgroundColor: 'rgba(255, 107, 53, 0.15)', color: '#EA580C' }}
            >
              LinkedIn sequences
            </span>
            , replies to every prospect in your voice, and fills your calendar with meetings while
            you sleep.
          </motion.p>

          {/* CTA */}
          <motion.div variants={fadeInUp} className="mb-4 flex items-center justify-center gap-3">
            <Link to={isAuthenticated ? '/dashboard' : '/signup'}>
              <Button variant="primary" size="lg">
                {isAuthenticated ? 'Go to Dashboard' : 'Get started'}
              </Button>
            </Link>
            {!isAuthenticated && (
              <motion.button
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                data-cal-namespace="sales-parrot"
                data-cal-link="akinthinks/sales-parrot"
                data-cal-config='{"layout":"month_view","useSlotsViewOnSmallScreen":"true"}'
                className="inline-flex items-center justify-center rounded-lg border-[1.5px] border-[#E2E8F0] bg-transparent px-7 py-3.5 text-base font-semibold text-[#1E293B] transition-all duration-200 hover:border-[#1E293B] hover:bg-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:ring-offset-2"
              >
                Book a demo
              </motion.button>
            )}
          </motion.div>

          {/* Supporting text */}
          {!isAuthenticated && (
            <motion.div
              variants={fadeInUp}
              className="mb-10 text-xs font-medium text-[#64748B] sm:mb-16 sm:text-[14px]"
            >
              <p>Most customers get their first prospect reply within 72 hours of going live.</p>
            </motion.div>
          )}
          {isAuthenticated && <div className="mb-10 sm:mb-16" />}

          {/* Hero Demo - Interactive panels */}
          <motion.div
            variants={{
              hidden: { opacity: 0.1, y: 15 },
              visible: {
                opacity: 1,
                y: 0,
                transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
              },
            }}
            className="w-full max-w-[1100px]"
          >
            <Suspense
              fallback={
                <div className="h-[400px] w-full animate-pulse rounded-[32px] bg-slate-100/50 backdrop-blur-sm md:h-[600px] lg:h-[700px]" />
              }
            >
              <HeroDemo />
            </Suspense>
          </motion.div>
        </motion.div>
      </Container>
    </section>
  );
}
