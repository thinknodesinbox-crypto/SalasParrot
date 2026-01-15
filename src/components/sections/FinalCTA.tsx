import { motion } from 'framer-motion'
import { Link } from '@tanstack/react-router'
import { Container, Button } from '@/components/ui'

export function FinalCTA() {
  return (
    <section className="bg-[#FFFBEB] py-16 md:py-24">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-center max-w-2xl mx-auto"
        >
          <h2 className="text-[24px] sm:text-[28px] md:text-[36px] font-bold text-[#1E293B] leading-tight tracking-[-0.01em] mb-3 sm:mb-4 px-4 sm:px-0">
            LinkedIn + Email. Finally together.
          </h2>
          <p className="text-base sm:text-[18px] text-[#475569] mb-6 sm:mb-8 leading-[1.7] font-medium px-4 sm:px-0">
            One sequence. One inbox. One dashboard.
          </p>

          <Link to="/signup">
            <Button variant="primary" size="lg">
              Get Started
            </Button>
          </Link>

          <p className="mt-3 sm:mt-4 text-xs sm:text-[14px] text-[#64748B] font-medium">7-day free trial. Cancel anytime.</p>
        </motion.div>
      </Container>
    </section>
  )
}
