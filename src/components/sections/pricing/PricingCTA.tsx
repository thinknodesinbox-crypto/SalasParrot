import { motion } from 'framer-motion'
import { Container } from '@/components/ui'
import { Link } from '@tanstack/react-router'

export function PricingCTA() {
  return (
    <section className="bg-white py-20 md:py-24">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="relative max-w-3xl mx-auto"
        >
          {/* Background card */}
          <div className="relative bg-[#FFFBEB] rounded-3xl px-8 py-14 md:px-16 md:py-16 overflow-hidden border border-[#FF6B35]/10">
            {/* Subtle gradient accents */}
            <div
              className="absolute inset-0"
              style={{
                background: `
                  radial-gradient(ellipse 50% 50% at 0% 0%, rgba(255, 107, 53, 0.08) 0%, transparent 50%),
                  radial-gradient(ellipse 50% 50% at 100% 100%, rgba(20, 184, 166, 0.06) 0%, transparent 50%)
                `,
              }}
            />

            {/* Content */}
            <div className="relative z-10 text-center">
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-3xl md:text-4xl font-bold text-[#1E293B] leading-tight tracking-[-0.02em] mb-4"
              >
                Ready to simplify your stack?
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-[#64748B] text-lg mb-10 max-w-lg mx-auto"
              >
                LinkedIn + Email + Enrichment. One tool. One price.
              </motion.p>

              {/* CTA Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="flex flex-col sm:flex-row items-center justify-center gap-4"
              >
                <Link to="/signup">
                  <motion.button
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-8 py-4 bg-[#FF6B35] text-white font-semibold rounded-xl hover:bg-[#E85A2A] transition-all duration-200 shadow-[0_4px_14px_rgba(255,107,53,0.3)] hover:shadow-[0_6px_20px_rgba(255,107,53,0.4)]"
                  >
                    Start $1 Trial
                  </motion.button>
                </Link>
                <motion.button
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-8 py-4 bg-white text-[#1E293B] font-semibold rounded-xl border border-[#E2E8F0] hover:border-[#1E293B] transition-all duration-200 shadow-sm"
                >
                  Book a Demo
                </motion.button>
              </motion.div>

              {/* Supporting text */}
              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="text-[#94A3B8] text-sm mt-8"
              >
                Questions? <a href="mailto:team@salesparrot.com" className="text-[#FF6B35] hover:underline">team@salesparrot.com</a>
              </motion.p>
            </div>
          </div>
        </motion.div>
      </Container>
    </section>
  )
}
