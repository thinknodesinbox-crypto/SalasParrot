import { useEffect, useState } from 'react';
import { createFileRoute, Outlet, useNavigate } from '@tanstack/react-router';
import { DashboardLayout } from '@/components/dashboard';
import { useAuthStore } from '@/lib/auth';
import { api } from '@/lib/api';

export const Route = createFileRoute('/dashboard')({
  component: DashboardPage,
});

function DashboardPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const isLoading = useAuthStore((state) => state.isLoading);
  const fetchUser = useAuthStore((state) => state.fetchUser);
  const [isSyncing, setIsSyncing] = useState(false);

  // Sync subscription status after Stripe checkout redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('billing') === 'success') {
      setIsSyncing(true);
      // Remove query param to avoid re-syncing on refresh
      window.history.replaceState({}, '', window.location.pathname);
      api
        .post('/billing/sync')
        .then(() => fetchUser())
        .finally(() => setIsSyncing(false));
    }
  }, [fetchUser]);

  // Check if user has valid access (admin, active subscription, partner access, or invited to a workspace)
  const hasValidAccess =
    user?.is_admin ||
    user?.subscription_status === 'active' ||
    user?.partner_access?.is_active ||
    user?.has_invited_workspace_access;

  // Redirect users without valid access to onboarding
  useEffect(() => {
    if (!isLoading && !isSyncing) {
      if (!user) {
        navigate({ to: '/login' } as never);
      } else if (!hasValidAccess) {
        navigate({ to: '/onboarding' } as never);
      }
    }
  }, [user, isLoading, isSyncing, hasValidAccess, navigate]);

  // Show loading while checking auth or syncing subscription
  if (isLoading || isSyncing || !user || !hasValidAccess) {
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
