import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, getErrorMessage } from '../../api';
import { queryKeys } from '../../queryClient';
import type {
  LinkedInAccount,
  EmailAccount,
  LinkedInConnectCredentialsRequest,
  LinkedInConnectCookieRequest,
  LinkedInSolveCheckpointRequest,
  LinkedInAuthResponse,
  EmailConnectIMAPRequest,
  EmailConnectGoogleRequest,
  EmailConnectMicrosoftRequest,
  EmailAuthResponse,
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
}

// LinkedIn Accounts

export const useLinkedInAccounts = (filters?: AccountFilters) => {
  return useQuery({
    queryKey: queryKeys.linkedinAccounts.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.workspace_id) params.append('workspace_id', filters.workspace_id);

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
      const response = await api.put<LinkedInAccount>(`/linkedin-accounts/${accountId}`, data);
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
    mutationFn: async (linkedinAccountId: string) => {
      const response = await api.post<SyncChatsResponse>('/inbox/sync', {
        linkedin_account_id: linkedinAccountId,
        limit: 100,
        sync_messages: true,
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
    mutationFn: async (accountId: string) => {
      const response = await api.post<LinkedInAuthResponse>(
        '/linkedin-accounts/connect/poll-status',
        { account_id: accountId }
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
  return useQuery({
    queryKey: queryKeys.emailAccounts.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.workspace_id) params.append('workspace_id', filters.workspace_id);

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
    mutationFn: async (emailAccountId: string) => {
      const response = await api.post<SyncEmailsResponse>('/inbox/sync-emails', {
        email_account_id: emailAccountId,
        limit: 100,
        exclude_sent: true,
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

// OAuth Flow Initialization

interface OAuthInitResponse {
  url: string;
  state: string;
}

export const useInitGoogleOAuth = () => {
  return useMutation({
    mutationFn: async (workspaceId?: string) => {
      const params = new URLSearchParams();
      if (workspaceId) params.append('workspace_id', workspaceId);
      const response = await api.get<OAuthInitResponse>(
        `/email-accounts/oauth/google/init?${params}`
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
    mutationFn: async (workspaceId?: string) => {
      const params = new URLSearchParams();
      if (workspaceId) params.append('workspace_id', workspaceId);
      const response = await api.get<OAuthInitResponse>(
        `/email-accounts/oauth/microsoft/init?${params}`
      );
      return response.data;
    },
    onError: (error) => {
      throw new Error(getErrorMessage(error));
    },
  });
};
