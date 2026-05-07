import { createFileRoute } from '@tanstack/react-router';

type LeadsSearch = {
  listId?: string;
  status?: 'all' | 'new' | 'contacted' | 'accepted' | 'replied' | 'qualified' | 'not_interested';
  email?: 'all' | 'has_email' | 'no_email';
  campaign?: 'all' | 'in_campaign' | 'not_in_campaign';
  search?: string;
  importedOnly?: boolean;
  discoveryOnly?: boolean;
};

export const Route = createFileRoute('/dashboard/leads')({
  validateSearch: (search: Record<string, unknown>): LeadsSearch => ({
    listId: typeof search.listId === 'string' ? search.listId : undefined,
    status:
      typeof search.status === 'string' &&
      ['all', 'new', 'contacted', 'accepted', 'replied', 'qualified', 'not_interested'].includes(
        search.status
      )
        ? (search.status as LeadsSearch['status'])
        : undefined,
    email:
      typeof search.email === 'string' && ['all', 'has_email', 'no_email'].includes(search.email)
        ? (search.email as LeadsSearch['email'])
        : undefined,
    campaign:
      typeof search.campaign === 'string' &&
      ['all', 'in_campaign', 'not_in_campaign'].includes(search.campaign)
        ? (search.campaign as LeadsSearch['campaign'])
        : undefined,
    search: typeof search.search === 'string' ? search.search : undefined,
    importedOnly: search.importedOnly === true || search.importedOnly === 'true',
    discoveryOnly: search.discoveryOnly === true || search.discoveryOnly === 'true',
  }),
});
