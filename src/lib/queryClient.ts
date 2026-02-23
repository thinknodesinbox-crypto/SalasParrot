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
    invitations: (workspaceId: string) => ['workspaces', workspaceId, 'invitations'] as const,
  },

  // Invitations (public)
  invitations: {
    validate: (token: string) => ['invitations', 'validate', token] as const,
    pending: ['invitations', 'pending'] as const,
  },

  // Campaigns
  campaigns: {
    all: ['campaigns'] as const,
    list: (filters?: unknown) => ['campaigns', 'list', filters] as const,
    detail: (id: string) => ['campaigns', 'detail', id] as const,
    steps: (campaignId: string) => ['campaigns', campaignId, 'steps'] as const,
    senders: (campaignId: string) => ['campaigns', campaignId, 'senders'] as const,
    metrics: (campaignId: string) => ['campaigns', campaignId, 'metrics'] as const,
    progress: (campaignId: string) => ['campaigns', campaignId, 'progress'] as const,
    leadBreakdown: (campaignId: string) => ['campaigns', campaignId, 'lead-breakdown'] as const,
    sequenceTemplates: ['sequence-templates'] as const,
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
    pricing: ['billing', 'pricing'] as const,
    invoices: ['billing', 'invoices'] as const,
  },

  // Analytics
  analytics: {
    // Dashboard
    dashboardStats: (dateRange: string, workspaceId?: string | null) =>
      ['analytics', 'dashboard', 'stats', dateRange, workspaceId] as const,
    dashboardChart: (
      dateRange: string,
      workspaceId?: string | null,
      campaignId?: string,
      senderId?: string
    ) => ['analytics', 'dashboard', 'chart', dateRange, workspaceId, campaignId, senderId] as const,
    dashboardActivity: (limit?: number, workspaceId?: string | null) =>
      ['analytics', 'dashboard', 'activity', limit, workspaceId] as const,
    dashboardCampaigns: (workspaceId?: string | null) =>
      ['analytics', 'dashboard', 'campaigns', workspaceId] as const,
    // Analytics page
    overview: (
      dateRange?: string,
      workspaceId?: string | null,
      campaignId?: string,
      senderId?: string
    ) => ['analytics', 'overview', dateRange, workspaceId, campaignId, senderId] as const,
    channelPerformance: (
      dateRange: string,
      workspaceId?: string | null,
      campaignId?: string,
      senderId?: string
    ) =>
      ['analytics', 'channel-performance', dateRange, workspaceId, campaignId, senderId] as const,
    topCampaigns: (dateRange: string, limit?: number, workspaceId?: string | null) =>
      ['analytics', 'top-campaigns', dateRange, limit, workspaceId] as const,
    senderPerformance: (dateRange: string, workspaceId?: string | null) =>
      ['analytics', 'sender-performance', dateRange, workspaceId] as const,
    replyRateTrend: (
      dateRange: string,
      workspaceId?: string | null,
      campaignId?: string,
      senderId?: string
    ) => ['analytics', 'reply-rate-trend', dateRange, workspaceId, campaignId, senderId] as const,
    // Legacy
    campaign: (campaignId: string) => ['analytics', 'campaign', campaignId] as const,
    accountUsage: (accountId: string) => ['analytics', 'account-usage', accountId] as const,
  },
};
