import type { DiscoveryResult } from '@/lib/types';

interface DiscoveryResultPanelProps {
  result: DiscoveryResult | null;
}

export function DiscoveryResultPanel({ result }: DiscoveryResultPanelProps) {
  if (!result) {
    return (
      <div className="rounded-2xl border border-dashed border-[#CBD5E1] bg-white p-6 text-sm text-[#64748B]">
        Select a result to inspect why it matched and where it came from.
      </div>
    );
  }

  const reasons = result.match_reasons_json.map((item) => String(item)).filter(Boolean);

  return (
    <div className="space-y-5 rounded-2xl border border-[#E2E8F0] bg-white p-6">
      <div>
        <h3 className="text-lg font-semibold text-[#1E293B]">
          {result.person_name || result.company_name || 'Discovery result'}
        </h3>
        <p className="mt-1 text-sm text-[#64748B]">
          {[result.title, result.company_name].filter(Boolean).join(' @ ') ||
            'No role/company summary yet'}
        </p>
      </div>

      {result.event_summary ? (
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-[#94A3B8]">Event</div>
          <p className="mt-2 text-sm text-[#334155]">{result.event_summary}</p>
        </div>
      ) : null}

      {result.intent_summary ? (
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-[#94A3B8]">Intent</div>
          <p className="mt-2 text-sm text-[#334155]">{result.intent_summary}</p>
        </div>
      ) : null}

      <div>
        <div className="text-xs font-semibold uppercase tracking-wide text-[#94A3B8]">
          Why this matched
        </div>
        <ul className="mt-2 space-y-2 text-sm text-[#334155]">
          {reasons.length ? (
            reasons.map((reason, index) => <li key={`${reason}-${index}`}>• {reason}</li>)
          ) : (
            <li>• No detailed reasons available.</li>
          )}
        </ul>
      </div>

      <div>
        <div className="text-xs font-semibold uppercase tracking-wide text-[#94A3B8]">Sources</div>
        <div className="mt-2 flex flex-wrap gap-2">
          {result.source_urls.length ? (
            result.source_urls.map((url) => (
              <a
                key={url}
                href={url}
                target="_blank"
                rel="noreferrer"
                className="rounded-full bg-[#EFF6FF] px-3 py-1 text-xs font-medium text-[#1D4ED8]"
              >
                Source link
              </a>
            ))
          ) : (
            <span className="text-sm text-[#64748B]">No direct source links available.</span>
          )}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl bg-[#F8FAFC] p-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-[#94A3B8]">
            LinkedIn
          </div>
          <div className="mt-1 text-sm text-[#334155]">{result.linkedin_url || 'Not resolved'}</div>
        </div>
        <div className="rounded-xl bg-[#F8FAFC] p-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-[#94A3B8]">
            Website
          </div>
          <div className="mt-1 text-sm text-[#334155]">
            {result.company_website || 'Not resolved'}
          </div>
        </div>
      </div>
    </div>
  );
}
