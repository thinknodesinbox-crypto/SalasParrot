import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

// Query keys factory for type-safe query keys
export const queryKeys = {
  // Auth
  auth: {
    user: ['auth', 'user'] as const,
  },

  // Workspaces
  workspaces: {
    all: ['workspaces'] as const,
    list: (filters?: unknown) => ['workspaces', 'list', filters] as const,
    detail: (id: string) => ['workspaces', 'detail', id] as const,
    members: (workspaceId: string) => ['workspaces', workspaceId, 'members'] as const,
  },

  // Campaigns
  campaigns: {
    all: ['campaigns'] as const,
    list: (filters?: unknown) => ['campaigns', 'list', filters] as const,
    detail: (id: string) => ['campaigns', 'detail', id] as const,
    steps: (campaignId: string) => ['campaigns', campaignId, 'steps'] as const,
    senders: (campaignId: string) => ['campaigns', campaignId, 'senders'] as const,
  },

  // Lead Lists
  leadLists: {
    all: ['lead-lists'] as const,
    list: (filters?: unknown) => ['lead-lists', 'list', filters] as const,
    detail: (id: string) => ['lead-lists', 'detail', id] as const,
  },

  // Leads
  leads: {
    all: ['leads'] as const,
    list: (filters?: unknown) => ['leads', 'list', filters] as const,
    detail: (id: string) => ['leads', 'detail', id] as const,
  },

  // LinkedIn Accounts
  linkedinAccounts: {
    all: ['linkedin-accounts'] as const,
    list: (filters?: unknown) => ['linkedin-accounts', 'list', filters] as const,
    detail: (id: string) => ['linkedin-accounts', 'detail', id] as const,
  },

  // Email Accounts
  emailAccounts: {
    all: ['email-accounts'] as const,
    list: (filters?: unknown) => ['email-accounts', 'list', filters] as const,
    detail: (id: string) => ['email-accounts', 'detail', id] as const,
  },

  // Inbox
  conversations: {
    all: ['conversations'] as const,
    list: (filters?: unknown) => ['conversations', 'list', filters] as const,
    detail: (id: string) => ['conversations', 'detail', id] as const,
    messages: (conversationId: string) => ['conversations', conversationId, 'messages'] as const,
  },

  // Billing
  billing: {
    overview: ['billing', 'overview'] as const,
    plans: ['billing', 'plans'] as const,
    invoices: ['billing', 'invoices'] as const,
  },

  // Analytics
  analytics: {
    // Dashboard
    dashboardStats: (dateRange: string) => ['analytics', 'dashboard', 'stats', dateRange] as const,
    dashboardChart: (dateRange: string) => ['analytics', 'dashboard', 'chart', dateRange] as const,
    dashboardActivity: (limit?: number) => ['analytics', 'dashboard', 'activity', limit] as const,
    dashboardCampaigns: ['analytics', 'dashboard', 'campaigns'] as const,
    // Analytics page
    overview: (dateRange?: string) => ['analytics', 'overview', dateRange] as const,
    channelPerformance: (dateRange: string) =>
      ['analytics', 'channel-performance', dateRange] as const,
    topCampaigns: (dateRange: string, limit?: number) =>
      ['analytics', 'top-campaigns', dateRange, limit] as const,
    senderPerformance: (dateRange: string) =>
      ['analytics', 'sender-performance', dateRange] as const,
    replyRateTrend: (dateRange: string) => ['analytics', 'reply-rate-trend', dateRange] as const,
    // Legacy
    campaign: (campaignId: string) => ['analytics', 'campaign', campaignId] as const,
    accountUsage: (accountId: string) => ['analytics', 'account-usage', accountId] as const,
  },
};
