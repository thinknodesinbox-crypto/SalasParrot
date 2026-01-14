import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Container } from '@/components/ui'

const faqs = [
  {
    question: 'How does the $1 trial work?',
    answer:
      "Get full access to all features for 7 days for just $1. No restrictions, no hidden limits. If you decide SalesParrot isn't for you, cancel anytime before the trial ends.",
  },
  {
    question: 'Are my LinkedIn accounts safe?',
    answer:
      'Yes. Country-matched IPs, smart daily limits, and human-like activity patterns keep your accounts protected.',
  },
  {
    question: 'How does email enrichment work?',
    answer:
      'Import leads with LinkedIn URLs — we find verified business emails automatically using multiple data providers.',
  },
  {
    question: 'What integrations do you support?',
    answer:
      'Clay, HubSpot, Salesforce, Pipedrive, Zapier, webhooks, and full API access on all plans.',
  },
  {
    question: 'Can I cancel anytime?',
    answer: 'Yes. Cancel from your dashboard in one click. No contracts, no cancellation fees.',
  },
]

function FAQItem({
  question,
  answer,
  isOpen,
  onToggle,
  index,
}: {
  question: string
  answer: string
  isOpen: boolean
  onToggle: () => void
  index: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
      className="border-t border-[#E2E8F0] first:border-t-0"
    >
      <button
        onClick={onToggle}
        className="w-full py-4 sm:py-6 flex items-center justify-between text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#14B8A6] focus-visible:ring-offset-2 rounded-lg group"
      >
        <span className="font-semibold text-[#1E293B] text-[14px] sm:text-[16px] pr-3 sm:pr-4 group-hover:text-[#14B8A6] transition-colors duration-200">
          {question}
        </span>
        <span className="text-[#14B8A6] flex-shrink-0 text-xl sm:text-2xl font-light">
          {isOpen ? '−' : '+'}
        </span>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <p className="pb-4 sm:pb-6 text-[#475569] text-[13px] sm:text-[15px] leading-[1.7] pr-6 sm:pr-10 font-medium">{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <section className="bg-white py-16 md:py-20">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-12"
        >
          <h2 className="text-[24px] sm:text-[28px] md:text-[36px] font-bold text-[#1E293B] leading-tight tracking-[-0.01em]">
            Frequently asked questions
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="max-w-[680px] mx-auto"
        >
          {faqs.map((faq, index) => (
            <FAQItem
              key={index}
              index={index}
              question={faq.question}
              answer={faq.answer}
              isOpen={openIndex === index}
              onToggle={() => setOpenIndex(openIndex === index ? null : index)}
            />
          ))}
        </motion.div>
      </Container>
    </section>
  )
}
