import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';

import { useEmailAccounts } from '@/lib/hooks/queries';
import {
  useCreateMarketingBroadcast,
  useCreateMarketingList,
  useCreateMarketingTemplate,
  useImportMarketingContactsCSV,
  useMarketingBroadcastMetrics,
  useMarketingBroadcasts,
  useMarketingLists,
  useMarketingTemplates,
  useSendMarketingBroadcast,
} from '@/lib/hooks/queries/useEmailMarketing';
import { showErrorToast, showSuccessToast } from '@/lib/toast';
import { useCurrentWorkspace } from '@/lib/workspace';

export const Route = createFileRoute('/dashboard/email-marketing')({
  component: EmailMarketingPage,
});

function EmailMarketingPage() {
  const { currentWorkspace } = useCurrentWorkspace();
  const workspaceId = currentWorkspace?.id || '';

  const { data: lists = [], isLoading: listsLoading } = useMarketingLists(workspaceId || undefined);
  const { data: templates = [] } = useMarketingTemplates(workspaceId || undefined);
  const { data: broadcasts = [] } = useMarketingBroadcasts(workspaceId || undefined);
  const { data: emailAccounts = [] } = useEmailAccounts(
    workspaceId ? { workspace_id: workspaceId } : undefined
  );

  const createListMutation = useCreateMarketingList();
  const createTemplateMutation = useCreateMarketingTemplate();
  const importCsvMutation = useImportMarketingContactsCSV();
  const createBroadcastMutation = useCreateMarketingBroadcast();
  const sendBroadcastMutation = useSendMarketingBroadcast();

  const [listName, setListName] = useState('');
  const [listDescription, setListDescription] = useState('');

  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [importListId, setImportListId] = useState('');
  const [newListNameForImport, setNewListNameForImport] = useState('');

  const [templateName, setTemplateName] = useState('');
  const [templateSubject, setTemplateSubject] = useState('');
  const [templateBody, setTemplateBody] = useState('');
  const [templatePersonalizationEnabled, setTemplatePersonalizationEnabled] = useState(false);
  const [templatePersonalizationMode, setTemplatePersonalizationMode] = useState<
    'first_line' | 'full_message'
  >('first_line');

  const [broadcastName, setBroadcastName] = useState('');
  const [broadcastListId, setBroadcastListId] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [senderEmailAccountId, setSenderEmailAccountId] = useState('');
  const [timezoneOverride, setTimezoneOverride] = useState('');

  const [activeBroadcastId, setActiveBroadcastId] = useState('');
  const [listSubmitAttempted, setListSubmitAttempted] = useState(false);
  const [templateSubmitAttempted, setTemplateSubmitAttempted] = useState(false);
  const [broadcastSubmitAttempted, setBroadcastSubmitAttempted] = useState(false);
  const { data: metrics, refetch: refetchMetrics } =
    useMarketingBroadcastMetrics(activeBroadcastId);

  const canSubmitCreateList = workspaceId && listName.trim().length > 0;
  const canSubmitImport =
    workspaceId &&
    csvFile &&
    ((importListId && !newListNameForImport.trim()) ||
      (!importListId && newListNameForImport.trim().length > 0));
  const canCreateTemplate =
    workspaceId && templateName.trim() && templateSubject.trim() && templateBody.trim();
  const canCreateBroadcast =
    workspaceId && broadcastName.trim() && broadcastListId && templateId && senderEmailAccountId;

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    setListSubmitAttempted(true);
    if (!canSubmitCreateList) return;
    try {
      const created = await createListMutation.mutateAsync({
        workspace_id: workspaceId,
        name: listName.trim(),
        description: listDescription.trim() || undefined,
      });
      setListName('');
      setListDescription('');
      setImportListId(created.id);
      setBroadcastListId(created.id);
      showSuccessToast('List created', `"${created.name}" is ready for import.`);
    } catch (error) {
      showErrorToast('Failed to create list', error instanceof Error ? error.message : undefined);
    }
  };

  const handleImportCSV = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmitImport || !csvFile) return;
    try {
      const result = await importCsvMutation.mutateAsync({
        workspace_id: workspaceId,
        file: csvFile,
        list_id: importListId || undefined,
        list_name: newListNameForImport.trim() || undefined,
      });
      setCsvFile(null);
      setNewListNameForImport('');
      setImportListId(result.list_id);
      setBroadcastListId(result.list_id);
      showSuccessToast(
        'Contacts imported',
        `${result.created_contacts} new, ${result.updated_contacts} updated, ${result.skipped} skipped.`
      );
    } catch (error) {
      showErrorToast('CSV import failed', error instanceof Error ? error.message : undefined);
    }
  };

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    setTemplateSubmitAttempted(true);
    if (!canCreateTemplate) return;
    try {
      const created = await createTemplateMutation.mutateAsync({
        workspace_id: workspaceId,
        name: templateName.trim(),
        subject_template: templateSubject.trim(),
        body_template: templateBody,
        personalization_enabled: templatePersonalizationEnabled,
        personalization_mode: templatePersonalizationMode,
      });
      setTemplateName('');
      setTemplateSubject('');
      setTemplateBody('');
      setTemplateId(created.id);
      showSuccessToast('Template created', `"${created.name}" is ready for broadcasts.`);
    } catch (error) {
      showErrorToast(
        'Failed to create template',
        error instanceof Error ? error.message : undefined
      );
    }
  };

  const handleCreateBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    setBroadcastSubmitAttempted(true);
    if (!canCreateBroadcast) return;
    try {
      const created = await createBroadcastMutation.mutateAsync({
        workspace_id: workspaceId,
        list_id: broadcastListId,
        template_id: templateId,
        sender_email_account_id: senderEmailAccountId,
        name: broadcastName.trim(),
        timezone_override: timezoneOverride.trim() || undefined,
      });
      setActiveBroadcastId(created.id);
      showSuccessToast('Broadcast created', `"${created.name}" is ready to send.`);
    } catch (error) {
      showErrorToast(
        'Failed to create broadcast',
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

  if (!workspaceId) {
    return (
      <div className="rounded-xl border border-[#E2E8F0] bg-white p-6">
        <h1 className="text-xl font-semibold text-[#1E293B]">Email Marketing</h1>
        <p className="mt-2 text-sm text-[#64748B]">
          Select a workspace to start configuring email marketing.
        </p>
      </div>
    );
  }

  const selectedTemplate = templates.find((template) => template.id === templateId) || null;
  const previewReplacements: Record<string, string> = {
    firstName: 'Alex',
    lastName: 'Morgan',
    company: 'Acme Inc',
  };
  const renderPreview = (value: string) => {
    let rendered = value || '';
    Object.entries(previewReplacements).forEach(([key, replacement]) => {
      rendered = rendered.split(`{{${key}}}`).join(replacement);
    });
    return rendered;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1E293B]">Email Marketing</h1>
        <p className="mt-1 text-sm text-[#64748B]">
          V1 operator console for lists, templates, imports, and one-off broadcasts.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-[#E2E8F0] bg-white p-5">
          <h2 className="text-lg font-semibold text-[#1E293B]">Create List</h2>
          <form className="mt-4 space-y-3" onSubmit={handleCreateList}>
            <input
              value={listName}
              onChange={(e) => setListName(e.target.value)}
              placeholder="List name"
              className="w-full rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm focus:border-[#FF6B35] focus:outline-none"
            />
            <textarea
              value={listDescription}
              onChange={(e) => setListDescription(e.target.value)}
              placeholder="Description (optional)"
              rows={3}
              className="w-full rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm focus:border-[#FF6B35] focus:outline-none"
            />
            <button
              type="submit"
              disabled={!canSubmitCreateList || createListMutation.isPending}
              className="rounded-lg bg-[#FF6B35] px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {createListMutation.isPending ? 'Creating...' : 'Create List'}
            </button>
            {listSubmitAttempted && !canSubmitCreateList ? (
              <p className="text-xs text-[#B91C1C]">List name is required.</p>
            ) : null}
          </form>
        </section>

        <section className="rounded-xl border border-[#E2E8F0] bg-white p-5">
          <h2 className="text-lg font-semibold text-[#1E293B]">Import Contacts (CSV)</h2>
          <form className="mt-4 space-y-3" onSubmit={handleImportCSV}>
            <select
              value={importListId}
              onChange={(e) => {
                setImportListId(e.target.value);
                if (e.target.value) setNewListNameForImport('');
              }}
              className="w-full rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm focus:border-[#FF6B35] focus:outline-none"
            >
              <option value="">Select existing list</option>
              {lists.map((list) => (
                <option key={list.id} value={list.id}>
                  {list.name}
                </option>
              ))}
            </select>
            <input
              value={newListNameForImport}
              onChange={(e) => {
                setNewListNameForImport(e.target.value);
                if (e.target.value.trim()) setImportListId('');
              }}
              placeholder="Or create list by name"
              className="w-full rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm focus:border-[#FF6B35] focus:outline-none"
            />
            <input
              type="file"
              accept=".csv"
              onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
              className="w-full rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={!canSubmitImport || importCsvMutation.isPending}
              className="rounded-lg bg-[#0F766E] px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {importCsvMutation.isPending ? 'Importing...' : 'Import CSV'}
            </button>
          </form>
        </section>
      </div>

      <section className="rounded-xl border border-[#E2E8F0] bg-white p-5">
        <h2 className="text-lg font-semibold text-[#1E293B]">Create Template</h2>
        <form className="mt-4 space-y-3" onSubmit={handleCreateTemplate}>
          <input
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            placeholder="Template name"
            className="w-full rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm focus:border-[#FF6B35] focus:outline-none"
          />
          <input
            value={templateSubject}
            onChange={(e) => setTemplateSubject(e.target.value)}
            placeholder="Email subject template"
            className="w-full rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm focus:border-[#FF6B35] focus:outline-none"
          />
          <textarea
            value={templateBody}
            onChange={(e) => setTemplateBody(e.target.value)}
            placeholder="Email body template (HTML supported)"
            rows={6}
            className="w-full rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm focus:border-[#FF6B35] focus:outline-none"
          />
          <div className="flex flex-wrap items-center gap-4">
            <label className="inline-flex items-center gap-2 text-sm text-[#334155]">
              <input
                type="checkbox"
                checked={templatePersonalizationEnabled}
                onChange={(e) => setTemplatePersonalizationEnabled(e.target.checked)}
              />
              Enable personalization
            </label>
            <select
              value={templatePersonalizationMode}
              onChange={(e) =>
                setTemplatePersonalizationMode(e.target.value as 'first_line' | 'full_message')
              }
              disabled={!templatePersonalizationEnabled}
              className="rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm focus:border-[#FF6B35] focus:outline-none disabled:opacity-50"
            >
              <option value="first_line">First line only</option>
              <option value="full_message">Full message</option>
            </select>
            <button
              type="submit"
              disabled={!canCreateTemplate || createTemplateMutation.isPending}
              className="rounded-lg bg-[#FF6B35] px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {createTemplateMutation.isPending ? 'Creating...' : 'Create Template'}
            </button>
            {templateSubmitAttempted && !canCreateTemplate ? (
              <p className="text-xs text-[#B91C1C]">
                Template name, subject, and body are required.
              </p>
            ) : null}
          </div>
        </form>
        {selectedTemplate ? (
          <div className="mt-4 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-3">
            <div className="text-xs font-medium text-[#64748B]">Template Preview</div>
            <div className="mt-2 text-sm text-[#1E293B]">
              <div>
                <span className="font-medium">Subject:</span>{' '}
                {renderPreview(selectedTemplate.subject_template)}
              </div>
              <div className="mt-2 whitespace-pre-wrap">
                <span className="font-medium">Body:</span>{' '}
                {renderPreview(selectedTemplate.body_template)}
              </div>
            </div>
          </div>
        ) : null}
      </section>

      <section className="rounded-xl border border-[#E2E8F0] bg-white p-5">
        <h2 className="text-lg font-semibold text-[#1E293B]">Broadcast</h2>
        <div className="mt-2 text-sm text-[#64748B]">
          Create and send one-off broadcasts within workspace working hours and cap rules.
        </div>
        <form className="mt-4 grid gap-3 md:grid-cols-2" onSubmit={handleCreateBroadcast}>
          <input
            value={broadcastName}
            onChange={(e) => setBroadcastName(e.target.value)}
            placeholder="Broadcast name"
            className="rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm focus:border-[#FF6B35] focus:outline-none"
          />
          <select
            value={broadcastListId}
            onChange={(e) => setBroadcastListId(e.target.value)}
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
            placeholder="Timezone override (optional)"
            className="rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm focus:border-[#FF6B35] focus:outline-none md:col-span-2"
          />
          <div className="flex flex-wrap gap-3 md:col-span-2">
            <button
              type="submit"
              disabled={!canCreateBroadcast || createBroadcastMutation.isPending}
              className="rounded-lg bg-[#FF6B35] px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {createBroadcastMutation.isPending ? 'Creating...' : 'Create Broadcast'}
            </button>
            <button
              type="button"
              onClick={handleSendBroadcast}
              disabled={!activeBroadcastId || sendBroadcastMutation.isPending}
              className="rounded-lg border border-[#0F766E] px-4 py-2 text-sm font-medium text-[#0F766E] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {sendBroadcastMutation.isPending ? 'Sending...' : 'Send Broadcast'}
            </button>
            <button
              type="button"
              onClick={() => refetchMetrics()}
              disabled={!activeBroadcastId}
              className="rounded-lg border border-[#E2E8F0] px-4 py-2 text-sm font-medium text-[#334155] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Refresh Metrics
            </button>
          </div>
          {broadcastSubmitAttempted && !canCreateBroadcast ? (
            <p className="text-xs text-[#B91C1C] md:col-span-2">
              Broadcast name, list, template, and sender account are required.
            </p>
          ) : null}
        </form>
      </section>

      <section className="rounded-xl border border-[#E2E8F0] bg-white p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-[#1E293B]">Current Broadcast Metrics</h2>
          <select
            value={activeBroadcastId}
            onChange={(e) => setActiveBroadcastId(e.target.value)}
            className="w-full rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm focus:border-[#FF6B35] focus:outline-none sm:w-[420px]"
          >
            <option value="">Select broadcast</option>
            {broadcasts.map((broadcast) => (
              <option key={broadcast.id} value={broadcast.id}>
                {broadcast.name} ({broadcast.status})
              </option>
            ))}
          </select>
        </div>

        {!activeBroadcastId ? (
          <p className="mt-4 text-sm text-[#64748B]">Select a broadcast to view metrics.</p>
        ) : metrics ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <MetricTile label="Status" value={metrics.status} />
            <MetricTile label="Recipients" value={String(metrics.total_recipients)} />
            <MetricTile label="Delivered" value={String(metrics.delivered_count)} />
            <MetricTile label="Opens" value={String(metrics.open_count)} />
            <MetricTile label="Clicks" value={String(metrics.click_count)} />
            <MetricTile
              label="Bounces/Complaints"
              value={`${metrics.bounce_count}/${metrics.complaint_count}`}
            />
          </div>
        ) : (
          <p className="mt-4 text-sm text-[#64748B]">
            Metrics will appear after the broadcast is processed.
          </p>
        )}
      </section>

      <section className="rounded-xl border border-[#E2E8F0] bg-white p-5">
        <h2 className="text-lg font-semibold text-[#1E293B]">Lists</h2>
        {listsLoading ? (
          <p className="mt-3 text-sm text-[#64748B]">Loading lists...</p>
        ) : lists.length === 0 ? (
          <p className="mt-3 text-sm text-[#64748B]">No lists yet.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[#E2E8F0] text-[#64748B]">
                  <th className="px-2 py-2 font-medium">Name</th>
                  <th className="px-2 py-2 font-medium">Total</th>
                  <th className="px-2 py-2 font-medium">Subscribed</th>
                </tr>
              </thead>
              <tbody>
                {lists.map((list) => (
                  <tr key={list.id} className="border-b border-[#F1F5F9] text-[#1E293B]">
                    <td className="px-2 py-2">{list.name}</td>
                    <td className="px-2 py-2">{list.total_contacts}</td>
                    <td className="px-2 py-2">{list.subscribed_contacts}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-xl border border-[#E2E8F0] bg-white p-5">
        <h2 className="text-lg font-semibold text-[#1E293B]">Templates</h2>
        {templates.length === 0 ? (
          <p className="mt-3 text-sm text-[#64748B]">No templates yet.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[#E2E8F0] text-[#64748B]">
                  <th className="px-2 py-2 font-medium">Name</th>
                  <th className="px-2 py-2 font-medium">Subject</th>
                  <th className="px-2 py-2 font-medium">Personalization</th>
                </tr>
              </thead>
              <tbody>
                {templates.map((template) => (
                  <tr key={template.id} className="border-b border-[#F1F5F9] text-[#1E293B]">
                    <td className="px-2 py-2">{template.name}</td>
                    <td className="px-2 py-2">{template.subject_template}</td>
                    <td className="px-2 py-2">
                      {template.personalization_enabled
                        ? template.personalization_mode
                        : 'disabled'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-xl border border-[#E2E8F0] bg-white p-5">
        <h2 className="text-lg font-semibold text-[#1E293B]">Broadcasts</h2>
        {broadcasts.length === 0 ? (
          <p className="mt-3 text-sm text-[#64748B]">No broadcasts yet.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[#E2E8F0] text-[#64748B]">
                  <th className="px-2 py-2 font-medium">Name</th>
                  <th className="px-2 py-2 font-medium">Status</th>
                  <th className="px-2 py-2 font-medium">Recipients</th>
                  <th className="px-2 py-2 font-medium">Created</th>
                </tr>
              </thead>
              <tbody>
                {broadcasts.map((broadcast) => (
                  <tr key={broadcast.id} className="border-b border-[#F1F5F9] text-[#1E293B]">
                    <td className="px-2 py-2">{broadcast.name}</td>
                    <td className="px-2 py-2">{broadcast.status}</td>
                    <td className="px-2 py-2">{broadcast.total_recipients}</td>
                    <td className="px-2 py-2">{new Date(broadcast.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
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
