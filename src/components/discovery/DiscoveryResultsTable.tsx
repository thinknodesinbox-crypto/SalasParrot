import type { DiscoveryResult } from '@/lib/types';

interface DiscoveryResultsTableProps {
  results: DiscoveryResult[];
  selectedIds: string[];
  onToggle: (resultId: string) => void;
  onSelectResult: (resultId: string) => void;
  activeResultId?: string | null;
}

function statusLabel(status: DiscoveryResult['status']) {
  switch (status) {
    case 'new':
      return 'New';
    case 'already_in_workspace':
      return 'In workspace';
    case 'already_in_list':
      return 'Already in list';
    case 'saved_to_list':
      return 'Saved';
    case 'dismissed':
      return 'Dismissed';
    default:
      return status;
  }
}

export function DiscoveryResultsTable({
  results,
  selectedIds,
  onToggle,
  onSelectResult,
  activeResultId,
}: DiscoveryResultsTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-[#E2E8F0]">
          <thead className="bg-[#F8FAFC]">
            <tr className="text-left text-xs font-medium uppercase tracking-wide text-[#64748B]">
              <th className="px-4 py-3">Pick</th>
              <th className="px-4 py-3">Lead</th>
              <th className="px-4 py-3">Why</th>
              <th className="px-4 py-3">Sources</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E8F0]">
            {results.map((result) => {
              const isActive = activeResultId === result.id;
              return (
                <tr
                  key={result.id}
                  className={`cursor-pointer transition hover:bg-[#FFF7ED] ${isActive ? 'bg-[#FFF7ED]' : 'bg-white'}`}
                  onClick={() => onSelectResult(result.id)}
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(result.id)}
                      onChange={() => onToggle(result.id)}
                      onClick={(event) => event.stopPropagation()}
                      className="h-4 w-4 rounded border-[#CBD5E1] text-[#FF6B35] focus:ring-[#FF6B35]"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-[#1E293B]">
                      {result.person_name || 'Unnamed lead'}
                    </div>
                    <div className="text-sm text-[#64748B]">
                      {[result.title, result.company_name].filter(Boolean).join(' @ ') ||
                        'No role/company yet'}
                    </div>
                    <div className="text-xs text-[#94A3B8]">
                      {result.location || 'Unknown location'}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-[#475569]">
                    {result.match_reasons_json
                      .slice(0, 2)
                      .map((reason) => String(reason))
                      .join(' · ') || 'Reason not available'}
                  </td>
                  <td className="px-4 py-3 text-xs text-[#64748B]">
                    {result.source_types.join(', ') || 'n/a'}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-[#F1F5F9] px-2.5 py-1 text-xs font-medium text-[#475569]">
                      {statusLabel(result.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-[#0F172A]">
                    {Math.round(result.score)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
