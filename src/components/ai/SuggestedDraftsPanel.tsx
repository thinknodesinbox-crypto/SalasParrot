import { useCallback, useEffect, useRef } from 'react';

import { useSuggestionFeedback } from '@/lib/hooks/queries';
import type { ReplySuggestionsResponse, SequenceStepSuggestionsResponse } from '@/lib/types';

export function SuggestedDraftsPanel({
  data,
  isLoading,
  error,
  onApply,
  onRegenerate,
  surface = 'unknown',
  suggestionType = 'draft',
  feedbackContext,
}: {
  data: SequenceStepSuggestionsResponse | ReplySuggestionsResponse | null;
  isLoading: boolean;
  error: string | null;
  onApply: (draft: { subject?: string | null; message: string }) => void;
  onRegenerate?: () => void;
  surface?: string;
  suggestionType?: string;
  feedbackContext?: {
    workspaceId?: string | null;
    campaignId?: string | null;
    conversationId?: string | null;
    leadId?: string | null;
  };
}) {
  const { mutate: sendFeedback } = useSuggestionFeedback();
  const lastShownSignature = useRef<string | null>(null);
  const lastActionTaken = useRef<'applied' | 'regenerated' | null>(null);
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
    if (!data?.suggestions?.length) return;
    const signature = `${surface}:${data.suggestions
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
    emitFeedback('shown', { count: data.suggestions.length }, { signature });
  }, [data, surface, suggestionType, emitFeedback]);

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

  return (
    <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-[#1E293B]">Suggested drafts</p>
          <p className="mt-1 text-xs text-[#64748B]">
            Suggestions use your business context and a representative prospect when available.
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

      {!error && !isLoading && (!data || data.suggestions.length === 0) ? (
        <div className="rounded-lg border border-dashed border-[#CBD5E1] bg-white p-3 text-xs text-[#64748B]">
          Suggestions will appear here once Parrot has enough context for this step.
        </div>
      ) : null}

      {data?.provenance_labels?.length ? (
        <div className="mb-3 rounded-lg border border-[#E2E8F0] bg-white p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-[#64748B]">Grounded In</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {data.provenance_labels.map((label) => (
              <span
                key={label}
                className="rounded bg-[#ECFDF5] px-2 py-1 text-[10px] font-medium text-[#047857]"
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {data?.sample_lead ? (
        <div className="mb-3 rounded-lg border border-[#E2E8F0] bg-white p-3 text-xs text-[#475569]">
          <p className="font-medium text-[#1E293B]">Representative prospect</p>
          <p className="mt-1">
            {[data.sample_lead.full_name, data.sample_lead.title, data.sample_lead.company]
              .filter(Boolean)
              .join(' • ')}
          </p>
        </div>
      ) : null}

      <div className="space-y-3">
        {data?.suggestions.map((draft, index) => (
          <div
            key={`${index}-${draft.message.slice(0, 24)}`}
            className="rounded-lg border border-[#E2E8F0] bg-white p-3"
          >
            {draft.subject ? (
              <p className="text-xs font-medium uppercase tracking-wide text-[#64748B]">
                Subject: <span className="normal-case text-[#1E293B]">{draft.subject}</span>
              </p>
            ) : null}
            <p className="mt-2 whitespace-pre-wrap text-sm text-[#1E293B]">{draft.message}</p>
            {draft.rationale ? (
              <p className="mt-2 text-xs text-[#64748B]">{draft.rationale}</p>
            ) : null}
            {(draft.grounding.length > 0 || draft.variables_used.length > 0) && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {draft.grounding.map((item) => (
                  <span
                    key={`ground-${item}`}
                    className="rounded bg-[#EFF6FF] px-2 py-1 text-[10px] font-medium text-[#1D4ED8]"
                  >
                    {item}
                  </span>
                ))}
                {draft.variables_used.map((item) => (
                  <span
                    key={`var-${item}`}
                    className="rounded bg-[#FFF7ED] px-2 py-1 text-[10px] font-medium text-[#C2410C]"
                  >
                    {item}
                  </span>
                ))}
              </div>
            )}
            <div className="mt-3 flex justify-end">
              <button
                onClick={() => {
                  lastActionTaken.current = 'applied';
                  emitFeedback('applied', {
                    subject_present: Boolean(draft.subject),
                    variables_used: draft.variables_used,
                    grounding: draft.grounding,
                  });
                  onApply(draft);
                }}
                className="rounded-lg bg-[#0F172A] px-3 py-2 text-xs font-medium text-white hover:bg-[#1E293B]"
              >
                Use draft
              </button>
            </div>
          </div>
        ))}
      </div>

      {data?.context_notes?.length ? (
        <div className="mt-3 rounded-lg border border-[#E2E8F0] bg-white p-3 text-xs text-[#64748B]">
          {data.context_notes.map((note) => (
            <p key={note}>{note}</p>
          ))}
        </div>
      ) : null}

      {'variable_availability' in (data || {}) &&
      Array.isArray((data as { variable_availability?: unknown })?.variable_availability) &&
      (
        data as {
          variable_availability?: {
            variable: string;
            available_count: number;
            total_count: number;
            sample_value: string | null;
          }[];
        }
      ).variable_availability?.length ? (
        <div className="mt-3 rounded-lg border border-[#E2E8F0] bg-white p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-[#64748B]">
            Variable availability
          </p>
          <div className="mt-2 space-y-2">
            {(
              data as {
                variable_availability?: {
                  variable: string;
                  available_count: number;
                  total_count: number;
                  sample_value: string | null;
                }[];
              }
            ).variable_availability?.map((item) => (
              <div
                key={item.variable}
                className="flex items-start justify-between gap-3 text-xs text-[#475569]"
              >
                <div>
                  <p className="font-medium text-[#1E293B]">{item.variable}</p>
                  {item.sample_value ? (
                    <p className="mt-0.5 text-[#64748B]">e.g. {item.sample_value}</p>
                  ) : null}
                </div>
                <div className="text-right">
                  <p className="font-medium text-[#1E293B]">
                    {item.available_count}/{item.total_count}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
