import { createFileRoute, Link } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { Container } from '@/components/ui';

export const Route = createFileRoute('/contact')({
  component: ContactPage,
});

function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission - in production, this would send to your backend
    await new Promise((resolve) => setTimeout(resolve, 1000));

    setIsSubmitting(false);
    setIsSubmitted(true);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Hero */}
      <section className="bg-white py-12 md:py-16">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 inline-block text-[11px] font-bold uppercase tracking-[0.2em] text-[#FF6B35] md:text-[13px]"
            >
              Contact
            </motion.span>
            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-4 text-3xl font-bold text-[#1E293B] md:text-4xl"
            >
              Get in touch
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-[#64748B]"
            >
              Have a question or need help? We'd love to hear from you.
            </motion.p>
          </div>
        </Container>
      </section>

      {/* Contact Content */}
      <section className="py-12">
        <Container>
          <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-5">
            {/* Contact Info */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:col-span-2"
            >
              <div className="rounded-xl border border-[#E2E8F0] bg-white p-6">
                <h2 className="mb-6 text-lg font-semibold text-[#1E293B]">Contact Information</h2>

                <div className="space-y-6">
                  {/* Email */}
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-[#FF6B35]/10">
                      <svg
                        className="h-5 w-5 text-[#FF6B35]"
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
                    </div>
                    <div>
                      <h3 className="font-medium text-[#1E293B]">Email</h3>
                      <a
                        href="mailto:team@salesparrot.com"
                        className="text-[#64748B] hover:text-[#FF6B35]"
                      >
                        team@salesparrot.com
                      </a>
                    </div>
                  </div>

                  {/* Response Time */}
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-[#22C55E]/10">
                      <svg
                        className="h-5 w-5 text-[#22C55E]"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-medium text-[#1E293B]">Response Time</h3>
                      <p className="text-[#64748B]">We typically respond within 24 hours</p>
                    </div>
                  </div>

                  {/* Help Center */}
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-[#3B82F6]/10">
                      <svg
                        className="h-5 w-5 text-[#3B82F6]"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-medium text-[#1E293B]">Help Center</h3>
                      <p className="text-[#64748B]">
                        Check our{' '}
                        <Link to="/help" className="text-[#FF6B35] hover:underline">
                          Help Center
                        </Link>{' '}
                        for quick answers
                      </p>
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <hr className="my-6 border-[#E2E8F0]" />

                {/* Social Links */}
                <div>
                  <h3 className="mb-4 font-medium text-[#1E293B]">Follow Us</h3>
                  <div className="flex gap-3">
                    <a
                      href="https://twitter.com/salesparrot"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#E2E8F0] text-[#64748B] transition-colors hover:border-[#FF6B35] hover:text-[#FF6B35]"
                    >
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                      </svg>
                    </a>
                    <a
                      href="https://linkedin.com/company/salesparrot"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#E2E8F0] text-[#64748B] transition-colors hover:border-[#FF6B35] hover:text-[#FF6B35]"
                    >
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:col-span-3"
            >
              <div className="rounded-xl border border-[#E2E8F0] bg-white p-6">
                {isSubmitted ? (
                  <div className="py-12 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#22C55E]/10">
                      <svg
                        className="h-8 w-8 text-[#22C55E]"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h2 className="mb-2 text-xl font-semibold text-[#1E293B]">Message sent!</h2>
                    <p className="mb-6 text-[#64748B]">
                      Thanks for reaching out. We'll get back to you within 24 hours.
                    </p>
                    <button
                      onClick={() => {
                        setIsSubmitted(false);
                        setFormData({ name: '', email: '', subject: '', message: '' });
                      }}
                      className="text-[#FF6B35] hover:underline"
                    >
                      Send another message
                    </button>
                  </div>
                ) : (
                  <>
                    <h2 className="mb-6 text-lg font-semibold text-[#1E293B]">Send us a message</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label
                            htmlFor="name"
                            className="mb-1 block text-sm font-medium text-[#1E293B]"
                          >
                            Name
                          </label>
                          <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            className="w-full rounded-lg border border-[#E2E8F0] px-4 py-2.5 focus:border-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20"
                            placeholder="Your name"
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="email"
                            className="mb-1 block text-sm font-medium text-[#1E293B]"
                          >
                            Email
                          </label>
                          <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            className="w-full rounded-lg border border-[#E2E8F0] px-4 py-2.5 focus:border-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20"
                            placeholder="you@company.com"
                          />
                        </div>
                      </div>

                      <div>
                        <label
                          htmlFor="subject"
                          className="mb-1 block text-sm font-medium text-[#1E293B]"
                        >
                          Subject
                        </label>
                        <select
                          id="subject"
                          name="subject"
                          value={formData.subject}
                          onChange={handleChange}
                          required
                          className="w-full rounded-lg border border-[#E2E8F0] px-4 py-2.5 focus:border-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20"
                        >
                          <option value="">Select a topic</option>
                          <option value="sales">Sales inquiry</option>
                          <option value="support">Technical support</option>
                          <option value="billing">Billing question</option>
                          <option value="partnership">Partnership opportunity</option>
                          <option value="other">Other</option>
                        </select>
                      </div>

                      <div>
                        <label
                          htmlFor="message"
                          className="mb-1 block text-sm font-medium text-[#1E293B]"
                        >
                          Message
                        </label>
                        <textarea
                          id="message"
                          name="message"
                          value={formData.message}
                          onChange={handleChange}
                          required
                          rows={5}
                          className="w-full resize-none rounded-lg border border-[#E2E8F0] px-4 py-2.5 focus:border-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20"
                          placeholder="How can we help you?"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full rounded-lg bg-[#FF6B35] px-6 py-3 font-semibold text-white transition-colors hover:bg-[#E85A2A] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isSubmitting ? 'Sending...' : 'Send Message'}
                      </button>
                    </form>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        </Container>
      </section>
    </div>
  );
}
