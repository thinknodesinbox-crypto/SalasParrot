import { createFileRoute, Link } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';

export const Route = createFileRoute('/terms')({
  component: TermsPage,
});

function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
        <div className="mx-auto max-w-4xl px-6 py-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-[#64748B] hover:text-[#1E293B]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="mb-2 text-3xl font-bold text-[#1E293B]">Terms of Service</h1>
        <p className="mb-8 text-sm text-[#64748B]">Last updated: January 27, 2025</p>

        <div className="prose prose-slate max-w-none">
          <section className="mb-8">
            <h2 className="mb-4 text-xl font-semibold text-[#1E293B]">1. Acceptance of Terms</h2>
            <p className="mb-4 leading-relaxed text-[#64748B]">
              By accessing or using SalesParrot ("the Service"), you agree to be bound by these
              Terms of Service. If you disagree with any part of these terms, you may not access the
              Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-xl font-semibold text-[#1E293B]">2. Description of Service</h2>
            <p className="mb-4 leading-relaxed text-[#64748B]">
              SalesParrot provides a sales automation platform that enables users to manage LinkedIn
              outreach and email campaigns. The Service includes features for lead management,
              sequence automation, email enrichment, and analytics.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-xl font-semibold text-[#1E293B]">3. User Accounts</h2>
            <p className="mb-4 leading-relaxed text-[#64748B]">
              You must provide accurate and complete information when creating an account. You are
              responsible for maintaining the security of your account and password. You agree to
              notify us immediately of any unauthorized use of your account.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-xl font-semibold text-[#1E293B]">4. Acceptable Use</h2>
            <p className="mb-4 leading-relaxed text-[#64748B]">
              You agree not to use the Service to:
            </p>
            <ul className="mb-4 list-disc space-y-2 pl-6 text-[#64748B]">
              <li>Violate any applicable laws or regulations</li>
              <li>Send spam or unsolicited messages</li>
              <li>Harvest or collect user data without consent</li>
              <li>Impersonate any person or entity</li>
              <li>Interfere with the proper functioning of the Service</li>
              <li>Attempt to gain unauthorized access to our systems</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-xl font-semibold text-[#1E293B]">
              5. LinkedIn and Email Compliance
            </h2>
            <p className="mb-4 leading-relaxed text-[#64748B]">
              You are solely responsible for ensuring your use of the Service complies with
              LinkedIn's Terms of Service and all applicable email marketing laws, including
              CAN-SPAM, GDPR, and CASL. SalesParrot is not responsible for any violations or
              resulting penalties.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-xl font-semibold text-[#1E293B]">6. Payment and Billing</h2>
            <p className="mb-4 leading-relaxed text-[#64748B]">
              Paid subscriptions are billed in advance on a monthly or annual basis. All fees are
              non-refundable except as required by law. We reserve the right to change our pricing
              with 30 days notice.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-xl font-semibold text-[#1E293B]">7. Intellectual Property</h2>
            <p className="mb-4 leading-relaxed text-[#64748B]">
              The Service and its original content, features, and functionality are owned by
              SalesParrot and are protected by international copyright, trademark, and other
              intellectual property laws.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-xl font-semibold text-[#1E293B]">
              8. Limitation of Liability
            </h2>
            <p className="mb-4 leading-relaxed text-[#64748B]">
              In no event shall SalesParrot be liable for any indirect, incidental, special,
              consequential, or punitive damages, including loss of profits, data, or other
              intangible losses, resulting from your use of the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-xl font-semibold text-[#1E293B]">9. Termination</h2>
            <p className="mb-4 leading-relaxed text-[#64748B]">
              We may terminate or suspend your account immediately, without prior notice, for any
              reason, including breach of these Terms. Upon termination, your right to use the
              Service will cease immediately.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-xl font-semibold text-[#1E293B]">10. Changes to Terms</h2>
            <p className="mb-4 leading-relaxed text-[#64748B]">
              We reserve the right to modify these terms at any time. We will notify users of any
              material changes by posting the new Terms on this page. Continued use of the Service
              after changes constitutes acceptance of the modified terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-xl font-semibold text-[#1E293B]">11. Contact Us</h2>
            <p className="mb-4 leading-relaxed text-[#64748B]">
              If you have any questions about these Terms, please contact us at{' '}
              <a href="mailto:team@salesparrot.com" className="text-[#FF6B35] hover:underline">
                team@salesparrot.com
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
