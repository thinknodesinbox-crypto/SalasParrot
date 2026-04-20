import { useState } from 'react';
import { Mic, Square } from 'lucide-react';

interface AssistantComposerProps {
  disabled?: boolean;
  isSending: boolean;
  isVoiceDisabled?: boolean;
  isVoiceActive?: boolean;
  isVoiceConnecting?: boolean;
  onToggleVoice?: () => void;
  onSend: (content: string) => Promise<void> | void;
}

export function AssistantComposer({
  disabled = false,
  isSending,
  isVoiceDisabled = false,
  isVoiceActive = false,
  isVoiceConnecting = false,
  onToggleVoice,
  onSend,
}: AssistantComposerProps) {
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
          type="button"
          onClick={onToggleVoice}
          disabled={isVoiceDisabled || isVoiceConnecting || !onToggleVoice}
          aria-label={isVoiceActive ? 'Stop voice chat' : 'Start voice chat'}
          title={
            isVoiceConnecting
              ? 'Connecting voice chat'
              : isVoiceActive
                ? 'Stop voice chat'
                : 'Start voice chat'
          }
          className={`self-end rounded-xl border p-3 transition-colors disabled:cursor-not-allowed ${
            isVoiceActive
              ? 'border-[#1E293B] bg-[#1E293B] text-white hover:bg-[#0F172A]'
              : 'border-[#E2E8F0] bg-white text-[#1E293B] hover:bg-[#F8FAFC]'
          } disabled:border-[#E2E8F0] disabled:bg-[#E2E8F0] disabled:text-[#94A3B8]`}
        >
          {isVoiceActive ? <Square className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
        </button>
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
