import { createFileRoute, Link } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import { Container } from '@/components/ui';
import { useAuthStore } from '@/lib/auth';

export const Route = createFileRoute('/integrations')({
  component: IntegrationsPage,
});

// Brand Logos as SVG components
function HubSpotLogo() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor">
      <path d="M18.164 7.93V5.084a2.198 2.198 0 001.267-1.984v-.066A2.198 2.198 0 0017.238.84h-.066a2.198 2.198 0 00-2.193 2.193v.066c0 .87.51 1.62 1.244 1.976v2.862a5.673 5.673 0 00-2.634 1.206l-6.97-5.426a2.544 2.544 0 00.078-.618 2.549 2.549 0 10-2.549 2.55c.394 0 .768-.092 1.102-.252l6.878 5.356a5.693 5.693 0 00-.475 2.282c0 .832.18 1.622.502 2.336l-2.057 2.057a1.762 1.762 0 00-.52-.08 1.778 1.778 0 101.778 1.778c0-.183-.03-.358-.08-.522l2.037-2.037a5.698 5.698 0 003.636 1.313 5.71 5.71 0 005.707-5.707 5.71 5.71 0 00-5.707-5.707 5.71 5.71 0 00-1.543.226zM17.172 17.2a3.05 3.05 0 01-3.048-3.048 3.05 3.05 0 013.048-3.047 3.05 3.05 0 013.047 3.047 3.05 3.05 0 01-3.047 3.048z" />
    </svg>
  );
}

function SalesforceLogo() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor">
      <path d="M10.006 5.415a4.195 4.195 0 013.045-1.306c1.56 0 2.954.9 3.69 2.205.63-.3 1.35-.45 2.1-.45 2.85 0 5.159 2.34 5.159 5.22s-2.31 5.22-5.16 5.22c-.39 0-.78-.045-1.155-.12-.63 1.38-2.01 2.34-3.615 2.34a3.919 3.919 0 01-1.875-.48c-.66 1.62-2.25 2.76-4.095 2.76-2.055 0-3.795-1.41-4.32-3.345A4.54 4.54 0 013 17.175c-1.665 0-3-1.38-3-3.075 0-1.23.705-2.28 1.74-2.775-.135-.405-.21-.84-.21-1.305 0-2.31 1.845-4.2 4.125-4.2 1.32 0 2.49.63 3.255 1.59l.096.005z" />
    </svg>
  );
}

function PipedriveLogo() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-6h2v6zm0-8h-2V7h2v2zm4 8h-2V9h2v8z" />
    </svg>
  );
}

function CloseLogo() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor">
      <path d="M19.5 3h-15A1.5 1.5 0 003 4.5v15A1.5 1.5 0 004.5 21h15a1.5 1.5 0 001.5-1.5v-15A1.5 1.5 0 0019.5 3zM12 18a6 6 0 116-6 6 6 0 01-6 6zm0-10a4 4 0 104 4 4 4 0 00-4-4z" />
    </svg>
  );
}

function SlackLogo() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor">
      <path d="M5.042 15.165a2.528 2.528 0 01-2.52 2.523A2.528 2.528 0 010 15.165a2.527 2.527 0 012.522-2.52h2.52v2.52zm1.271 0a2.527 2.527 0 012.521-2.52 2.527 2.527 0 012.521 2.52v6.313A2.528 2.528 0 018.834 24a2.528 2.528 0 01-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 01-2.521-2.52A2.528 2.528 0 018.834 0a2.528 2.528 0 012.521 2.522v2.52H8.834zm0 1.271a2.528 2.528 0 012.521 2.521 2.528 2.528 0 01-2.521 2.521H2.522A2.528 2.528 0 010 8.834a2.528 2.528 0 012.522-2.521h6.312zm10.124 2.521a2.528 2.528 0 012.522-2.521A2.528 2.528 0 0124 8.834a2.528 2.528 0 01-2.52 2.521h-2.522V8.834zm-1.271 0a2.528 2.528 0 01-2.521 2.521 2.528 2.528 0 01-2.521-2.521V2.522A2.528 2.528 0 0115.166 0a2.528 2.528 0 012.521 2.522v6.312zm-2.521 10.124a2.528 2.528 0 012.521 2.522A2.528 2.528 0 0115.166 24a2.528 2.528 0 01-2.521-2.52v-2.522h2.521zm0-1.271a2.528 2.528 0 01-2.521-2.521 2.528 2.528 0 012.521-2.521h6.313A2.528 2.528 0 0124 15.166a2.528 2.528 0 01-2.52 2.521h-6.313z" />
    </svg>
  );
}

function ZapierLogo() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor">
      <path d="M15.633 1.929l-3.089 6.164h6.578l-9.755 14.178 3.089-6.164H5.878l9.755-14.178zM12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0z" />
    </svg>
  );
}

function MakeLogo() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor">
      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
    </svg>
  );
}

function WebhookLogo() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
      />
    </svg>
  );
}

function ApiLogo() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
      />
    </svg>
  );
}

const integrations = {
  crm: {
    title: 'CRM Integrations',
    description: 'Keep your CRM in sync with your outreach activities',
    items: [
      {
        name: 'HubSpot',
        description: 'Sync leads, deals, and activities automatically',
        color: '#FF7A59',
        logo: HubSpotLogo,
        features: [
          'Two-way contact sync',
          'Activity logging',
          'Deal pipeline sync',
          'Custom field mapping',
        ],
      },
      {
        name: 'Salesforce',
        description: 'Enterprise CRM integration for large teams',
        color: '#00A1E0',
        logo: SalesforceLogo,
        features: [
          'Lead and contact sync',
          'Opportunity tracking',
          'Custom objects support',
          'Real-time updates',
        ],
      },
      {
        name: 'Pipedrive',
        description: 'Deal and pipeline management sync',
        color: '#017459',
        logo: PipedriveLogo,
        features: ['Person sync', 'Deal creation', 'Activity tracking', 'Pipeline automation'],
      },
      {
        name: 'Close',
        description: 'Sales productivity platform integration',
        color: '#5C6BC0',
        logo: CloseLogo,
        features: ['Lead sync', 'Activity logging', 'Email tracking', 'Call integration'],
      },
    ],
  },
  communication: {
    title: 'Communication',
    description: 'Stay informed with real-time notifications',
    items: [
      {
        name: 'Slack',
        description: 'Get instant notifications in your Slack workspace',
        color: '#4A154B',
        logo: SlackLogo,
        features: [
          'Reply notifications',
          'Connection alerts',
          'Campaign updates',
          'Custom channel routing',
        ],
      },
    ],
  },
  automation: {
    title: 'Automation & Webhooks',
    description: 'Connect SalesParrot to thousands of apps',
    items: [
      {
        name: 'Zapier',
        description: 'Connect to 5,000+ apps with no code',
        color: '#FF4A00',
        logo: ZapierLogo,
        features: [
          'Trigger on new leads',
          'Trigger on replies',
          'Create leads from other apps',
          'Multi-step workflows',
        ],
      },
      {
        name: 'Make',
        description: 'Advanced automation scenarios',
        color: '#6E56FF',
        logo: MakeLogo,
        features: [
          'Complex workflows',
          'Data transformation',
          'Conditional logic',
          'Scheduled automations',
        ],
      },
      {
        name: 'Custom Webhooks',
        description: 'Build your own integrations',
        color: '#64748B',
        logo: WebhookLogo,
        features: ['Real-time events', '20+ event types', 'Retry on failure', 'Delivery logs'],
      },
    ],
  },
  api: {
    title: 'Developer Tools',
    description: 'Full programmatic access to SalesParrot',
    items: [
      {
        name: 'REST API',
        description: 'Complete API access for custom integrations',
        color: '#8B5CF6',
        logo: ApiLogo,
        features: ['Lead management', 'Campaign data', 'Analytics access', 'Webhook management'],
      },
    ],
  },
};

function IntegrationCard({
  name,
  description,
  color,
  logo: Logo,
  features,
}: {
  name: string;
  description: string;
  color: string;
  logo: React.ComponentType;
  features: string[];
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="rounded-2xl border border-[#E2E8F0] bg-white p-6 transition-shadow hover:shadow-lg"
    >
      <div className="mb-4 flex items-center gap-3">
        <div
          className="flex h-12 w-12 items-center justify-center rounded-xl text-white"
          style={{ backgroundColor: color }}
        >
          <Logo />
        </div>
        <div>
          <h3 className="font-semibold text-[#1E293B]">{name}</h3>
          <p className="text-sm text-[#64748B]">{description}</p>
        </div>
      </div>
      <ul className="space-y-2">
        {features.map((feature) => (
          <li key={feature} className="flex items-center gap-2 text-sm text-[#64748B]">
            <svg
              className="h-4 w-4 flex-shrink-0 text-[#22C55E]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            {feature}
          </li>
        ))}
      </ul>
    </motion.div>
  );
}

function IntegrationsPage() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Hero */}
      <section className="bg-white py-16 md:py-24">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 inline-block text-[11px] font-bold uppercase tracking-[0.2em] text-[#FF6B35] md:text-[13px]"
            >
              Integrations
            </motion.span>
            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-6 text-4xl font-bold tracking-tight text-[#1E293B] md:text-5xl"
            >
              Connect with your favorite tools
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg text-[#64748B]"
            >
              SalesParrot integrates with leading CRMs, communication tools, and automation
              platforms to fit seamlessly into your workflow.
            </motion.p>
          </div>
        </Container>
      </section>

      {/* Integration Sections */}
      {Object.entries(integrations).map(([key, section]) => (
        <section key={key} className="border-t border-[#E2E8F0] py-16">
          <Container>
            <div className="mb-10">
              <h2 className="mb-2 text-2xl font-bold text-[#1E293B]">{section.title}</h2>
              <p className="text-[#64748B]">{section.description}</p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {section.items.map((integration) => (
                <IntegrationCard key={integration.name} {...integration} />
              ))}
            </div>
          </Container>
        </section>
      ))}

      {/* CTA */}
      <section className="border-t border-[#E2E8F0] bg-white py-16">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="mb-4 text-2xl font-bold text-[#1E293B]">
              {isAuthenticated ? 'Connect your integrations' : 'Ready to get started?'}
            </h2>
            <p className="mb-8 text-[#64748B]">
              {isAuthenticated
                ? 'Head to your settings to configure integrations.'
                : 'Get started and connect your tools in minutes.'}
            </p>
            <Link
              to={isAuthenticated ? '/dashboard/settings' : '/signup'}
              className="inline-flex items-center justify-center rounded-xl bg-[#FF6B35] px-8 py-3 font-semibold text-white transition-colors hover:bg-[#E85A2A]"
            >
              {isAuthenticated ? 'Go to Settings' : 'Get Started'}
            </Link>
          </div>
        </Container>
      </section>
    </div>
  );
}
