import { motion } from 'framer-motion'
import { Container } from '@/components/ui'

export function PricingHero() {
  return (
    <section className="relative bg-white pt-24 sm:pt-32 pb-12 sm:pb-16 overflow-hidden">
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
          className="text-center max-w-3xl mx-auto"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#FFFBEB] rounded-full border border-[#FF6B35]/20 mb-6"
          >
            <span className="w-2 h-2 bg-[#FF6B35] rounded-full" />
            <span className="text-[#1E293B] text-sm font-medium">Simple, transparent pricing</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-[56px] font-bold text-[#1E293B] leading-[1.1] tracking-[-0.02em] mb-4 sm:mb-6 px-4 sm:px-0"
          >
            One tool.{' '}
            <span className="text-[#FF6B35]">Unlimited</span> everything.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="text-base sm:text-lg md:text-xl text-[#64748B] leading-relaxed max-w-2xl mx-auto px-4 sm:px-0"
          >
            LinkedIn + Email + Enrichment in one platform.
            <br className="hidden md:block" />
            No per-action limits. No hidden fees. No extra tools needed.
          </motion.p>
        </motion.div>
      </Container>
    </section>
  )
}
