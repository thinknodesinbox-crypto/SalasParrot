import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, getErrorMessage } from '../../api';
import { queryKeys } from '../../queryClient';
import { useWorkspaceStore } from '../../workspace';
import type {
  Conversation,
  ConversationWithMessages,
  ConversationListResponse,
  Message,
  ConversationStatus,
  Channel,
} from '../../types';

interface ConversationFilters {
  workspace_id?: string;
  status_filter?: ConversationStatus;
  channel_filter?: Channel;
  sender_id?: string;
  campaign_id?: string;
  is_read?: boolean;
  limit?: number;
  offset?: number;
}

const getScopedConversationCacheId = (conversationId: string, workspaceId?: string) =>
  workspaceId ? `${workspaceId}:${conversationId}` : conversationId;

// List conversations
export const useConversations = (filters?: ConversationFilters) => {
  const currentWorkspaceId = useWorkspaceStore((s) => s.currentWorkspaceId);
  const workspaceId = filters?.workspace_id ?? currentWorkspaceId ?? undefined;

  return useQuery({
    queryKey: queryKeys.conversations.list({
      ...filters,
      workspace_id: workspaceId,
    }),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (workspaceId) params.append('workspace_id', workspaceId);
      if (filters?.status_filter) params.append('status_filter', filters.status_filter);
      if (filters?.channel_filter) params.append('channel_filter', filters.channel_filter);
      if (filters?.sender_id) params.append('sender_id', filters.sender_id);
      if (filters?.campaign_id) params.append('campaign_id', filters.campaign_id);
      if (filters?.is_read !== undefined) params.append('is_read', filters.is_read.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());
      if (filters?.offset) params.append('offset', filters.offset.toString());

      const response = await api.get<ConversationListResponse>(`/inbox/conversations?${params}`);
      return response.data;
    },
  });
};

// Get conversation with messages
export const useConversation = (conversationId: string, workspaceId?: string) => {
  const scopedConversationId = getScopedConversationCacheId(conversationId, workspaceId);

  return useQuery({
    queryKey: queryKeys.conversations.detail(scopedConversationId),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (workspaceId) params.append('workspace_id', workspaceId);
      const response = await api.get<ConversationWithMessages>(
        `/inbox/conversations/${conversationId}${params.size ? `?${params.toString()}` : ''}`
      );
      return response.data;
    },
    enabled: !!conversationId && !!workspaceId,
  });
};

// Get messages for a conversation
export const useConversationMessages = (
  conversationId: string,
  workspaceId?: string,
  options?: { limit?: number; offset?: number }
) => {
  const scopedConversationId = getScopedConversationCacheId(conversationId, workspaceId);

  return useQuery({
    queryKey: queryKeys.conversations.messages(scopedConversationId),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (workspaceId) params.append('workspace_id', workspaceId);
      if (options?.limit) params.append('limit', options.limit.toString());
      if (options?.offset) params.append('offset', options.offset.toString());

      const response = await api.get<Message[]>(
        `/inbox/conversations/${conversationId}/messages?${params}`
      );
      return response.data;
    },
    enabled: !!conversationId && !!workspaceId,
  });
};

// Send reply
export const useSendReply = (conversationId: string, workspaceId?: string) => {
  const queryClient = useQueryClient();
  const scopedConversationId = getScopedConversationCacheId(conversationId, workspaceId);

  return useMutation({
    mutationFn: async ({ content, subject }: { content: string; subject?: string }) => {
      const params = new URLSearchParams();
      if (workspaceId) params.append('workspace_id', workspaceId);
      const response = await api.post<Message>(
        `/inbox/conversations/${conversationId}/reply`,
        {
          content,
          subject,
        },
        {
          params: params.size ? Object.fromEntries(params.entries()) : undefined,
        }
      );
      return response.data;
    },
    onMutate: async ({ content, subject }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: queryKeys.conversations.detail(scopedConversationId),
      });

      // Snapshot the previous value
      const previousConversation = queryClient.getQueryData<ConversationWithMessages>(
        queryKeys.conversations.detail(scopedConversationId)
      );

      // Optimistically update the conversation with the new message
      if (previousConversation) {
        const optimisticMessage: Message = {
          id: `temp-${Date.now()}`,
          conversation_id: conversationId,
          lead_id: previousConversation.lead_id,
          linkedin_account_id: previousConversation.linkedin_account_id,
          email_account_id: previousConversation.email_account_id,
          direction: 'outbound',
          channel: previousConversation.channel,
          content,
          subject: subject || null,
          unipile_message_id: null,
          sent_at: new Date().toISOString(),
          read_at: null,
          created_at: new Date().toISOString(),
        };

        queryClient.setQueryData<ConversationWithMessages>(
          queryKeys.conversations.detail(scopedConversationId),
          {
            ...previousConversation,
            messages: [...(previousConversation.messages || []), optimisticMessage],
            last_message_at: new Date().toISOString(),
          }
        );
      }

      return { previousConversation };
    },
    onError: (error, _variables, context) => {
      // Roll back to the previous value on error
      if (context?.previousConversation) {
        queryClient.setQueryData(
          queryKeys.conversations.detail(scopedConversationId),
          context.previousConversation
        );
      }
      throw new Error(getErrorMessage(error));
    },
    onSettled: () => {
      // Always refetch after error or success to get the real server state
      queryClient.invalidateQueries({
        queryKey: queryKeys.conversations.detail(scopedConversationId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.conversations.messages(scopedConversationId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.conversations.all });
    },
  });
};

// Mark as read
export const useMarkAsRead = (conversationId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await api.post<Conversation>(`/inbox/conversations/${conversationId}/read`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.conversations.detail(conversationId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.conversations.all });
    },
    onError: (error) => {
      throw new Error(getErrorMessage(error));
    },
  });
};

// Close conversation
export const useCloseConversation = (conversationId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await api.post<Conversation>(`/inbox/conversations/${conversationId}/close`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.conversations.detail(conversationId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.conversations.all });
    },
    onError: (error) => {
      throw new Error(getErrorMessage(error));
    },
  });
};

// Reopen conversation
export const useReopenConversation = (conversationId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await api.post<Conversation>(
        `/inbox/conversations/${conversationId}/reopen`
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.conversations.detail(conversationId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.conversations.all });
    },
    onError: (error) => {
      throw new Error(getErrorMessage(error));
    },
  });
};

// Snooze conversation
export const useSnoozeConversation = (conversationId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (until: string) => {
      const response = await api.post<Conversation>(
        `/inbox/conversations/${conversationId}/snooze`,
        { until }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.conversations.detail(conversationId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.conversations.all });
    },
    onError: (error) => {
      throw new Error(getErrorMessage(error));
    },
  });
};

// Add tags
export const useAddConversationTags = (conversationId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tags: string[]) => {
      const response = await api.post<Conversation>(`/inbox/conversations/${conversationId}/tags`, {
        tags,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.conversations.detail(conversationId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.conversations.all });
    },
    onError: (error) => {
      throw new Error(getErrorMessage(error));
    },
  });
};

// Remove tags
export const useRemoveConversationTags = (conversationId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tags: string[]) => {
      const response = await api.delete<Conversation>(
        `/inbox/conversations/${conversationId}/tags`,
        { data: { tags } }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.conversations.detail(conversationId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.conversations.all });
    },
    onError: (error) => {
      throw new Error(getErrorMessage(error));
    },
  });
};
