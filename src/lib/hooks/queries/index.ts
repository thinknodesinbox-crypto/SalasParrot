// Campaigns
export {
  useCampaigns,
  useCampaign,
  useCreateCampaign,
  useUpdateCampaign,
  useDeleteCampaign,
  useStartCampaign,
  usePauseCampaign,
  useCampaignSteps,
  useCreateCampaignStep,
  useUpdateCampaignStep,
  useDeleteCampaignStep,
  useCampaignSenders,
  useAddCampaignSender,
  useRemoveCampaignSender,
} from './useCampaigns';

// Lead Lists
export {
  useLeadLists,
  useLeadList,
  useCreateLeadList,
  useUpdateLeadList,
  useDeleteLeadList,
  useImportLeadsFromCSV,
} from './useLeads';

// Leads
export {
  useLeads,
  useLead,
  useCreateLead,
  useUpdateLead,
  useDeleteLead,
  useImportLeads,
  useDeleteLeads,
  useAssignLeadsToCampaign,
  useAddLeadTags,
  useRemoveLeadTags,
  // Import Jobs
  useStartImport,
  useImportJobs,
  useImportJobStatus,
  useCancelImport,
} from './useLeads';

// Accounts (LinkedIn & Email)
export {
  useLinkedInAccounts,
  useLinkedInAccount,
  useCreateLinkedInAccount,
  useUpdateLinkedInAccount,
  useDeleteLinkedInAccount,
  useSyncLinkedInAccount,
  useSyncLinkedInChats,
  useConnectLinkedInWithCredentials,
  useConnectLinkedInWithCookie,
  useSolveLinkedInCheckpoint,
  usePollLinkedInStatus,
  useEmailAccounts,
  useEmailAccount,
  useUpdateEmailAccount,
  useDeleteEmailAccount,
  useGetEmailAuthLink,
  useSyncEmailAccount,
  useSyncEmailInbox,
  useSendEmail,
  // Email Custom Auth
  useConnectEmailIMAP,
  useConnectEmailGoogle,
  useConnectEmailMicrosoft,
} from './useAccounts';

// Auth
export { useChangePassword } from './useAuthMutations';

// Inbox
export {
  useConversations,
  useConversation,
  useConversationMessages,
  useSendReply,
  useMarkAsRead,
  useCloseConversation,
  useReopenConversation,
  useSnoozeConversation,
  useAddConversationTags,
  useRemoveConversationTags,
} from './useInbox';

// Billing
export {
  usePlans,
  useBillingOverview,
  useInvoices,
  useCreateCheckout,
  useCreatePortalSession,
  useChangePlan,
  useCancelSubscription,
  useReactivateSubscription,
} from './useBilling';

// Workspaces
export {
  useWorkspaces,
  useWorkspace,
  useCreateWorkspace,
  useUpdateWorkspace,
  useDeleteWorkspace,
  useWorkspaceMembers,
  useInviteWorkspaceMember,
  useUpdateWorkspaceMember,
  useRemoveWorkspaceMember,
} from './useWorkspaces';

// Analytics
export {
  // Dashboard hooks
  useDashboardStats,
  useDashboardChart,
  useDashboardActivity,
  useDashboardCampaigns,
  // Analytics page hooks
  useAnalyticsOverviewStats,
  useChannelPerformance,
  useTopCampaigns,
  useSenderPerformance,
  useReplyRateTrend,
  // Legacy hooks
  useAnalyticsOverview,
  useCampaignAnalytics,
  useAccountUsage,
} from './useAnalytics';

// Notifications
export {
  useNotifications,
  useUnreadCount,
  useMarkNotificationsRead,
  useMarkAllNotificationsRead,
  useDeleteNotification,
  useNotificationStream,
  notificationKeys,
} from './useNotifications';
