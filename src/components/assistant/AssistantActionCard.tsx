import { useEffect, useState } from 'react';
import type { AssistantAction } from '@/lib/types';

interface AssistantActionCardProps {
  action: AssistantAction;
  onApprove?: (actionId: string, note?: string) => void;
  onReject?: (actionId: string, reason?: string) => void;
  onEdit?: (actionId: string, payload: Record<string, unknown>, message?: string) => void;
  onExecute?: (actionId: string) => void;
  isApproving?: boolean;
  isRejecting?: boolean;
  isEditing?: boolean;
  isExecuting?: boolean;
}

function formatRecord(value: Record<string, unknown>) {
  const entries = Object.entries(value);
  if (entries.length === 0) return 'None';
  return entries
    .map(([key, item]) => `${key}: ${typeof item === 'string' ? item : JSON.stringify(item)}`)
    .join('\n');
}

function isOptionList(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

export function AssistantActionCard({
  action,
  onApprove,
  onReject,
  onEdit,
  onExecute,
  isApproving = false,
  isRejecting = false,
  isEditing = false,
  isExecuting = false,
}: AssistantActionCardProps) {
  const [isEditingOpen, setIsEditingOpen] = useState(false);
  const [editValue, setEditValue] = useState('');

  useEffect(() => {
    setEditValue(JSON.stringify(action.preview.exact_payload || action.payload || {}, null, 2));
  }, [action.id, action.payload, action.preview.exact_payload]);

  const canReview = action.status === 'awaiting_confirmation' || action.status === 'approved';
  const canExecute = action.status === 'approved';
  const pendingOptions = isOptionList((action.target_ref as Record<string, unknown>).options)
    ? ((action.target_ref as Record<string, unknown>).options as string[])
    : [];
  const isPendingTargetSelection = action.status === 'proposed' && pendingOptions.length > 0;
  const targetDisplayEntries = Object.entries(action.target_ref as Record<string, unknown>).filter(
    ([key]) => key !== 'options' && key !== 'target_key'
  );
  const targetDisplay = Object.fromEntries(targetDisplayEntries);

  return (
    <div className="mt-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-[#1E293B]">{action.preview.title}</div>
          <div className="mt-1 text-sm text-[#475569]">{action.preview.summary}</div>
        </div>
        <div className="rounded-full bg-white px-2.5 py-1 text-xs font-medium capitalize text-[#475569]">
          {action.status.replace(/_/g, ' ')}
        </div>
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <div className="rounded-lg border border-[#E2E8F0] bg-white p-3">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#94A3B8]">
            Target
          </div>
          <div className="whitespace-pre-wrap text-sm text-[#1E293B]">
            {formatRecord(targetDisplay)}
          </div>
        </div>
        <div className="rounded-lg border border-[#E2E8F0] bg-white p-3">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#94A3B8]">
            Exact Payload
          </div>
          <div className="whitespace-pre-wrap text-sm text-[#1E293B]">
            {formatRecord(action.preview.exact_payload)}
          </div>
        </div>
      </div>

      {isPendingTargetSelection ? (
        <div className="mt-3 rounded-lg border border-[#FDE68A] bg-[#FFFBEB] p-3">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#B45309]">
            Waiting For Target Selection
          </div>
          <div className="text-sm text-[#92400E]">
            Reply with one of these exact names to continue this action.
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {pendingOptions.map((option) => (
              <span
                key={option}
                className="rounded-full border border-[#FCD34D] bg-white px-3 py-1 text-sm text-[#92400E]"
              >
                {option}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {action.result ? (
        <div className="mt-3 rounded-lg border border-[#D1FAE5] bg-[#ECFDF5] p-3 text-sm text-[#065F46]">
          {formatRecord(action.result)}
        </div>
      ) : null}
      {action.error ? (
        <div className="mt-3 rounded-lg border border-[#FECACA] bg-[#FEF2F2] p-3 text-sm text-[#B91C1C]">
          {action.error}
        </div>
      ) : null}

      {isEditingOpen ? (
        <div className="mt-3 space-y-3 rounded-lg border border-[#E2E8F0] bg-white p-3">
          <textarea
            value={editValue}
            onChange={(event) => setEditValue(event.target.value)}
            className="min-h-[140px] w-full rounded-lg border border-[#CBD5E1] px-3 py-2 text-sm text-[#1E293B] focus:border-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20"
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                try {
                  const nextPayload = JSON.parse(editValue) as Record<string, unknown>;
                  onEdit?.(action.id, nextPayload, 'Action updated from review card.');
                  setIsEditingOpen(false);
                } catch {
                  // Keep UI simple for now; invalid JSON just stays in place until corrected.
                }
              }}
              disabled={isEditing}
              className="rounded-lg bg-[#FF6B35] px-3 py-2 text-sm font-medium text-white disabled:bg-[#CBD5E1]"
            >
              {isEditing ? 'Saving...' : 'Save edits'}
            </button>
            <button
              type="button"
              onClick={() => setIsEditingOpen(false)}
              className="rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-sm font-medium text-[#1E293B]"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-2">
        {isPendingTargetSelection ? null : canReview ? (
          <button
            type="button"
            onClick={() => onApprove?.(action.id)}
            disabled={!onApprove || isApproving}
            className="rounded-lg bg-[#1E293B] px-3 py-2 text-sm font-medium text-white disabled:bg-[#CBD5E1]"
          >
            {isApproving ? 'Approving...' : 'Approve'}
          </button>
        ) : null}
        {canExecute ? (
          <button
            type="button"
            onClick={() => onExecute?.(action.id)}
            disabled={!onExecute || isExecuting}
            className="rounded-lg bg-[#FF6B35] px-3 py-2 text-sm font-medium text-white disabled:bg-[#CBD5E1]"
          >
            {isExecuting ? 'Executing...' : 'Execute'}
          </button>
        ) : null}
        {action.status !== 'executed' &&
        action.status !== 'rejected' &&
        !isPendingTargetSelection ? (
          <button
            type="button"
            onClick={() => setIsEditingOpen((value) => !value)}
            disabled={!onEdit || isEditing}
            className="rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-sm font-medium text-[#1E293B] disabled:bg-[#F1F5F9]"
          >
            Edit
          </button>
        ) : null}
        {action.status !== 'executed' &&
        action.status !== 'rejected' &&
        !isPendingTargetSelection ? (
          <button
            type="button"
            onClick={() => onReject?.(action.id)}
            disabled={!onReject || isRejecting}
            className="rounded-lg border border-[#FCA5A5] bg-white px-3 py-2 text-sm font-medium text-[#B91C1C] disabled:bg-[#F1F5F9]"
          >
            {isRejecting ? 'Rejecting...' : 'Reject'}
          </button>
        ) : null}
      </div>
    </div>
  );
}
