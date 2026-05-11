import type {
  ActiveCampaignItem,
  CalendarAccount,
  DashboardStats,
  DiscoverySearchPreview,
  EmailAccount,
  LeadList,
  LinkedInAccount,
  RecentActivityItem,
  User,
  Workspace,
} from './types';

const DASHBOARD_PREVIEW_STORAGE_KEY = 'salesparrot-dashboard-preview';

export function isDashboardPreviewEnabled(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  const params = new URLSearchParams(window.location.search);
  const requestedInUrl = params.get('preview') === '1';
  const onDashboardRoute = window.location.pathname.startsWith('/dashboard');

  if (requestedInUrl && onDashboardRoute) {
    window.sessionStorage.setItem(DASHBOARD_PREVIEW_STORAGE_KEY, '1');
    return true;
  }

  return onDashboardRoute && window.sessionStorage.getItem(DASHBOARD_PREVIEW_STORAGE_KEY) === '1';
}

export const DASHBOARD_PREVIEW_USER: User = {
  id: 'preview-user',
  email: 'preview@salesparrot.local',
  name: 'Preview User',
  avatar_url: null,
  is_active: true,
  is_verified: true,
  is_admin: false,
  plan: 'growth',
  subscription_status: 'active',
  partner_access: null,
  has_invited_workspace_access: true,
  created_at: '2026-05-01T10:00:00Z',
  updated_at: '2026-05-09T10:00:00Z',
};

export const DASHBOARD_PREVIEW_WORKSPACE: Workspace = {
  id: 'preview-workspace',
  user_id: DASHBOARD_PREVIEW_USER.id,
  name: 'Atlas Advisory',
  slug: 'atlas-advisory',
  client_name: 'Atlas Advisory',
  client_email: 'team@atlasadvisory.co',
  website_url: 'https://atlasadvisory.co',
  business_blurb:
    'Atlas Advisory helps B2B founders tighten outbound positioning and move warm pipeline faster.',
  icp: 'Founders, CROs, and RevOps leaders at B2B SaaS companies with 20 to 250 employees',
  outreach_intent:
    'Book high-context discovery meetings with teams reviewing their outbound engine',
  brand_tone: 'Professional, warm, and sharp',
  value_proposition:
    'Turn underperforming outbound into a tighter, more relevant pipeline motion without extra headcount.',
  cta_preference: 'Invite the lead to a short working session',
  reply_guardrails: 'Stay concrete, avoid hype, and never overstate customer results.',
  forbidden_claims: 'Do not guarantee reply rates or closed revenue.',
  working_hours: {
    timezone: 'America/New_York',
    start: '09:00',
    end: '17:00',
    days: [1, 2, 3, 4, 5],
  },
  agent_defaults: {
    goal: 'Generate qualified meetings from outbound',
    tone: 'professional',
    company_name: 'Atlas Advisory',
    product_description: 'Outbound advisory and campaign execution',
    sender_title: 'Growth Advisor',
  },
  created_at: '2026-05-01T10:00:00Z',
};

export const DASHBOARD_PREVIEW_LINKEDIN_ACCOUNTS: LinkedInAccount[] = [
  {
    id: 'preview-linkedin-1',
    user_id: DASHBOARD_PREVIEW_USER.id,
    workspace_id: DASHBOARD_PREVIEW_WORKSPACE.id,
    unipile_account_id: 'preview-unipile-linkedin-1',
    name: 'Nadia Hassan',
    profile_url: 'https://www.linkedin.com/in/nadiahassan',
    avatar_url: null,
    status: 'connected',
    subscription_type: 'premium',
    daily_limits: {
      connection_requests: 30,
      messages: 60,
      profile_visits: 80,
      follows: 20,
      likes: 15,
    },
    working_hours: {
      timezone: 'America/New_York',
      start: '09:00',
      end: '17:00',
      days: [1, 2, 3, 4, 5],
    },
    proxy_ip: null,
    default_email_account_id: 'preview-email-1',
    sync_mode: 'all',
    last_synced_at: '2026-05-09T13:20:00Z',
    created_at: '2026-05-01T10:00:00Z',
  },
];

export const DASHBOARD_PREVIEW_EMAIL_ACCOUNTS: EmailAccount[] = [
  {
    id: 'preview-email-1',
    user_id: DASHBOARD_PREVIEW_USER.id,
    workspace_id: DASHBOARD_PREVIEW_WORKSPACE.id,
    unipile_account_id: 'preview-unipile-email-1',
    email_address: 'nadia@atlasadvisory.co',
    provider: 'google',
    daily_limit: 120,
    status: 'connected',
    display_name: 'Nadia Hassan',
    working_hours: {
      timezone: 'America/New_York',
      start: '09:00',
      end: '17:00',
      days: [1, 2, 3, 4, 5],
    },
    sync_mode: 'all',
    last_synced_at: '2026-05-09T13:18:00Z',
    created_at: '2026-05-01T10:00:00Z',
  },
];

export const DASHBOARD_PREVIEW_CALENDAR_ACCOUNTS: CalendarAccount[] = [
  {
    id: 'preview-calendar-1',
    user_id: DASHBOARD_PREVIEW_USER.id,
    workspace_id: DASHBOARD_PREVIEW_WORKSPACE.id,
    unipile_account_id: 'preview-unipile-calendar-1',
    email_address: 'nadia@atlasadvisory.co',
    provider: 'google',
    display_name: 'Nadia Hassan',
    calendar_id: 'primary',
    scheduling_link: 'https://calendar.atlasadvisory.co/nadia/intro',
    status: 'connected',
    created_at: '2026-05-01T10:00:00Z',
  },
];

export const DASHBOARD_PREVIEW_LEAD_LISTS: LeadList[] = [
  {
    id: 'preview-list-1',
    user_id: DASHBOARD_PREVIEW_USER.id,
    workspace_id: DASHBOARD_PREVIEW_WORKSPACE.id,
    name: 'UK RevOps Leaders',
    source: 'linkedin_search',
    lead_count: 84,
    enriched_count: 61,
    created_at: '2026-05-04T10:00:00Z',
    updated_at: '2026-05-09T09:30:00Z',
  },
  {
    id: 'preview-list-2',
    user_id: DASHBOARD_PREVIEW_USER.id,
    workspace_id: DASHBOARD_PREVIEW_WORKSPACE.id,
    name: 'Series A Fintech Founders',
    source: 'discovery',
    lead_count: 37,
    enriched_count: 28,
    created_at: '2026-05-06T11:00:00Z',
    updated_at: '2026-05-09T08:45:00Z',
  },
];

export const DASHBOARD_PREVIEW_STATS: DashboardStats = {
  connections_sent: 146,
  connections_sent_change: '+18%',
  connections_accepted: 61,
  connections_accepted_change: '+9%',
  acceptance_rate: '41.8%',
  messages_sent: 124,
  messages_sent_change: '+14%',
  message_replies: 29,
  message_reply_rate: '23.4%',
  emails_sent: 88,
  emails_sent_change: '+11%',
  email_replies: 17,
  email_reply_rate: '19.3%',
};

export const DASHBOARD_PREVIEW_ACTIVITY: RecentActivityItem[] = [
  {
    type: 'reply',
    name: 'Harriet Cole replied',
    company: 'Northstar Metrics',
    time: '12m ago',
    status: 'Interested',
    channel: 'linkedin',
  },
  {
    type: 'email',
    name: 'Meeting request sent',
    company: 'Ledger Spring',
    time: '37m ago',
    status: 'Follow-up queued',
    channel: 'email',
  },
  {
    type: 'connection',
    name: '8 new connections accepted',
    company: null,
    time: '1h ago',
    status: 'Warming up',
    channel: 'linkedin',
  },
];

export const DASHBOARD_PREVIEW_CAMPAIGNS: ActiveCampaignItem[] = [
  {
    id: 'preview-campaign-1',
    name: 'UK RevOps Diagnostic',
    status: 'active',
    progress: 64,
    leads: 84,
    sent: 59,
    replies: 12,
  },
  {
    id: 'preview-campaign-2',
    name: 'Fintech Founder Warm Intro',
    status: 'paused',
    progress: 31,
    leads: 37,
    sent: 18,
    replies: 4,
  },
];

export const DASHBOARD_PREVIEW_DISCOVERY_PROMPT =
  'B2B SaaS companies hiring RevOps leaders in London and showing signs of outbound expansion';

export const DASHBOARD_PREVIEW_DISCOVERY_PREVIEW: DiscoverySearchPreview = {
  name: 'RevOps expansion signals in London',
  summary:
    'Parrot will watch for companies and people that match this hiring-and-expansion brief, then add net-new matches into a lead list as they are found.',
  warnings: [
    'Broadening the geography or role slightly may increase match volume.',
    'Connecting LinkedIn widens coverage beyond web signals.',
  ],
  normalized_criteria: {
    brief: DASHBOARD_PREVIEW_DISCOVERY_PROMPT,
  },
  normalized_sources: {
    web_search: true,
    linkedin: true,
  },
  next_run_at: null,
};
