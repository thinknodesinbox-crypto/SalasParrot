import { createFileRoute } from '@tanstack/react-router';

type AssistantSearch = {
  threadId?: string;
};

export const Route = createFileRoute('/dashboard/assistant')({
  validateSearch: (search: Record<string, unknown>): AssistantSearch => ({
    threadId: typeof search.threadId === 'string' ? search.threadId : undefined,
  }),
});
