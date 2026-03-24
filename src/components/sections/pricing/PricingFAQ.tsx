import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Container } from '@/components/ui';

const faqs = [
  {
    question: 'What does "unlimited" actually mean?',
    answer:
      "We don't charge per action, per email, or per enrichment. You get unlimited LinkedIn actions (we auto-apply safe daily limits to protect your account, typically 80-100 connections/day), unlimited email sending through your connected mailbox, and unlimited email enrichment with no credits. Your price is your price. No hidden usage fees.",
  },
  {
    question: 'What\'s a "sender"?',
    answer:
      'A sender is one LinkedIn account connected to SalesParrot. Each sender gets its own dedicated proxy, safe daily limits, and can run campaigns independently. On Growth, you choose how many senders you need. On Agency, 30 are included.',
  },
  {
    question: 'Can I cancel anytime?',
    answer:
      'Yes. Cancel your subscription at any time from your billing settings. No contracts, no cancellation fees.',
  },
  {
    question: 'Is my LinkedIn account safe?',
    answer:
      "Yes. Each account gets a dedicated residential proxy, human-like sending patterns, and smart daily limits that adjust to your account's age and activity. Accounts have been running 6+ months without a single restriction.",
  },
  {
    question: 'Is the AI Reply Agent included?',
    answer:
      'Yes. The AI Reply Agent is included in every plan at no extra cost. It reads replies, detects intent, responds in your tone, and books meetings by checking your calendar. No add-on fees, no usage limits.',
  },
  {
    question: 'How does email enrichment work?',
    answer:
      'Import leads from Sales Navigator or CSV. We find and verify business emails automatically in the background. Included in every plan. No credits, no per-email charges.',
  },
  {
    question: 'Can I connect my own email?',
    answer:
      'Yes. Connect Gmail, Outlook, or any SMTP provider. Your emails send from your own mailbox for maximum deliverability.',
  },
  {
    question: "What's included in the Agency whitelabel?",
    answer:
      'Full whitelabel branding. Your logo, your colors, your domain. Client-facing dashboards and reporting under your brand. Your clients never see SalesParrot.',
  },
  {
    question: 'Can I switch from Growth to Agency?',
    answer:
      'Yes. Upgrade anytime from your dashboard. Your campaigns, data, and settings transfer automatically.',
  },
  {
    question: 'Do you offer annual billing?',
    answer:
      'Yes. Annual billing on the Agency plan saves 25% ($749/mo instead of $999/mo). Growth plan is monthly only.',
  },
  {
    question: "I'm switching from HeyReach. Can you help migrate?",
    answer:
      "Yes. Agency plan includes dedicated migration assistance. We'll help move your campaigns, sender accounts, and data. Most migrations complete within 24 hours.",
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
      className="border-b border-[#E2E8F0] last:border-b-0"
    >
      <button
        onClick={onToggle}
        className="group flex w-full items-center justify-between rounded-lg py-5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#14B8A6] focus-visible:ring-offset-2"
      >
        <span className="pr-4 text-[15px] font-semibold text-[#1E293B] transition-colors duration-200 group-hover:text-[#14B8A6]">
          {question}
        </span>
        <motion.span
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ duration: 0.2 }}
          className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#14B8A6]/10 text-lg text-[#14B8A6]"
        >
          +
        </motion.span>
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
            <p className="pb-5 pr-10 text-[14px] leading-[1.7] text-[#64748B]">{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function PricingFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="bg-[#F8FAFC] py-20 md:py-28">
      <Container>
        <motion.div
          initial={{ opacity: 0.3, y: 6 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-200px' }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="mb-12 text-center"
        >
          <h2 className="text-3xl font-bold leading-tight tracking-[-0.01em] text-[#1E293B] md:text-4xl">
            All your doubts, answered
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0.5 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.35, delay: 0.08 }}
          className="mx-auto max-w-[720px] rounded-2xl border border-[#E2E8F0] bg-white px-6 shadow-sm md:px-8"
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
