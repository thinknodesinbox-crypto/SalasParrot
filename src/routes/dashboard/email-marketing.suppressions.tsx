import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';

import { useFilteredMarketingSuppressions, useUnsuppressMarketingEmail } from '@/lib/hooks/queries';
import { showErrorToast, showSuccessToast } from '@/lib/toast';
import { useCurrentWorkspace } from '@/lib/workspace';

export const Route = createFileRoute('/dashboard/email-marketing/suppressions')({
  component: EmailMarketingSuppressionsPage,
});

function EmailMarketingSuppressionsPage() {
  const { currentWorkspace } = useCurrentWorkspace();
  const workspaceId = currentWorkspace?.id || '';
  const [search, setSearch] = useState('');
  const [scope, setScope] = useState('');
  const [reason, setReason] = useState('');
  const [activeOnly, setActiveOnly] = useState(true);
  const { data: suppressions = [] } = useFilteredMarketingSuppressions(workspaceId || undefined, {
    q: search || undefined,
    scope: scope || undefined,
    reason: reason || undefined,
    active_only: activeOnly,
  });
  const unsuppressMutation = useUnsuppressMarketingEmail();

  const handleUnsuppress = async (suppressionId: string) => {
    try {
      await unsuppressMutation.mutateAsync(suppressionId);
      showSuccessToast('Suppression removed', 'The address can receive marketing emails again.');
    } catch (error) {
      showErrorToast('Failed to unsuppress', error instanceof Error ? error.message : undefined);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-[#E2E8F0] bg-white p-5">
        <h2 className="text-lg font-semibold text-[#1E293B]">Suppressions</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search email"
            className="rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm focus:border-[#FF6B35] focus:outline-none"
          />
          <select
            value={scope}
            onChange={(e) => setScope(e.target.value)}
            className="rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm focus:border-[#FF6B35] focus:outline-none"
          >
            <option value="">All scopes</option>
            <option value="global">Global</option>
            <option value="list">List</option>
          </select>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm focus:border-[#FF6B35] focus:outline-none"
          >
            <option value="">All reasons</option>
            <option value="unsubscribe">Unsubscribe</option>
            <option value="bounce">Bounce</option>
            <option value="complaint">Complaint</option>
          </select>
          <label className="inline-flex items-center gap-2 rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm text-[#334155]">
            <input
              type="checkbox"
              checked={activeOnly}
              onChange={(e) => setActiveOnly(e.target.checked)}
            />
            Active only
          </label>
        </div>
      </div>

      <div className="rounded-xl border border-[#E2E8F0] bg-white p-5">
        {suppressions.length === 0 ? (
          <p className="text-sm text-[#64748B]">No suppressions recorded for this filter.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[#E2E8F0] text-[#64748B]">
                  <th className="px-2 py-2 font-medium">Email</th>
                  <th className="px-2 py-2 font-medium">Scope</th>
                  <th className="px-2 py-2 font-medium">Reason</th>
                  <th className="px-2 py-2 font-medium">Status</th>
                  <th className="px-2 py-2 font-medium">Created</th>
                  <th className="px-2 py-2 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {suppressions.map((item) => (
                  <tr key={item.id} className="border-b border-[#F1F5F9] text-[#1E293B]">
                    <td className="px-2 py-2">{item.email}</td>
                    <td className="px-2 py-2">{item.scope}</td>
                    <td className="px-2 py-2">{item.reason}</td>
                    <td className="px-2 py-2">{item.is_active ? 'active' : 'inactive'}</td>
                    <td className="px-2 py-2">{new Date(item.created_at).toLocaleString()}</td>
                    <td className="px-2 py-2">
                      <button
                        type="button"
                        onClick={() => handleUnsuppress(item.id)}
                        disabled={!item.is_active || unsuppressMutation.isPending}
                        className="rounded-md border border-[#E2E8F0] px-3 py-1 text-xs text-[#334155] disabled:opacity-50"
                      >
                        Unsuppress
                      </button>
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
