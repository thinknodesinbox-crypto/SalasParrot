import { createFileRoute, Outlet } from '@tanstack/react-router';
import { DashboardLayout } from '@/components/dashboard';

export const Route = createFileRoute('/dashboard')({
  component: DashboardPage,
});

function DashboardPage() {
  return (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  );
}
