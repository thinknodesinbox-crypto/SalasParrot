import { Link, createLazyFileRoute, useNavigate, useSearch } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import {
  useCreateDiscoverySearch,
  useDiscoveryRun,
  useDiscoveryRunResults,
  useDiscoveryRuns,
  useDiscoverySearch,
  useDiscoverySearches,
  useDismissDiscoveryResults,
  useEnrichLeads,
  useDuplicateDiscoverySearch,
  useLeadLists,
  useLinkedInAccounts,
  usePauseDiscoverySearch,
  usePreviewDiscoverySearch,
  useResumeDiscoverySearch,
  useRunDiscoverySearch,
  useSaveDiscoveryResultsToList,
  useUpdateDiscoverySearch,
} from '../../lib/hooks/queries';
import { api } from '../../lib/api';
import { queryKeys } from '../../lib/queryClient';
import { useWorkspaceStore } from '../../lib/workspace';
import { showErrorToast, showSuccessToast } from '../../lib/toast';
import type {
  DiscoverySearchCreateRequest,
  DiscoverySearchPreview,
  DiscoveryResultStatus,
  DiscoverySearchStatus,
  SavedDiscoverySearch,
} from '../../lib/types';
import { DiscoveryResultPanel } from '../../components/discovery/DiscoveryResultPanel';
import {
  DiscoverySearchBuilder,
  type DiscoveryFormState,
} from '../../components/discovery/DiscoverySearchBuilder';
import { DiscoveryResultsTable } from '../../components/discovery/DiscoveryResultsTable';

export const Route = createLazyFileRoute('/dashboard/discovery')({
  component: DiscoveryPage,
});

const defaultForm: DiscoveryFormState = {
  name: '',
  searchType: 'intent',
  description: '',
  keywords: '',
  targetTitles: '',
  locations: '',
  eventTypes: '',
  webEnabled: true,
  webMaxResults: '10',
  linkedinEnabled: false,
  linkedinAccountId: '',
  linkedinSearchParams: '',
  linkedinMaxResults: '25',
  destinationListId: '',
  scheduleEnabled: false,
  scheduleType: 'weekly',
  scheduleTime: '09:00',
  scheduleDayOfWeek: '0',
  scheduleIntervalDays: '14',
  status: 'draft',
};

function parseCsvList(value: string) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function buildPayload(form: DiscoveryFormState, workspaceId: string): DiscoverySearchCreateRequest {
  let linkedInSearchParams: Record<string, unknown> = {};
  if (form.linkedinSearchParams.trim()) {
    try {
      linkedInSearchParams = JSON.parse(form.linkedinSearchParams);
    } catch {
      linkedInSearchParams = {};
    }
  }
  return {
    workspace_id: workspaceId,
    name: form.name,
    search_type: form.searchType,
    configuration_mode: 'manual',
    criteria_json: {
      description: form.description,
      keywords: parseCsvList(form.keywords),
      target_titles: parseCsvList(form.targetTitles),
      locations: parseCsvList(form.locations),
      event_types: parseCsvList(form.eventTypes),
    },
    source_config_json: {
      web: {
        enabled: form.webEnabled,
        max_results: Number(form.webMaxResults || 10),
      },
      linkedin: {
        enabled: form.linkedinEnabled,
        linkedin_account_id: form.linkedinAccountId || null,
        max_results: Number(form.linkedinMaxResults || 25),
        search_params: linkedInSearchParams,
      },
    },
    destination_list_id: form.destinationListId || null,
    schedule_enabled: form.scheduleEnabled,
    schedule_type: form.scheduleEnabled ? form.scheduleType : null,
    schedule_config_json: form.scheduleEnabled
      ? {
          time: form.scheduleTime || '09:00',
          day_of_week: Number(form.scheduleDayOfWeek || 0),
          interval_days: Number(form.scheduleIntervalDays || 14),
        }
      : {},
    status: form.status,
  };
}

function hydrateForm(search: SavedDiscoverySearch | null | undefined): DiscoveryFormState {
  if (!search) return defaultForm;
  const criteria = search.criteria_json || {};
  const sources = search.source_config_json || {};
  const linkedInSource =
    typeof sources.linkedin === 'object' && sources.linkedin !== null
      ? (sources.linkedin as Record<string, unknown>)
      : {};
  const webSource =
    typeof sources.web === 'object' && sources.web !== null
      ? (sources.web as Record<string, unknown>)
      : {};
  const scheduleConfig = search.schedule_config_json || {};
  return {
    name: search.name || '',
    searchType: search.search_type,
    description: String(criteria.description || ''),
    keywords: Array.isArray(criteria.keywords) ? criteria.keywords.join(', ') : '',
    targetTitles: Array.isArray(criteria.target_titles) ? criteria.target_titles.join(', ') : '',
    locations: Array.isArray(criteria.locations) ? criteria.locations.join(', ') : '',
    eventTypes: Array.isArray(criteria.event_types) ? criteria.event_types.join(', ') : '',
    webEnabled: webSource.enabled !== false,
    webMaxResults: String(webSource.max_results || 10),
    linkedinEnabled: linkedInSource.enabled === true,
    linkedinAccountId: String(linkedInSource.linkedin_account_id || ''),
    linkedinSearchParams: linkedInSource.search_params
      ? JSON.stringify(linkedInSource.search_params, null, 2)
      : '',
    linkedinMaxResults: String(linkedInSource.max_results || 25),
    destinationListId: search.destination_list_id || '',
    scheduleEnabled: search.schedule_enabled,
    scheduleType: search.schedule_type || 'weekly',
    scheduleTime: String(scheduleConfig.time || '09:00'),
    scheduleDayOfWeek: String(scheduleConfig.day_of_week ?? 0),
    scheduleIntervalDays: String(scheduleConfig.interval_days || 14),
    status: search.status,
  };
}

function DiscoveryPage() {
  const navigate = useNavigate({ from: '/dashboard/discovery' });
  const queryClient = useQueryClient();
  const routeSearch = useSearch({ from: '/dashboard/discovery' });
  const workspaceId = useWorkspaceStore((state) => state.currentWorkspaceId);
  const [activeStatusFilter, setActiveStatusFilter] = useState<DiscoverySearchStatus | 'all'>(
    'all'
  );
  const [resultStatusFilter, setResultStatusFilter] = useState<DiscoveryResultStatus | 'all'>(
    'all'
  );
  const [form, setForm] = useState<DiscoveryFormState>(defaultForm);
  const [selectedResultIds, setSelectedResultIds] = useState<string[]>([]);
  const [activeResultId, setActiveResultId] = useState<string | null>(null);
  const [preview, setPreview] = useState<DiscoverySearchPreview | null>(null);

  const { data: leadListsResponse } = useLeadLists(
    workspaceId ? { workspace_id: workspaceId } : undefined
  );
  const leadLists = leadListsResponse?.lists ?? [];
  const { data: linkedInAccounts = [] } = useLinkedInAccounts(
    workspaceId ? { workspace_id: workspaceId } : undefined
  );
  const { data: searches = [] } = useDiscoverySearches(
    workspaceId,
    activeStatusFilter === 'all' ? null : activeStatusFilter
  );
  const { data: activeSearch } = useDiscoverySearch(workspaceId, routeSearch.searchId);
  const { data: runs = [] } = useDiscoveryRuns(workspaceId, routeSearch.searchId);
  const selectedRunId = routeSearch.runId || runs[0]?.id || null;
  const { data: activeRun } = useDiscoveryRun(workspaceId, selectedRunId);
  const { data: results = [] } = useDiscoveryRunResults(
    workspaceId,
    selectedRunId,
    resultStatusFilter === 'all' ? null : resultStatusFilter
  );

  const previewSearchMutation = usePreviewDiscoverySearch();
  const createSearchMutation = useCreateDiscoverySearch();
  const updateSearchMutation = useUpdateDiscoverySearch(workspaceId, routeSearch.searchId);
  const runSearchMutation = useRunDiscoverySearch(workspaceId, routeSearch.searchId);
  const duplicateSearchMutation = useDuplicateDiscoverySearch(workspaceId, routeSearch.searchId);
  const pauseSearchMutation = usePauseDiscoverySearch(workspaceId, routeSearch.searchId);
  const resumeSearchMutation = useResumeDiscoverySearch(workspaceId, routeSearch.searchId);
  const saveResultsMutation = useSaveDiscoveryResultsToList(workspaceId, selectedRunId);
  const dismissResultsMutation = useDismissDiscoveryResults(workspaceId, selectedRunId);
  const enrichLeadsMutation = useEnrichLeads();

  useEffect(() => {
    if (activeSearch) {
      setForm(hydrateForm(activeSearch));
    } else {
      setForm(defaultForm);
    }
    setPreview(null);
  }, [activeSearch]);

  useEffect(() => {
    setSelectedResultIds([]);
    setActiveResultId(results[0]?.id || null);
  }, [selectedRunId, results]);

  const activeResult = useMemo(
    () => results.find((item) => item.id === activeResultId) || results[0] || null,
    [activeResultId, results]
  );

  const handleFormChange = (next: Partial<DiscoveryFormState>) => {
    setForm((current) => ({ ...current, ...next }));
  };

  const handlePreview = async () => {
    if (!workspaceId) return;
    try {
      const nextPreview = await previewSearchMutation.mutateAsync(buildPayload(form, workspaceId));
      setPreview(nextPreview);
    } catch (error) {
      showErrorToast(error instanceof Error ? error.message : 'Unable to preview discovery search');
    }
  };

  const handleSave = async (mode: 'save' | 'save_run') => {
    if (!workspaceId) return;
    const payload = buildPayload(form, workspaceId);
    try {
      const search = routeSearch.searchId
        ? await updateSearchMutation.mutateAsync(payload)
        : await createSearchMutation.mutateAsync(payload);
      await navigate({
        to: '/dashboard/discovery',
        search: {
          searchId: search.id,
          runId: undefined,
        },
      });
      if (mode === 'save_run') {
        const response = await api.post<{ id: string }>(
          `/discovery/searches/${search.id}/run?workspace_id=${workspaceId}`
        );
        await queryClient.invalidateQueries({
          queryKey: queryKeys.discovery.searches(workspaceId),
        });
        await queryClient.invalidateQueries({
          queryKey: queryKeys.discovery.search(workspaceId, search.id),
        });
        await queryClient.invalidateQueries({
          queryKey: queryKeys.discovery.runs(workspaceId, search.id),
        });
        await navigate({
          to: '/dashboard/discovery',
          search: {
            searchId: search.id,
            runId: response.data.id,
          },
        });
      }
      showSuccessToast(
        mode === 'save_run' ? 'Discovery search saved and started.' : 'Discovery search saved.'
      );
    } catch (error) {
      showErrorToast(error instanceof Error ? error.message : 'Unable to save discovery search');
    }
  };

  const handleRunExistingSearch = async () => {
    if (!routeSearch.searchId) return;
    try {
      const run = await runSearchMutation.mutateAsync();
      await navigate({
        to: '/dashboard/discovery',
        search: { searchId: routeSearch.searchId, runId: run.id },
      });
      showSuccessToast('Discovery run started.');
    } catch (error) {
      showErrorToast(error instanceof Error ? error.message : 'Unable to start discovery run');
    }
  };

  const toggleSelection = (resultId: string) => {
    setSelectedResultIds((current) =>
      current.includes(resultId) ? current.filter((id) => id !== resultId) : [...current, resultId]
    );
  };

  const handleSaveSelected = async () => {
    if (!selectedRunId) return;
    try {
      const response = await saveResultsMutation.mutateAsync({
        result_ids: selectedResultIds.length ? selectedResultIds : undefined,
        destination_list_id:
          form.destinationListId || activeSearch?.destination_list_id || undefined,
      });
      showSuccessToast(response.message);
      setSelectedResultIds([]);
    } catch (error) {
      showErrorToast(error instanceof Error ? error.message : 'Unable to save results to list');
    }
  };

  const handleDismissSelected = async () => {
    if (!selectedRunId || selectedResultIds.length === 0) return;
    try {
      const response = await dismissResultsMutation.mutateAsync({ result_ids: selectedResultIds });
      showSuccessToast(response.message);
      setSelectedResultIds([]);
    } catch (error) {
      showErrorToast(error instanceof Error ? error.message : 'Unable to dismiss results');
    }
  };

  const handleEnrichSaved = async () => {
    const targetLeadIds = (
      selectedResultIds.length
        ? results.filter((result) => selectedResultIds.includes(result.id))
        : results.filter((result) => result.status === 'saved_to_list')
    )
      .map((result) => result.saved_lead_id)
      .filter((leadId): leadId is string => Boolean(leadId));
    if (!workspaceId || !targetLeadIds.length) {
      showErrorToast('Save discovery results to a list before enriching emails.');
      return;
    }
    try {
      const response = await enrichLeadsMutation.mutateAsync({
        lead_ids: targetLeadIds,
        workspace_id: workspaceId,
        list_id: activeSearch?.destination_list_id || undefined,
      });
      showSuccessToast(response.message);
    } catch (error) {
      showErrorToast(error instanceof Error ? error.message : 'Unable to start enrichment');
    }
  };

  const handleDuplicate = async () => {
    if (!routeSearch.searchId) return;
    try {
      const duplicate = await duplicateSearchMutation.mutateAsync();
      await navigate({ to: '/dashboard/discovery', search: { searchId: duplicate.id } });
      showSuccessToast('Discovery search duplicated.');
    } catch (error) {
      showErrorToast(error instanceof Error ? error.message : 'Unable to duplicate search');
    }
  };

  const handlePauseResume = async () => {
    if (!activeSearch) return;
    try {
      if (activeSearch.status === 'paused') {
        await resumeSearchMutation.mutateAsync();
        showSuccessToast('Discovery search resumed.');
      } else {
        await pauseSearchMutation.mutateAsync();
        showSuccessToast('Discovery search paused.');
      }
    } catch (error) {
      showErrorToast(error instanceof Error ? error.message : 'Unable to update search status');
    }
  };

  if (!workspaceId) {
    return <div className="p-6 text-sm text-[#64748B]">Select a workspace to use Discovery.</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#1E293B]">Discovery</h1>
          <p className="mt-1 text-sm text-[#64748B]">
            Continuous intent and event-driven lead discovery across LinkedIn and web search.
          </p>
        </div>
        {activeSearch ? (
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleRunExistingSearch}
              className="rounded-xl bg-[#FF6B35] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#EA580C]"
            >
              Run now
            </button>
            <button
              type="button"
              onClick={handlePauseResume}
              className="rounded-xl border border-[#CBD5E1] px-4 py-2.5 text-sm font-medium text-[#334155] transition hover:bg-[#F8FAFC]"
            >
              {activeSearch.status === 'paused' ? 'Resume' : 'Pause'}
            </button>
            <button
              type="button"
              onClick={handleDuplicate}
              className="rounded-xl border border-[#CBD5E1] px-4 py-2.5 text-sm font-medium text-[#334155] transition hover:bg-[#F8FAFC]"
            >
              Duplicate
            </button>
          </div>
        ) : null}
      </div>

      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <div className="space-y-4">
          <div className="rounded-2xl border border-[#E2E8F0] bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm font-semibold text-[#1E293B]">Saved searches</div>
              <select
                value={activeStatusFilter}
                onChange={(event) =>
                  setActiveStatusFilter(event.target.value as DiscoverySearchStatus | 'all')
                }
                className="rounded-lg border border-[#CBD5E1] px-2 py-1 text-xs text-[#334155]"
              >
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="paused">Paused</option>
              </select>
            </div>
            <div className="space-y-2">
              {searches.length ? (
                searches.map((search) => {
                  const isActive = routeSearch.searchId === search.id;
                  return (
                    <button
                      key={search.id}
                      type="button"
                      onClick={() =>
                        navigate({
                          to: '/dashboard/discovery',
                          search: {
                            searchId: search.id,
                            runId: undefined,
                          },
                        })
                      }
                      className={`w-full rounded-xl border p-3 text-left transition ${isActive ? 'border-[#FDBA74] bg-[#FFF7ED]' : 'border-[#E2E8F0] bg-white hover:bg-[#F8FAFC]'}`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="font-medium text-[#1E293B]">{search.name}</div>
                        <span className="rounded-full bg-[#F1F5F9] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[#64748B]">
                          {search.status}
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-[#64748B]">
                        {search.search_type} •{' '}
                        {Object.keys(search.source_config_json || {}).join(', ') ||
                          'sources pending'}
                      </div>
                      <div className="mt-2 text-[11px] text-[#94A3B8]">
                        {search.next_run_at
                          ? `Next: ${new Date(search.next_run_at).toLocaleString()}`
                          : search.last_run_at
                            ? `Last run: ${new Date(search.last_run_at).toLocaleString()}`
                            : 'Not run yet'}
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="rounded-xl border border-dashed border-[#CBD5E1] px-4 py-6 text-sm text-[#64748B]">
                  No discovery searches yet.
                </div>
              )}
            </div>
          </div>

          {activeSearch ? (
            <div className="rounded-2xl border border-[#E2E8F0] bg-white p-4">
              <div className="text-sm font-semibold text-[#1E293B]">Run history</div>
              <div className="mt-3 space-y-2">
                {runs.length ? (
                  runs.map((run) => (
                    <button
                      key={run.id}
                      type="button"
                      onClick={() =>
                        navigate({
                          to: '/dashboard/discovery',
                          search: {
                            searchId: activeSearch.id,
                            runId: run.id,
                          },
                        })
                      }
                      className={`w-full rounded-xl border px-3 py-2 text-left transition ${selectedRunId === run.id ? 'border-[#FDBA74] bg-[#FFF7ED]' : 'border-[#E2E8F0] hover:bg-[#F8FAFC]'}`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-medium text-[#1E293B]">
                          {run.trigger_type}
                        </span>
                        <span className="text-xs text-[#64748B]">{run.status}</span>
                      </div>
                      <div className="mt-1 text-xs text-[#94A3B8]">
                        {new Date(run.created_at).toLocaleString()}
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="text-sm text-[#64748B]">No runs yet.</div>
                )}
              </div>
            </div>
          ) : null}
        </div>

        <div className="space-y-6">
          <DiscoverySearchBuilder
            form={form}
            onChange={handleFormChange}
            onPreview={handlePreview}
            onSave={handleSave}
            preview={preview}
            isPreviewing={previewSearchMutation.isPending}
            isSaving={createSearchMutation.isPending || updateSearchMutation.isPending}
            leadLists={leadLists}
            linkedInAccounts={linkedInAccounts}
            editingSearch={activeSearch}
          />

          {activeRun ? (
            <div className="space-y-4 rounded-2xl border border-[#E2E8F0] bg-white p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-[#1E293B]">Results Workspace</h2>
                  <p className="mt-1 text-sm text-[#64748B]">
                    {activeRun.status === 'running' || activeRun.status === 'pending'
                      ? 'Collecting candidates from LinkedIn and web sources...'
                      : activeRun.error_message || 'Review, save, or dismiss discovery results.'}
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <select
                    value={resultStatusFilter}
                    onChange={(event) =>
                      setResultStatusFilter(event.target.value as DiscoveryResultStatus | 'all')
                    }
                    className="rounded-xl border border-[#CBD5E1] px-3 py-2.5 text-sm text-[#334155]"
                  >
                    <option value="all">All results</option>
                    <option value="new">New</option>
                    <option value="already_in_workspace">Already in workspace</option>
                    <option value="already_in_list">Already in list</option>
                    <option value="saved_to_list">Saved to list</option>
                    <option value="dismissed">Dismissed</option>
                  </select>
                  <button
                    type="button"
                    onClick={handleSaveSelected}
                    disabled={
                      saveResultsMutation.isPending ||
                      (!selectedResultIds.length && !results.length)
                    }
                    className="rounded-xl bg-[#1E293B] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#0F172A] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Save to list
                  </button>
                  <button
                    type="button"
                    onClick={handleDismissSelected}
                    disabled={dismissResultsMutation.isPending || selectedResultIds.length === 0}
                    className="rounded-xl border border-[#CBD5E1] px-4 py-2.5 text-sm font-medium text-[#334155] transition hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Dismiss selected
                  </button>
                  <button
                    type="button"
                    onClick={handleEnrichSaved}
                    disabled={enrichLeadsMutation.isPending}
                    className="rounded-xl border border-[#CBD5E1] px-4 py-2.5 text-sm font-medium text-[#334155] transition hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Enrich saved leads
                  </button>
                  {activeSearch?.destination_list_id ? (
                    <Link
                      to="/dashboard/leads"
                      search={{ listId: activeSearch.destination_list_id }}
                      className="rounded-xl border border-[#CBD5E1] px-4 py-2.5 text-sm font-medium text-[#334155] transition hover:bg-[#F8FAFC]"
                    >
                      Open destination list
                    </Link>
                  ) : null}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <StatCard
                  label="Total candidates"
                  value={String(
                    (activeRun.summary_json.total_candidates as number | undefined) ||
                      results.length
                  )}
                />
                <StatCard
                  label="New results"
                  value={String(
                    ((
                      activeRun.summary_json.results_by_status as Record<string, number> | undefined
                    )?.new as number | undefined) ||
                      results.filter((result) => result.status === 'new').length
                  )}
                />
                <StatCard
                  label="LinkedIn + Web"
                  value={String(
                    results.filter(
                      (result) =>
                        result.source_types.includes('linkedin') &&
                        result.source_types.includes('web')
                    ).length
                  )}
                />
              </div>

              <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.9fr)]">
                <DiscoveryResultsTable
                  results={results}
                  selectedIds={selectedResultIds}
                  onToggle={toggleSelection}
                  onSelectResult={setActiveResultId}
                  activeResultId={activeResultId}
                />
                <DiscoveryResultPanel result={activeResult} />
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-[#CBD5E1] bg-white p-8 text-sm text-[#64748B]">
              Pick a search and run it to open the results workspace.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
      <div className="text-xs font-semibold uppercase tracking-wide text-[#94A3B8]">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-[#1E293B]">{value}</div>
    </div>
  );
}
