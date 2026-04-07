// User types
export type PlanType = 'starter' | 'growth' | 'agency' | 'unlimited';

export interface PartnerAccessInfo {
  code: string;
  partner_name: string;
  access_type: 'full' | 'limited';
  access_starts_at: string;
  access_expires_at: string | null; // null = lifetime
  days_until_expiry: number | null; // null = lifetime
  is_active: boolean;
  is_expired: boolean;
  // Feature restrictions (only for limited access)
  max_senders?: number | null;
  max_sequences?: number | null;
  max_emails_per_day?: number | null;
  max_linkedin_actions_per_day?: number | null;
  enrichment_credits?: number | null;
  api_access?: boolean;
  export_data?: boolean;
}

export interface User {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  is_active: boolean;
  is_verified: boolean;
  is_admin: boolean;
  plan: PlanType;
  subscription_status?: string;
  partner_access?: PartnerAccessInfo | null;
  has_invited_workspace_access?: boolean; // True if user is member of a workspace they were invited to
  created_at: string;
  updated_at: string;
}

// Auth types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  name?: string;
  partner_code?: string;
}

export interface ValidatePartnerCodeRequest {
  code: string;
  email?: string;
}

export interface PartnerCodeValidation {
  valid: boolean;
  code: string | null;
  message: string;
  benefits: {
    access_type: 'full' | 'limited';
    duration: string;
    duration_days: number | null;
    max_senders?: number;
    max_sequences?: number;
    enrichment_credits?: number;
  } | null;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface AuthResponse {
  user: User;
  tokens: TokenResponse;
  skip_payment?: boolean; // True for admins and partner code users
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface GoogleAuthRequest {
  credential: string;
}

// Workspace types
export type WorkspaceRole = 'admin' | 'member';

export interface WorkspaceAgentDefaults {
  goal?: string;
  tone?: 'professional' | 'friendly' | 'casual';
  company_name?: string;
  company_context?: string;
  product_description?: string;
  scheduling_link?: string;
  sender_title?: string;
  custom_instructions?: string;
}

export interface Workspace {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  client_name: string | null;
  client_email: string | null;
  working_hours: WorkingHours | null;
  agent_defaults?: WorkspaceAgentDefaults | null;
  created_at: string;
}

export interface WorkspaceMember {
  id: string;
  workspace_id: string;
  user_id: string;
  role: WorkspaceRole;
  permissions: Record<string, boolean>;
  invited_at: string | null;
  joined_at: string | null;
  invited_by: string | null;
  is_active: boolean;
  created_at: string;
  user_email?: string;
  user_name?: string;
}

// Workspace Invitation types
export type InvitationStatus = 'pending' | 'accepted' | 'declined' | 'expired';

export interface WorkspaceInvitation {
  id: string;
  workspace_id: string;
  workspace_name: string;
  email: string;
  role: WorkspaceRole;
  permissions: Record<string, boolean> | null;
  status: InvitationStatus;
  invited_by: string | null;
  inviter_name: string | null;
  inviter_email: string | null;
  invited_at: string;
  expires_at: string;
  accepted_at: string | null;
}

export interface InvitationValidation {
  valid: boolean;
  workspace_name: string | null;
  inviter_name: string | null;
  role: WorkspaceRole | null;
  email: string | null;
  expires_at: string | null;
  error: 'expired' | 'already_accepted' | 'already_declined' | 'not_found' | null;
}

export interface AcceptInvitationRequest {
  name?: string;
  password?: string;
}

export interface AcceptInvitationResponse {
  success: boolean;
  message: string;
  workspace_id: string | null;
  workspace_name: string | null;
  access_token: string | null;
  refresh_token: string | null;
  user_id: string | null;
}

export interface CreateInvitationRequest {
  email: string;
  role?: WorkspaceRole;
  permissions?: Record<string, boolean>;
}

// Campaign types
export type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed' | 'stopped';
export type StepType =
  | 'connection_request'
  | 'message'
  | 'inmail'
  | 'profile_view'
  | 'like_post'
  | 'wait'
  | 'condition'
  | 'email'
  | 'email_followup'
  | 'reply_agent'
  | 'end';

export interface CampaignStep {
  id: string;
  campaign_id: string;
  order: number;
  type: StepType;
  config: Record<string, unknown>;
  true_branch_step_id: string | null;
  false_branch_step_id: string | null;
  next_step_id: string | null;
  created_at: string;
}

export type PersonalizationMode = 'none' | 'first_line' | 'full_message';
export type PersonalizationProvider = 'linkedin_profile' | 'openai_web_search';

export interface CampaignSender {
  id: string;
  campaign_id: string;
  linkedin_account_id: string;
  email_account_id: string | null;
  is_active: boolean;
}

export interface Campaign {
  id: string;
  user_id: string;
  workspace_id: string; // Required - campaigns must belong to a workspace
  name: string;
  status: CampaignStatus;
  created_by: string | null;
  pause_new_sends: boolean;
  daily_connection_limit: number | null;
  rate_limited_actions: string[];
  rate_limited_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface CampaignWithDetails extends Campaign {
  steps: CampaignStep[];
  senders: CampaignSender[];
  lead_count: number;
}

export interface SequenceTemplate {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  nodes: Array<{
    id: string;
    type: string;
    data: Record<string, unknown>;
    parentId?: string;
    branch?: 'true' | 'false';
  }>;
  created_at: string;
}

// Lead List types
export interface LeadList {
  id: string;
  user_id: string;
  workspace_id: string | null;
  name: string;
  source: string | null;
  lead_count: number;
  enriched_count: number;
  created_at: string;
  updated_at: string;
}

export interface LeadListsResponse {
  lists: LeadList[];
  total: number;
}

// Lead types
export type LeadStatus =
  | 'new'
  | 'contacted'
  | 'accepted'
  | 'replied'
  | 'qualified'
  | 'not_interested';

export type EnrichmentStatus =
  | 'not_enriched'
  | 'pending'
  | 'enriched'
  | 'failed'
  | 'no_email_found';

export interface Lead {
  id: string;
  user_id: string;
  workspace_id: string | null;
  campaign_id: string | null;
  list_id: string | null;
  linkedin_url: string | null;
  first_name: string | null;
  last_name: string | null;
  headline: string | null;
  company: string | null;
  title: string | null;
  location: string | null;
  email: string | null;
  avatar_url: string | null;
  profile_data: Record<string, unknown> | null;
  status: LeadStatus;
  tags: string[] | null;
  enrichment_status: EnrichmentStatus;
  enriched_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface LeadListResponse {
  leads: Lead[];
  total: number;
  limit: number;
  offset: number;
}

// LinkedIn Account types
export type LinkedInStatus = 'connected' | 'disconnected' | 'warning' | 'banned';
export type SubscriptionType = 'free' | 'premium' | 'sales_nav' | 'recruiter';
export type SyncMode = 'all' | 'campaign_only';

export interface LinkedInAccount {
  id: string;
  user_id: string;
  workspace_id: string | null;
  unipile_account_id: string;
  name: string | null;
  profile_url: string | null;
  avatar_url: string | null;
  status: LinkedInStatus;
  subscription_type: SubscriptionType;
  daily_limits: Record<string, number>;
  working_hours: {
    timezone?: string;
    start?: string;
    end?: string;
    days?: number[];
  } | null;
  proxy_ip: string | null;
  default_email_account_id: string | null;
  sync_mode: SyncMode;
  last_synced_at: string | null;
  created_at: string;
}

// LinkedIn Auth types
export type CheckpointType = '2FA' | 'OTP' | 'IN_APP_VALIDATION' | 'CAPTCHA' | 'PHONE_REGISTER';

export interface ProxyConfig {
  host: string;
  port: number;
  username?: string;
  password?: string;
}

export interface LinkedInConnectCredentialsRequest {
  username: string;
  password: string;
  workspace_id?: string;
  proxy?: ProxyConfig;
  sync_mode?: SyncMode;
}

export interface LinkedInConnectCookieRequest {
  access_token: string;
  user_agent?: string;
  workspace_id?: string;
  proxy?: ProxyConfig;
  sync_mode?: SyncMode;
}

export interface LinkedInSolveCheckpointRequest {
  account_id: string;
  code: string;
  sync_mode?: SyncMode;
  workspace_id?: string;
}

export interface LinkedInAuthSuccessResponse {
  status: 'connected';
  account_id: string;
  account?: LinkedInAccount;
}

export interface LinkedInAuthCheckpointResponse {
  status: 'checkpoint';
  account_id: string;
  checkpoint: {
    type: CheckpointType;
  };
}

export interface LinkedInAuthPendingResponse {
  status: 'pending';
  account_id: string;
  message: string;
}

export type LinkedInAuthResponse =
  | LinkedInAuthSuccessResponse
  | LinkedInAuthCheckpointResponse
  | LinkedInAuthPendingResponse;

// Email Account types
export type EmailProvider = 'google' | 'microsoft' | 'imap';
export type EmailStatus = 'connected' | 'disconnected' | 'reconnect_required';

export interface EmailAccount {
  id: string;
  user_id: string;
  workspace_id: string | null;
  unipile_account_id: string;
  email_address: string;
  provider: EmailProvider;
  daily_limit: number;
  status: EmailStatus;
  display_name: string | null;
  working_hours: WorkingHours | null;
  sync_mode: SyncMode;
  last_synced_at: string | null;
  created_at: string;
}

export interface WorkingHours {
  start: string;
  end: string;
  timezone: string;
  days: number[];
}

// Email Auth types
export interface EmailConnectIMAPRequest {
  email_address: string;
  imap_password: string;
  imap_host: string;
  imap_port?: number;
  smtp_host: string;
  smtp_port?: number;
  imap_encryption?: 'SSL' | 'TLS' | 'NONE';
  smtp_password?: string;
  workspace_id?: string;
  display_name?: string;
  sync_mode?: SyncMode;
}

export interface EmailConnectGoogleRequest {
  access_token: string;
  refresh_token: string;
  email_address: string;
  workspace_id?: string;
  display_name?: string;
  sync_mode?: SyncMode;
}

export interface EmailConnectMicrosoftRequest {
  access_token: string;
  refresh_token: string;
  email_address: string;
  user_id: string;
  workspace_id?: string;
  display_name?: string;
  sync_mode?: SyncMode;
}

export interface EmailAuthSuccessResponse {
  status: 'connected';
  account_id: string;
  account?: EmailAccount;
}

export interface EmailAuthErrorResponse {
  status: 'error';
  message: string;
  error_type?: string;
}

export type EmailAuthResponse = EmailAuthSuccessResponse | EmailAuthErrorResponse;

// Calendar types
export type CalendarProvider = 'google' | 'microsoft';
export type CalendarStatus = 'connected' | 'disconnected';

export interface CalendarAccount {
  id: string;
  user_id: string;
  workspace_id: string | null;
  unipile_account_id: string;
  email_address: string;
  provider: CalendarProvider;
  display_name: string | null;
  calendar_id: string | null;
  scheduling_link: string | null;
  status: CalendarStatus;
  created_at: string;
}

// Inbox types
export type Channel = 'linkedin' | 'email';
export type ConversationStatus = 'open' | 'snoozed' | 'closed';
export type MessageDirection = 'inbound' | 'outbound';

export interface Message {
  id: string;
  conversation_id: string;
  lead_id: string;
  linkedin_account_id: string | null;
  email_account_id: string | null;
  direction: MessageDirection;
  channel: Channel;
  content: string;
  subject: string | null;
  unipile_message_id: string | null;
  sent_at: string | null;
  read_at: string | null;
  created_at: string;
}

export interface Conversation {
  id: string;
  user_id: string;
  workspace_id: string | null;
  lead_id: string;
  linkedin_account_id: string | null;
  email_account_id: string | null;
  unipile_conversation_id: string | null;
  channel: Channel;
  last_message_at: string | null;
  unread_count: number;
  status: ConversationStatus;
  snoozed_until: string | null;
  tags: string[] | null;
  created_at: string;
  last_message_preview: string | null;
  lead_name: string | null;
  lead_company: string | null;
  lead_avatar_url: string | null;
  agent_status?: string | null;
}

export interface ConversationWithMessages extends Conversation {
  messages: Message[];
  lead_name: string | null;
  lead_company: string | null;
  lead_avatar_url: string | null;
}

export interface ConversationListResponse {
  conversations: Conversation[];
  total: number;
}

// Billing types

export interface SubscriptionInfo {
  id: string;
  status: string;
  plan: 'growth' | 'agency';
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  quantity: number;
}

export interface BillingOverview {
  plan: 'growth' | 'agency';
  subscription: SubscriptionInfo | null;
  sender_count: number;
  monthly_cost: number;
  price_per_sender: number;
  included_senders: number;
  extra_senders: number;
  linkedin_accounts_connected: number;
  workspaces: number;
  recommend_agency: boolean;
}

export interface Invoice {
  id: string;
  amount_due: number;
  amount_paid: number;
  currency: string;
  status: string;
  invoice_pdf: string | null;
  created: string;
}

// Pricing info
export interface VolumePricingTier {
  min_senders: number;
  max_senders: number;
  price_per_sender: number;
}

export interface PricingInfo {
  growth_tiers: VolumePricingTier[];
  agency_monthly: number;
  agency_annual: number;
  agency_included_senders: number;
  agency_extra_sender_price: number;
}

// Checkout requests
export interface GrowthCheckoutRequest {
  sender_count: number;
  success_url?: string;
  cancel_url?: string;
}

export interface AgencyCheckoutRequest {
  annual?: boolean;
  success_url?: string;
  cancel_url?: string;
}

export interface UpdateGrowthSendersRequest {
  sender_count: number;
}

export interface UpdateAgencyExtraSendersRequest {
  extra_sender_count: number;
}

// Analytics types

// Dashboard stats (6 stat cards)
export interface DashboardStats {
  connections_sent: number;
  connections_sent_change: string;
  connections_accepted: number;
  connections_accepted_change: string;
  acceptance_rate: string;
  messages_sent: number;
  messages_sent_change: string;
  message_replies: number;
  message_reply_rate: string;
  emails_sent: number;
  emails_sent_change: string;
  email_replies: number;
  email_reply_rate: string;
}

// Activity chart data
export interface ActivityChartData {
  labels: string[];
  connections: number[];
  emails: number[];
  replies: number[];
}

// Recent activity item
export interface RecentActivityItem {
  type: 'connection' | 'reply' | 'email' | 'status_change';
  name: string;
  company: string | null;
  time: string;
  status: string;
  channel: 'linkedin' | 'email' | null;
}

// Active campaign for dashboard
export interface ActiveCampaignItem {
  id: string;
  name: string;
  status: 'active' | 'paused' | 'stopped';
  progress: number;
  leads: number;
  sent: number;
  replies: number;
}

// Analytics page overview stats (4 cards)
export interface AnalyticsOverviewStats {
  total_outreach: number;
  total_outreach_change: string;
  connections_made: number;
  connections_made_change: string;
  reply_rate: string;
  reply_rate_change: string;
  meetings_booked: number | null;
}

// Channel performance
export interface ChannelPerformance {
  linkedin_messages_sent: number;
  linkedin_connection_rate: string;
  linkedin_reply_rate: string;
  linkedin_avg_response_time: string | null;
  email_sent: number;
  email_open_rate: string | null;
  email_reply_rate: string;
  email_bounce_rate: string | null;
}

// Campaign performance for table
export interface CampaignPerformanceItem {
  id: string;
  name: string;
  sent: number;
  connection_rate: number;
  reply_rate: number;
  meetings: number | null;
}

// Sender performance
export interface SenderPerformanceItem {
  id: string;
  name: string;
  sent: number;
  connection_rate: number;
  reply_rate: number;
}

// Reply rate trend point
export interface ReplyRateTrendPoint {
  label: string;
  rate: number;
}

// Legacy types (keep for backwards compatibility)
export interface AnalyticsOverview {
  connections_sent: number;
  connections_change: number;
  accepted: number;
  acceptance_rate: number;
  replies: number;
  reply_rate: number;
  positive_replies: number;
}

export interface CampaignAnalytics {
  leads_total: number;
  leads_contacted: number;
  leads_accepted: number;
  leads_replied: number;
  acceptance_rate: number;
  reply_rate: number;
}

// Pagination
export interface PaginationParams {
  limit?: number;
  offset?: number;
}

// Import Job types
export type ImportType =
  | 'linkedin_search'
  | 'sales_nav_leads'
  | 'sales_nav_accounts'
  | 'linkedin_recruiter'
  | 'linkedin_events'
  | 'linkedin_post_reactors'
  | 'linkedin_companies'
  | 'linkedin_people_search'
  | 'csv'
  | 'paste_urls';

export type ImportJobStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface ImportJob {
  id: string;
  list_id: string;
  import_type: ImportType;
  status: ImportJobStatus;
  source_url: string | null;
  total_count: number | null;
  processed_count: number;
  created_count: number;
  skipped_count: number;
  error_count: number;
  error_message: string | null;
  progress: number;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface ImportJobStartRequest {
  list_name: string;
  import_type: ImportType;
  linkedin_account_id?: string;
  source_url?: string;
  source_data?: string[];
  search_params?: Record<string, unknown>;
  workspace_id?: string;
  max_leads?: number | null;
}

export interface ImportJobStartResponse {
  job_id: string;
  list_id: string;
  status: ImportJobStatus;
  message: string;
}

// Notification types
export type NotificationType =
  | 'campaign_started'
  | 'campaign_completed'
  | 'campaign_paused'
  | 'campaign_error'
  | 'new_reply'
  | 'multiple_replies'
  | 'new_connection'
  | 'message_sent'
  | 'message_failed'
  | 'account_connected'
  | 'account_disconnected'
  | 'account_error'
  | 'subscription_created'
  | 'subscription_updated'
  | 'subscription_cancelled'
  | 'payment_failed'
  | 'system_alert'
  | 'daily_digest'
  | 'weekly_digest';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  campaign_id: string | null;
  lead_id: string | null;
  is_read: boolean;
  created_at: string;
  read_at: string | null;
}

export interface NotificationListResponse {
  notifications: Notification[];
  total: number;
  unread_count: number;
}

export interface NotificationSSEEvent {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  campaign_id: string | null;
  lead_id: string | null;
  created_at: string;
}

// Enrichment types
export type EnrichmentJobStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface EnrichmentJob {
  id: string;
  status: EnrichmentJobStatus;
  total_count: number;
  processed_count: number;
  enriched_count: number;
  failed_count: number;
  progress: number;
  created_at: string;
  completed_at: string | null;
}

export interface EnrichLeadsRequest {
  lead_ids: string[];
}

export interface EnrichLeadsResponse {
  job_id: string;
  status: string;
  lead_count: number;
  message: string;
}

// Admin types

export interface AdminUserStats {
  linkedin_accounts: number;
  email_accounts: number;
  campaigns_total: number;
  campaigns_active: number;
  leads_total: number;
  messages_sent: number;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  is_active: boolean;
  is_verified: boolean;
  is_admin: boolean;
  subscription_status: string | null;
  plan: string | null;
  sender_count: number;
  stripe_customer_id: string | null;
  created_at: string;
  updated_at: string | null;
  stats: AdminUserStats | null;
}

export interface AdminUserListResponse {
  items: AdminUser[];
  total: number;
  page: number;
  per_page: number;
}

export interface AdminUserUpdate {
  name?: string;
  email?: string;
  is_active?: boolean;
  is_admin?: boolean;
  subscription_status?: string;
  plan?: PlanType;
  sender_count?: number;
}

// Partner Code types
export interface PartnerCode {
  id: string;
  code: string;
  partner_name: string;
  partner_email: string;
  notes: string | null;
  access_type: 'full' | 'limited';
  duration_days: number | null;
  start_type: 'signup' | 'custom';
  custom_start_date: string | null;
  code_expiry: string | null;
  max_uses: number | null;
  current_uses: number;
  new_users_only: boolean;
  single_use_per_user: boolean;
  max_senders: number | null;
  max_sequences: number | null;
  max_emails_per_day: number | null;
  max_linkedin_actions_per_day: number | null;
  enrichment_credits: number | null;
  api_access: boolean;
  export_data: boolean;
  integrations: 'all' | 'limited' | 'none';
  revenue_share_enabled: boolean;
  revenue_share_percent: number | null;
  revenue_share_duration: 'first_payment' | '3_months' | '1_year' | 'lifetime' | null;
  is_active: boolean;
  is_expired: boolean;
  is_maxed_out: boolean;
  can_be_redeemed: boolean;
  created_at: string;
  updated_at: string | null;
}

export interface PartnerCodeUse {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string | null;
  redeemed_at: string;
  access_starts_at: string;
  access_expires_at: string | null;
  is_active: boolean;
  days_until_expiry: number | null;
  converted_to_paid: boolean;
  converted_at: string | null;
  revenue_generated: number;
  revenue_share_paid: number;
}

export interface PartnerCodeDetail extends PartnerCode {
  active_users: number;
  expired_users: number;
  converted_users: number;
  conversion_rate: number;
  total_revenue: number;
  total_earnings: number;
  amount_owed: number;
  amount_paid: number;
  recent_uses: PartnerCodeUse[];
}

export interface PartnerCodeListResponse {
  items: PartnerCode[];
  total: number;
  page: number;
  per_page: number;
}

export interface PartnerCodeCreate {
  code?: string;
  partner_name: string;
  partner_email: string;
  notes?: string;
  access_type?: 'full' | 'limited';
  duration_days?: number | null;
  start_type?: 'signup' | 'custom';
  custom_start_date?: string;
  code_expiry?: string;
  max_uses?: number | null;
  new_users_only?: boolean;
  single_use_per_user?: boolean;
  max_senders?: number | null;
  max_sequences?: number | null;
  max_emails_per_day?: number | null;
  max_linkedin_actions_per_day?: number | null;
  enrichment_credits?: number | null;
  api_access?: boolean;
  export_data?: boolean;
  integrations?: 'all' | 'limited' | 'none';
  revenue_share_enabled?: boolean;
  revenue_share_percent?: number | null;
  revenue_share_duration?: 'first_payment' | '3_months' | '1_year' | 'lifetime' | null;
}

export interface PartnerCodeUpdate {
  partner_name?: string;
  partner_email?: string;
  notes?: string;
  access_type?: 'full' | 'limited';
  duration_days?: number | null;
  start_type?: 'signup' | 'custom';
  custom_start_date?: string;
  code_expiry?: string;
  max_uses?: number | null;
  new_users_only?: boolean;
  single_use_per_user?: boolean;
  max_senders?: number | null;
  max_sequences?: number | null;
  max_emails_per_day?: number | null;
  max_linkedin_actions_per_day?: number | null;
  enrichment_credits?: number | null;
  api_access?: boolean;
  export_data?: boolean;
  integrations?: 'all' | 'limited' | 'none';
  revenue_share_enabled?: boolean;
  revenue_share_percent?: number | null;
  revenue_share_duration?: 'first_payment' | '3_months' | '1_year' | 'lifetime' | null;
  is_active?: boolean;
}

export interface PartnerCodeTemplate {
  name: string;
  description: string;
  access_type: 'full' | 'limited';
  duration_days: number | null;
  revenue_share_enabled: boolean;
  revenue_share_percent: number | null;
  revenue_share_duration: 'first_payment' | '3_months' | '1_year' | 'lifetime' | null;
  max_senders?: number | null;
  api_access?: boolean;
}

export interface PartnerCodeAnalytics {
  total_uses: number;
  active_users: number;
  expired_users: number;
  converted_to_paid: number;
  conversion_rate: number;
  total_revenue: number;
  partner_earnings: number;
  amount_owed: number;
  amount_paid: number;
}

export interface ImpersonateResponse {
  access_token: string;
  token_type: string;
  user_id: string;
  user_email: string;
  expires_in: number;
}

export interface AdminOverviewStats {
  total_users: number;
  active_users: number;
  total_partners: number;
  active_partners: number;
  total_campaigns: number;
  active_campaigns: number;
  total_leads: number;
  total_messages_sent: number;
  new_users_today: number;
  new_users_this_week: number;
  new_users_this_month: number;
}

export interface SignupTrend {
  date: string;
  count: number;
}

export interface AdminSignupTrends {
  daily: SignupTrend[];
  period_days: number;
}

// Campaign Progress Tracking Types

export interface SenderActivityItem {
  name: string;
  channel: 'linkedin' | 'email';
  actions_today: number;
  connection_requests_today: number;
  daily_limit: number;
  emails_today: number;
  email_daily_limit: number;
}

export interface CampaignMetrics {
  campaign_id: string;
  total_leads: number;
  leads_by_status: Record<string, number>;
  processing_speed: number;
  processed_today: number;
  last_activity_at: string | null;
  actions_today: number;
  sender_activity: SenderActivityItem[];
  status_summary: string;
  status_type: 'active' | 'at_limit' | 'waiting' | 'complete';
}

export interface StepProgressItem {
  step_id: string;
  step_order: number;
  step_type: StepType;
  step_config?: Record<string, unknown> | null;
  leads_at_step: number;
  leads_completed: number;
  leads_in_progress: number;
}

export interface CampaignProgress {
  campaign_id: string;
  campaign_status: CampaignStatus;
  overall_progress: number;
  current_step: string | null;
  leads_completed: number;
  leads_in_progress: number;
  leads_pending: number;
  estimated_completion: string | null;
  steps_breakdown: StepProgressItem[];
}

export interface StatusBreakdownItem {
  status: string;
  count: number;
  percentage: number;
}

export interface StepBreakdownItem {
  step_id: string;
  step_order: number;
  step_type: string;
  count: number;
  percentage: number;
}

export interface LeadBreakdown {
  campaign_id: string;
  by_status: StatusBreakdownItem[];
  by_step: StepBreakdownItem[];
  total_leads: number;
}

export interface CampaignProgressSSEEvent {
  event_type: 'metrics_update' | 'lead_status_change' | 'step_progress' | 'campaign_state_change';
  campaign_id: string;
  timestamp: string;
  data: Record<string, unknown>;
}

export interface CampaignErrorItem {
  lead_id: string;
  lead_name: string | null;
  linkedin_url: string | null;
  error_message: string | null;
  error_count: number;
  last_error_at: string | null;
  current_step_type: string | null;
}

export interface CampaignErrors {
  campaign_id: string;
  total_errors: number;
  errors: CampaignErrorItem[];
}

export interface CampaignActivityItem {
  lead_id: string;
  lead_name: string | null;
  step_type: string;
  outcome: string;
  timestamp: string;
  action_label: string | null;
}

export interface CampaignActivity {
  campaign_id: string;
  activities: CampaignActivityItem[];
}
