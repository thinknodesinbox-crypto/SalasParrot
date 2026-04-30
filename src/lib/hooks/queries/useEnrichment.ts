import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, getErrorMessage } from '../../api';
import { queryKeys } from '../../queryClient';
import type {
  EnrichmentJob,
  EnrichmentJobStatus,
  EnrichLeadsRequest,
  EnrichLeadsResponse,
  WorkspaceEnrichmentUsage,
} from '../../types';

interface EnrichmentJobFilters {
  workspace_id?: string;
  status?: EnrichmentJobStatus;
  limit?: number;
}

// Start enrichment for selected leads
export const useEnrichLeads = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: EnrichLeadsRequest) => {
      const response = await api.post<EnrichLeadsResponse>('/leads/enrich', {
        lead_ids: data.lead_ids,
        workspace_id: data.workspace_id,
        list_id: data.list_id,
      } as EnrichLeadsRequest);
      return response.data;
    },
    onSuccess: (_, variables) => {
      // Invalidate leads to show updated enrichment_status
      queryClient.invalidateQueries({ queryKey: queryKeys.leads.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.leadLists.all });
      queryClient.invalidateQueries({ queryKey: ['enrichmentJobs'] });
      if (variables.workspace_id) {
        queryClient.invalidateQueries({
          queryKey: ['enrichmentUsage', variables.workspace_id],
        });
      }
    },
    onError: (error) => {
      throw new Error(getErrorMessage(error));
    },
  });
};

// List enrichment jobs
export const useEnrichmentJobs = (filters?: EnrichmentJobFilters) => {
  return useQuery({
    queryKey: ['enrichmentJobs', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.workspace_id) params.append('workspace_id', filters.workspace_id);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const response = await api.get<EnrichmentJob[]>(`/enrichment/jobs?${params}`);
      return response.data;
    },
  });
};

// Get a single enrichment job status (for polling)
export const useEnrichmentJobStatus = (
  jobId: string,
  enabled = true,
  refetchInterval: number | false = false
) => {
  return useQuery({
    queryKey: ['enrichmentJob', jobId],
    queryFn: async () => {
      const response = await api.get<EnrichmentJob>(`/enrichment/jobs/${jobId}`);
      return response.data;
    },
    enabled: !!jobId && enabled,
    refetchInterval: refetchInterval,
  });
};

// Hook with automatic polling that stops when job is complete
export const useEnrichmentJobWithPolling = (jobId: string | null) => {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['enrichmentJob', jobId],
    queryFn: async () => {
      const response = await api.get<EnrichmentJob>(`/enrichment/jobs/${jobId}`);
      return response.data;
    },
    enabled: !!jobId,
    refetchInterval: (query) => {
      const data = query.state.data;
      // Stop polling when job is completed or failed
      if (data?.status === 'completed' || data?.status === 'failed') {
        // Invalidate leads to show updated data
        queryClient.invalidateQueries({ queryKey: queryKeys.leads.all });
        queryClient.invalidateQueries({ queryKey: queryKeys.leadLists.all });
        queryClient.invalidateQueries({ queryKey: ['enrichmentUsage'] });
        return false;
      }
      // Poll every 3 seconds while processing
      return 3000;
    },
  });
};

export const useEnrichmentUsage = (workspaceId?: string | null) => {
  return useQuery({
    queryKey: ['enrichmentUsage', workspaceId],
    queryFn: async () => {
      const response = await api.get<WorkspaceEnrichmentUsage>(
        `/enrichment/usage?workspace_id=${workspaceId}`
      );
      return response.data;
    },
    enabled: !!workspaceId,
  });
};
