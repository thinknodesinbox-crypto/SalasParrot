import { useQuery } from '@tanstack/react-query';
import { api } from '../../api';
import { queryKeys } from '../../queryClient';
import { useWorkspaceStore } from '../../workspace';
import type {
  DashboardStats,
  ActivityChartData,
  RecentActivityItem,
  ActiveCampaignItem,
  AnalyticsOverviewStats,
  ChannelPerformance,
  CampaignPerformanceItem,
  SenderPerformanceItem,
  ReplyRateTrendPoint,
  AnalyticsOverview,
  CampaignAnalytics,
} from '../../types';

function wsParam(workspaceId: string | null | undefined): string {
  return workspaceId ? `&workspace_id=${workspaceId}` : '';
}

// ==================== Dashboard Hooks ====================

// Get dashboard stats (6 stat cards)
export const useDashboardStats = (dateRange: string = '7d') => {
  const workspaceId = useWorkspaceStore((s) => s.currentWorkspaceId);
  return useQuery<DashboardStats>({
    queryKey: queryKeys.analytics.dashboardStats(dateRange, workspaceId),
    queryFn: async () => {
      const response = await api.get<DashboardStats>(
        `/analytics/dashboard/stats?date_range=${dateRange}${wsParam(workspaceId)}`
      );
      return response.data;
    },
  });
};

// Get dashboard activity chart data
export const useDashboardChart = (
  dateRange: string = '7d',
  campaignId?: string,
  senderId?: string
) => {
  const workspaceId = useWorkspaceStore((s) => s.currentWorkspaceId);
  return useQuery<ActivityChartData>({
    queryKey: queryKeys.analytics.dashboardChart(dateRange, workspaceId, campaignId, senderId),
    queryFn: async () => {
      const response = await api.get<ActivityChartData>(
        `/analytics/dashboard/chart?date_range=${dateRange}${wsParam(workspaceId)}${campaignId ? `&campaign_id=${campaignId}` : ''}${senderId ? `&sender_id=${senderId}` : ''}`
      );
      return response.data;
    },
  });
};

// Get recent activity feed
export const useDashboardActivity = (limit: number = 5) => {
  const workspaceId = useWorkspaceStore((s) => s.currentWorkspaceId);
  return useQuery<RecentActivityItem[]>({
    queryKey: queryKeys.analytics.dashboardActivity(limit, workspaceId),
    queryFn: async () => {
      const response = await api.get<RecentActivityItem[]>(
        `/analytics/dashboard/activity?limit=${limit}${wsParam(workspaceId)}`
      );
      return response.data;
    },
  });
};

// Get active campaigns for dashboard
export const useDashboardCampaigns = () => {
  const workspaceId = useWorkspaceStore((s) => s.currentWorkspaceId);
  return useQuery<ActiveCampaignItem[]>({
    queryKey: queryKeys.analytics.dashboardCampaigns(workspaceId),
    queryFn: async () => {
      const response = await api.get<ActiveCampaignItem[]>(
        `/analytics/dashboard/campaigns?${workspaceId ? `workspace_id=${workspaceId}` : ''}`
      );
      return response.data;
    },
  });
};

// ==================== Analytics Page Hooks ====================

// Get analytics overview stats (4 stat cards)
export const useAnalyticsOverviewStats = (
  dateRange: string = '30d',
  campaignId?: string,
  senderId?: string
) => {
  const workspaceId = useWorkspaceStore((s) => s.currentWorkspaceId);
  return useQuery<AnalyticsOverviewStats>({
    queryKey: queryKeys.analytics.overview(dateRange, workspaceId, campaignId, senderId),
    queryFn: async () => {
      const response = await api.get<AnalyticsOverviewStats>(
        `/analytics/overview?date_range=${dateRange}${wsParam(workspaceId)}${campaignId ? `&campaign_id=${campaignId}` : ''}${senderId ? `&sender_id=${senderId}` : ''}`
      );
      return response.data;
    },
  });
};

// Get channel performance (LinkedIn vs Email)
export const useChannelPerformance = (
  dateRange: string = '30d',
  campaignId?: string,
  senderId?: string
) => {
  const workspaceId = useWorkspaceStore((s) => s.currentWorkspaceId);
  return useQuery<ChannelPerformance>({
    queryKey: queryKeys.analytics.channelPerformance(dateRange, workspaceId, campaignId, senderId),
    queryFn: async () => {
      const response = await api.get<ChannelPerformance>(
        `/analytics/channel-performance?date_range=${dateRange}${wsParam(workspaceId)}${campaignId ? `&campaign_id=${campaignId}` : ''}${senderId ? `&sender_id=${senderId}` : ''}`
      );
      return response.data;
    },
  });
};

// Get top performing campaigns
export const useTopCampaigns = (dateRange: string = '30d', limit: number = 10) => {
  const workspaceId = useWorkspaceStore((s) => s.currentWorkspaceId);
  return useQuery<CampaignPerformanceItem[]>({
    queryKey: queryKeys.analytics.topCampaigns(dateRange, limit, workspaceId),
    queryFn: async () => {
      const response = await api.get<CampaignPerformanceItem[]>(
        `/analytics/top-campaigns?date_range=${dateRange}&limit=${limit}${wsParam(workspaceId)}`
      );
      return response.data;
    },
  });
};

// Get sender performance
export const useSenderPerformance = (dateRange: string = '30d') => {
  const workspaceId = useWorkspaceStore((s) => s.currentWorkspaceId);
  return useQuery<SenderPerformanceItem[]>({
    queryKey: queryKeys.analytics.senderPerformance(dateRange, workspaceId),
    queryFn: async () => {
      const response = await api.get<SenderPerformanceItem[]>(
        `/analytics/sender-performance?date_range=${dateRange}${wsParam(workspaceId)}`
      );
      return response.data;
    },
  });
};

// Get reply rate trend
export const useReplyRateTrend = (
  dateRange: string = '30d',
  campaignId?: string,
  senderId?: string
) => {
  const workspaceId = useWorkspaceStore((s) => s.currentWorkspaceId);
  return useQuery<ReplyRateTrendPoint[]>({
    queryKey: queryKeys.analytics.replyRateTrend(dateRange, workspaceId, campaignId, senderId),
    queryFn: async () => {
      const response = await api.get<ReplyRateTrendPoint[]>(
        `/analytics/reply-rate-trend?date_range=${dateRange}${wsParam(workspaceId)}${campaignId ? `&campaign_id=${campaignId}` : ''}${senderId ? `&sender_id=${senderId}` : ''}`
      );
      return response.data;
    },
  });
};

// ==================== Legacy Hooks (backwards compatibility) ====================

// Get analytics overview (legacy format)
export const useAnalyticsOverview = () => {
  const workspaceId = useWorkspaceStore((s) => s.currentWorkspaceId);
  return useQuery<AnalyticsOverview>({
    queryKey: queryKeys.analytics.overview(undefined, workspaceId),
    queryFn: async () => {
      const response = await api.get<AnalyticsOverview>(
        `/analytics/overview?${workspaceId ? `workspace_id=${workspaceId}` : ''}`
      );
      return response.data;
    },
  });
};

// Get campaign analytics
export const useCampaignAnalytics = (campaignId: string) => {
  return useQuery<CampaignAnalytics>({
    queryKey: queryKeys.analytics.campaign(campaignId),
    queryFn: async () => {
      const response = await api.get<CampaignAnalytics>(`/analytics/campaigns/${campaignId}`);
      return response.data;
    },
    enabled: !!campaignId,
  });
};

// Get account usage
export const useAccountUsage = (accountId: string) => {
  return useQuery<unknown[]>({
    queryKey: queryKeys.analytics.accountUsage(accountId),
    queryFn: async () => {
      const response = await api.get<unknown[]>(`/analytics/accounts/${accountId}/usage`);
      return response.data;
    },
    enabled: !!accountId,
  });
};
