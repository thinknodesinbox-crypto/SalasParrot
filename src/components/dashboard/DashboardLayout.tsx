import { useState, useEffect } from 'react';
import { Link, useRouterState, useNavigate } from '@tanstack/react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import logoImage from '@/assets/images/logo.png';
import { useAuth } from '@/lib/auth';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { useWorkspaceStore, useWorkspaceHydrated } from '@/lib/workspace';
import { useWorkspaces } from '@/lib/hooks/queries';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: 'dashboard' },
  { name: 'Accounts', href: '/dashboard/accounts', icon: 'accounts' },
  { name: 'Leads', href: '/dashboard/leads', icon: 'leads' },
  { name: 'Campaigns', href: '/dashboard/campaigns', icon: 'campaigns' },
  { name: 'Inbox', href: '/dashboard/inbox', icon: 'inbox' },
  { name: 'Analytics', href: '/dashboard/analytics', icon: 'analytics' },
];

const bottomNavigation = [
  { name: 'Settings', href: '/dashboard/settings', icon: 'settings' },
  { name: 'Help', href: '/dashboard/help', icon: 'help' },
];

const adminNavigation = [{ name: 'Admin Panel', href: '/admin', icon: 'admin' }];

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false);
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();

  // Workspace context
  const { currentWorkspace, currentWorkspaceId, setCurrentWorkspace, clearCurrentWorkspace } =
    useWorkspaceStore();
  const { data: workspaces = [] } = useWorkspaces();
  const hasHydrated = useWorkspaceHydrated();

  // Auto-select or fix workspace selection after hydration
  useEffect(() => {
    if (!hasHydrated || workspaces.length === 0) return;

    if (!currentWorkspaceId) {
      // No workspace selected — pick first available
      setCurrentWorkspace(workspaces[0]);
    } else {
      // Validate stored workspace is one the user has access to
      const match = workspaces.find((w) => w.id === currentWorkspaceId);
      if (match) {
        if (!currentWorkspace) setCurrentWorkspace(match);
      } else {
        // Stored workspace not in user's list — reset to first
        setCurrentWorkspace(workspaces[0]);
      }
    }
  }, [hasHydrated, workspaces, currentWorkspaceId, currentWorkspace, setCurrentWorkspace]);

  // Get user initials for avatar
  const userInitials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : user?.email?.[0]?.toUpperCase() || '?';

  const handleLogout = () => {
    // Clear all cached queries
    queryClient.clear();

    // Clear workspace state
    clearCurrentWorkspace();

    // Clear auth state and tokens
    logout();

    // Navigate to login
    navigate({ to: '/login' });
  };

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [currentPath]);

  // Close mobile menu on window resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar - Desktop */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarCollapsed ? 72 : 240 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        className="fixed left-0 top-0 z-40 hidden h-screen flex-col border-r border-[#E2E8F0] bg-white lg:flex"
      >
        {/* Logo */}
        <div className="flex h-16 items-center border-b border-[#E2E8F0] px-4">
          <Link to="/dashboard" className="flex items-center gap-3">
            <img src={logoImage} alt="SalesParrot" className="h-9 w-9 object-contain" />
            <AnimatePresence>
              {!sidebarCollapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  className="overflow-hidden whitespace-nowrap text-lg font-bold text-[#1E293B]"
                >
                  SalesParrot
                </motion.span>
              )}
            </AnimatePresence>
          </Link>
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {navigation.map((item) => {
            const isActive =
              currentPath === item.href ||
              (item.href !== '/dashboard' && currentPath.startsWith(item.href));
            return (
              <NavItem
                key={item.name}
                item={item}
                isActive={isActive}
                collapsed={sidebarCollapsed}
              />
            );
          })}
        </nav>

        {/* Bottom Navigation */}
        <div className="space-y-1 border-t border-[#E2E8F0] px-3 py-4">
          {bottomNavigation.map((item) => {
            const isActive = currentPath === item.href;
            return (
              <NavItem
                key={item.name}
                item={item}
                isActive={isActive}
                collapsed={sidebarCollapsed}
              />
            );
          })}

          {/* Admin Navigation - Only for admins */}
          {user?.is_admin &&
            adminNavigation.map((item) => {
              const isActive = currentPath.startsWith(item.href);
              return (
                <NavItem
                  key={item.name}
                  item={item}
                  isActive={isActive}
                  collapsed={sidebarCollapsed}
                />
              );
            })}

          {/* Collapse Toggle */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[#64748B] transition-all duration-200 hover:bg-[#F8FAFC] hover:text-[#1E293B]"
          >
            <motion.div
              animate={{ rotate: sidebarCollapsed ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <CollapseIcon />
            </motion.div>
            <AnimatePresence>
              {!sidebarCollapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="whitespace-nowrap text-sm font-medium"
                >
                  Collapse
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </motion.aside>

      {/* Sidebar - Mobile */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="fixed left-0 top-0 z-50 flex h-screen w-[280px] flex-col border-r border-[#E2E8F0] bg-white lg:hidden"
          >
            {/* Logo */}
            <div className="flex h-16 items-center justify-between border-b border-[#E2E8F0] px-4">
              <Link to="/dashboard" className="flex items-center gap-3">
                <img src={logoImage} alt="SalesParrot" className="h-9 w-9 object-contain" />
                <span className="text-lg font-bold text-[#1E293B]">SalesParrot</span>
              </Link>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg p-2 hover:bg-[#F8FAFC]"
              >
                <CloseIcon />
              </button>
            </div>

            {/* Main Navigation */}
            <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
              {navigation.map((item) => {
                const isActive =
                  currentPath === item.href ||
                  (item.href !== '/dashboard' && currentPath.startsWith(item.href));
                return (
                  <NavItem key={item.name} item={item} isActive={isActive} collapsed={false} />
                );
              })}
            </nav>

            {/* Bottom Navigation */}
            <div className="space-y-1 border-t border-[#E2E8F0] px-3 py-4">
              {bottomNavigation.map((item) => {
                const isActive = currentPath === item.href;
                return (
                  <NavItem key={item.name} item={item} isActive={isActive} collapsed={false} />
                );
              })}

              {/* Admin Navigation - Only for admins */}
              {user?.is_admin &&
                adminNavigation.map((item) => {
                  const isActive = currentPath.startsWith(item.href);
                  return (
                    <NavItem key={item.name} item={item} isActive={isActive} collapsed={false} />
                  );
                })}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <motion.div
        initial={false}
        animate={{ marginLeft: sidebarCollapsed ? 72 : 240 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        className="flex min-h-screen flex-1 flex-col max-lg:!ml-0"
      >
        {/* Top Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[#E2E8F0] bg-white px-4 md:px-6">
          <div className="flex items-center gap-3">
            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="rounded-lg p-2 hover:bg-[#F8FAFC] lg:hidden"
            >
              <HamburgerIcon />
            </button>
            {/* Mobile Logo */}
            <Link to="/dashboard" className="flex items-center gap-2 lg:hidden">
              <img src={logoImage} alt="SalesParrot" className="h-8 w-8 object-contain" />
            </Link>

            {/* Workspace Switcher */}
            {workspaces.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => setWorkspaceMenuOpen(!workspaceMenuOpen)}
                  className="flex items-center gap-2 rounded-lg border border-[#E2E8F0] bg-white px-3 py-1.5 text-sm font-medium text-[#1E293B] transition-colors hover:bg-[#F8FAFC]"
                >
                  <WorkspaceIcon />
                  <span className="max-w-[150px] truncate">
                    {currentWorkspace?.name || 'Select Workspace'}
                  </span>
                  <ChevronDownIcon />
                </button>

                <AnimatePresence>
                  {workspaceMenuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setWorkspaceMenuOpen(false)}
                      />
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.96 }}
                        transition={{ duration: 0.15 }}
                        className="absolute left-0 top-full z-50 mt-2 w-56 rounded-xl border border-[#E2E8F0] bg-white py-2 shadow-lg"
                      >
                        <div className="border-b border-[#E2E8F0] px-4 py-2">
                          <p className="text-xs font-medium uppercase tracking-wider text-[#64748B]">
                            Workspaces
                          </p>
                        </div>
                        <div className="max-h-64 overflow-y-auto py-1">
                          {workspaces.map((workspace) => (
                            <button
                              key={workspace.id}
                              onClick={() => {
                                if (workspace.id !== currentWorkspaceId) {
                                  setCurrentWorkspace(workspace);
                                  queryClient.removeQueries();
                                }
                                setWorkspaceMenuOpen(false);
                              }}
                              className={`flex w-full items-center gap-3 px-4 py-2 text-sm transition-colors ${
                                currentWorkspaceId === workspace.id
                                  ? 'bg-[#FFF7ED] text-[#FF6B35]'
                                  : 'text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#1E293B]'
                              }`}
                            >
                              <div
                                className={`flex h-6 w-6 items-center justify-center rounded ${
                                  currentWorkspaceId === workspace.id
                                    ? 'bg-[#FF6B35]'
                                    : 'bg-[#E2E8F0]'
                                }`}
                              >
                                <span
                                  className={`text-xs font-semibold ${
                                    currentWorkspaceId === workspace.id
                                      ? 'text-white'
                                      : 'text-[#64748B]'
                                  }`}
                                >
                                  {workspace.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <span className="flex-1 truncate text-left">{workspace.name}</span>
                              {currentWorkspaceId === workspace.id && <CheckIcon />}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            {/* Notifications */}
            <NotificationBell />

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-3 rounded-lg p-1.5 transition-colors hover:bg-[#F8FAFC]"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#FF6B35] to-[#14B8A6]">
                  <span className="text-sm font-semibold text-white">{userInitials}</span>
                </div>
                <ChevronDownIcon />
              </button>

              <AnimatePresence>
                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full z-50 mt-2 w-56 rounded-xl border border-[#E2E8F0] bg-white py-2 shadow-lg"
                    >
                      <div className="border-b border-[#E2E8F0] px-4 py-3">
                        <p className="text-sm font-semibold text-[#1E293B]">
                          {user?.name || 'User'}
                        </p>
                        <p className="text-xs text-[#64748B]">{user?.email}</p>
                      </div>
                      <div className="py-1">
                        <Link
                          to="/dashboard/settings"
                          className="flex items-center gap-3 px-4 py-2 text-sm text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#1E293B]"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <SettingsSmallIcon />
                          Account Settings
                        </Link>
                        <Link
                          to="/dashboard/settings"
                          className="flex items-center gap-3 px-4 py-2 text-sm text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#1E293B]"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <BillingIcon />
                          Billing
                        </Link>
                        {user?.is_admin && (
                          <Link
                            to="/admin"
                            className="flex items-center gap-3 px-4 py-2 text-sm text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#1E293B]"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            <AdminIcon />
                            Admin Panel
                          </Link>
                        )}
                      </div>
                      <div className="border-t border-[#E2E8F0] pt-1">
                        <button
                          onClick={handleLogout}
                          className="flex w-full items-center gap-3 px-4 py-2 text-sm text-[#EF4444] hover:bg-[#FEF2F2]"
                        >
                          <LogoutIcon />
                          Sign out
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </motion.div>
    </div>
  );
}

function NavItem({
  item,
  isActive,
  collapsed,
}: {
  item: { name: string; href: string; icon: string };
  isActive: boolean;
  collapsed: boolean;
}) {
  const icons: Record<string, React.ReactNode> = {
    dashboard: <DashboardIcon />,
    accounts: <AccountsIcon />,
    leads: <LeadsIcon />,
    campaigns: <CampaignsIcon />,
    inbox: <InboxIcon />,
    analytics: <AnalyticsIcon />,
    settings: <SettingsIcon />,
    help: <HelpIcon />,
    admin: <AdminNavIcon />,
  };

  return (
    <Link
      to={item.href}
      className={`
        flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-200
        ${
          isActive
            ? 'bg-[#FFF7ED] font-medium text-[#FF6B35]'
            : 'text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#1E293B]'
        }
      `}
    >
      <div className={isActive ? 'text-[#FF6B35]' : ''}>{icons[item.icon]}</div>
      <AnimatePresence>
        {!collapsed && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="whitespace-nowrap text-sm"
          >
            {item.name}
          </motion.span>
        )}
      </AnimatePresence>
      {isActive && !collapsed && (
        <motion.div
          layoutId="activeIndicator"
          className="ml-auto h-1.5 w-1.5 rounded-full bg-[#FF6B35]"
        />
      )}
    </Link>
  );
}

// Icons
function DashboardIcon() {
  return (
    <svg
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
      />
    </svg>
  );
}

function AccountsIcon() {
  return (
    <svg
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
      />
    </svg>
  );
}

function LeadsIcon() {
  return (
    <svg
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
      />
    </svg>
  );
}

function CampaignsIcon() {
  return (
    <svg
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
      />
    </svg>
  );
}

function InboxIcon() {
  return (
    <svg
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
      />
    </svg>
  );
}

function AnalyticsIcon() {
  return (
    <svg
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
      />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function HelpIcon() {
  return (
    <svg
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"
      />
    </svg>
  );
}

function CollapseIcon() {
  return (
    <svg
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M18.75 19.5l-7.5-7.5 7.5-7.5m-6 15L5.25 12l7.5-7.5"
      />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg
      className="h-4 w-4 text-[#64748B]"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
  );
}

function SettingsSmallIcon() {
  return (
    <svg
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function BillingIcon() {
  return (
    <svg
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z"
      />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"
      />
    </svg>
  );
}

function HamburgerIcon() {
  return (
    <svg
      className="h-5 w-5 text-[#64748B]"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      className="h-5 w-5 text-[#64748B]"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function WorkspaceIcon() {
  return (
    <svg
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      className="h-4 w-4 text-[#FF6B35]"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
}

function AdminIcon() {
  return (
    <svg
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
      />
    </svg>
  );
}

function AdminNavIcon() {
  return (
    <svg
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
      />
    </svg>
  );
}
