import { Link, createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';

import { useCreateMarketingList, useMarketingLists } from '@/lib/hooks/queries';
import { showErrorToast, showSuccessToast } from '@/lib/toast';
import { useCurrentWorkspace } from '@/lib/workspace';

export const Route = createFileRoute('/dashboard/email-marketing/lists')({
  component: EmailMarketingListsPage,
});

function EmailMarketingListsPage() {
  const { currentWorkspace } = useCurrentWorkspace();
  const workspaceId = currentWorkspace?.id || '';
  const { data: lists = [], isLoading } = useMarketingLists(workspaceId || undefined);
  const createListMutation = useCreateMarketingList();

  const [listName, setListName] = useState('');
  const [listDescription, setListDescription] = useState('');
  const [attempted, setAttempted] = useState(false);

  const canSubmit = workspaceId && listName.trim();

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    setAttempted(true);
    if (!canSubmit) return;
    try {
      const created = await createListMutation.mutateAsync({
        workspace_id: workspaceId,
        name: listName.trim(),
        description: listDescription.trim() || undefined,
      });
      setListName('');
      setListDescription('');
      showSuccessToast('List created', `"${created.name}" is ready.`);
    } catch (error) {
      showErrorToast('Failed to create list', error instanceof Error ? error.message : undefined);
    }
  };

  return (
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
            disabled={!canSubmit || createListMutation.isPending}
            className="rounded-lg bg-[#FF6B35] px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {createListMutation.isPending ? 'Creating...' : 'Create List'}
          </button>
          {attempted && !canSubmit ? (
            <p className="text-xs text-[#B91C1C]">List name is required.</p>
          ) : null}
        </form>
      </div>

      <div className="rounded-xl border border-[#E2E8F0] bg-white p-5">
        <h2 className="text-lg font-semibold text-[#1E293B]">Workspace Lists</h2>
        {isLoading ? (
          <p className="mt-3 text-sm text-[#64748B]">Loading lists...</p>
        ) : lists.length === 0 ? (
          <p className="mt-3 text-sm text-[#64748B]">No lists yet.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[#E2E8F0] text-[#64748B]">
                  <th className="px-2 py-2 font-medium">Name</th>
                  <th className="px-2 py-2 font-medium">Description</th>
                  <th className="px-2 py-2 font-medium">Contacts</th>
                  <th className="px-2 py-2 font-medium">Subscribed</th>
                  <th className="px-2 py-2 font-medium">Open</th>
                </tr>
              </thead>
              <tbody>
                {lists.map((list) => (
                  <tr key={list.id} className="border-b border-[#F1F5F9] text-[#1E293B]">
                    <td className="px-2 py-2">{list.name}</td>
                    <td className="px-2 py-2">{list.description || '—'}</td>
                    <td className="px-2 py-2">{list.total_contacts}</td>
                    <td className="px-2 py-2">{list.subscribed_contacts}</td>
                    <td className="px-2 py-2">
                      <Link
                        to="/dashboard/email-marketing/lists/$listId"
                        params={{ listId: list.id }}
                        className="text-[#FF6B35] hover:underline"
                      >
                        View list
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
