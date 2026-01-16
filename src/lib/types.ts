// User types
export type PlanType = 'starter' | 'growth' | 'agency' | 'unlimited';

export interface User {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  is_active: boolean;
  is_verified: boolean;
  plan: PlanType;
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
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface AuthResponse {
  user: User;
  tokens: TokenResponse;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

// Workspace types
export type WorkspaceRole = 'admin' | 'member';

export interface Workspace {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  client_name: string | null;
  client_email: string | null;
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

// Campaign types
export type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed';
export type StepType =
  | 'connection_request'
  | 'message'
  | 'inmail'
  | 'profile_view'
  | 'follow'
  | 'like_post'
  | 'wait'
  | 'condition'
  | 'email'
  | 'email_followup';

export interface CampaignStep {
  id: string;
  campaign_id: string;
  order: number;
  type: StepType;
  config: Record<string, unknown>;
  true_branch_step_id: string | null;
  false_branch_step_id: string | null;
  created_at: string;
}

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
  workspace_id: string | null;
  name: string;
  status: CampaignStatus;
  created_by: string | null;
  temporal_workflow_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CampaignWithDetails extends Campaign {
  steps: CampaignStep[];
  senders: CampaignSender[];
  lead_count: number;
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
  ai_icebreaker: string | null;
  status: LeadStatus;
  tags: string[] | null;
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
  working_hours: Record<string, unknown>;
  proxy_ip: string | null;
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
}

export interface LinkedInConnectCookieRequest {
  access_token: string;
  user_agent?: string;
  workspace_id?: string;
  proxy?: ProxyConfig;
}

export interface LinkedInSolveCheckpointRequest {
  account_id: string;
  code: string;
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

export type LinkedInAuthResponse = LinkedInAuthSuccessResponse | LinkedInAuthCheckpointResponse;

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
  last_synced_at: string | null;
  created_at: string;
}

export interface HostedAuthLinkResponse {
  url: string;
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
export interface PlanInfo {
  id: string;
  name: string;
  price: number;
  linkedin_accounts: number;
  email_accounts: number;
  leads_per_month: number;
  workspaces: number;
  features: string[];
}

export interface BillingOverview {
  plan: PlanType;
  status: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  linkedin_accounts_used: number;
  linkedin_accounts_limit: number;
  leads_used: number;
  leads_limit: number;
}

export interface Invoice {
  id: string;
  amount: number;
  status: string;
  created: string;
  invoice_pdf: string | null;
}

// Analytics types
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
  workspace_id?: string;
}

export interface ImportJobStartResponse {
  job_id: string;
  list_id: string;
  status: ImportJobStatus;
  message: string;
}
