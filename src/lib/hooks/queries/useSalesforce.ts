import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

// ============================================================================
// Types
// ============================================================================

export interface SalesforceConnectionStatus {
  connected: boolean;
  status: string | null;
  instance_url: string | null;
  organization_id: string | null;
  sync_enabled: boolean | null;
  sync_contacts: boolean | null;
  sync_activities: boolean | null;
  auto_create_contacts: boolean | null;
  last_synced_at: string | null;
  last_error: string | null;
}

export interface SalesforceOAuthInit {
  authorization_url: string;
  state: string;
}

export interface SalesforceSyncSettings {
  sync_enabled?: boolean;
  sync_contacts?: boolean;
  sync_activities?: boolean;
  auto_create_contacts?: boolean;
}

export interface SalesforceSyncLog {
  id: string;
  operation: string;
  direction: string;
  lead_id: string | null;
  salesforce_contact_id: string | null;
  event_type: string | null;
  success: boolean;
  error_message: string | null;
  created_at: string;
  duration_ms: number | null;
}

export interface SalesforceManualSyncResponse {
  success: boolean;
  salesforce_contact_id: string | null;
  message: string | null;
}

// ============================================================================
// Query Keys
// ============================================================================

export const salesforceKeys = {
  all: ['salesforce'] as const,
  status: () => [...salesforceKeys.all, 'status'] as const,
  syncLogs: (params?: { limit?: number; offset?: number }) =>
    [...salesforceKeys.all, 'sync-logs', params] as const,
};

// ============================================================================
// Queries
// ============================================================================

export function useSalesforceStatus() {
  return useQuery({
    queryKey: salesforceKeys.status(),
    queryFn: async () => {
      const res = await api.get('/salesforce/status');
      return res.data as SalesforceConnectionStatus;
    },
  });
}

export function useSalesforceSyncLogs(options?: { limit?: number; offset?: number }) {
  return useQuery({
    queryKey: salesforceKeys.syncLogs(options),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (options?.limit) params.set('limit', String(options.limit));
      if (options?.offset) params.set('offset', String(options.offset));

      const res = await api.get(`/salesforce/sync-logs${params.toString() ? `?${params}` : ''}`);
      return res.data as SalesforceSyncLog[];
    },
  });
}

// ============================================================================
// Mutations
// ============================================================================

export function useConnectSalesforce() {
  return useMutation({
    mutationFn: async (workspaceId?: string) => {
      const params = workspaceId ? `?workspace_id=${workspaceId}` : '';
      const res = await api.post(`/salesforce/connect${params}`);
      return res.data as SalesforceOAuthInit;
    },
  });
}

export function useDisconnectSalesforce() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await api.post('/salesforce/disconnect');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salesforceKeys.status() });
    },
  });
}

export function useUpdateSalesforceSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: SalesforceSyncSettings) => {
      const res = await api.patch('/salesforce/settings', settings);
      return res.data as SalesforceConnectionStatus;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salesforceKeys.status() });
    },
  });
}

export function useSyncLeadToSalesforce() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (leadId: string) => {
      const res = await api.post(`/salesforce/sync-lead/${leadId}`);
      return res.data as SalesforceManualSyncResponse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salesforceKeys.syncLogs() });
    },
  });
}

export function useTestSalesforceConnection() {
  return useMutation({
    mutationFn: async () => {
      const res = await api.post('/salesforce/test');
      return res.data as { success: boolean; message: string; daily_api_requests?: number };
    },
  });
}
