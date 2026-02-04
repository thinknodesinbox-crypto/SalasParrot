import { createFileRoute, Link } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { Container } from '@/components/ui';

export const Route = createFileRoute('/help')({
  component: HelpPage,
});

function HelpPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    {
      title: 'Getting Started',
      icon: <RocketIcon />,
      color: '#FF6B35',
      articles: [
        { title: 'Quick start guide', time: '5 min' },
        { title: 'Connecting your first LinkedIn account', time: '3 min' },
        { title: 'Importing leads', time: '4 min' },
        { title: 'Creating your first campaign', time: '6 min' },
      ],
    },
    {
      title: 'LinkedIn Safety',
      icon: <ShieldIcon />,
      color: '#22C55E',
      articles: [
        { title: 'Understanding sending limits', time: '4 min' },
        { title: 'Account warmup explained', time: '3 min' },
        { title: 'Best practices for safe outreach', time: '5 min' },
        { title: 'What to do if your account is restricted', time: '4 min' },
      ],
    },
    {
      title: 'Campaigns',
      icon: <CampaignIcon />,
      color: '#3B82F6',
      articles: [
        { title: 'Building effective sequences', time: '6 min' },
        { title: 'Using If Connected logic', time: '4 min' },
        { title: 'Multi-channel campaigns', time: '5 min' },
        { title: 'A/B testing your messages', time: '4 min' },
      ],
    },
    {
      title: 'Email & Enrichment',
      icon: <EmailIcon />,
      color: '#14B8A6',
      articles: [
        { title: 'How email enrichment works', time: '3 min' },
        { title: 'Improving deliverability', time: '5 min' },
        { title: 'Email personalization', time: '4 min' },
        { title: 'Managing bounces', time: '3 min' },
      ],
    },
  ];

  const faqs = [
    {
      question: 'How does the $1 trial work?',
      answer:
        "Your $1 trial gives you full access to all features for 7 days. After the trial, you'll be charged based on your selected plan. You can cancel anytime during the trial period.",
    },
    {
      question: 'Is my LinkedIn account safe?',
      answer:
        "Yes! We use industry-leading safety measures including smart rate limiting, account warmup, and human-like sending patterns. Our system respects LinkedIn's guidelines to keep your account safe.",
    },
    {
      question: 'How do you find email addresses?',
      answer:
        'We use a combination of verified databases, pattern matching, and real-time validation to find and verify business email addresses for your leads. Only verified emails are used for outreach.',
    },
    {
      question: 'Can I connect multiple LinkedIn accounts?',
      answer:
        'Yes! Depending on your plan, you can connect multiple LinkedIn accounts. Our system automatically rotates between senders to maximize daily sending capacity while keeping each account safe.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Hero */}
      <section className="bg-white py-12 md:py-16">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 text-3xl font-bold text-[#1E293B] md:text-4xl"
            >
              How can we help?
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-8 text-[#64748B]"
            >
              Search our knowledge base or browse categories below
            </motion.p>

            {/* Search */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="relative mx-auto max-w-md"
            >
              <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for help..."
                className="w-full rounded-xl border border-[#E2E8F0] bg-white py-3 pl-11 pr-4 focus:border-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20"
              />
            </motion.div>
          </div>
        </Container>
      </section>

      {/* Categories */}
      <section className="py-12">
        <Container>
          <div className="mx-auto max-w-4xl">
            <div className="grid gap-4 sm:grid-cols-2">
              {categories.map((category, index) => (
                <motion.div
                  key={category.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="rounded-xl border border-[#E2E8F0] bg-white p-5 transition-all hover:border-[#FF6B35]/30 hover:shadow-md"
                >
                  <div className="mb-4 flex items-center gap-3">
                    <div
                      className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg"
                      style={{ backgroundColor: `${category.color}15` }}
                    >
                      <div style={{ color: category.color }}>{category.icon}</div>
                    </div>
                    <h2 className="font-semibold text-[#1E293B]">{category.title}</h2>
                  </div>
                  <ul className="space-y-2">
                    {category.articles.map((article, i) => (
                      <li key={i}>
                        <a
                          href="#"
                          className="group flex items-center justify-between py-2 text-sm text-[#64748B] transition-colors hover:text-[#FF6B35]"
                        >
                          <span className="group-hover:underline">{article.title}</span>
                          <span className="ml-2 flex-shrink-0 text-xs text-[#94A3B8]">
                            {article.time}
                          </span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* FAQs */}
      <section className="border-t border-[#E2E8F0] bg-white py-12">
        <Container>
          <div className="mx-auto max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="mb-6 text-center text-2xl font-bold text-[#1E293B]">
                Frequently Asked Questions
              </h2>
              <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-6">
                <div className="space-y-4">
                  {faqs.map((faq, index) => (
                    <FAQItem key={index} question={faq.question} answer={faq.answer} />
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </Container>
      </section>

      {/* Contact Support */}
      <section className="py-12">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mx-auto max-w-2xl rounded-2xl border border-[#FF6B35]/20 bg-[#FFF7ED] p-8 text-center"
          >
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm">
              <ChatIcon className="h-6 w-6 text-[#FF6B35]" />
            </div>
            <h2 className="mb-2 text-lg font-semibold text-[#1E293B]">Still need help?</h2>
            <p className="mb-6 text-[#64748B]">Our support team is here to help you succeed</p>
            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
              <a
                href="mailto:team@salesparrot.com"
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#E2E8F0] bg-white px-6 py-2.5 font-medium text-[#1E293B] hover:bg-[#F8FAFC] sm:w-auto"
              >
                <EmailSmallIcon />
                Email Support
              </a>
              <Link
                to="/contact"
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#FF6B35] px-6 py-2.5 font-medium text-white hover:bg-[#E85A2A] sm:w-auto"
              >
                <ChatIcon className="h-4 w-4" />
                Contact Us
              </Link>
            </div>
          </motion.div>
        </Container>
      </section>
    </div>
  );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-[#E2E8F0] pb-4 last:border-0 last:pb-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between gap-2 py-2 text-left"
      >
        <span className="font-medium text-[#1E293B]">{question}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="flex-shrink-0"
        >
          <ChevronDownIcon />
        </motion.div>
      </button>
      <motion.div
        initial={false}
        animate={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }}
        transition={{ duration: 0.2 }}
        className="overflow-hidden"
      >
        <p className="pb-2 text-sm text-[#64748B]">{answer}</p>
      </motion.div>
    </div>
  );
}

// Icons
function SearchIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      className={`h-5 w-5 ${className}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
  );
}

function RocketIcon() {
  return (
    <svg
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"
      />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
      />
    </svg>
  );
}

function CampaignIcon() {
  return (
    <svg
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
      />
    </svg>
  );
}

function EmailIcon() {
  return (
    <svg
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
      />
    </svg>
  );
}

function ChatIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
      />
    </svg>
  );
}

function EmailSmallIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
      />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg
      className="h-5 w-5 text-[#64748B]"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
  );
}
