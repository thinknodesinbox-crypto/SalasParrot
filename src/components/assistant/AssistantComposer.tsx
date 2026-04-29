import { useState } from 'react';
import { Mic } from 'lucide-react';

interface AssistantComposerProps {
  disabled?: boolean;
  isSending: boolean;
  isVoiceDisabled?: boolean;
  isVoiceActive?: boolean;
  isVoiceConnecting?: boolean;
  voiceUnavailableReason?: string | null;
  voiceReview?: {
    headline?: string;
    spokenSummary?: string;
    requiresVisualReview?: boolean;
    visualReason?: string | null;
  } | null;
  voiceActionState?: 'awaiting_confirmation' | 'approved' | null;
  onApproveVoiceAction?: () => void;
  onExecuteVoiceAction?: () => void;
  onRejectVoiceAction?: () => void;
  onToggleVoice?: () => void;
  onSend: (content: string) => Promise<void> | void;
}

export function AssistantComposer({
  disabled = false,
  isSending,
  isVoiceDisabled = false,
  isVoiceActive = false,
  isVoiceConnecting = false,
  voiceUnavailableReason = null,
  voiceReview = null,
  voiceActionState = null,
  onApproveVoiceAction,
  onExecuteVoiceAction,
  onRejectVoiceAction,
  onToggleVoice,
  onSend,
}: AssistantComposerProps) {
  const [value, setValue] = useState('');
  const voiceStatusLabel = isVoiceConnecting
    ? 'Connecting voice assistant'
    : isVoiceActive
      ? 'Voice assistant live'
      : 'Start voice assistant';

  const handleSubmit = async () => {
    const cleaned = value.trim();
    if (!cleaned || disabled || isSending) return;
    await onSend(cleaned);
    setValue('');
  };

  return (
    <div className="border-t border-[#E2E8F0] bg-white p-4">
      {(isVoiceConnecting || isVoiceActive) && (
        <div className="mb-3 flex items-center justify-between rounded-xl border border-[#FED7AA] bg-[#FFF7ED] px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex items-end gap-1">
              <span
                className={`h-2.5 w-2.5 rounded-full ${isVoiceConnecting ? 'animate-pulse bg-[#F59E0B]' : 'animate-pulse bg-[#FF6B35]'}`}
              />
              <span
                className={`w-1.5 rounded-full bg-[#FF6B35] ${isVoiceConnecting ? 'h-3 animate-pulse' : 'h-4 animate-bounce'}`}
              />
              <span
                className={`w-1.5 rounded-full bg-[#FB923C] ${isVoiceConnecting ? 'h-5 animate-pulse' : 'h-6 animate-bounce'}`}
                style={{ animationDelay: '120ms' }}
              />
              <span
                className={`w-1.5 rounded-full bg-[#FDBA74] ${isVoiceConnecting ? 'h-4 animate-pulse' : 'h-5 animate-bounce'}`}
                style={{ animationDelay: '240ms' }}
              />
            </div>
            <div>
              <div className="text-sm font-semibold text-[#9A3412]">{voiceStatusLabel}</div>
              <div className="text-xs text-[#C2410C]">
                {isVoiceConnecting
                  ? 'Setting up microphone and realtime audio.'
                  : 'Listening and transcribing in real time.'}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onToggleVoice}
            className="rounded-lg bg-[#1E293B] px-3 py-2 text-xs font-semibold uppercase tracking-wide text-white"
          >
            Stop
          </button>
        </div>
      )}

      {isVoiceActive && voiceReview?.spokenSummary ? (
        <div className="mb-3 rounded-xl border border-[#E9D5FF] bg-[#FAF5FF] px-4 py-3">
          <div className="text-sm font-semibold text-[#6D28D9]">
            {voiceReview.requiresVisualReview
              ? 'Review In Chat To Continue'
              : voiceActionState === 'approved'
                ? 'Ready to execute by voice'
                : 'Pending voice confirmation'}
          </div>
          <div className="mt-1 text-sm text-[#5B21B6]">
            {voiceReview.spokenSummary}
            {voiceReview.requiresVisualReview && voiceReview.visualReason
              ? ` ${voiceReview.visualReason}`
              : ''}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {voiceActionState === 'awaiting_confirmation' && !voiceReview.requiresVisualReview ? (
              <button
                type="button"
                onClick={onApproveVoiceAction}
                className="rounded-lg bg-[#6D28D9] px-3 py-2 text-xs font-semibold uppercase tracking-wide text-white"
              >
                Approve
              </button>
            ) : null}
            {voiceActionState === 'approved' && !voiceReview.requiresVisualReview ? (
              <button
                type="button"
                onClick={onExecuteVoiceAction}
                className="rounded-lg bg-[#FF6B35] px-3 py-2 text-xs font-semibold uppercase tracking-wide text-white"
              >
                Execute
              </button>
            ) : null}
            <button
              type="button"
              onClick={onRejectVoiceAction}
              className="rounded-lg border border-[#D8B4FE] bg-white px-3 py-2 text-xs font-semibold uppercase tracking-wide text-[#6D28D9]"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}

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
        {!isVoiceActive && !isVoiceConnecting ? (
          <button
            type="button"
            onClick={onToggleVoice}
            disabled={isVoiceDisabled || !onToggleVoice}
            aria-label="Start voice chat"
            title={voiceUnavailableReason ? voiceUnavailableReason : 'Start voice chat'}
            className="self-end rounded-xl border border-[#E2E8F0] bg-white px-3 py-3 text-[#1E293B] transition-colors hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:border-[#E2E8F0] disabled:bg-[#E2E8F0] disabled:text-[#94A3B8]"
          >
            <div className="flex items-center gap-2">
              <Mic className="h-5 w-5" />
              <span className="hidden text-sm font-medium sm:inline">Voice</span>
            </div>
          </button>
        ) : null}
        <button
          onClick={() => void handleSubmit()}
          disabled={disabled || isSending || !value.trim()}
          className="self-end rounded-xl bg-[#FF6B35] px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-[#E85A2A] disabled:cursor-not-allowed disabled:bg-[#CBD5E1]"
        >
          {isSending ? 'Sending...' : 'Send'}
        </button>
      </div>
      {voiceUnavailableReason ? (
        <p className="mt-3 text-xs text-[#B45309]">{voiceUnavailableReason}</p>
      ) : null}
    </div>
  );
}
