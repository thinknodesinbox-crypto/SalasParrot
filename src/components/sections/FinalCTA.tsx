/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { motion } from 'framer-motion';
import { Link } from '@tanstack/react-router';
import { Container, Button } from '@/components/ui';
import { useAuthStore } from '@/lib/auth';

export function FinalCTA() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <section className="bg-[#FFFBEB] py-16 md:py-24">
      <Container>
        <motion.div
          initial={{ opacity: 0.25, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-200px' }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto max-w-2xl text-center"
        >
          <h2 className="mb-3 px-4 text-[24px] font-bold leading-tight tracking-[-0.01em] text-[#1E293B] sm:mb-4 sm:px-0 sm:text-[28px] md:text-[36px]">
            Your next meeting is already waiting.
          </h2>
          <p className="mb-6 px-4 text-base font-medium leading-[1.7] text-[#475569] sm:mb-8 sm:px-0 sm:text-[18px]">
            One tool. Full cycle. From first touch to booked call.
          </p>

          <Link to={isAuthenticated ? '/dashboard' : '/signup'}>
            <Button variant="primary" size="lg">
              {isAuthenticated ? 'Go to Dashboard' : 'Get started'}
            </Button>
          </Link>

          {!isAuthenticated && (
            <p className="mt-3 text-xs font-medium text-[#64748B] sm:mt-4 sm:text-[14px]">
              Cancel anytime.
            </p>
          )}
        </motion.div>
      </Container>
    </section>
  );
}
