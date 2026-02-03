import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

// ============================================================================
// Types
// ============================================================================

export interface HubSpotConnectionStatus {
  connected: boolean;
  status: string | null;
  hub_domain: string | null;
  portal_id: string | null;
  sync_enabled: boolean | null;
  sync_contacts: boolean | null;
  sync_activities: boolean | null;
  auto_create_contacts: boolean | null;
  last_synced_at: string | null;
  last_error: string | null;
}

export interface HubSpotOAuthInit {
  authorization_url: string;
  state: string;
}

export interface HubSpotSyncSettings {
  sync_enabled?: boolean;
  sync_direction?: 'to_hubspot' | 'from_hubspot' | 'bidirectional';
  sync_contacts?: boolean;
  sync_activities?: boolean;
  auto_create_contacts?: boolean;
  default_pipeline_id?: string;
  status_to_stage_mapping?: Record<string, string>;
}

export interface HubSpotSyncLog {
  id: string;
  operation: string;
  direction: string;
  lead_id: string | null;
  hubspot_contact_id: string | null;
  event_type: string | null;
  success: boolean;
  error_message: string | null;
  created_at: string;
  duration_ms: number | null;
}

export interface HubSpotManualSyncResponse {
  success: boolean;
  hubspot_contact_id: string | null;
  message: string | null;
}

// ============================================================================
// Query Keys
// ============================================================================

export const hubspotKeys = {
  all: ['hubspot'] as const,
  status: () => [...hubspotKeys.all, 'status'] as const,
  syncLogs: (params?: { limit?: number; offset?: number }) =>
    [...hubspotKeys.all, 'sync-logs', params] as const,
};

// ============================================================================
// Queries
// ============================================================================

export function useHubSpotStatus() {
  return useQuery({
    queryKey: hubspotKeys.status(),
    queryFn: async () => {
      const res = await api.get('/hubspot/status');
      return res.data as HubSpotConnectionStatus;
    },
  });
}

export function useHubSpotSyncLogs(options?: { limit?: number; offset?: number }) {
  return useQuery({
    queryKey: hubspotKeys.syncLogs(options),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (options?.limit) params.set('limit', String(options.limit));
      if (options?.offset) params.set('offset', String(options.offset));

      const res = await api.get(`/hubspot/sync-logs${params.toString() ? `?${params}` : ''}`);
      return res.data as HubSpotSyncLog[];
    },
  });
}

// ============================================================================
// Mutations
// ============================================================================

export function useConnectHubSpot() {
  return useMutation({
    mutationFn: async (workspaceId?: string) => {
      const params = workspaceId ? `?workspace_id=${workspaceId}` : '';
      const res = await api.post(`/hubspot/connect${params}`);
      return res.data as HubSpotOAuthInit;
    },
  });
}

export function useDisconnectHubSpot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await api.post('/hubspot/disconnect');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: hubspotKeys.status() });
    },
  });
}

export function useUpdateHubSpotSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: HubSpotSyncSettings) => {
      const res = await api.patch('/hubspot/settings', settings);
      return res.data as HubSpotConnectionStatus;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: hubspotKeys.status() });
    },
  });
}

export function useSyncLeadToHubSpot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (leadId: string) => {
      const res = await api.post(`/hubspot/sync-lead/${leadId}`);
      return res.data as HubSpotManualSyncResponse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: hubspotKeys.syncLogs() });
    },
  });
}

export function useTestHubSpotConnection() {
  return useMutation({
    mutationFn: async () => {
      const res = await api.post('/hubspot/test-webhook');
      return res.data as { success: boolean; message: string; hub_id?: string; user?: string };
    },
  });
}
