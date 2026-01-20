import { useQuery } from '@tanstack/react-query';
import { api } from '../../api';
import { queryKeys } from '../../queryClient';
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

// ==================== Dashboard Hooks ====================

// Get dashboard stats (6 stat cards)
export const useDashboardStats = (dateRange: string = '7d') => {
  return useQuery({
    queryKey: queryKeys.analytics.dashboardStats(dateRange),
    queryFn: async () => {
      const response = await api.get<DashboardStats>(
        `/analytics/dashboard/stats?date_range=${dateRange}`
      );
      return response.data;
    },
  });
};

// Get dashboard activity chart data
export const useDashboardChart = (dateRange: string = '7d') => {
  return useQuery({
    queryKey: queryKeys.analytics.dashboardChart(dateRange),
    queryFn: async () => {
      const response = await api.get<ActivityChartData>(
        `/analytics/dashboard/chart?date_range=${dateRange}`
      );
      return response.data;
    },
  });
};

// Get recent activity feed
export const useDashboardActivity = (limit: number = 5) => {
  return useQuery({
    queryKey: queryKeys.analytics.dashboardActivity(limit),
    queryFn: async () => {
      const response = await api.get<RecentActivityItem[]>(
        `/analytics/dashboard/activity?limit=${limit}`
      );
      return response.data;
    },
  });
};

// Get active campaigns for dashboard
export const useDashboardCampaigns = () => {
  return useQuery({
    queryKey: queryKeys.analytics.dashboardCampaigns,
    queryFn: async () => {
      const response = await api.get<ActiveCampaignItem[]>('/analytics/dashboard/campaigns');
      return response.data;
    },
  });
};

// ==================== Analytics Page Hooks ====================

// Get analytics overview stats (4 stat cards)
export const useAnalyticsOverviewStats = (dateRange: string = '30d') => {
  return useQuery({
    queryKey: queryKeys.analytics.overview(dateRange),
    queryFn: async () => {
      const response = await api.get<AnalyticsOverviewStats>(
        `/analytics/overview?date_range=${dateRange}`
      );
      return response.data;
    },
  });
};

// Get channel performance (LinkedIn vs Email)
export const useChannelPerformance = (dateRange: string = '30d') => {
  return useQuery({
    queryKey: queryKeys.analytics.channelPerformance(dateRange),
    queryFn: async () => {
      const response = await api.get<ChannelPerformance>(
        `/analytics/channel-performance?date_range=${dateRange}`
      );
      return response.data;
    },
  });
};

// Get top performing campaigns
export const useTopCampaigns = (dateRange: string = '30d', limit: number = 10) => {
  return useQuery({
    queryKey: queryKeys.analytics.topCampaigns(dateRange, limit),
    queryFn: async () => {
      const response = await api.get<CampaignPerformanceItem[]>(
        `/analytics/top-campaigns?date_range=${dateRange}&limit=${limit}`
      );
      return response.data;
    },
  });
};

// Get sender performance
export const useSenderPerformance = (dateRange: string = '30d') => {
  return useQuery({
    queryKey: queryKeys.analytics.senderPerformance(dateRange),
    queryFn: async () => {
      const response = await api.get<SenderPerformanceItem[]>(
        `/analytics/sender-performance?date_range=${dateRange}`
      );
      return response.data;
    },
  });
};

// Get reply rate trend
export const useReplyRateTrend = (dateRange: string = '30d') => {
  return useQuery({
    queryKey: queryKeys.analytics.replyRateTrend(dateRange),
    queryFn: async () => {
      const response = await api.get<ReplyRateTrendPoint[]>(
        `/analytics/reply-rate-trend?date_range=${dateRange}`
      );
      return response.data;
    },
  });
};

// ==================== Legacy Hooks (backwards compatibility) ====================

// Get analytics overview (legacy format)
export const useAnalyticsOverview = () => {
  return useQuery({
    queryKey: queryKeys.analytics.overview(),
    queryFn: async () => {
      const response = await api.get<AnalyticsOverview>('/analytics/overview');
      return response.data;
    },
  });
};

// Get campaign analytics
export const useCampaignAnalytics = (campaignId: string) => {
  return useQuery({
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
  return useQuery({
    queryKey: queryKeys.analytics.accountUsage(accountId),
    queryFn: async () => {
      const response = await api.get<unknown[]>(`/analytics/accounts/${accountId}/usage`);
      return response.data;
    },
    enabled: !!accountId,
  });
};
