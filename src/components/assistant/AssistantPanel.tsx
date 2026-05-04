import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2, Mic, PhoneOff, Sparkles } from 'lucide-react';
import { queryKeys } from '@/lib/queryClient';
import { useCurrentWorkspace } from '@/lib/workspace';
import { useAssistantUiStore } from '@/lib/assistantUi';
import { useAssistantVoice } from '@/lib/hooks/useAssistantVoice';
import {
  useAssistantMessages,
  useAssistantActions,
  useCreateAssistantQrTransfer,
  useAssistantThreads,
  useCreateAssistantThread,
  useApproveAssistantAction,
  useRejectAssistantAction,
  useEditAssistantAction,
  useExecuteAssistantAction,
  useSendAssistantMessage,
  useWorkspace,
} from '@/lib/hooks/queries';
import { AssistantComposer } from './AssistantComposer';
import { AssistantMessageList } from './AssistantMessageList';
import { QRHandoffModal } from './QRHandoffModal';
import { AssistantThreadList } from './AssistantThreadList';

interface AssistantPanelProps {
  mode: 'drawer' | 'page';
  initialThreadId?: string | null;
  onClose?: () => void;
  onExpand?: (threadId: string | null) => void;
}

type VoiceReviewSummary = {
  headline?: string;
  spokenSummary?: string;
  requiresVisualReview?: boolean;
  visualReason?: string | null;
};

type AssistantNotice = {
  id: number;
  tone: 'success' | 'error' | 'info';
  title: string;
  message: string;
};

function humanizeAssistantOperationError(message: string | null | undefined) {
  const cleaned = message?.trim();
  if (!cleaned) return 'SalesParrot could not complete that. Please try again.';
  const lower = cleaned.toLowerCase();

  if (lower.includes('status code 400')) {
    return 'SalesParrot could not complete that with the current setup. Refresh and try again.';
  }
  if (lower.includes('status code 401') || lower.includes('unauthorized')) {
    return 'Your session needs to be refreshed. Sign in again, then retry.';
  }
  if (lower.includes('status code 403') || lower.includes('permission')) {
    return 'SalesParrot needs permission before it can do that. Check the connected account or workspace access.';
  }
  if (lower.includes('status code 404')) {
    return 'SalesParrot could not find the conversation or action anymore. Refresh the page and try again.';
  }
  if (lower.includes('status code 409')) {
    return 'That item changed while you were reviewing it. Refresh the conversation before continuing.';
  }
  if (lower.includes('status code 429') || lower.includes('rate limit')) {
    return 'SalesParrot is receiving too many requests right now. Wait a moment, then try again.';
  }
  if (lower.includes('network') || lower.includes('failed to fetch')) {
    return 'The connection dropped before SalesParrot could finish. Check your internet and retry.';
  }

  return cleaned;
}

function humanizeVoiceError(message: string | null | undefined) {
  const cleaned = message?.trim();
  if (!cleaned) return 'Try again. If it keeps happening, refresh this page.';
  const lower = cleaned.toLowerCase();

  if (lower.includes('status code 400') || lower.includes('realtime voice session')) {
    return 'The voice session could not be prepared. Refresh this page and try voice again.';
  }
  if (lower.includes('microphone permission') || lower.includes('permission was denied')) {
    return 'Allow microphone access in your browser, then start voice again.';
  }
  if (lower.includes('no microphone')) {
    return 'No microphone was found on this device. Connect one, then try again.';
  }
  if (lower.includes('already in use')) {
    return 'Your microphone is being used by another app. Close that app, then try again.';
  }
  if (lower.includes('network') || lower.includes('interrupted')) {
    return 'The connection dropped during voice mode. Check your internet connection and restart voice.';
  }
  if (lower.includes('https') || lower.includes('secure')) {
    return 'Voice mode needs a secure browser connection. Use HTTPS or localhost.';
  }

  return cleaned;
}

function VoiceOrb({
  isActive,
  isConnecting,
  disabled,
  unavailableReason,
  onToggle,
}: {
  isActive: boolean;
  isConnecting: boolean;
  disabled: boolean;
  unavailableReason?: string | null;
  onToggle: () => void;
}) {
  const label = isConnecting ? 'Connecting' : isActive ? 'Listening' : 'Voice';
  const title = disabled
    ? 'Select a workspace to use voice'
    : unavailableReason || (isActive ? 'Stop voice mode' : 'Start voice mode');

  return (
    <div className="pointer-events-auto flex flex-col items-center">
      <button
        type="button"
        onClick={onToggle}
        disabled={disabled || Boolean(unavailableReason)}
        title={title}
        aria-label={isActive ? 'Stop voice mode' : 'Start voice mode'}
        className={`group relative flex h-20 w-20 items-center justify-center rounded-full transition-all disabled:cursor-not-allowed ${
          isActive || isConnecting
            ? 'border border-[#DBF4FF]/80 bg-[#CFF4FF] text-white shadow-[0_26px_80px_rgba(56,189,248,0.36)]'
            : 'border border-[#E2E8F0] bg-white text-[#0F172A] shadow-[0_18px_45px_rgba(15,23,42,0.12)] hover:-translate-y-0.5 hover:border-[#CBD5E1]'
        }`}
      >
        {isActive || isConnecting ? (
          <>
            <motion.span
              className="absolute inset-[-18px] rounded-full bg-[#7DD3FC]/20 blur-2xl"
              animate={{ scale: [0.92, 1.18, 0.96], opacity: [0.35, 0.72, 0.4] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.span
              className="absolute inset-[-9px] rounded-full border border-[#BAE6FD]/55"
              animate={{ scale: [1, 1.2, 1], opacity: [0.48, 0.08, 0.42] }}
              transition={{ duration: 1.7, repeat: Infinity, ease: 'easeOut' }}
            />
            <motion.span
              className="absolute inset-0 overflow-hidden rounded-full bg-[radial-gradient(circle_at_62%_20%,rgba(240,253,255,0.98)_0%,rgba(224,249,255,0.88)_24%,rgba(125,211,252,0.9)_50%,rgba(14,165,233,0.9)_74%,rgba(2,132,199,0.95)_100%)]"
              animate={{
                borderRadius: [
                  '50% 50% 48% 52%',
                  '46% 54% 53% 47%',
                  '53% 47% 46% 54%',
                  '50% 50% 48% 52%',
                ],
                scale: isConnecting ? [1, 1.03, 1] : [1, 1.06, 0.98, 1.04, 1],
              }}
              transition={{
                duration: isConnecting ? 1.6 : 2.8,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              <motion.span
                className="absolute -left-5 top-5 h-16 w-16 rounded-full bg-[#0284C7]/45 blur-xl"
                animate={{ x: [0, 10, -4, 0], y: [0, -7, 5, 0], opacity: [0.35, 0.62, 0.4] }}
                transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
              />
              <motion.span
                className="bg-white/72 absolute -right-3 -top-2 h-14 w-14 rounded-full blur-lg"
                animate={{ x: [0, -7, 4, 0], y: [0, 8, -4, 0], opacity: [0.72, 0.42, 0.78] }}
                transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
              />
              <motion.span
                className="absolute bottom-0 left-1/2 h-11 w-16 -translate-x-1/2 rounded-full bg-[#38BDF8]/55 blur-md"
                animate={{ scaleX: [1, 1.18, 0.94, 1], opacity: [0.5, 0.82, 0.55] }}
                transition={{ duration: 2.1, repeat: Infinity, ease: 'easeInOut' }}
              />
              <span className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_44%_16%,rgba(255,255,255,0.76),rgba(255,255,255,0.1)_32%,transparent_58%)]" />
            </motion.span>
            <span className="border-white/28 absolute inset-[7px] rounded-full border" />
            <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/90 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
              {isConnecting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <PhoneOff className="h-5 w-5" />
              )}
            </span>
          </>
        ) : (
          <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-[#F8FAFC]">
            <Mic className="h-7 w-7" />
          </span>
        )}
      </button>
      <div className="bg-white/92 mt-2 rounded-full border border-[#E2E8F0] px-3 py-1.5 text-xs font-semibold text-[#475569] shadow-sm backdrop-blur">
        {label}
      </div>
    </div>
  );
}

function VoiceReviewCard({
  review,
  actionState,
  onApprove,
  onExecute,
  onCancel,
}: {
  review: VoiceReviewSummary;
  actionState: 'awaiting_confirmation' | 'approved' | null;
  onApprove: () => void;
  onExecute: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="pointer-events-auto mt-3 w-[min(92vw,520px)] rounded-[24px] border border-[#E9D5FF] bg-white/95 p-4 text-left shadow-[0_22px_60px_rgba(15,23,42,0.14)] backdrop-blur">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-2xl bg-[#F5F3FF] text-[#7C3AED]">
          <Sparkles className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-[#4C1D95]">
            {review.requiresVisualReview
              ? 'Review this in chat'
              : actionState === 'approved'
                ? 'Ready to run'
                : 'Confirm before SalesParrot acts'}
          </div>
          <div className="mt-1 line-clamp-3 text-sm leading-5 text-[#6D28D9]">
            {review.spokenSummary}
            {review.requiresVisualReview && review.visualReason ? ` ${review.visualReason}` : ''}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {actionState === 'awaiting_confirmation' && !review.requiresVisualReview ? (
              <button
                type="button"
                onClick={onApprove}
                className="rounded-full bg-[#6D28D9] px-3 py-2 text-xs font-semibold text-white"
              >
                Approve
              </button>
            ) : null}
            {actionState === 'approved' && !review.requiresVisualReview ? (
              <button
                type="button"
                onClick={onExecute}
                className="rounded-full bg-[#FF6B35] px-3 py-2 text-xs font-semibold text-white"
              >
                Run it
              </button>
            ) : null}
            <button
              type="button"
              onClick={onCancel}
              className="rounded-full border border-[#D8B4FE] bg-white px-3 py-2 text-xs font-semibold text-[#6D28D9]"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AssistantNoticeToast({
  notice,
  onDismiss,
}: {
  notice: AssistantNotice | null;
  onDismiss: () => void;
}) {
  const toneClasses =
    notice?.tone === 'success'
      ? 'border-[#BBF7D0] bg-white text-[#166534]'
      : notice?.tone === 'info'
        ? 'border-[#BFDBFE] bg-white text-[#1D4ED8]'
        : 'border-[#FED7AA] bg-white text-[#C2410C]';

  return (
    <AnimatePresence>
      {notice ? (
        <motion.div
          key={notice.id}
          initial={{ opacity: 0, y: 12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.98 }}
          transition={{ duration: 0.18 }}
          className={`pointer-events-auto flex w-[min(92vw,460px)] items-start gap-3 rounded-2xl border px-4 py-3 shadow-[0_18px_48px_rgba(15,23,42,0.14)] backdrop-blur ${toneClasses}`}
        >
          <div
            className={`mt-1.5 h-2 w-2 flex-shrink-0 rounded-full ${
              notice.tone === 'success'
                ? 'bg-[#22C55E]'
                : notice.tone === 'info'
                  ? 'bg-[#3B82F6]'
                  : 'bg-[#F97316]'
            }`}
          />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold">{notice.title}</div>
            <div className="mt-1 text-sm leading-5 opacity-85">{notice.message}</div>
          </div>
          <button
            type="button"
            onClick={onDismiss}
            className="rounded-full px-2 py-1 text-xs font-semibold opacity-75 transition-opacity hover:bg-[#F8FAFC] hover:opacity-100"
          >
            Dismiss
          </button>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export function AssistantPanel({
  mode,
  initialThreadId = null,
  onClose,
  onExpand,
}: AssistantPanelProps) {
  const queryClient = useQueryClient();
  const { currentWorkspaceId } = useCurrentWorkspace();
  const setSelectedThreadId = useAssistantUiStore((state) => state.setSelectedThreadId);
  const { data: workspace = null } = useWorkspace(currentWorkspaceId || '');
  const {
    data: threads = [],
    isLoading: isThreadsLoading,
    isError: isThreadsError,
    error: threadsError,
    refetch: refetchThreads,
  } = useAssistantThreads(currentWorkspaceId);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(initialThreadId);
  const [pendingThreadId, setPendingThreadId] = useState<string | null>(null);
  const [isThreadSidebarOpen, setIsThreadSidebarOpen] = useState(false);
  const [pendingUserMessage, setPendingUserMessage] = useState('');
  const [assistantNotice, setAssistantNotice] = useState<AssistantNotice | null>(null);
  const {
    data: messages = [],
    isLoading: isMessagesLoading,
    isError: isMessagesError,
    error: messagesError,
    refetch: refetchMessages,
  } = useAssistantMessages(currentWorkspaceId, activeThreadId);
  const {
    data: actions = [],
    isError: isActionsError,
    error: actionsError,
    refetch: refetchActions,
  } = useAssistantActions(currentWorkspaceId, activeThreadId);
  const createThread = useCreateAssistantThread(currentWorkspaceId);
  const sendMessage = useSendAssistantMessage(currentWorkspaceId);
  const approveAction = useApproveAssistantAction(currentWorkspaceId, activeThreadId);
  const rejectAction = useRejectAssistantAction(currentWorkspaceId, activeThreadId);
  const editAction = useEditAssistantAction(currentWorkspaceId, activeThreadId);
  const executeAction = useExecuteAssistantAction(currentWorkspaceId, activeThreadId);
  const createQrTransfer = useCreateAssistantQrTransfer(currentWorkspaceId, activeThreadId);
  const [showQrModal, setShowQrModal] = useState(false);
  const voice = useAssistantVoice({
    workspaceId: currentWorkspaceId,
    threadId: activeThreadId,
    onTranscriptSaved: () => {
      if (currentWorkspaceId && activeThreadId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.assistant.messages(currentWorkspaceId, activeThreadId),
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.assistant.actions(currentWorkspaceId, activeThreadId),
        });
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.assistant.threads(currentWorkspaceId) });
    },
  });
  const voiceCapability = voice.capability ?? { supported: true, reason: null };
  const isVoiceActive = voice.status === 'connecting' || voice.status === 'connected';
  const conversationError =
    (isMessagesError ? messagesError?.message : null) ||
    (isActionsError ? actionsError?.message : null);

  useEffect(() => {
    if (mode === 'page' && !initialThreadId) {
      setActiveThreadId(null);
      return;
    }
    if (initialThreadId) {
      setActiveThreadId(initialThreadId);
    }
  }, [initialThreadId, mode]);

  useEffect(() => {
    if (mode === 'drawer' && !activeThreadId && threads.length > 0) {
      setActiveThreadId(threads[0].id);
    }
    if (pendingThreadId && threads.some((thread) => thread.id === pendingThreadId)) {
      setPendingThreadId(null);
    }
    if (
      activeThreadId &&
      activeThreadId !== pendingThreadId &&
      threads.every((thread) => thread.id !== activeThreadId)
    ) {
      setActiveThreadId(mode === 'drawer' ? (threads[0]?.id ?? null) : null);
    }
  }, [threads, activeThreadId, pendingThreadId, mode]);

  useEffect(() => {
    setSelectedThreadId(activeThreadId);
  }, [activeThreadId, setSelectedThreadId]);

  useEffect(() => {
    if (mode === 'drawer' && !activeThreadId && threads.length > 0) {
      setIsThreadSidebarOpen(true);
    }
  }, [mode, activeThreadId, threads.length]);

  const showAssistantNotice = (tone: AssistantNotice['tone'], title: string, message: string) => {
    setAssistantNotice({ id: Date.now(), tone, title, message });
  };

  useEffect(() => {
    if (!assistantNotice) return;
    const timeoutId = window.setTimeout(
      () => {
        setAssistantNotice(null);
      },
      assistantNotice.tone === 'error' ? 6200 : 3600
    );
    return () => window.clearTimeout(timeoutId);
  }, [assistantNotice]);

  useEffect(() => {
    if (!voice.error) return;
    const timeoutId = window.setTimeout(() => {
      voice.clearError();
    }, 5200);
    return () => window.clearTimeout(timeoutId);
  }, [voice]);

  useEffect(() => {
    if (voice.error) {
      voice.clearError();
    }
  }, [activeThreadId, voice]);

  const starterPrompt = useMemo(() => {
    if (!workspace) return '';
    return `What needs attention in ${workspace.name} today?`;
  }, [workspace]);

  const actionsById = useMemo(
    () => Object.fromEntries(actions.map((action) => [action.id, action])),
    [actions]
  );
  const activeThread = useMemo(
    () => threads.find((thread) => thread.id === activeThreadId) ?? null,
    [threads, activeThreadId]
  );
  const latestVoiceReviewAction = useMemo(
    () =>
      [...actions]
        .reverse()
        .find(
          (action) => action.status === 'awaiting_confirmation' || action.status === 'approved'
        ) ?? null,
    [actions]
  );
  const latestVoiceReview = useMemo(() => {
    const voiceReview = latestVoiceReviewAction?.preview.voice_review;
    if (!voiceReview) return null;
    return {
      headline: voiceReview.headline ?? latestVoiceReviewAction.preview.title,
      spokenSummary:
        voiceReview.spoken_summary ??
        voiceReview.approval_prompt ??
        latestVoiceReviewAction.preview.summary,
      requiresVisualReview: Boolean(voiceReview.requires_visual_review),
      visualReason: voiceReview.visual_reason ?? null,
    };
  }, [latestVoiceReviewAction]);

  const pageStarterPrompts = useMemo(() => {
    const workspaceName = workspace?.name || 'this workspace';
    return [
      `What changed in ${workspaceName} this week?`,
      `Which campaigns in ${workspaceName} need attention first?`,
      'Are there any sender or inbox risks right now?',
      'What should SalesParrot do next to create more pipeline?',
    ];
  }, [workspace]);

  const handleCreateThread = async () => {
    try {
      const thread = await createThread.mutateAsync({});
      setPendingThreadId(thread.id);
      setActiveThreadId(thread.id);
      setIsThreadSidebarOpen(false);
    } catch (error) {
      showAssistantNotice(
        'error',
        'Could not start a new conversation',
        humanizeAssistantOperationError(error instanceof Error ? error.message : null)
      );
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!currentWorkspaceId) return;
    setPendingUserMessage(content);
    let targetThreadId = activeThreadId;
    try {
      if (!targetThreadId) {
        const thread = await createThread.mutateAsync({
          title: content.slice(0, 80) || starterPrompt || 'Assistant conversation',
        });
        targetThreadId = thread.id;
        setActiveThreadId(thread.id);
      }
      await sendMessage.mutateAsync({ threadId: targetThreadId, content });
    } catch (error) {
      showAssistantNotice(
        'error',
        'Message was not sent',
        humanizeAssistantOperationError(error instanceof Error ? error.message : null)
      );
    } finally {
      setPendingUserMessage('');
    }
  };

  const handleApproveAction = async (actionId: string, note?: string) => {
    try {
      await approveAction.mutateAsync({ actionId, note });
      showAssistantNotice('success', 'Approved', 'SalesParrot can continue with this action.');
    } catch (error) {
      showAssistantNotice(
        'error',
        'Could not approve that action',
        humanizeAssistantOperationError(error instanceof Error ? error.message : null)
      );
    }
  };

  const handleRejectAction = async (actionId: string, reason?: string) => {
    try {
      await rejectAction.mutateAsync({ actionId, reason });
      showAssistantNotice('info', 'Cancelled', 'SalesParrot will not run that action.');
    } catch (error) {
      showAssistantNotice(
        'error',
        'Could not cancel that action',
        humanizeAssistantOperationError(error instanceof Error ? error.message : null)
      );
    }
  };

  const handleEditAction = async (
    actionId: string,
    payload: Record<string, unknown>,
    message?: string
  ) => {
    try {
      await editAction.mutateAsync({ actionId, payload, message });
      showAssistantNotice('success', 'Saved', 'The action was updated.');
    } catch (error) {
      showAssistantNotice(
        'error',
        'Could not save those changes',
        humanizeAssistantOperationError(error instanceof Error ? error.message : null)
      );
    }
  };

  const handleExecuteAction = async (actionId: string) => {
    try {
      await executeAction.mutateAsync({ actionId });
      showAssistantNotice('success', 'Started', 'SalesParrot is running the approved action.');
    } catch (error) {
      showAssistantNotice(
        'error',
        'Could not run that action',
        humanizeAssistantOperationError(error instanceof Error ? error.message : null)
      );
    }
  };

  const handleToggleVoice = async () => {
    if (isVoiceActive) {
      await voice.stop();
      return;
    }

    if (!currentWorkspaceId) return;
    voice.clearError();
    let targetThreadId = activeThreadId;
    if (!targetThreadId) {
      const thread = await createThread.mutateAsync({
        title: starterPrompt || 'Assistant conversation',
      });
      targetThreadId = thread.id;
      setActiveThreadId(thread.id);
    }

    await voice.start({ workspaceId: currentWorkspaceId, threadId: targetThreadId });
  };

  const handleExpand = async () => {
    if (isVoiceActive) {
      await voice.stop();
    }
    onExpand?.(activeThreadId);
  };

  const voiceHeaderStatus =
    voice.status === 'connecting' ? 'Connecting' : isVoiceActive ? 'Live' : null;

  if (mode === 'page') {
    return (
      <>
        <section>
          <div className="relative min-w-0">
            <div className="overflow-hidden rounded-[30px] border border-[#E2E8F0] bg-white shadow-[0_24px_60px_rgba(15,23,42,0.08)]">
              <div className="relative flex h-[calc(100vh-4.75rem)] min-h-[620px] flex-col bg-[linear-gradient(180deg,#FFFFFF_0%,#FBFDFF_100%)] md:h-[calc(100vh-5.5rem)]">
                <div className="pointer-events-none absolute left-1/2 top-4 z-10 flex -translate-x-1/2 flex-col items-center">
                  <VoiceOrb
                    isActive={isVoiceActive}
                    isConnecting={voice.status === 'connecting'}
                    disabled={!currentWorkspaceId}
                    unavailableReason={!voiceCapability.supported ? voiceCapability.reason : null}
                    onToggle={() => void handleToggleVoice()}
                  />
                  <AnimatePresence>
                    {voice.error ? (
                      <motion.div
                        role="alert"
                        initial={{ opacity: 0, y: -6, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.98 }}
                        transition={{ duration: 0.18 }}
                        className="pointer-events-auto mt-2 flex max-w-[min(92vw,460px)] items-start gap-3 rounded-2xl border border-[#FED7AA] bg-white/95 px-4 py-3 text-left shadow-[0_18px_45px_rgba(15,23,42,0.12)] backdrop-blur"
                      >
                        <div className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-[#F97316]" />
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-semibold text-[#9A3412]">
                            Voice could not start
                          </div>
                          <div className="mt-1 text-sm leading-5 text-[#C2410C]">
                            {humanizeVoiceError(voice.error)}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => voice.clearError()}
                          className="pointer-events-auto rounded-full px-2 py-1 text-xs font-semibold text-[#9A3412] hover:bg-[#FFF7ED]"
                        >
                          Dismiss
                        </button>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                  {isVoiceActive && latestVoiceReview?.spokenSummary ? (
                    <VoiceReviewCard
                      review={latestVoiceReview}
                      actionState={
                        latestVoiceReviewAction?.status === 'awaiting_confirmation' ||
                        latestVoiceReviewAction?.status === 'approved'
                          ? latestVoiceReviewAction.status
                          : null
                      }
                      onApprove={() => {
                        if (latestVoiceReviewAction?.status === 'awaiting_confirmation') {
                          void handleApproveAction(latestVoiceReviewAction.id);
                        }
                      }}
                      onExecute={() => {
                        if (latestVoiceReviewAction?.status === 'approved') {
                          void handleExecuteAction(latestVoiceReviewAction.id);
                        }
                      }}
                      onCancel={() => {
                        if (
                          latestVoiceReviewAction &&
                          latestVoiceReviewAction.status !== 'executed' &&
                          latestVoiceReviewAction.status !== 'rejected'
                        ) {
                          void handleRejectAction(latestVoiceReviewAction.id);
                        }
                      }}
                    />
                  ) : null}
                </div>

                <div className="absolute right-4 top-4 z-20 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void handleCreateThread()}
                    disabled={createThread.isPending || sendMessage.isPending}
                    className="bg-white/94 rounded-full border border-[#E2E8F0] px-3 py-2 text-xs font-semibold text-[#475569] shadow-sm backdrop-blur transition-colors hover:bg-white disabled:cursor-wait disabled:text-[#94A3B8]"
                  >
                    New
                  </button>
                  <button
                    onClick={() => {
                      setShowQrModal(true);
                      createQrTransfer.reset();
                      createQrTransfer.mutate();
                    }}
                    disabled={!activeThreadId || !currentWorkspaceId}
                    className="bg-white/94 rounded-full border border-[#E2E8F0] px-3 py-2 text-xs font-semibold text-[#475569] shadow-sm backdrop-blur transition-colors hover:bg-white disabled:cursor-not-allowed disabled:text-[#94A3B8]"
                  >
                    Mobile
                  </button>
                </div>

                <div className="min-h-0 flex-1 pt-20 md:pt-[5.5rem]">
                  <AssistantMessageList
                    variant="page"
                    suggestedPrompts={pageStarterPrompts}
                    suggestedPromptsDisabled={sendMessage.isPending || createThread.isPending}
                    onUseSuggestedPrompt={(prompt) => void handleSendMessage(prompt)}
                    messages={messages}
                    actionsById={actionsById}
                    isLoading={isMessagesLoading}
                    queryError={conversationError}
                    draftUserMessage={isVoiceActive ? voice.liveUserTranscript : pendingUserMessage}
                    draftAssistantMessage={isVoiceActive ? voice.liveAssistantTranscript : ''}
                    error={null}
                    isResponding={sendMessage.isPending || createThread.isPending}
                    onRetryQuery={() => {
                      void refetchMessages();
                      void refetchActions();
                    }}
                    onApproveAction={(actionId, note) => void handleApproveAction(actionId, note)}
                    onRejectAction={(actionId, reason) => void handleRejectAction(actionId, reason)}
                    onEditAction={(actionId, payload, message) =>
                      void handleEditAction(actionId, payload, message)
                    }
                    onExecuteAction={(actionId) => void handleExecuteAction(actionId)}
                    isApprovingAction={approveAction.isPending}
                    isRejectingAction={rejectAction.isPending}
                    isEditingAction={editAction.isPending}
                    isExecutingAction={executeAction.isPending}
                  />
                </div>
                <div className="pointer-events-none absolute bottom-[150px] left-1/2 z-20 -translate-x-1/2">
                  <AssistantNoticeToast
                    notice={assistantNotice}
                    onDismiss={() => setAssistantNotice(null)}
                  />
                </div>
                <AssistantComposer
                  variant="page"
                  hideVoiceControls
                  disabled={!currentWorkspaceId}
                  isSending={createThread.isPending || sendMessage.isPending}
                  isVoiceDisabled={!currentWorkspaceId}
                  isVoiceActive={isVoiceActive}
                  isVoiceConnecting={voice.status === 'connecting'}
                  voiceUnavailableReason={
                    !voiceCapability.supported ? voiceCapability.reason : null
                  }
                  voiceReview={isVoiceActive ? latestVoiceReview : null}
                  voiceActionState={
                    isVoiceActive &&
                    (latestVoiceReviewAction?.status === 'awaiting_confirmation' ||
                      latestVoiceReviewAction?.status === 'approved')
                      ? latestVoiceReviewAction.status
                      : null
                  }
                  onApproveVoiceAction={() => {
                    if (latestVoiceReviewAction?.status === 'awaiting_confirmation') {
                      void handleApproveAction(latestVoiceReviewAction.id);
                    }
                  }}
                  onExecuteVoiceAction={() => {
                    if (latestVoiceReviewAction?.status === 'approved') {
                      void handleExecuteAction(latestVoiceReviewAction.id);
                    }
                  }}
                  onRejectVoiceAction={() => {
                    if (
                      latestVoiceReviewAction &&
                      latestVoiceReviewAction.status !== 'executed' &&
                      latestVoiceReviewAction.status !== 'rejected'
                    ) {
                      void handleRejectAction(latestVoiceReviewAction.id);
                    }
                  }}
                  onToggleVoice={() => void handleToggleVoice()}
                  onSend={handleSendMessage}
                />
              </div>
            </div>
          </div>
        </section>

        <QRHandoffModal
          isOpen={showQrModal}
          handoffUrl={
            createQrTransfer.data
              ? `${window.location.origin}/assistant-handoff/${createQrTransfer.data.token}`
              : null
          }
          expiresAt={createQrTransfer.data?.expires_at ?? null}
          isLoading={createQrTransfer.isPending}
          error={createQrTransfer.isError ? createQrTransfer.error.message : null}
          onClose={() => setShowQrModal(false)}
        />
      </>
    );
  }

  const panelHeightClass = 'h-[min(80vh,760px)]';

  return (
    <>
      <div className="w-full overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-2xl">
        <div className="space-y-4 md:space-y-6">
          <div
            className={`relative overflow-hidden rounded-xl border border-[#E2E8F0] bg-white ${panelHeightClass} flex min-h-0 flex-col`}
          >
            <div className="flex min-h-0 flex-1 flex-col bg-[#F8FAFC]">
              <div className="border-b border-[#E2E8F0] bg-white px-4 py-4 md:px-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setIsThreadSidebarOpen(true)}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[#E2E8F0] bg-white text-[#1E293B] hover:bg-[#F8FAFC]"
                        aria-label="Open conversations"
                      >
                        <span className="flex flex-col gap-1.5">
                          <span className="h-0.5 w-4 rounded-full bg-current" />
                          <span className="h-0.5 w-4 rounded-full bg-current" />
                          <span className="h-0.5 w-4 rounded-full bg-current" />
                        </span>
                      </button>
                      <div className="min-w-0">
                        <div className="flex items-center gap-3">
                          <h2 className="truncate text-base font-semibold text-[#1E293B]">
                            Assistant
                          </h2>
                          {voiceHeaderStatus ? (
                            <span className="inline-flex items-center gap-2 rounded-full bg-[#FFF7ED] px-2.5 py-1 text-xs font-semibold text-[#C2410C]">
                              <span
                                className={`h-2 w-2 rounded-full ${voice.status === 'connecting' ? 'animate-pulse bg-[#F59E0B]' : 'animate-pulse bg-[#FF6B35]'}`}
                              />
                              Voice {voiceHeaderStatus}
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-1 truncate text-sm text-[#64748B]">
                          {activeThread?.title
                            ? `${threads.length} conversation${threads.length === 1 ? '' : 's'} in this workspace`
                            : 'Open the conversation sidebar to switch threads.'}
                        </p>
                      </div>
                    </div>
                    <p className="mt-3 text-sm text-[#64748B]">
                      Continue working while the assistant stays open.
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => void handleCreateThread()}
                        className="rounded-lg bg-[#FF6B35] px-3 py-2 text-sm font-medium text-white hover:bg-[#E85A2A]"
                      >
                        New conversation
                      </button>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-1">
                    <button
                      onClick={() => {
                        setShowQrModal(true);
                        createQrTransfer.reset();
                        createQrTransfer.mutate();
                      }}
                      disabled={!activeThreadId || !currentWorkspaceId}
                      className="rounded-lg px-2.5 py-2 text-xs font-medium text-[#1E293B] transition-colors hover:bg-white disabled:cursor-not-allowed disabled:text-[#94A3B8]"
                    >
                      Mobile
                    </button>
                    {onExpand ? (
                      <button
                        type="button"
                        onClick={() => void handleExpand()}
                        className="rounded-lg px-2.5 py-2 text-xs font-medium text-[#1E293B] transition-colors hover:bg-white"
                      >
                        Expand
                      </button>
                    ) : null}
                    {onClose ? (
                      <button
                        type="button"
                        onClick={() => {
                          if (isVoiceActive) {
                            void voice.stop();
                          }
                          onClose();
                        }}
                        className="rounded-lg px-2.5 py-2 text-xs font-medium text-[#64748B] transition-colors hover:bg-white hover:text-[#1E293B]"
                      >
                        Close
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
              <div className="min-h-0 flex-1">
                <AssistantMessageList
                  messages={messages}
                  actionsById={actionsById}
                  isLoading={isMessagesLoading}
                  queryError={conversationError}
                  draftUserMessage={isVoiceActive ? voice.liveUserTranscript : ''}
                  draftAssistantMessage={isVoiceActive ? voice.liveAssistantTranscript : ''}
                  error={voice.error}
                  onRetryQuery={() => {
                    void refetchMessages();
                    void refetchActions();
                  }}
                  onApproveAction={(actionId, note) => void handleApproveAction(actionId, note)}
                  onRejectAction={(actionId, reason) => void handleRejectAction(actionId, reason)}
                  onEditAction={(actionId, payload, message) =>
                    void handleEditAction(actionId, payload, message)
                  }
                  onExecuteAction={(actionId) => void handleExecuteAction(actionId)}
                  isApprovingAction={approveAction.isPending}
                  isRejectingAction={rejectAction.isPending}
                  isEditingAction={editAction.isPending}
                  isExecutingAction={executeAction.isPending}
                />
              </div>
              <div className="pointer-events-none absolute bottom-[136px] left-1/2 z-20 -translate-x-1/2">
                <AssistantNoticeToast
                  notice={assistantNotice}
                  onDismiss={() => setAssistantNotice(null)}
                />
              </div>
              <AssistantComposer
                disabled={!currentWorkspaceId}
                isSending={createThread.isPending || sendMessage.isPending}
                isVoiceDisabled={!currentWorkspaceId}
                isVoiceActive={isVoiceActive}
                isVoiceConnecting={voice.status === 'connecting'}
                voiceUnavailableReason={!voiceCapability.supported ? voiceCapability.reason : null}
                voiceReview={isVoiceActive ? latestVoiceReview : null}
                voiceActionState={
                  isVoiceActive &&
                  (latestVoiceReviewAction?.status === 'awaiting_confirmation' ||
                    latestVoiceReviewAction?.status === 'approved')
                    ? latestVoiceReviewAction.status
                    : null
                }
                onApproveVoiceAction={() => {
                  if (latestVoiceReviewAction?.status === 'awaiting_confirmation') {
                    void handleApproveAction(latestVoiceReviewAction.id);
                  }
                }}
                onExecuteVoiceAction={() => {
                  if (latestVoiceReviewAction?.status === 'approved') {
                    void handleExecuteAction(latestVoiceReviewAction.id);
                  }
                }}
                onRejectVoiceAction={() => {
                  if (
                    latestVoiceReviewAction &&
                    latestVoiceReviewAction.status !== 'executed' &&
                    latestVoiceReviewAction.status !== 'rejected'
                  ) {
                    void handleRejectAction(latestVoiceReviewAction.id);
                  }
                }}
                onToggleVoice={() => void handleToggleVoice()}
                onSend={handleSendMessage}
              />
            </div>

            <AnimatePresence>
              {isThreadSidebarOpen ? (
                <>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    className="absolute inset-0 z-20 bg-[#0F172A]/20"
                    onClick={() => setIsThreadSidebarOpen(false)}
                  />
                  <motion.div
                    initial={{ x: '-100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '-100%' }}
                    transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute inset-y-0 left-0 z-30 w-full max-w-[340px] border-r border-[#E2E8F0] bg-white shadow-2xl"
                  >
                    <div className="flex h-full flex-col">
                      <div className="flex items-center justify-between border-b border-[#E2E8F0] px-4 py-3">
                        <div>
                          <div className="text-sm font-semibold text-[#1E293B]">Conversations</div>
                          <div className="text-xs text-[#64748B]">
                            Switch threads without leaving the chat.
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsThreadSidebarOpen(false)}
                          className="rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm font-medium text-[#1E293B] hover:bg-[#F8FAFC]"
                        >
                          Close
                        </button>
                      </div>
                      <div className="min-h-0 flex-1">
                        <AssistantThreadList
                          threads={threads}
                          activeThreadId={activeThreadId}
                          isLoading={isThreadsLoading}
                          error={
                            isThreadsError
                              ? (threadsError?.message ?? 'Failed to load conversations.')
                              : null
                          }
                          onSelectThread={(threadId) => {
                            setActiveThreadId(threadId);
                            setIsThreadSidebarOpen(false);
                          }}
                          onCreateThread={() => void handleCreateThread()}
                          onRetry={() => void refetchThreads()}
                        />
                      </div>
                    </div>
                  </motion.div>
                </>
              ) : null}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <QRHandoffModal
        isOpen={showQrModal}
        handoffUrl={
          createQrTransfer.data
            ? `${window.location.origin}/assistant-handoff/${createQrTransfer.data.token}`
            : null
        }
        expiresAt={createQrTransfer.data?.expires_at ?? null}
        isLoading={createQrTransfer.isPending}
        error={createQrTransfer.isError ? createQrTransfer.error.message : null}
        onClose={() => setShowQrModal(false)}
      />
    </>
  );
}
