import { createFileRoute, Link } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import { Container } from '@/components/ui';
import { useAuthStore } from '@/lib/auth';

export const Route = createFileRoute('/about')({
  component: AboutPage,
});

const values = [
  {
    title: 'Customer First',
    description:
      'Every feature we build starts with understanding what our customers need to succeed.',
    icon: (
      <svg
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z"
        />
      </svg>
    ),
  },
  {
    title: 'Simplicity',
    description:
      'Powerful tools should be easy to use. We focus on intuitive design that just works.',
    icon: (
      <svg
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
        />
      </svg>
    ),
  },
  {
    title: 'Safety & Compliance',
    description:
      'We prioritize keeping your accounts safe with smart rate limiting and best practices.',
    icon: (
      <svg
        className="h-6 w-6"
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
    ),
  },
  {
    title: 'Continuous Innovation',
    description:
      'We ship fast and iterate based on feedback to deliver the best outreach platform.',
    icon: (
      <svg
        className="h-6 w-6"
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
    ),
  },
];

const features = [
  { stat: 'LinkedIn + Email', label: 'Multi-channel outreach in one sequence' },
  { stat: 'Unified Inbox', label: 'All replies in one place' },
  { stat: 'Auto Enrichment', label: 'Find verified emails automatically' },
  { stat: 'Multiple Senders', label: 'Scale with sender rotation' },
];

function AboutPage() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-[#F8FAFC] py-16 md:py-24">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 inline-block text-[11px] font-bold uppercase tracking-[0.2em] text-[#FF6B35] md:text-[13px]"
            >
              About Us
            </motion.span>
            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-6 text-4xl font-bold tracking-tight text-[#1E293B] md:text-5xl"
            >
              We're building the future of B2B outreach
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg text-[#64748B]"
            >
              SalesParrot helps sales teams and agencies connect with more prospects through
              intelligent LinkedIn and email automation.
            </motion.p>
          </div>
        </Container>
      </section>

      {/* Mission */}
      <section className="py-16">
        <Container>
          <div className="mx-auto max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <h2 className="mb-6 text-2xl font-bold text-[#1E293B] md:text-3xl">Our Mission</h2>
              <p className="text-lg leading-relaxed text-[#64748B]">
                Sales teams spend too much time on manual outreach tasks. We believe technology
                should handle the repetitive work so you can focus on what matters most: building
                genuine relationships with your prospects.
              </p>
              <p className="mt-4 text-lg leading-relaxed text-[#64748B]">
                SalesParrot combines LinkedIn automation, email outreach, and lead enrichment into
                one unified platform that's both powerful and easy to use.
              </p>
            </motion.div>
          </div>
        </Container>
      </section>

      {/* What We Do */}
      <section className="border-t border-[#E2E8F0] bg-[#F8FAFC] py-16">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12 text-center"
          >
            <h2 className="mb-4 text-2xl font-bold text-[#1E293B] md:text-3xl">What We Do</h2>
            <p className="text-[#64748B]">One platform for all your outreach needs</p>
          </motion.div>
          <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
            {features.map((feature, index) => (
              <motion.div
                key={feature.stat}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="rounded-xl border border-[#E2E8F0] bg-white p-6"
              >
                <h3 className="mb-2 text-xl font-bold text-[#FF6B35]">{feature.stat}</h3>
                <p className="text-[#64748B]">{feature.label}</p>
              </motion.div>
            ))}
          </div>
        </Container>
      </section>

      {/* Values */}
      <section className="py-16">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12 text-center"
          >
            <h2 className="mb-4 text-2xl font-bold text-[#1E293B] md:text-3xl">Our Values</h2>
            <p className="text-[#64748B]">The principles that guide everything we do</p>
          </motion.div>
          <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="rounded-xl border border-[#E2E8F0] bg-white p-6"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-[#FF6B35]/10 text-[#FF6B35]">
                  {value.icon}
                </div>
                <h3 className="mb-2 text-lg font-semibold text-[#1E293B]">{value.title}</h3>
                <p className="text-[#64748B]">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </Container>
      </section>

      {/* CTA */}
      <section className="border-t border-[#E2E8F0] bg-[#F8FAFC] py-16">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mx-auto max-w-2xl text-center"
          >
            <h2 className="mb-4 text-2xl font-bold text-[#1E293B]">
              {isAuthenticated ? 'Start scaling your outreach' : 'Ready to scale your outreach?'}
            </h2>
            <p className="mb-8 text-[#64748B]">
              {isAuthenticated
                ? 'Head to your dashboard to create campaigns and connect with prospects.'
                : 'Join thousands of sales teams using SalesParrot to book more meetings.'}
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                to={isAuthenticated ? '/dashboard' : '/signup'}
                className="inline-flex items-center justify-center rounded-xl bg-[#FF6B35] px-8 py-3 font-semibold text-white transition-colors hover:bg-[#E85A2A]"
              >
                {isAuthenticated ? 'Go to Dashboard' : 'Start Free Trial'}
              </Link>
              <Link
                to="/contact"
                className="inline-flex items-center justify-center rounded-xl border border-[#E2E8F0] bg-white px-8 py-3 font-semibold text-[#1E293B] transition-colors hover:bg-[#F8FAFC]"
              >
                Contact Us
              </Link>
            </div>
          </motion.div>
        </Container>
      </section>
    </div>
  );
}
