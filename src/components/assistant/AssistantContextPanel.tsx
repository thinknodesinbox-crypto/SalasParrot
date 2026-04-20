import type { Workspace } from '@/lib/types';

const starterPrompts = [
  'What needs attention in this workspace today?',
  'Summarize current campaign performance',
  'Any sender or account issues right now?',
  'What changed recently in inbox activity?',
  'Is my setup complete enough to get good results?',
];

interface AssistantContextPanelProps {
  workspace: Workspace | null;
  onUsePrompt: (prompt: string) => void;
}

export function AssistantContextPanel({ workspace, onUsePrompt }: AssistantContextPanelProps) {
  const brainFields = [
    ['Website', workspace?.website_url],
    ['Business Context', workspace?.business_blurb],
    ['ICP', workspace?.icp],
    ['Outreach Intent', workspace?.outreach_intent],
  ];
  const populatedCount = brainFields.filter(([, value]) => Boolean(value)).length;

  return (
    <div className="h-full space-y-4 overflow-y-auto border-l border-[#E2E8F0] bg-white p-4">
      <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
        <h3 className="mb-2 text-sm font-semibold text-[#1E293B]">Workspace Context</h3>
        <p className="mb-3 text-sm text-[#64748B]">{workspace?.name || 'No workspace selected'}</p>
        <div className="mb-4 rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-sm text-[#475569]">
          Parrot Brain completeness:{' '}
          <span className="font-medium text-[#1E293B]">{populatedCount}/4</span>
        </div>
        <div className="space-y-3">
          {brainFields.map(([label, value]) => (
            <div key={label}>
              <div className="mb-1 text-xs font-medium uppercase tracking-wide text-[#94A3B8]">
                {label}
              </div>
              <div className="text-sm text-[#1E293B]">{value || 'Not set'}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-[#E2E8F0] p-4">
        <h3 className="mb-3 text-sm font-semibold text-[#1E293B]">What you can ask</h3>
        <div className="space-y-2">
          {starterPrompts.map((prompt) => (
            <button
              key={prompt}
              onClick={() => onUsePrompt(prompt)}
              className="w-full rounded-lg border border-[#E2E8F0] px-3 py-2 text-left text-sm text-[#475569] transition-colors hover:border-[#FF6B35] hover:bg-[#FFF7ED] hover:text-[#1E293B]"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
