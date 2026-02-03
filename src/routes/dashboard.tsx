import { useEffect } from 'react';
import { createFileRoute, Outlet, useNavigate } from '@tanstack/react-router';
import { DashboardLayout } from '@/components/dashboard';
import { useAuthStore } from '@/lib/auth';

export const Route = createFileRoute('/dashboard')({
  component: DashboardPage,
});

function DashboardPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const isLoading = useAuthStore((state) => state.isLoading);

  // Check if user has valid access (admin, active subscription, trial, partner access, or invited to a workspace)
  const hasValidAccess =
    user?.is_admin ||
    user?.subscription_status === 'active' ||
    user?.subscription_status === 'trialing' ||
    user?.partner_access?.is_active ||
    user?.has_invited_workspace_access;

  // Redirect users without valid access to onboarding
  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        navigate({ to: '/login' });
      } else if (!hasValidAccess) {
        navigate({ to: '/onboarding' });
      }
    }
  }, [user, isLoading, hasValidAccess, navigate]);

  // Show loading while checking auth
  if (isLoading || !user || !hasValidAccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0A0A0B]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#14B8A6] border-t-transparent" />
      </div>
    );
  }

  return (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  );
}
