import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, getErrorMessage } from '../../api';
import { queryKeys } from '../../queryClient';
import { useWorkspaceStore } from '../../workspace';
import type {
  LinkedInAccount,
  EmailAccount,
  CalendarAccount,
  LinkedInConnectCredentialsRequest,
  LinkedInConnectCookieRequest,
  LinkedInSolveCheckpointRequest,
  LinkedInAuthResponse,
  EmailConnectIMAPRequest,
  EmailConnectGoogleRequest,
  EmailConnectMicrosoftRequest,
  EmailAuthResponse,
  CalendarProvider,
  SyncMode,
} from '../../types';

interface AccountFilters {
  workspace_id?: string;
}

interface CreateLinkedInAccountData {
  unipile_account_id: string;
  name?: string;
  profile_url?: string;
  workspace_id?: string;
}

interface UpdateLinkedInAccountData {
  name?: string;
  workspace_id?: string;
  daily_limits?: Record<string, number>;
  working_hours?: Record<string, unknown>;
  default_email_account_id?: string | null;
}

// LinkedIn Accounts

export const useLinkedInAccounts = (filters?: AccountFilters) => {
  const currentWorkspaceId = useWorkspaceStore((s) => s.currentWorkspaceId);
  const workspaceId = filters?.workspace_id ?? currentWorkspaceId ?? undefined;

  return useQuery({
    queryKey: queryKeys.linkedinAccounts.list(
      workspaceId ? { workspace_id: workspaceId } : undefined
    ),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (workspaceId) params.append('workspace_id', workspaceId);

      const response = await api.get<LinkedInAccount[]>(`/linkedin-accounts?${params}`);
      return response.data;
    },
  });
};

export const useLinkedInAccount = (accountId: string) => {
  return useQuery({
    queryKey: queryKeys.linkedinAccounts.detail(accountId),
    queryFn: async () => {
      const response = await api.get<LinkedInAccount>(`/linkedin-accounts/${accountId}`);
      return response.data;
    },
    enabled: !!accountId,
  });
};

export const useCreateLinkedInAccount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateLinkedInAccountData) => {
      const response = await api.post<LinkedInAccount>('/linkedin-accounts', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.linkedinAccounts.all });
    },
    onError: (error) => {
      throw new Error(getErrorMessage(error));
    },
  });
};

export const useUpdateLinkedInAccount = (accountId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateLinkedInAccountData) => {
      const response = await api.patch<LinkedInAccount>(`/linkedin-accounts/${accountId}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.linkedinAccounts.detail(accountId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.linkedinAccounts.all });
    },
    onError: (error) => {
      throw new Error(getErrorMessage(error));
    },
  });
};

interface DeleteLinkedInAccountOptions {
  accountId: string;
  deleteConversations?: boolean;
}

interface DisconnectAccountResponse {
  account_deleted: boolean;
  unipile_disconnected: boolean;
  conversations_deleted: number;
  messages_deleted: number;
  error: string | null;
  message: string;
}

export const useDeleteLinkedInAccount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      accountId,
      deleteConversations = false,
    }: DeleteLinkedInAccountOptions) => {
      const response = await api.post<DisconnectAccountResponse>(
        `/linkedin-accounts/${accountId}/disconnect`,
        { delete_conversations: deleteConversations }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.linkedinAccounts.all });
    },
  });
};

export const useSyncLinkedInAccount = (accountId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await api.post<LinkedInAccount>(`/linkedin-accounts/${accountId}/sync`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.linkedinAccounts.detail(accountId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.linkedinAccounts.all });
    },
    onError: (error) => {
      throw new Error(getErrorMessage(error));
    },
  });
};

interface SyncChatsResponse {
  chats_fetched: number;
  leads_created: number;
  conversations_created: number;
  conversations_updated: number;
  messages_synced: number;
}

export const useSyncLinkedInChats = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ accountId, syncMode }: { accountId: string; syncMode?: SyncMode }) => {
      const response = await api.post<SyncChatsResponse>('/inbox/sync', {
        linkedin_account_id: accountId,
        limit: 100,
        sync_messages: true,
        sync_mode: syncMode,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.linkedinAccounts.all });
    },
  });
};

// LinkedIn Custom Auth - Connect with credentials
export const useConnectLinkedInWithCredentials = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: LinkedInConnectCredentialsRequest) => {
      const response = await api.post<LinkedInAuthResponse>(
        '/linkedin-accounts/connect/credentials',
        data
      );
      return response.data;
    },
    onSuccess: (data) => {
      if (data.status === 'connected') {
        queryClient.invalidateQueries({ queryKey: queryKeys.linkedinAccounts.all });
      }
    },
    onError: (error) => {
      throw new Error(getErrorMessage(error));
    },
  });
};

// LinkedIn Custom Auth - Connect with cookie
export const useConnectLinkedInWithCookie = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: LinkedInConnectCookieRequest) => {
      const response = await api.post<LinkedInAuthResponse>(
        '/linkedin-accounts/connect/cookie',
        data
      );
      return response.data;
    },
    onSuccess: (data) => {
      if (data.status === 'connected') {
        queryClient.invalidateQueries({ queryKey: queryKeys.linkedinAccounts.all });
      }
    },
    onError: (error) => {
      throw new Error(getErrorMessage(error));
    },
  });
};

// LinkedIn Custom Auth - Solve checkpoint
export const useSolveLinkedInCheckpoint = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: LinkedInSolveCheckpointRequest) => {
      const response = await api.post<LinkedInAuthResponse>(
        '/linkedin-accounts/connect/checkpoint',
        data
      );
      return response.data;
    },
    onSuccess: (data) => {
      if (data.status === 'connected') {
        queryClient.invalidateQueries({ queryKey: queryKeys.linkedinAccounts.all });
      }
    },
    onError: (error) => {
      throw new Error(getErrorMessage(error));
    },
  });
};

// LinkedIn Custom Auth - Poll for IN_APP_VALIDATION
export const usePollLinkedInStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      accountId,
      syncMode,
      workspaceId,
    }: {
      accountId: string;
      syncMode?: SyncMode;
      workspaceId?: string;
    }) => {
      const response = await api.post<LinkedInAuthResponse>(
        '/linkedin-accounts/connect/poll-status',
        { account_id: accountId, sync_mode: syncMode, workspace_id: workspaceId }
      );
      return response.data;
    },
    onSuccess: (data) => {
      if (data.status === 'connected') {
        queryClient.invalidateQueries({ queryKey: queryKeys.linkedinAccounts.all });
      }
    },
    onError: (error) => {
      throw new Error(getErrorMessage(error));
    },
  });
};

// Email Accounts

export const useEmailAccounts = (filters?: AccountFilters) => {
  const currentWorkspaceId = useWorkspaceStore((s) => s.currentWorkspaceId);
  const workspaceId = filters?.workspace_id ?? currentWorkspaceId ?? undefined;

  return useQuery({
    queryKey: queryKeys.emailAccounts.list(workspaceId ? { workspace_id: workspaceId } : undefined),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (workspaceId) params.append('workspace_id', workspaceId);

      const response = await api.get<EmailAccount[]>(`/email-accounts?${params}`);
      return response.data;
    },
  });
};

export const useEmailAccount = (accountId: string) => {
  return useQuery({
    queryKey: queryKeys.emailAccounts.detail(accountId),
    queryFn: async () => {
      const response = await api.get<EmailAccount>(`/email-accounts/${accountId}`);
      return response.data;
    },
    enabled: !!accountId,
  });
};

export const useDeleteEmailAccount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (accountId: string) => {
      await api.delete(`/email-accounts/${accountId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.emailAccounts.all });
    },
    onError: (error) => {
      throw new Error(getErrorMessage(error));
    },
  });
};

export const useSyncEmailAccount = (accountId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await api.post<EmailAccount>(`/email-accounts/${accountId}/sync`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.emailAccounts.detail(accountId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.emailAccounts.all });
    },
    onError: (error) => {
      throw new Error(getErrorMessage(error));
    },
  });
};

interface UpdateEmailAccountData {
  daily_limit?: number;
  display_name?: string;
  working_hours?: {
    start: string;
    end: string;
    timezone: string;
    days: number[];
  };
  workspace_id?: string;
}

export const useUpdateEmailAccount = (accountId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateEmailAccountData) => {
      const response = await api.patch<EmailAccount>(`/email-accounts/${accountId}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.emailAccounts.detail(accountId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.emailAccounts.all });
    },
    onError: (error) => {
      throw new Error(getErrorMessage(error));
    },
  });
};

interface SyncEmailsResponse {
  emails_fetched: number;
  leads_created: number;
  conversations_created: number;
  conversations_updated: number;
  messages_synced: number;
}

export const useSyncEmailInbox = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ accountId, syncMode }: { accountId: string; syncMode?: SyncMode }) => {
      const response = await api.post<SyncEmailsResponse>('/inbox/sync-emails', {
        email_account_id: accountId,
        limit: 100,
        exclude_sent: true,
        sync_mode: syncMode,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.emailAccounts.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.conversations.all });
    },
    onError: (error) => {
      throw new Error(getErrorMessage(error));
    },
  });
};

interface SendEmailRequest {
  to: string;
  subject: string;
  body: string;
  to_name?: string;
  cc?: string[];
  bcc?: string[];
}

interface SendEmailResponse {
  success: boolean;
  email_id: string | null;
  thread_id: string | null;
}

export const useSendEmail = (accountId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: SendEmailRequest) => {
      const response = await api.post<SendEmailResponse>(
        `/email-accounts/${accountId}/actions/send-email`,
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.conversations.all });
    },
    onError: (error) => {
      throw new Error(getErrorMessage(error));
    },
  });
};

// Email Custom Auth - Connect with IMAP credentials
export const useConnectEmailIMAP = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: EmailConnectIMAPRequest) => {
      const response = await api.post<EmailAuthResponse>('/email-accounts/connect/imap', data);
      return response.data;
    },
    onSuccess: (data) => {
      if (data.status === 'connected') {
        queryClient.invalidateQueries({ queryKey: queryKeys.emailAccounts.all });
      }
    },
    onError: (error) => {
      throw new Error(getErrorMessage(error));
    },
  });
};

// Email Custom Auth - Connect with Google OAuth
export const useConnectEmailGoogle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: EmailConnectGoogleRequest) => {
      const response = await api.post<EmailAuthResponse>('/email-accounts/connect/google', data);
      return response.data;
    },
    onSuccess: (data) => {
      if (data.status === 'connected') {
        queryClient.invalidateQueries({ queryKey: queryKeys.emailAccounts.all });
      }
    },
    onError: (error) => {
      throw new Error(getErrorMessage(error));
    },
  });
};

// Email Custom Auth - Connect with Microsoft OAuth
export const useConnectEmailMicrosoft = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: EmailConnectMicrosoftRequest) => {
      const response = await api.post<EmailAuthResponse>('/email-accounts/connect/microsoft', data);
      return response.data;
    },
    onSuccess: (data) => {
      if (data.status === 'connected') {
        queryClient.invalidateQueries({ queryKey: queryKeys.emailAccounts.all });
      }
    },
    onError: (error) => {
      throw new Error(getErrorMessage(error));
    },
  });
};

// Auth Configuration

interface AuthConfig {
  gmail_auth_method: 'unipile' | 'custom';
  microsoft_auth_method: 'unipile' | 'custom';
  imap_auth_method: 'custom';
}

export const useEmailAuthConfig = () => {
  return useQuery({
    queryKey: ['emailAuthConfig'],
    queryFn: async () => {
      const response = await api.get<AuthConfig>('/email-accounts/auth-config');
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
};

// OAuth Flow Initialization

interface OAuthInitResponse {
  url: string;
  state: string;
}

interface OAuthInitParams {
  workspaceId?: string;
  returnUrl?: string;
  syncMode?: SyncMode;
}

// Gmail Custom OAuth (when GMAIL_AUTH_METHOD is "custom")
export const useInitGoogleOAuth = () => {
  return useMutation({
    mutationFn: async (params?: OAuthInitParams) => {
      const searchParams = new URLSearchParams();
      if (params?.workspaceId) searchParams.append('workspace_id', params.workspaceId);
      if (params?.returnUrl) searchParams.append('return_url', params.returnUrl);
      if (params?.syncMode) searchParams.append('sync_mode', params.syncMode);
      const response = await api.get<OAuthInitResponse>(
        `/email-accounts/oauth/google/init?${searchParams}`
      );
      return response.data;
    },
    onError: (error) => {
      throw new Error(getErrorMessage(error));
    },
  });
};

// Gmail Unipile Hosted Auth (when GMAIL_AUTH_METHOD is "unipile")
export const useInitGmailHostedAuth = () => {
  return useMutation({
    mutationFn: async (params?: OAuthInitParams) => {
      const searchParams = new URLSearchParams();
      if (params?.workspaceId) searchParams.append('workspace_id', params.workspaceId);
      if (params?.returnUrl) searchParams.append('return_url', params.returnUrl);
      if (params?.syncMode) searchParams.append('sync_mode', params.syncMode);
      const response = await api.get<OAuthInitResponse>(
        `/email-accounts/oauth/gmail/hosted-auth-link?${searchParams}`
      );
      return response.data;
    },
    onError: (error) => {
      throw new Error(getErrorMessage(error));
    },
  });
};

// Outlook Unipile Hosted Auth (when MICROSOFT_AUTH_METHOD is "unipile")
export const useInitOutlookHostedAuth = () => {
  return useMutation({
    mutationFn: async (params?: OAuthInitParams) => {
      const searchParams = new URLSearchParams();
      if (params?.workspaceId) searchParams.append('workspace_id', params.workspaceId);
      if (params?.returnUrl) searchParams.append('return_url', params.returnUrl);
      if (params?.syncMode) searchParams.append('sync_mode', params.syncMode);
      const response = await api.get<OAuthInitResponse>(
        `/email-accounts/oauth/outlook/hosted-auth-link?${searchParams}`
      );
      return response.data;
    },
    onError: (error) => {
      throw new Error(getErrorMessage(error));
    },
  });
};

export const useInitMicrosoftOAuth = () => {
  return useMutation({
    mutationFn: async (params?: OAuthInitParams) => {
      const searchParams = new URLSearchParams();
      if (params?.workspaceId) searchParams.append('workspace_id', params.workspaceId);
      if (params?.returnUrl) searchParams.append('return_url', params.returnUrl);
      if (params?.syncMode) searchParams.append('sync_mode', params.syncMode);
      const response = await api.get<OAuthInitResponse>(
        `/email-accounts/oauth/microsoft/init?${searchParams}`
      );
      return response.data;
    },
    onError: (error) => {
      throw new Error(getErrorMessage(error));
    },
  });
};

// Calendar Accounts

export const useCalendarAccounts = (filters?: AccountFilters) => {
  const currentWorkspaceId = useWorkspaceStore((s) => s.currentWorkspaceId);
  const workspaceId = filters?.workspace_id ?? currentWorkspaceId ?? undefined;

  return useQuery({
    queryKey: queryKeys.calendarAccounts.list(
      workspaceId ? { workspace_id: workspaceId } : undefined
    ),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (workspaceId) params.append('workspace_id', workspaceId);

      const response = await api.get<CalendarAccount[]>(`/calendar-accounts?${params}`);
      return response.data;
    },
  });
};

export const useDeleteCalendarAccount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (accountId: string) => {
      await api.delete(`/calendar-accounts/${accountId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.calendarAccounts.all });
    },
    onError: (error) => {
      throw new Error(getErrorMessage(error));
    },
  });
};

interface UpdateCalendarAccountData {
  display_name?: string;
  calendar_id?: string;
  scheduling_link?: string;
}

export const useUpdateCalendarAccount = (accountId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateCalendarAccountData) => {
      const response = await api.patch<CalendarAccount>(`/calendar-accounts/${accountId}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.calendarAccounts.detail(accountId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.calendarAccounts.all });
    },
    onError: (error) => {
      throw new Error(getErrorMessage(error));
    },
  });
};

interface CalendarAuthInitParams {
  provider: CalendarProvider;
  workspaceId?: string;
  returnUrl?: string;
}

export const useConnectCalendarFromEmail = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (emailAccountId: string) => {
      const response = await api.post<CalendarAccount>('/calendar-accounts/connect/from-email', {
        email_account_id: emailAccountId,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.calendarAccounts.all });
    },
    onError: (error) => {
      throw new Error(getErrorMessage(error));
    },
  });
};

export const useInitCalendarAuth = () => {
  return useMutation({
    mutationFn: async (params: CalendarAuthInitParams) => {
      const searchParams = new URLSearchParams();
      if (params.workspaceId) searchParams.append('workspace_id', params.workspaceId);
      if (params.returnUrl) searchParams.append('return_url', params.returnUrl);
      const response = await api.get<OAuthInitResponse>(
        `/calendar-accounts/connect/${params.provider}/auth-link?${searchParams}`
      );
      return response.data;
    },
    onError: (error) => {
      throw new Error(getErrorMessage(error));
    },
  });
};
