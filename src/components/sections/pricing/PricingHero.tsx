/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { motion } from 'framer-motion';
import { Container } from '@/components/ui';

export function PricingHero() {
  return (
    <section className="relative overflow-hidden bg-white pb-12 pt-24 sm:pb-16 sm:pt-32">
      {/* Subtle background pattern */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `radial-gradient(#1E293B 1px, transparent 1px)`,
          backgroundSize: '32px 32px',
        }}
      />

      {/* Gradient accents */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 60% 40% at 20% 20%, rgba(255, 107, 53, 0.06) 0%, transparent 50%),
            radial-gradient(ellipse 50% 30% at 80% 80%, rgba(20, 184, 166, 0.05) 0%, transparent 50%)
          `,
        }}
      />

      <Container className="relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto max-w-3xl text-center"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#FF6B35]/20 bg-[#FFFBEB] px-4 py-2"
          >
            <span className="h-2 w-2 rounded-full bg-[#FF6B35]" />
            <span className="text-sm font-medium text-[#1E293B]">Simple, transparent pricing</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="mb-4 px-4 text-3xl font-bold leading-[1.1] tracking-[-0.02em] text-[#1E293B] sm:mb-6 sm:px-0 sm:text-4xl md:text-5xl lg:text-[56px]"
          >
            One tool. <span className="text-[#FF6B35]">Unlimited</span> everything.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto max-w-2xl px-4 text-base leading-relaxed text-[#64748B] sm:px-0 sm:text-lg md:text-xl"
          >
            LinkedIn + Email + Enrichment + AI Reply Agent. All in one platform.
            <br className="hidden md:block" />
            No per-action fees. 300 successful enrichments per workspace each month. No extra tools.
          </motion.p>
        </motion.div>
      </Container>
    </section>
  );
}
