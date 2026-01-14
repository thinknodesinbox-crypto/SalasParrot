import { motion } from 'framer-motion'
import { Container, Button } from '@/components/ui'
import { HeroDemo } from './HeroDemo'

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
}

const stagger = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.15 },
  },
}

export function Hero() {
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
            className="text-[32px] sm:text-[44px] md:text-[52px] lg:text-[64px] font-bold text-[#1E293B] leading-[1.1] tracking-[-0.03em] mb-4 sm:mb-6 text-center px-4 sm:px-0"
          >
            Scale your LinkedIn outreach with ease.
          </motion.h1>

          {/* Subheadline with colored pills */}
          <motion.p
            variants={fadeInUp}
            className="text-base sm:text-[18px] text-[#475569] leading-[1.7] sm:leading-[1.9] mb-6 sm:mb-8 max-w-[600px] text-center font-medium px-4 sm:px-0"
          >
            For agencies, sales teams, and GTM experts who want to automate{' '}
            <span
              className="inline px-2.5 py-0.5 rounded-full font-semibold whitespace-nowrap"
              style={{ backgroundColor: 'rgba(20, 184, 166, 0.15)', color: '#0D9488' }}
            >
              LinkedIn outreach
            </span>
            , boost reply rates with{' '}
            <span
              className="inline px-2.5 py-0.5 rounded-full font-semibold whitespace-nowrap"
              style={{ backgroundColor: 'rgba(255, 107, 53, 0.15)', color: '#EA580C' }}
            >
              email follow-ups
            </span>
            , and book more meetings. All from one dashboard.
          </motion.p>

          {/* CTAs */}
          <motion.div
            variants={fadeInUp}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-4"
          >
            <Button variant="primary" size="lg">
              Start $1 Trial
            </Button>
            <Button variant="secondary" size="lg">
              Watch Demo
            </Button>
          </motion.div>

          {/* Supporting text */}
          <motion.p variants={fadeInUp} className="text-xs sm:text-[14px] text-[#64748B] font-medium mb-10 sm:mb-16">
            7-day full access. Cancel anytime.
          </motion.p>

          {/* Hero Demo - Interactive panels */}
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 30 },
              visible: {
                opacity: 1,
                y: 0,
                transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
              },
            }}
            className="w-full max-w-[1100px]"
          >
            <HeroDemo />
          </motion.div>
        </motion.div>
      </Container>
    </section>
  )
}
