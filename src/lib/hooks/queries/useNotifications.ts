import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';

import { api, getAccessToken } from '../../api';
import type { NotificationListResponse, NotificationSSEEvent } from '../../types';
import { queryKeys } from '../../queryClient';

const API_BASE_URL = import.meta.env.VITE_API_URL;

// Query keys
export const notificationKeys = {
  all: ['notifications'] as const,
  list: (params?: { unread_only?: boolean }) => [...notificationKeys.all, 'list', params] as const,
  unreadCount: () => [...notificationKeys.all, 'unread-count'] as const,
};

// Fetch notifications
export function useNotifications(params?: {
  limit?: number;
  offset?: number;
  unread_only?: boolean;
}) {
  return useQuery({
    queryKey: notificationKeys.list(params),
    queryFn: async () => {
      const response = await api.get<NotificationListResponse>('/notifications', { params });
      return response.data;
    },
  });
}

// Fetch unread count
export function useUnreadCount() {
  return useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: async () => {
      const response = await api.get<{ unread_count: number }>('/notifications/unread-count');
      return response.data.unread_count;
    },
    refetchInterval: 60000, // Refetch every minute
  });
}

// Mark notifications as read
export function useMarkNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationIds: string[]) => {
      const response = await api.post<{ marked_count: number }>('/notifications/mark-read', {
        notification_ids: notificationIds,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

// Mark all notifications as read
export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await api.post<{ marked_count: number }>('/notifications/mark-all-read');
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

// Delete notification
export function useDeleteNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      await api.delete(`/notifications/${notificationId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

// SSE Hook for real-time notifications
export function useNotificationStream(
  onNotification?: (notification: NotificationSSEEvent) => void
) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastNotification, setLastNotification] = useState<NotificationSSEEvent | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const queryClient = useQueryClient();

  const connect = useCallback(() => {
    const token = getAccessToken();
    if (!token) {
      console.log('No access token, cannot connect to notification stream');
      return;
    }

    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    // Note: EventSource doesn't support custom headers, so we pass the token as a query param
    // The backend should also support token in query params for SSE
    const url = `${API_BASE_URL}/api/v1/notifications/stream?token=${encodeURIComponent(token)}`;

    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      console.log('Notification stream connected');
      setIsConnected(true);
    };

    eventSource.addEventListener('connected', () => {
      console.log('SSE connected event received');
      setIsConnected(true);
    });

    eventSource.addEventListener('notification', (event) => {
      try {
        const notification: NotificationSSEEvent = JSON.parse(event.data);
        setLastNotification(notification);
        onNotification?.(notification);

        // Invalidate queries to refresh notification list, unread count, and inbox
        queryClient.invalidateQueries({ queryKey: notificationKeys.all });
        queryClient.invalidateQueries({ queryKey: queryKeys.conversations.all });
      } catch (error) {
        console.error('Failed to parse notification:', error);
      }
    });

    eventSource.addEventListener('heartbeat', () => {
      // Keep-alive heartbeat, no action needed
    });

    eventSource.onerror = (error) => {
      console.error('Notification stream error:', error);
      setIsConnected(false);
      eventSource.close();

      // Reconnect after 5 seconds
      setTimeout(() => {
        if (getAccessToken()) {
          connect();
        }
      }, 5000);
    };
  }, [onNotification, queryClient]);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      setIsConnected(false);
    }
  }, []);

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  // Reconnect when token changes
  useEffect(() => {
    const token = getAccessToken();
    if (token && !isConnected) {
      connect();
    } else if (!token && isConnected) {
      disconnect();
    }
  }, [connect, disconnect, isConnected]);

  return {
    isConnected,
    lastNotification,
    connect,
    disconnect,
  };
}
