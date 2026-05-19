import { motion } from 'framer-motion';
import { Link } from '@tanstack/react-router';
import { Container } from '@/components/ui';
import { ArrowRight } from 'lucide-react';

export function ArchitectSection() {
  return (
    <section className="border-t border-slate-100 bg-slate-50/50 py-20 md:py-28">
      <Container>
        <div className="mx-auto max-w-[800px] px-2 sm:px-0">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="relative overflow-hidden rounded-[32px] border border-slate-200 bg-white p-8 md:p-12"
          >
            {/* Flat Brand tag */}
            <span className="mb-6 inline-flex rounded-full border border-orange-100 bg-[#FFEDD5] px-3.5 py-1 text-[11px] font-extrabold uppercase tracking-wider text-[#EA580C]">
              The Movement
            </span>

            <h2 className="mb-6 text-[28px] font-semibold leading-tight tracking-[-0.03em] text-[#1E293B] md:text-[36px]">
              The new human layer <br className="hidden sm:block" />
              for modern growth.
            </h2>

            <div className="mb-8 border-l-[3px] border-[#EA580C] pl-6">
              <p className="mb-4 text-[15px] font-semibold leading-relaxed text-[#1E293B] md:text-[17px]">
                The future of growth belongs to people who can design systems, lead relationships,
                and use intelligent tools to drive revenue at scale.
              </p>
              <p className="text-[14px] font-medium leading-relaxed text-slate-500 md:text-[15px]">
                We call them{' '}
                <strong className="font-semibold text-[#1E293B]">Revenue Growth Architects</strong>.
                SalesParrot is the system they will use to find, engage, close, retain, and expand
                customers from one place.
              </p>
            </div>

            <Link to="/signup">
              <button className="inline-flex items-center justify-center gap-2 rounded-full bg-[#EA580C] px-6 py-3 text-[14px] font-semibold text-white transition-all duration-200 hover:bg-[#C2410C]">
                Join the movement
                <ArrowRight className="h-4 w-4" />
              </button>
            </Link>
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
