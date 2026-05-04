import { useEffect, useRef } from 'react';
import type { AssistantAction, AssistantMessage } from '@/lib/types';
import { AssistantActionCard } from './AssistantActionCard';
import { AssistantInsightCard } from './AssistantInsightCard';

function humanizeAssistantError(message: string | null | undefined) {
  const cleaned = message?.trim();
  if (!cleaned) return 'SalesParrot could not complete that request. Please try again.';
  const lower = cleaned.toLowerCase();

  if (lower.includes('status code 400')) {
    return 'SalesParrot could not start that request with the current setup. Try again, or refresh the page if it keeps happening.';
  }
  if (lower.includes('status code 401') || lower.includes('unauthorized')) {
    return 'Your session needs to be refreshed before SalesParrot can continue. Sign in again, then retry.';
  }
  if (lower.includes('status code 403') || lower.includes('permission')) {
    return 'SalesParrot does not have permission to do that yet. Check the connected account or workspace access, then retry.';
  }
  if (lower.includes('status code 404')) {
    return 'SalesParrot could not find the conversation or workspace context. Start a new conversation and try again.';
  }
  if (lower.includes('status code 429') || lower.includes('rate limit')) {
    return 'SalesParrot is receiving too many requests right now. Wait a moment, then try again.';
  }
  if (lower.includes('network') || lower.includes('failed to fetch')) {
    return 'The connection dropped before SalesParrot could finish. Check your internet connection and retry.';
  }

  return cleaned;
}

interface AssistantMessageListProps {
  messages: AssistantMessage[];
  actionsById?: Record<string, AssistantAction>;
  isLoading: boolean;
  queryError?: string | null;
  draftUserMessage?: string;
  draftAssistantMessage?: string;
  error?: string | null;
  isResponding?: boolean;
  variant?: 'drawer' | 'page';
  suggestedPrompts?: string[];
  suggestedPromptsDisabled?: boolean;
  onUseSuggestedPrompt?: (prompt: string) => void;
  onRetryQuery?: () => void;
  onApproveAction?: (actionId: string, note?: string) => void;
  onRejectAction?: (actionId: string, reason?: string) => void;
  onEditAction?: (actionId: string, payload: Record<string, unknown>, message?: string) => void;
  onExecuteAction?: (actionId: string) => void;
  isApprovingAction?: boolean;
  isRejectingAction?: boolean;
  isEditingAction?: boolean;
  isExecutingAction?: boolean;
}

export function AssistantMessageList({
  messages,
  actionsById = {},
  isLoading,
  queryError = null,
  draftUserMessage = '',
  draftAssistantMessage = '',
  error = null,
  isResponding = false,
  variant = 'drawer',
  suggestedPrompts = [],
  suggestedPromptsDisabled = false,
  onUseSuggestedPrompt,
  onRetryQuery,
  onApproveAction,
  onRejectAction,
  onEditAction,
  onExecuteAction,
  isApprovingAction = false,
  isRejectingAction = false,
  isEditingAction = false,
  isExecutingAction = false,
}: AssistantMessageListProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const shouldStickToBottomRef = useRef(true);
  const isPage = variant === 'page';

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const handleScroll = () => {
      const distanceFromBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight;
      shouldStickToBottomRef.current = distanceFromBottom < 120;
    };

    handleScroll();
    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container || !shouldStickToBottomRef.current) return;
    container.scrollTop = container.scrollHeight;
  }, [messages.length, draftUserMessage, draftAssistantMessage, error, isResponding]);

  if (isLoading) {
    return (
      <div className={`space-y-4 ${isPage ? 'p-8 md:p-10' : 'p-6'}`}>
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className={`animate-pulse rounded-2xl p-4 ${
              index % 2 === 0 ? 'ml-auto max-w-[80%] bg-[#FFF7ED]' : 'max-w-[85%] bg-[#F1F5F9]'
            }`}
          >
            <div className="h-4 w-full rounded bg-[#E2E8F0]" />
          </div>
        ))}
      </div>
    );
  }

  if (queryError && messages.length === 0 && !draftUserMessage && !draftAssistantMessage) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="max-w-md space-y-3 rounded-2xl border border-[#FECACA] bg-white p-6 text-center shadow-sm">
          <h3 className="text-lg font-semibold text-[#991B1B]">Failed to load this conversation</h3>
          <p className="text-sm text-[#B91C1C]">{humanizeAssistantError(queryError)}</p>
          {onRetryQuery ? (
            <button
              type="button"
              onClick={onRetryQuery}
              className="rounded-lg border border-[#FCA5A5] bg-white px-4 py-2 text-sm font-medium text-[#991B1B]"
            >
              Retry
            </button>
          ) : null}
        </div>
      </div>
    );
  }

  if (
    messages.length === 0 &&
    !draftUserMessage &&
    !draftAssistantMessage &&
    !error &&
    !isResponding
  ) {
    if (!isPage) {
      return (
        <div className="flex h-full items-center justify-center p-8 text-center">
          <div>
            <h3 className="mb-2 text-lg font-semibold text-[#1E293B]">Start a conversation</h3>
            <p className="text-sm text-[#64748B]">
              Ask about campaign health, sender issues, inbox activity, or setup gaps.
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="flex h-full items-start justify-center px-6 pb-6 pt-3 md:px-10 md:pt-4">
        <div className="w-full max-w-3xl">
          <div className="mx-auto max-w-xl text-center">
            <h3 className="text-2xl font-semibold tracking-tight text-[#0F172A] md:text-3xl">
              What should SalesParrot look into?
            </h3>
            <p className="mt-2 text-sm leading-6 text-[#64748B]">
              Choose a starting point or type your own question below.
            </p>
          </div>

          {suggestedPrompts.length > 0 ? (
            <div className="mt-5 grid gap-2 md:grid-cols-3">
              {suggestedPrompts.slice(0, 3).map((prompt, index) => (
                <button
                  key={prompt}
                  type="button"
                  disabled={suggestedPromptsDisabled}
                  onClick={() => onUseSuggestedPrompt?.(prompt)}
                  className={`group rounded-[20px] border px-4 py-4 text-left transition-all ${
                    index === 0
                      ? 'border-[#0F172A] bg-[#0F172A] text-white shadow-[0_18px_42px_rgba(15,23,42,0.12)]'
                      : 'border-[#E2E8F0] bg-white text-[#0F172A] hover:-translate-y-0.5 hover:border-[#CBD5E1] hover:shadow-[0_16px_40px_rgba(15,23,42,0.08)]'
                  } disabled:cursor-wait disabled:opacity-60`}
                >
                  <div
                    className={`text-xs font-semibold uppercase tracking-[0.22em] ${
                      index === 0 ? 'text-white/60' : 'text-[#94A3B8]'
                    }`}
                  >
                    {index === 0 ? 'Suggested' : 'Ask'}
                  </div>
                  <div className="mt-2 line-clamp-3 text-sm font-semibold leading-6">{prompt}</div>
                  <div
                    className={`mt-3 text-xs font-semibold ${
                      index === 0 ? 'text-white/70' : 'text-[#FF6B35]'
                    }`}
                  >
                    Ask this
                  </div>
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div ref={scrollRef} className="h-full overflow-y-auto bg-transparent">
      <div className={`space-y-4 ${isPage ? 'px-6 pb-6 pt-4 md:px-8 md:pb-8 md:pt-5' : 'p-6'}`}>
        {queryError ? (
          <div
            role="alert"
            className="rounded-2xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm text-[#991B1B]"
          >
            <div className="font-medium">Some assistant data failed to refresh.</div>
            <div className="mt-1">{humanizeAssistantError(queryError)}</div>
            {onRetryQuery ? (
              <button
                type="button"
                onClick={onRetryQuery}
                className="mt-3 rounded-lg border border-[#FCA5A5] bg-white px-3 py-2 text-sm font-medium text-[#991B1B]"
              >
                Retry
              </button>
            ) : null}
          </div>
        ) : null}
        {messages.map((message) => {
          const isUser = message.role === 'user';
          const actionId =
            typeof message.metadata?.action_id === 'string' ? message.metadata.action_id : null;
          const action = actionId ? actionsById[actionId] : undefined;
          const responseCard = !action ? message.metadata?.response_card : null;
          const hasStructuredInsight = !isUser && !action && Boolean(responseCard);
          return (
            <div key={message.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
              <div className={hasStructuredInsight ? 'max-w-[92%]' : 'max-w-[85%]'}>
                <div
                  className={
                    hasStructuredInsight
                      ? 'px-1 pb-1 text-sm text-[#475569]'
                      : `rounded-2xl px-4 py-3 ${
                          isUser
                            ? isPage
                              ? 'bg-[#0F172A] text-white'
                              : 'bg-[#FF6B35] text-white'
                            : 'border border-[#E2E8F0] bg-white text-[#1E293B]'
                        }`
                  }
                >
                  <div className="whitespace-pre-wrap text-sm leading-6">{message.content}</div>
                </div>
                {action ? (
                  <AssistantActionCard
                    action={action}
                    onApprove={onApproveAction}
                    onReject={onRejectAction}
                    onEdit={onEditAction}
                    onExecute={onExecuteAction}
                    isApproving={isApprovingAction}
                    isRejecting={isRejectingAction}
                    isEditing={isEditingAction}
                    isExecuting={isExecutingAction}
                  />
                ) : null}
                {!action && !isUser && responseCard ? (
                  <AssistantInsightCard card={responseCard} />
                ) : null}
              </div>
            </div>
          );
        })}
        {draftUserMessage ? (
          <div className="flex justify-end">
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-white ${
                isPage ? 'bg-[#0F172A]' : 'bg-[#FF6B35]'
              }`}
            >
              <div className="whitespace-pre-wrap text-sm leading-6">{draftUserMessage}</div>
            </div>
          </div>
        ) : null}
        {draftAssistantMessage ? (
          <div className="flex justify-start">
            <div className="max-w-[85%] rounded-2xl border border-[#E2E8F0] bg-white px-4 py-3 text-[#1E293B]">
              <div className="whitespace-pre-wrap text-sm leading-6">{draftAssistantMessage}</div>
            </div>
          </div>
        ) : null}
        {isResponding && !draftAssistantMessage ? (
          <div className="flex justify-start">
            <div className="max-w-[85%] rounded-2xl border border-[#E2E8F0] bg-white px-4 py-3 text-[#1E293B] shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FFF7ED]">
                  <img src="/favicon.png" alt="" className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-[#0F172A]">
                    SalesParrot is thinking
                  </div>
                  <div className="mt-1 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#FF6B35]" />
                    <span
                      className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#FF8A5C]"
                      style={{ animationDelay: '120ms' }}
                    />
                    <span
                      className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#FDBA74]"
                      style={{ animationDelay: '240ms' }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
        {error ? (
          <div className="flex justify-start">
            <div
              role="alert"
              className="max-w-[85%] rounded-2xl border border-[#FECACA] bg-white px-4 py-3 text-[#B91C1C]"
            >
              <div className="text-sm font-semibold leading-6">Something got in the way</div>
              <div className="mt-1 whitespace-pre-wrap text-sm leading-6">
                {humanizeAssistantError(error)}
              </div>
              {onRetryQuery ? (
                <button
                  type="button"
                  onClick={onRetryQuery}
                  className="mt-3 rounded-xl border border-[#FCA5A5] bg-white px-3 py-2 text-sm font-medium text-[#991B1B] transition-colors hover:bg-[#FEF2F2]"
                >
                  Try again
                </button>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
