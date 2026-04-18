/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { motion } from 'framer-motion';

export function FeaturesHeader() {
  return (
    <section id="features" className="bg-white pb-6 pt-12 md:pb-10 md:pt-16">
      <div className="mx-auto max-w-5xl px-6 text-center">
        <motion.span
          className="mb-4 inline-block text-[11px] font-bold uppercase tracking-[0.2em] text-teal-500 md:mb-5 md:text-[13px]"
          initial={{ opacity: 0.4, y: 5 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.35 }}
        >
          Features
        </motion.span>

        <motion.h2
          className="text-[32px] font-bold leading-[1.1] tracking-[-0.03em] text-slate-800 sm:text-[40px] md:text-[48px] lg:text-[52px]"
          initial={{ opacity: 0.3, y: 6 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.05 }}
        >
          The only AI employee that
          <br />
          gets better at selling
          <br />
          every single day.
        </motion.h2>

        <motion.p
          className="mx-auto mt-5 max-w-2xl text-[16px] leading-[1.7] text-slate-500 md:mt-6 md:text-[18px] lg:text-[19px]"
          initial={{ opacity: 0.3, y: 6 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.08 }}
        >
          From first email to booked meeting. Across email, LinkedIn, and every channel to come. One
          central brain, learning from every conversation across every channel to perform better on
          all of them.
        </motion.p>
      </div>
    </section>
  );
}
