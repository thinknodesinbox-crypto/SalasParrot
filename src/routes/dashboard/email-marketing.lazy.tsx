import { createLazyFileRoute } from '@tanstack/react-router';

import { EmailMarketingShell } from '@/components/email-marketing/EmailMarketingShell';

export const Route = createLazyFileRoute('/dashboard/email-marketing')({
  component: EmailMarketingRoute,
});

function EmailMarketingRoute() {
  return <EmailMarketingShell />;
}
