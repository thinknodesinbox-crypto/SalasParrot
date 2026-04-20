import { useState } from 'react';

interface AssistantComposerProps {
  disabled?: boolean;
  isSending: boolean;
  onSend: (content: string) => Promise<void> | void;
}

export function AssistantComposer({ disabled = false, isSending, onSend }: AssistantComposerProps) {
  const [value, setValue] = useState('');

  const handleSubmit = async () => {
    const cleaned = value.trim();
    if (!cleaned || disabled || isSending) return;
    await onSend(cleaned);
    setValue('');
  };

  return (
    <div className="border-t border-[#E2E8F0] bg-white p-4">
      <div className="flex gap-3">
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              void handleSubmit();
            }
          }}
          disabled={disabled || isSending}
          placeholder={
            disabled
              ? 'Select a workspace to start'
              : 'Ask what is going on in this workspace right now'
          }
          className="min-h-[84px] flex-1 rounded-xl border border-[#E2E8F0] px-4 py-3 text-sm text-[#1E293B] focus:border-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 disabled:bg-[#F8FAFC]"
        />
        <button
          onClick={() => void handleSubmit()}
          disabled={disabled || isSending || !value.trim()}
          className="self-end rounded-xl bg-[#FF6B35] px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-[#E85A2A] disabled:cursor-not-allowed disabled:bg-[#CBD5E1]"
        >
          {isSending ? 'Sending...' : 'Send'}
        </button>
      </div>
    </div>
  );
}
