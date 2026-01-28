import { createFileRoute, Link } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';

export const Route = createFileRoute('/privacy')({
  component: PrivacyPage,
});

function PrivacyPage() {
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
        <h1 className="mb-2 text-3xl font-bold text-[#1E293B]">Privacy Policy</h1>
        <p className="mb-8 text-sm text-[#64748B]">Last updated: January 27, 2025</p>

        <div className="prose prose-slate max-w-none">
          <section className="mb-8">
            <h2 className="mb-4 text-xl font-semibold text-[#1E293B]">1. Introduction</h2>
            <p className="mb-4 leading-relaxed text-[#64748B]">
              SalesParrot ("we," "our," or "us") is committed to protecting your privacy. This
              Privacy Policy explains how we collect, use, disclose, and safeguard your information
              when you use our service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-xl font-semibold text-[#1E293B]">2. Information We Collect</h2>
            <h3 className="mb-2 text-lg font-medium text-[#1E293B]">Personal Information</h3>
            <p className="mb-4 leading-relaxed text-[#64748B]">
              We may collect personal information that you voluntarily provide, including:
            </p>
            <ul className="mb-4 list-disc space-y-2 pl-6 text-[#64748B]">
              <li>Name and email address</li>
              <li>Billing information and payment details</li>
              <li>LinkedIn account credentials (encrypted)</li>
              <li>Email account credentials (encrypted)</li>
              <li>Contact lists and lead data you upload</li>
            </ul>

            <h3 className="mb-2 text-lg font-medium text-[#1E293B]">
              Automatically Collected Information
            </h3>
            <p className="mb-4 leading-relaxed text-[#64748B]">
              When you access the Service, we automatically collect:
            </p>
            <ul className="mb-4 list-disc space-y-2 pl-6 text-[#64748B]">
              <li>Device and browser information</li>
              <li>IP address and location data</li>
              <li>Usage patterns and feature interactions</li>
              <li>Cookies and similar tracking technologies</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-xl font-semibold text-[#1E293B]">
              3. How We Use Your Information
            </h2>
            <p className="mb-4 leading-relaxed text-[#64748B]">
              We use the information we collect to:
            </p>
            <ul className="mb-4 list-disc space-y-2 pl-6 text-[#64748B]">
              <li>Provide and maintain our Service</li>
              <li>Process transactions and send billing notifications</li>
              <li>Send you technical notices and support messages</li>
              <li>Respond to your comments and questions</li>
              <li>Analyze usage patterns to improve our Service</li>
              <li>Detect and prevent fraud or abuse</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-xl font-semibold text-[#1E293B]">
              4. Data Sharing and Disclosure
            </h2>
            <p className="mb-4 leading-relaxed text-[#64748B]">
              We do not sell your personal information. We may share your information with:
            </p>
            <ul className="mb-4 list-disc space-y-2 pl-6 text-[#64748B]">
              <li>Service providers who assist in operating our platform</li>
              <li>Payment processors for billing purposes</li>
              <li>Analytics providers to improve our Service</li>
              <li>Law enforcement when required by law</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-xl font-semibold text-[#1E293B]">5. Data Security</h2>
            <p className="mb-4 leading-relaxed text-[#64748B]">
              We implement appropriate technical and organizational security measures to protect
              your information, including encryption at rest and in transit, regular security
              audits, and access controls. However, no method of transmission over the Internet is
              100% secure.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-xl font-semibold text-[#1E293B]">6. Data Retention</h2>
            <p className="mb-4 leading-relaxed text-[#64748B]">
              We retain your personal information for as long as your account is active or as needed
              to provide you services. You may request deletion of your data at any time by
              contacting us.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-xl font-semibold text-[#1E293B]">7. Your Rights</h2>
            <p className="mb-4 leading-relaxed text-[#64748B]">
              Depending on your location, you may have the following rights:
            </p>
            <ul className="mb-4 list-disc space-y-2 pl-6 text-[#64748B]">
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Object to data processing</li>
              <li>Data portability</li>
              <li>Withdraw consent</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-xl font-semibold text-[#1E293B]">8. Cookies</h2>
            <p className="mb-4 leading-relaxed text-[#64748B]">
              We use cookies and similar tracking technologies to enhance your experience. You can
              control cookies through your browser settings. Disabling cookies may limit your
              ability to use certain features of the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-xl font-semibold text-[#1E293B]">
              9. International Data Transfers
            </h2>
            <p className="mb-4 leading-relaxed text-[#64748B]">
              Your information may be transferred to and processed in countries other than your own.
              We ensure appropriate safeguards are in place for such transfers in compliance with
              applicable data protection laws.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-xl font-semibold text-[#1E293B]">10. Children's Privacy</h2>
            <p className="mb-4 leading-relaxed text-[#64748B]">
              Our Service is not intended for users under 18 years of age. We do not knowingly
              collect personal information from children. If we learn we have collected such
              information, we will delete it promptly.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-xl font-semibold text-[#1E293B]">
              11. Changes to This Policy
            </h2>
            <p className="mb-4 leading-relaxed text-[#64748B]">
              We may update this Privacy Policy from time to time. We will notify you of any changes
              by posting the new policy on this page and updating the "Last updated" date.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-xl font-semibold text-[#1E293B]">12. Contact Us</h2>
            <p className="mb-4 leading-relaxed text-[#64748B]">
              If you have questions about this Privacy Policy or our data practices, please contact
              us at{' '}
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
