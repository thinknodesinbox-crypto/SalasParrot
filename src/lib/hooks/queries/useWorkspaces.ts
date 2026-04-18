import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, getErrorMessage, isApiError } from '../../api';
import { queryKeys } from '../../queryClient';
import type {
  Workspace,
  WorkspaceOnboardingState,
  WebsiteContextPreview,
  WorkspaceAgentDefaults,
  WorkspaceMember,
  WorkspaceRole,
} from '../../types';

interface CreateWorkspaceData {
  name: string;
  slug: string;
  client_name?: string;
  client_email?: string;
}

interface UpdateWorkspaceData {
  name?: string;
  slug?: string;
  client_name?: string;
  client_email?: string;
  website_url?: string | null;
  business_blurb?: string | null;
  icp?: string | null;
  outreach_intent?: string | null;
  working_hours?: {
    timezone: string;
    start: string;
    end: string;
    days: number[];
  };
  agent_defaults?: WorkspaceAgentDefaults;
}

interface InviteMemberData {
  email: string;
  role?: WorkspaceRole;
  permissions?: Record<string, boolean>;
}

interface UpdateWorkspaceOnboardingData {
  current_step?: 'business_context' | 'channel_selection' | 'channel_connection' | 'complete';
  selected_channels?: string[];
  dismiss?: boolean;
  complete?: boolean;
  mark_business_context_skipped?: boolean;
  mark_channel_selection_skipped?: boolean;
  mark_channel_connection_skipped?: boolean;
}

interface UpdateWorkspaceContextData {
  website_url?: string | null;
  business_blurb?: string | null;
  icp?: string | null;
  outreach_intent?: string | null;
  brand_tone?: string | null;
  value_proposition?: string | null;
  cta_preference?: string | null;
  reply_guardrails?: string | null;
  forbidden_claims?: string | null;
}

interface WebsiteContextPreviewData {
  website_url: string;
}

interface UpdateMemberData {
  role?: WorkspaceRole;
  permissions?: Record<string, boolean>;
  is_active?: boolean;
}

// List workspaces
export const useWorkspaces = () => {
  return useQuery<Workspace[]>({
    queryKey: queryKeys.workspaces.all,
    queryFn: async () => {
      const response = await api.get<Workspace[]>('/workspaces');
      return response.data;
    },
  });
};

// Get workspace by ID
export const useWorkspace = (workspaceId: string) => {
  return useQuery<Workspace>({
    queryKey: queryKeys.workspaces.detail(workspaceId),
    queryFn: async () => {
      const response = await api.get<Workspace>(`/workspaces/${workspaceId}`);
      return response.data;
    },
    enabled: !!workspaceId,
  });
};

export const useWorkspaceOnboarding = (workspaceId: string) => {
  return useQuery<WorkspaceOnboardingState | null>({
    queryKey: queryKeys.workspaces.onboarding(workspaceId),
    queryFn: async () => {
      try {
        const response = await api.get<WorkspaceOnboardingState>(
          `/workspaces/${workspaceId}/onboarding`
        );
        return response.data;
      } catch (error) {
        if (isApiError(error)) {
          const status = error.response?.status;
          if (status === 401 || status === 403 || status === 404 || status === 500) {
            return null;
          }
        }
        return null;
      }
    },
    enabled: !!workspaceId,
    retry: false,
    throwOnError: false,
  });
};

// Create workspace
export const useCreateWorkspace = () => {
  const queryClient = useQueryClient();

  return useMutation<Workspace, Error, CreateWorkspaceData>({
    mutationFn: async (data: CreateWorkspaceData) => {
      const response = await api.post<Workspace>('/workspaces', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.all });
    },
    onError: (error) => {
      throw new Error(getErrorMessage(error));
    },
  });
};

// Update workspace
export const useUpdateWorkspace = (workspaceId: string) => {
  const queryClient = useQueryClient();

  return useMutation<Workspace, Error, UpdateWorkspaceData>({
    mutationFn: async (data: UpdateWorkspaceData) => {
      const response = await api.patch<Workspace>(`/workspaces/${workspaceId}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.detail(workspaceId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.all });
    },
    onError: (error) => {
      throw new Error(getErrorMessage(error));
    },
  });
};

export const useUpdateWorkspaceContext = (workspaceId: string) => {
  const queryClient = useQueryClient();

  return useMutation<Workspace, Error, UpdateWorkspaceContextData>({
    mutationFn: async (data: UpdateWorkspaceContextData) => {
      const response = await api.patch<Workspace>(`/workspaces/${workspaceId}/context`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.detail(workspaceId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.onboarding(workspaceId) });
    },
    onError: (error) => {
      throw new Error(getErrorMessage(error));
    },
  });
};

export const useUpdateWorkspaceOnboarding = (workspaceId: string) => {
  const queryClient = useQueryClient();

  return useMutation<WorkspaceOnboardingState, Error, UpdateWorkspaceOnboardingData>({
    mutationFn: async (data: UpdateWorkspaceOnboardingData) => {
      const response = await api.patch<WorkspaceOnboardingState>(
        `/workspaces/${workspaceId}/onboarding`,
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.onboarding(workspaceId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.detail(workspaceId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.all });
    },
    onError: (error) => {
      throw new Error(getErrorMessage(error));
    },
  });
};

export const usePreviewWebsiteContext = (workspaceId: string) => {
  return useMutation<WebsiteContextPreview, Error, WebsiteContextPreviewData>({
    mutationFn: async (data: WebsiteContextPreviewData) => {
      const response = await api.post<WebsiteContextPreview>(
        `/workspaces/${workspaceId}/website-context-preview`,
        data
      );
      return response.data;
    },
    onError: (error) => {
      throw new Error(getErrorMessage(error));
    },
  });
};

// Delete workspace
export const useDeleteWorkspace = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (workspaceId: string) => {
      await api.delete(`/workspaces/${workspaceId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.all });
    },
    onError: (error) => {
      throw new Error(getErrorMessage(error));
    },
  });
};

// Workspace Members

export const useWorkspaceMembers = (workspaceId: string) => {
  return useQuery<WorkspaceMember[]>({
    queryKey: queryKeys.workspaces.members(workspaceId),
    queryFn: async () => {
      const response = await api.get<WorkspaceMember[]>(`/workspaces/${workspaceId}/members`);
      return response.data;
    },
    enabled: !!workspaceId,
  });
};

export const useInviteWorkspaceMember = (workspaceId: string) => {
  const queryClient = useQueryClient();

  return useMutation<WorkspaceMember, Error, InviteMemberData>({
    mutationFn: async (data: InviteMemberData) => {
      const response = await api.post<WorkspaceMember>(`/workspaces/${workspaceId}/members`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.members(workspaceId) });
    },
    onError: (error) => {
      throw new Error(getErrorMessage(error));
    },
  });
};

export const useUpdateWorkspaceMember = (workspaceId: string, memberId: string) => {
  const queryClient = useQueryClient();

  return useMutation<WorkspaceMember, Error, UpdateMemberData>({
    mutationFn: async (data: UpdateMemberData) => {
      const response = await api.patch<WorkspaceMember>(
        `/workspaces/${workspaceId}/members/${memberId}`,
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.members(workspaceId) });
    },
    onError: (error) => {
      throw new Error(getErrorMessage(error));
    },
  });
};

export const useRemoveWorkspaceMember = (workspaceId: string) => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (memberId: string) => {
      await api.delete(`/workspaces/${workspaceId}/members/${memberId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.members(workspaceId) });
    },
    onError: (error) => {
      throw new Error(getErrorMessage(error));
    },
  });
};
