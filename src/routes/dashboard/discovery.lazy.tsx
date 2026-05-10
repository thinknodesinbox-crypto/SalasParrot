import { Link, createLazyFileRoute, useNavigate, useSearch } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import {
  useCreateDiscoverySearch,
  useCreateLeadList,
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
  description: '',
  targetWebsites: '',
  specialInstructions: '',
  linkedinAccountId: '',
  destinationListId: '',
  scheduleIntervalDays: '0',
};

function inferSearchType(description: string): 'intent' | 'event' {
  return /\b(funding|funded|raised|launch|launched|hire|hiring|appointed|promoted|acquired|acquisition|expansion|expanding|partnership|merged|opening|opened)\b/i.test(
    description
  )
    ? 'event'
    : 'intent';
}

function buildGeneratedSearchName(description: string, searchType: 'intent' | 'event') {
  const cleaned = description.replace(/\s+/g, ' ').trim().replace(/[.]+$/, '');
  if (!cleaned) {
    return searchType === 'event' ? 'Event Discovery Search' : 'Intent Discovery Search';
  }

  return cleaned.length > 72 ? `${cleaned.slice(0, 69).trimEnd()}...` : cleaned;
}

function buildLinkedInSearchParams(form: DiscoveryFormState): Record<string, unknown> {
  const fallbackDescription = form.description.trim().replace(/\s+/g, ' ');
  const keywordText = fallbackDescription.slice(0, 180);

  if (!keywordText) return {};

  return {
    api: 'classic',
    category: 'people',
    network_distance: [2, 3],
    keywords: keywordText,
  };
}

function parseTargetWebsites(rawValue: string): string[] {
  return Array.from(
    new Set(
      rawValue
        .split(/\n|,/)
        .map((value) => value.trim())
        .filter(Boolean)
    )
  );
}

function buildPayload(form: DiscoveryFormState, workspaceId: string): DiscoverySearchCreateRequest {
  const searchType = inferSearchType(form.description);
  const scheduleIntervalDays = Number(form.scheduleIntervalDays || 0);
  const linkedInSearchParams = buildLinkedInSearchParams(form);
  const linkedInEnabled = Boolean(form.linkedinAccountId);
  const targetWebsites = parseTargetWebsites(form.targetWebsites);
  return {
    workspace_id: workspaceId,
    name: buildGeneratedSearchName(form.description, searchType),
    search_type: searchType,
    configuration_mode: 'manual',
    criteria_json: {
      description: form.description,
      target_websites: targetWebsites,
      special_instructions: form.specialInstructions.trim() || null,
    },
    source_config_json: {
      collection_mode: 'rich',
      web: {
        enabled: true,
        max_results: 100,
        target_websites: targetWebsites,
        use_crawl4ai: targetWebsites.length > 0,
      },
      linkedin: {
        enabled: linkedInEnabled,
        linkedin_account_id: form.linkedinAccountId || null,
        max_results: 100,
        search_params: linkedInSearchParams,
      },
    },
    destination_list_id: form.destinationListId || null,
    schedule_enabled: scheduleIntervalDays > 0,
    schedule_type:
      scheduleIntervalDays === 7
        ? 'weekly'
        : scheduleIntervalDays === 14
          ? 'biweekly'
          : scheduleIntervalDays > 0
            ? 'custom'
            : null,
    schedule_config_json:
      scheduleIntervalDays > 0
        ? {
            time: '09:00',
            day_of_week: 0,
            interval_days: scheduleIntervalDays,
          }
        : {},
    status: 'active',
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
  const scheduleConfig = search.schedule_config_json || {};
  return {
    description: String(criteria.description || ''),
    targetWebsites: Array.isArray(criteria.target_websites)
      ? criteria.target_websites.map((value) => String(value)).join('\n')
      : '',
    specialInstructions: String(criteria.special_instructions || ''),
    linkedinAccountId: String(linkedInSource.linkedin_account_id || ''),
    destinationListId: search.destination_list_id || '',
    scheduleIntervalDays: search.schedule_enabled
      ? String(
          search.schedule_type === 'weekly'
            ? 7
            : search.schedule_type === 'biweekly'
              ? 14
              : scheduleConfig.interval_days || 21
        )
      : '0',
  };
}

function getSourceLabels(sourceConfig: Record<string, unknown> | null | undefined) {
  if (!sourceConfig) return [];
  const labels: string[] = [];
  if (
    typeof sourceConfig.web === 'object' &&
    sourceConfig.web !== null &&
    (sourceConfig.web as Record<string, unknown>).enabled !== false
  ) {
    labels.push('Web');
  }
  if (
    typeof sourceConfig.linkedin === 'object' &&
    sourceConfig.linkedin !== null &&
    (sourceConfig.linkedin as Record<string, unknown>).enabled === true
  ) {
    labels.push('LinkedIn');
  }
  return labels;
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
  const [builderOpen, setBuilderOpen] = useState(true);

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
  const createLeadListMutation = useCreateLeadList();
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

  useEffect(() => {
    setBuilderOpen(!routeSearch.searchId);
  }, [routeSearch.searchId]);

  useEffect(() => {
    if (!linkedInAccounts.length) return;
    setForm((current) =>
      current.linkedinAccountId
        ? current
        : { ...current, linkedinAccountId: linkedInAccounts[0].id }
    );
  }, [linkedInAccounts]);

  const activeResult = useMemo(
    () => results.find((item) => item.id === activeResultId) || results[0] || null,
    [activeResultId, results]
  );
  const isRunActive = activeRun?.status === 'pending' || activeRun?.status === 'running';
  const searchSourceLabels = useMemo(
    () => getSourceLabels(activeSearch?.source_config_json as Record<string, unknown> | undefined),
    [activeSearch]
  );

  const handleFormChange = (next: Partial<DiscoveryFormState>) => {
    setForm((current) => ({ ...current, ...next }));
  };

  const handleCreateNew = () => {
    setPreview(null);
    setForm(defaultForm);
    setBuilderOpen(true);
    navigate({
      to: '/dashboard/discovery',
      search: {
        searchId: undefined,
        runId: undefined,
      },
    });
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

  const handleCreateLeadList = async (name: string) => {
    if (!workspaceId || !name.trim()) return;
    try {
      const leadList = await createLeadListMutation.mutateAsync({
        name: name.trim(),
        workspace_id: workspaceId,
        source: 'discovery',
      });
      setForm((current) => ({ ...current, destinationListId: leadList.id }));
      showSuccessToast(`Created list "${leadList.name}".`);
    } catch (error) {
      showErrorToast(error instanceof Error ? error.message : 'Unable to create lead list');
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
          `/discovery/searches/${search.id}/run?workspace_id=${workspaceId}&auto_save_to_list=true`
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
      if (mode === 'save_run') {
        showSuccessToast('Search started', 'Leads will be available on the Leads page.');
      } else {
        showSuccessToast('Discovery search saved.');
      }
      setBuilderOpen(false);
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
      showSuccessToast('Search started', 'Leads will be available on the Leads page.');
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
        {!builderOpen ? (
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleCreateNew}
              className="rounded-xl border border-[#CBD5E1] px-4 py-2.5 text-sm font-medium text-[#334155] transition hover:bg-[#F8FAFC]"
            >
              New search
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
                        <div className="flex items-center gap-2">
                          <span
                            className={`h-2.5 w-2.5 rounded-full ${routeSearch.searchId === search.id && isRunActive ? 'bg-[#F59E0B]' : search.status === 'active' ? 'bg-[#10B981]' : search.status === 'paused' ? 'bg-[#94A3B8]' : 'bg-[#CBD5E1]'}`}
                          />
                          <div className="font-medium text-[#1E293B]">{search.name}</div>
                        </div>
                        <span className="rounded-full bg-[#F1F5F9] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[#64748B]">
                          {routeSearch.searchId === search.id && isRunActive
                            ? 'running'
                            : search.status}
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-[#64748B]">
                        {search.search_type} •{' '}
                        {getSourceLabels(
                          search.source_config_json as Record<string, unknown> | undefined
                        ).join(' + ') || 'sources pending'}
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
          {!activeSearch || builderOpen ? (
            <DiscoverySearchBuilder
              form={form}
              onChange={handleFormChange}
              onPreview={handlePreview}
              onSave={handleSave}
              onCreateLeadList={handleCreateLeadList}
              preview={preview}
              isPreviewing={previewSearchMutation.isPending}
              isSaving={createSearchMutation.isPending || updateSearchMutation.isPending}
              isCreatingLeadList={createLeadListMutation.isPending}
              leadLists={leadLists}
              linkedInAccounts={linkedInAccounts}
              editingSearch={activeSearch}
            />
          ) : (
            <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-[#94A3B8]">
                    Search setup
                  </div>
                  <h2 className="mt-2 text-xl font-semibold text-[#1E293B]">{activeSearch.name}</h2>
                  <p className="mt-2 text-sm text-[#64748B]">
                    {String(
                      activeSearch.criteria_json.description ||
                        'Ready to search for qualified leads.'
                    )}
                  </p>
                  <p className="mt-2 text-xs text-[#94A3B8]">
                    Discovery always uses web search and automatically adds LinkedIn when an account
                    is connected.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleRunExistingSearch}
                    disabled={isRunActive}
                    className="rounded-xl bg-[#FF6B35] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#EA580C] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isRunActive ? 'Run in progress' : 'Run now'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setBuilderOpen(true)}
                    className="rounded-xl border border-[#CBD5E1] px-4 py-2.5 text-sm font-medium text-[#334155] transition hover:bg-[#F8FAFC]"
                  >
                    Edit setup
                  </button>
                </div>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <SetupMetaCard
                  label="Search type"
                  value={activeSearch.search_type === 'intent' ? 'Intent-based' : 'Event-driven'}
                />
                <SetupMetaCard
                  label="Sources"
                  value={searchSourceLabels.join(' + ') || 'Not configured'}
                />
                <SetupMetaCard
                  label="Destination"
                  value={
                    leadLists.find((list) => list.id === activeSearch.destination_list_id)?.name ||
                    'No destination list'
                  }
                />
                <SetupMetaCard
                  label="Schedule"
                  value={
                    activeSearch.schedule_enabled
                      ? `${activeSearch.schedule_type || 'scheduled'} in ${activeSearch.timezone}`
                      : 'Run manually'
                  }
                />
              </div>

              <div className="mt-5 flex flex-wrap gap-3 text-sm">
                <button
                  type="button"
                  onClick={handlePauseResume}
                  className="rounded-lg border border-[#CBD5E1] px-3 py-2 font-medium text-[#334155] transition hover:bg-[#F8FAFC]"
                >
                  {activeSearch.status === 'paused' ? 'Resume schedule' : 'Pause schedule'}
                </button>
                <button
                  type="button"
                  onClick={handleDuplicate}
                  className="rounded-lg border border-[#CBD5E1] px-3 py-2 font-medium text-[#334155] transition hover:bg-[#F8FAFC]"
                >
                  Duplicate search
                </button>
              </div>
            </div>
          )}

          {activeRun ? (
            <div className="space-y-4 rounded-2xl border border-[#E2E8F0] bg-white p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-[#1E293B]">Results Workspace</h2>
                  <p className="mt-1 text-sm text-[#64748B]">
                    {isRunActive
                      ? 'This run is active. Results will appear here automatically.'
                      : activeRun.error_message || 'Review, save, or dismiss discovery results.'}
                  </p>
                </div>
                {isRunActive ? null : (
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
                )}
              </div>

              {isRunActive ? (
                <RunningStatePanel
                  runStatus={activeRun.status}
                  createdAt={activeRun.created_at}
                  sourceLabels={searchSourceLabels}
                />
              ) : null}

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
                  isLoading={isRunActive}
                />
                {isRunActive ? (
                  <LoadingResultPanel />
                ) : (
                  <DiscoveryResultPanel result={activeResult} />
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-[#CBD5E1] bg-white p-8 text-sm text-[#64748B]">
              {!activeSearch
                ? 'Create your first discovery search to start a guided setup and result-review workflow.'
                : 'Run this search to open the results workspace.'}
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

function SetupMetaCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
      <div className="text-xs font-semibold uppercase tracking-wide text-[#94A3B8]">{label}</div>
      <div className="mt-2 text-sm font-medium text-[#1E293B]">{value}</div>
    </div>
  );
}

function RunningStatePanel({
  runStatus,
  createdAt,
  sourceLabels,
}: {
  runStatus: string;
  createdAt: string;
  sourceLabels: string[];
}) {
  const phaseLabel =
    runStatus === 'pending'
      ? 'Queued for processing'
      : 'Searching sources, scoring candidates, and deduplicating results';

  return (
    <div className="rounded-2xl border border-[#FCD34D] bg-[#FFFBEB] p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-[#F59E0B]" />
            <span className="text-sm font-semibold text-[#92400E]">
              {runStatus === 'pending' ? 'Run queued' : 'Run in progress'}
            </span>
          </div>
          <p className="mt-2 text-sm text-[#78350F]">{phaseLabel}</p>
          <p className="mt-2 text-xs text-[#A16207]">
            Started {new Date(createdAt).toLocaleString()}. This view refreshes automatically every
            few seconds.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {sourceLabels.map((label) => (
            <span
              key={label}
              className="rounded-full bg-white px-3 py-1 text-xs font-medium text-[#92400E]"
            >
              {label}
            </span>
          ))}
        </div>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <ProgressCard
          label="1. Collect"
          description="Pulling signals from the selected sources."
          active
        />
        <ProgressCard
          label="2. Score"
          description="Evaluating fit, freshness, and actionability."
          active={runStatus === 'running'}
        />
        <ProgressCard
          label="3. Results"
          description="Preparing the ranked workspace view."
          active={runStatus === 'running'}
        />
      </div>
    </div>
  );
}

function ProgressCard({
  label,
  description,
  active,
}: {
  label: string;
  description: string;
  active: boolean;
}) {
  return (
    <div className="rounded-2xl border border-[#FDE68A] bg-white p-4">
      <div className="text-sm font-semibold text-[#92400E]">{label}</div>
      <div className="mt-1 text-sm text-[#A16207]">{description}</div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#FEF3C7]">
        <div
          className={`h-full rounded-full ${active ? 'w-3/4 animate-pulse bg-[#F59E0B]' : 'w-1/3 bg-[#FCD34D]'}`}
        />
      </div>
    </div>
  );
}

function LoadingResultPanel() {
  return (
    <div className="space-y-5 rounded-2xl border border-[#E2E8F0] bg-white p-6">
      <div>
        <div className="h-6 w-40 animate-pulse rounded bg-[#E2E8F0]" />
        <div className="mt-2 h-4 w-56 animate-pulse rounded bg-[#F1F5F9]" />
      </div>
      <div className="space-y-3">
        <div className="h-4 w-28 animate-pulse rounded bg-[#E2E8F0]" />
        <div className="h-4 w-full animate-pulse rounded bg-[#F1F5F9]" />
        <div className="h-4 w-5/6 animate-pulse rounded bg-[#F1F5F9]" />
      </div>
      <div className="space-y-3">
        <div className="h-4 w-20 animate-pulse rounded bg-[#E2E8F0]" />
        <div className="h-10 w-full animate-pulse rounded-xl bg-[#F8FAFC]" />
        <div className="h-10 w-full animate-pulse rounded-xl bg-[#F8FAFC]" />
      </div>
    </div>
  );
}
