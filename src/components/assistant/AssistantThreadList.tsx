import type { AssistantThread } from '@/lib/types';

interface AssistantThreadListProps {
  threads: AssistantThread[];
  activeThreadId: string | null;
  isLoading: boolean;
  error?: string | null;
  compact?: boolean;
  variant?: 'drawer' | 'page';
  onSelectThread: (threadId: string) => void;
  onSelectNewThread?: () => void;
  onCreateThread: () => void;
  onRetry?: () => void;
}

export function AssistantThreadList({
  threads,
  activeThreadId,
  isLoading,
  error = null,
  compact = false,
  variant = 'drawer',
  onSelectThread,
  onSelectNewThread,
  onCreateThread,
  onRetry,
}: AssistantThreadListProps) {
  const isPage = variant === 'page';

  return (
    <div
      className={`flex flex-col bg-white ${
        compact
          ? 'h-auto rounded-xl border border-[#E2E8F0]'
          : isPage
            ? 'h-full rounded-[28px] border border-[#E2E8F0] shadow-[0_24px_60px_rgba(15,23,42,0.06)]'
            : 'h-full border-r border-[#E2E8F0]'
      }`}
    >
      <div className={`border-b border-[#E2E8F0] ${isPage ? 'p-5' : 'p-4'}`}>
        <h2 className="text-base font-semibold text-[#0F172A]">
          {isPage ? 'Conversations' : 'Assistant'}
        </h2>
        <p className="mt-1 text-sm text-[#64748B]">
          {isPage
            ? 'Keep answers, context, and approved actions together.'
            : 'Ask questions, review proposed changes, and execute approved actions.'}
        </p>
        {!isPage ? (
          <button
            onClick={onCreateThread}
            className="mt-4 w-full rounded-lg bg-[#FF6B35] px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-[#E85A2A]"
          >
            New conversation
          </button>
        ) : null}
      </div>

      <div
        className={`${
          compact ? 'max-h-64 overflow-y-auto' : 'flex-1 overflow-y-auto'
        } ${isPage ? 'p-3' : 'p-2'}`}
      >
        {isPage && onSelectNewThread ? (
          <button
            type="button"
            onClick={onSelectNewThread}
            className={`mb-2 w-full rounded-2xl border px-4 py-4 text-left transition-colors ${
              activeThreadId === null
                ? 'border-[#CBD5E1] bg-[#0F172A] text-white shadow-[0_12px_28px_rgba(15,23,42,0.18)]'
                : 'border-[#E2E8F0] bg-[#F8FAFC] text-[#0F172A] hover:border-[#CBD5E1] hover:bg-white'
            }`}
          >
            <div
              className={`text-xs font-semibold uppercase tracking-[0.22em] ${
                activeThreadId === null ? 'text-white/55' : 'text-[#94A3B8]'
              }`}
            >
              New
            </div>
            <div className="mt-2 text-sm font-medium">Start a fresh conversation</div>
          </button>
        ) : null}

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className={`animate-pulse border border-[#E2E8F0] ${
                  isPage ? 'rounded-2xl p-4' : 'rounded-lg p-3'
                }`}
              >
                <div className="mb-2 h-4 w-2/3 rounded bg-[#E2E8F0]" />
                <div className="h-3 w-1/3 rounded bg-[#E2E8F0]" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div
            className={`space-y-3 border border-[#FECACA] bg-[#FEF2F2] ${
              isPage ? 'rounded-2xl p-5' : 'rounded-lg p-4'
            }`}
          >
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
          <div
            className={`border border-dashed border-[#CBD5E1] text-sm text-[#64748B] ${
              isPage ? 'rounded-2xl p-5' : 'rounded-lg p-4'
            }`}
          >
            Start your first assistant conversation.
          </div>
        ) : (
          <div className="space-y-2">
            {threads.map((thread) => {
              const isActive = activeThreadId === thread.id;

              return (
                <button
                  key={thread.id}
                  onClick={() => onSelectThread(thread.id)}
                  className={`w-full border text-left transition-colors ${
                    isPage
                      ? isActive
                        ? 'rounded-2xl border-[#CBD5E1] bg-[#0F172A] text-white shadow-[0_12px_28px_rgba(15,23,42,0.18)]'
                        : 'rounded-2xl border-[#E2E8F0] bg-[#F8FAFC] hover:border-[#CBD5E1] hover:bg-white'
                      : isActive
                        ? 'rounded-lg border-[#FF6B35] bg-[#FFF7ED]'
                        : 'rounded-lg border-[#E2E8F0] bg-white hover:bg-[#F8FAFC]'
                  }`}
                >
                  <div
                    className={`mb-1 truncate text-sm font-medium ${
                      isPage ? 'px-4 pt-4' : 'px-3 pt-3'
                    } ${isActive && isPage ? 'text-white' : 'text-[#1E293B]'}`}
                  >
                    {thread.title || 'Untitled conversation'}
                  </div>
                  <div
                    className={`text-xs ${
                      isPage ? 'px-4 pb-4' : 'px-3 pb-3'
                    } ${isActive && isPage ? 'text-[#CBD5E1]' : 'text-[#64748B]'}`}
                  >
                    {thread.last_message_at
                      ? new Date(thread.last_message_at).toLocaleString()
                      : 'No messages yet'}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
