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
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto max-w-2xl text-center"
        >
          <h2 className="mb-3 px-4 text-[24px] font-bold leading-tight tracking-[-0.01em] text-[#1E293B] sm:mb-4 sm:px-0 sm:text-[28px] md:text-[36px]">
            LinkedIn + Email. Finally together.
          </h2>
          <p className="mb-6 px-4 text-base font-medium leading-[1.7] text-[#475569] sm:mb-8 sm:px-0 sm:text-[18px]">
            One sequence. One inbox. One dashboard.
          </p>

          <Link to={isAuthenticated ? '/dashboard' : '/signup'}>
            <Button variant="primary" size="lg">
              {isAuthenticated ? 'Go to Dashboard' : 'Get Started'}
            </Button>
          </Link>

          {!isAuthenticated && (
            <p className="mt-3 text-xs font-medium text-[#64748B] sm:mt-4 sm:text-[14px]">
              7-day free trial. Cancel anytime.
            </p>
          )}
        </motion.div>
      </Container>
    </section>
  );
}
