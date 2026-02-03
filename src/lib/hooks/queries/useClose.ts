import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

// ============================================================================
// Types
// ============================================================================

export interface CloseConnectionStatus {
  connected: boolean;
  status: string | null;
  organization_name: string | null;
  organization_id: string | null;
  sync_enabled: boolean | null;
  sync_contacts: boolean | null;
  sync_activities: boolean | null;
  auto_create_contacts: boolean | null;
  last_synced_at: string | null;
  last_error: string | null;
}

export interface CloseSyncSettings {
  sync_enabled?: boolean;
  sync_contacts?: boolean;
  sync_activities?: boolean;
  auto_create_contacts?: boolean;
}

export interface CloseSyncLog {
  id: string;
  operation: string;
  direction: string;
  lead_id: string | null;
  close_lead_id: string | null;
  event_type: string | null;
  success: boolean;
  error_message: string | null;
  created_at: string;
  duration_ms: number | null;
}

export interface CloseManualSyncResponse {
  success: boolean;
  close_lead_id: string | null;
  message: string | null;
}

// ============================================================================
// Query Keys
// ============================================================================

export const closeKeys = {
  all: ['close'] as const,
  status: () => [...closeKeys.all, 'status'] as const,
  syncLogs: (params?: { limit?: number; offset?: number }) =>
    [...closeKeys.all, 'sync-logs', params] as const,
};

// ============================================================================
// Queries
// ============================================================================

export function useCloseStatus() {
  return useQuery({
    queryKey: closeKeys.status(),
    queryFn: async () => {
      const res = await api.get('/close/status');
      return res.data as CloseConnectionStatus;
    },
  });
}

export function useCloseSyncLogs(options?: { limit?: number; offset?: number }) {
  return useQuery({
    queryKey: closeKeys.syncLogs(options),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (options?.limit) params.set('limit', String(options.limit));
      if (options?.offset) params.set('offset', String(options.offset));

      const res = await api.get(`/close/sync-logs${params.toString() ? `?${params}` : ''}`);
      return res.data as CloseSyncLog[];
    },
  });
}

// ============================================================================
// Mutations
// ============================================================================

export function useConnectClose() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ apiKey, workspaceId }: { apiKey: string; workspaceId?: string }) => {
      const params = workspaceId ? `?workspace_id=${workspaceId}` : '';
      const res = await api.post(`/close/connect${params}`, { api_key: apiKey });
      return res.data as CloseConnectionStatus;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: closeKeys.status() });
    },
  });
}

export function useDisconnectClose() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await api.post('/close/disconnect');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: closeKeys.status() });
    },
  });
}

export function useUpdateCloseSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: CloseSyncSettings) => {
      const res = await api.patch('/close/settings', settings);
      return res.data as CloseConnectionStatus;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: closeKeys.status() });
    },
  });
}

export function useSyncLeadToClose() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (leadId: string) => {
      const res = await api.post(`/close/sync-lead/${leadId}`);
      return res.data as CloseManualSyncResponse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: closeKeys.syncLogs() });
    },
  });
}

export function useTestCloseConnection() {
  return useMutation({
    mutationFn: async () => {
      const res = await api.post('/close/test');
      return res.data as { success: boolean; message: string; user_name?: string; email?: string };
    },
  });
}
