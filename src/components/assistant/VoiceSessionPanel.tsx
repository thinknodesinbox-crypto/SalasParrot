interface VoiceSessionPanelProps {
  status: 'idle' | 'connecting' | 'connected' | 'error';
  error: string | null;
  liveTranscript: string;
}

export function VoiceSessionPanel({ status, error, liveTranscript }: VoiceSessionPanelProps) {
  return (
    <div className="border-b border-[#E2E8F0] bg-[#FFF7ED] px-6 py-3">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-sm font-medium text-[#1E293B]">
            Voice status: {status.charAt(0).toUpperCase() + status.slice(1)}
          </div>
          <div className="text-xs text-[#64748B]">
            Voice uses the same assistant thread and saves transcripts into chat history.
          </div>
        </div>
        {status === 'connected' && (
          <div className="rounded-full bg-[#22C55E]/10 px-3 py-1 text-xs font-medium text-[#15803D]">
            Live
          </div>
        )}
      </div>
      {liveTranscript ? (
        <div className="mt-3 rounded-lg border border-[#FED7AA] bg-white px-3 py-2 text-sm text-[#7C2D12]">
          {liveTranscript}
        </div>
      ) : null}
      {error ? (
        <div className="mt-3 rounded-lg border border-[#FECACA] bg-white px-3 py-2 text-sm text-[#B91C1C]">
          {error}
        </div>
      ) : null}
    </div>
  );
}
