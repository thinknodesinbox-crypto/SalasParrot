/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { motion } from 'framer-motion';
import { Container } from '@/components/ui';

const steps = [
  {
    number: '1',
    title: 'Import your prospects',
    description: 'From Sales Navigator or CSV. Emails found automatically.',
  },
  {
    number: '2',
    title: 'Launch your sequence',
    description: 'LinkedIn outreach and email follow-ups run on autopilot with smart branching.',
  },
  {
    number: '3',
    title: 'AI handles replies and books',
    description: 'Responses get managed, meetings land on your calendar.',
  },
];

export function DarkSection() {
  return (
    <section className="bg-[#1E293B] py-16 md:py-20">
      <Container>
        <motion.div
          initial={{ opacity: 0.3, y: 6 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-200px' }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="mb-12 text-center"
        >
          <h2 className="text-[24px] font-bold leading-tight tracking-[-0.01em] text-white sm:text-[28px] md:text-[36px]">
            How it works
          </h2>
        </motion.div>

        {/* Horizontal 3-column layout */}
        <div className="mx-auto max-w-[800px]">
          <div className="flex flex-col items-center justify-center gap-6 sm:gap-8 md:flex-row md:gap-0">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0.25, y: 6 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-200px' }}
                transition={{
                  duration: 0.4,
                  delay: index * 0.1,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="flex items-center"
              >
                {/* Step content */}
                <div className="flex flex-col items-center px-4 text-center sm:px-6 md:px-8">
                  {/* Step number */}
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#FF6B35] shadow-[0_4px_20px_rgba(255,107,53,0.4)] sm:mb-4 sm:h-12 sm:w-12">
                    <span className="text-lg font-bold text-white sm:text-xl">{step.number}</span>
                  </div>

                  {/* Step title and description */}
                  <h3 className="mb-1 text-base font-semibold text-white sm:text-[18px]">
                    {step.title}
                  </h3>
                  <p className="text-[13px] font-medium text-[#CBD5E1] sm:text-[14px]">
                    {step.description}
                  </p>
                </div>

                {/* Connector arrow (except for last item) */}
                {index < steps.length - 1 && (
                  <div className="mx-2 hidden items-center md:flex">
                    <div className="relative h-[2px] w-12 lg:w-20">
                      {/* Dashed line */}
                      <div className="absolute inset-0 border-t-2 border-dashed border-[#14B8A6]" />
                    </div>
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill="none"
                      className="-ml-1 text-[#14B8A6]"
                    >
                      <path
                        d="M8 4L14 10L8 16"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
