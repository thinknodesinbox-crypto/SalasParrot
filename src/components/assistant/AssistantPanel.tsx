import { useEffect, useMemo, useState } from 'react';
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
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.assistant.threads(currentWorkspaceId) });
    },
  });
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

  const starterPrompt = useMemo(() => {
    if (!workspace) return '';
    return `What needs attention in ${workspace.name} today?`;
  }, [workspace]);

  const actionsById = useMemo(
    () => Object.fromEntries(actions.map((action) => [action.id, action])),
    [actions]
  );

  const handleCreateThread = async () => {
    const thread = await createThread.mutateAsync({});
    setPendingThreadId(thread.id);
    setActiveThreadId(thread.id);
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
            className={`grid ${panelHeightClass} grid-cols-1 overflow-hidden rounded-xl border border-[#E2E8F0] bg-white xl:grid-cols-[280px_minmax(0,1fr)]`}
          >
            <AssistantThreadList
              threads={threads}
              activeThreadId={activeThreadId}
              isLoading={isThreadsLoading}
              error={
                isThreadsError ? (threadsError?.message ?? 'Failed to load conversations.') : null
              }
              onSelectThread={setActiveThreadId}
              onCreateThread={() => void handleCreateThread()}
              onRetry={() => void refetchThreads()}
            />

            <div className="flex min-h-0 flex-col bg-[#F8FAFC]">
              <div className="border-b border-[#E2E8F0] bg-white px-4 py-4 md:px-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    {mode === 'drawer' ? (
                      <>
                        <div className="flex items-center gap-3">
                          <h2 className="text-base font-semibold text-[#1E293B]">Assistant</h2>
                          {voiceHeaderStatus ? (
                            <span className="inline-flex items-center gap-2 rounded-full bg-[#FFF7ED] px-2.5 py-1 text-xs font-semibold text-[#C2410C]">
                              <span
                                className={`h-2 w-2 rounded-full ${voice.status === 'connecting' ? 'animate-pulse bg-[#F59E0B]' : 'animate-pulse bg-[#FF6B35]'}`}
                              />
                              Voice {voiceHeaderStatus}
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-1 text-sm text-[#64748B]">
                          Continue working while the assistant stays open.
                        </p>
                      </>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        setShowQrModal(true);
                        createQrTransfer.reset();
                        createQrTransfer.mutate();
                      }}
                      disabled={!activeThreadId || !currentWorkspaceId}
                      className="rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-sm font-medium text-[#1E293B] hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:bg-[#E2E8F0] disabled:text-[#94A3B8]"
                    >
                      Continue on mobile
                    </button>
                    {mode === 'drawer' && onExpand ? (
                      <button
                        type="button"
                        onClick={() => void handleExpand()}
                        className="rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-sm font-medium text-[#1E293B] hover:bg-[#F8FAFC]"
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
                        className="rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-sm font-medium text-[#1E293B] hover:bg-[#F8FAFC]"
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
                voiceUnavailableReason={
                  !voice.capability.supported ? voice.capability.reason : null
                }
                onToggleVoice={() => void handleToggleVoice()}
                onSend={handleSendMessage}
              />
            </div>
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
