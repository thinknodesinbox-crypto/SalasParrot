import { motion } from 'framer-motion'

export function FeaturesHeader() {
  return (
    <section className="pt-12 md:pt-16 pb-6 md:pb-10 bg-white">
      <div className="max-w-5xl mx-auto px-6 text-center">
        <motion.span
          className="inline-block text-[11px] md:text-[13px] font-bold tracking-[0.2em] uppercase text-teal-500 mb-4 md:mb-5"
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          Features
        </motion.span>

        <motion.h2
          className="text-[32px] sm:text-[40px] md:text-[48px] lg:text-[52px] font-bold text-slate-800 leading-[1.1] tracking-[-0.03em]"
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.08 }}
        >
          Everything you need to book more meetings
        </motion.h2>

        <motion.p
          className="mt-5 md:mt-6 text-[16px] md:text-[18px] lg:text-[19px] text-slate-500 max-w-2xl mx-auto leading-[1.7]"
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.12 }}
        >
          LinkedIn outreach, email follow-ups, and lead enrichment. All unified in one platform.
        </motion.p>
      </div>
    </section>
  )
}
