import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

// ============================================================================
// Types
// ============================================================================

export interface PipedriveConnectionStatus {
  connected: boolean;
  status: string | null;
  company_domain: string | null;
  company_id: string | null;
  sync_enabled: boolean | null;
  sync_contacts: boolean | null;
  sync_activities: boolean | null;
  auto_create_contacts: boolean | null;
  last_synced_at: string | null;
  last_error: string | null;
}

export interface PipedriveOAuthInit {
  authorization_url: string;
  state: string;
}

export interface PipedriveSyncSettings {
  sync_enabled?: boolean;
  sync_contacts?: boolean;
  sync_activities?: boolean;
  auto_create_contacts?: boolean;
}

export interface PipedriveSyncLog {
  id: string;
  operation: string;
  direction: string;
  lead_id: string | null;
  pipedrive_person_id: string | null;
  event_type: string | null;
  success: boolean;
  error_message: string | null;
  created_at: string;
  duration_ms: number | null;
}

export interface PipedriveManualSyncResponse {
  success: boolean;
  pipedrive_person_id: string | null;
  message: string | null;
}

// ============================================================================
// Query Keys
// ============================================================================

export const pipedriveKeys = {
  all: ['pipedrive'] as const,
  status: () => [...pipedriveKeys.all, 'status'] as const,
  syncLogs: (params?: { limit?: number; offset?: number }) =>
    [...pipedriveKeys.all, 'sync-logs', params] as const,
};

// ============================================================================
// Queries
// ============================================================================

export function usePipedriveStatus() {
  return useQuery({
    queryKey: pipedriveKeys.status(),
    queryFn: async () => {
      const res = await api.get('/pipedrive/status');
      return res.data as PipedriveConnectionStatus;
    },
  });
}

export function usePipedriveSyncLogs(options?: { limit?: number; offset?: number }) {
  return useQuery({
    queryKey: pipedriveKeys.syncLogs(options),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (options?.limit) params.set('limit', String(options.limit));
      if (options?.offset) params.set('offset', String(options.offset));

      const res = await api.get(`/pipedrive/sync-logs${params.toString() ? `?${params}` : ''}`);
      return res.data as PipedriveSyncLog[];
    },
  });
}

// ============================================================================
// Mutations
// ============================================================================

export function useConnectPipedrive() {
  return useMutation({
    mutationFn: async (workspaceId?: string) => {
      const params = workspaceId ? `?workspace_id=${workspaceId}` : '';
      const res = await api.post(`/pipedrive/connect${params}`);
      return res.data as PipedriveOAuthInit;
    },
  });
}

export function useDisconnectPipedrive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await api.post('/pipedrive/disconnect');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pipedriveKeys.status() });
    },
  });
}

export function useUpdatePipedriveSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: PipedriveSyncSettings) => {
      const res = await api.patch('/pipedrive/settings', settings);
      return res.data as PipedriveConnectionStatus;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pipedriveKeys.status() });
    },
  });
}

export function useSyncLeadToPipedrive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (leadId: string) => {
      const res = await api.post(`/pipedrive/sync-lead/${leadId}`);
      return res.data as PipedriveManualSyncResponse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pipedriveKeys.syncLogs() });
    },
  });
}

export function useTestPipedriveConnection() {
  return useMutation({
    mutationFn: async () => {
      const res = await api.post('/pipedrive/test');
      return res.data as {
        success: boolean;
        message: string;
        user_name?: string;
        company?: string;
      };
    },
  });
}
