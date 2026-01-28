import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth';
import {
  useWorkspaces,
  useCreateWorkspace,
  useUpdateWorkspace,
  useWorkspaceMembers,
  useBillingOverview,
  useCreatePortalSession,
  useEmailAccounts,
  useLinkedInAccounts,
  useUpdateLinkedInAccount,
  useChangePassword,
  useConnectLinkedInWithCredentials,
  useConnectLinkedInWithCookie,
  useSolveLinkedInCheckpoint,
  usePollLinkedInStatus,
  useConnectEmailIMAP,
} from '@/lib/hooks/queries';
import {
  useWorkspaceInvitations,
  useCreateInvitation,
  useRevokeInvitation,
  useResendInvitation,
} from '@/lib/hooks/queries/useInvitations';
import type { CheckpointType, Workspace, LinkedInAccount } from '@/lib/types';

export const Route = createFileRoute('/dashboard/settings')({
  component: SettingsPage,
});

type SettingsTab =
  | 'profile'
  | 'workspaces'
  | 'members'
  | 'notifications'
  | 'billing'
  | 'integrations';

function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [mobileTabsOpen, setMobileTabsOpen] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate({ to: '/login' });
  };

  const tabs: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
    { id: 'profile', label: 'Profile Settings', icon: <SettingsIcon /> },
    { id: 'workspaces', label: 'Workspaces', icon: <WorkspaceIcon /> },
    { id: 'members', label: 'Members', icon: <MembersIcon /> },
    { id: 'notifications', label: 'Notifications', icon: <NotificationIcon /> },
    { id: 'billing', label: 'Billing', icon: <BillingIcon /> },
    { id: 'integrations', label: 'Integrations', icon: <IntegrationIcon /> },
  ];

  const activeTabLabel = tabs.find((t) => t.id === activeTab)?.label || 'Settings';

  return (
    <div className="flex min-h-[calc(100vh-7rem)] flex-col gap-0 lg:flex-row">
      {/* Mobile Tab Selector */}
      <div className="border-b border-[#E2E8F0] bg-white p-4 lg:hidden">
        <button
          onClick={() => setMobileTabsOpen(!mobileTabsOpen)}
          className="flex w-full items-center justify-between rounded-lg bg-[#F8FAFC] px-4 py-3"
        >
          <span className="font-medium text-[#1E293B]">{activeTabLabel}</span>
          <motion.div animate={{ rotate: mobileTabsOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDownIcon />
          </motion.div>
        </button>
        <AnimatePresence>
          {mobileTabsOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <ul className="mt-2 space-y-1">
                {tabs.map((tab) => (
                  <li key={tab.id}>
                    <button
                      onClick={() => {
                        setActiveTab(tab.id);
                        setMobileTabsOpen(false);
                      }}
                      className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all ${
                        activeTab === tab.id
                          ? 'bg-[#EFF6FF] text-[#3B82F6]'
                          : 'text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#1E293B]'
                      }`}
                    >
                      <span className={activeTab === tab.id ? 'text-[#3B82F6]' : 'text-[#94A3B8]'}>
                        {tab.icon}
                      </span>
                      {tab.label}
                    </button>
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Desktop Sidebar Navigation */}
      <div className="hidden w-64 flex-shrink-0 flex-col border-r border-[#E2E8F0] bg-white lg:flex">
        <div className="border-b border-[#E2E8F0] p-6">
          <h1 className="text-xl font-bold text-[#1E293B]">Settings</h1>
        </div>

        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            {tabs.map((tab) => (
              <li key={tab.id}>
                <button
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? '-ml-1 border-l-4 border-[#3B82F6] bg-[#EFF6FF] pl-5 text-[#3B82F6]'
                      : 'text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#1E293B]'
                  }`}
                >
                  <span className={activeTab === tab.id ? 'text-[#3B82F6]' : 'text-[#94A3B8]'}>
                    {tab.icon}
                  </span>
                  {tab.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Logout Button */}
        <div className="border-t border-[#E2E8F0] p-4">
          <button
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#E2E8F0] px-4 py-2.5 text-sm font-medium text-[#64748B] transition-colors hover:bg-[#F8FAFC] hover:text-[#1E293B]"
          >
            <LogoutIcon />
            Log out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto bg-[#F8FAFC]">
        <div className="max-w-4xl p-4 md:p-6 lg:p-8">
          <AnimatePresence mode="wait">
            {activeTab === 'profile' && <ProfileSettings key="profile" />}
            {activeTab === 'workspaces' && <WorkspaceSettings key="workspaces" />}
            {activeTab === 'members' && <MembersSettings key="members" />}
            {activeTab === 'notifications' && <NotificationSettings key="notifications" />}
            {activeTab === 'billing' && <BillingSettings key="billing" />}
            {activeTab === 'integrations' && <IntegrationSettings key="integrations" />}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// ==================== PROFILE SETTINGS ====================
function ProfileSettings() {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  const changePassword = useChangePassword();

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      return;
    }

    try {
      await changePassword.mutateAsync({
        current_password: currentPassword,
        new_password: newPassword,
      });
      setPasswordSuccess('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      setPasswordError(error instanceof Error ? error.message : 'Failed to change password');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-xl font-bold text-[#1E293B]">Profile Settings</h2>
      </div>

      {/* User Info */}
      <div className="rounded-xl border border-[#E2E8F0] bg-white p-6">
        <h3 className="mb-4 font-semibold text-[#1E293B]">Account Information</h3>
        <div className="max-w-md space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-[#64748B]">Email</label>
            <p className="text-[#1E293B]">{user?.email || 'Not available'}</p>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[#64748B]">Name</label>
            <p className="text-[#1E293B]">{user?.name || 'Not set'}</p>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[#64748B]">Plan</label>
            <span className="inline-flex items-center rounded-full bg-[#EFF6FF] px-2.5 py-1 text-sm font-medium text-[#3B82F6]">
              {user?.plan || 'Free'}
            </span>
          </div>
        </div>
      </div>

      {/* Password Change Form */}
      <div className="rounded-xl border border-[#E2E8F0] bg-white p-6">
        <h3 className="mb-4 font-semibold text-[#1E293B]">Change Password</h3>
        <form onSubmit={handlePasswordChange} className="max-w-md space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-[#1E293B]">
              Current Password
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              className="w-full rounded-lg border border-[#E2E8F0] px-4 py-2.5 focus:border-[#3B82F6] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/20"
              required
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-[#1E293B]">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              className="w-full rounded-lg border border-[#E2E8F0] px-4 py-2.5 focus:border-[#3B82F6] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/20"
              required
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-[#1E293B]">
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              className="w-full rounded-lg border border-[#E2E8F0] px-4 py-2.5 focus:border-[#3B82F6] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/20"
              required
            />
          </div>

          {passwordError && (
            <div className="rounded-lg border border-[#EF4444]/20 bg-[#FEF2F2] p-3">
              <p className="text-sm text-[#EF4444]">{passwordError}</p>
            </div>
          )}

          {passwordSuccess && (
            <div className="rounded-lg border border-[#22C55E]/20 bg-[#F0FDF4] p-3">
              <p className="text-sm text-[#22C55E]">{passwordSuccess}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={changePassword.isPending}
            className="rounded-lg bg-[#3B82F6] px-6 py-2.5 font-medium text-white transition-colors hover:bg-[#2563EB] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {changePassword.isPending ? 'Changing...' : 'Change Password'}
          </button>
        </form>
      </div>
    </motion.div>
  );
}

// ==================== WORKSPACE SETTINGS ====================
function WorkspaceSettings() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingWorkspace, setEditingWorkspace] = useState<Workspace | null>(null);

  // Fetch workspaces from API
  const { data: workspacesData = [], isLoading, error, refetch } = useWorkspaces();

  // Filter workspaces by search query
  const workspaces = workspacesData.filter((w) =>
    w.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // TODO: Get from billing/plan data when available
  const totalSeats = 10;
  const usedSeats = workspacesData.length;
  const availableSeats = Math.max(0, totalSeats - usedSeats);

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-center py-12"
      >
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#3B82F6] border-t-transparent" />
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="py-12 text-center"
      >
        <p className="text-[#EF4444]">Failed to load workspaces</p>
        <button onClick={() => refetch()} className="mt-2 text-[#3B82F6] hover:underline">
          Retry
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-xl font-bold text-[#1E293B]">Workspaces</h2>
      </div>

      {/* Shared Resources Card */}
      <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 md:p-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h3 className="font-semibold text-[#1E293B]">Shared resources</h3>
            <p className="mt-1 max-w-lg text-sm text-[#64748B]">
              The pool of seats is shared between all workspaces. You can limit the number of seats
              for a specific workspace in the workspace settings.
            </p>
          </div>
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <div className="sm:text-right">
              <div className="flex items-center gap-2">
                <CheckCircleIcon className="h-5 w-5 text-[#22C55E]" />
                <span className="font-semibold text-[#1E293B]">Used seats</span>
                <span className="text-[#64748B]">
                  {usedSeats} / {totalSeats}
                </span>
              </div>
              <span className="mt-2 inline-block rounded-full bg-[#F0FDF4] px-3 py-1 text-sm font-medium text-[#22C55E]">
                {availableSeats} available seats
              </span>
            </div>
            <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#3B82F6] px-4 py-2.5 font-medium text-white transition-colors hover:bg-[#2563EB] sm:w-auto">
              <PlusIcon />
              Buy more seats
            </button>
          </div>
        </div>
      </div>

      {/* Workspaces List */}
      <div className="overflow-hidden rounded-xl border border-[#E2E8F0] bg-white">
        <div className="flex flex-col justify-between gap-3 border-b border-[#E2E8F0] px-4 py-4 sm:flex-row sm:items-center md:px-6">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-[#1E293B]">Workspaces</h3>
            <span className="rounded-full bg-[#F1F5F9] px-2 py-0.5 text-sm text-[#64748B]">
              {workspaces.length}
            </span>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#E2E8F0] px-4 py-2 text-sm font-medium text-[#64748B] transition-colors hover:bg-[#F8FAFC] sm:w-auto"
          >
            <PlusIcon />
            <span className="sm:inline">Create a new workspace</span>
          </button>
        </div>

        {/* Search */}
        <div className="border-b border-[#E2E8F0] px-4 py-4 md:px-6">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search workspaces"
              className="w-full max-w-sm rounded-lg border border-[#E2E8F0] bg-white py-2 pl-10 pr-4 text-sm focus:border-[#3B82F6] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/20"
            />
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#64748B]">
                  Workspaces
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#64748B]">
                  Used seats
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#64748B]">
                  Workspace seats limit
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[#64748B]"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {workspaces.map((workspace) => (
                <tr key={workspace.id} className="transition-colors hover:bg-[#F8FAFC]">
                  <td className="px-6 py-4 font-medium text-[#1E293B]">{workspace.name}</td>
                  <td className="px-6 py-4 text-[#64748B]">-</td>
                  <td className="px-6 py-4">
                    <span className="rounded bg-[#F0FDF4] px-2 py-1 text-xs font-medium text-[#22C55E]">
                      No limit
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => setEditingWorkspace(workspace)}
                      className="rounded-lg p-2 text-[#64748B] hover:bg-[#F1F5F9]"
                      title="Configure working hours"
                    >
                      <SettingsIcon />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="divide-y divide-[#E2E8F0] md:hidden">
          {workspaces.map((workspace) => (
            <div key={workspace.id} className="p-4 transition-colors hover:bg-[#F8FAFC]">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-medium text-[#1E293B]">{workspace.name}</span>
                <button
                  onClick={() => setEditingWorkspace(workspace)}
                  className="rounded-lg p-2 text-[#64748B] hover:bg-[#F1F5F9]"
                  title="Configure working hours"
                >
                  <SettingsIcon />
                </button>
              </div>
              <div className="flex flex-wrap gap-4 text-sm">
                <div>
                  <span className="text-[#94A3B8]">Slug: </span>
                  <span className="text-[#64748B]">{workspace.slug}</span>
                </div>
                <div>
                  <span className="text-[#94A3B8]">Limit: </span>
                  <span className="rounded bg-[#F0FDF4] px-2 py-0.5 text-xs font-medium text-[#22C55E]">
                    No limit
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create Workspace Modal */}
      <AnimatePresence>
        {showCreateModal && <CreateWorkspaceModal onClose={() => setShowCreateModal(false)} />}
      </AnimatePresence>

      {/* Workspace Working Hours Modal */}
      <AnimatePresence>
        {editingWorkspace && (
          <WorkspaceWorkingHoursModal
            workspace={editingWorkspace}
            onClose={() => setEditingWorkspace(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function CreateWorkspaceModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const createWorkspace = useCreateWorkspace();

  const handleCreate = async () => {
    if (!name.trim()) return;
    setError(null);
    try {
      await createWorkspace.mutateAsync({
        name: name.trim(),
        slug: name
          .trim()
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-]/g, ''),
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create workspace');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
      >
        <h2 className="mb-4 text-lg font-bold text-[#1E293B]">Create new workspace</h2>

        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-[#1E293B]">Workspace name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Marketing Team"
              className="w-full rounded-lg border border-[#E2E8F0] px-4 py-3 focus:border-[#3B82F6] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/20"
            />
          </div>
          {error && <p className="text-sm text-[#EF4444]">{error}</p>}
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={onClose}
            disabled={createWorkspace.isPending}
            className="flex-1 rounded-lg border border-[#E2E8F0] px-4 py-2.5 font-medium text-[#64748B] hover:bg-[#F8FAFC] disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!name.trim() || createWorkspace.isPending}
            className="flex-1 rounded-lg bg-[#3B82F6] px-4 py-2.5 font-medium text-white hover:bg-[#2563EB] disabled:opacity-50"
          >
            {createWorkspace.isPending ? 'Creating...' : 'Create workspace'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function WorkspaceWorkingHoursModal({
  workspace,
  onClose,
}: {
  workspace: Workspace;
  onClose: () => void;
}) {
  const updateWorkspace = useUpdateWorkspace(workspace.id);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize working hours from workspace or defaults
  const [timezone, setTimezone] = useState(workspace.working_hours?.timezone || 'America/New_York');
  const [startTime, setStartTime] = useState(workspace.working_hours?.start || '09:00');
  const [endTime, setEndTime] = useState(workspace.working_hours?.end || '18:00');
  const [selectedDays, setSelectedDays] = useState<number[]>(
    workspace.working_hours?.days || [1, 2, 3, 4, 5]
  );

  // Get current time in selected timezone
  const getCurrentTimeInTimezone = () => {
    try {
      return new Date().toLocaleString('en-US', {
        timeZone: timezone,
        weekday: 'long',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return 'Invalid timezone';
    }
  };

  const handleToggleDay = (dayValue: number) => {
    setSelectedDays((prev) =>
      prev.includes(dayValue) ? prev.filter((d) => d !== dayValue) : [...prev, dayValue].sort()
    );
  };

  const handleSave = async () => {
    setError(null);

    if (selectedDays.length === 0) {
      setError('Please select at least one working day');
      return;
    }

    if (startTime >= endTime) {
      setError('End time must be after start time');
      return;
    }

    setIsSaving(true);

    try {
      await updateWorkspace.mutateAsync({
        working_hours: {
          timezone,
          start: startTime,
          end: endTime,
          days: selectedDays,
        },
      });
      onClose();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error?.response?.data?.detail || 'Failed to update working hours');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E2E8F0] px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-[#1E293B]">Configure Working Hours</h2>
            <p className="mt-1 text-sm text-[#64748B]">{workspace.name}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-[#64748B] hover:bg-[#F8FAFC]">
            <CloseIcon />
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[calc(100vh-200px)] overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Current Time Display */}
            <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
              <p className="text-sm font-medium text-[#64748B]">
                Current time in selected timezone
              </p>
              <p className="mt-1 text-lg font-bold text-[#1E293B]">{getCurrentTimeInTimezone()}</p>
            </div>

            {/* Timezone Selection */}
            <div>
              <label className="block text-sm font-medium text-[#1E293B]">Timezone</label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="mt-2 w-full rounded-lg border border-[#E2E8F0] px-4 py-2.5 text-[#1E293B] focus:border-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20"
              >
                {COMMON_TIMEZONES.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-xs text-[#64748B]">
                Choose your timezone so campaigns run during your local working hours
              </p>
            </div>

            {/* Working Hours */}
            <div>
              <label className="block text-sm font-medium text-[#1E293B]">Working Hours</label>
              <div className="mt-2 grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-[#64748B]">Start Time</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-[#E2E8F0] px-4 py-2.5 text-[#1E293B] focus:border-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#64748B]">End Time</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-[#E2E8F0] px-4 py-2.5 text-[#1E293B] focus:border-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20"
                  />
                </div>
              </div>
              <p className="mt-2 text-xs text-[#64748B]">
                LinkedIn actions will only be sent during these hours
              </p>
            </div>

            {/* Working Days */}
            <div>
              <label className="block text-sm font-medium text-[#1E293B]">Working Days</label>
              <div className="mt-2 flex flex-wrap gap-2">
                {DAYS.map((day) => {
                  const isSelected = selectedDays.includes(day.value);
                  return (
                    <button
                      key={day.value}
                      onClick={() => handleToggleDay(day.value)}
                      className={`rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
                        isSelected
                          ? 'border-[#FF6B35] bg-[#FF6B35] text-white'
                          : 'border-[#E2E8F0] bg-white text-[#64748B] hover:border-[#FF6B35]/50'
                      }`}
                    >
                      <span className="hidden sm:inline">{day.label}</span>
                      <span className="sm:hidden">{day.short}</span>
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-xs text-[#64748B]">
                Select the days when campaigns should run
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-start gap-3 rounded-xl border border-[#EF4444]/20 bg-[#FEF2F2] p-4">
                <WarningIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#EF4444]" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-[#991B1B]">Error</p>
                  <p className="text-xs text-[#DC2626]">{error}</p>
                </div>
              </div>
            )}

            {/* Info Box */}
            <div className="flex items-start gap-3 rounded-xl border border-[#3B82F6]/20 bg-[#EFF6FF] p-4">
              <InfoIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#3B82F6]" />
              <div className="flex-1 text-xs text-[#1E3A8A]">
                <p className="font-medium">How working hours work</p>
                <ul className="mt-2 list-inside list-disc space-y-1">
                  <li>Campaign actions are only sent during your configured working hours</li>
                  <li>If outside working hours, campaigns pause until working hours resume</li>
                  <li>This helps maintain natural engagement patterns on LinkedIn</li>
                  <li>Working hours apply to all senders in this workspace</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-[#E2E8F0] px-6 py-4">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2 font-medium text-[#64748B] disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="rounded-lg bg-[#FF6B35] px-6 py-2.5 font-medium text-white hover:bg-[#E85A2A] disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Working Hours'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ==================== MEMBERS SETTINGS ====================
function MembersSettings() {
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>('');

  // Fetch workspaces for the dropdown
  const { data: workspaces = [] } = useWorkspaces();

  // Auto-select first workspace when loaded
  useEffect(() => {
    if (workspaces.length > 0 && !selectedWorkspaceId) {
      setSelectedWorkspaceId(workspaces[0].id);
    }
  }, [workspaces, selectedWorkspaceId]);

  // Fetch members for selected workspace
  const {
    data: membersData = [],
    isLoading,
    error,
    refetch,
  } = useWorkspaceMembers(selectedWorkspaceId);

  // Fetch pending invitations for selected workspace
  const { data: invitations = [], refetch: refetchInvitations } =
    useWorkspaceInvitations(selectedWorkspaceId);

  const revokeInvitation = useRevokeInvitation(selectedWorkspaceId);
  const resendInvitation = useResendInvitation(selectedWorkspaceId);

  // Filter members by search query
  const members = membersData.filter((m) => {
    const searchLower = searchQuery.toLowerCase();
    const userName = m.user_name?.toLowerCase() || '';
    const userEmail = m.user_email?.toLowerCase() || '';
    return userName.includes(searchLower) || userEmail.includes(searchLower);
  });

  // Helper to get initials
  const getInitials = (name: string | undefined | null, email: string | undefined | null) => {
    if (name) {
      return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    if (email) {
      return email[0].toUpperCase();
    }
    return '??';
  };

  if (isLoading && selectedWorkspaceId) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-center py-12"
      >
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#3B82F6] border-t-transparent" />
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="py-12 text-center"
      >
        <p className="text-[#EF4444]">Failed to load members</p>
        <button onClick={() => refetch()} className="mt-2 text-[#3B82F6] hover:underline">
          Retry
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-xl font-bold text-[#1E293B]">Members</h2>
      </div>

      {/* Info Banner */}
      <div className="flex items-start gap-3 rounded-xl border border-[#3B82F6]/20 bg-[#EFF6FF] p-4">
        <InfoIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#3B82F6]" />
        <p className="text-sm text-[#1E293B]">
          Here you can manage all members within the organization, regardless of what workspaces
          they belong to. If you want to manage them on a workspace level, you can do it from the
          'Workspaces' screen.
        </p>
      </div>

      {/* Members List */}
      <div className="overflow-hidden rounded-xl border border-[#E2E8F0] bg-white">
        {/* Filters and Actions */}
        <div className="flex flex-col justify-between gap-4 border-b border-[#E2E8F0] px-4 py-4 md:flex-row md:items-center md:px-6">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search members"
                className="w-full max-w-sm rounded-lg border border-[#E2E8F0] bg-white py-2 pl-10 pr-4 text-sm focus:border-[#3B82F6] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/20"
              />
            </div>
            <select
              value={selectedWorkspaceId}
              onChange={(e) => setSelectedWorkspaceId(e.target.value)}
              className="w-full rounded-lg border border-[#E2E8F0] px-4 py-2 text-sm focus:border-[#3B82F6] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/20 sm:w-auto"
            >
              {workspaces.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={() => setShowInviteModal(true)}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#3B82F6] px-4 py-2.5 font-medium text-white transition-colors hover:bg-[#2563EB] md:w-auto"
          >
            <PlusIcon />
            Invite members
          </button>
        </div>

        {/* Desktop Table */}
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#64748B]">
                  Workspace members
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#64748B]">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#64748B]">
                  Workspaces
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[#64748B]"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {members.map((member) => (
                <tr key={member.id} className="transition-colors hover:bg-[#F8FAFC]">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#64748B] to-[#94A3B8] text-sm font-medium text-white">
                        {getInitials(member.user_name, member.user_email)}
                      </div>
                      <div>
                        <p className="font-medium text-[#1E293B]">
                          {member.user_name || 'Unknown'}
                        </p>
                        <p className="text-sm text-[#64748B]">{member.user_email || '-'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                        member.role === 'admin'
                          ? 'bg-[#EFF6FF] text-[#3B82F6]'
                          : 'bg-[#F8FAFC] text-[#64748B]'
                      }`}
                    >
                      {member.role === 'admin' && <CrownIcon className="h-3 w-3" />}
                      {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-[#64748B]">
                    {workspaces.find((w) => w.id === selectedWorkspaceId)?.name || '-'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="rounded-lg p-2 text-[#64748B] hover:bg-[#F1F5F9]">
                      <MoreIcon />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="divide-y divide-[#E2E8F0] md:hidden">
          {members.map((member) => (
            <div key={member.id} className="p-4 transition-colors hover:bg-[#F8FAFC]">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#64748B] to-[#94A3B8] text-sm font-medium text-white">
                    {getInitials(member.user_name, member.user_email)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-[#1E293B]">{member.user_name || 'Unknown'}</p>
                    <p className="truncate text-sm text-[#64748B]">{member.user_email || '-'}</p>
                  </div>
                </div>
                <button className="flex-shrink-0 rounded-lg p-2 text-[#64748B] hover:bg-[#F1F5F9]">
                  <MoreIcon />
                </button>
              </div>
              <div className="ml-13 mt-3 flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                    member.role === 'admin'
                      ? 'bg-[#EFF6FF] text-[#3B82F6]'
                      : 'bg-[#F8FAFC] text-[#64748B]'
                  }`}
                >
                  {member.role === 'admin' && <CrownIcon className="h-3 w-3" />}
                  {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                </span>
                <span className="text-xs text-[#94A3B8]">
                  {workspaces.find((w) => w.id === selectedWorkspaceId)?.name || '-'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pending Invitations */}
      {invitations.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-[#E2E8F0] bg-white">
          <div className="border-b border-[#E2E8F0] bg-[#FFFBEB] px-4 py-3 md:px-6">
            <h3 className="flex items-center gap-2 font-semibold text-[#1E293B]">
              <ClockIcon className="h-4 w-4 text-[#F59E0B]" />
              Pending Invitations ({invitations.length})
            </h3>
          </div>
          <div className="divide-y divide-[#E2E8F0]">
            {invitations.map((invitation) => (
              <div
                key={invitation.id}
                className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between md:px-6"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F8FAFC] text-sm font-medium text-[#64748B]">
                    <MailIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium text-[#1E293B]">{invitation.email}</p>
                    <p className="text-sm text-[#64748B]">
                      Invited as <span className="capitalize">{invitation.role}</span>
                      {' · '}
                      Expires {new Date(invitation.expires_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 sm:flex-shrink-0">
                  <button
                    onClick={async () => {
                      try {
                        await resendInvitation.mutateAsync(invitation.id);
                      } catch {
                        // Error handled by mutation
                      }
                    }}
                    disabled={resendInvitation.isPending}
                    className="rounded-lg border border-[#E2E8F0] px-3 py-1.5 text-sm font-medium text-[#64748B] hover:bg-[#F8FAFC] disabled:opacity-50"
                  >
                    {resendInvitation.isPending ? 'Sending...' : 'Resend'}
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        await revokeInvitation.mutateAsync(invitation.id);
                      } catch {
                        // Error handled by mutation
                      }
                    }}
                    disabled={revokeInvitation.isPending}
                    className="rounded-lg border border-[#FEE2E2] bg-[#FEF2F2] px-3 py-1.5 text-sm font-medium text-[#EF4444] hover:bg-[#FEE2E2] disabled:opacity-50"
                  >
                    {revokeInvitation.isPending ? 'Revoking...' : 'Revoke'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invite Modal */}
      <AnimatePresence>
        {showInviteModal && selectedWorkspaceId && (
          <InviteMemberModal
            workspaceId={selectedWorkspaceId}
            workspaceName={
              workspaces.find((w) => w.id === selectedWorkspaceId)?.name || 'Workspace'
            }
            onClose={() => setShowInviteModal(false)}
            onSuccess={() => refetchInvitations()}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function InviteMemberModal({
  workspaceId,
  workspaceName,
  onClose,
  onSuccess,
}: {
  workspaceId: string;
  workspaceName: string;
  onClose: () => void;
  onSuccess?: () => void;
}) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'member' | 'admin'>('member');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const createInvitation = useCreateInvitation(workspaceId);

  const handleInvite = async () => {
    if (!email.trim()) return;
    setError(null);
    setSuccess(false);
    try {
      await createInvitation.mutateAsync({
        email: email.trim(),
        role,
      });
      setSuccess(true);
      onSuccess?.();
      // Close after a brief delay to show success message
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send invitation');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
      >
        <h2 className="mb-4 text-lg font-bold text-[#1E293B]">Invite team member</h2>

        {success ? (
          <div className="py-8 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <svg
                className="h-8 w-8 text-green-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <p className="mt-4 text-lg font-medium text-[#1E293B]">Invitation sent!</p>
            <p className="mt-1 text-sm text-[#64748B]">An email has been sent to {email}</p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-[#1E293B]">
                  Email address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="colleague@company.com"
                  className="w-full rounded-lg border border-[#E2E8F0] px-4 py-3 focus:border-[#3B82F6] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/20"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-[#1E293B]">Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as 'member' | 'admin')}
                  className="w-full rounded-lg border border-[#E2E8F0] px-4 py-3 focus:border-[#3B82F6] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/20"
                >
                  <option value="member">Member - Can run campaigns</option>
                  <option value="admin">Admin - Full access</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-[#64748B]">Workspace</label>
                <p className="font-medium text-[#1E293B]">{workspaceName}</p>
              </div>
              {error && <p className="text-sm text-[#EF4444]">{error}</p>}
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={onClose}
                disabled={createInvitation.isPending}
                className="flex-1 rounded-lg border border-[#E2E8F0] px-4 py-2.5 font-medium text-[#64748B] hover:bg-[#F8FAFC] disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleInvite}
                disabled={!email.trim() || createInvitation.isPending}
                className="flex-1 rounded-lg bg-[#3B82F6] px-4 py-2.5 font-medium text-white hover:bg-[#2563EB] disabled:opacity-50"
              >
                {createInvitation.isPending ? 'Sending...' : 'Send invitation'}
              </button>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}

// ==================== NOTIFICATION SETTINGS ====================
function NotificationSettings() {
  const [notifications, setNotifications] = useState({
    multipleReplies: false,
    disconnectedSender: false,
    disconnectedSalesNav: false,
    disconnectedRecruiter: false,
    campaignComplete: true,
    dailyDigest: true,
    weeklyReport: false,
  });

  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications({ ...notifications, [key]: !notifications[key] });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-xl font-bold text-[#1E293B]">Notifications</h2>
      </div>

      <div className="rounded-xl border border-[#E2E8F0] bg-white p-6">
        <div className="mb-6">
          <h3 className="font-semibold text-[#1E293B]">Events</h3>
          <p className="mt-1 text-sm text-[#64748B]">
            Select the events and channels you want to receive notifications to
          </p>
        </div>

        <div className="space-y-1">
          <NotificationItem
            icon={<MessageSquareIcon />}
            label="Multiple replies received"
            tooltip="Get notified when a lead replies to your messages"
            checked={notifications.multipleReplies}
            onChange={() => toggleNotification('multipleReplies')}
          />
          <NotificationItem
            icon={<DisconnectIcon />}
            label="Disconnected sender"
            tooltip="Alert when a LinkedIn account loses connection"
            checked={notifications.disconnectedSender}
            onChange={() => toggleNotification('disconnectedSender')}
          />
          <NotificationItem
            icon={<DisconnectIcon />}
            label="Disconnected Sales Navigator"
            tooltip="Alert when Sales Navigator access is lost"
            checked={notifications.disconnectedSalesNav}
            onChange={() => toggleNotification('disconnectedSalesNav')}
          />
          <NotificationItem
            icon={<DisconnectIcon />}
            label="Disconnected Recruiter"
            tooltip="Alert when LinkedIn Recruiter access is lost"
            checked={notifications.disconnectedRecruiter}
            onChange={() => toggleNotification('disconnectedRecruiter')}
          />
          <NotificationItem
            icon={<CampaignIcon />}
            label="Campaign complete"
            tooltip="Get notified when a campaign finishes"
            checked={notifications.campaignComplete}
            onChange={() => toggleNotification('campaignComplete')}
          />
          <NotificationItem
            icon={<CalendarIcon />}
            label="Daily digest"
            tooltip="Receive a daily summary of activity"
            checked={notifications.dailyDigest}
            onChange={() => toggleNotification('dailyDigest')}
          />
          <NotificationItem
            icon={<ChartIcon />}
            label="Weekly report"
            tooltip="Get weekly analytics and insights"
            checked={notifications.weeklyReport}
            onChange={() => toggleNotification('weeklyReport')}
          />
        </div>

        <div className="mt-8 flex justify-end">
          <button className="rounded-lg bg-[#3B82F6] px-6 py-2.5 font-medium text-white transition-colors hover:bg-[#2563EB]">
            Save Settings
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function NotificationItem({
  icon,
  label,
  tooltip,
  checked,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  tooltip: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <div className="flex items-center justify-between border-b border-[#E2E8F0] py-4 last:border-0">
      <div className="flex items-center gap-3">
        <span className="text-[#64748B]">{icon}</span>
        <span className="font-medium text-[#1E293B]">{label}</span>
        <button className="rounded-full p-1 hover:bg-[#F8FAFC]" title={tooltip}>
          <QuestionIcon className="h-4 w-4 text-[#94A3B8]" />
        </button>
      </div>
      <button
        onClick={onChange}
        className={`relative h-6 w-12 rounded-full transition-colors ${
          checked ? 'bg-[#3B82F6]' : 'bg-[#E2E8F0]'
        }`}
      >
        <span
          className={`absolute left-1 top-1 h-4 w-4 rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-6' : ''
          }`}
        />
      </button>
    </div>
  );
}

// ==================== BILLING SETTINGS ====================
function BillingSettings() {
  const { data: billing, isLoading, error, refetch } = useBillingOverview();
  const createPortal = useCreatePortalSession();
  const { user } = useAuth();

  const handleManageBilling = async () => {
    try {
      const result = await createPortal.mutateAsync();
      window.location.href = result.portal_url;
    } catch (err) {
      console.error('Failed to open billing portal:', err);
    }
  };

  // Format date
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Format plan name
  const formatPlanName = (plan: string | undefined) => {
    if (!plan) return 'Free';
    return plan.charAt(0).toUpperCase() + plan.slice(1) + ' Plan';
  };

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-center py-12"
      >
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#3B82F6] border-t-transparent" />
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="py-12 text-center"
      >
        <p className="text-[#EF4444]">Failed to load billing information</p>
        <button onClick={() => refetch()} className="mt-2 text-[#3B82F6] hover:underline">
          Retry
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-xl font-bold text-[#1E293B]">Billing</h2>
      </div>

      {/* Current Plan */}
      <div className="rounded-xl border border-[#E2E8F0] bg-white p-6">
        <h3 className="mb-4 font-semibold text-[#1E293B]">Current Plan</h3>
        <div className="flex flex-col justify-between gap-4 rounded-xl border border-[#FF6B35]/20 bg-gradient-to-r from-[#FF6B35]/10 to-[#FF6B35]/5 p-5 md:flex-row md:items-center">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-xl font-bold text-[#1E293B]">
                {formatPlanName(billing?.plan)}
              </span>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                  billing?.subscription?.status === 'active'
                    ? 'bg-[#FF6B35] text-white'
                    : billing?.subscription?.status === 'trialing'
                      ? 'bg-[#3B82F6] text-white'
                      : 'bg-[#64748B] text-white'
                }`}
              >
                {billing?.subscription?.status === 'active'
                  ? 'Active'
                  : billing?.subscription?.status === 'trialing'
                    ? 'Trial'
                    : billing?.subscription?.status || 'Inactive'}
              </span>
              {billing?.volume_discount && billing.volume_discount > 0 && (
                <span className="rounded-full bg-[#14B8A6]/10 px-2.5 py-1 text-xs font-medium text-[#14B8A6]">
                  {billing.volume_discount}% discount
                </span>
              )}
            </div>
            <p className="mt-2 text-sm text-[#64748B]">
              {billing?.linkedin_accounts_connected || 0} of {billing?.sender_count || 0} senders
              connected
              {billing?.monthly_cost ? ` - $${billing.monthly_cost}/month` : ''}
            </p>
          </div>
          <div className="md:text-right">
            <p className="text-sm text-[#64748B]">
              Next billing: {formatDate(billing?.subscription?.current_period_end)}
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            onClick={handleManageBilling}
            disabled={createPortal.isPending}
            className="rounded-lg bg-[#FF6B35] px-4 py-2.5 font-medium text-white transition-colors hover:bg-[#E85A2A] disabled:opacity-50"
          >
            {createPortal.isPending ? 'Loading...' : 'Manage Subscription'}
          </button>
        </div>
      </div>

      {/* Partner Access (if applicable) */}
      {user?.partner_access && (
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-6">
          <h3 className="mb-4 font-semibold text-[#1E293B]">Partner Access</h3>
          <div
            className={`rounded-xl border p-5 ${
              user.partner_access.is_expired
                ? 'border-red-200 bg-red-50'
                : user.partner_access.days_until_expiry !== null &&
                    user.partner_access.days_until_expiry <= 7
                  ? 'border-amber-200 bg-amber-50'
                  : 'border-teal-200 bg-teal-50'
            }`}
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-lg font-bold text-[#1E293B]">
                    {user.partner_access.code}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      user.partner_access.is_expired
                        ? 'bg-red-100 text-red-700'
                        : user.partner_access.access_type === 'full'
                          ? 'bg-teal-100 text-teal-700'
                          : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {user.partner_access.is_expired
                      ? 'Expired'
                      : user.partner_access.access_type === 'full'
                        ? 'Full Access'
                        : 'Limited Access'}
                  </span>
                </div>
                <p className="mt-1 text-sm text-[#64748B]">
                  From {user.partner_access.partner_name}
                </p>
              </div>
              <div className="text-left md:text-right">
                <p className="text-sm font-medium text-[#1E293B]">
                  {user.partner_access.days_until_expiry === null
                    ? 'Lifetime Access'
                    : user.partner_access.is_expired
                      ? 'Access Expired'
                      : `${user.partner_access.days_until_expiry} days remaining`}
                </p>
                {user.partner_access.access_expires_at && (
                  <p className="text-xs text-[#64748B]">
                    {user.partner_access.is_expired ? 'Expired' : 'Expires'}{' '}
                    {new Date(user.partner_access.access_expires_at).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>

            {/* Feature restrictions for limited access */}
            {user.partner_access.access_type === 'limited' && (
              <div className="mt-4 border-t border-[#E2E8F0] pt-4">
                <p className="mb-2 text-sm font-medium text-[#64748B]">Access Limits</p>
                <div className="flex flex-wrap gap-2">
                  {user.partner_access.max_senders && (
                    <span className="rounded bg-white px-2 py-1 text-xs text-[#64748B]">
                      Max {user.partner_access.max_senders} sender
                      {user.partner_access.max_senders > 1 ? 's' : ''}
                    </span>
                  )}
                  {user.partner_access.max_sequences && (
                    <span className="rounded bg-white px-2 py-1 text-xs text-[#64748B]">
                      Max {user.partner_access.max_sequences} sequence
                      {user.partner_access.max_sequences > 1 ? 's' : ''}
                    </span>
                  )}
                  {user.partner_access.max_emails_per_day && (
                    <span className="rounded bg-white px-2 py-1 text-xs text-[#64748B]">
                      {user.partner_access.max_emails_per_day} emails/day
                    </span>
                  )}
                  {user.partner_access.max_linkedin_actions_per_day && (
                    <span className="rounded bg-white px-2 py-1 text-xs text-[#64748B]">
                      {user.partner_access.max_linkedin_actions_per_day} LinkedIn actions/day
                    </span>
                  )}
                  {user.partner_access.enrichment_credits && (
                    <span className="rounded bg-white px-2 py-1 text-xs text-[#64748B]">
                      {user.partner_access.enrichment_credits} enrichment credits
                    </span>
                  )}
                  {user.partner_access.api_access === false && (
                    <span className="rounded bg-white px-2 py-1 text-xs text-[#64748B]">
                      No API access
                    </span>
                  )}
                  {user.partner_access.export_data === false && (
                    <span className="rounded bg-white px-2 py-1 text-xs text-[#64748B]">
                      No data export
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Upgrade CTA if expired or expiring soon */}
            {(user.partner_access.is_expired ||
              (user.partner_access.days_until_expiry !== null &&
                user.partner_access.days_until_expiry <= 7)) && (
              <div className="mt-4 border-t border-[#E2E8F0] pt-4">
                <a
                  href="/pricing"
                  className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors ${
                    user.partner_access.is_expired
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-amber-600 hover:bg-amber-700'
                  }`}
                >
                  {user.partner_access.is_expired
                    ? 'Upgrade to Continue Access'
                    : 'Upgrade Before It Expires'}
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Payment Method */}
      <div className="rounded-xl border border-[#E2E8F0] bg-white p-6">
        <h3 className="mb-4 font-semibold text-[#1E293B]">Payment Method</h3>
        <div className="flex items-center justify-between rounded-lg bg-[#F8FAFC] p-4">
          <div className="flex items-center gap-4">
            <div className="flex h-9 w-14 items-center justify-center rounded-md bg-gradient-to-r from-[#64748B] to-[#94A3B8]">
              <span className="text-xs font-bold tracking-wide text-white">CARD</span>
            </div>
            <div>
              <p className="font-medium text-[#1E293B]">Manage payment method in Stripe</p>
              <p className="text-sm text-[#64748B]">Click below to update</p>
            </div>
          </div>
          <button
            onClick={handleManageBilling}
            disabled={createPortal.isPending}
            className="text-sm font-medium text-[#3B82F6] hover:text-[#2563EB] disabled:opacity-50"
          >
            Update
          </button>
        </div>
      </div>

      {/* Usage */}
      <div className="rounded-xl border border-[#E2E8F0] bg-white p-6">
        <h3 className="mb-4 font-semibold text-[#1E293B]">Usage</h3>
        <div className="space-y-5">
          <UsageBar
            label="LinkedIn Senders"
            used={billing?.linkedin_accounts_connected || 0}
            total={billing?.sender_count || 0}
            unit="senders"
          />
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-[#1E293B]">Workspaces</span>
            <span className="text-sm text-[#64748B]">{billing?.workspaces || 0} created</span>
          </div>
        </div>
        {billing?.recommend_agency && billing?.plan === 'growth' && (
          <div className="mt-4 rounded-lg border border-[#FF6B35]/20 bg-[#FF6B35]/5 p-3">
            <p className="text-sm text-[#FF6B35]">
              Tip: With {billing.sender_count}+ senders, the Agency plan ($999/mo for 50 senders)
              may save you money.
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function UsageBar({
  label,
  used,
  total,
  unit,
}: {
  label: string;
  used: number;
  total: number;
  unit: string;
}) {
  const isUnlimited = unit === 'unlimited' || total === 0 || total === -1;
  const percent = isUnlimited ? 100 : (used / total) * 100;
  const isWarning = !isUnlimited && percent > 75;
  const isDanger = !isUnlimited && percent > 90;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium text-[#1E293B]">{label}</span>
        {isUnlimited ? (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-[#64748B]">{used.toLocaleString()} used</span>
            <span className="rounded-full bg-[#F0FDF4] px-2 py-0.5 text-xs font-medium text-[#22C55E]">
              Unlimited
            </span>
          </div>
        ) : (
          <span
            className={`text-sm font-medium ${isDanger ? 'text-[#EF4444]' : isWarning ? 'text-[#F59E0B]' : 'text-[#64748B]'}`}
          >
            {used.toLocaleString()} / {total.toLocaleString()} {unit}
          </span>
        )}
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[#E2E8F0]">
        <div
          className={`h-full rounded-full transition-all ${
            isUnlimited
              ? 'bg-[#22C55E]'
              : isDanger
                ? 'bg-[#EF4444]'
                : isWarning
                  ? 'bg-[#F59E0B]'
                  : 'bg-[#3B82F6]'
          }`}
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>
    </div>
  );
}

// ==================== INTEGRATION SETTINGS ====================
function IntegrationSettings() {
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showLinkedInModal, setShowLinkedInModal] = useState(false);
  const [editingLinkedInAccount, setEditingLinkedInAccount] = useState<LinkedInAccount | null>(
    null
  );
  const { data: emailAccounts = [], isLoading: emailsLoading } = useEmailAccounts();
  const { data: linkedInAccounts = [], isLoading: linkedInLoading } = useLinkedInAccounts();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-xl font-bold text-[#1E293B]">Integrations</h2>
      </div>

      {/* LinkedIn Accounts */}
      <div className="rounded-xl border border-[#E2E8F0] bg-white p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-[#1E293B]">LinkedIn Accounts</h3>
            <p className="mt-1 text-sm text-[#64748B]">
              Connect LinkedIn accounts to send connection requests and messages
            </p>
          </div>
          <button
            onClick={() => setShowLinkedInModal(true)}
            className="flex items-center gap-2 rounded-lg bg-[#0A66C2] px-4 py-2.5 font-medium text-white transition-colors hover:bg-[#004182]"
          >
            <PlusIcon />
            Connect LinkedIn
          </button>
        </div>

        {/* Connected LinkedIn Accounts */}
        {linkedInLoading ? (
          <div className="flex items-center justify-center py-6">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#0A66C2] border-t-transparent" />
          </div>
        ) : linkedInAccounts.length > 0 ? (
          <div className="space-y-3">
            {linkedInAccounts.map((account, index) => (
              <div
                key={account.id}
                className="flex items-center justify-between rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0A66C2]/10">
                    {account.avatar_url ? (
                      <img
                        src={account.avatar_url}
                        alt={account.name || ''}
                        className="h-10 w-10 rounded-lg"
                      />
                    ) : (
                      <LinkedInIcon className="h-6 w-6 text-[#0A66C2]" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-[#1E293B]">
                      {account.name || 'LinkedIn Account'}
                    </p>
                    <p className="text-sm text-[#64748B]">
                      {account.subscription_type !== 'free'
                        ? `${account.subscription_type} - `
                        : ''}
                      {account.status === 'connected'
                        ? 'Connected'
                        : account.status === 'warning'
                          ? 'Warning'
                          : 'Disconnected'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {index === 0 && (
                    <span className="rounded-full bg-[#F0FDF4] px-2.5 py-1 text-xs font-medium text-[#22C55E]">
                      Primary
                    </span>
                  )}
                  <button
                    onClick={() => setEditingLinkedInAccount(account)}
                    className="rounded-lg p-2 text-[#64748B] hover:bg-[#E2E8F0]"
                    title="Configure working hours and limits"
                  >
                    <SettingsIcon />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="rounded-xl border-2 border-dashed border-[#E2E8F0] p-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-[#F8FAFC]">
              <LinkedInIcon className="h-6 w-6 text-[#94A3B8]" />
            </div>
            <p className="text-sm text-[#64748B]">No LinkedIn accounts connected yet</p>
            <p className="mt-1 text-xs text-[#94A3B8]">
              Connect a LinkedIn account to start outreach
            </p>
          </div>
        )}
      </div>

      {/* Email Accounts for Follow-ups */}
      <div className="rounded-xl border border-[#E2E8F0] bg-white p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-[#1E293B]">Email Accounts</h3>
            <p className="mt-1 text-sm text-[#64748B]">
              Connect your email for sending follow-up messages to leads
            </p>
          </div>
          <button
            onClick={() => setShowEmailModal(true)}
            className="flex items-center gap-2 rounded-lg bg-[#FF6B35] px-4 py-2.5 font-medium text-white transition-colors hover:bg-[#E85A2A]"
          >
            <PlusIcon />
            Connect Email
          </button>
        </div>

        {/* Connected Email Accounts */}
        {emailsLoading ? (
          <div className="flex items-center justify-center py-6">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#3B82F6] border-t-transparent" />
          </div>
        ) : emailAccounts.length > 0 ? (
          <div className="space-y-3">
            {emailAccounts.map((account, index) => (
              <div
                key={account.id}
                className="flex items-center justify-between rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#EA4335]/10">
                    <EmailIcon className="h-6 w-6 text-[#EA4335]" />
                  </div>
                  <div>
                    <p className="font-medium text-[#1E293B]">{account.email_address}</p>
                    <p className="text-sm text-[#64748B]">
                      {account.provider ? `${account.provider} - ` : ''}
                      {account.status === 'connected'
                        ? 'Connected'
                        : account.status === 'reconnect_required'
                          ? 'Reconnect Required'
                          : 'Disconnected'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {index === 0 && (
                    <span className="rounded-full bg-[#F0FDF4] px-2.5 py-1 text-xs font-medium text-[#22C55E]">
                      Primary
                    </span>
                  )}
                  <button className="rounded-lg p-2 text-[#64748B] hover:bg-[#E2E8F0]">
                    <MoreIcon />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="rounded-xl border-2 border-dashed border-[#E2E8F0] p-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-[#F8FAFC]">
              <EmailIcon className="h-6 w-6 text-[#94A3B8]" />
            </div>
            <p className="text-sm text-[#64748B]">No email accounts connected yet</p>
            <p className="mt-1 text-xs text-[#94A3B8]">
              Connect an email account to send follow-ups
            </p>
          </div>
        )}
      </div>

      {/* CRM Integrations */}
      <div className="rounded-xl border border-[#E2E8F0] bg-white p-6">
        <div className="mb-6">
          <h3 className="font-semibold text-[#1E293B]">CRM Integrations</h3>
          <p className="mt-1 text-sm text-[#64748B]">
            Sync your leads and activities with your CRM
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <IntegrationCard
            name="HubSpot"
            description="Sync leads, deals, and activities"
            icon={<HubSpotIcon />}
            color="#FF7A59"
            connected={false}
            comingSoon
          />
          <IntegrationCard
            name="Salesforce"
            description="Enterprise CRM integration"
            icon={<SalesforceIcon />}
            color="#00A1E0"
            connected={false}
            comingSoon
          />
          <IntegrationCard
            name="Pipedrive"
            description="Deal and pipeline management"
            icon={<PipedriveIcon />}
            color="#1D1D1D"
            connected={false}
            comingSoon
          />
          <IntegrationCard
            name="Close CRM"
            description="Sales productivity platform"
            icon={<CloseIcon />}
            color="#5C6BC0"
            connected={false}
            comingSoon
          />
        </div>
      </div>

      {/* Automation Integrations */}
      <div className="rounded-xl border border-[#E2E8F0] bg-white p-6">
        <div className="mb-6">
          <h3 className="font-semibold text-[#1E293B]">Automation & Webhooks</h3>
          <p className="mt-1 text-sm text-[#64748B]">
            Connect to 5000+ apps or build custom integrations
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <IntegrationCard
            name="Zapier"
            description="Connect to 5000+ apps"
            icon={<ZapierIcon />}
            color="#FF4A00"
            connected={false}
            comingSoon
          />
          <IntegrationCard
            name="Make (Integromat)"
            description="Visual automation platform"
            icon={<MakeIcon />}
            color="#6E56FF"
            connected={false}
            comingSoon
          />
          <IntegrationCard
            name="Slack"
            description="Get notifications in Slack"
            icon={<SlackIcon />}
            color="#4A154B"
            connected={false}
            comingSoon
          />
          <IntegrationCard
            name="Webhooks"
            description="Custom API integrations"
            icon={<WebhookIcon />}
            color="#64748B"
            connected={false}
            comingSoon
          />
        </div>
      </div>

      {/* LinkedIn Connection Modal */}
      <AnimatePresence>
        {showLinkedInModal && <ConnectLinkedInModal onClose={() => setShowLinkedInModal(false)} />}
      </AnimatePresence>

      {/* LinkedIn Working Hours Modal */}
      <AnimatePresence>
        {editingLinkedInAccount && (
          <LinkedInWorkingHoursModal
            account={editingLinkedInAccount}
            onClose={() => setEditingLinkedInAccount(null)}
          />
        )}
      </AnimatePresence>

      {/* Email Connection Modal */}
      <AnimatePresence>
        {showEmailModal && <ConnectEmailModal onClose={() => setShowEmailModal(false)} />}
      </AnimatePresence>
    </motion.div>
  );
}

function IntegrationCard({
  name,
  description,
  icon,
  color,
  connected,
  isWebhook = false,
  comingSoon = false,
}: {
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  connected: boolean;
  isWebhook?: boolean;
  comingSoon?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between rounded-xl border border-[#E2E8F0] p-4 transition-all ${comingSoon ? 'opacity-75' : 'hover:border-[#3B82F6]/30 hover:shadow-sm'}`}
    >
      <div className="flex items-center gap-3">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${color}15` }}
        >
          <div style={{ color }}>{icon}</div>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="font-medium text-[#1E293B]">{name}</p>
            {comingSoon && (
              <span className="rounded-full bg-[#FEF3C7] px-2 py-0.5 text-[10px] font-medium text-[#D97706]">
                Coming Soon
              </span>
            )}
          </div>
          <p className="text-xs text-[#64748B]">{description}</p>
        </div>
      </div>
      {comingSoon ? (
        <button
          disabled
          className="cursor-not-allowed rounded-lg bg-[#F1F5F9] px-4 py-2 text-sm font-medium text-[#94A3B8]"
        >
          Coming Soon
        </button>
      ) : (
        <button
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            connected
              ? 'bg-[#F0FDF4] text-[#22C55E] hover:bg-[#DCFCE7]'
              : 'bg-[#F8FAFC] text-[#64748B] hover:bg-[#E2E8F0]'
          }`}
        >
          {connected ? 'Connected' : isWebhook ? 'Configure' : 'Connect'}
        </button>
      )}
    </div>
  );
}

// ==================== LINKEDIN CONNECT MODAL ====================
type LinkedInAuthStep =
  | 'method'
  | 'credentials'
  | 'cookie'
  | 'checkpoint'
  | 'in_app_validation'
  | 'success';

function ConnectLinkedInModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<LinkedInAuthStep>('method');
  const [error, setError] = useState('');

  // Credentials form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Cookie form state
  const [cookie, setCookie] = useState('');
  const [userAgent, setUserAgent] = useState('');

  // Checkpoint state
  const [accountId, setAccountId] = useState('');
  const [checkpointType, setCheckpointType] = useState<CheckpointType | null>(null);
  const [verificationCode, setVerificationCode] = useState('');

  const connectWithCredentials = useConnectLinkedInWithCredentials();
  const connectWithCookie = useConnectLinkedInWithCookie();
  const solveCheckpoint = useSolveLinkedInCheckpoint();
  const pollStatus = usePollLinkedInStatus();

  // Auto-polling state
  const [isPolling, setIsPolling] = useState(false);
  const [pollAttempts, setPollAttempts] = useState(0);
  const pollIntervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const maxPollAttempts = 60; // Max 60 attempts (2 minutes at 2s intervals)

  const handleAuthResponse = (data: {
    status: string;
    account_id?: string;
    checkpoint?: { type: CheckpointType };
  }) => {
    if (data.status === 'connected') {
      stopPolling();
      setStep('success');
      setTimeout(() => onClose(), 1500);
    } else if (data.status === 'checkpoint' && data.checkpoint) {
      setAccountId(data.account_id || '');
      setCheckpointType(data.checkpoint.type);
      if (data.checkpoint.type === 'IN_APP_VALIDATION') {
        setStep('in_app_validation');
      } else {
        setStep('checkpoint');
      }
    }
  };

  // Stop polling helper
  const stopPolling = () => {
    setIsPolling(false);
    if (pollIntervalRef.current) {
      clearTimeout(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  };

  // Auto-poll when in_app_validation step is active
  useEffect(() => {
    console.log(
      '[settings useEffect] step:',
      step,
      'accountId:',
      accountId,
      'isPolling:',
      isPolling
    );
    if (step === 'in_app_validation' && accountId && !isPolling) {
      console.log('[settings useEffect] Starting auto polling');
      startAutoPolling();
    }
    return () => {
      stopPolling();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, accountId]);

  const startAutoPolling = () => {
    console.log(
      '[settings startAutoPolling] called, isPolling:',
      isPolling,
      'pollAttempts:',
      pollAttempts
    );
    if (isPolling) return;
    setIsPolling(true);
    setPollAttempts(0);
    setError('');
    pollOnce();
  };

  const pollOnce = async () => {
    console.log('[settings pollOnce] called, accountId:', accountId);
    if (!accountId) return;

    try {
      const result = await pollStatus.mutateAsync(accountId);
      console.log('[settings pollOnce] result:', result);
      if (result.status === 'connected') {
        console.log('[settings pollOnce] connected!');
        handleAuthResponse(result);
      } else if (result.status === 'checkpoint') {
        console.log('[settings pollOnce] checkpoint, scheduling next');
        scheduleNextPoll();
      } else if (result.status === 'pending') {
        console.log('[settings pollOnce] pending, scheduling next');
        scheduleNextPoll();
      } else {
        console.log('[settings pollOnce] unknown status:', (result as { status: string }).status);
        handleAuthResponse(
          result as { status: string; account_id?: string; checkpoint?: { type: CheckpointType } }
        );
      }
    } catch (err) {
      console.log('[settings pollOnce] error:', err);
      setPollAttempts((prev) => {
        const newAttempts = prev + 1;
        if (newAttempts < maxPollAttempts) {
          scheduleNextPoll();
        } else {
          setError('Connection timed out. Please try signing in again.');
          setIsPolling(false);
        }
        return newAttempts;
      });
    }
  };

  const scheduleNextPoll = () => {
    console.log('[settings scheduleNextPoll] scheduling in 2s');
    pollIntervalRef.current = setTimeout(() => {
      console.log('[settings scheduleNextPoll] timeout fired');
      pollOnce();
    }, 2000);
  };

  const handleCredentialsSubmit = async () => {
    setError('');
    if (!username || !password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      const result = await connectWithCredentials.mutateAsync({ username, password });
      handleAuthResponse(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect');
    }
  };

  const handleCookieSubmit = async () => {
    setError('');
    if (!cookie) {
      setError('Please enter the li_at cookie');
      return;
    }

    try {
      const result = await connectWithCookie.mutateAsync({
        access_token: cookie,
        user_agent: userAgent || undefined,
      });
      handleAuthResponse(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect');
    }
  };

  const handleCheckpointSubmit = async () => {
    setError('');
    if (!verificationCode) {
      setError('Please enter the verification code');
      return;
    }

    try {
      const result = await solveCheckpoint.mutateAsync({
        account_id: accountId,
        code: verificationCode,
      });
      handleAuthResponse(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify');
    }
  };

  const handlePollStatus = async () => {
    setError('');
    // Manual check - just calls pollOnce which handles all status types
    pollOnce();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-xl"
      >
        <AnimatePresence mode="wait">
          {/* Step 1: Choose method */}
          {step === 'method' && (
            <motion.div
              key="method"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-6"
            >
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-lg font-bold text-[#1E293B]">Connect LinkedIn Account</h2>
                <button onClick={onClose} className="rounded-lg p-2 hover:bg-[#F8FAFC]">
                  <XIcon />
                </button>
              </div>

              <p className="mb-6 text-[#64748B]">
                Choose how you want to connect your LinkedIn account.
              </p>

              <div className="space-y-3">
                <button
                  onClick={() => setStep('credentials')}
                  className="flex w-full items-center gap-4 rounded-xl border border-[#E2E8F0] p-4 transition-all hover:border-[#0A66C2]/30 hover:bg-[#F8FAFC]"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#0A66C2]/10">
                    <LinkedInIcon className="h-7 w-7 text-[#0A66C2]" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-[#1E293B]">Email & Password</p>
                    <p className="text-sm text-[#64748B]">Sign in with your LinkedIn credentials</p>
                  </div>
                </button>

                <button
                  onClick={() => setStep('cookie')}
                  className="flex w-full items-center gap-4 rounded-xl border border-[#E2E8F0] p-4 transition-all hover:border-[#0A66C2]/30 hover:bg-[#F8FAFC]"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#64748B]/10">
                    <CookieIcon className="h-7 w-7 text-[#64748B]" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-[#1E293B]">Session Cookie</p>
                    <p className="text-sm text-[#64748B]">Use your existing LinkedIn session</p>
                  </div>
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 2a: Credentials form */}
          {step === 'credentials' && (
            <motion.div
              key="credentials"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-6"
            >
              <div className="mb-6 flex items-center gap-3">
                <button
                  onClick={() => setStep('method')}
                  className="rounded-lg p-2 hover:bg-[#F8FAFC]"
                >
                  <BackArrowIcon />
                </button>
                <h2 className="text-lg font-bold text-[#1E293B]">Sign in to LinkedIn</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-[#1E293B]">Email</label>
                  <input
                    type="email"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full rounded-lg border border-[#E2E8F0] px-4 py-2.5 focus:border-[#0A66C2] focus:outline-none focus:ring-2 focus:ring-[#0A66C2]/20"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-[#1E293B]">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Your LinkedIn password"
                    className="w-full rounded-lg border border-[#E2E8F0] px-4 py-2.5 focus:border-[#0A66C2] focus:outline-none focus:ring-2 focus:ring-[#0A66C2]/20"
                  />
                </div>

                {error && (
                  <div className="rounded-lg border border-[#EF4444]/20 bg-[#FEF2F2] p-3">
                    <p className="text-sm text-[#EF4444]">{error}</p>
                  </div>
                )}
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setStep('method')}
                  className="flex-1 rounded-lg border border-[#E2E8F0] px-4 py-2.5 font-medium text-[#64748B] hover:bg-[#F8FAFC]"
                >
                  Back
                </button>
                <button
                  onClick={handleCredentialsSubmit}
                  disabled={connectWithCredentials.isPending}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#0A66C2] px-4 py-2.5 font-medium text-white hover:bg-[#004182] disabled:opacity-50"
                >
                  {connectWithCredentials.isPending ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Connecting...
                    </>
                  ) : (
                    'Connect'
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 2b: Cookie form */}
          {step === 'cookie' && (
            <motion.div
              key="cookie"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-6"
            >
              <div className="mb-6 flex items-center gap-3">
                <button
                  onClick={() => setStep('method')}
                  className="rounded-lg p-2 hover:bg-[#F8FAFC]"
                >
                  <BackArrowIcon />
                </button>
                <h2 className="text-lg font-bold text-[#1E293B]">Connect with Cookie</h2>
              </div>

              <div className="mb-4 rounded-xl border border-[#FF6B35]/20 bg-[#FFF7ED] p-4">
                <div className="flex items-start gap-3">
                  <InfoIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#FF6B35]" />
                  <div className="text-sm text-[#92400E]">
                    <p className="font-medium">How to get your li_at cookie:</p>
                    <ol className="mt-1 list-inside list-decimal space-y-1">
                      <li>Log in to LinkedIn in your browser</li>
                      <li>Open Developer Tools (F12)</li>
                      <li>Go to Application &gt; Cookies &gt; linkedin.com</li>
                      <li>Copy the value of the "li_at" cookie</li>
                    </ol>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-[#1E293B]">
                    li_at Cookie
                  </label>
                  <textarea
                    value={cookie}
                    onChange={(e) => setCookie(e.target.value)}
                    placeholder="Paste your li_at cookie value here"
                    rows={3}
                    className="w-full resize-none rounded-lg border border-[#E2E8F0] px-4 py-2.5 focus:border-[#0A66C2] focus:outline-none focus:ring-2 focus:ring-[#0A66C2]/20"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-[#1E293B]">
                    User Agent (Optional)
                  </label>
                  <input
                    type="text"
                    value={userAgent}
                    onChange={(e) => setUserAgent(e.target.value)}
                    placeholder="Your browser's user agent"
                    className="w-full rounded-lg border border-[#E2E8F0] px-4 py-2.5 focus:border-[#0A66C2] focus:outline-none focus:ring-2 focus:ring-[#0A66C2]/20"
                  />
                  <p className="mt-1 text-xs text-[#64748B]">
                    Recommended to prevent disconnection
                  </p>
                </div>

                {error && (
                  <div className="rounded-lg border border-[#EF4444]/20 bg-[#FEF2F2] p-3">
                    <p className="text-sm text-[#EF4444]">{error}</p>
                  </div>
                )}
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setStep('method')}
                  className="flex-1 rounded-lg border border-[#E2E8F0] px-4 py-2.5 font-medium text-[#64748B] hover:bg-[#F8FAFC]"
                >
                  Back
                </button>
                <button
                  onClick={handleCookieSubmit}
                  disabled={connectWithCookie.isPending}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#0A66C2] px-4 py-2.5 font-medium text-white hover:bg-[#004182] disabled:opacity-50"
                >
                  {connectWithCookie.isPending ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Connecting...
                    </>
                  ) : (
                    'Connect'
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Checkpoint (2FA/OTP) */}
          {step === 'checkpoint' && (
            <motion.div
              key="checkpoint"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-6"
            >
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-lg font-bold text-[#1E293B]">Verification Required</h2>
                <button onClick={onClose} className="rounded-lg p-2 hover:bg-[#F8FAFC]">
                  <XIcon />
                </button>
              </div>

              <div className="mb-6 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#0A66C2]/10">
                  <ShieldIcon className="h-8 w-8 text-[#0A66C2]" />
                </div>
                <p className="text-[#64748B]">
                  {checkpointType === '2FA'
                    ? 'Enter your two-factor authentication code'
                    : checkpointType === 'OTP'
                      ? 'Enter the verification code sent to your email/phone'
                      : checkpointType === 'PHONE_REGISTER'
                        ? 'Enter your phone number to receive a verification code'
                        : 'Additional verification is required'}
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-[#1E293B]">
                    {checkpointType === 'PHONE_REGISTER' ? 'Phone Number' : 'Verification Code'}
                  </label>
                  <input
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    placeholder={
                      checkpointType === 'PHONE_REGISTER' ? '(+1)1234567890' : 'Enter code'
                    }
                    className="w-full rounded-lg border border-[#E2E8F0] px-4 py-2.5 text-center text-lg tracking-widest focus:border-[#0A66C2] focus:outline-none focus:ring-2 focus:ring-[#0A66C2]/20"
                  />
                </div>

                {error && (
                  <div className="rounded-lg border border-[#EF4444]/20 bg-[#FEF2F2] p-3">
                    <p className="text-sm text-[#EF4444]">{error}</p>
                  </div>
                )}
              </div>

              <button
                onClick={handleCheckpointSubmit}
                disabled={solveCheckpoint.isPending}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-[#0A66C2] px-4 py-2.5 font-medium text-white hover:bg-[#004182] disabled:opacity-50"
              >
                {solveCheckpoint.isPending ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Verifying...
                  </>
                ) : (
                  'Verify'
                )}
              </button>
            </motion.div>
          )}

          {/* Step 3b: In-App Validation */}
          {step === 'in_app_validation' && (
            <motion.div
              key="in_app_validation"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-6"
            >
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-lg font-bold text-[#1E293B]">Confirm in LinkedIn App</h2>
                <button onClick={onClose} className="rounded-lg p-2 hover:bg-[#F8FAFC]">
                  <XIcon />
                </button>
              </div>

              <div className="mb-6 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#0A66C2]/10">
                  <SmartphoneIcon className="h-8 w-8 text-[#0A66C2]" />
                </div>
                <p className="text-[#64748B]">
                  Open the LinkedIn app on your phone and confirm the login request.
                </p>
              </div>

              {error && (
                <div className="mb-4 rounded-lg border border-[#EF4444]/20 bg-[#FEF2F2] p-3">
                  <p className="text-sm text-[#EF4444]">{error}</p>
                </div>
              )}

              <button
                onClick={handlePollStatus}
                disabled={pollStatus.isPending || isPolling}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#0A66C2] px-4 py-2.5 font-medium text-white hover:bg-[#004182] disabled:opacity-50"
              >
                {pollStatus.isPending || isPolling ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Waiting for confirmation...
                  </>
                ) : (
                  'Check Status'
                )}
              </button>
            </motion.div>
          )}

          {/* Success */}
          {step === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-6 text-center"
            >
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#F0FDF4]">
                <CheckIcon className="h-8 w-8 text-[#22C55E]" />
              </div>
              <h2 className="mb-2 text-lg font-bold text-[#1E293B]">Successfully Connected!</h2>
              <p className="text-[#64748B]">Your LinkedIn account has been connected.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

type EmailAuthStep = 'method' | 'imap' | 'google_info' | 'microsoft_info' | 'success';

function ConnectEmailModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<EmailAuthStep>('method');
  const [error, setError] = useState('');

  // IMAP form state
  const [emailAddress, setEmailAddress] = useState('');
  const [imapPassword, setImapPassword] = useState('');
  const [imapHost, setImapHost] = useState('');
  const [imapPort, setImapPort] = useState(993);
  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState(587);
  const [displayName, setDisplayName] = useState('');

  const connectIMAP = useConnectEmailIMAP();

  const handleIMAPSubmit = async () => {
    setError('');
    if (!emailAddress || !imapPassword || !imapHost || !smtpHost) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      const result = await connectIMAP.mutateAsync({
        email_address: emailAddress,
        imap_password: imapPassword,
        imap_host: imapHost,
        imap_port: imapPort,
        smtp_host: smtpHost,
        smtp_port: smtpPort,
        display_name: displayName || undefined,
      });
      if (result.status === 'connected') {
        setStep('success');
        setTimeout(() => onClose(), 1500);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect');
    }
  };

  // Auto-detect settings based on email domain
  const handleEmailChange = (email: string) => {
    setEmailAddress(email);
    const domain = email.split('@')[1]?.toLowerCase();
    if (domain === 'gmail.com') {
      setImapHost('imap.gmail.com');
      setSmtpHost('smtp.gmail.com');
    } else if (domain === 'outlook.com' || domain === 'hotmail.com') {
      setImapHost('outlook.office365.com');
      setSmtpHost('smtp.office365.com');
    } else if (domain === 'yahoo.com') {
      setImapHost('imap.mail.yahoo.com');
      setSmtpHost('smtp.mail.yahoo.com');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <AnimatePresence mode="wait">
          {/* Step 1: Choose method */}
          {step === 'method' && (
            <motion.div
              key="method"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-6"
            >
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-lg font-bold text-[#1E293B]">Connect Email Account</h2>
                <button onClick={onClose} className="rounded-lg p-2 hover:bg-[#F8FAFC]">
                  <XIcon />
                </button>
              </div>

              <p className="mb-6 text-[#64748B]">
                Choose your email provider to connect your account.
              </p>

              <div className="space-y-3">
                <button
                  onClick={() => setStep('google_info')}
                  className="flex w-full items-center gap-4 rounded-xl border border-[#E2E8F0] p-4 transition-all hover:border-[#EA4335]/30 hover:bg-[#FEF2F2]"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#EA4335]/10">
                    <GmailIcon className="h-7 w-7" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-[#1E293B]">Gmail</p>
                    <p className="text-sm text-[#64748B]">Connect with Google (App Password)</p>
                  </div>
                </button>

                <button
                  onClick={() => setStep('microsoft_info')}
                  className="flex w-full items-center gap-4 rounded-xl border border-[#E2E8F0] p-4 transition-all hover:border-[#0078D4]/30 hover:bg-[#EFF6FF]"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#0078D4]/10">
                    <OutlookIcon className="h-7 w-7" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-[#1E293B]">Outlook / Microsoft 365</p>
                    <p className="text-sm text-[#64748B]">Connect with Microsoft (App Password)</p>
                  </div>
                </button>

                <button
                  onClick={() => setStep('imap')}
                  className="flex w-full items-center gap-4 rounded-xl border border-[#E2E8F0] p-4 transition-all hover:border-[#64748B]/30 hover:bg-[#F8FAFC]"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#64748B]/10">
                    <EmailIcon className="h-7 w-7 text-[#64748B]" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-[#1E293B]">Other Email (IMAP)</p>
                    <p className="text-sm text-[#64748B]">Connect with IMAP/SMTP credentials</p>
                  </div>
                </button>
              </div>
            </motion.div>
          )}

          {/* Google info step */}
          {step === 'google_info' && (
            <motion.div
              key="google_info"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-6"
            >
              <div className="mb-6 flex items-center gap-3">
                <button
                  onClick={() => setStep('method')}
                  className="rounded-lg p-2 hover:bg-[#F8FAFC]"
                >
                  <BackArrowIcon />
                </button>
                <h2 className="text-lg font-bold text-[#1E293B]">Connect Gmail</h2>
              </div>

              <div className="mb-6 rounded-xl border border-[#EA4335]/20 bg-[#FEF2F2] p-4">
                <div className="flex items-start gap-3">
                  <InfoIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#EA4335]" />
                  <div className="text-sm text-[#92400E]">
                    <p className="font-medium">Create an App Password:</p>
                    <ol className="mt-1 list-inside list-decimal space-y-1">
                      <li>
                        Go to{' '}
                        <a
                          href="https://myaccount.google.com/apppasswords"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#EA4335] underline"
                        >
                          Google App Passwords
                        </a>
                      </li>
                      <li>Select "Mail" and your device</li>
                      <li>Copy the generated 16-character password</li>
                      <li>Use it as your password below</li>
                    </ol>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  setImapHost('imap.gmail.com');
                  setSmtpHost('smtp.gmail.com');
                  setStep('imap');
                }}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#EA4335] px-4 py-2.5 font-medium text-white hover:bg-[#D33B2E]"
              >
                Continue with App Password
              </button>
            </motion.div>
          )}

          {/* Microsoft info step */}
          {step === 'microsoft_info' && (
            <motion.div
              key="microsoft_info"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-6"
            >
              <div className="mb-6 flex items-center gap-3">
                <button
                  onClick={() => setStep('method')}
                  className="rounded-lg p-2 hover:bg-[#F8FAFC]"
                >
                  <BackArrowIcon />
                </button>
                <h2 className="text-lg font-bold text-[#1E293B]">Connect Outlook</h2>
              </div>

              <div className="mb-6 rounded-xl border border-[#0078D4]/20 bg-[#EFF6FF] p-4">
                <div className="flex items-start gap-3">
                  <InfoIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#0078D4]" />
                  <div className="text-sm text-[#1E40AF]">
                    <p className="font-medium">Create an App Password:</p>
                    <ol className="mt-1 list-inside list-decimal space-y-1">
                      <li>
                        Go to{' '}
                        <a
                          href="https://account.live.com/proofs/AppPassword"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#0078D4] underline"
                        >
                          Microsoft App Passwords
                        </a>
                      </li>
                      <li>Create a new app password</li>
                      <li>Copy the generated password</li>
                      <li>Use it as your password below</li>
                    </ol>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  setImapHost('outlook.office365.com');
                  setSmtpHost('smtp.office365.com');
                  setStep('imap');
                }}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#0078D4] px-4 py-2.5 font-medium text-white hover:bg-[#0066B4]"
              >
                Continue with App Password
              </button>
            </motion.div>
          )}

          {/* IMAP form */}
          {step === 'imap' && (
            <motion.div
              key="imap"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-h-[80vh] overflow-y-auto p-6"
            >
              <div className="mb-6 flex items-center gap-3">
                <button
                  onClick={() => setStep('method')}
                  className="rounded-lg p-2 hover:bg-[#F8FAFC]"
                >
                  <BackArrowIcon />
                </button>
                <h2 className="text-lg font-bold text-[#1E293B]">Connect Email</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-[#1E293B]">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={emailAddress}
                    onChange={(e) => handleEmailChange(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full rounded-lg border border-[#E2E8F0] px-4 py-2.5 focus:border-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-[#1E293B]">
                    Password / App Password *
                  </label>
                  <input
                    type="password"
                    value={imapPassword}
                    onChange={(e) => setImapPassword(e.target.value)}
                    placeholder="Your email password or app password"
                    className="w-full rounded-lg border border-[#E2E8F0] px-4 py-2.5 focus:border-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-[#1E293B]">
                    Display Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full rounded-lg border border-[#E2E8F0] px-4 py-2.5 focus:border-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-[#1E293B]">
                      IMAP Host *
                    </label>
                    <input
                      type="text"
                      value={imapHost}
                      onChange={(e) => setImapHost(e.target.value)}
                      placeholder="imap.example.com"
                      className="w-full rounded-lg border border-[#E2E8F0] px-4 py-2.5 focus:border-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-[#1E293B]">
                      IMAP Port
                    </label>
                    <input
                      type="number"
                      value={imapPort}
                      onChange={(e) => setImapPort(Number(e.target.value))}
                      className="w-full rounded-lg border border-[#E2E8F0] px-4 py-2.5 focus:border-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-[#1E293B]">
                      SMTP Host *
                    </label>
                    <input
                      type="text"
                      value={smtpHost}
                      onChange={(e) => setSmtpHost(e.target.value)}
                      placeholder="smtp.example.com"
                      className="w-full rounded-lg border border-[#E2E8F0] px-4 py-2.5 focus:border-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-[#1E293B]">
                      SMTP Port
                    </label>
                    <input
                      type="number"
                      value={smtpPort}
                      onChange={(e) => setSmtpPort(Number(e.target.value))}
                      className="w-full rounded-lg border border-[#E2E8F0] px-4 py-2.5 focus:border-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20"
                    />
                  </div>
                </div>

                {error && (
                  <div className="rounded-lg border border-[#EF4444]/20 bg-[#FEF2F2] p-3">
                    <p className="text-sm text-[#EF4444]">{error}</p>
                  </div>
                )}
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setStep('method')}
                  className="flex-1 rounded-lg border border-[#E2E8F0] px-4 py-2.5 font-medium text-[#64748B] hover:bg-[#F8FAFC]"
                >
                  Back
                </button>
                <button
                  onClick={handleIMAPSubmit}
                  disabled={connectIMAP.isPending}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#FF6B35] px-4 py-2.5 font-medium text-white hover:bg-[#E65A2C] disabled:opacity-50"
                >
                  {connectIMAP.isPending ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Connecting...
                    </>
                  ) : (
                    'Connect'
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {/* Success */}
          {step === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-6 text-center"
            >
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#F0FDF4]">
                <CheckIcon className="h-8 w-8 text-[#22C55E]" />
              </div>
              <h2 className="mb-2 text-lg font-bold text-[#1E293B]">Successfully Connected!</h2>
              <p className="text-[#64748B]">Your email account has been connected.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

// ==================== LINKEDIN WORKING HOURS MODAL ====================

const COMMON_TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Paris (CET)' },
  { value: 'Europe/Berlin', label: 'Berlin (CET)' },
  { value: 'Asia/Dubai', label: 'Dubai (GST)' },
  { value: 'Asia/Kolkata', label: 'India (IST)' },
  { value: 'Asia/Singapore', label: 'Singapore (SGT)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEDT)' },
];

const DAYS = [
  { value: 1, label: 'Monday', short: 'Mon' },
  { value: 2, label: 'Tuesday', short: 'Tue' },
  { value: 3, label: 'Wednesday', short: 'Wed' },
  { value: 4, label: 'Thursday', short: 'Thu' },
  { value: 5, label: 'Friday', short: 'Fri' },
  { value: 6, label: 'Saturday', short: 'Sat' },
  { value: 7, label: 'Sunday', short: 'Sun' },
];

function LinkedInWorkingHoursModal({
  account,
  onClose,
}: {
  account: LinkedInAccount;
  onClose: () => void;
}) {
  const updateAccount = useUpdateLinkedInAccount(account.id);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize working hours from account or defaults
  const [timezone, setTimezone] = useState(account.working_hours?.timezone || 'America/New_York');
  const [startTime, setStartTime] = useState(account.working_hours?.start || '09:00');
  const [endTime, setEndTime] = useState(account.working_hours?.end || '18:00');
  const [selectedDays, setSelectedDays] = useState<number[]>(
    account.working_hours?.days || [1, 2, 3, 4, 5]
  );

  // Get current time in selected timezone
  const getCurrentTimeInTimezone = () => {
    try {
      return new Date().toLocaleString('en-US', {
        timeZone: timezone,
        weekday: 'long',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return 'Invalid timezone';
    }
  };

  const handleToggleDay = (dayValue: number) => {
    setSelectedDays((prev) =>
      prev.includes(dayValue) ? prev.filter((d) => d !== dayValue) : [...prev, dayValue].sort()
    );
  };

  const handleSave = async () => {
    setError(null);

    if (selectedDays.length === 0) {
      setError('Please select at least one working day');
      return;
    }

    if (startTime >= endTime) {
      setError('End time must be after start time');
      return;
    }

    setIsSaving(true);

    try {
      await updateAccount.mutateAsync({
        working_hours: {
          timezone,
          start: startTime,
          end: endTime,
          days: selectedDays,
        },
      });
      onClose();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error?.response?.data?.detail || 'Failed to update working hours');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E2E8F0] px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-[#1E293B]">Configure Working Hours</h2>
            <p className="mt-1 text-sm text-[#64748B]">{account.name}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-[#64748B] hover:bg-[#F8FAFC]">
            <CloseIcon />
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[calc(100vh-200px)] overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Current Time Display */}
            <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
              <p className="text-sm font-medium text-[#64748B]">
                Current time in selected timezone
              </p>
              <p className="mt-1 text-lg font-bold text-[#1E293B]">{getCurrentTimeInTimezone()}</p>
            </div>

            {/* Timezone Selection */}
            <div>
              <label className="block text-sm font-medium text-[#1E293B]">Timezone</label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="mt-2 w-full rounded-lg border border-[#E2E8F0] px-4 py-2.5 text-[#1E293B] focus:border-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20"
              >
                {COMMON_TIMEZONES.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-xs text-[#64748B]">
                Choose your timezone so campaigns run during your local working hours
              </p>
            </div>

            {/* Working Hours */}
            <div>
              <label className="block text-sm font-medium text-[#1E293B]">Working Hours</label>
              <div className="mt-2 grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-[#64748B]">Start Time</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-[#E2E8F0] px-4 py-2.5 text-[#1E293B] focus:border-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#64748B]">End Time</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-[#E2E8F0] px-4 py-2.5 text-[#1E293B] focus:border-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20"
                  />
                </div>
              </div>
              <p className="mt-2 text-xs text-[#64748B]">
                LinkedIn actions will only be sent during these hours
              </p>
            </div>

            {/* Working Days */}
            <div>
              <label className="block text-sm font-medium text-[#1E293B]">Working Days</label>
              <div className="mt-2 flex flex-wrap gap-2">
                {DAYS.map((day) => {
                  const isSelected = selectedDays.includes(day.value);
                  return (
                    <button
                      key={day.value}
                      onClick={() => handleToggleDay(day.value)}
                      className={`rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
                        isSelected
                          ? 'border-[#FF6B35] bg-[#FF6B35] text-white'
                          : 'border-[#E2E8F0] bg-white text-[#64748B] hover:border-[#FF6B35]/50'
                      }`}
                    >
                      <span className="hidden sm:inline">{day.label}</span>
                      <span className="sm:hidden">{day.short}</span>
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-xs text-[#64748B]">
                Select the days when campaigns should run
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-start gap-3 rounded-xl border border-[#EF4444]/20 bg-[#FEF2F2] p-4">
                <WarningIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#EF4444]" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-[#991B1B]">Error</p>
                  <p className="text-xs text-[#DC2626]">{error}</p>
                </div>
              </div>
            )}

            {/* Info Box */}
            <div className="flex items-start gap-3 rounded-xl border border-[#3B82F6]/20 bg-[#EFF6FF] p-4">
              <InfoIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#3B82F6]" />
              <div className="flex-1 text-xs text-[#1E3A8A]">
                <p className="font-medium">How working hours work</p>
                <ul className="mt-2 list-inside list-disc space-y-1">
                  <li>Actions are only sent during your configured working hours</li>
                  <li>If no senders are available, campaigns pause until working hours resume</li>
                  <li>This helps maintain natural engagement patterns</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-[#E2E8F0] px-6 py-4">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2 font-medium text-[#64748B] disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="rounded-lg bg-[#FF6B35] px-6 py-2.5 font-medium text-white hover:bg-[#E85A2A] disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Working Hours'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ==================== ICONS ====================

function WarningIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      />
    </svg>
  );
}

function LinkedInIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function CookieIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10c0-.34-.02-.67-.05-1-.39.07-.79.1-1.2.1-3.87 0-7-3.13-7-7 0-.41.03-.81.1-1.2-.33-.03-.66-.05-1-.05-.34 0-.67.02-1 .05z"
      />
      <circle cx="8" cy="10" r="1" fill="currentColor" />
      <circle cx="12" cy="14" r="1" fill="currentColor" />
      <circle cx="16" cy="11" r="1" fill="currentColor" />
    </svg>
  );
}

function BackArrowIcon() {
  return (
    <svg
      className="h-5 w-5 text-[#64748B]"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  );
}

function ShieldIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg
      className={className}
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

function SmartphoneIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3"
      />
    </svg>
  );
}

function CheckIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
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

function WorkspaceIcon() {
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
        d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z"
      />
    </svg>
  );
}

function MembersIcon() {
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

function NotificationIcon() {
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
        d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
      />
    </svg>
  );
}

function BillingIcon() {
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
        d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z"
      />
    </svg>
  );
}

function IntegrationIcon() {
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
        d="M14.25 6.087c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.036-1.007-1.875-2.25-1.875s-2.25.84-2.25 1.875c0 .369.128.713.349 1.003.215.283.401.604.401.959v0a.64.64 0 01-.657.643 48.39 48.39 0 01-4.163-.3c.186 1.613.293 3.25.315 4.907a.656.656 0 01-.658.663v0c-.355 0-.676-.186-.959-.401a1.647 1.647 0 00-1.003-.349c-1.036 0-1.875 1.007-1.875 2.25s.84 2.25 1.875 2.25c.369 0 .713-.128 1.003-.349.283-.215.604-.401.959-.401v0c.31 0 .555.26.532.57a48.039 48.039 0 01-.642 5.056c1.518.19 3.058.309 4.616.354a.64.64 0 00.657-.643v0c0-.355-.186-.676-.401-.959a1.647 1.647 0 01-.349-1.003c0-1.035 1.008-1.875 2.25-1.875 1.243 0 2.25.84 2.25 1.875 0 .369-.128.713-.349 1.003-.215.283-.4.604-.4.959v0c0 .333.277.599.61.58a48.1 48.1 0 005.427-.63 48.05 48.05 0 00.582-4.717.532.532 0 00-.533-.57v0c-.355 0-.676.186-.959.401-.29.221-.634.349-1.003.349-1.035 0-1.875-1.007-1.875-2.25s.84-2.25 1.875-2.25c.37 0 .713.128 1.003.349.283.215.604.401.96.401v0a.656.656 0 00.658-.663 48.422 48.422 0 00-.37-5.36c-1.886.342-3.81.574-5.766.689a.578.578 0 01-.61-.58v0z"
      />
    </svg>
  );
}

function LogoutIcon() {
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
        d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"
      />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg
      className="h-5 w-5 text-[#64748B]"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      className={`h-4 w-4 ${className || ''}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
  );
}

function MoreIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
      />
    </svg>
  );
}

function CheckCircleIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function InfoIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
      />
    </svg>
  );
}

function CrownIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path d="M10 2l2.5 5 5.5.75-4 3.75 1 5.5L10 14.25 4.5 17l1-5.5-4-3.75L7 7z" />
    </svg>
  );
}

function ClockIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function MailIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
      />
    </svg>
  );
}

function MessageSquareIcon() {
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
        d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"
      />
    </svg>
  );
}

function DisconnectIcon() {
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
        d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
      />
    </svg>
  );
}

function CampaignIcon() {
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

function CalendarIcon() {
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
        d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
      />
    </svg>
  );
}

function ChartIcon() {
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

function QuestionIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"
      />
    </svg>
  );
}

function EmailIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      className={className}
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

function XIcon() {
  return (
    <svg
      className="h-5 w-5 text-[#64748B]"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function GmailIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fill="#EA4335"
        d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 010 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z"
      />
    </svg>
  );
}

function OutlookIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fill="#0078D4"
        d="M24 7.387v10.478c0 .23-.08.424-.238.576a.806.806 0 01-.59.234h-8.86v-6.521l1.83 1.184a.404.404 0 00.424.012l6.998-4.295v-.017l.198-.104a.236.236 0 00.238-.107zm0-1.58v.788l-7.455 4.578-2.233-1.449V5.75h8.86c.228 0 .42.076.578.228a.79.79 0 01.25.578v-.001zM14.312 5.75v16.5H1.03a.985.985 0 01-.72-.303A1.007 1.007 0 010 21.22V4.03c0-.283.103-.527.31-.732a.992.992 0 01.72-.297h13.282zm-7.24 12.75c1.143 0 2.072-.39 2.787-1.172.716-.781 1.074-1.797 1.074-3.047 0-1.266-.355-2.293-1.066-3.082-.711-.789-1.636-1.183-2.775-1.183-1.154 0-2.089.392-2.803 1.175-.715.783-1.072 1.803-1.072 3.059 0 1.25.354 2.266 1.063 3.047.709.781 1.64 1.172 2.793 1.172zm.04-6.531c.59 0 1.06.236 1.412.707.352.471.528 1.09.528 1.855 0 .782-.174 1.41-.52 1.887-.347.477-.82.715-1.42.715-.608 0-1.083-.234-1.426-.703-.342-.469-.513-1.092-.513-1.87 0-.797.172-1.425.516-1.884.343-.459.816-.688 1.42-.688z"
      />
    </svg>
  );
}

// CRM Integration Icons
function HubSpotIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.164 7.93V5.084a2.198 2.198 0 001.267-1.984 2.21 2.21 0 00-4.418 0c0 .9.545 1.678 1.321 2.02v2.79a6.125 6.125 0 00-3.126 1.236L5.93 3.61a2.36 2.36 0 00.112-.7 2.34 2.34 0 10-2.34 2.34c.424 0 .82-.114 1.162-.31l7.137 5.415a6.085 6.085 0 00-.67 2.78c0 .989.24 1.92.658 2.748l-2.19 2.19a1.95 1.95 0 00-.598-.095 1.961 1.961 0 101.961 1.961c0-.214-.035-.42-.098-.612l2.164-2.163a6.11 6.11 0 003.754 1.283 6.128 6.128 0 000-12.255 6.07 6.07 0 00-2.818.688zM17 15.545a3.128 3.128 0 110-6.256 3.128 3.128 0 010 6.256z" />
    </svg>
  );
}

function SalesforceIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M10.006 5.415a4.195 4.195 0 013.045-1.306c1.56 0 2.954.9 3.69 2.205.63-.3 1.35-.465 2.1-.465 2.85 0 5.159 2.34 5.159 5.22s-2.31 5.22-5.16 5.22c-.345 0-.69-.045-1.02-.12a3.93 3.93 0 01-3.54 2.22c-.555 0-1.08-.12-1.56-.33a4.68 4.68 0 01-4.11 2.49c-2.16 0-4.005-1.455-4.56-3.45a4.07 4.07 0 01-.72.06c-2.22 0-4.02-1.83-4.02-4.08 0-1.665.99-3.09 2.4-3.72a4.757 4.757 0 01-.165-1.23c0-2.58 2.055-4.665 4.59-4.665 1.5 0 2.835.72 3.69 1.845l-.015-.015z" />
    </svg>
  );
}

function PipedriveIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
    </svg>
  );
}

function ZapierIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M15.478 12.889l-2.711 2.71a3.47 3.47 0 01-.656-.656l2.711-2.711a3.424 3.424 0 01.656.657zm-6.3 6.3c.191.24.408.46.656.656l2.711-2.71a3.47 3.47 0 01-.657-.657l-2.71 2.711zm-.656-6.3a3.424 3.424 0 01.656-.657l-2.71-2.71a3.424 3.424 0 01-.657.656l2.711 2.711zm6.3-6.3a3.424 3.424 0 01-.656.656l2.71 2.711a3.424 3.424 0 01.657-.656l-2.711-2.711zM12 9.244c.465 0 .918.054 1.355.154l.868-3.244A7.7 7.7 0 0012 5.8a7.7 7.7 0 00-2.222.354l.867 3.244c.437-.1.89-.154 1.355-.154zm2.756 2.756c0-.465-.054-.918-.154-1.355l-3.244.867a3.854 3.854 0 000 .976l3.244.867c.1-.437.154-.89.154-1.355zm-2.756 2.756c-.465 0-.918-.054-1.355-.154l-.867 3.244a7.7 7.7 0 002.222.354 7.7 7.7 0 002.222-.354l-.867-3.244a3.854 3.854 0 01-1.355.154zM9.244 12c0 .465.054.918.154 1.355l3.244-.867a3.854 3.854 0 000-.976l-3.244-.867A3.854 3.854 0 009.244 12z" />
    </svg>
  );
}

function MakeIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="12" r="10" fillOpacity="0.2" />
      <circle cx="12" cy="12" r="6" />
    </svg>
  );
}

function SlackIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M5.042 15.165a2.528 2.528 0 01-2.52 2.523A2.528 2.528 0 010 15.165a2.527 2.527 0 012.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 012.521-2.52 2.527 2.527 0 012.521 2.52v6.313A2.528 2.528 0 018.834 24a2.528 2.528 0 01-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 01-2.521-2.52A2.528 2.528 0 018.834 0a2.528 2.528 0 012.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 012.521 2.521 2.528 2.528 0 01-2.521 2.521H2.522A2.528 2.528 0 010 8.834a2.528 2.528 0 012.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 012.522-2.521A2.528 2.528 0 0124 8.834a2.528 2.528 0 01-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 01-2.523 2.521 2.527 2.527 0 01-2.52-2.521V2.522A2.527 2.527 0 0115.165 0a2.528 2.528 0 012.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 012.523 2.522A2.528 2.528 0 0115.165 24a2.527 2.527 0 01-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 01-2.52-2.523 2.526 2.526 0 012.52-2.52h6.313A2.527 2.527 0 0124 15.165a2.528 2.528 0 01-2.522 2.523h-6.313z" />
    </svg>
  );
}

function WebhookIcon() {
  return (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244"
      />
    </svg>
  );
}
