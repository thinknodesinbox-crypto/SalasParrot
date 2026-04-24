import { useSearch } from '@tanstack/react-router';
import { AssistantPanel } from './AssistantPanel';

export function AssistantShell() {
  const { threadId } = useSearch({ from: '/dashboard/assistant' });

  return <AssistantPanel mode="page" initialThreadId={threadId ?? null} />;
}
