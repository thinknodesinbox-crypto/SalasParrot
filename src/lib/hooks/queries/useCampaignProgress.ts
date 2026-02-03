import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';

import { api, getAccessToken } from '../../api';
import { queryKeys } from '../../queryClient';
import type {
  CampaignMetrics,
  CampaignProgress,
  CampaignProgressSSEEvent,
  LeadBreakdown,
} from '../../types';

const API_BASE_URL = import.meta.env.VITE_API_URL;

// Fetch campaign metrics
export function useCampaignMetrics(campaignId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.campaigns.metrics(campaignId || ''),
    queryFn: async () => {
      const response = await api.get<CampaignMetrics>(`/campaigns/${campaignId}/metrics`);
      return response.data;
    },
    enabled: !!campaignId,
    refetchInterval: 30000, // Refetch every 30 seconds as fallback
  });
}

// Fetch campaign progress
export function useCampaignProgress(campaignId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.campaigns.progress(campaignId || ''),
    queryFn: async () => {
      const response = await api.get<CampaignProgress>(`/campaigns/${campaignId}/progress`);
      return response.data;
    },
    enabled: !!campaignId,
    refetchInterval: 30000,
  });
}

// Fetch lead breakdown
export function useLeadBreakdown(campaignId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.campaigns.leadBreakdown(campaignId || ''),
    queryFn: async () => {
      const response = await api.get<LeadBreakdown>(`/campaigns/${campaignId}/lead-breakdown`);
      return response.data;
    },
    enabled: !!campaignId,
    refetchInterval: 30000,
  });
}

// SSE Hook for real-time campaign progress
export function useCampaignProgressStream(
  campaignId: string | undefined,
  onEvent?: (event: CampaignProgressSSEEvent) => void
) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<CampaignProgressSSEEvent | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const queryClient = useQueryClient();

  const connect = useCallback(() => {
    const token = getAccessToken();
    if (!token || !campaignId) {
      return;
    }

    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const url = `${API_BASE_URL}/api/v1/campaigns/${campaignId}/stream?token=${encodeURIComponent(token)}`;
    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setIsConnected(true);
    };

    eventSource.addEventListener('connected', () => {
      setIsConnected(true);
    });

    eventSource.addEventListener('progress', (event) => {
      try {
        const progressEvent: CampaignProgressSSEEvent = JSON.parse(event.data);
        setLastEvent(progressEvent);
        onEvent?.(progressEvent);

        // Invalidate relevant queries based on event type
        switch (progressEvent.event_type) {
          case 'metrics_update':
            queryClient.invalidateQueries({
              queryKey: queryKeys.campaigns.metrics(campaignId),
            });
            break;
          case 'lead_status_change':
            queryClient.invalidateQueries({
              queryKey: queryKeys.campaigns.leadBreakdown(campaignId),
            });
            queryClient.invalidateQueries({
              queryKey: queryKeys.campaigns.metrics(campaignId),
            });
            break;
          case 'step_progress':
            queryClient.invalidateQueries({
              queryKey: queryKeys.campaigns.progress(campaignId),
            });
            break;
          case 'campaign_state_change':
            queryClient.invalidateQueries({
              queryKey: queryKeys.campaigns.detail(campaignId),
            });
            queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.all });
            break;
        }
      } catch (error) {
        console.error('Failed to parse campaign progress event:', error);
      }
    });

    eventSource.addEventListener('heartbeat', () => {
      // Keep-alive heartbeat, no action needed
    });

    eventSource.onerror = () => {
      setIsConnected(false);
      eventSource.close();

      // Reconnect after 5 seconds
      setTimeout(() => {
        if (getAccessToken() && campaignId) {
          connect();
        }
      }, 5000);
    };
  }, [campaignId, onEvent, queryClient]);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      setIsConnected(false);
    }
  }, []);

  useEffect(() => {
    if (campaignId) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [campaignId, connect, disconnect]);

  return {
    isConnected,
    lastEvent,
    connect,
    disconnect,
  };
}
