import { useEffect, useMemo, useState } from 'react';
import { useSearch } from '@tanstack/react-router';
import { useCurrentWorkspace } from '@/lib/workspace';
import { useAssistantVoice } from '@/lib/hooks/useAssistantVoice';
import {
  useAssistantMessages,
  useCreateAssistantQrTransfer,
  useAssistantThreads,
  useCreateAssistantThread,
  useSendAssistantMessage,
  useWorkspace,
} from '@/lib/hooks/queries';
import { AssistantComposer } from './AssistantComposer';
import { AssistantContextPanel } from './AssistantContextPanel';
import { AssistantMessageList } from './AssistantMessageList';
import { QRHandoffModal } from './QRHandoffModal';
import { AssistantThreadList } from './AssistantThreadList';
import { VoiceSessionPanel } from './VoiceSessionPanel';

export function AssistantShell() {
  const { threadId: handoffThreadId } = useSearch({ from: '/dashboard/assistant' });
  const { currentWorkspaceId } = useCurrentWorkspace();
  const { data: workspace = null } = useWorkspace(currentWorkspaceId || '');
  const { data: threads = [], isLoading: isThreadsLoading } =
    useAssistantThreads(currentWorkspaceId);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const { data: messages = [], isLoading: isMessagesLoading } = useAssistantMessages(
    currentWorkspaceId,
    activeThreadId
  );
  const createThread = useCreateAssistantThread(currentWorkspaceId);
  const sendMessage = useSendAssistantMessage(currentWorkspaceId);
  const createQrTransfer = useCreateAssistantQrTransfer(currentWorkspaceId, activeThreadId);
  const [voiceMode, setVoiceMode] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const voice = useAssistantVoice({
    workspaceId: currentWorkspaceId,
    threadId: activeThreadId,
  });

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

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h1 className="text-xl font-bold text-[#1E293B] md:text-2xl">Assistant</h1>
        <p className="mt-1 text-sm text-[#64748B] md:text-base">
          Ask read-only questions about campaigns, inbox activity, sender health, and workspace
          setup.
        </p>
      </div>

      <div className="grid h-[calc(100vh-12rem)] grid-cols-1 overflow-hidden rounded-xl border border-[#E2E8F0] bg-white xl:grid-cols-[280px_minmax(0,1fr)_320px]">
        <AssistantThreadList
          threads={threads}
          activeThreadId={activeThreadId}
          isLoading={isThreadsLoading}
          onSelectThread={setActiveThreadId}
          onCreateThread={() => void handleCreateThread()}
        />

        <div className="flex min-h-0 flex-col bg-[#F8FAFC]">
          <div className="border-b border-[#E2E8F0] bg-white px-6 py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="text-sm font-medium text-[#1E293B]">
                {threads.find((thread) => thread.id === activeThreadId)?.title ||
                  'New conversation'}
              </div>
              <button
                onClick={() => {
                  if (!voiceMode) {
                    setVoiceMode(true);
                    void voice.start();
                  } else {
                    void voice.stop();
                    setVoiceMode(false);
                  }
                }}
                disabled={!activeThreadId || !currentWorkspaceId || voice.status === 'connecting'}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  voiceMode
                    ? 'bg-[#1E293B] text-white hover:bg-[#0F172A]'
                    : 'border border-[#E2E8F0] bg-white text-[#1E293B] hover:bg-[#F8FAFC]'
                } disabled:cursor-not-allowed disabled:bg-[#E2E8F0] disabled:text-[#94A3B8]`}
              >
                {voice.status === 'connecting'
                  ? 'Connecting...'
                  : voiceMode
                    ? 'Stop Voice'
                    : 'Start Voice'}
              </button>
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
          {voiceMode ? (
            <VoiceSessionPanel
              status={voice.status}
              error={voice.error}
              liveTranscript={voice.liveTranscript}
            />
          ) : null}
          <div className="min-h-0 flex-1 overflow-y-auto">
            <AssistantMessageList messages={messages} isLoading={isMessagesLoading} />
          </div>
          <AssistantComposer
            disabled={!currentWorkspaceId}
            isSending={createThread.isPending || sendMessage.isPending}
            onSend={handleSendMessage}
          />
        </div>

        <div className="hidden xl:block">
          <AssistantContextPanel
            workspace={workspace}
            onUsePrompt={(prompt) => void handleSendMessage(prompt)}
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
