import { Link, createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';

import {
  useMarketingBroadcasts,
  useMarketingLists,
  useMarketingOverviewTrends,
  useMarketingTemplates,
} from '@/lib/hooks/queries';
import { useCurrentWorkspace } from '@/lib/workspace';

export const Route = createFileRoute('/dashboard/email-marketing/')({
  component: EmailMarketingOverviewPage,
});

function EmailMarketingOverviewPage() {
  const { currentWorkspace } = useCurrentWorkspace();
  const workspaceId = currentWorkspace?.id;
  const { data: lists = [] } = useMarketingLists(workspaceId);
  const { data: templates = [] } = useMarketingTemplates(workspaceId);
  const { data: broadcasts = [] } = useMarketingBroadcasts(workspaceId);
  const [trendWindow, setTrendWindow] = useState(7);
  const { data: trendPoints = [] } = useMarketingOverviewTrends(workspaceId, trendWindow);

  const totalContacts = lists.reduce((sum, list) => sum + list.total_contacts, 0);
  const totalSubscribed = lists.reduce((sum, list) => sum + list.subscribed_contacts, 0);
  const draftBroadcasts = broadcasts.filter((broadcast) => broadcast.status === 'draft').length;
  const maxTrendValue = Math.max(
    1,
    ...trendPoints.flatMap((point) => [point.sent, point.opened, point.clicked])
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <OverviewCard label="Lists" value={String(lists.length)} />
        <OverviewCard label="Contacts" value={String(totalContacts)} />
        <OverviewCard label="Subscribed" value={String(totalSubscribed)} />
        <OverviewCard label="Draft Broadcasts" value={String(draftBroadcasts)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <QuickLinkCard
          title="Manage Lists"
          body="Create lists, inspect contacts, and take action on membership state."
          to="/dashboard/email-marketing/lists"
          cta="Open lists"
        />
        <QuickLinkCard
          title="Import Contacts"
          body="Upload CSVs with preview and warnings before they enter a list."
          to="/dashboard/email-marketing/contacts"
          cta="Import CSV"
        />
        <QuickLinkCard
          title="Launch Broadcasts"
          body="Create templates and stage sends against connected workspace inboxes."
          to="/dashboard/email-marketing/broadcasts"
          cta="Open broadcasts"
        />
      </div>

      <div className="rounded-xl border border-[#E2E8F0] bg-white p-5">
        <h2 className="text-lg font-semibold text-[#1E293B]">Recent Lists</h2>
        {lists.length === 0 ? (
          <p className="mt-3 text-sm text-[#64748B]">No lists yet.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[#E2E8F0] text-[#64748B]">
                  <th className="px-2 py-2 font-medium">Name</th>
                  <th className="px-2 py-2 font-medium">Contacts</th>
                  <th className="px-2 py-2 font-medium">Subscribed</th>
                  <th className="px-2 py-2 font-medium">Open</th>
                </tr>
              </thead>
              <tbody>
                {lists.slice(0, 5).map((list) => (
                  <tr key={list.id} className="border-b border-[#F1F5F9] text-[#1E293B]">
                    <td className="px-2 py-2">{list.name}</td>
                    <td className="px-2 py-2">{list.total_contacts}</td>
                    <td className="px-2 py-2">{list.subscribed_contacts}</td>
                    <td className="px-2 py-2">
                      <Link
                        to="/dashboard/email-marketing/lists/$listId"
                        params={{ listId: list.id }}
                        className="text-[#FF6B35] hover:underline"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-[#E2E8F0] bg-white p-5">
        <h2 className="text-lg font-semibold text-[#1E293B]">Templates</h2>
        <p className="mt-2 text-sm text-[#64748B]">
          {templates.length === 0
            ? 'No templates yet. Build your first broadcast template.'
            : `${templates.length} templates available for broadcasts.`}
        </p>
      </div>

      <div className="rounded-xl border border-[#E2E8F0] bg-white p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[#1E293B]">Delivery Trend</h2>
            <p className="mt-1 text-sm text-[#64748B]">
              Sent, opened, and clicked activity over the last few days.
            </p>
          </div>
          <select
            value={trendWindow}
            onChange={(e) => setTrendWindow(Number(e.target.value))}
            className="rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm focus:border-[#FF6B35] focus:outline-none"
          >
            <option value={7}>Last 7 days</option>
            <option value={14}>Last 14 days</option>
            <option value={30}>Last 30 days</option>
          </select>
        </div>

        {trendPoints.length === 0 ? (
          <p className="mt-4 text-sm text-[#64748B]">No tracked activity yet.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {trendPoints.map((point) => (
              <div key={point.date} className="rounded-lg border border-[#F1F5F9] bg-[#FAFCFF] p-3">
                <div className="flex items-center justify-between gap-4">
                  <div className="text-sm font-medium text-[#1E293B]">{point.date}</div>
                  <div className="flex gap-3 text-xs text-[#64748B]">
                    <span>Sent {point.sent}</span>
                    <span>Opened {point.opened}</span>
                    <span>Clicked {point.clicked}</span>
                  </div>
                </div>
                <div className="mt-3 space-y-2">
                  <TrendBar
                    label="Sent"
                    value={point.sent}
                    maxValue={maxTrendValue}
                    colorClass="bg-[#1D4ED8]"
                  />
                  <TrendBar
                    label="Opened"
                    value={point.opened}
                    maxValue={maxTrendValue}
                    colorClass="bg-[#0F766E]"
                  />
                  <TrendBar
                    label="Clicked"
                    value={point.clicked}
                    maxValue={maxTrendValue}
                    colorClass="bg-[#FF6B35]"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function OverviewCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#E2E8F0] bg-white p-4">
      <div className="text-xs uppercase tracking-wide text-[#64748B]">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-[#1E293B]">{value}</div>
    </div>
  );
}

function QuickLinkCard({
  title,
  body,
  to,
  cta,
}: {
  title: string;
  body: string;
  to: string;
  cta: string;
}) {
  return (
    <div className="rounded-xl border border-[#E2E8F0] bg-white p-5">
      <h2 className="text-lg font-semibold text-[#1E293B]">{title}</h2>
      <p className="mt-2 text-sm text-[#64748B]">{body}</p>
      <Link
        to={to}
        className="mt-4 inline-flex rounded-lg bg-[#FF6B35] px-4 py-2 text-sm font-medium text-white"
      >
        {cta}
      </Link>
    </div>
  );
}

function TrendBar({
  label,
  value,
  maxValue,
  colorClass,
}: {
  label: string;
  value: number;
  maxValue: number;
  colorClass: string;
}) {
  const width = `${Math.max(6, Math.round((value / maxValue) * 100))}%`;
  return (
    <div className="grid grid-cols-[72px_minmax(0,1fr)_48px] items-center gap-3 text-xs">
      <span className="text-[#64748B]">{label}</span>
      <div className="h-2 overflow-hidden rounded-full bg-[#E2E8F0]">
        <div className={`h-full rounded-full ${colorClass}`} style={{ width }} />
      </div>
      <span className="text-right text-[#1E293B]">{value}</span>
    </div>
  );
}
