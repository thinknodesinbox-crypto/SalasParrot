import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, getErrorMessage } from '../../api';
import { queryKeys } from '../../queryClient';
import type {
  WorkspaceInvitation,
  InvitationValidation,
  AcceptInvitationRequest,
  AcceptInvitationResponse,
  CreateInvitationRequest,
} from '../../types';

// ============================================================================
// Public Invitation Hooks (no auth required for validate)
// ============================================================================

/**
 * Validate an invitation token (public endpoint)
 */
export const useValidateInvitation = (token: string) => {
  return useQuery({
    queryKey: queryKeys.invitations.validate(token),
    queryFn: async () => {
      const response = await api.get<InvitationValidation>(`/invitations/validate/${token}`);
      return response.data;
    },
    enabled: !!token,
    retry: false,
  });
};

/**
 * Accept an invitation
 */
export const useAcceptInvitation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ token, data }: { token: string; data?: AcceptInvitationRequest }) => {
      const response = await api.post<AcceptInvitationResponse>(
        `/invitations/accept/${token}`,
        data || {}
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.invitations.pending });
    },
    onError: (error) => {
      throw new Error(getErrorMessage(error));
    },
  });
};

/**
 * Decline an invitation
 */
export const useDeclineInvitation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (token: string) => {
      await api.post(`/invitations/decline/${token}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.invitations.pending });
    },
    onError: (error) => {
      throw new Error(getErrorMessage(error));
    },
  });
};

/**
 * Get current user's pending invitations
 */
export const usePendingInvitations = () => {
  return useQuery({
    queryKey: queryKeys.invitations.pending,
    queryFn: async () => {
      const response = await api.get<WorkspaceInvitation[]>('/invitations/pending');
      return response.data;
    },
  });
};

// ============================================================================
// Workspace-Scoped Invitation Hooks (auth required)
// ============================================================================

/**
 * Get all invitations for a workspace
 */
export const useWorkspaceInvitations = (workspaceId: string) => {
  return useQuery({
    queryKey: queryKeys.workspaces.invitations(workspaceId),
    queryFn: async () => {
      const response = await api.get<WorkspaceInvitation[]>(
        `/workspaces/${workspaceId}/invitations`
      );
      return response.data;
    },
    enabled: !!workspaceId,
  });
};

/**
 * Create a new invitation
 */
export const useCreateInvitation = (workspaceId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateInvitationRequest) => {
      const response = await api.post<WorkspaceInvitation>(
        `/workspaces/${workspaceId}/invitations`,
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.workspaces.invitations(workspaceId),
      });
    },
    onError: (error) => {
      throw new Error(getErrorMessage(error));
    },
  });
};

/**
 * Revoke (cancel) an invitation
 */
export const useRevokeInvitation = (workspaceId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invitationId: string) => {
      await api.delete(`/workspaces/${workspaceId}/invitations/${invitationId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.workspaces.invitations(workspaceId),
      });
    },
    onError: (error) => {
      throw new Error(getErrorMessage(error));
    },
  });
};

/**
 * Resend an invitation email
 */
export const useResendInvitation = (workspaceId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invitationId: string) => {
      const response = await api.post<WorkspaceInvitation>(
        `/workspaces/${workspaceId}/invitations/${invitationId}/resend`
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.workspaces.invitations(workspaceId),
      });
    },
    onError: (error) => {
      throw new Error(getErrorMessage(error));
    },
  });
};
