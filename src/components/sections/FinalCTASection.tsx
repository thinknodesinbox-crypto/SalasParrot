import { motion } from 'framer-motion';
import { Link } from '@tanstack/react-router';
import { Container } from '@/components/ui';
import { ArrowRight } from 'lucide-react';
import { useAuthStore } from '@/lib/auth';

export function FinalCTASection() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <section className="relative overflow-hidden border-t border-slate-100 bg-white py-20 md:py-28">
      <Container>
        <div className="mx-auto max-w-[800px] px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Tag */}
            <span className="mb-4 block text-[11px] font-extrabold uppercase tracking-widest text-[#EA580C]">
              Get Started Now
            </span>
            <h2 className="mb-4 text-[32px] font-semibold leading-tight tracking-[-0.03em] text-[#1E293B] md:text-[46px]">
              Ready when you are
            </h2>
            <p className="mx-auto mb-8 max-w-xl text-[15px] font-medium leading-relaxed text-slate-500 md:text-[16.5px]">
              Start your first growth motion today. Find prospects, launch a playbook, and turn
              conversations into customers, from one place.
            </p>

            <div className="mb-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link to={isAuthenticated ? '/dashboard' : '/signup'} className="w-full sm:w-auto">
                <button className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#EA580C] px-6 py-3 text-[14px] font-semibold text-white transition-all duration-200 hover:bg-[#C2410C]">
                  {isAuthenticated ? 'Go to Dashboard' : 'Build my growth motion'}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </Link>
              <Link to="/signup" className="w-full sm:w-auto">
                <button className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3 text-[14px] font-semibold text-slate-700 transition-all duration-200 hover:bg-slate-50">
                  Book a demo
                </button>
              </Link>
            </div>

            <span className="block text-[12px] font-semibold text-slate-400">
              Create a free account. Launch when you are ready.
            </span>
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
