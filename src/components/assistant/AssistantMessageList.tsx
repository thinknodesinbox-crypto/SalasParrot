import type { AssistantMessage } from '@/lib/types';

interface AssistantMessageListProps {
  messages: AssistantMessage[];
  isLoading: boolean;
  draftUserMessage?: string;
  draftAssistantMessage?: string;
  error?: string | null;
}

export function AssistantMessageList({
  messages,
  isLoading,
  draftUserMessage = '',
  draftAssistantMessage = '',
  error = null,
}: AssistantMessageListProps) {
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
    <div className="space-y-4 p-6">
      {messages.map((message) => {
        const isUser = message.role === 'user';
        return (
          <div key={message.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                isUser
                  ? 'bg-[#FF6B35] text-white'
                  : 'border border-[#E2E8F0] bg-white text-[#1E293B]'
              }`}
            >
              <div className="whitespace-pre-wrap text-sm leading-6">{message.content}</div>
              <div className={`mt-2 text-[11px] ${isUser ? 'text-white/80' : 'text-[#94A3B8]'}`}>
                {new Date(message.created_at).toLocaleString()}
              </div>
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
  );
}
