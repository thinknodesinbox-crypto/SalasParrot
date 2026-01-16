import { motion } from 'framer-motion';

export function FeaturesHeader() {
  return (
    <section className="bg-white pb-6 pt-12 md:pb-10 md:pt-16">
      <div className="mx-auto max-w-5xl px-6 text-center">
        <motion.span
          className="mb-4 inline-block text-[11px] font-bold uppercase tracking-[0.2em] text-teal-500 md:mb-5 md:text-[13px]"
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          Features
        </motion.span>

        <motion.h2
          className="text-[32px] font-bold leading-[1.1] tracking-[-0.03em] text-slate-800 sm:text-[40px] md:text-[48px] lg:text-[52px]"
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.08 }}
        >
          Everything you need to book more meetings
        </motion.h2>

        <motion.p
          className="mx-auto mt-5 max-w-2xl text-[16px] leading-[1.7] text-slate-500 md:mt-6 md:text-[18px] lg:text-[19px]"
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.12 }}
        >
          LinkedIn outreach, email follow-ups, and lead enrichment. All unified in one platform.
        </motion.p>
      </div>
    </section>
  );
}
