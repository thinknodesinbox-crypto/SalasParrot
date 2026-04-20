import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, getErrorMessage } from '../../api';
import { queryKeys } from '../../queryClient';
import type {
  AssistantDailySummaryRunResponse,
  AssistantDeliverySettings,
  AssistantMessageListResponse,
  AssistantQrRedeemResponse,
  AssistantQrTransfer,
  AssistantSendMessageResponse,
  AssistantThread,
  AssistantThreadListResponse,
  AssistantUsageSnapshot,
  AssistantWhatsAppAccount,
  AssistantWhatsAppAccountListResponse,
  AssistantWhatsAppBinding,
} from '../../types';

interface CreateAssistantThreadData {
  title?: string;
}

interface SendAssistantMessageData {
  threadId: string;
  content: string;
}

interface UpdateAssistantDeliverySettingsData {
  daily_summary_enabled?: boolean;
  delivery_channel?: 'dashboard' | 'whatsapp' | 'both';
  daily_summary_time?: string;
  timezone?: string;
  include_campaign_health?: boolean;
  include_sender_health?: boolean;
  include_inbox_summary?: boolean;
  include_workspace_gaps?: boolean;
  whatsapp_daily_interaction_limit?: number;
  voice_daily_minutes_limit?: number;
  monthly_token_alert_threshold?: number;
}

export const useAssistantThreads = (workspaceId: string | null | undefined) => {
  return useQuery<AssistantThread[]>({
    queryKey: queryKeys.assistant.threads(workspaceId),
    queryFn: async () => {
      const response = await api.get<AssistantThreadListResponse>(
        `/assistant/threads?workspace_id=${workspaceId}`
      );
      return response.data.items;
    },
    enabled: !!workspaceId,
  });
};

export const useAssistantMessages = (
  workspaceId: string | null | undefined,
  threadId: string | null | undefined
) => {
  return useQuery({
    queryKey:
      threadId && workspaceId
        ? queryKeys.assistant.messages(workspaceId, threadId)
        : ['assistant', 'messages'],
    queryFn: async () => {
      const response = await api.get<AssistantMessageListResponse>(
        `/assistant/threads/${threadId}/messages?workspace_id=${workspaceId}`
      );
      return response.data.items;
    },
    enabled: !!workspaceId && !!threadId,
  });
};

export const useCreateAssistantThread = (workspaceId: string | null | undefined) => {
  const queryClient = useQueryClient();

  return useMutation<AssistantThread, Error, CreateAssistantThreadData>({
    mutationFn: async (data: CreateAssistantThreadData) => {
      const response = await api.post<AssistantThread>(
        `/assistant/threads?workspace_id=${workspaceId}`,
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.assistant.threads(workspaceId) });
    },
    onError: (error) => {
      throw new Error(getErrorMessage(error));
    },
  });
};

export const useSendAssistantMessage = (workspaceId: string | null | undefined) => {
  const queryClient = useQueryClient();

  return useMutation<AssistantSendMessageResponse, Error, SendAssistantMessageData>({
    mutationFn: async (data: SendAssistantMessageData) => {
      const response = await api.post<AssistantSendMessageResponse>(
        `/assistant/threads/${data.threadId}/messages?workspace_id=${workspaceId}`,
        { content: data.content }
      );
      return response.data;
    },
    onSuccess: (_data, variables) => {
      if (workspaceId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.assistant.messages(workspaceId, variables.threadId),
        });
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.assistant.threads(workspaceId) });
    },
    onError: (error) => {
      throw new Error(getErrorMessage(error));
    },
  });
};

export const useCreateAssistantQrTransfer = (
  workspaceId: string | null | undefined,
  threadId: string | null | undefined
) => {
  return useMutation<AssistantQrTransfer, Error, void>({
    mutationFn: async () => {
      const response = await api.post<AssistantQrTransfer>(
        `/assistant/threads/${threadId}/qr-transfer?workspace_id=${workspaceId}`
      );
      return response.data;
    },
    onError: (error) => {
      throw new Error(getErrorMessage(error));
    },
  });
};

export const useRedeemAssistantQrTransfer = () => {
  return useMutation<AssistantQrRedeemResponse, Error, { token: string }>({
    mutationFn: async ({ token }) => {
      const response = await api.post<AssistantQrRedeemResponse>('/assistant/qr-transfer/redeem', {
        token,
      });
      return response.data;
    },
    onError: (error) => {
      throw new Error(getErrorMessage(error));
    },
  });
};

export const useAssistantDeliverySettings = (workspaceId: string | null | undefined) => {
  return useQuery<AssistantDeliverySettings>({
    queryKey: queryKeys.assistant.deliverySettings(workspaceId),
    queryFn: async () => {
      const response = await api.get<AssistantDeliverySettings>(
        `/assistant/delivery-settings?workspace_id=${workspaceId}`
      );
      return response.data;
    },
    enabled: !!workspaceId,
  });
};

export const useAssistantUsage = (workspaceId: string | null | undefined) => {
  return useQuery<AssistantUsageSnapshot>({
    queryKey: queryKeys.assistant.usage(workspaceId),
    queryFn: async () => {
      const response = await api.get<AssistantUsageSnapshot>(
        `/assistant/usage?workspace_id=${workspaceId}`
      );
      return response.data;
    },
    enabled: !!workspaceId,
    refetchInterval: 30000,
  });
};

export const useUpdateAssistantDeliverySettings = (workspaceId: string | null | undefined) => {
  const queryClient = useQueryClient();

  return useMutation<AssistantDeliverySettings, Error, UpdateAssistantDeliverySettingsData>({
    mutationFn: async (data: UpdateAssistantDeliverySettingsData) => {
      const response = await api.patch<AssistantDeliverySettings>(
        `/assistant/delivery-settings?workspace_id=${workspaceId}`,
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.assistant.deliverySettings(workspaceId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.assistant.usage(workspaceId),
      });
    },
    onError: (error) => {
      throw new Error(getErrorMessage(error));
    },
  });
};

export const useRunAssistantDailySummary = (workspaceId: string | null | undefined) => {
  const queryClient = useQueryClient();

  return useMutation<AssistantDailySummaryRunResponse, Error, void>({
    mutationFn: async () => {
      const response = await api.post<AssistantDailySummaryRunResponse>(
        `/assistant/delivery-settings/run-now?workspace_id=${workspaceId}`
      );
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.assistant.deliverySettings(workspaceId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.assistant.usage(workspaceId),
      });
      if (workspaceId && data.thread_id) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.assistant.threads(workspaceId),
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.assistant.messages(workspaceId, data.thread_id),
        });
      }
    },
    onError: (error) => {
      throw new Error(getErrorMessage(error));
    },
  });
};

export const useAssistantWhatsAppAccounts = (workspaceId: string | null | undefined) => {
  return useQuery<AssistantWhatsAppAccount[]>({
    queryKey: ['assistant', 'whatsapp-accounts', workspaceId],
    queryFn: async () => {
      const response = await api.get<AssistantWhatsAppAccountListResponse>(
        `/assistant/whatsapp-accounts?workspace_id=${workspaceId}`
      );
      return response.data.items;
    },
    enabled: !!workspaceId,
  });
};

export const useAssistantWhatsAppBinding = (workspaceId: string | null | undefined) => {
  return useQuery<AssistantWhatsAppBinding | null>({
    queryKey: ['assistant', 'whatsapp-binding', workspaceId],
    queryFn: async () => {
      const response = await api.get<AssistantWhatsAppBinding | null>(
        `/assistant/whatsapp-binding?workspace_id=${workspaceId}`
      );
      return response.data;
    },
    enabled: !!workspaceId,
  });
};

export const useUpdateAssistantWhatsAppBinding = (workspaceId: string | null | undefined) => {
  const queryClient = useQueryClient();

  return useMutation<AssistantWhatsAppBinding, Error, { unipile_account_id: string }>({
    mutationFn: async (data) => {
      const response = await api.put<AssistantWhatsAppBinding>(
        `/assistant/whatsapp-binding?workspace_id=${workspaceId}`,
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assistant', 'whatsapp-binding', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['assistant', 'whatsapp-accounts', workspaceId] });
      queryClient.invalidateQueries({ queryKey: queryKeys.assistant.usage(workspaceId) });
    },
    onError: (error) => {
      throw new Error(getErrorMessage(error));
    },
  });
};

export const useDeleteAssistantWhatsAppBinding = (workspaceId: string | null | undefined) => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, void>({
    mutationFn: async () => {
      await api.delete(`/assistant/whatsapp-binding?workspace_id=${workspaceId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assistant', 'whatsapp-binding', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['assistant', 'whatsapp-accounts', workspaceId] });
      queryClient.invalidateQueries({ queryKey: queryKeys.assistant.usage(workspaceId) });
    },
    onError: (error) => {
      throw new Error(getErrorMessage(error));
    },
  });
};
