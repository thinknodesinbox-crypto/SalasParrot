import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, getErrorMessage } from '../../api';
import { queryKeys } from '../../queryClient';
import type { Workspace, WorkspaceMember, WorkspaceRole } from '../../types';

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
}

interface InviteMemberData {
  email: string;
  role?: WorkspaceRole;
  permissions?: Record<string, boolean>;
}

interface UpdateMemberData {
  role?: WorkspaceRole;
  permissions?: Record<string, boolean>;
  is_active?: boolean;
}

// List workspaces
export const useWorkspaces = () => {
  return useQuery({
    queryKey: queryKeys.workspaces.all,
    queryFn: async () => {
      const response = await api.get<Workspace[]>('/workspaces');
      return response.data;
    },
  });
};

// Get workspace by ID
export const useWorkspace = (workspaceId: string) => {
  return useQuery({
    queryKey: queryKeys.workspaces.detail(workspaceId),
    queryFn: async () => {
      const response = await api.get<Workspace>(`/workspaces/${workspaceId}`);
      return response.data;
    },
    enabled: !!workspaceId,
  });
};

// Create workspace
export const useCreateWorkspace = () => {
  const queryClient = useQueryClient();

  return useMutation({
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

  return useMutation({
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

// Delete workspace
export const useDeleteWorkspace = () => {
  const queryClient = useQueryClient();

  return useMutation({
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
  return useQuery({
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

  return useMutation({
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

  return useMutation({
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

  return useMutation({
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
