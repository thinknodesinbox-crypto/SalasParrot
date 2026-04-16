import { createFileRoute } from '@tanstack/react-router';

type CampaignsSearch = {
  createWithList?: string;
};

export const Route = createFileRoute('/dashboard/campaigns')({
  validateSearch: (search: Record<string, unknown>): CampaignsSearch => {
    return {
      createWithList: search.createWithList as string | undefined,
    };
  },
});
