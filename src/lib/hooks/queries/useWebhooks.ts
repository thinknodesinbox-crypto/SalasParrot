import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

// ============================================================================
// Types
// ============================================================================

export interface Webhook {
  id: string;
  user_id: string;
  workspace_id: string | null;
  name: string;
  url: string;
  events: string[];
  headers: Record<string, string>;
  is_active: boolean;
  retry_count: number;
  timeout_seconds: number;
  created_at: string;
  updated_at: string;
  total_sent: number;
  total_failed: number;
  last_triggered_at: string | null;
  last_success_at: string | null;
  last_error: string | null;
  last_error_at: string | null;
  has_secret: boolean;
}

export interface WebhookCreate {
  name: string;
  url: string;
  events: string[];
  secret?: string;
  headers?: Record<string, string>;
  is_active?: boolean;
  retry_count?: number;
  timeout_seconds?: number;
  workspace_id?: string;
}

export interface WebhookUpdate {
  name?: string;
  url?: string;
  events?: string[];
  secret?: string;
  headers?: Record<string, string>;
  is_active?: boolean;
  retry_count?: number;
  timeout_seconds?: number;
}

export interface WebhookDelivery {
  id: string;
  webhook_id: string;
  event_type: string;
  event_id: string | null;
  payload: Record<string, unknown>;
  status: 'pending' | 'success' | 'failed' | 'retrying';
  response_status: number | null;
  response_body: string | null;
  error_message: string | null;
  attempts: number;
  max_attempts: number;
  next_retry_at: string | null;
  created_at: string;
  delivered_at: string | null;
  completed_at: string | null;
}

export interface WebhookEventType {
  event: string;
  description: string;
  category: string;
  sample_payload: Record<string, unknown>;
}

export interface WebhookTestResult {
  success: boolean;
  status_code: number | null;
  response_body: string | null;
  error: string | null;
  duration_ms: number;
}

// ============================================================================
// Query Keys
// ============================================================================

export const webhookKeys = {
  all: ['webhooks'] as const,
  lists: () => [...webhookKeys.all, 'list'] as const,
  list: (filters: { workspace_id?: string; is_active?: boolean }) =>
    [...webhookKeys.lists(), filters] as const,
  details: () => [...webhookKeys.all, 'detail'] as const,
  detail: (id: string) => [...webhookKeys.details(), id] as const,
  deliveries: (webhookId: string) => [...webhookKeys.all, 'deliveries', webhookId] as const,
  eventTypes: () => [...webhookKeys.all, 'event-types'] as const,
};

// ============================================================================
// Queries
// ============================================================================

export function useWebhooks(filters?: { workspace_id?: string; is_active?: boolean }) {
  return useQuery({
    queryKey: webhookKeys.list(filters || {}),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.workspace_id) params.set('workspace_id', filters.workspace_id);
      if (filters?.is_active !== undefined) params.set('is_active', String(filters.is_active));

      const res = await api.get(`/integrations/webhooks${params.toString() ? `?${params}` : ''}`);
      return res.data as { webhooks: Webhook[]; total: number };
    },
  });
}

export function useWebhook(webhookId: string) {
  return useQuery({
    queryKey: webhookKeys.detail(webhookId),
    queryFn: async () => {
      const res = await api.get(`/integrations/webhooks/${webhookId}`);
      return res.data as Webhook;
    },
    enabled: !!webhookId,
  });
}

export function useWebhookDeliveries(
  webhookId: string,
  options?: { limit?: number; offset?: number; status?: string }
) {
  return useQuery({
    queryKey: [...webhookKeys.deliveries(webhookId), options],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (options?.limit) params.set('limit', String(options.limit));
      if (options?.offset) params.set('offset', String(options.offset));
      if (options?.status) params.set('status', options.status);

      const res = await api.get(
        `/integrations/webhooks/${webhookId}/deliveries${params.toString() ? `?${params}` : ''}`
      );
      return res.data as {
        deliveries: WebhookDelivery[];
        total: number;
        limit: number;
        offset: number;
      };
    },
    enabled: !!webhookId,
  });
}

export function useWebhookEventTypes() {
  return useQuery({
    queryKey: webhookKeys.eventTypes(),
    queryFn: async () => {
      const res = await api.get('/integrations/webhooks/event-types');
      return res.data as { event_types: WebhookEventType[] };
    },
  });
}

// ============================================================================
// Mutations
// ============================================================================

export function useCreateWebhook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: WebhookCreate) => {
      const res = await api.post('/integrations/webhooks', data);
      return res.data as Webhook;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: webhookKeys.lists() });
    },
  });
}

export function useUpdateWebhook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ webhookId, data }: { webhookId: string; data: WebhookUpdate }) => {
      const res = await api.patch(`/integrations/webhooks/${webhookId}`, data);
      return res.data as Webhook;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: webhookKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: webhookKeys.detail(variables.webhookId),
      });
    },
  });
}

export function useDeleteWebhook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (webhookId: string) => {
      await api.delete(`/integrations/webhooks/${webhookId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: webhookKeys.lists() });
    },
  });
}

export function useTestWebhook() {
  return useMutation({
    mutationFn: async ({
      webhookId,
      eventType,
      sampleData,
    }: {
      webhookId: string;
      eventType?: string;
      sampleData?: Record<string, unknown>;
    }) => {
      const res = await api.post(`/integrations/webhooks/${webhookId}/test`, {
        event_type: eventType || 'lead.created',
        sample_data: sampleData,
      });
      return res.data as WebhookTestResult;
    },
  });
}
