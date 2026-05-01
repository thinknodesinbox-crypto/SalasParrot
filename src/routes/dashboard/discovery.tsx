import { createFileRoute } from '@tanstack/react-router';

type DiscoverySearchParams = {
  searchId?: string;
  runId?: string;
};

export const Route = createFileRoute('/dashboard/discovery')({
  validateSearch: (search: Record<string, unknown>): DiscoverySearchParams => ({
    searchId: typeof search.searchId === 'string' ? search.searchId : undefined,
    runId: typeof search.runId === 'string' ? search.runId : undefined,
  }),
});
