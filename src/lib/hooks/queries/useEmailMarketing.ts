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

export interface MarketingListContact {
  contact_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  timezone: string | null;
  source: string;
  contact_status: string;
  membership_status: string;
  subscribed_at: string | null;
  unsubscribed_at: string | null;
  created_at: string;
  attributes: Record<string, string>;
}

interface MarketingListContactsResponse {
  contacts: MarketingListContact[];
  total: number;
  page: number;
  page_size: number;
}

export interface MarketingContactCsvImportResponse {
  list_id: string;
  created_contacts: number;
  updated_contacts: number;
  memberships_created: number;
  skipped: number;
  errors: string[];
  issues?: MarketingContactCsvImportIssue[];
}

export interface MarketingContactCsvImportIssue {
  row: number;
  email?: string | null;
  code: string;
  message: string;
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
  send_window_start: string | null;
  send_window_end: string | null;
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

export interface MarketingSegment {
  id: string;
  user_id: string;
  workspace_id: string;
  list_id: string;
  name: string;
  segment_type: 'static' | 'rule' | 'behavioral' | string;
  definition: Record<string, unknown>;
  is_active: boolean;
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

export interface MarketingBroadcastInsights {
  broadcast_id: string;
  status_breakdown: Record<string, number>;
  activity: Array<{
    event_type: string;
    occurred_at: string;
    recipient_email: string;
    provider_event_id: string | null;
    metadata: Record<string, unknown>;
  }>;
}

export interface MarketingBroadcastRecipient {
  recipient_id: string;
  contact_id: string;
  email: string;
  status: string;
  rendered_subject: string | null;
  created_at: string;
  updated_at: string;
}

export interface MarketingBroadcastRecipientDetail extends MarketingBroadcastRecipient {
  rendered_body: string | null;
  provider_message_id: string | null;
  send_status: string | null;
  personalization_snapshot: Record<string, unknown>;
  events: Array<{
    event_type: string;
    occurred_at: string;
    provider_event_id: string | null;
    metadata: Record<string, unknown>;
  }>;
}

export interface MarketingSuppression {
  id: string;
  email: string;
  scope: string;
  reason: string;
  is_active: boolean;
  list_id: string | null;
  created_at: string;
}

export interface MarketingContactDetail {
  id: string;
  workspace_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  timezone: string | null;
  status: string;
  source: string;
  attributes: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface MarketingContactMembershipSummary {
  list_id: string;
  list_name: string;
  status: string;
  subscribed_at: string | null;
  unsubscribed_at: string | null;
  created_at: string;
}

export interface MarketingContactActivityItem {
  kind: 'consent' | 'broadcast';
  event_type: string;
  occurred_at: string;
  source: string | null;
  list_id: string | null;
  list_name: string | null;
  broadcast_id: string | null;
  broadcast_name: string | null;
  metadata: Record<string, unknown>;
}

export interface MarketingContactActivity {
  contact: MarketingContactDetail;
  memberships: MarketingContactMembershipSummary[];
  activity: MarketingContactActivityItem[];
}

export interface MarketingOverviewTrendPoint {
  date: string;
  sent: number;
  opened: number;
  clicked: number;
}

interface MarketingTemplatesResponse {
  templates: MarketingTemplate[];
  total: number;
}

interface MarketingSegmentsResponse {
  segments: MarketingSegment[];
  total: number;
}

interface MarketingBroadcastsResponse {
  broadcasts: MarketingBroadcast[];
  total: number;
}

interface MarketingBroadcastRecipientsResponse {
  recipients: MarketingBroadcastRecipient[];
  total: number;
}

interface MarketingSuppressionsResponse {
  suppressions: MarketingSuppression[];
  total: number;
}

interface MarketingOverviewTrendsResponse {
  points: MarketingOverviewTrendPoint[];
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
  duplicate_policy?: 'skip' | 'update_merge';
  replace_attributes?: boolean;
}

interface ListContactsParams {
  q?: string;
  membership_status?: string;
  page?: number;
  page_size?: number;
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
  send_window_start?: string;
  send_window_end?: string;
}

interface CreateMarketingTemplateData {
  workspace_id: string;
  name: string;
  subject_template: string;
  body_template: string;
  personalization_enabled?: boolean;
  personalization_mode?: 'first_line' | 'full_message';
}

interface UpdateMarketingTemplateData extends CreateMarketingTemplateData {
  templateId: string;
}

interface PreviewMarketingTemplateData {
  workspace_id: string;
  subject_template: string;
  body_template: string;
  personalization_enabled?: boolean;
  personalization_mode?: 'first_line' | 'full_message';
  contact_id?: string;
}

interface CreateMarketingSegmentData {
  workspace_id: string;
  list_id: string;
  name: string;
  segment_type?: 'static' | 'rule' | 'behavioral';
  definition: Record<string, unknown>;
}

interface UpdateMarketingSegmentData extends CreateMarketingSegmentData {
  segmentId: string;
  is_active?: boolean;
}

interface MarketingBroadcastSendResponse {
  broadcast_id: string;
  attempted: number;
  sent: number;
  failed: number;
  status: string;
}

interface UpdateMarketingListContactData {
  listId: string;
  contactId: string;
  status: 'pending_opt_in' | 'subscribed' | 'unsubscribed';
  reason?: string;
}

interface BulkUpdateMarketingListContactsData {
  listId: string;
  contactIds: string[];
  action: 'subscribe' | 'unsubscribe' | 'reset_pending' | 'remove';
  reason?: string;
}

interface SendMarketingOptInData {
  workspace_id: string;
  list_id: string;
  contact_id: string;
  sender_email_account_id: string;
  subject?: string;
  body_html?: string;
}

interface SendMarketingTemplateTestData {
  workspace_id: string;
  template_id: string;
  sender_email_account_id: string;
  to_email: string;
  contact_id?: string;
}

interface UpdateMarketingContactData {
  contactId: string;
  first_name?: string | null;
  last_name?: string | null;
  timezone?: string | null;
  attributes?: Record<string, unknown>;
}

interface UpdateMarketingListData {
  listId: string;
  name: string;
  description?: string;
}

interface UpdateMarketingBroadcastData {
  broadcastId: string;
  name: string;
  segment_id?: string;
  template_id: string;
  sender_email_account_id: string;
  timezone_override?: string;
  scheduled_at?: string;
  send_window_start?: string;
  send_window_end?: string;
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

export const useMarketingSegments = (workspaceId?: string, listId?: string) => {
  const currentWorkspaceId = useWorkspaceStore((s) => s.currentWorkspaceId);
  const activeWorkspaceId = workspaceId ?? currentWorkspaceId ?? undefined;

  return useQuery({
    queryKey: ['email-marketing', 'segments', activeWorkspaceId, listId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (activeWorkspaceId) params.append('workspace_id', activeWorkspaceId);
      if (listId) params.append('list_id', listId);
      const response = await api.get<MarketingSegmentsResponse>(
        `/email-marketing/segments?${params.toString()}`
      );
      return response.data.segments;
    },
    enabled: !!activeWorkspaceId,
  });
};

export const useCreateMarketingSegment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateMarketingSegmentData) => {
      const response = await api.post<MarketingSegment>('/email-marketing/segments', data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['email-marketing', 'segments'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.emailMarketing.all });
      queryClient.invalidateQueries({
        queryKey: ['email-marketing', 'segments', data.workspace_id, data.list_id],
      });
    },
    onError: (error) => {
      throw new Error(getErrorMessage(error));
    },
  });
};

export const useUpdateMarketingSegment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: UpdateMarketingSegmentData) => {
      const response = await api.patch<MarketingSegment>(
        `/email-marketing/segments/${data.segmentId}`,
        {
          name: data.name,
          segment_type: data.segment_type,
          definition: data.definition,
          is_active: data.is_active ?? true,
        }
      );
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['email-marketing', 'segments'] });
      queryClient.invalidateQueries({
        queryKey: ['email-marketing', 'segments', data.workspace_id, data.list_id],
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.emailMarketing.all });
    },
    onError: (error) => {
      throw new Error(getErrorMessage(error));
    },
  });
};

export const useDeleteMarketingSegment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (segmentId: string) => {
      const response = await api.delete(`/email-marketing/segments/${segmentId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-marketing', 'segments'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.emailMarketing.all });
    },
    onError: (error) => {
      throw new Error(getErrorMessage(error));
    },
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

export const useUpdateMarketingList = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: UpdateMarketingListData) => {
      const response = await api.patch<MarketingList>(`/email-marketing/lists/${data.listId}`, {
        name: data.name,
        description: data.description,
      });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.emailMarketing.lists(data.workspace_id),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.emailMarketing.all });
    },
    onError: (error) => {
      throw new Error(getErrorMessage(error));
    },
  });
};

export const useMarketingListContacts = (listId?: string, params?: ListContactsParams) => {
  const normalizedParams = {
    q: params?.q || undefined,
    membership_status: params?.membership_status || undefined,
    page: params?.page ?? 1,
    page_size: params?.page_size ?? 25,
  };

  return useQuery({
    queryKey: queryKeys.emailMarketing.listContacts(listId || '', normalizedParams),
    queryFn: async () => {
      if (!listId) {
        return { contacts: [], total: 0, page: 1, page_size: normalizedParams.page_size };
      }
      const searchParams = new URLSearchParams();
      if (normalizedParams.q) searchParams.append('q', normalizedParams.q);
      if (normalizedParams.membership_status) {
        searchParams.append('membership_status', normalizedParams.membership_status);
      }
      searchParams.append('page', String(normalizedParams.page));
      searchParams.append('page_size', String(normalizedParams.page_size));
      const response = await api.get<MarketingListContactsResponse>(
        `/email-marketing/lists/${listId}/contacts?${searchParams.toString()}`
      );
      return response.data;
    },
    enabled: !!listId,
  });
};

export const useMarketingContact = (contactId?: string) => {
  return useQuery({
    queryKey: ['email-marketing', 'contact', contactId],
    queryFn: async () => {
      const response = await api.get<MarketingContactDetail>(
        `/email-marketing/contacts/${contactId}`
      );
      return response.data;
    },
    enabled: !!contactId,
  });
};

export const useMarketingContactActivity = (contactId?: string) => {
  return useQuery({
    queryKey: ['email-marketing', 'contact', contactId, 'activity'],
    queryFn: async () => {
      const response = await api.get<MarketingContactActivity>(
        `/email-marketing/contacts/${contactId}/activity`
      );
      return response.data;
    },
    enabled: !!contactId,
  });
};

export const useUpdateMarketingContact = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: UpdateMarketingContactData) => {
      const response = await api.patch<MarketingContactDetail>(
        `/email-marketing/contacts/${data.contactId}`,
        {
          first_name: data.first_name,
          last_name: data.last_name,
          timezone: data.timezone,
          attributes: data.attributes,
        }
      );
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['email-marketing', 'contact', data.id] });
      queryClient.invalidateQueries({ queryKey: queryKeys.emailMarketing.all });
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
      formData.append('duplicate_policy', data.duplicate_policy ?? 'update_merge');
      formData.append('replace_attributes', String(Boolean(data.replace_attributes)));

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

export const useUpdateMarketingListContact = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateMarketingListContactData) => {
      const response = await api.patch(
        `/email-marketing/lists/${data.listId}/contacts/${data.contactId}`,
        {
          status: data.status,
          reason: data.reason,
        }
      );
      return response.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.emailMarketing.listContacts(variables.listId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.emailMarketing.all });
    },
    onError: (error) => {
      throw new Error(getErrorMessage(error));
    },
  });
};

export const useRemoveMarketingListContact = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ listId, contactId }: { listId: string; contactId: string }) => {
      const response = await api.delete(`/email-marketing/lists/${listId}/contacts/${contactId}`);
      return response.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.emailMarketing.listContacts(variables.listId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.emailMarketing.all });
    },
    onError: (error) => {
      throw new Error(getErrorMessage(error));
    },
  });
};

export const useBulkUpdateMarketingListContacts = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: BulkUpdateMarketingListContactsData) => {
      const response = await api.post(`/email-marketing/lists/${data.listId}/contacts/bulk`, {
        contact_ids: data.contactIds,
        action: data.action,
        reason: data.reason,
      });
      return response.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.emailMarketing.listContacts(variables.listId),
      });
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

export const useUpdateMarketingTemplate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: UpdateMarketingTemplateData) => {
      const response = await api.patch<MarketingTemplate>(
        `/email-marketing/templates/${data.templateId}`,
        {
          workspace_id: data.workspace_id,
          name: data.name,
          subject_template: data.subject_template,
          body_template: data.body_template,
          personalization_enabled: data.personalization_enabled,
          personalization_mode: data.personalization_mode,
        }
      );
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

export const useDeleteMarketingTemplate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (templateId: string) => {
      const response = await api.delete(`/email-marketing/templates/${templateId}`);
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

export const usePreviewMarketingTemplate = () => {
  return useMutation({
    mutationFn: async (data: PreviewMarketingTemplateData) => {
      const response = await api.post('/email-marketing/templates/preview', data);
      return response.data as {
        contact_id: string | null;
        sample_email: string | null;
        rendered_subject: string;
        rendered_body: string;
      };
    },
    onError: (error) => {
      throw new Error(getErrorMessage(error));
    },
  });
};

export const useSendMarketingTemplateTest = () => {
  return useMutation({
    mutationFn: async (data: SendMarketingTemplateTestData) => {
      const response = await api.post('/email-marketing/templates/test-send', data);
      return response.data;
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

export const useUpdateMarketingBroadcast = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: UpdateMarketingBroadcastData) => {
      const response = await api.patch<MarketingBroadcast>(
        `/email-marketing/broadcasts/${data.broadcastId}`,
        {
          name: data.name,
          segment_id: data.segment_id,
          template_id: data.template_id,
          sender_email_account_id: data.sender_email_account_id,
          timezone_override: data.timezone_override,
          scheduled_at: data.scheduled_at,
          send_window_start: data.send_window_start,
          send_window_end: data.send_window_end,
        }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-marketing', 'broadcasts'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.emailMarketing.all });
    },
    onError: (error) => {
      throw new Error(getErrorMessage(error));
    },
  });
};

export const useMarketingBroadcastRecipients = (broadcastId: string) => {
  return useQuery({
    queryKey: ['email-marketing', 'broadcasts', broadcastId, 'recipients'],
    queryFn: async () => {
      const response = await api.get<MarketingBroadcastRecipientsResponse>(
        `/email-marketing/broadcasts/${broadcastId}/recipients`
      );
      return response.data;
    },
    enabled: !!broadcastId,
  });
};

export const useMarketingBroadcastRecipient = (broadcastId: string, recipientId?: string) => {
  return useQuery({
    queryKey: ['email-marketing', 'broadcasts', broadcastId, 'recipients', recipientId],
    queryFn: async () => {
      const response = await api.get<MarketingBroadcastRecipientDetail>(
        `/email-marketing/broadcasts/${broadcastId}/recipients/${recipientId}`
      );
      return response.data;
    },
    enabled: !!broadcastId && !!recipientId,
  });
};

export const useRetryMarketingBroadcastRecipient = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      broadcastId,
      recipientId,
    }: {
      broadcastId: string;
      recipientId: string;
    }) => {
      const response = await api.post(
        `/email-marketing/broadcasts/${broadcastId}/recipients/${recipientId}/retry`
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-marketing', 'broadcasts'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.emailMarketing.all });
    },
    onError: (error) => {
      throw new Error(getErrorMessage(error));
    },
  });
};

export const useCancelMarketingBroadcastRecipient = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      broadcastId,
      recipientId,
    }: {
      broadcastId: string;
      recipientId: string;
    }) => {
      const response = await api.post(
        `/email-marketing/broadcasts/${broadcastId}/recipients/${recipientId}/cancel`
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-marketing', 'broadcasts'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.emailMarketing.all });
    },
    onError: (error) => {
      throw new Error(getErrorMessage(error));
    },
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

const invalidateBroadcastQueries = (
  queryClient: ReturnType<typeof useQueryClient>,
  broadcastId: string
) => {
  queryClient.invalidateQueries({
    queryKey: queryKeys.emailMarketing.broadcastMetrics(broadcastId),
  });
  queryClient.invalidateQueries({
    queryKey: queryKeys.emailMarketing.broadcastInsights(broadcastId),
  });
  queryClient.invalidateQueries({ queryKey: ['email-marketing', 'broadcasts'] });
  queryClient.invalidateQueries({ queryKey: queryKeys.emailMarketing.all });
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

export const useMarketingBroadcastInsights = (broadcastId: string) => {
  return useQuery({
    queryKey: queryKeys.emailMarketing.broadcastInsights(broadcastId),
    queryFn: async () => {
      const response = await api.get<MarketingBroadcastInsights>(
        `/email-marketing/broadcasts/${broadcastId}/insights`
      );
      return response.data;
    },
    enabled: !!broadcastId,
  });
};

export const useMarketingSuppressions = (workspaceId?: string) => {
  const currentWorkspaceId = useWorkspaceStore((s) => s.currentWorkspaceId);
  const activeWorkspaceId = workspaceId ?? currentWorkspaceId ?? undefined;
  return useQuery({
    queryKey: ['email-marketing', 'suppressions', activeWorkspaceId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (activeWorkspaceId) params.append('workspace_id', activeWorkspaceId);
      const response = await api.get<MarketingSuppressionsResponse>(
        `/email-marketing/suppressions?${params.toString()}`
      );
      return response.data.suppressions;
    },
    enabled: !!activeWorkspaceId,
  });
};

export const useFilteredMarketingSuppressions = (
  workspaceId?: string,
  filters?: { q?: string; scope?: string; reason?: string; active_only?: boolean }
) => {
  const currentWorkspaceId = useWorkspaceStore((s) => s.currentWorkspaceId);
  const activeWorkspaceId = workspaceId ?? currentWorkspaceId ?? undefined;
  return useQuery({
    queryKey: ['email-marketing', 'suppressions', activeWorkspaceId, filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (activeWorkspaceId) params.append('workspace_id', activeWorkspaceId);
      if (filters?.q) params.append('q', filters.q);
      if (filters?.scope) params.append('scope', filters.scope);
      if (filters?.reason) params.append('reason', filters.reason);
      params.append('active_only', String(filters?.active_only ?? true));
      const response = await api.get<MarketingSuppressionsResponse>(
        `/email-marketing/suppressions?${params.toString()}`
      );
      return response.data.suppressions;
    },
    enabled: !!activeWorkspaceId,
  });
};

export const useMarketingOverviewTrends = (workspaceId?: string, days = 7) => {
  const currentWorkspaceId = useWorkspaceStore((s) => s.currentWorkspaceId);
  const activeWorkspaceId = workspaceId ?? currentWorkspaceId ?? undefined;
  return useQuery({
    queryKey: ['email-marketing', 'overview-trends', activeWorkspaceId, days],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (activeWorkspaceId) params.append('workspace_id', activeWorkspaceId);
      params.append('days', String(days));
      const response = await api.get<MarketingOverviewTrendsResponse>(
        `/email-marketing/overview/trends?${params.toString()}`
      );
      return response.data.points;
    },
    enabled: !!activeWorkspaceId,
  });
};

export const useUnsuppressMarketingEmail = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (suppressionId: string) => {
      const response = await api.post(`/email-marketing/suppressions/${suppressionId}/unsuppress`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.emailMarketing.all });
      queryClient.invalidateQueries({ queryKey: ['email-marketing', 'suppressions'] });
    },
    onError: (error) => {
      throw new Error(getErrorMessage(error));
    },
  });
};

export const useSendMarketingOptIn = () => {
  return useMutation({
    mutationFn: async (data: SendMarketingOptInData) => {
      const response = await api.post('/email-marketing/opt-in/send', data);
      return response.data;
    },
    onError: (error) => {
      throw new Error(getErrorMessage(error));
    },
  });
};

const buildBroadcastStatusMutation = (endpoint: 'pause' | 'resume' | 'cancel') => {
  return () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: async (broadcastId: string) => {
        const response = await api.post(`/email-marketing/broadcasts/${broadcastId}/${endpoint}`);
        return response.data;
      },
      onSuccess: (_data, broadcastId) => {
        invalidateBroadcastQueries(queryClient, broadcastId);
      },
      onError: (error) => {
        throw new Error(getErrorMessage(error));
      },
    });
  };
};

export const usePauseMarketingBroadcast = buildBroadcastStatusMutation('pause');
export const useResumeMarketingBroadcast = buildBroadcastStatusMutation('resume');
export const useCancelMarketingBroadcast = buildBroadcastStatusMutation('cancel');
