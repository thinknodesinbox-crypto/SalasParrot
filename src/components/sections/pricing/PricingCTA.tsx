import { motion } from 'framer-motion';
import { useEffect } from 'react';
import { Container } from '@/components/ui';
import { Link } from '@tanstack/react-router';
import { useAuthStore } from '@/lib/auth';
import { getCalApi } from '@calcom/embed-react';

export function PricingCTA() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    (async function () {
      const cal = await getCalApi({ namespace: 'sales-parrot' });
      cal('ui', { hideEventTypeDetails: true, layout: 'month_view' });
    })();
  }, []);

  return (
    <section className="bg-white py-20 md:py-24">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="relative mx-auto max-w-3xl"
        >
          {/* Background card */}
          <div className="relative overflow-hidden rounded-3xl border border-[#FF6B35]/10 bg-[#FFFBEB] px-8 py-14 md:px-16 md:py-16">
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
                className="mb-4 text-3xl font-bold leading-tight tracking-[-0.02em] text-[#1E293B] md:text-4xl"
              >
                Ready to stop paying for 3 tools?
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="mx-auto mb-10 max-w-lg text-lg text-[#64748B]"
              >
                LinkedIn, email, enrichment, and AI reply handling. One tool. One price.
              </motion.p>

              {/* CTA Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="flex flex-col items-center justify-center gap-4 sm:flex-row"
              >
                <Link to={isAuthenticated ? '/dashboard' : '/signup'}>
                  <motion.button
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className="rounded-xl bg-[#FF6B35] px-8 py-4 font-semibold text-white shadow-[0_4px_14px_rgba(255,107,53,0.3)] transition-all duration-200 hover:bg-[#E85A2A] hover:shadow-[0_6px_20px_rgba(255,107,53,0.4)]"
                  >
                    {isAuthenticated ? 'Go to Dashboard' : 'Start $1 Trial'}
                  </motion.button>
                </Link>
                <motion.button
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  data-cal-namespace="sales-parrot"
                  data-cal-link="akinthinks/sales-parrot"
                  data-cal-config='{"layout":"month_view","useSlotsViewOnSmallScreen":"true"}'
                  className="rounded-xl border border-[#E2E8F0] bg-white px-8 py-4 font-semibold text-[#1E293B] shadow-sm transition-all duration-200 hover:border-[#1E293B]"
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
                className="mt-8 text-sm text-[#94A3B8]"
              >
                Questions?{' '}
                <a href="mailto:team@salesparrot.com" className="text-[#FF6B35] hover:underline">
                  team@salesparrot.com
                </a>
              </motion.p>
            </div>
          </div>
        </motion.div>
      </Container>
    </section>
  );
}
