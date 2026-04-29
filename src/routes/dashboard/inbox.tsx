import { createFileRoute } from '@tanstack/react-router';

type InboxSearch = {
  conversationId?: string;
  senderId?: string;
  campaignId?: string;
};

export const Route = createFileRoute('/dashboard/inbox')({
  validateSearch: (search: Record<string, unknown>): InboxSearch => ({
    conversationId: search.conversationId as string | undefined,
    senderId: search.senderId as string | undefined,
    campaignId: search.campaignId as string | undefined,
  }),
});
