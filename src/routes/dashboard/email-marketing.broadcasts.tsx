import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useMemo, useState } from 'react';

import {
  useCancelMarketingBroadcast,
  useCancelMarketingBroadcastRecipient,
  useCreateMarketingBroadcast,
  useEmailAccounts,
  useMarketingBroadcastInsights,
  useMarketingBroadcastRecipient,
  useMarketingBroadcastRecipients,
  useMarketingBroadcastMetrics,
  useMarketingBroadcasts,
  useMarketingLists,
  useMarketingSegments,
  usePauseMarketingBroadcast,
  useResumeMarketingBroadcast,
  useMarketingTemplates,
  useRetryMarketingBroadcastRecipient,
  useSendMarketingBroadcast,
  useUpdateMarketingBroadcast,
} from '@/lib/hooks/queries';
import { showErrorToast, showSuccessToast } from '@/lib/toast';
import { useCurrentWorkspace } from '@/lib/workspace';

export const Route = createFileRoute('/dashboard/email-marketing/broadcasts')({
  component: EmailMarketingBroadcastsPage,
});

function EmailMarketingBroadcastsPage() {
  const { currentWorkspace } = useCurrentWorkspace();
  const workspaceId = currentWorkspace?.id || '';
  const [broadcastName, setBroadcastName] = useState('');
  const [broadcastListId, setBroadcastListId] = useState('');
  const [segmentId, setSegmentId] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [senderEmailAccountId, setSenderEmailAccountId] = useState('');
  const [timezoneOverride, setTimezoneOverride] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [sendWindowStart, setSendWindowStart] = useState('09:00');
  const [sendWindowEnd, setSendWindowEnd] = useState('18:00');
  const [activeBroadcastId, setActiveBroadcastId] = useState('');
  const [selectedRecipientId, setSelectedRecipientId] = useState('');

  const { data: lists = [] } = useMarketingLists(workspaceId || undefined);
  const { data: allSegments = [] } = useMarketingSegments(workspaceId || undefined);
  const { data: templates = [] } = useMarketingTemplates(workspaceId || undefined);
  const { data: broadcasts = [] } = useMarketingBroadcasts(workspaceId || undefined);
  const { data: emailAccounts = [] } = useEmailAccounts(
    workspaceId ? { workspace_id: workspaceId } : undefined
  );

  const createBroadcastMutation = useCreateMarketingBroadcast();
  const updateBroadcastMutation = useUpdateMarketingBroadcast();
  const sendBroadcastMutation = useSendMarketingBroadcast();
  const pauseBroadcastMutation = usePauseMarketingBroadcast();
  const resumeBroadcastMutation = useResumeMarketingBroadcast();
  const cancelBroadcastMutation = useCancelMarketingBroadcast();
  const retryRecipientMutation = useRetryMarketingBroadcastRecipient();
  const cancelRecipientMutation = useCancelMarketingBroadcastRecipient();

  const { data: metrics, refetch: refetchMetrics } =
    useMarketingBroadcastMetrics(activeBroadcastId);
  const { data: insights } = useMarketingBroadcastInsights(activeBroadcastId);
  const { data: recipientsData } = useMarketingBroadcastRecipients(activeBroadcastId);
  const { data: recipientDetail } = useMarketingBroadcastRecipient(
    activeBroadcastId,
    selectedRecipientId || undefined
  );

  const activeBroadcast =
    broadcasts.find((broadcast) => broadcast.id === activeBroadcastId) || null;
  const segments = useMemo(
    () => allSegments.filter((segment) => segment.list_id === broadcastListId),
    [allSegments, broadcastListId]
  );

  useEffect(() => {
    if (!activeBroadcast && broadcasts[0]) {
      setActiveBroadcastId(broadcasts[0].id);
      return;
    }
    if (!activeBroadcast) return;
    setBroadcastName(activeBroadcast.name);
    setBroadcastListId(activeBroadcast.list_id);
    setSegmentId(activeBroadcast.segment_id || '');
    setTemplateId(activeBroadcast.template_id);
    setSenderEmailAccountId(activeBroadcast.sender_email_account_id || '');
    setTimezoneOverride(activeBroadcast.timezone_override || '');
    setScheduledAt(activeBroadcast.scheduled_at ? activeBroadcast.scheduled_at.slice(0, 16) : '');
    setSendWindowStart(activeBroadcast.send_window_start || '09:00');
    setSendWindowEnd(activeBroadcast.send_window_end || '18:00');
  }, [activeBroadcast?.id]);

  const canSubmit =
    workspaceId && broadcastName.trim() && broadcastListId && templateId && senderEmailAccountId;

  const handleCreateBroadcast = async () => {
    if (!canSubmit) return;
    try {
      const created = await createBroadcastMutation.mutateAsync({
        workspace_id: workspaceId,
        list_id: broadcastListId,
        segment_id: segmentId || undefined,
        template_id: templateId,
        sender_email_account_id: senderEmailAccountId,
        name: broadcastName.trim(),
        timezone_override: timezoneOverride.trim() || undefined,
        scheduled_at: scheduledAt || undefined,
        send_window_start: sendWindowStart,
        send_window_end: sendWindowEnd,
      });
      setActiveBroadcastId(created.id);
      showSuccessToast('Broadcast created', `"${created.name}" is ready.`);
    } catch (error) {
      showErrorToast(
        'Failed to create broadcast',
        error instanceof Error ? error.message : undefined
      );
    }
  };

  const handleUpdateBroadcast = async () => {
    if (!activeBroadcast || !canSubmit) return;
    try {
      await updateBroadcastMutation.mutateAsync({
        broadcastId: activeBroadcast.id,
        name: broadcastName.trim(),
        segment_id: segmentId || undefined,
        template_id: templateId,
        sender_email_account_id: senderEmailAccountId,
        timezone_override: timezoneOverride.trim() || undefined,
        scheduled_at: scheduledAt || undefined,
        send_window_start: sendWindowStart,
        send_window_end: sendWindowEnd,
      });
      showSuccessToast('Broadcast updated', 'Broadcast settings saved.');
    } catch (error) {
      showErrorToast(
        'Failed to update broadcast',
        error instanceof Error ? error.message : undefined
      );
    }
  };

  const handleSendBroadcast = async () => {
    if (!activeBroadcastId) return;
    try {
      const result = await sendBroadcastMutation.mutateAsync(activeBroadcastId);
      await refetchMetrics();
      showSuccessToast(
        'Send queued',
        `Status: ${result.status}. Attempted ${result.attempted}, sent ${result.sent}, failed ${result.failed}.`
      );
    } catch (error) {
      showErrorToast(
        'Failed to send broadcast',
        error instanceof Error ? error.message : undefined
      );
    }
  };

  const handleStatusAction = async (action: 'pause' | 'resume' | 'cancel') => {
    if (!activeBroadcastId) return;
    try {
      if (action === 'pause') {
        await pauseBroadcastMutation.mutateAsync(activeBroadcastId);
      } else if (action === 'resume') {
        await resumeBroadcastMutation.mutateAsync(activeBroadcastId);
      } else {
        await cancelBroadcastMutation.mutateAsync(activeBroadcastId);
      }
      await refetchMetrics();
      showSuccessToast('Broadcast updated', `Broadcast ${action} requested.`);
    } catch (error) {
      showErrorToast(
        'Failed to update broadcast',
        error instanceof Error ? error.message : undefined
      );
    }
  };

  const handleRecipientAction = async (action: 'retry' | 'cancel') => {
    if (!activeBroadcastId || !selectedRecipientId) return;
    try {
      if (action === 'retry') {
        await retryRecipientMutation.mutateAsync({
          broadcastId: activeBroadcastId,
          recipientId: selectedRecipientId,
        });
      } else {
        await cancelRecipientMutation.mutateAsync({
          broadcastId: activeBroadcastId,
          recipientId: selectedRecipientId,
        });
      }
      showSuccessToast('Recipient updated', `Recipient ${action} requested.`);
    } catch (error) {
      showErrorToast(
        'Failed to update recipient',
        error instanceof Error ? error.message : undefined
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-[#1E293B]">Broadcasts</h2>
            <button
              type="button"
              onClick={() => {
                setActiveBroadcastId('');
                setSelectedRecipientId('');
                setBroadcastName('');
                setBroadcastListId('');
                setSegmentId('');
                setTemplateId('');
                setSenderEmailAccountId('');
                setTimezoneOverride('');
                setScheduledAt('');
                setSendWindowStart('09:00');
                setSendWindowEnd('18:00');
              }}
              className="rounded-md border border-[#E2E8F0] px-3 py-1 text-xs text-[#334155]"
            >
              New
            </button>
          </div>
          <div className="mt-4 space-y-2">
            {broadcasts.length === 0 ? (
              <p className="text-sm text-[#64748B]">No broadcasts yet.</p>
            ) : (
              broadcasts.map((broadcast) => {
                const isActive = broadcast.id === activeBroadcastId;
                return (
                  <button
                    key={broadcast.id}
                    type="button"
                    onClick={() => {
                      setActiveBroadcastId(broadcast.id);
                      setSelectedRecipientId('');
                    }}
                    className={`w-full rounded-lg border px-3 py-3 text-left ${
                      isActive
                        ? 'border-[#FF6B35] bg-[#FFF7ED]'
                        : 'border-[#E2E8F0] bg-white hover:bg-[#F8FAFC]'
                    }`}
                  >
                    <div className="text-sm font-medium text-[#1E293B]">{broadcast.name}</div>
                    <div className="mt-1 text-xs text-[#64748B]">
                      {broadcast.status} · {broadcast.total_recipients} recipients
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-[#E2E8F0] bg-white p-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-[#1E293B]">
                  {activeBroadcast ? 'Edit Broadcast' : 'Create Broadcast'}
                </h2>
                <p className="mt-1 text-sm text-[#64748B]">
                  Stage a one-off broadcast with segment targeting, send windows, and scheduling.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {activeBroadcast ? (
                  <button
                    type="button"
                    onClick={handleUpdateBroadcast}
                    disabled={!canSubmit || updateBroadcastMutation.isPending}
                    className="rounded-lg bg-[#FF6B35] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                  >
                    Save
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleCreateBroadcast}
                    disabled={!canSubmit || createBroadcastMutation.isPending}
                    className="rounded-lg bg-[#FF6B35] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                  >
                    Create
                  </button>
                )}
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <input
                value={broadcastName}
                onChange={(e) => setBroadcastName(e.target.value)}
                placeholder="Broadcast name"
                className="rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm focus:border-[#FF6B35] focus:outline-none"
              />
              <select
                value={broadcastListId}
                onChange={(e) => {
                  setBroadcastListId(e.target.value);
                  setSegmentId('');
                }}
                className="rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm focus:border-[#FF6B35] focus:outline-none"
              >
                <option value="">Select list</option>
                {lists.map((list) => (
                  <option key={list.id} value={list.id}>
                    {list.name}
                  </option>
                ))}
              </select>
              <select
                value={segmentId}
                onChange={(e) => setSegmentId(e.target.value)}
                className="rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm focus:border-[#FF6B35] focus:outline-none"
              >
                <option value="">All contacts in list</option>
                {segments.map((segment) => (
                  <option key={segment.id} value={segment.id}>
                    {segment.name}
                  </option>
                ))}
              </select>
              <select
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
                className="rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm focus:border-[#FF6B35] focus:outline-none"
              >
                <option value="">Select template</option>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
              <select
                value={senderEmailAccountId}
                onChange={(e) => setSenderEmailAccountId(e.target.value)}
                className="rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm focus:border-[#FF6B35] focus:outline-none"
              >
                <option value="">Sender email account</option>
                {emailAccounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.email_address} ({account.status})
                  </option>
                ))}
              </select>
              <input
                value={timezoneOverride}
                onChange={(e) => setTimezoneOverride(e.target.value)}
                placeholder="Timezone override"
                className="rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm focus:border-[#FF6B35] focus:outline-none"
              />
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm focus:border-[#FF6B35] focus:outline-none"
              />
              <input
                type="time"
                value={sendWindowStart}
                onChange={(e) => setSendWindowStart(e.target.value)}
                className="rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm focus:border-[#FF6B35] focus:outline-none"
              />
              <input
                type="time"
                value={sendWindowEnd}
                onChange={(e) => setSendWindowEnd(e.target.value)}
                className="rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm focus:border-[#FF6B35] focus:outline-none"
              />
            </div>

            {activeBroadcast ? (
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleSendBroadcast}
                  disabled={sendBroadcastMutation.isPending}
                  className="rounded-lg border border-[#0F766E] px-4 py-2 text-sm font-medium text-[#0F766E] disabled:opacity-50"
                >
                  Send
                </button>
                <button
                  type="button"
                  onClick={() => handleStatusAction('pause')}
                  className="rounded-lg border border-[#E2E8F0] px-4 py-2 text-sm text-[#334155]"
                >
                  Pause
                </button>
                <button
                  type="button"
                  onClick={() => handleStatusAction('resume')}
                  className="rounded-lg border border-[#E2E8F0] px-4 py-2 text-sm text-[#334155]"
                >
                  Resume
                </button>
                <button
                  type="button"
                  onClick={() => handleStatusAction('cancel')}
                  className="rounded-lg border border-[#FCA5A5] px-4 py-2 text-sm text-[#B91C1C]"
                >
                  Cancel
                </button>
              </div>
            ) : null}
          </div>

          <div className="rounded-xl border border-[#E2E8F0] bg-white p-5">
            <h2 className="text-lg font-semibold text-[#1E293B]">Metrics</h2>
            {!activeBroadcastId ? (
              <p className="mt-3 text-sm text-[#64748B]">Select a broadcast to view metrics.</p>
            ) : metrics ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
                <MetricTile label="Status" value={metrics.status} />
                <MetricTile label="Recipients" value={String(metrics.total_recipients)} />
                <MetricTile label="Delivered" value={String(metrics.delivered_count)} />
                <MetricTile label="Opens" value={String(metrics.open_count)} />
                <MetricTile label="Clicks" value={String(metrics.click_count)} />
                <MetricTile label="Bounces" value={String(metrics.bounce_count)} />
              </div>
            ) : (
              <p className="mt-3 text-sm text-[#64748B]">Metrics will appear after processing.</p>
            )}
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="space-y-6">
              <div className="rounded-xl border border-[#E2E8F0] bg-white p-5">
                <h2 className="text-lg font-semibold text-[#1E293B]">Recipient Breakdown</h2>
                {!insights ? (
                  <p className="mt-3 text-sm text-[#64748B]">No breakdown yet.</p>
                ) : (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {Object.entries(insights.status_breakdown).map(([status, count]) => (
                      <MetricTile key={status} label={status} value={String(count)} />
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-[#E2E8F0] bg-white p-5">
                <h2 className="text-lg font-semibold text-[#1E293B]">Recipients</h2>
                {!recipientsData || recipientsData.recipients.length === 0 ? (
                  <p className="mt-3 text-sm text-[#64748B]">No recipients built yet.</p>
                ) : (
                  <div className="mt-3 overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-[#E2E8F0] text-[#64748B]">
                          <th className="px-2 py-2 font-medium">Email</th>
                          <th className="px-2 py-2 font-medium">Status</th>
                          <th className="px-2 py-2 font-medium">Subject</th>
                          <th className="px-2 py-2 font-medium">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recipientsData.recipients.map((recipient) => (
                          <tr
                            key={recipient.recipient_id}
                            className="border-b border-[#F1F5F9] text-[#1E293B]"
                          >
                            <td className="px-2 py-2">{recipient.email}</td>
                            <td className="px-2 py-2">{recipient.status}</td>
                            <td className="px-2 py-2">{recipient.rendered_subject || '—'}</td>
                            <td className="px-2 py-2">
                              <button
                                type="button"
                                onClick={() => setSelectedRecipientId(recipient.recipient_id)}
                                className="rounded-md border border-[#E2E8F0] px-3 py-1 text-xs text-[#334155]"
                              >
                                View
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-[#E2E8F0] bg-white p-5">
                <h2 className="text-lg font-semibold text-[#1E293B]">Recent Activity</h2>
                {!insights || insights.activity.length === 0 ? (
                  <p className="mt-3 text-sm text-[#64748B]">No events recorded yet.</p>
                ) : (
                  <div className="mt-3 space-y-3">
                    {insights.activity.slice(0, 12).map((item, index) => (
                      <div
                        key={`${item.provider_event_id || item.occurred_at}-${index}`}
                        className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-3"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="text-sm font-medium text-[#1E293B]">
                            {item.event_type}
                          </div>
                          <div className="text-xs text-[#64748B]">
                            {new Date(item.occurred_at).toLocaleString()}
                          </div>
                        </div>
                        <div className="mt-1 text-sm text-[#334155]">{item.recipient_email}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-[#E2E8F0] bg-white p-5">
              <h2 className="text-lg font-semibold text-[#1E293B]">Recipient Detail</h2>
              {!recipientDetail ? (
                <p className="mt-3 text-sm text-[#64748B]">
                  Select a recipient to inspect delivery state and activity.
                </p>
              ) : (
                <div className="mt-4 space-y-4">
                  <div className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-3">
                    <div className="text-sm font-medium text-[#1E293B]">
                      {recipientDetail.email}
                    </div>
                    <div className="mt-1 text-xs text-[#64748B]">
                      {recipientDetail.status} · send {recipientDetail.send_status || 'n/a'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wide text-[#64748B]">Subject</div>
                    <div className="mt-1 rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm text-[#1E293B]">
                      {recipientDetail.rendered_subject || '—'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wide text-[#64748B]">Body</div>
                    <div
                      className="prose prose-sm mt-1 max-w-none rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-3"
                      dangerouslySetInnerHTML={{
                        __html: recipientDetail.rendered_body || '<p>—</p>',
                      }}
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleRecipientAction('retry')}
                      className="rounded-lg border border-[#0F766E] px-3 py-2 text-sm text-[#0F766E]"
                    >
                      Retry recipient
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRecipientAction('cancel')}
                      className="rounded-lg border border-[#FCA5A5] px-3 py-2 text-sm text-[#B91C1C]"
                    >
                      Cancel recipient
                    </button>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wide text-[#64748B]">Events</div>
                    {recipientDetail.events.length === 0 ? (
                      <p className="mt-2 text-sm text-[#64748B]">No events yet.</p>
                    ) : (
                      <div className="mt-2 space-y-2">
                        {recipientDetail.events.map((event, index) => (
                          <div
                            key={`${event.event_type}-${event.occurred_at}-${index}`}
                            className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-3"
                          >
                            <div className="text-sm font-medium text-[#1E293B]">
                              {event.event_type}
                            </div>
                            <div className="mt-1 text-xs text-[#64748B]">
                              {new Date(event.occurred_at).toLocaleString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-3">
      <div className="text-xs text-[#64748B]">{label}</div>
      <div className="mt-1 text-base font-semibold text-[#1E293B]">{value}</div>
    </div>
  );
}
