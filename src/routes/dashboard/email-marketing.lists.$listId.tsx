import { Link, createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';

import {
  useBulkUpdateMarketingListContacts,
  useCreateMarketingSegment,
  useDeleteMarketingSegment,
  useEmailAccounts,
  useMarketingListContacts,
  useMarketingLists,
  useMarketingSegments,
  useRemoveMarketingListContact,
  useSendMarketingOptIn,
  useUpdateMarketingListContact,
  useUpdateMarketingList,
  useUpdateMarketingSegment,
} from '@/lib/hooks/queries';
import { api } from '@/lib/api';
import { showErrorToast, showSuccessToast } from '@/lib/toast';
import { useCurrentWorkspace } from '@/lib/workspace';

export const Route = createFileRoute('/dashboard/email-marketing/lists/$listId')({
  component: EmailMarketingListDetailPage,
});

function EmailMarketingListDetailPage() {
  const { listId } = Route.useParams();
  const { currentWorkspace } = useCurrentWorkspace();
  const workspaceId = currentWorkspace?.id || '';
  const { data: lists = [] } = useMarketingLists(workspaceId || undefined);
  const { data: segments = [] } = useMarketingSegments(workspaceId || undefined, listId);
  const { data: emailAccounts = [] } = useEmailAccounts(
    workspaceId ? { workspace_id: workspaceId } : undefined
  );
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
  const [optInSenderId, setOptInSenderId] = useState('');
  const [listName, setListName] = useState('');
  const [listDescription, setListDescription] = useState('');
  const [editingSegmentId, setEditingSegmentId] = useState('');

  const { data, isLoading } = useMarketingListContacts(listId, {
    q: search || undefined,
    membership_status: status || undefined,
    page,
    page_size: 25,
  });
  const updateMutation = useUpdateMarketingListContact();
  const removeMutation = useRemoveMarketingListContact();
  const bulkMutation = useBulkUpdateMarketingListContacts();
  const sendOptInMutation = useSendMarketingOptIn();
  const createSegmentMutation = useCreateMarketingSegment();
  const updateListMutation = useUpdateMarketingList();
  const updateSegmentMutation = useUpdateMarketingSegment();
  const deleteSegmentMutation = useDeleteMarketingSegment();
  const [segmentName, setSegmentName] = useState('');
  const [segmentField, setSegmentField] = useState('attributes.company');
  const [segmentOperator, setSegmentOperator] = useState('contains');
  const [segmentValue, setSegmentValue] = useState('');
  const [segmentPreviewCount, setSegmentPreviewCount] = useState<number | null>(null);

  const selectedList = lists.find((list) => list.id === listId);
  const contacts = data?.contacts || [];
  const total = data?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / (data?.page_size || 25)));

  useEffect(() => {
    if (!selectedList) return;
    setListName(selectedList.name);
    setListDescription(selectedList.description || '');
  }, [selectedList?.id, selectedList?.name, selectedList?.description]);

  const handleStatusChange = async (
    contactId: string,
    nextStatus: 'pending_opt_in' | 'subscribed' | 'unsubscribed'
  ) => {
    try {
      await updateMutation.mutateAsync({ listId, contactId, status: nextStatus });
      showSuccessToast('Membership updated', `Contact marked as ${nextStatus}.`);
    } catch (error) {
      showErrorToast(
        'Failed to update contact',
        error instanceof Error ? error.message : undefined
      );
    }
  };

  const handleRemove = async (contactId: string) => {
    try {
      await removeMutation.mutateAsync({ listId, contactId });
      showSuccessToast('Contact removed', 'The contact was removed from the list.');
    } catch (error) {
      showErrorToast(
        'Failed to remove contact',
        error instanceof Error ? error.message : undefined
      );
    }
  };

  const toggleContact = (contactId: string) => {
    setSelectedContactIds((current) =>
      current.includes(contactId)
        ? current.filter((id) => id !== contactId)
        : [...current, contactId]
    );
  };

  const handleBulkAction = async (
    action: 'subscribe' | 'unsubscribe' | 'reset_pending' | 'remove'
  ) => {
    if (selectedContactIds.length === 0) return;
    try {
      await bulkMutation.mutateAsync({
        listId,
        contactIds: selectedContactIds,
        action,
      });
      setSelectedContactIds([]);
      showSuccessToast('Bulk action applied', `${selectedContactIds.length} contacts updated.`);
    } catch (error) {
      showErrorToast('Bulk action failed', error instanceof Error ? error.message : undefined);
    }
  };

  const handleSendOptIn = async (contactId: string) => {
    if (!optInSenderId) {
      showErrorToast('Sender required', 'Select a sender account for double opt-in emails.');
      return;
    }
    try {
      await sendOptInMutation.mutateAsync({
        workspace_id: workspaceId,
        list_id: listId,
        contact_id: contactId,
        sender_email_account_id: optInSenderId,
      });
      showSuccessToast('Double opt-in sent', 'Confirmation email queued.');
    } catch (error) {
      showErrorToast('Failed to send opt-in', error instanceof Error ? error.message : undefined);
    }
  };

  const handlePreviewSegment = async () => {
    try {
      const response = await api.post('/email-marketing/segments/preview', {
        workspace_id: workspaceId,
        list_id: listId,
        segment_type: 'rule',
        definition: {
          operator: 'all',
          conditions: [
            {
              field: segmentField,
              operator: segmentOperator,
              value: segmentValue,
            },
          ],
        },
      });
      setSegmentPreviewCount(response.data.matched_count || 0);
    } catch (error) {
      showErrorToast('Preview failed', error instanceof Error ? error.message : undefined);
    }
  };

  const handleCreateSegment = async () => {
    try {
      const payload = {
        workspace_id: workspaceId,
        list_id: listId,
        name: segmentName.trim(),
        segment_type: 'rule' as const,
        definition: {
          operator: 'all',
          conditions: [
            {
              field: segmentField,
              operator: segmentOperator,
              value: segmentValue,
            },
          ],
        },
      };
      if (editingSegmentId) {
        await updateSegmentMutation.mutateAsync({
          ...payload,
          segmentId: editingSegmentId,
          is_active: true,
        });
      } else {
        await createSegmentMutation.mutateAsync(payload);
      }
      setEditingSegmentId('');
      setSegmentName('');
      showSuccessToast('Segment created', 'Saved for future broadcasts.');
    } catch (error) {
      showErrorToast('Create segment failed', error instanceof Error ? error.message : undefined);
    }
  };

  const handleSaveList = async () => {
    try {
      await updateListMutation.mutateAsync({
        listId,
        name: listName.trim(),
        description: listDescription.trim() || undefined,
      });
      showSuccessToast('List updated', 'List metadata saved.');
    } catch (error) {
      showErrorToast('Failed to update list', error instanceof Error ? error.message : undefined);
    }
  };

  const handleEditSegment = (segmentId: string) => {
    const segment = segments.find((item) => item.id === segmentId);
    if (!segment) return;
    const definition = segment.definition as {
      conditions?: Array<Record<string, string>>;
    };
    const firstCondition = (definition.conditions || [])[0] || {};
    setEditingSegmentId(segment.id);
    setSegmentName(segment.name);
    setSegmentField(firstCondition.field || 'attributes.company');
    setSegmentOperator(firstCondition.operator || 'contains');
    setSegmentValue(String(firstCondition.value || ''));
  };

  const handleDeleteSegment = async (segmentId: string) => {
    try {
      await deleteSegmentMutation.mutateAsync(segmentId);
      if (editingSegmentId === segmentId) {
        setEditingSegmentId('');
        setSegmentName('');
      }
      showSuccessToast('Segment deleted', 'Segment removed.');
    } catch (error) {
      showErrorToast('Delete segment failed', error instanceof Error ? error.message : undefined);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-[#E2E8F0] bg-white p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-xs uppercase tracking-wide text-[#64748B]">List Detail</div>
            <input
              value={listName}
              onChange={(e) => setListName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[#E2E8F0] px-3 py-2 text-xl font-semibold text-[#1E293B] focus:border-[#FF6B35] focus:outline-none sm:max-w-xl"
            />
            <textarea
              value={listDescription}
              onChange={(e) => setListDescription(e.target.value)}
              rows={2}
              className="mt-2 w-full rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm text-[#64748B] focus:border-[#FF6B35] focus:outline-none sm:max-w-xl"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSaveList}
              disabled={!listName.trim() || updateListMutation.isPending}
              className="rounded-lg bg-[#FF6B35] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              Save list
            </button>
            <Link
              to="/dashboard/email-marketing/lists"
              className="rounded-lg border border-[#E2E8F0] px-4 py-2 text-sm text-[#334155]"
            >
              Back to lists
            </Link>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-[#E2E8F0] bg-white p-5">
        <div className="grid gap-3 md:grid-cols-3">
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search name or email"
            className="rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm focus:border-[#FF6B35] focus:outline-none"
          />
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm focus:border-[#FF6B35] focus:outline-none"
          >
            <option value="">All statuses</option>
            <option value="pending_opt_in">Pending opt-in</option>
            <option value="subscribed">Subscribed</option>
            <option value="unsubscribed">Unsubscribed</option>
          </select>
          <div className="rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm text-[#64748B]">
            {total} contacts
          </div>
        </div>

        <div className="rounded-xl border border-[#E2E8F0] bg-white p-5">
          <h2 className="text-lg font-semibold text-[#1E293B]">Segments</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <input
              value={segmentName}
              onChange={(e) => setSegmentName(e.target.value)}
              placeholder="Segment name"
              className="rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm focus:border-[#FF6B35] focus:outline-none"
            />
            <input
              value={segmentValue}
              onChange={(e) => setSegmentValue(e.target.value)}
              placeholder="Segment value"
              className="rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm focus:border-[#FF6B35] focus:outline-none"
            />
            <select
              value={segmentField}
              onChange={(e) => setSegmentField(e.target.value)}
              className="rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm focus:border-[#FF6B35] focus:outline-none"
            >
              <option value="attributes.company">Company</option>
              <option value="attributes.industry">Industry</option>
              <option value="timezone">Timezone</option>
              <option value="source">Source</option>
            </select>
            <select
              value={segmentOperator}
              onChange={(e) => setSegmentOperator(e.target.value)}
              className="rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm focus:border-[#FF6B35] focus:outline-none"
            >
              <option value="contains">Contains</option>
              <option value="eq">Equals</option>
              <option value="neq">Not equal</option>
            </select>
          </div>
          <div className="mt-3 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handlePreviewSegment}
              className="rounded-lg border border-[#E2E8F0] px-4 py-2 text-sm text-[#334155]"
            >
              Preview Segment
            </button>
            <button
              type="button"
              onClick={handleCreateSegment}
              disabled={
                !segmentName.trim() ||
                !segmentValue.trim() ||
                createSegmentMutation.isPending ||
                updateSegmentMutation.isPending
              }
              className="rounded-lg bg-[#FF6B35] px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {editingSegmentId ? 'Update Segment' : 'Save Segment'}
            </button>
            {segmentPreviewCount !== null ? (
              <div className="rounded-lg border border-[#E2E8F0] px-4 py-2 text-sm text-[#64748B]">
                Preview matches: {segmentPreviewCount}
              </div>
            ) : null}
          </div>
          {segments.length > 0 ? (
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[#E2E8F0] text-[#64748B]">
                    <th className="px-2 py-2 font-medium">Name</th>
                    <th className="px-2 py-2 font-medium">Type</th>
                    <th className="px-2 py-2 font-medium">Created</th>
                    <th className="px-2 py-2 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {segments.map((segment) => (
                    <tr key={segment.id} className="border-b border-[#F1F5F9] text-[#1E293B]">
                      <td className="px-2 py-2">{segment.name}</td>
                      <td className="px-2 py-2">{segment.segment_type}</td>
                      <td className="px-2 py-2">{new Date(segment.created_at).toLocaleString()}</td>
                      <td className="px-2 py-2">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleEditSegment(segment.id)}
                            className="rounded-md border border-[#E2E8F0] px-2 py-1 text-xs text-[#334155]"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteSegment(segment.id)}
                            className="rounded-md border border-[#FCA5A5] px-2 py-1 text-xs text-[#B91C1C]"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <select
            value={optInSenderId}
            onChange={(e) => setOptInSenderId(e.target.value)}
            className="rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm focus:border-[#FF6B35] focus:outline-none"
          >
            <option value="">Opt-in sender</option>
            {emailAccounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.email_address}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => handleBulkAction('subscribe')}
            disabled={selectedContactIds.length === 0 || bulkMutation.isPending}
            className="rounded-md border border-[#0F766E] px-3 py-1 text-xs text-[#0F766E] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Bulk subscribe
          </button>
          <button
            type="button"
            onClick={() => handleBulkAction('unsubscribe')}
            disabled={selectedContactIds.length === 0 || bulkMutation.isPending}
            className="rounded-md border border-[#F59E0B] px-3 py-1 text-xs text-[#B45309] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Bulk unsubscribe
          </button>
          <button
            type="button"
            onClick={() => handleBulkAction('reset_pending')}
            disabled={selectedContactIds.length === 0 || bulkMutation.isPending}
            className="rounded-md border border-[#E2E8F0] px-3 py-1 text-xs text-[#334155] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Reset pending
          </button>
          <button
            type="button"
            onClick={() => handleBulkAction('remove')}
            disabled={selectedContactIds.length === 0 || bulkMutation.isPending}
            className="rounded-md border border-[#FCA5A5] px-3 py-1 text-xs text-[#B91C1C] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Remove selected
          </button>
        </div>

        {isLoading ? (
          <p className="mt-4 text-sm text-[#64748B]">Loading contacts...</p>
        ) : contacts.length === 0 ? (
          <p className="mt-4 text-sm text-[#64748B]">No contacts match this view.</p>
        ) : (
          <>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[#E2E8F0] text-[#64748B]">
                    <th className="px-2 py-2 font-medium">Select</th>
                    <th className="px-2 py-2 font-medium">Name</th>
                    <th className="px-2 py-2 font-medium">Email</th>
                    <th className="px-2 py-2 font-medium">Membership</th>
                    <th className="px-2 py-2 font-medium">Source</th>
                    <th className="px-2 py-2 font-medium">Timezone</th>
                    <th className="px-2 py-2 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {contacts.map((contact) => (
                    <tr
                      key={contact.contact_id}
                      className="border-b border-[#F1F5F9] text-[#1E293B]"
                    >
                      <td className="px-2 py-2">
                        <input
                          type="checkbox"
                          checked={selectedContactIds.includes(contact.contact_id)}
                          onChange={() => toggleContact(contact.contact_id)}
                        />
                      </td>
                      <td className="px-2 py-2">
                        {[contact.first_name, contact.last_name].filter(Boolean).join(' ') || '—'}
                      </td>
                      <td className="px-2 py-2">{contact.email}</td>
                      <td className="px-2 py-2">{contact.membership_status}</td>
                      <td className="px-2 py-2">{contact.source}</td>
                      <td className="px-2 py-2">{contact.timezone || '—'}</td>
                      <td className="px-2 py-2">
                        <div className="flex flex-wrap gap-2">
                          <Link
                            to="/dashboard/email-marketing/contacts/$contactId"
                            params={{ contactId: contact.contact_id }}
                            className="rounded-md border border-[#CBD5E1] px-2 py-1 text-xs text-[#334155]"
                          >
                            View
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleStatusChange(contact.contact_id, 'subscribed')}
                            className="rounded-md border border-[#0F766E] px-2 py-1 text-xs text-[#0F766E]"
                          >
                            Subscribe
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStatusChange(contact.contact_id, 'unsubscribed')}
                            className="rounded-md border border-[#F59E0B] px-2 py-1 text-xs text-[#B45309]"
                          >
                            Unsubscribe
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStatusChange(contact.contact_id, 'pending_opt_in')}
                            className="rounded-md border border-[#E2E8F0] px-2 py-1 text-xs text-[#334155]"
                          >
                            Reset
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemove(contact.contact_id)}
                            className="rounded-md border border-[#FCA5A5] px-2 py-1 text-xs text-[#B91C1C]"
                          >
                            Remove
                          </button>
                          {contact.membership_status === 'pending_opt_in' ? (
                            <button
                              type="button"
                              onClick={() => handleSendOptIn(contact.contact_id)}
                              className="rounded-md border border-[#3B82F6] px-2 py-1 text-xs text-[#1D4ED8]"
                            >
                              Send opt-in
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex items-center justify-between text-sm text-[#64748B]">
              <span>
                Page {page} / {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  disabled={page <= 1}
                  className="rounded-md border border-[#E2E8F0] px-3 py-1 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Prev
                </button>
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                  disabled={page >= totalPages}
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
  );
}
