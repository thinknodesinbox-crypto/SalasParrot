import { motion } from 'framer-motion'
import { Container } from '@/components/ui'

const steps = [
  {
    number: '1',
    title: 'Import leads',
    description: 'From Sales Navigator or CSV',
  },
  {
    number: '2',
    title: 'Launch sequence',
    description: 'LinkedIn + Email runs automatically',
  },
  {
    number: '3',
    title: 'Get replies',
    description: 'All conversations in one inbox',
  },
]

export function DarkSection() {
  return (
    <section className="bg-[#1E293B] py-16 md:py-20">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-12"
        >
          <h2 className="text-[24px] sm:text-[28px] md:text-[36px] font-bold text-white leading-tight tracking-[-0.01em]">
            How it works
          </h2>
        </motion.div>

        {/* Horizontal 3-column layout */}
        <div className="max-w-[800px] mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-center gap-6 sm:gap-8 md:gap-0">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-100px' }}
                transition={{
                  duration: 0.6,
                  delay: index * 0.15,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="flex items-center"
              >
                {/* Step content */}
                <div className="flex flex-col items-center text-center px-4 sm:px-6 md:px-8">
                  {/* Step number */}
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#FF6B35] rounded-full flex items-center justify-center mb-3 sm:mb-4 shadow-[0_4px_20px_rgba(255,107,53,0.4)]">
                    <span className="text-white font-bold text-lg sm:text-xl">{step.number}</span>
                  </div>

                  {/* Step title and description */}
                  <h3 className="text-base sm:text-[18px] font-semibold text-white mb-1">{step.title}</h3>
                  <p className="text-[13px] sm:text-[14px] text-[#CBD5E1] font-medium">{step.description}</p>
                </div>

                {/* Connector arrow (except for last item) */}
                {index < steps.length - 1 && (
                  <div className="hidden md:flex items-center mx-2">
                    <div className="w-12 lg:w-20 h-[2px] relative">
                      {/* Dashed line */}
                      <div className="absolute inset-0 border-t-2 border-dashed border-[#14B8A6]" />
                    </div>
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill="none"
                      className="text-[#14B8A6] -ml-1"
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
  )
}
