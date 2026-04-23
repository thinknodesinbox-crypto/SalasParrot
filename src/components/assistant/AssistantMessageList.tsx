import { useEffect, useRef } from 'react';
import type { AssistantAction, AssistantMessage } from '@/lib/types';
import { AssistantActionCard } from './AssistantActionCard';

interface AssistantMessageListProps {
  messages: AssistantMessage[];
  actionsById?: Record<string, AssistantAction>;
  isLoading: boolean;
  draftUserMessage?: string;
  draftAssistantMessage?: string;
  error?: string | null;
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
  draftUserMessage = '',
  draftAssistantMessage = '',
  error = null,
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
  }, [messages.length, draftUserMessage, draftAssistantMessage, error]);

  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className={`animate-pulse rounded-2xl p-4 ${index % 2 === 0 ? 'ml-auto max-w-[80%] bg-[#FFF7ED]' : 'max-w-[85%] bg-[#F1F5F9]'}`}
          >
            <div className="h-4 w-full rounded bg-[#E2E8F0]" />
          </div>
        ))}
      </div>
    );
  }

  if (messages.length === 0 && !draftUserMessage && !draftAssistantMessage && !error) {
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
    <div ref={scrollRef} className="h-full overflow-y-auto">
      <div className="space-y-4 p-6">
        {messages.map((message) => {
          const isUser = message.role === 'user';
          const actionId =
            typeof message.metadata?.action_id === 'string' ? message.metadata.action_id : null;
          const action = actionId ? actionsById[actionId] : undefined;
          return (
            <div key={message.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
              <div className="max-w-[85%]">
                <div
                  className={`rounded-2xl px-4 py-3 ${
                    isUser
                      ? 'bg-[#FF6B35] text-white'
                      : 'border border-[#E2E8F0] bg-white text-[#1E293B]'
                  }`}
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
              </div>
            </div>
          );
        })}
        {draftUserMessage ? (
          <div className="flex justify-end">
            <div className="max-w-[85%] rounded-2xl bg-[#FF6B35] px-4 py-3 text-white">
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
        {error ? (
          <div className="flex justify-start">
            <div className="max-w-[85%] rounded-2xl border border-[#FECACA] bg-white px-4 py-3 text-[#B91C1C]">
              <div className="whitespace-pre-wrap text-sm leading-6">{error}</div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
