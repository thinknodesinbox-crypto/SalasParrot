// Campaigns
export {
  useCampaigns,
  useCampaign,
  useCreateCampaign,
  useUpdateCampaign,
  useDeleteCampaign,
  useStartCampaign,
  usePauseCampaign,
  useStopCampaign,
  useResumeCampaign,
  useCloneCampaign,
  useCampaignSteps,
  useCreateCampaignStep,
  useUpdateCampaignStep,
  useDeleteCampaignStep,
  useCampaignSenders,
  useAddCampaignSender,
  useRemoveCampaignSender,
  useLeadAvailabilityPreview,
  useSequenceTemplates,
  useSaveSequenceTemplate,
  useDeleteSequenceTemplate,
} from './useCampaigns';
export type { LeadAvailability } from './useCampaigns';

// Email Marketing
export {
  useMarketingLists,
  useMarketingTemplates,
  useMarketingBroadcasts,
  useMarketingListContacts,
  useCreateMarketingList,
  useCreateMarketingTemplate,
  useImportMarketingContactsCSV,
  useCreateMarketingBroadcast,
  useSendMarketingBroadcast,
  useMarketingBroadcastMetrics,
} from './useEmailMarketing';
export type {
  MarketingList,
  MarketingTemplate,
  MarketingListContact,
  MarketingContactCsvImportResponse,
  MarketingBroadcast,
  MarketingBroadcastMetrics,
} from './useEmailMarketing';

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
  useSyncEmailAccount,
  useSyncEmailInbox,
  useSendEmail,
  // Email Custom Auth
  useConnectEmailIMAP,
  useConnectEmailGoogle,
  useConnectEmailMicrosoft,
  // Email Auth Config
  useEmailAuthConfig,
  // Email OAuth Flow
  useInitGoogleOAuth,
  useInitMicrosoftOAuth,
  useInitGmailHostedAuth,
  // Calendar Accounts
  useCalendarAccounts,
  useDeleteCalendarAccount,
  useUpdateCalendarAccount,
  useConnectCalendarFromEmail,
  useInitCalendarAuth,
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
  usePricingInfo,
  useBillingOverview,
  useInvoices,
  useCreateGrowthCheckout,
  useUpdateGrowthSenders,
  useCreateAgencyCheckout,
  useUpdateAgencyExtraSenders,
  useCreatePortalSession,
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

// Enrichment
export {
  useEnrichLeads,
  useEnrichmentJobs,
  useEnrichmentJobStatus,
  useEnrichmentJobWithPolling,
} from './useEnrichment';

// Webhooks
export {
  useWebhooks,
  useWebhook,
  useWebhookDeliveries,
  useWebhookEventTypes,
  useCreateWebhook,
  useUpdateWebhook,
  useDeleteWebhook,
  useTestWebhook,
  webhookKeys,
} from './useWebhooks';
export type {
  Webhook,
  WebhookCreate,
  WebhookUpdate,
  WebhookDelivery,
  WebhookEventType,
  WebhookTestResult,
} from './useWebhooks';

// API Keys
export {
  useAPIKeys,
  useAPIKey,
  useAPIKeyScopes,
  useCreateAPIKey,
  useUpdateAPIKey,
  useRevokeAPIKey,
  useDeleteAPIKey,
  apiKeyKeys,
} from './useAPIKeys';
export type { APIKey, APIKeyCreate, APIKeyUpdate, APIKeyScope } from './useAPIKeys';

// HubSpot
export {
  useHubSpotStatus,
  useHubSpotSyncLogs,
  useConnectHubSpot,
  useDisconnectHubSpot,
  useUpdateHubSpotSettings,
  useSyncLeadToHubSpot,
  useTestHubSpotConnection,
  hubspotKeys,
} from './useHubSpot';
export type {
  HubSpotConnectionStatus,
  HubSpotOAuthInit,
  HubSpotSyncSettings,
  HubSpotSyncLog,
  HubSpotManualSyncResponse,
} from './useHubSpot';

// Salesforce
export {
  useSalesforceStatus,
  useSalesforceSyncLogs,
  useConnectSalesforce,
  useDisconnectSalesforce,
  useUpdateSalesforceSettings,
  useSyncLeadToSalesforce,
  useTestSalesforceConnection,
  salesforceKeys,
} from './useSalesforce';
export type {
  SalesforceConnectionStatus,
  SalesforceOAuthInit,
  SalesforceSyncSettings,
  SalesforceSyncLog,
  SalesforceManualSyncResponse,
} from './useSalesforce';

// Pipedrive
export {
  usePipedriveStatus,
  usePipedriveSyncLogs,
  useConnectPipedrive,
  useDisconnectPipedrive,
  useUpdatePipedriveSettings,
  useSyncLeadToPipedrive,
  useTestPipedriveConnection,
  pipedriveKeys,
} from './usePipedrive';
export type {
  PipedriveConnectionStatus,
  PipedriveOAuthInit,
  PipedriveSyncSettings,
  PipedriveSyncLog,
  PipedriveManualSyncResponse,
} from './usePipedrive';

// Close CRM
export {
  useCloseStatus,
  useCloseSyncLogs,
  useConnectClose,
  useDisconnectClose,
  useUpdateCloseSettings,
  useSyncLeadToClose,
  useTestCloseConnection,
  closeKeys,
} from './useClose';
export type {
  CloseConnectionStatus,
  CloseSyncSettings,
  CloseSyncLog,
  CloseManualSyncResponse,
} from './useClose';

// Slack
export {
  useSlackStatus,
  useSlackChannels,
  useSlackNotificationLogs,
  useConnectSlack,
  useDisconnectSlack,
  useUpdateSlackSettings,
  useTestSlackConnection,
  useSendTestSlackNotification,
  slackKeys,
} from './useSlack';
export type {
  SlackConnectionStatus,
  SlackOAuthInit,
  SlackNotificationSettings,
  SlackChannel,
  SlackNotificationLog,
} from './useSlack';
