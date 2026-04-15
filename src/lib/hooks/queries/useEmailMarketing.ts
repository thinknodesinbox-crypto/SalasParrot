import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api, getErrorMessage } from '../../api';
import { queryKeys } from '../../queryClient';
import { useWorkspaceStore } from '../../workspace';

export interface MarketingList {
  id: string;
  user_id: string;
  workspace_id: string;
  name: string;
  description: string | null;
  total_contacts: number;
  subscribed_contacts: number;
  created_at: string;
  updated_at: string;
}

interface MarketingListsResponse {
  lists: MarketingList[];
  total: number;
}

export interface MarketingContactCsvImportResponse {
  list_id: string;
  created_contacts: number;
  updated_contacts: number;
  memberships_created: number;
  skipped: number;
  errors: string[];
}

export interface MarketingBroadcast {
  id: string;
  user_id: string;
  workspace_id: string;
  list_id: string;
  segment_id: string | null;
  template_id: string;
  sender_email_account_id: string | null;
  name: string;
  status: string;
  timezone_override: string | null;
  scheduled_at: string | null;
  total_recipients: number;
  delivered_count: number;
  open_count: number;
  click_count: number;
  bounce_count: number;
  unsubscribe_count: number;
  complaint_count: number;
  created_at: string;
  updated_at: string;
}

export interface MarketingTemplate {
  id: string;
  user_id: string;
  workspace_id: string;
  name: string;
  subject_template: string;
  body_template: string;
  personalization_enabled: boolean;
  personalization_mode: 'first_line' | 'full_message' | string;
  created_at: string;
  updated_at: string;
}

export interface MarketingBroadcastMetrics {
  broadcast_id: string;
  status: string;
  total_recipients: number;
  delivered_count: number;
  open_count: number;
  click_count: number;
  bounce_count: number;
  unsubscribe_count: number;
  complaint_count: number;
}

interface MarketingTemplatesResponse {
  templates: MarketingTemplate[];
  total: number;
}

interface MarketingBroadcastsResponse {
  broadcasts: MarketingBroadcast[];
  total: number;
}

interface CreateMarketingListData {
  workspace_id: string;
  name: string;
  description?: string;
}

interface ImportMarketingContactsCSVData {
  workspace_id: string;
  file: File;
  list_id?: string;
  list_name?: string;
}

interface CreateMarketingBroadcastData {
  workspace_id: string;
  list_id: string;
  template_id: string;
  sender_email_account_id: string;
  name: string;
  segment_id?: string;
  timezone_override?: string;
  scheduled_at?: string;
}

interface CreateMarketingTemplateData {
  workspace_id: string;
  name: string;
  subject_template: string;
  body_template: string;
  personalization_enabled?: boolean;
  personalization_mode?: 'first_line' | 'full_message';
}

interface MarketingBroadcastSendResponse {
  broadcast_id: string;
  attempted: number;
  sent: number;
  failed: number;
  status: string;
}

export const useMarketingLists = (workspaceId?: string) => {
  const currentWorkspaceId = useWorkspaceStore((s) => s.currentWorkspaceId);
  const activeWorkspaceId = workspaceId ?? currentWorkspaceId ?? undefined;

  return useQuery({
    queryKey: queryKeys.emailMarketing.lists(activeWorkspaceId),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (activeWorkspaceId) params.append('workspace_id', activeWorkspaceId);
      const response = await api.get<MarketingListsResponse>(`/email-marketing/lists?${params}`);
      return response.data.lists;
    },
    enabled: !!activeWorkspaceId,
  });
};

export const useCreateMarketingList = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateMarketingListData) => {
      const response = await api.post<MarketingList>('/email-marketing/lists', data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.emailMarketing.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.emailMarketing.lists(data.workspace_id),
      });
    },
    onError: (error) => {
      throw new Error(getErrorMessage(error));
    },
  });
};

export const useImportMarketingContactsCSV = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ImportMarketingContactsCSVData) => {
      const formData = new FormData();
      formData.append('workspace_id', data.workspace_id);
      formData.append('file', data.file);
      if (data.list_id) formData.append('list_id', data.list_id);
      if (data.list_name) formData.append('list_name', data.list_name);

      const response = await api.post<MarketingContactCsvImportResponse>(
        '/email-marketing/contacts/import-csv',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.emailMarketing.all });
    },
    onError: (error) => {
      throw new Error(getErrorMessage(error));
    },
  });
};

export const useCreateMarketingBroadcast = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateMarketingBroadcastData) => {
      const response = await api.post<MarketingBroadcast>('/email-marketing/broadcasts', data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.emailMarketing.broadcasts(data.workspace_id),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.emailMarketing.all });
    },
    onError: (error) => {
      throw new Error(getErrorMessage(error));
    },
  });
};

export const useMarketingTemplates = (workspaceId?: string) => {
  const currentWorkspaceId = useWorkspaceStore((s) => s.currentWorkspaceId);
  const activeWorkspaceId = workspaceId ?? currentWorkspaceId ?? undefined;

  return useQuery({
    queryKey: queryKeys.emailMarketing.templates(activeWorkspaceId),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (activeWorkspaceId) params.append('workspace_id', activeWorkspaceId);
      const response = await api.get<MarketingTemplatesResponse>(
        `/email-marketing/templates?${params}`
      );
      return response.data.templates;
    },
    enabled: !!activeWorkspaceId,
  });
};

export const useCreateMarketingTemplate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateMarketingTemplateData) => {
      const response = await api.post<MarketingTemplate>('/email-marketing/templates', data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.emailMarketing.templates(data.workspace_id),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.emailMarketing.all });
    },
    onError: (error) => {
      throw new Error(getErrorMessage(error));
    },
  });
};

export const useMarketingBroadcasts = (workspaceId?: string) => {
  const currentWorkspaceId = useWorkspaceStore((s) => s.currentWorkspaceId);
  const activeWorkspaceId = workspaceId ?? currentWorkspaceId ?? undefined;

  return useQuery({
    queryKey: queryKeys.emailMarketing.broadcasts(activeWorkspaceId),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (activeWorkspaceId) params.append('workspace_id', activeWorkspaceId);
      const response = await api.get<MarketingBroadcastsResponse>(
        `/email-marketing/broadcasts?${params}`
      );
      return response.data.broadcasts;
    },
    enabled: !!activeWorkspaceId,
  });
};

export const useSendMarketingBroadcast = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (broadcastId: string) => {
      const response = await api.post<MarketingBroadcastSendResponse>(
        `/email-marketing/broadcasts/${broadcastId}/send`
      );
      return response.data;
    },
    onSuccess: (_data, broadcastId) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.emailMarketing.broadcastMetrics(broadcastId),
      });
      queryClient.invalidateQueries({ queryKey: ['email-marketing', 'broadcasts'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.emailMarketing.all });
    },
    onError: (error) => {
      throw new Error(getErrorMessage(error));
    },
  });
};

export const useMarketingBroadcastMetrics = (broadcastId: string) => {
  return useQuery({
    queryKey: queryKeys.emailMarketing.broadcastMetrics(broadcastId),
    queryFn: async () => {
      const response = await api.get<MarketingBroadcastMetrics>(
        `/email-marketing/broadcasts/${broadcastId}/metrics`
      );
      return response.data;
    },
    enabled: !!broadcastId,
  });
};
