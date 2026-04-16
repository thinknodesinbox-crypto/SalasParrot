import { Link, Outlet, useRouterState } from '@tanstack/react-router';

const navigation = [
  {
    to: '/dashboard/email-marketing',
    label: 'Overview',
    description: 'Health, quick links, and next actions.',
    exact: true,
  },
  {
    to: '/dashboard/email-marketing/lists',
    label: 'Lists',
    description: 'Create lists and manage contacts.',
  },
  {
    to: '/dashboard/email-marketing/contacts',
    label: 'Import',
    description: 'Upload CSVs and review import warnings.',
  },
  {
    to: '/dashboard/email-marketing/templates',
    label: 'Templates',
    description: 'Manage message templates and personalization.',
  },
  {
    to: '/dashboard/email-marketing/broadcasts',
    label: 'Broadcasts',
    description: 'Create one-off sends and review metrics.',
  },
  {
    to: '/dashboard/email-marketing/suppressions',
    label: 'Suppressions',
    description: 'Review and remove unsubscribe, bounce, and complaint blocks.',
  },
];

export function EmailMarketingShell() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1E293B]">Email Marketing</h1>
        <p className="mt-1 text-sm text-[#64748B]">
          Workspace email marketing with lists, imports, templates, and broadcasts.
        </p>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        <aside className="rounded-xl border border-[#E2E8F0] bg-white p-3 lg:w-72 lg:flex-shrink-0">
          <nav className="space-y-1">
            {navigation.map((item) => {
              const isActive = item.exact
                ? pathname === item.to || pathname === `${item.to}/`
                : pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`block rounded-lg px-3 py-2 transition-colors ${
                    isActive ? 'bg-[#FFF7ED] text-[#FF6B35]' : 'text-[#334155] hover:bg-[#F8FAFC]'
                  }`}
                >
                  <div className="text-sm font-medium">{item.label}</div>
                  <div className="mt-0.5 text-xs text-[#64748B]">{item.description}</div>
                </Link>
              );
            })}
          </nav>
        </aside>

        <section className="min-w-0 flex-1">
          <Outlet />
        </section>
      </div>
    </div>
  );
}
