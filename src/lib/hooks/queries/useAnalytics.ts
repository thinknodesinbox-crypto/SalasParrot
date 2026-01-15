import { useQuery } from '@tanstack/react-query'
import { api } from '../../api'
import { queryKeys } from '../../queryClient'
import type { AnalyticsOverview, CampaignAnalytics } from '../../types'

// Get analytics overview
export const useAnalyticsOverview = () => {
  return useQuery({
    queryKey: queryKeys.analytics.overview,
    queryFn: async () => {
      const response = await api.get<AnalyticsOverview>('/analytics/overview')
      return response.data
    },
  })
}

// Get campaign analytics
export const useCampaignAnalytics = (campaignId: string) => {
  return useQuery({
    queryKey: queryKeys.analytics.campaign(campaignId),
    queryFn: async () => {
      const response = await api.get<CampaignAnalytics>(`/analytics/campaigns/${campaignId}`)
      return response.data
    },
    enabled: !!campaignId,
  })
}

// Get account usage
export const useAccountUsage = (accountId: string) => {
  return useQuery({
    queryKey: queryKeys.analytics.accountUsage(accountId),
    queryFn: async () => {
      const response = await api.get<unknown[]>(`/analytics/accounts/${accountId}/usage`)
      return response.data
    },
    enabled: !!accountId,
  })
}
