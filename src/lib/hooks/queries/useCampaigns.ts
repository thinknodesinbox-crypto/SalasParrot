import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, getErrorMessage } from '../../api';
import { queryKeys } from '../../queryClient';
import type {
  Campaign,
  CampaignWithDetails,
  CampaignStep,
  CampaignSender,
  CampaignStatus,
  StepType,
} from '../../types';

interface CampaignFilters {
  workspace_id?: string;
  status?: CampaignStatus;
  limit?: number;
  offset?: number;
}

interface CreateCampaignData {
  name: string;
  workspace_id?: string;
}

interface UpdateCampaignData {
  name?: string;
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
  return useQuery({
    queryKey: queryKeys.campaigns.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.workspace_id) params.append('workspace_id', filters.workspace_id);
      if (filters?.status) params.append('status', filters.status);
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
      const response = await api.put<Campaign>(`/campaigns/${campaignId}`, data);
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
      const response = await api.put<CampaignStep>(
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
