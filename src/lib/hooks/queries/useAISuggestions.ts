import { useCallback, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';

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

interface SuggestionMutationState<T> {
  data: T | null;
  error: Error | null;
  isPending: boolean;
}

function useAbortableSuggestionMutation<TData, TVariables>(
  request: (variables: TVariables, signal: AbortSignal) => Promise<TData>
) {
  const abortControllerRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);
  const [state, setState] = useState<SuggestionMutationState<TData>>({
    data: null,
    error: null,
    isPending: false,
  });

  const mutate = useCallback(
    async (variables: TVariables) => {
      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;
      const requestId = requestIdRef.current + 1;
      requestIdRef.current = requestId;

      setState((prev) => ({
        data: prev.data,
        error: null,
        isPending: true,
      }));

      try {
        const data = await request(variables, controller.signal);
        if (requestIdRef.current !== requestId) return data;
        setState({
          data,
          error: null,
          isPending: false,
        });
        return data;
      } catch (error) {
        if (axios.isCancel(error)) {
          return undefined;
        }
        if (requestIdRef.current !== requestId) {
          return undefined;
        }
        setState((prev) => ({
          data: prev.data,
          error: error instanceof Error ? error : new Error('Suggestion request failed'),
          isPending: false,
        }));
        throw error;
      }
    },
    [request]
  );

  const reset = useCallback(() => {
    abortControllerRef.current?.abort();
    setState({
      data: null,
      error: null,
      isPending: false,
    });
  }, []);

  return {
    mutate,
    reset,
    data: state.data,
    error: state.error,
    isPending: state.isPending,
  };
}

export const useSequenceStepSuggestions = () => {
  return useAbortableSuggestionMutation<
    SequenceStepSuggestionsResponse,
    SequenceStepSuggestionsRequest
  >(async (data, signal) => {
    const response = await api.post<SequenceStepSuggestionsResponse>(
      '/ai/suggestions/sequence-step',
      data,
      { signal }
    );
    return response.data;
  });
};

export const useReplySuggestions = () => {
  return useAbortableSuggestionMutation<
    ReplySuggestionsResponse,
    {
      conversation_id: string;
      current_draft?: string | null;
    }
  >(async ({ conversation_id, current_draft }, signal) => {
    const response = await api.post<ReplySuggestionsResponse>(
      '/ai/suggestions/reply',
      {
        conversation_id,
        current_draft,
      },
      { signal }
    );
    return response.data;
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
