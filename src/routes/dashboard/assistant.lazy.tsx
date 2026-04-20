import { createLazyFileRoute } from '@tanstack/react-router';
import { AssistantShell } from '@/components/assistant/AssistantShell';

export const Route = createLazyFileRoute('/dashboard/assistant')({
  component: AssistantPage,
});

function AssistantPage() {
  return <AssistantShell />;
}
