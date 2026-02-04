import { createFileRoute, Link } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import { Container } from '@/components/ui';

export const Route = createFileRoute('/docs/api')({
  component: ApiDocsPage,
});

const endpoints = {
  leads: {
    title: 'Leads',
    description: 'Manage leads in your workspace',
    endpoints: [
      { method: 'GET', path: '/api/v1/public/leads', description: 'List all leads' },
      { method: 'POST', path: '/api/v1/public/leads', description: 'Create a new lead' },
      { method: 'GET', path: '/api/v1/public/leads/{lead_id}', description: 'Get lead details' },
      { method: 'PATCH', path: '/api/v1/public/leads/{lead_id}', description: 'Update a lead' },
      { method: 'DELETE', path: '/api/v1/public/leads/{lead_id}', description: 'Delete a lead' },
      { method: 'POST', path: '/api/v1/public/leads/bulk', description: 'Bulk create leads' },
      {
        method: 'POST',
        path: '/api/v1/public/leads/{lead_id}/tags',
        description: 'Add tags to lead',
      },
      {
        method: 'DELETE',
        path: '/api/v1/public/leads/{lead_id}/tags',
        description: 'Remove tags from lead',
      },
      {
        method: 'POST',
        path: '/api/v1/public/leads/{lead_id}/status',
        description: 'Update lead status',
      },
    ],
  },
  campaigns: {
    title: 'Campaigns',
    description: 'Access campaign information',
    endpoints: [
      { method: 'GET', path: '/api/v1/public/campaigns', description: 'List all campaigns' },
      {
        method: 'GET',
        path: '/api/v1/public/campaigns/{campaign_id}',
        description: 'Get campaign details',
      },
    ],
  },
  conversations: {
    title: 'Conversations',
    description: 'Manage conversations and messages',
    endpoints: [
      { method: 'GET', path: '/api/v1/public/conversations', description: 'List conversations' },
      {
        method: 'GET',
        path: '/api/v1/public/conversations/{conversation_id}',
        description: 'Get conversation details',
      },
      {
        method: 'POST',
        path: '/api/v1/public/conversations/{conversation_id}/read',
        description: 'Mark conversation as read',
      },
    ],
  },
  analytics: {
    title: 'Analytics',
    description: 'Access analytics and metrics',
    endpoints: [
      {
        method: 'GET',
        path: '/api/v1/public/analytics/overview',
        description: 'Get analytics overview',
      },
      {
        method: 'GET',
        path: '/api/v1/public/analytics/campaigns',
        description: 'Get campaign analytics',
      },
    ],
  },
};

const webhookEvents = [
  {
    category: 'Lead Events',
    events: [
      'lead.created',
      'lead.updated',
      'lead.deleted',
      'lead.enriched',
      'lead.status_changed',
    ],
  },
  {
    category: 'Connection Events',
    events: ['connection.requested', 'connection.accepted', 'connection.rejected'],
  },
  { category: 'Message Events', events: ['message.sent', 'message.delivered', 'message.bounced'] },
  { category: 'Reply Events', events: ['reply.received'] },
  { category: 'Email Events', events: ['email.opened', 'link.clicked'] },
  {
    category: 'Sequence Events',
    events: ['sequence.started', 'sequence.paused', 'sequence.resumed', 'sequence.completed'],
  },
  { category: 'Other Events', events: ['tag.added', 'tag.removed', 'meeting.booked'] },
];

function MethodBadge({ method }: { method: string }) {
  const colors: Record<string, string> = {
    GET: 'bg-[#22C55E]/10 text-[#22C55E]',
    POST: 'bg-[#3B82F6]/10 text-[#3B82F6]',
    PATCH: 'bg-[#F59E0B]/10 text-[#F59E0B]',
    DELETE: 'bg-[#EF4444]/10 text-[#EF4444]',
  };
  return (
    <span
      className={`inline-flex w-16 justify-center rounded px-2 py-0.5 text-xs font-semibold ${colors[method] || 'bg-gray-100 text-gray-600'}`}
    >
      {method}
    </span>
  );
}

function ApiDocsPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Hero */}
      <section className="bg-white py-12 md:py-16">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 inline-block text-[11px] font-bold uppercase tracking-[0.2em] text-[#FF6B35] md:text-[13px]"
            >
              Developer Docs
            </motion.span>
            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-4 text-3xl font-bold text-[#1E293B] md:text-4xl"
            >
              API Documentation
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-[#64748B]"
            >
              Build custom integrations with the SalesParrot REST API
            </motion.p>
          </div>
        </Container>
      </section>

      {/* Content */}
      <section className="py-12">
        <Container>
          <div className="mx-auto max-w-5xl">
            {/* Authentication */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 rounded-xl border border-[#E2E8F0] bg-white p-6"
            >
              <h2 className="mb-4 text-xl font-bold text-[#1E293B]">Authentication</h2>
              <p className="mb-4 text-[#64748B]">
                All API requests require authentication using an API key. Include your API key in
                the Authorization header:
              </p>
              <div className="rounded-lg bg-[#1E293B] p-4">
                <code className="text-sm text-[#22C55E]">Authorization: Bearer YOUR_API_KEY</code>
              </div>
              <p className="mt-4 text-sm text-[#64748B]">
                Generate API keys from your{' '}
                <Link to="/dashboard/settings" className="text-[#FF6B35] hover:underline">
                  Dashboard Settings
                </Link>{' '}
                under Integrations &rarr; API Keys.
              </p>
            </motion.div>

            {/* Base URL */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-8 rounded-xl border border-[#E2E8F0] bg-white p-6"
            >
              <h2 className="mb-4 text-xl font-bold text-[#1E293B]">Base URL</h2>
              <div className="rounded-lg bg-[#1E293B] p-4">
                <code className="text-sm text-[#22C55E]">https://api.salesparrot.com</code>
              </div>
            </motion.div>

            {/* Endpoints */}
            {Object.entries(endpoints).map(([key, section], index) => (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * (index + 2) }}
                className="mb-8 rounded-xl border border-[#E2E8F0] bg-white p-6"
              >
                <h2 className="mb-2 text-xl font-bold text-[#1E293B]">{section.title}</h2>
                <p className="mb-4 text-sm text-[#64748B]">{section.description}</p>
                <div className="space-y-2">
                  {section.endpoints.map((endpoint, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 rounded-lg border border-[#E2E8F0] p-3 transition-colors hover:bg-[#F8FAFC]"
                    >
                      <MethodBadge method={endpoint.method} />
                      <code className="flex-1 text-sm text-[#64748B]">{endpoint.path}</code>
                      <span className="hidden text-sm text-[#94A3B8] md:block">
                        {endpoint.description}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}

            {/* Webhooks */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mb-8 rounded-xl border border-[#E2E8F0] bg-white p-6"
            >
              <h2 className="mb-2 text-xl font-bold text-[#1E293B]">Webhooks</h2>
              <p className="mb-4 text-sm text-[#64748B]">
                Configure webhooks to receive real-time notifications when events occur in your
                workspace.
              </p>

              <h3 className="mb-3 font-semibold text-[#1E293B]">Webhook Management</h3>
              <div className="mb-6 space-y-2">
                <div className="flex items-center gap-3 rounded-lg border border-[#E2E8F0] p-3">
                  <MethodBadge method="GET" />
                  <code className="flex-1 text-sm text-[#64748B]">/api/v1/webhooks</code>
                  <span className="hidden text-sm text-[#94A3B8] md:block">List webhooks</span>
                </div>
                <div className="flex items-center gap-3 rounded-lg border border-[#E2E8F0] p-3">
                  <MethodBadge method="POST" />
                  <code className="flex-1 text-sm text-[#64748B]">/api/v1/webhooks</code>
                  <span className="hidden text-sm text-[#94A3B8] md:block">Create webhook</span>
                </div>
                <div className="flex items-center gap-3 rounded-lg border border-[#E2E8F0] p-3">
                  <MethodBadge method="GET" />
                  <code className="flex-1 text-sm text-[#64748B]">
                    /api/v1/webhooks/event-types
                  </code>
                  <span className="hidden text-sm text-[#94A3B8] md:block">List event types</span>
                </div>
                <div className="flex items-center gap-3 rounded-lg border border-[#E2E8F0] p-3">
                  <MethodBadge method="POST" />
                  <code className="flex-1 text-sm text-[#64748B]">
                    /api/v1/webhooks/{'{webhook_id}'}/test
                  </code>
                  <span className="hidden text-sm text-[#94A3B8] md:block">Test webhook</span>
                </div>
                <div className="flex items-center gap-3 rounded-lg border border-[#E2E8F0] p-3">
                  <MethodBadge method="GET" />
                  <code className="flex-1 text-sm text-[#64748B]">
                    /api/v1/webhooks/{'{webhook_id}'}/deliveries
                  </code>
                  <span className="hidden text-sm text-[#94A3B8] md:block">Delivery logs</span>
                </div>
              </div>

              <h3 className="mb-3 font-semibold text-[#1E293B]">Available Event Types</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                {webhookEvents.map((group) => (
                  <div key={group.category} className="rounded-lg border border-[#E2E8F0] p-4">
                    <h4 className="mb-2 text-sm font-semibold text-[#1E293B]">{group.category}</h4>
                    <div className="flex flex-wrap gap-1">
                      {group.events.map((event) => (
                        <code
                          key={event}
                          className="rounded bg-[#F8FAFC] px-2 py-0.5 text-xs text-[#64748B]"
                        >
                          {event}
                        </code>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Code Example */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mb-8 rounded-xl border border-[#E2E8F0] bg-white p-6"
            >
              <h2 className="mb-4 text-xl font-bold text-[#1E293B]">Example Request</h2>
              <div className="mb-4">
                <h3 className="mb-2 text-sm font-semibold text-[#64748B]">cURL</h3>
                <div className="overflow-x-auto rounded-lg bg-[#1E293B] p-4">
                  <pre className="text-sm text-[#E2E8F0]">
                    {`curl -X GET "https://api.salesparrot.com/api/v1/public/leads" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json"`}
                  </pre>
                </div>
              </div>
              <div>
                <h3 className="mb-2 text-sm font-semibold text-[#64748B]">JavaScript</h3>
                <div className="overflow-x-auto rounded-lg bg-[#1E293B] p-4">
                  <pre className="text-sm text-[#E2E8F0]">
                    {`const response = await fetch('https://api.salesparrot.com/api/v1/public/leads', {
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  }
});
const leads = await response.json();`}
                  </pre>
                </div>
              </div>
            </motion.div>

            {/* Interactive Docs CTA */}
            {/*<motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="rounded-xl border border-[#FF6B35]/20 bg-[#FFF7ED] p-6 text-center"
            >
              <h2 className="mb-2 text-lg font-semibold text-[#1E293B]">
                Interactive API Explorer
              </h2>
              <p className="mb-4 text-[#64748B]">
                Try out API endpoints directly in your browser with our Swagger documentation.
              </p>
              <a
                href="https://api.salesparrot.com/docs"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#FF6B35] px-6 py-2.5 font-medium text-white hover:bg-[#E85A2A]"
              >
                Open API Explorer
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </a>
            </motion.div>*/}
          </div>
        </Container>
      </section>
    </div>
  );
}
