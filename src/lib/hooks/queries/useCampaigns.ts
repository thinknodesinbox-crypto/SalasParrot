import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, getErrorMessage } from '../../api';
import { queryKeys } from '../../queryClient';
import { useWorkspaceStore } from '../../workspace';
import type {
  Campaign,
  CampaignTestRun,
  CampaignTestRunDetail,
  CampaignWithDetails,
  CampaignStep,
  CampaignSender,
  CampaignStatus,
  CampaignTestRecipientInput,
  StepType,
  SequenceTemplate,
} from '../../types';

interface CampaignFilters {
  workspace_id?: string;
  status?: CampaignStatus;
  limit?: number;
  offset?: number;
}

interface CreateCampaignData {
  name: string;
  workspace_id: string; // Required - campaigns must belong to a workspace
  daily_email_limit?: number | null;
}

interface UpdateCampaignData {
  name?: string;
  pause_new_sends?: boolean;
  daily_connection_limit?: number | null;
  daily_email_limit?: number | null;
}

interface CreateStepData {
  order: number;
  type: StepType;
  config: Record<string, unknown>;
}

interface UpdateStepData {
  order?: number;
  type?: StepType;
  config?: Record<string, unknown>;
  true_branch_step_id?: string | null;
  false_branch_step_id?: string | null;
}

interface CreateSenderData {
  linkedin_account_id: string;
  email_account_id?: string;
}

// List campaigns
export const useCampaigns = (filters?: CampaignFilters) => {
  const currentWorkspaceId = useWorkspaceStore((s) => s.currentWorkspaceId);
  const workspaceId = filters?.workspace_id ?? currentWorkspaceId ?? undefined;

  return useQuery({
    queryKey: queryKeys.campaigns.list({
      ...filters,
      workspace_id: workspaceId,
    }),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (workspaceId) params.append('workspace_id', workspaceId);
      if (filters?.status) params.append('status_filter', filters.status);
      if (filters?.limit) params.append('limit', filters.limit.toString());
      if (filters?.offset) params.append('offset', filters.offset.toString());

      const response = await api.get<Campaign[]>(`/campaigns?${params}`);
      return response.data;
    },
  });
};

// Get campaign by ID
export const useCampaign = (campaignId: string) => {
  return useQuery({
    queryKey: queryKeys.campaigns.detail(campaignId),
    queryFn: async () => {
      const response = await api.get<CampaignWithDetails>(`/campaigns/${campaignId}`);
      return response.data;
    },
    enabled: !!campaignId,
  });
};

// Create campaign
export const useCreateCampaign = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateCampaignData) => {
      const response = await api.post<Campaign>('/campaigns', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.all });
    },
    onError: (error) => {
      throw new Error(getErrorMessage(error));
    },
  });
};

// Update campaign
export const useUpdateCampaign = (campaignId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateCampaignData) => {
      const response = await api.patch<Campaign>(`/campaigns/${campaignId}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.detail(campaignId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.all });
    },
  });
};

// Delete campaign
export const useDeleteCampaign = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (campaignId: string) => {
      await api.delete(`/campaigns/${campaignId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.all });
    },
    onError: (error) => {
      throw new Error(getErrorMessage(error));
    },
  });
};

// Start campaign
export const useStartCampaign = (campaignId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await api.post<Campaign>(`/campaigns/${campaignId}/start`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.detail(campaignId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.all });
    },
    onError: (error) => {
      throw new Error(getErrorMessage(error));
    },
  });
};

// Pause campaign
export const usePauseCampaign = (campaignId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await api.post<Campaign>(`/campaigns/${campaignId}/pause`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.detail(campaignId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.all });
    },
    onError: (error) => {
      throw new Error(getErrorMessage(error));
    },
  });
};

// Stop campaign
export const useStopCampaign = (campaignId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await api.post<Campaign>(`/campaigns/${campaignId}/stop`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.detail(campaignId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.all });
    },
    onError: (error) => {
      throw new Error(getErrorMessage(error));
    },
  });
};

// Resume campaign
export const useResumeCampaign = (campaignId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await api.post<Campaign>(`/campaigns/${campaignId}/resume`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.detail(campaignId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.all });
    },
    onError: (error) => {
      throw new Error(getErrorMessage(error));
    },
  });
};

// Clone campaign
export const useCloneCampaign = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ campaignId, name }: { campaignId: string; name: string }) => {
      const response = await api.post<Campaign>(`/campaigns/${campaignId}/clone`, { name });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.all });
    },
    onError: (error) => {
      throw new Error(getErrorMessage(error));
    },
  });
};

// Campaign steps
export const useCampaignSteps = (campaignId: string) => {
  return useQuery({
    queryKey: queryKeys.campaigns.steps(campaignId),
    queryFn: async () => {
      const response = await api.get<CampaignStep[]>(`/campaigns/${campaignId}/steps`);
      return response.data;
    },
    enabled: !!campaignId,
  });
};

export const useCreateCampaignStep = (campaignId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateStepData) => {
      const response = await api.post<CampaignStep>(`/campaigns/${campaignId}/steps`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.steps(campaignId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.detail(campaignId) });
    },
    onError: (error) => {
      throw new Error(getErrorMessage(error));
    },
  });
};

export const useUpdateCampaignStep = (campaignId: string, stepId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateStepData) => {
      const response = await api.patch<CampaignStep>(
        `/campaigns/${campaignId}/steps/${stepId}`,
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.steps(campaignId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.detail(campaignId) });
    },
    onError: (error) => {
      throw new Error(getErrorMessage(error));
    },
  });
};

export const useDeleteCampaignStep = (campaignId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (stepId: string) => {
      await api.delete(`/campaigns/${campaignId}/steps/${stepId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.steps(campaignId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.detail(campaignId) });
    },
    onError: (error) => {
      throw new Error(getErrorMessage(error));
    },
  });
};

// Campaign senders
export const useCampaignSenders = (campaignId: string) => {
  return useQuery({
    queryKey: queryKeys.campaigns.senders(campaignId),
    queryFn: async () => {
      const response = await api.get<CampaignSender[]>(`/campaigns/${campaignId}/senders`);
      return response.data;
    },
    enabled: !!campaignId,
  });
};

export const useAddCampaignSender = (campaignId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateSenderData) => {
      const response = await api.post<CampaignSender>(`/campaigns/${campaignId}/senders`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.senders(campaignId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.detail(campaignId) });
    },
    onError: (error) => {
      throw new Error(getErrorMessage(error));
    },
  });
};

export const useRemoveCampaignSender = (campaignId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (senderId: string) => {
      await api.delete(`/campaigns/${campaignId}/senders/${senderId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.senders(campaignId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.detail(campaignId) });
    },
    onError: (error) => {
      throw new Error(getErrorMessage(error));
    },
  });
};

// Lead availability
export interface LeadAvailability {
  total: number;
  available: number;
  in_active_campaigns: number;
}

export const useLeadAvailabilityPreview = (listId: string | null) => {
  return useQuery({
    queryKey: ['campaigns', 'lead-availability', listId],
    queryFn: async () => {
      if (!listId) return null;
      const response = await api.get<LeadAvailability>(
        `/campaigns/leads/preview?list_id=${listId}`
      );
      return response.data;
    },
    enabled: !!listId,
  });
};

export const useCampaignTestRuns = (campaignId: string) => {
  return useQuery({
    queryKey: queryKeys.campaigns.testRuns(campaignId),
    queryFn: async () => {
      const response = await api.get<CampaignTestRun[]>(`/campaigns/${campaignId}/test-runs`);
      return response.data;
    },
    enabled: !!campaignId,
  });
};

export const useCampaignTestRun = (campaignId: string, testRunId: string | null) => {
  return useQuery({
    queryKey: queryKeys.campaigns.testRun(campaignId, testRunId || ''),
    queryFn: async () => {
      const response = await api.get<CampaignTestRunDetail>(
        `/campaigns/${campaignId}/test-runs/${testRunId}`
      );
      return response.data;
    },
    enabled: !!campaignId && !!testRunId,
  });
};

export const useSendCampaignTestRun = (campaignId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (recipients: CampaignTestRecipientInput[]) => {
      const response = await api.post<CampaignTestRunDetail>(`/campaigns/${campaignId}/test-runs`, {
        recipients,
      });
      return response.data;
    },
    onSuccess: (run) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.testRuns(campaignId) });
      queryClient.setQueryData(queryKeys.campaigns.testRun(campaignId, run.id), run);
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.detail(campaignId) });
    },
    onError: (error) => {
      throw new Error(getErrorMessage(error));
    },
  });
};

// Sequence Templates

export const useSequenceTemplates = () => {
  return useQuery({
    queryKey: queryKeys.campaigns.sequenceTemplates,
    queryFn: async () => {
      const response = await api.get<SequenceTemplate[]>('/campaigns/sequence-templates');
      return response.data;
    },
  });
};

export const useSaveSequenceTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string; description?: string; nodes: unknown[] }) => {
      const response = await api.post<SequenceTemplate>('/campaigns/sequence-templates', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.sequenceTemplates });
    },
    onError: (error) => {
      throw new Error(getErrorMessage(error));
    },
  });
};

export const useDeleteSequenceTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (templateId: string) => {
      await api.delete(`/campaigns/sequence-templates/${templateId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.sequenceTemplates });
    },
    onError: (error) => {
      throw new Error(getErrorMessage(error));
    },
  });
};
