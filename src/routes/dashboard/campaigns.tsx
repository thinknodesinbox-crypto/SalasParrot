import { createFileRoute } from '@tanstack/react-router';

type CampaignsSearch = {
  createWithList?: string;
  campaignId?: string;
};

export const Route = createFileRoute('/dashboard/campaigns')({
  validateSearch: (search: Record<string, unknown>): CampaignsSearch => {
    return {
      createWithList: search.createWithList as string | undefined,
      campaignId: search.campaignId as string | undefined,
    };
  },
});
