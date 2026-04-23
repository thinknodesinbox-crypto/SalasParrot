import { useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSearch } from '@tanstack/react-router';
import { queryKeys } from '@/lib/queryClient';
import { useCurrentWorkspace } from '@/lib/workspace';
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

export function AssistantShell() {
  const { threadId: handoffThreadId } = useSearch({ from: '/dashboard/assistant' });
  const queryClient = useQueryClient();
  const { currentWorkspaceId } = useCurrentWorkspace();
  const { data: workspace = null } = useWorkspace(currentWorkspaceId || '');
  const { data: threads = [], isLoading: isThreadsLoading } =
    useAssistantThreads(currentWorkspaceId);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const { data: messages = [], isLoading: isMessagesLoading } = useAssistantMessages(
    currentWorkspaceId,
    activeThreadId
  );
  const { data: actions = [] } = useAssistantActions(currentWorkspaceId, activeThreadId);
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

  useEffect(() => {
    if (!activeThreadId && threads.length > 0) {
      setActiveThreadId(threads[0].id);
    }
    if (activeThreadId && threads.every((thread) => thread.id !== activeThreadId)) {
      setActiveThreadId(threads[0]?.id ?? null);
    }
  }, [threads, activeThreadId]);

  useEffect(() => {
    if (handoffThreadId) {
      setActiveThreadId(handoffThreadId);
    }
  }, [handoffThreadId]);

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

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h1 className="text-xl font-bold text-[#1E293B] md:text-2xl">Assistant</h1>
        <p className="mt-1 text-sm text-[#64748B] md:text-base">
          Ask read-only questions about campaigns, inbox activity, sender health, and workspace
          setup.
        </p>
      </div>

      <div className="grid h-[calc(100vh-12rem)] grid-cols-1 overflow-hidden rounded-xl border border-[#E2E8F0] bg-white xl:grid-cols-[280px_minmax(0,1fr)]">
        <AssistantThreadList
          threads={threads}
          activeThreadId={activeThreadId}
          isLoading={isThreadsLoading}
          onSelectThread={setActiveThreadId}
          onCreateThread={() => void handleCreateThread()}
        />

        <div className="flex min-h-0 flex-col bg-[#F8FAFC]">
          <div className="border-b border-[#E2E8F0] bg-white px-6 py-4">
            <div className="flex items-center justify-end gap-4">
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
              </div>
            </div>
          </div>
          <div className="min-h-0 flex-1">
            <AssistantMessageList
              messages={messages}
              actionsById={actionsById}
              isLoading={isMessagesLoading}
              draftUserMessage={isVoiceActive ? voice.liveUserTranscript : ''}
              draftAssistantMessage={isVoiceActive ? voice.liveAssistantTranscript : ''}
              error={voice.error}
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
            onToggleVoice={() => void handleToggleVoice()}
            onSend={handleSendMessage}
          />
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
    </div>
  );
}
