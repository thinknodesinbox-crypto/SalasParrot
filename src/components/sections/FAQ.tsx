/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Container } from '@/components/ui';

const faqs = [
  {
    question: 'Are my LinkedIn accounts safe?',
    answer:
      "Yes. Each account gets a dedicated proxy, human-like sending patterns, and smart daily limits that adjust to your account's age and activity. Accounts have been running 6+ months without a single restriction.",
  },
  {
    question: 'How does the AI Reply Agent work?',
    answer:
      'When a prospect replies on LinkedIn or email, our AI reads the message, understands their intent, and responds in your tone. It can answer questions, handle objections, and book meetings by checking your calendar in real time. You can jump in at any point.',
  },
  {
    question: 'How does email enrichment work?',
    answer:
      "Import leads from Sales Navigator or CSV. We find and verify emails in the background. Each workspace gets 300 successful enrichments per month, and failed lookups don't use credits.",
  },
  {
    question: 'What integrations do you support?',
    answer:
      'SalesParrot integrates with HubSpot, Salesforce, Pipedrive, Clay, Zapier, and more. Connect your existing CRM and workflow tools in minutes.',
  },
  {
    question: 'Can I cancel anytime?',
    answer: 'Yes. Cancel your subscription at any time. No contracts, no cancellation fees.',
  },
];

function FAQItem({
  question,
  answer,
  isOpen,
  onToggle,
  index,
}: {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0.4, y: 4 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3, delay: index * 0.04, ease: [0.22, 1, 0.36, 1] }}
      className="border-t border-[#E2E8F0] first:border-t-0"
    >
      <button
        onClick={onToggle}
        className="group flex w-full items-center justify-between rounded-lg py-4 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#14B8A6] focus-visible:ring-offset-2 sm:py-6"
      >
        <span className="pr-3 text-[14px] font-semibold text-[#1E293B] transition-colors duration-200 group-hover:text-[#14B8A6] sm:pr-4 sm:text-[16px]">
          {question}
        </span>
        <span className="flex-shrink-0 text-xl font-light text-[#14B8A6] sm:text-2xl">
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
            <p className="pb-4 pr-6 text-[13px] font-medium leading-[1.7] text-[#475569] sm:pb-6 sm:pr-10 sm:text-[15px]">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="bg-white py-16 md:py-20">
      <Container>
        <motion.div
          initial={{ opacity: 0.3, y: 6 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-200px' }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="mb-12 text-center"
        >
          <h2 className="text-[24px] font-bold leading-tight tracking-[-0.01em] text-[#1E293B] sm:text-[28px] md:text-[36px]">
            Frequently asked questions
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0.5 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.35, delay: 0.08 }}
          className="mx-auto max-w-[680px]"
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
  );
}
