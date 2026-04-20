import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import { useRedeemAssistantQrTransfer } from '@/lib/hooks/queries';
import { useAuthStore } from '@/lib/auth';
import { useWorkspaceStore } from '@/lib/workspace';

export const Route = createFileRoute('/assistant-handoff/$token')({
  component: AssistantHandoffPage,
});

function AssistantHandoffPage() {
  const { token } = Route.useParams();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const isLoading = useAuthStore((state) => state.isLoading);
  const { setCurrentWorkspaceId } = useWorkspaceStore();
  const redeemTransfer = useRedeemAssistantQrTransfer();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      navigate({
        to: '/login',
        search: { next: `/assistant-handoff/${token}` } as never,
      } as never);
      return;
    }

    redeemTransfer.mutate(
      { token },
      {
        onSuccess: (data) => {
          setCurrentWorkspaceId(data.workspace_id);
          navigate({
            to: '/dashboard/assistant',
            search: { threadId: data.thread_id } as never,
            replace: true,
          } as never);
        },
      }
    );
  }, [isLoading, user, navigate, redeemTransfer, setCurrentWorkspaceId, token]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC] p-6">
      <div className="w-full max-w-md rounded-2xl border border-[#E2E8F0] bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-[#FF6B35] border-t-transparent" />
        <h1 className="mb-2 text-lg font-semibold text-[#1E293B]">Opening assistant thread</h1>
        <p className="text-sm text-[#64748B]">
          {redeemTransfer.isError
            ? redeemTransfer.error.message
            : 'Redeeming your mobile handoff and loading the thread.'}
        </p>
      </div>
    </div>
  );
}
