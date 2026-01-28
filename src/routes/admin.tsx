import { useEffect } from 'react';
import { createFileRoute, Outlet, Link, useLocation, useNavigate } from '@tanstack/react-router';
import { useAuthStore } from '@/lib/auth';
import { LayoutDashboard, Users, UserPlus, ChevronLeft } from 'lucide-react';

export const Route = createFileRoute('/admin')({
  component: AdminLayout,
});

function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const isLoading = useAuthStore((state) => state.isLoading);

  // Auth check - redirect if not authenticated or not admin
  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        navigate({ to: '/login' });
      } else if (!user.is_admin) {
        navigate({ to: '/dashboard' });
      }
    }
  }, [user, isLoading, navigate]);

  // Show loading while checking auth
  if (isLoading || !user || !user.is_admin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0A0A0B]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#14B8A6] border-t-transparent" />
      </div>
    );
  }

  const navItems = [
    { href: '/admin', label: 'Overview', icon: LayoutDashboard, exact: true },
    { href: '/admin/users', label: 'Users', icon: Users },
    { href: '/admin/partners', label: 'Partners', icon: UserPlus },
  ];

  const isActive = (href: string, exact?: boolean) => {
    if (exact) {
      return location.pathname === href;
    }
    return location.pathname.startsWith(href);
  };

  return (
    <div className="flex min-h-screen bg-[#0A0A0B]">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-white/10 bg-[#0A0A0B]">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex h-16 items-center justify-between border-b border-white/10 px-4">
            <span className="text-lg font-semibold text-white">Admin Panel</span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href, item.exact);
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    active
                      ? 'bg-[#14B8A6]/10 text-[#14B8A6]'
                      : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="border-t border-white/10 p-4">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#14B8A6]/10 text-[#14B8A6]">
                {user?.name?.[0]?.toUpperCase() || user?.email[0]?.toUpperCase()}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="truncate text-sm font-medium text-white">{user?.name || 'Admin'}</p>
                <p className="truncate text-xs text-gray-400">{user?.email}</p>
              </div>
            </div>
            <Link
              to="/dashboard"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-400 hover:bg-white/5 hover:text-white"
            >
              <ChevronLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 flex-1">
        <Outlet />
      </main>
    </div>
  );
}
