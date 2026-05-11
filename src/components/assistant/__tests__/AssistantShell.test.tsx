import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const invalidateQueries = vi.fn();
const createThreadMutateAsync = vi.fn();
const sendMessageMutateAsync = vi.fn();
const approveActionMutateAsync = vi.fn();
const rejectActionMutateAsync = vi.fn();
const editActionMutateAsync = vi.fn();
const executeActionMutateAsync = vi.fn();
const createQrTransferMutate = vi.fn();
const createQrTransferReset = vi.fn();

const useSearchMock = vi.fn();
const useCurrentWorkspaceMock = vi.fn();
const useWorkspaceMock = vi.fn();
const useAssistantThreadsMock = vi.fn();
const useAssistantMessagesMock = vi.fn();
const useAssistantActionsMock = vi.fn();
const useCreateAssistantThreadMock = vi.fn();
const useSendAssistantMessageMock = vi.fn();
const useApproveAssistantActionMock = vi.fn();
const useRejectAssistantActionMock = vi.fn();
const useEditAssistantActionMock = vi.fn();
const useExecuteAssistantActionMock = vi.fn();
const useCreateAssistantQrTransferMock = vi.fn();
const useAssistantVoiceMock = vi.fn();

vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-query')>();
  return {
    ...actual,
    useQueryClient: () => ({ invalidateQueries }),
  };
});

vi.mock('@tanstack/react-router', () => ({
  useSearch: (...args: unknown[]) => useSearchMock(...args),
}));

vi.mock('@/lib/workspace', () => ({
  useCurrentWorkspace: () => useCurrentWorkspaceMock(),
}));

vi.mock('@/lib/hooks/useAssistantVoice', () => ({
  useAssistantVoice: (...args: unknown[]) => useAssistantVoiceMock(...args),
}));

vi.mock('@/lib/hooks/queries', () => ({
  useWorkspace: (...args: unknown[]) => useWorkspaceMock(...args),
  useAssistantThreads: (...args: unknown[]) => useAssistantThreadsMock(...args),
  useAssistantMessages: (...args: unknown[]) => useAssistantMessagesMock(...args),
  useAssistantActions: (...args: unknown[]) => useAssistantActionsMock(...args),
  useCreateAssistantThread: (...args: unknown[]) => useCreateAssistantThreadMock(...args),
  useSendAssistantMessage: (...args: unknown[]) => useSendAssistantMessageMock(...args),
  useApproveAssistantAction: (...args: unknown[]) => useApproveAssistantActionMock(...args),
  useRejectAssistantAction: (...args: unknown[]) => useRejectAssistantActionMock(...args),
  useEditAssistantAction: (...args: unknown[]) => useEditAssistantActionMock(...args),
  useExecuteAssistantAction: (...args: unknown[]) => useExecuteAssistantActionMock(...args),
  useCreateAssistantQrTransfer: (...args: unknown[]) => useCreateAssistantQrTransferMock(...args),
}));

vi.mock('../AssistantThreadList', () => ({
  AssistantThreadList: ({
    activeThreadId,
    threads,
    onCreateThread,
    onSelectThread,
  }: {
    activeThreadId: string | null;
    threads: Array<{ id: string; title: string }>;
    onCreateThread: () => void;
    onSelectThread: (id: string) => void;
  }) => (
    <div>
      <div data-testid="thread-state">{activeThreadId ?? 'none'}</div>
      <button onClick={onCreateThread}>Create thread</button>
      {threads.map((thread) => (
        <button key={thread.id} onClick={() => onSelectThread(thread.id)}>
          {thread.title}
        </button>
      ))}
    </div>
  ),
}));

vi.mock('../AssistantComposer', () => ({
  AssistantComposer: ({ onSend }: { onSend: (content: string) => Promise<void> | void }) => (
    <button onClick={() => void onSend('pause campaign Apollo Enterprise')}>Send message</button>
  ),
}));

vi.mock('../AssistantMessageList', () => ({
  AssistantMessageList: ({
    messages,
    actionsById,
    onUseSuggestedPrompt,
    onApproveAction,
    onExecuteAction,
  }: {
    messages: Array<{ id: string; content: string }>;
    actionsById: Record<string, { id: string; preview?: { title?: string } }>;
    onUseSuggestedPrompt?: (prompt: string) => void;
    onApproveAction?: (actionId: string, note?: string) => void;
    onExecuteAction?: (actionId: string) => void;
  }) => (
    <div>
      <div data-testid="message-count">{messages.length}</div>
      <div data-testid="action-count">{Object.keys(actionsById).length}</div>
      <div data-testid="action-title">
        {Object.values(actionsById)[0]?.preview?.title ?? 'none'}
      </div>
      <button onClick={() => onUseSuggestedPrompt?.('Which campaigns need attention?')}>
        Suggested prompt
      </button>
      <button onClick={() => onApproveAction?.('action-1', 'Looks good.')}>Approve action</button>
      <button onClick={() => onExecuteAction?.('action-1')}>Execute action</button>
    </div>
  ),
}));

vi.mock('../QRHandoffModal', () => ({
  QRHandoffModal: () => null,
}));

import { AssistantShell } from '../AssistantShell';

describe('AssistantShell', () => {
  beforeEach(() => {
    invalidateQueries.mockReset();
    createThreadMutateAsync.mockReset();
    sendMessageMutateAsync.mockReset();
    approveActionMutateAsync.mockReset();
    rejectActionMutateAsync.mockReset();
    editActionMutateAsync.mockReset();
    executeActionMutateAsync.mockReset();
    createQrTransferMutate.mockReset();
    createQrTransferReset.mockReset();

    useSearchMock.mockReturnValue({ threadId: undefined });
    useCurrentWorkspaceMock.mockReturnValue({ currentWorkspaceId: 'workspace-1' });
    useWorkspaceMock.mockReturnValue({
      data: { id: 'workspace-1', name: 'Acme' },
    });
    useAssistantThreadsMock.mockReturnValue({
      data: [{ id: 'thread-1', title: 'Existing thread' }],
      isLoading: false,
    });
    useAssistantMessagesMock.mockReturnValue({
      data: [
        {
          id: 'message-1',
          role: 'assistant',
          content: 'I prepared an action.',
          metadata: { action_id: 'action-1' },
        },
      ],
      isLoading: false,
    });
    useAssistantActionsMock.mockReturnValue({
      data: [
        {
          id: 'action-1',
          preview: { title: 'Pause campaign' },
        },
      ],
    });
    useCreateAssistantThreadMock.mockReturnValue({
      mutateAsync: createThreadMutateAsync,
      isPending: false,
    });
    useSendAssistantMessageMock.mockReturnValue({
      mutateAsync: sendMessageMutateAsync,
      isPending: false,
    });
    useApproveAssistantActionMock.mockReturnValue({
      mutateAsync: approveActionMutateAsync,
      isPending: false,
    });
    useRejectAssistantActionMock.mockReturnValue({
      mutateAsync: rejectActionMutateAsync,
      isPending: false,
    });
    useEditAssistantActionMock.mockReturnValue({
      mutateAsync: editActionMutateAsync,
      isPending: false,
    });
    useExecuteAssistantActionMock.mockReturnValue({
      mutateAsync: executeActionMutateAsync,
      isPending: false,
    });
    useCreateAssistantQrTransferMock.mockReturnValue({
      mutate: createQrTransferMutate,
      reset: createQrTransferReset,
      data: null,
      isPending: false,
      isError: false,
      error: null,
    });
    useAssistantVoiceMock.mockReturnValue({
      status: 'idle',
      error: null,
      liveUserTranscript: '',
      liveAssistantTranscript: '',
      start: vi.fn(),
      stop: vi.fn(),
    });
  });

  it('wires assistant actions into the message list and approval/execute mutations', async () => {
    render(<AssistantShell />);

    expect(screen.getByTestId('message-count')).toHaveTextContent('1');
    expect(screen.getByTestId('action-count')).toHaveTextContent('1');
    expect(screen.getByTestId('action-title')).toHaveTextContent('Pause campaign');

    fireEvent.click(screen.getByText('Approve action'));
    await waitFor(() => {
      expect(approveActionMutateAsync).toHaveBeenCalledWith({
        actionId: 'action-1',
        note: 'Looks good.',
      });
    });

    fireEvent.click(screen.getByText('Execute action'));
    await waitFor(() => {
      expect(executeActionMutateAsync).toHaveBeenCalledWith({ actionId: 'action-1' });
    });
  });

  it('creates a thread before sending when no active thread exists', async () => {
    useAssistantThreadsMock.mockReturnValueOnce({
      data: [],
      isLoading: false,
    });
    createThreadMutateAsync.mockResolvedValue({ id: 'thread-new' });
    sendMessageMutateAsync.mockResolvedValue({});

    render(<AssistantShell />);

    fireEvent.click(screen.getByText('Send message'));

    await waitFor(() => {
      expect(createThreadMutateAsync).toHaveBeenCalledWith({
        title: 'pause campaign Apollo Enterprise',
      });
    });
    await waitFor(() => {
      expect(sendMessageMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          threadId: 'thread-new',
          content: 'pause campaign Apollo Enterprise',
        })
      );
    });
  });

  it('keeps a suggested prompt on the newly created thread while history refreshes', async () => {
    createThreadMutateAsync.mockResolvedValue({ id: 'thread-new' });
    sendMessageMutateAsync.mockResolvedValue({});

    render(<AssistantShell />);

    fireEvent.click(screen.getByText('Suggested prompt'));

    await waitFor(() => {
      expect(sendMessageMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          threadId: 'thread-new',
          content: 'Which campaigns need attention?',
        })
      );
    });

    await new Promise((resolve) => window.setTimeout(resolve, 0));

    const latestMessagesCall =
      useAssistantMessagesMock.mock.calls[useAssistantMessagesMock.mock.calls.length - 1];
    expect(latestMessagesCall?.[1]).toBe('thread-new');
  });
});
