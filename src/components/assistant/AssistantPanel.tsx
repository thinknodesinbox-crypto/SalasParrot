import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
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
    if (initialThreadId) {
      setActiveThreadId(initialThreadId);
    }
  }, [initialThreadId]);

  useEffect(() => {
    if (!activeThreadId && threads.length > 0) {
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
      setActiveThreadId(threads[0]?.id ?? null);
    }
  }, [threads, activeThreadId, pendingThreadId]);

  useEffect(() => {
    setSelectedThreadId(activeThreadId);
  }, [activeThreadId, setSelectedThreadId]);

  useEffect(() => {
    if (!activeThreadId && threads.length > 0) {
      setIsThreadSidebarOpen(true);
    }
  }, [activeThreadId, threads.length]);

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

  const handleCreateThread = async () => {
    const thread = await createThread.mutateAsync({});
    setPendingThreadId(thread.id);
    setActiveThreadId(thread.id);
    setIsThreadSidebarOpen(false);
  };

  const handleSendMessage = async (content: string) => {
    if (!currentWorkspaceId) return;
    let targetThreadId = activeThreadId;
    if (!targetThreadId) {
      const thread = await createThread.mutateAsync({
        title: starterPrompt || 'Assistant conversation',
      });
      targetThreadId = thread.id;
      setActiveThreadId(thread.id);
    }
    await sendMessage.mutateAsync({ threadId: targetThreadId, content });
  };

  const handleToggleVoice = async () => {
    if (isVoiceActive) {
      await voice.stop();
      return;
    }

    if (!currentWorkspaceId) return;
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

  const panelHeightClass = mode === 'drawer' ? 'h-[min(80vh,760px)]' : 'h-[calc(100vh-12rem)]';
  const wrapperClass =
    mode === 'drawer'
      ? 'w-full overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-2xl'
      : '';
  const voiceHeaderStatus =
    voice.status === 'connecting' ? 'Connecting' : isVoiceActive ? 'Live' : null;
  const isDrawerMode = mode === 'drawer';

  return (
    <>
      <div className={wrapperClass}>
        <div className="space-y-4 md:space-y-6">
          {mode === 'page' ? (
            <div>
              <h1 className="text-xl font-bold text-[#1E293B] md:text-2xl">Assistant</h1>
              <p className="mt-1 text-sm text-[#64748B] md:text-base">
                Ask operational questions, review proposed changes, and execute approved actions
                across campaigns, inbox activity, sender health, and workspace setup.
              </p>
            </div>
          ) : null}

          <div
            className={`relative overflow-hidden rounded-xl border border-[#E2E8F0] bg-white ${
              isDrawerMode
                ? `${panelHeightClass} flex min-h-0 flex-col`
                : `${panelHeightClass} flex min-h-0 flex-col`
            }`}
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
                            {isDrawerMode ? 'Assistant' : activeThread?.title || 'Assistant'}
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
                    {mode === 'drawer' ? (
                      <p className="mt-3 text-sm text-[#64748B]">
                        Continue working while the assistant stays open.
                      </p>
                    ) : null}
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
                  <div
                    className={`flex shrink-0 items-center ${
                      isDrawerMode
                        ? 'gap-1.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-1'
                        : 'gap-3'
                    }`}
                  >
                    <button
                      onClick={() => {
                        setShowQrModal(true);
                        createQrTransfer.reset();
                        createQrTransfer.mutate();
                      }}
                      disabled={!activeThreadId || !currentWorkspaceId}
                      className={`font-medium text-[#1E293B] transition-colors hover:bg-white disabled:cursor-not-allowed disabled:text-[#94A3B8] ${
                        isDrawerMode
                          ? 'rounded-lg px-2.5 py-2 text-xs'
                          : 'rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-sm'
                      }`}
                    >
                      {isDrawerMode ? 'Mobile' : 'Continue on mobile'}
                    </button>
                    {mode === 'drawer' && onExpand ? (
                      <button
                        type="button"
                        onClick={() => void handleExpand()}
                        className="rounded-lg px-2.5 py-2 text-xs font-medium text-[#1E293B] transition-colors hover:bg-white"
                      >
                        Expand
                      </button>
                    ) : null}
                    {mode === 'drawer' && onClose ? (
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
                  onApproveAction={(actionId, note) => approveAction.mutate({ actionId, note })}
                  onRejectAction={(actionId, reason) => rejectAction.mutate({ actionId, reason })}
                  onEditAction={(actionId, payload, message) =>
                    editAction.mutate({ actionId, payload, message })
                  }
                  onExecuteAction={(actionId) => executeAction.mutate({ actionId })}
                  isApprovingAction={approveAction.isPending}
                  isRejectingAction={rejectAction.isPending}
                  isEditingAction={editAction.isPending}
                  isExecutingAction={executeAction.isPending}
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
                    approveAction.mutate({ actionId: latestVoiceReviewAction.id });
                  }
                }}
                onExecuteVoiceAction={() => {
                  if (latestVoiceReviewAction?.status === 'approved') {
                    executeAction.mutate({ actionId: latestVoiceReviewAction.id });
                  }
                }}
                onRejectVoiceAction={() => {
                  if (
                    latestVoiceReviewAction &&
                    latestVoiceReviewAction.status !== 'executed' &&
                    latestVoiceReviewAction.status !== 'rejected'
                  ) {
                    rejectAction.mutate({ actionId: latestVoiceReviewAction.id });
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
