import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, getErrorMessage } from '../../api';
import { queryKeys } from '../../queryClient';
import type {
  DiscoveryBulkActionResponse,
  DiscoveryResult,
  DiscoveryResultListResponse,
  DiscoveryResultStatus,
  DiscoveryRun,
  DiscoveryRunListResponse,
  DiscoverySearchCreateRequest,
  DiscoverySearchListResponse,
  DiscoverySearchPreview,
  DiscoverySearchPreviewRequest,
  DiscoverySearchStatus,
  DiscoverySearchUpdateRequest,
  SavedDiscoverySearch,
} from '../../types';

function invalidateDiscoveryResults(
  queryClient: ReturnType<typeof useQueryClient>,
  workspaceId: string | null | undefined,
  runId: string | null | undefined
) {
  return queryClient.invalidateQueries({
    queryKey: ['discovery', 'results', workspaceId, runId],
  });
}

export const useDiscoverySearches = (
  workspaceId: string | null | undefined,
  status?: DiscoverySearchStatus | null
) => {
  return useQuery<SavedDiscoverySearch[]>({
    queryKey: queryKeys.discovery.searches(workspaceId, { status }),
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('workspace_id', workspaceId || '');
      if (status) params.append('status', status);
      const response = await api.get<DiscoverySearchListResponse>(`/discovery/searches?${params}`);
      return response.data.items;
    },
    enabled: !!workspaceId,
  });
};

export const useDiscoverySearch = (
  workspaceId: string | null | undefined,
  searchId: string | null | undefined
) => {
  return useQuery<SavedDiscoverySearch>({
    queryKey: queryKeys.discovery.search(workspaceId, searchId),
    queryFn: async () => {
      const response = await api.get<SavedDiscoverySearch>(
        `/discovery/searches/${searchId}?workspace_id=${workspaceId}`
      );
      return response.data;
    },
    enabled: !!workspaceId && !!searchId,
  });
};

export const usePreviewDiscoverySearch = () => {
  return useMutation<DiscoverySearchPreview, Error, DiscoverySearchPreviewRequest>({
    mutationFn: async (data) => {
      const response = await api.post<DiscoverySearchPreview>('/discovery/searches/preview', data);
      return response.data;
    },
    onError: (error) => {
      throw new Error(getErrorMessage(error));
    },
  });
};

export const useCreateDiscoverySearch = () => {
  const queryClient = useQueryClient();
  return useMutation<SavedDiscoverySearch, Error, DiscoverySearchCreateRequest>({
    mutationFn: async (data) => {
      const response = await api.post<SavedDiscoverySearch>('/discovery/searches', data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.discovery.searches(data.workspace_id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.discovery.search(data.workspace_id, data.id),
      });
    },
    onError: (error) => {
      throw new Error(getErrorMessage(error));
    },
  });
};

export const useUpdateDiscoverySearch = (
  workspaceId: string | null | undefined,
  searchId: string | null | undefined
) => {
  const queryClient = useQueryClient();
  return useMutation<SavedDiscoverySearch, Error, DiscoverySearchUpdateRequest>({
    mutationFn: async (data) => {
      const response = await api.patch<SavedDiscoverySearch>(
        `/discovery/searches/${searchId}?workspace_id=${workspaceId}`,
        data
      );
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.discovery.searches(workspaceId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.discovery.search(workspaceId, searchId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.discovery.search(workspaceId, data.id),
      });
    },
    onError: (error) => {
      throw new Error(getErrorMessage(error));
    },
  });
};

export const useDuplicateDiscoverySearch = (
  workspaceId: string | null | undefined,
  searchId: string | null | undefined
) => {
  const queryClient = useQueryClient();
  return useMutation<SavedDiscoverySearch, Error, void>({
    mutationFn: async () => {
      const response = await api.post<SavedDiscoverySearch>(
        `/discovery/searches/${searchId}/duplicate?workspace_id=${workspaceId}`
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.discovery.searches(workspaceId),
      });
    },
    onError: (error) => {
      throw new Error(getErrorMessage(error));
    },
  });
};

export const usePauseDiscoverySearch = (
  workspaceId: string | null | undefined,
  searchId: string | null | undefined
) => {
  const queryClient = useQueryClient();
  return useMutation<SavedDiscoverySearch, Error, void>({
    mutationFn: async () => {
      const response = await api.post<SavedDiscoverySearch>(
        `/discovery/searches/${searchId}/pause?workspace_id=${workspaceId}`
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.discovery.searches(workspaceId) });
      queryClient.invalidateQueries({
        queryKey: queryKeys.discovery.search(workspaceId, searchId),
      });
    },
    onError: (error) => {
      throw new Error(getErrorMessage(error));
    },
  });
};

export const useResumeDiscoverySearch = (
  workspaceId: string | null | undefined,
  searchId: string | null | undefined
) => {
  const queryClient = useQueryClient();
  return useMutation<SavedDiscoverySearch, Error, void>({
    mutationFn: async () => {
      const response = await api.post<SavedDiscoverySearch>(
        `/discovery/searches/${searchId}/resume?workspace_id=${workspaceId}`
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.discovery.searches(workspaceId) });
      queryClient.invalidateQueries({
        queryKey: queryKeys.discovery.search(workspaceId, searchId),
      });
    },
    onError: (error) => {
      throw new Error(getErrorMessage(error));
    },
  });
};

export const useRunDiscoverySearch = (
  workspaceId: string | null | undefined,
  searchId: string | null | undefined
) => {
  const queryClient = useQueryClient();
  return useMutation<DiscoveryRun, Error, void>({
    mutationFn: async () => {
      const response = await api.post<DiscoveryRun>(
        `/discovery/searches/${searchId}/run?workspace_id=${workspaceId}&auto_save_to_list=true`
      );
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.discovery.runs(workspaceId, searchId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.discovery.run(workspaceId, data.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.discovery.searches(workspaceId) });
      queryClient.invalidateQueries({
        queryKey: queryKeys.discovery.search(workspaceId, searchId),
      });
    },
    onError: (error) => {
      throw new Error(getErrorMessage(error));
    },
  });
};

export const useDiscoveryRuns = (
  workspaceId: string | null | undefined,
  searchId: string | null | undefined
) => {
  return useQuery<DiscoveryRun[]>({
    queryKey: queryKeys.discovery.runs(workspaceId, searchId),
    queryFn: async () => {
      const response = await api.get<DiscoveryRunListResponse>(
        `/discovery/searches/${searchId}/runs?workspace_id=${workspaceId}`
      );
      return response.data.items;
    },
    enabled: !!workspaceId && !!searchId,
  });
};

export const useDiscoveryRun = (
  workspaceId: string | null | undefined,
  runId: string | null | undefined
) => {
  return useQuery<DiscoveryRun>({
    queryKey: queryKeys.discovery.run(workspaceId, runId),
    queryFn: async () => {
      const response = await api.get<DiscoveryRun>(
        `/discovery/runs/${runId}?workspace_id=${workspaceId}`
      );
      return response.data;
    },
    enabled: !!workspaceId && !!runId,
    refetchInterval: (query) => {
      const data = query.state.data as DiscoveryRun | undefined;
      return data && ['pending', 'running'].includes(data.status) ? 3000 : false;
    },
  });
};

export const useDiscoveryRunResults = (
  workspaceId: string | null | undefined,
  runId: string | null | undefined,
  status?: DiscoveryResultStatus | null
) => {
  return useQuery<DiscoveryResult[]>({
    queryKey: queryKeys.discovery.results(workspaceId, runId, status ?? null),
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('workspace_id', workspaceId || '');
      if (status) params.append('status', status);
      const response = await api.get<DiscoveryResultListResponse>(
        `/discovery/runs/${runId}/results?${params}`
      );
      return response.data.items;
    },
    enabled: !!workspaceId && !!runId,
    refetchInterval: 3000,
  });
};

export const useSaveDiscoveryResultsToList = (
  workspaceId: string | null | undefined,
  runId: string | null | undefined
) => {
  const queryClient = useQueryClient();
  return useMutation<
    DiscoveryBulkActionResponse,
    Error,
    { result_ids?: string[]; destination_list_id?: string | null }
  >({
    mutationFn: async (data) => {
      const response = await api.post<DiscoveryBulkActionResponse>(
        `/discovery/runs/${runId}/results/save-to-list?workspace_id=${workspaceId}`,
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.discovery.run(workspaceId, runId) });
      invalidateDiscoveryResults(queryClient, workspaceId, runId);
      queryClient.invalidateQueries({ queryKey: queryKeys.leads.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.leadLists.all });
    },
    onError: (error) => {
      throw new Error(getErrorMessage(error));
    },
  });
};

export const useDismissDiscoveryResults = (
  workspaceId: string | null | undefined,
  runId: string | null | undefined
) => {
  const queryClient = useQueryClient();
  return useMutation<DiscoveryBulkActionResponse, Error, { result_ids: string[] }>({
    mutationFn: async (data) => {
      const response = await api.post<DiscoveryBulkActionResponse>(
        `/discovery/runs/${runId}/results/dismiss?workspace_id=${workspaceId}`,
        data
      );
      return response.data;
    },
    onSuccess: () => {
      invalidateDiscoveryResults(queryClient, workspaceId, runId);
      queryClient.invalidateQueries({ queryKey: queryKeys.discovery.run(workspaceId, runId) });
    },
    onError: (error) => {
      throw new Error(getErrorMessage(error));
    },
  });
};
