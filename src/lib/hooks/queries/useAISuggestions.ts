import { useMutation } from '@tanstack/react-query';

import { api } from '../../api';
import type { ReplySuggestionsResponse, SequenceStepSuggestionsResponse } from '../../types';

interface SequenceStepSuggestionsRequest {
  workspace_id: string;
  lead_list_id?: string | null;
  campaign_id?: string | null;
  lead_id?: string | null;
  step_type: string;
  current_message?: string | null;
  current_subject?: string | null;
}

export const useSequenceStepSuggestions = () => {
  return useMutation({
    mutationFn: async (data: SequenceStepSuggestionsRequest) => {
      const response = await api.post<SequenceStepSuggestionsResponse>(
        '/ai/suggestions/sequence-step',
        data
      );
      return response.data;
    },
  });
};

export const useReplySuggestions = () => {
  return useMutation({
    mutationFn: async ({
      conversation_id,
      current_draft,
    }: {
      conversation_id: string;
      current_draft?: string | null;
    }) => {
      const response = await api.post<ReplySuggestionsResponse>('/ai/suggestions/reply', {
        conversation_id,
        current_draft,
      });
      return response.data;
    },
  });
};

export const useSuggestionFeedback = () => {
  return useMutation({
    mutationFn: async (data: {
      surface: string;
      suggestion_type: string;
      action: string;
      workspace_id?: string | null;
      campaign_id?: string | null;
      conversation_id?: string | null;
      lead_id?: string | null;
      metadata?: Record<string, unknown>;
    }) => {
      const response = await api.post<{ status: string }>('/ai/suggestions/feedback', data);
      return response.data;
    },
  });
};
