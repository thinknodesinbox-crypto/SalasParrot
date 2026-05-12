import { useState } from 'react';
import { ArrowUp, Mic } from 'lucide-react';

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
  variant?: 'drawer' | 'page';
  hideVoiceControls?: boolean;
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
  variant = 'drawer',
  hideVoiceControls = false,
  onApproveVoiceAction,
  onExecuteVoiceAction,
  onRejectVoiceAction,
  onToggleVoice,
  onSend,
}: AssistantComposerProps) {
  const [value, setValue] = useState('');
  const isPage = variant === 'page';
  const voiceStatusLabel = isVoiceConnecting
    ? 'Connecting voice assistant'
    : isVoiceActive
      ? 'Voice assistant live'
      : 'Start voice assistant';

  const handleSubmit = async () => {
    const cleaned = value.trim();
    if (!cleaned || disabled || isSending) return;
    try {
      await onSend(cleaned);
      setValue('');
    } catch {
      setValue(cleaned);
    }
  };

  return (
    <div
      className={`border-t border-[#E2E8F0] bg-white ${
        isPage ? 'px-5 pb-5 pt-4 md:px-6 md:pb-6' : 'p-4'
      }`}
    >
      {!hideVoiceControls && (isVoiceConnecting || isVoiceActive) && (
        <div className="mb-3 flex items-center justify-between rounded-2xl border border-[#FED7AA] bg-[#FFF7ED] px-4 py-3">
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
            className="rounded-xl bg-[#1E293B] px-3 py-2 text-xs font-semibold uppercase tracking-wide text-white"
          >
            Stop
          </button>
        </div>
      )}

      {!hideVoiceControls && isVoiceActive && voiceReview?.spokenSummary ? (
        <div className="mb-3 rounded-2xl border border-[#E9D5FF] bg-[#FAF5FF] px-4 py-3">
          <div className="text-sm font-semibold text-[#6D28D9]">
            {voiceReview.requiresVisualReview
              ? 'Review in chat to continue'
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
                className="rounded-xl bg-[#6D28D9] px-3 py-2 text-xs font-semibold uppercase tracking-wide text-white"
              >
                Approve
              </button>
            ) : null}
            {voiceActionState === 'approved' && !voiceReview.requiresVisualReview ? (
              <button
                type="button"
                onClick={onExecuteVoiceAction}
                className="rounded-xl bg-[#FF6B35] px-3 py-2 text-xs font-semibold uppercase tracking-wide text-white"
              >
                Execute
              </button>
            ) : null}
            <button
              type="button"
              onClick={onRejectVoiceAction}
              className="rounded-xl border border-[#D8B4FE] bg-white px-3 py-2 text-xs font-semibold uppercase tracking-wide text-[#6D28D9]"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      <div className={isPage ? 'rounded-[28px] border border-[#E2E8F0] bg-[#FCFDFE] p-4' : ''}>
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
                : isPage
                  ? 'Ask about campaigns, pipeline, inbox changes, or what needs attention next.'
                  : 'Ask what is going on in this workspace right now'
            }
            className={`flex-1 resize-none text-sm text-[#1E293B] placeholder:text-[#94A3B8] focus:border-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/15 disabled:bg-[#F8FAFC] ${
              isPage
                ? 'min-h-[104px] rounded-[24px] border border-[#E2E8F0] bg-white px-5 py-4 text-[15px]'
                : 'min-h-[84px] rounded-xl border border-[#E2E8F0] px-4 py-3'
            }`}
          />
          {!hideVoiceControls && !isVoiceActive && !isVoiceConnecting ? (
            <button
              type="button"
              onClick={onToggleVoice}
              disabled={isVoiceDisabled || !onToggleVoice}
              aria-label="Start voice chat"
              title={voiceUnavailableReason ? voiceUnavailableReason : 'Start voice chat'}
              className={`self-end text-[#1E293B] transition-colors disabled:cursor-not-allowed disabled:border-[#E2E8F0] disabled:bg-[#E2E8F0] disabled:text-[#94A3B8] ${
                isPage
                  ? 'rounded-2xl border border-[#E2E8F0] bg-white px-4 py-3 hover:bg-[#F8FAFC]'
                  : 'rounded-xl border border-[#E2E8F0] bg-white px-3 py-3 hover:bg-[#F8FAFC]'
              }`}
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
            className={`self-end text-sm font-medium text-white transition-colors disabled:cursor-not-allowed disabled:bg-[#CBD5E1] ${
              isPage
                ? 'inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#0F172A] hover:bg-[#1E293B]'
                : 'rounded-xl bg-[#FF6B35] px-4 py-3 hover:bg-[#E85A2A]'
            }`}
          >
            {isPage ? <ArrowUp className="h-4 w-4" /> : isSending ? 'Sending...' : 'Send'}
          </button>
        </div>
      </div>
      {!hideVoiceControls && voiceUnavailableReason ? (
        <p className="mt-3 text-xs text-[#B45309]">{voiceUnavailableReason}</p>
      ) : null}
    </div>
  );
}
