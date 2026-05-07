import { Component, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useSuggestionFeedback } from '@/lib/hooks/queries';
import type {
  ReplySuggestionsResponse,
  SequenceStepSuggestionsResponse,
  SuggestedDraft,
} from '@/lib/types';

class SuggestionsErrorBoundary extends Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error('SuggestedDraftsPanel crashed', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3">
          <div className="rounded-lg border border-[#E2E8F0] bg-white p-3 text-xs text-[#64748B]">
            Suggestions are temporarily unavailable for this step.
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export function SuggestedDraftsPanel({
  data,
  isLoading,
  error,
  onApply,
  onRegenerate,
  surface = 'unknown',
  suggestionType = 'draft',
  feedbackContext,
  variant = 'default',
}: {
  data: SequenceStepSuggestionsResponse | ReplySuggestionsResponse | null;
  isLoading: boolean;
  error: string | null;
  onApply: (draft: { subject?: string | null; message: string }) => void;
  onRegenerate?: () => void;
  surface?: string;
  suggestionType?: string;
  variant?: 'default' | 'compact';
  feedbackContext?: {
    workspaceId?: string | null;
    campaignId?: string | null;
    conversationId?: string | null;
    leadId?: string | null;
  };
}) {
  return (
    <SuggestionsErrorBoundary>
      <SuggestedDraftsPanelContent
        data={data}
        isLoading={isLoading}
        error={error}
        onApply={onApply}
        onRegenerate={onRegenerate}
        surface={surface}
        suggestionType={suggestionType}
        variant={variant}
        feedbackContext={feedbackContext}
      />
    </SuggestionsErrorBoundary>
  );
}

function SuggestedDraftsPanelContent({
  data,
  isLoading,
  error,
  onApply,
  onRegenerate,
  surface = 'unknown',
  suggestionType = 'draft',
  feedbackContext,
  variant = 'default',
}: {
  data: SequenceStepSuggestionsResponse | ReplySuggestionsResponse | null;
  isLoading: boolean;
  error: string | null;
  onApply: (draft: { subject?: string | null; message: string }) => void;
  onRegenerate?: () => void;
  surface?: string;
  suggestionType?: string;
  variant?: 'default' | 'compact';
  feedbackContext?: {
    workspaceId?: string | null;
    campaignId?: string | null;
    conversationId?: string | null;
    leadId?: string | null;
  };
}) {
  const { mutate: sendFeedback } = useSuggestionFeedback();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const lastShownSignature = useRef<string | null>(null);
  const lastActionTaken = useRef<'applied' | 'regenerated' | null>(null);
  const normalizedSuggestions = useMemo<SuggestedDraft[]>(() => {
    if (!data || !Array.isArray(data.suggestions)) return [];
    return data.suggestions
      .filter((item): item is SuggestedDraft => Boolean(item && typeof item.message === 'string'))
      .map((item) => ({
        subject: typeof item.subject === 'string' || item.subject === null ? item.subject : null,
        message: item.message,
        rationale:
          typeof item.rationale === 'string' || item.rationale === null ? item.rationale : null,
        variables_used: Array.isArray(item.variables_used) ? item.variables_used : [],
        grounding: Array.isArray(item.grounding) ? item.grounding : [],
      }));
  }, [data]);
  const contextRef = useRef({
    surface,
    suggestionType,
    workspaceId: feedbackContext?.workspaceId || undefined,
    campaignId: feedbackContext?.campaignId || undefined,
    conversationId: feedbackContext?.conversationId || undefined,
    leadId: feedbackContext?.leadId || undefined,
  });

  useEffect(() => {
    contextRef.current = {
      surface,
      suggestionType,
      workspaceId: feedbackContext?.workspaceId || undefined,
      campaignId: feedbackContext?.campaignId || undefined,
      conversationId: feedbackContext?.conversationId || undefined,
      leadId: feedbackContext?.leadId || undefined,
    };
  }, [
    surface,
    suggestionType,
    feedbackContext?.workspaceId,
    feedbackContext?.campaignId,
    feedbackContext?.conversationId,
    feedbackContext?.leadId,
  ]);

  const emitFeedback = useCallback(
    (
      action: string,
      metadata?: Record<string, unknown>,
      overrides?: { signature?: string | null }
    ) => {
      sendFeedback({
        surface: contextRef.current.surface,
        suggestion_type: contextRef.current.suggestionType,
        action,
        workspace_id: contextRef.current.workspaceId,
        campaign_id: contextRef.current.campaignId,
        conversation_id: contextRef.current.conversationId,
        lead_id: contextRef.current.leadId,
        metadata: {
          signature: overrides?.signature ?? lastShownSignature.current,
          ...metadata,
        },
      });
    },
    [sendFeedback]
  );

  useEffect(() => {
    if (!normalizedSuggestions.length) return;
    const signature = `${surface}:${normalizedSuggestions
      .map((item) => item.message)
      .join('|')
      .slice(0, 200)}`;
    if (lastShownSignature.current === signature) return;
    if (lastShownSignature.current && !lastActionTaken.current) {
      emitFeedback(
        'ignored',
        { reason: 'replaced_by_new_suggestions' },
        { signature: lastShownSignature.current }
      );
    }
    lastShownSignature.current = signature;
    lastActionTaken.current = null;
    emitFeedback('shown', { count: normalizedSuggestions.length }, { signature });
  }, [data, normalizedSuggestions, surface, suggestionType, emitFeedback]);

  useEffect(() => {
    return () => {
      if (lastShownSignature.current && !lastActionTaken.current) {
        emitFeedback(
          'ignored',
          { reason: 'panel_unmounted' },
          { signature: lastShownSignature.current }
        );
      }
    };
  }, [emitFeedback]);

  useEffect(() => {
    setIsCollapsed(false);
  }, [variant, data]);

  const title = suggestionType === 'reply' ? 'Suggested replies' : 'Suggested drafts';
  const visibleSuggestions =
    variant === 'compact' ? normalizedSuggestions.slice(0, 2) : normalizedSuggestions;

  if (
    variant === 'compact' &&
    isCollapsed &&
    !error &&
    !isLoading &&
    normalizedSuggestions.length > 0
  ) {
    return (
      <div className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-2.5 py-2">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[13px] font-medium text-[#1E293B]">{title}</p>
            <p className="text-[11px] text-[#64748B]">
              {normalizedSuggestions.length} suggestion{normalizedSuggestions.length > 1 ? 's' : ''}{' '}
              ready
            </p>
          </div>
          <div className="flex items-center gap-2">
            {onRegenerate ? (
              <button
                type="button"
                onClick={() => {
                  lastActionTaken.current = 'regenerated';
                  emitFeedback('regenerated', { count: data?.suggestions?.length || 0 });
                  onRegenerate();
                }}
                disabled={isLoading}
                className="rounded-lg border border-[#CBD5E1] bg-white px-2.5 py-1 text-[11px] font-medium text-[#334155] hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Regenerate
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => setIsCollapsed(false)}
              className="rounded-lg bg-[#0F172A] px-2.5 py-1 text-[11px] font-medium text-white hover:bg-[#1E293B]"
            >
              Show
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={
        variant === 'compact'
          ? 'rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-2'
          : 'rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3'
      }
    >
      <div
        className={`flex items-start justify-between gap-2 ${variant === 'compact' ? 'mb-2' : 'mb-3'}`}
      >
        <div>
          <p
            className={`${variant === 'compact' ? 'text-[13px]' : 'text-sm'} font-medium text-[#1E293B]`}
          >
            {title}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {variant === 'compact' && normalizedSuggestions.length > 0 ? (
            <button
              type="button"
              onClick={() => setIsCollapsed(true)}
              className="rounded-lg border border-[#CBD5E1] bg-white px-2.5 py-1 text-[11px] font-medium text-[#334155] hover:bg-[#F8FAFC]"
            >
              Hide
            </button>
          ) : null}
          {onRegenerate ? (
            <button
              type="button"
              onClick={() => {
                lastActionTaken.current = 'regenerated';
                emitFeedback('regenerated', { count: data?.suggestions?.length || 0 });
                onRegenerate();
              }}
              disabled={isLoading}
              className="rounded-lg border border-[#CBD5E1] bg-white px-3 py-1.5 text-[11px] font-medium text-[#334155] hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Regenerate
            </button>
          ) : null}
          {isLoading && <span className="text-xs font-medium text-[#64748B]">Loading...</span>}
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-[#FECACA] bg-[#FEF2F2] p-3 text-xs text-[#B91C1C]">
          {error}
        </div>
      ) : null}

      {!error && !isLoading && normalizedSuggestions.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[#CBD5E1] bg-white p-3 text-xs text-[#64748B]">
          Suggestions will appear here once Parrot has enough context for this step.
        </div>
      ) : null}

      <div className={variant === 'compact' ? 'space-y-1.5' : 'space-y-3'}>
        {visibleSuggestions.map((draft, index) => (
          <div
            key={`${index}-${draft.message.slice(0, 24)}`}
            className={`rounded-lg border border-[#E2E8F0] bg-white ${variant === 'compact' ? 'p-2' : 'p-3'}`}
          >
            {draft.subject ? (
              <p className="text-xs font-medium uppercase tracking-wide text-[#64748B]">
                Subject: <span className="normal-case text-[#1E293B]">{draft.subject}</span>
              </p>
            ) : null}
            <p
              className={`text-[#1E293B] ${variant === 'compact' ? 'line-clamp-2 whitespace-pre-wrap text-[12px] leading-4' : 'mt-2 whitespace-pre-wrap text-sm'}`}
            >
              {draft.message}
            </p>
            <div
              className={`flex ${variant === 'compact' ? 'mt-1.5 items-center justify-end' : 'mt-3 justify-end'}`}
            >
              {variant === 'compact' ? null : null}
              <button
                onClick={() => {
                  lastActionTaken.current = 'applied';
                  emitFeedback('applied', {
                    subject_present: Boolean(draft.subject),
                    variables_used: draft.variables_used,
                    grounding: draft.grounding,
                  });
                  onApply(draft);
                  if (variant === 'compact') {
                    setIsCollapsed(true);
                  }
                }}
                className={`rounded-lg bg-[#0F172A] font-medium text-white hover:bg-[#1E293B] ${variant === 'compact' ? 'px-2.5 py-1.5 text-[11px]' : 'px-3 py-2 text-xs'}`}
              >
                {variant === 'compact'
                  ? 'Use'
                  : suggestionType === 'reply'
                    ? 'Use reply'
                    : 'Use draft'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
