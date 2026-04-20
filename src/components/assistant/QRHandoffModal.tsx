import { useMemo } from 'react';

interface QRHandoffModalProps {
  isOpen: boolean;
  handoffUrl: string | null;
  expiresAt: string | null;
  isLoading: boolean;
  error: string | null;
  onClose: () => void;
}

export function QRHandoffModal({
  isOpen,
  handoffUrl,
  expiresAt,
  isLoading,
  error,
  onClose,
}: QRHandoffModalProps) {
  const qrImageUrl = useMemo(() => {
    if (!handoffUrl) return null;
    return `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(handoffUrl)}`;
  }, [handoffUrl]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-[#1E293B]">Continue on mobile</h2>
            <p className="mt-1 text-sm text-[#64748B]">
              Scan this QR code to open the same assistant thread on your phone.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-sm text-[#64748B] hover:bg-[#F8FAFC]"
          >
            Close
          </button>
        </div>

        <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
          {isLoading ? (
            <div className="flex h-[240px] items-center justify-center text-sm text-[#64748B]">
              Generating handoff QR...
            </div>
          ) : error ? (
            <div className="rounded-lg border border-[#FECACA] bg-white p-4 text-sm text-[#B91C1C]">
              {error}
            </div>
          ) : qrImageUrl && handoffUrl ? (
            <div className="space-y-4 text-center">
              <img
                src={qrImageUrl}
                alt="Assistant mobile handoff QR"
                className="mx-auto h-[240px] w-[240px] rounded-lg border border-[#E2E8F0] bg-white p-2"
              />
              <div className="rounded-lg border border-[#E2E8F0] bg-white p-3 text-left">
                <div className="mb-1 text-xs font-medium uppercase tracking-wide text-[#94A3B8]">
                  Handoff link
                </div>
                <div className="break-all text-sm text-[#334155]">{handoffUrl}</div>
              </div>
              <button
                onClick={() => void navigator.clipboard.writeText(handoffUrl)}
                className="w-full rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-sm font-medium text-[#1E293B] hover:bg-[#F8FAFC]"
              >
                Copy link
              </button>
              {expiresAt ? (
                <div className="text-xs text-[#64748B]">
                  Expires at {new Date(expiresAt).toLocaleTimeString()}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
