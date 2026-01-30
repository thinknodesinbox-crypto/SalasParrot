import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

// ============================================================================
// Types
// ============================================================================

export interface APIKey {
  id: string;
  user_id: string;
  name: string;
  key_prefix: string;
  scopes: string[];
  expires_at: string | null;
  is_active: boolean;
  last_used_at: string | null;
  total_requests: number;
  created_at: string;
}

export interface APIKeyCreate {
  name: string;
  scopes: string[];
  expires_at?: string;
}

export interface APIKeyUpdate {
  name?: string;
  scopes?: string[];
  is_active?: boolean;
  expires_at?: string;
}

export interface APIKeyCreateResponse {
  id: string;
  name: string;
  key: string; // Only shown once!
  key_prefix: string;
  scopes: string[];
  expires_at: string | null;
  created_at: string;
  message: string;
}

export interface APIKeyScope {
  scope: string;
  description: string;
}

// ============================================================================
// Query Keys
// ============================================================================

export const apiKeyKeys = {
  all: ['api-keys'] as const,
  lists: () => [...apiKeyKeys.all, 'list'] as const,
  list: (filters: { is_active?: boolean }) => [...apiKeyKeys.lists(), filters] as const,
  details: () => [...apiKeyKeys.all, 'detail'] as const,
  detail: (id: string) => [...apiKeyKeys.details(), id] as const,
  scopes: () => [...apiKeyKeys.all, 'scopes'] as const,
};

// ============================================================================
// Queries
// ============================================================================

export function useAPIKeys(filters?: { is_active?: boolean }) {
  return useQuery({
    queryKey: apiKeyKeys.list(filters || {}),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.is_active !== undefined) params.set('is_active', String(filters.is_active));

      const res = await api.get(`/integrations/api-keys${params.toString() ? `?${params}` : ''}`);
      return res.data as { api_keys: APIKey[]; total: number };
    },
  });
}

export function useAPIKey(apiKeyId: string) {
  return useQuery({
    queryKey: apiKeyKeys.detail(apiKeyId),
    queryFn: async () => {
      const res = await api.get(`/integrations/api-keys/${apiKeyId}`);
      return res.data as APIKey;
    },
    enabled: !!apiKeyId,
  });
}

export function useAPIKeyScopes() {
  return useQuery({
    queryKey: apiKeyKeys.scopes(),
    queryFn: async () => {
      const res = await api.get('/integrations/api-keys/scopes');
      return res.data as { scopes: APIKeyScope[] };
    },
  });
}

// ============================================================================
// Mutations
// ============================================================================

export function useCreateAPIKey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: APIKeyCreate) => {
      const res = await api.post('/integrations/api-keys', data);
      return res.data as APIKeyCreateResponse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: apiKeyKeys.lists() });
    },
  });
}

export function useUpdateAPIKey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ apiKeyId, data }: { apiKeyId: string; data: APIKeyUpdate }) => {
      const res = await api.patch(`/integrations/api-keys/${apiKeyId}`, data);
      return res.data as APIKey;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: apiKeyKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: apiKeyKeys.detail(variables.apiKeyId),
      });
    },
  });
}

export function useDeleteAPIKey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (apiKeyId: string) => {
      await api.delete(`/integrations/api-keys/${apiKeyId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: apiKeyKeys.lists() });
    },
  });
}

export function useRevokeAPIKey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (apiKeyId: string) => {
      const res = await api.post(`/integrations/api-keys/${apiKeyId}/revoke`);
      return res.data as APIKey;
    },
    onSuccess: (_, apiKeyId) => {
      queryClient.invalidateQueries({ queryKey: apiKeyKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: apiKeyKeys.detail(apiKeyId),
      });
    },
  });
}
