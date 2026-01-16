import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, getErrorMessage } from '../../api';
import { queryKeys } from '../../queryClient';
import type {
  Lead,
  LeadList,
  LeadListResponse,
  LeadListsResponse,
  LeadStatus,
  ImportJob,
  ImportJobStartRequest,
  ImportJobStartResponse,
  ImportJobStatus,
} from '../../types';

interface LeadListFilters {
  workspace_id?: string;
}

interface LeadFilters {
  workspace_id?: string;
  campaign_id?: string;
  list_id?: string;
  status?: LeadStatus;
  search?: string;
  limit?: number;
  offset?: number;
}

interface CreateLeadData {
  linkedin_url?: string;
  first_name?: string;
  last_name?: string;
  headline?: string;
  company?: string;
  title?: string;
  email?: string;
  campaign_id?: string;
  workspace_id?: string;
  list_id?: string;
}

interface UpdateLeadData {
  first_name?: string;
  last_name?: string;
  headline?: string;
  company?: string;
  title?: string;
  email?: string;
  status?: LeadStatus;
  tags?: string[];
}

interface ImportLeadsData {
  leads: CreateLeadData[];
  campaign_id?: string;
  workspace_id?: string;
  list_id?: string;
  list_name?: string;
}

interface ImportResult {
  created: number;
  skipped: number;
  errors: string[];
}

// Lead Lists hooks
export const useLeadLists = (filters?: LeadListFilters) => {
  return useQuery({
    queryKey: queryKeys.leadLists.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.workspace_id) params.append('workspace_id', filters.workspace_id);

      const response = await api.get<LeadListsResponse>(`/leads/lists?${params}`);
      return response.data;
    },
  });
};

export const useLeadList = (listId: string) => {
  return useQuery({
    queryKey: queryKeys.leadLists.detail(listId),
    queryFn: async () => {
      const response = await api.get<LeadList>(`/leads/lists/${listId}`);
      return response.data;
    },
    enabled: !!listId,
  });
};

export const useCreateLeadList = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string; workspace_id?: string; source?: string }) => {
      const response = await api.post<LeadList>('/leads/lists', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.leadLists.all });
    },
    onError: (error) => {
      throw new Error(getErrorMessage(error));
    },
  });
};

export const useUpdateLeadList = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ listId, name }: { listId: string; name: string }) => {
      const response = await api.patch<LeadList>(`/leads/lists/${listId}`, { name });
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.leadLists.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.leadLists.detail(variables.listId) });
    },
    onError: (error) => {
      throw new Error(getErrorMessage(error));
    },
  });
};

export const useDeleteLeadList = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (listId: string) => {
      await api.delete(`/leads/lists/${listId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.leadLists.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.leads.all });
    },
    onError: (error) => {
      throw new Error(getErrorMessage(error));
    },
  });
};

// Import leads from CSV with list name
export const useImportLeadsFromCSV = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      file: File;
      list_name: string;
      campaign_id?: string;
      workspace_id?: string;
    }) => {
      const formData = new FormData();
      formData.append('file', data.file);
      formData.append('list_name', data.list_name);
      if (data.campaign_id) formData.append('campaign_id', data.campaign_id);
      if (data.workspace_id) formData.append('workspace_id', data.workspace_id);

      const response = await api.post<ImportResult>('/leads/import/csv', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.leadLists.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.leads.all });
    },
    onError: (error) => {
      throw new Error(getErrorMessage(error));
    },
  });
};

// List leads
export const useLeads = (filters?: LeadFilters) => {
  return useQuery({
    queryKey: queryKeys.leads.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.workspace_id) params.append('workspace_id', filters.workspace_id);
      if (filters?.campaign_id) params.append('campaign_id', filters.campaign_id);
      if (filters?.list_id) params.append('list_id', filters.list_id);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.search) params.append('search', filters.search);
      if (filters?.limit) params.append('limit', filters.limit.toString());
      if (filters?.offset) params.append('offset', filters.offset.toString());

      const response = await api.get<LeadListResponse>(`/leads?${params}`);
      return response.data;
    },
  });
};

// Get lead by ID
export const useLead = (leadId: string) => {
  return useQuery({
    queryKey: queryKeys.leads.detail(leadId),
    queryFn: async () => {
      const response = await api.get<Lead>(`/leads/${leadId}`);
      return response.data;
    },
    enabled: !!leadId,
  });
};

// Create lead
export const useCreateLead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateLeadData) => {
      const response = await api.post<Lead>('/leads', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.leads.all });
    },
    onError: (error) => {
      throw new Error(getErrorMessage(error));
    },
  });
};

// Update lead
export const useUpdateLead = (leadId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateLeadData) => {
      const response = await api.put<Lead>(`/leads/${leadId}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.leads.detail(leadId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.leads.all });
    },
    onError: (error) => {
      throw new Error(getErrorMessage(error));
    },
  });
};

// Delete lead
export const useDeleteLead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (leadId: string) => {
      await api.delete(`/leads/${leadId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.leads.all });
    },
    onError: (error) => {
      throw new Error(getErrorMessage(error));
    },
  });
};

// Import leads (bulk)
export const useImportLeads = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ImportLeadsData) => {
      const response = await api.post<ImportResult>('/leads/import', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.leads.all });
    },
    onError: (error) => {
      throw new Error(getErrorMessage(error));
    },
  });
};

// Delete leads (bulk)
export const useDeleteLeads = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (leadIds: string[]) => {
      await api.post('/leads/delete', { lead_ids: leadIds });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.leads.all });
    },
    onError: (error) => {
      throw new Error(getErrorMessage(error));
    },
  });
};

// Assign leads to campaign
export const useAssignLeadsToCampaign = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ leadIds, campaignId }: { leadIds: string[]; campaignId: string }) => {
      await api.post('/leads/assign-campaign', {
        lead_ids: leadIds,
        campaign_id: campaignId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.leads.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.all });
    },
    onError: (error) => {
      throw new Error(getErrorMessage(error));
    },
  });
};

// Add tags to lead
export const useAddLeadTags = (leadId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tags: string[]) => {
      const response = await api.post<Lead>(`/leads/${leadId}/tags`, { tags });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.leads.detail(leadId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.leads.all });
    },
    onError: (error) => {
      throw new Error(getErrorMessage(error));
    },
  });
};

// Remove tags from lead
export const useRemoveLeadTags = (leadId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tags: string[]) => {
      const response = await api.delete<Lead>(`/leads/${leadId}/tags`, { data: { tags } });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.leads.detail(leadId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.leads.all });
    },
    onError: (error) => {
      throw new Error(getErrorMessage(error));
    },
  });
};

// ==================
// Import Job Hooks
// ==================

interface ImportJobFilters {
  list_id?: string;
  status?: ImportJobStatus;
  limit?: number;
}

// Start a background import job
export const useStartImport = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ImportJobStartRequest) => {
      const response = await api.post<ImportJobStartResponse>('/leads/import/start', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.leadLists.all });
      queryClient.invalidateQueries({ queryKey: ['importJobs'] });
    },
    onError: (error) => {
      throw new Error(getErrorMessage(error));
    },
  });
};

// List import jobs
export const useImportJobs = (filters?: ImportJobFilters) => {
  return useQuery({
    queryKey: ['importJobs', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.list_id) params.append('list_id', filters.list_id);
      if (filters?.status) params.append('status_filter', filters.status);
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const response = await api.get<ImportJob[]>(`/leads/import/jobs?${params}`);
      return response.data;
    },
  });
};

// Get a single import job status (for polling)
export const useImportJobStatus = (
  jobId: string,
  enabled = true,
  refetchInterval: number | false = false
) => {
  return useQuery({
    queryKey: ['importJob', jobId],
    queryFn: async () => {
      const response = await api.get<ImportJob>(`/leads/import/jobs/${jobId}`);
      return response.data;
    },
    enabled: !!jobId && enabled,
    refetchInterval: refetchInterval,
  });
};

// Cancel an import job
export const useCancelImport = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (jobId: string) => {
      await api.post(`/leads/import/jobs/${jobId}/cancel`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['importJobs'] });
      queryClient.invalidateQueries({ queryKey: ['importJob'] });
    },
    onError: (error) => {
      throw new Error(getErrorMessage(error));
    },
  });
};
