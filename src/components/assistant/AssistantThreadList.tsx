import type { AssistantThread } from '@/lib/types';

interface AssistantThreadListProps {
  threads: AssistantThread[];
  activeThreadId: string | null;
  isLoading: boolean;
  error?: string | null;
  compact?: boolean;
  onSelectThread: (threadId: string) => void;
  onCreateThread: () => void;
  onRetry?: () => void;
}

export function AssistantThreadList({
  threads,
  activeThreadId,
  isLoading,
  error = null,
  compact = false,
  onSelectThread,
  onCreateThread,
  onRetry,
}: AssistantThreadListProps) {
  return (
    <div
      className={`flex flex-col bg-white ${compact ? 'h-auto rounded-xl border border-[#E2E8F0]' : 'h-full border-r border-[#E2E8F0]'}`}
    >
      <div className="border-b border-[#E2E8F0] p-4">
        <h2 className="mb-1 text-base font-semibold text-[#1E293B]">Assistant</h2>
        <p className="mb-3 text-sm text-[#64748B]">
          Ask questions, review proposed changes, and execute approved actions.
        </p>
        <button
          onClick={onCreateThread}
          className="w-full rounded-lg bg-[#FF6B35] px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-[#E85A2A]"
        >
          New conversation
        </button>
      </div>

      <div className={`${compact ? 'max-h-64 overflow-y-auto p-2' : 'flex-1 overflow-y-auto p-2'}`}>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="animate-pulse rounded-lg border border-[#E2E8F0] p-3">
                <div className="mb-2 h-4 w-2/3 rounded bg-[#E2E8F0]" />
                <div className="h-3 w-1/3 rounded bg-[#E2E8F0]" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="space-y-3 rounded-lg border border-[#FECACA] bg-[#FEF2F2] p-4">
            <div className="text-sm font-medium text-[#991B1B]">Failed to load conversations</div>
            <div className="text-sm text-[#B91C1C]">{error}</div>
            {onRetry ? (
              <button
                type="button"
                onClick={onRetry}
                className="rounded-lg border border-[#FCA5A5] bg-white px-3 py-2 text-sm font-medium text-[#991B1B]"
              >
                Retry
              </button>
            ) : null}
          </div>
        ) : threads.length === 0 ? (
          <div className="rounded-lg border border-dashed border-[#CBD5E1] p-4 text-sm text-[#64748B]">
            Start your first assistant conversation.
          </div>
        ) : (
          <div className="space-y-2">
            {threads.map((thread) => (
              <button
                key={thread.id}
                onClick={() => onSelectThread(thread.id)}
                className={`w-full rounded-lg border px-3 py-3 text-left transition-colors ${
                  activeThreadId === thread.id
                    ? 'border-[#FF6B35] bg-[#FFF7ED]'
                    : 'border-[#E2E8F0] bg-white hover:bg-[#F8FAFC]'
                }`}
              >
                <div className="mb-1 truncate text-sm font-medium text-[#1E293B]">
                  {thread.title || 'Untitled conversation'}
                </div>
                <div className="text-xs text-[#64748B]">
                  {thread.last_message_at
                    ? new Date(thread.last_message_at).toLocaleString()
                    : 'No messages yet'}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
