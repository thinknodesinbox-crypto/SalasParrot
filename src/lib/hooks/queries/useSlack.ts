import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

// ============================================================================
// Types
// ============================================================================

export interface SlackConnectionStatus {
  connected: boolean;
  status: string | null;
  team_name: string | null;
  team_id: string | null;
  default_channel_name: string | null;
  notify_replies: boolean | null;
  notify_connections: boolean | null;
  notify_campaigns: boolean | null;
  last_error: string | null;
}

export interface SlackOAuthInit {
  authorization_url: string;
  state: string;
}

export interface SlackNotificationSettings {
  default_channel_id?: string;
  notify_replies?: boolean;
  notify_connections?: boolean;
  notify_campaigns?: boolean;
}

export interface SlackChannel {
  id: string;
  name: string;
  is_private: boolean;
}

export interface SlackNotificationLog {
  id: string;
  event_type: string;
  channel_id: string | null;
  success: boolean;
  error_message: string | null;
  created_at: string;
  duration_ms: number | null;
}

// ============================================================================
// Query Keys
// ============================================================================

export const slackKeys = {
  all: ['slack'] as const,
  status: () => [...slackKeys.all, 'status'] as const,
  channels: () => [...slackKeys.all, 'channels'] as const,
  notificationLogs: (params?: { limit?: number; offset?: number }) =>
    [...slackKeys.all, 'notification-logs', params] as const,
};

// ============================================================================
// Queries
// ============================================================================

export function useSlackStatus() {
  return useQuery({
    queryKey: slackKeys.status(),
    queryFn: async () => {
      const res = await api.get('/slack/status');
      return res.data as SlackConnectionStatus;
    },
  });
}

export function useSlackChannels() {
  return useQuery({
    queryKey: slackKeys.channels(),
    queryFn: async () => {
      const res = await api.get('/slack/channels');
      return res.data as SlackChannel[];
    },
    enabled: false, // Only fetch when explicitly enabled
  });
}

export function useSlackNotificationLogs(options?: { limit?: number; offset?: number }) {
  return useQuery({
    queryKey: slackKeys.notificationLogs(options),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (options?.limit) params.set('limit', String(options.limit));
      if (options?.offset) params.set('offset', String(options.offset));

      const res = await api.get(`/slack/notification-logs${params.toString() ? `?${params}` : ''}`);
      return res.data as SlackNotificationLog[];
    },
  });
}

// ============================================================================
// Mutations
// ============================================================================

export function useConnectSlack() {
  return useMutation({
    mutationFn: async (workspaceId?: string) => {
      const params = workspaceId ? `?workspace_id=${workspaceId}` : '';
      const res = await api.post(`/slack/connect${params}`);
      return res.data as SlackOAuthInit;
    },
  });
}

export function useDisconnectSlack() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await api.post('/slack/disconnect');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: slackKeys.status() });
    },
  });
}

export function useUpdateSlackSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: SlackNotificationSettings) => {
      const res = await api.patch('/slack/settings', settings);
      return res.data as SlackConnectionStatus;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: slackKeys.status() });
    },
  });
}

export function useTestSlackConnection() {
  return useMutation({
    mutationFn: async () => {
      const res = await api.post('/slack/test');
      return res.data as { success: boolean; message: string; team?: string; user?: string };
    },
  });
}

export function useSendTestSlackNotification() {
  return useMutation({
    mutationFn: async () => {
      const res = await api.post('/slack/send-test-notification');
      return res.data as { success: boolean; message: string };
    },
  });
}
