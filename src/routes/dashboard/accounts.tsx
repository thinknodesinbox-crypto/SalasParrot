import { createFileRoute } from '@tanstack/react-router';

type AccountsSearch = {
  tab?: 'linkedin' | 'email' | 'calendar';
  accountId?: string;
};

export const Route = createFileRoute('/dashboard/accounts')({
  validateSearch: (search: Record<string, unknown>): AccountsSearch => ({
    tab: search.tab as AccountsSearch['tab'],
    accountId: search.accountId as string | undefined,
  }),
});
