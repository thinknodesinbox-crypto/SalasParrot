import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';

import { useEmailAccounts } from '@/lib/hooks/queries';
import {
  useCreateMarketingBroadcast,
  useCreateMarketingList,
  useCreateMarketingTemplate,
  useImportMarketingContactsCSV,
  useMarketingListContacts,
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

type MarketingTab = 'lists' | 'contacts' | 'templates' | 'broadcasts';

const tabs: { id: MarketingTab; label: string; description: string }[] = [
  { id: 'lists', label: 'Lists', description: 'Create lists and review audience size.' },
  { id: 'contacts', label: 'Contacts', description: 'Import CSV contacts into a list.' },
  {
    id: 'templates',
    label: 'Templates',
    description: 'Create reusable templates and personalization settings.',
  },
  {
    id: 'broadcasts',
    label: 'Broadcasts',
    description: 'Create one-off sends and monitor delivery metrics.',
  },
];

function EmailMarketingPage() {
  const { currentWorkspace } = useCurrentWorkspace();
  const workspaceId = currentWorkspace?.id || '';
  const [activeTab, setActiveTab] = useState<MarketingTab>('lists');

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
  const [listSubmitAttempted, setListSubmitAttempted] = useState(false);

  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvPreviewHeaders, setCsvPreviewHeaders] = useState<string[]>([]);
  const [csvPreviewRows, setCsvPreviewRows] = useState<string[][]>([]);
  const [csvDragActive, setCsvDragActive] = useState(false);
  const [importListId, setImportListId] = useState('');
  const [newListNameForImport, setNewListNameForImport] = useState('');
  const [lastImportErrors, setLastImportErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [selectedListId, setSelectedListId] = useState('');
  const [contactsSearch, setContactsSearch] = useState('');
  const [contactsStatus, setContactsStatus] = useState('');
  const [contactsPage, setContactsPage] = useState(1);

  const [templateName, setTemplateName] = useState('');
  const [templateSubject, setTemplateSubject] = useState('');
  const [templateBody, setTemplateBody] = useState('');
  const [templatePersonalizationEnabled, setTemplatePersonalizationEnabled] = useState(false);
  const [templatePersonalizationMode, setTemplatePersonalizationMode] = useState<
    'first_line' | 'full_message'
  >('first_line');
  const [templateSubmitAttempted, setTemplateSubmitAttempted] = useState(false);

  const [broadcastName, setBroadcastName] = useState('');
  const [broadcastListId, setBroadcastListId] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [senderEmailAccountId, setSenderEmailAccountId] = useState('');
  const [timezoneOverride, setTimezoneOverride] = useState('');
  const [broadcastSubmitAttempted, setBroadcastSubmitAttempted] = useState(false);
  const [activeBroadcastId, setActiveBroadcastId] = useState('');
  const { data: metrics, refetch: refetchMetrics } =
    useMarketingBroadcastMetrics(activeBroadcastId);
  const { data: listContactsData, isLoading: listContactsLoading } = useMarketingListContacts(
    selectedListId || undefined,
    {
      q: contactsSearch || undefined,
      membership_status: contactsStatus || undefined,
      page: contactsPage,
      page_size: 25,
    }
  );

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
  const contacts = listContactsData?.contacts || [];
  const contactsTotal = listContactsData?.total || 0;
  const contactsPageSize = listContactsData?.page_size || 25;
  const contactsTotalPages = Math.max(1, Math.ceil(contactsTotal / contactsPageSize));

  useEffect(() => {
    if (!selectedListId && lists.length > 0) {
      setSelectedListId(lists[0].id);
    }
  }, [lists, selectedListId]);

  useEffect(() => {
    if (contactsPage > contactsTotalPages) {
      setContactsPage(contactsTotalPages);
    }
  }, [contactsPage, contactsTotalPages]);

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
      setSelectedListId(created.id);
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
      setSelectedListId(result.list_id);
      setBroadcastListId(result.list_id);
      setLastImportErrors(result.errors || []);
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

  const parseCsvPreview = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = String(event.target?.result || '');
      const lines = text
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);
      if (lines.length === 0) {
        setCsvPreviewHeaders([]);
        setCsvPreviewRows([]);
        return;
      }
      const headers = lines[0].split(',').map((cell) => cell.trim());
      const rows = lines.slice(1, 6).map((line) => line.split(',').map((cell) => cell.trim()));
      setCsvPreviewHeaders(headers);
      setCsvPreviewRows(rows);
    };
    reader.readAsText(file);
  };

  const applySelectedCsvFile = (file: File | null) => {
    setCsvFile(file);
    setLastImportErrors([]);
    if (file) {
      parseCsvPreview(file);
      return;
    }
    setCsvPreviewHeaders([]);
    setCsvPreviewRows([]);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1E293B]">Email Marketing</h1>
        <p className="mt-1 text-sm text-[#64748B]">
          One-off broadcasts with lists, templates, and metrics.
        </p>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        <aside className="rounded-xl border border-[#E2E8F0] bg-white p-3 lg:w-72 lg:flex-shrink-0">
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full rounded-lg px-3 py-2 text-left transition-colors ${
                  activeTab === tab.id
                    ? 'bg-[#FFF7ED] text-[#FF6B35]'
                    : 'text-[#334155] hover:bg-[#F8FAFC]'
                }`}
              >
                <div className="text-sm font-medium">{tab.label}</div>
                <div className="mt-0.5 text-xs text-[#64748B]">{tab.description}</div>
              </button>
            ))}
          </nav>
        </aside>

        <section className="min-w-0 flex-1">
          {activeTab === 'lists' ? (
            <div className="space-y-6">
              <div className="rounded-xl border border-[#E2E8F0] bg-white p-5">
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
              </div>

              <div className="rounded-xl border border-[#E2E8F0] bg-white p-5">
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
                          <th className="px-2 py-2 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {lists.map((list) => (
                          <tr key={list.id} className="border-b border-[#F1F5F9] text-[#1E293B]">
                            <td className="px-2 py-2">{list.name}</td>
                            <td className="px-2 py-2">{list.total_contacts}</td>
                            <td className="px-2 py-2">{list.subscribed_contacts}</td>
                            <td className="px-2 py-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedListId(list.id);
                                  setContactsPage(1);
                                  setContactsSearch('');
                                  setContactsStatus('');
                                }}
                                className="rounded-md border border-[#E2E8F0] px-2 py-1 text-xs text-[#334155] hover:bg-[#F8FAFC]"
                              >
                                View contacts
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
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-[#1E293B]">List Contacts</h2>
                    <p className="text-sm text-[#64748B]">
                      Browse contacts in a list with quick filtering.
                    </p>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-3">
                    <select
                      value={selectedListId}
                      onChange={(e) => {
                        setSelectedListId(e.target.value);
                        setContactsPage(1);
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
                    <input
                      value={contactsSearch}
                      onChange={(e) => {
                        setContactsSearch(e.target.value);
                        setContactsPage(1);
                      }}
                      placeholder="Search name or email"
                      className="rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm focus:border-[#FF6B35] focus:outline-none"
                    />
                    <select
                      value={contactsStatus}
                      onChange={(e) => {
                        setContactsStatus(e.target.value);
                        setContactsPage(1);
                      }}
                      className="rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm focus:border-[#FF6B35] focus:outline-none"
                    >
                      <option value="">All statuses</option>
                      <option value="pending_opt_in">Pending opt-in</option>
                      <option value="subscribed">Subscribed</option>
                      <option value="unsubscribed">Unsubscribed</option>
                    </select>
                  </div>
                </div>

                {!selectedListId ? (
                  <p className="mt-4 text-sm text-[#64748B]">Select a list to view contacts.</p>
                ) : listContactsLoading ? (
                  <p className="mt-4 text-sm text-[#64748B]">Loading contacts...</p>
                ) : contacts.length === 0 ? (
                  <p className="mt-4 text-sm text-[#64748B]">No contacts match this filter.</p>
                ) : (
                  <>
                    <div className="mt-4 overflow-x-auto">
                      <table className="min-w-full text-left text-sm">
                        <thead>
                          <tr className="border-b border-[#E2E8F0] text-[#64748B]">
                            <th className="px-2 py-2 font-medium">Name</th>
                            <th className="px-2 py-2 font-medium">Email</th>
                            <th className="px-2 py-2 font-medium">Membership</th>
                            <th className="px-2 py-2 font-medium">Source</th>
                            <th className="px-2 py-2 font-medium">Timezone</th>
                            <th className="px-2 py-2 font-medium">Added</th>
                          </tr>
                        </thead>
                        <tbody>
                          {contacts.map((contact) => (
                            <tr
                              key={contact.contact_id}
                              className="border-b border-[#F1F5F9] text-[#1E293B]"
                            >
                              <td className="px-2 py-2">
                                {(contact.first_name || '') + ' ' + (contact.last_name || '')}
                              </td>
                              <td className="px-2 py-2">{contact.email}</td>
                              <td className="px-2 py-2">{contact.membership_status}</td>
                              <td className="px-2 py-2">{contact.source}</td>
                              <td className="px-2 py-2">{contact.timezone || '—'}</td>
                              <td className="px-2 py-2">
                                {new Date(contact.created_at).toLocaleDateString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-sm text-[#64748B]">
                      <span>
                        Showing {(contactsPage - 1) * contactsPageSize + 1}-
                        {Math.min(contactsPage * contactsPageSize, contactsTotal)} of{' '}
                        {contactsTotal}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setContactsPage((prev) => Math.max(1, prev - 1))}
                          disabled={contactsPage <= 1}
                          className="rounded-md border border-[#E2E8F0] px-3 py-1 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Prev
                        </button>
                        <span>
                          Page {contactsPage} / {contactsTotalPages}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setContactsPage((prev) => Math.min(contactsTotalPages, prev + 1))
                          }
                          disabled={contactsPage >= contactsTotalPages}
                          className="rounded-md border border-[#E2E8F0] px-3 py-1 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : null}

          {activeTab === 'contacts' ? (
            <div className="space-y-6">
              <div className="rounded-xl border border-[#E2E8F0] bg-white p-5">
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
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={(e) => applySelectedCsvFile(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                  <div
                    onDragEnter={(e) => {
                      e.preventDefault();
                      setCsvDragActive(true);
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setCsvDragActive(true);
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      setCsvDragActive(false);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      setCsvDragActive(false);
                      const file = e.dataTransfer.files?.[0] || null;
                      if (file && file.name.toLowerCase().endsWith('.csv')) {
                        applySelectedCsvFile(file);
                      } else {
                        showErrorToast('Invalid file', 'Please drop a CSV file.');
                      }
                    }}
                    className={`rounded-xl border-2 border-dashed p-6 text-center transition-colors ${
                      csvDragActive
                        ? 'border-[#FF6B35] bg-[#FFF7ED]'
                        : 'border-[#CBD5E1] bg-[#F8FAFC]'
                    }`}
                  >
                    <p className="text-sm font-medium text-[#1E293B]">Drop CSV here</p>
                    <p className="mt-1 text-xs text-[#64748B]">
                      or click to choose a file from your computer
                    </p>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="mt-3 rounded-lg border border-[#FF6B35] px-4 py-2 text-sm font-medium text-[#FF6B35] hover:bg-[#FFF7ED]"
                    >
                      Select CSV File
                    </button>
                    {csvFile ? (
                      <p className="mt-2 text-xs text-[#0F766E]">
                        Selected: {csvFile.name} ({Math.ceil(csvFile.size / 1024)} KB)
                      </p>
                    ) : null}
                  </div>

                  <button
                    type="submit"
                    disabled={!canSubmitImport || importCsvMutation.isPending}
                    className="rounded-lg bg-[#0F766E] px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {importCsvMutation.isPending ? 'Importing...' : 'Import CSV'}
                  </button>
                </form>
              </div>

              <div className="rounded-xl border border-[#E2E8F0] bg-white p-5">
                <h2 className="text-lg font-semibold text-[#1E293B]">CSV Preview</h2>
                {csvPreviewHeaders.length === 0 ? (
                  <p className="mt-3 text-sm text-[#64748B]">
                    Upload a CSV to preview headers and sample rows before import.
                  </p>
                ) : (
                  <div className="mt-3 overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-[#E2E8F0] text-[#64748B]">
                          {csvPreviewHeaders.map((header) => (
                            <th key={header} className="px-2 py-2 font-medium">
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {csvPreviewRows.map((row, rowIndex) => (
                          <tr key={rowIndex} className="border-b border-[#F1F5F9] text-[#1E293B]">
                            {csvPreviewHeaders.map((_, colIndex) => (
                              <td key={`${rowIndex}-${colIndex}`} className="px-2 py-2">
                                {row[colIndex] || '—'}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {lastImportErrors.length > 0 ? (
                  <div className="mt-4 rounded-lg border border-[#FECACA] bg-[#FEF2F2] p-3">
                    <div className="text-sm font-medium text-[#991B1B]">Import warnings</div>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-[#B91C1C]">
                      {lastImportErrors.slice(0, 10).map((error) => (
                        <li key={error}>{error}</li>
                      ))}
                    </ul>
                    {lastImportErrors.length > 10 ? (
                      <p className="mt-2 text-xs text-[#B91C1C]">
                        +{lastImportErrors.length - 10} more warnings.
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}

          {activeTab === 'templates' ? (
            <div className="space-y-6">
              <div className="rounded-xl border border-[#E2E8F0] bg-white p-5">
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
                        setTemplatePersonalizationMode(
                          e.target.value as 'first_line' | 'full_message'
                        )
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
              </div>

              <div className="rounded-xl border border-[#E2E8F0] bg-white p-5">
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
                          <tr
                            key={template.id}
                            className="border-b border-[#F1F5F9] text-[#1E293B]"
                          >
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
              </div>
            </div>
          ) : null}

          {activeTab === 'broadcasts' ? (
            <div className="space-y-6">
              <div className="rounded-xl border border-[#E2E8F0] bg-white p-5">
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
              </div>

              <div className="rounded-xl border border-[#E2E8F0] bg-white p-5">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <h2 className="text-lg font-semibold text-[#1E293B]">
                    Current Broadcast Metrics
                  </h2>
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
              </div>

              <div className="rounded-xl border border-[#E2E8F0] bg-white p-5">
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
                          <tr
                            key={broadcast.id}
                            className="border-b border-[#F1F5F9] text-[#1E293B]"
                          >
                            <td className="px-2 py-2">{broadcast.name}</td>
                            <td className="px-2 py-2">{broadcast.status}</td>
                            <td className="px-2 py-2">{broadcast.total_recipients}</td>
                            <td className="px-2 py-2">
                              {new Date(broadcast.created_at).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </section>
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
