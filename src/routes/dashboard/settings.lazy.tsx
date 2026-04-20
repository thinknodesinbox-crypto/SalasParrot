import { useNavigate, createLazyFileRoute } from '@tanstack/react-router';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth';
import {
  useWorkspaces,
  useWorkspace,
  useCreateWorkspace,
  useUpdateWorkspace,
  useWorkspaceMembers,
  useRemoveWorkspaceMember,
  useBillingOverview,
  useCreatePortalSession,
  useUpdateGrowthSenders,
  useUpdateAgencyExtraSenders,
  useCreateGrowthCheckout,
  useCreateAgencyCheckout,
  useEmailAccounts,
  useLinkedInAccounts,
  useUpdateLinkedInAccount,
  useChangePassword,
  useConnectLinkedInWithCredentials,
  useConnectLinkedInWithCookie,
  useSolveLinkedInCheckpoint,
  usePollLinkedInStatus,
  useConnectEmailIMAP,
  useInitGoogleOAuth,
  useInitMicrosoftOAuth,
  useInitGmailHostedAuth,
  useEmailAuthConfig,
  useCalendarAccounts,
  useDeleteCalendarAccount,
  useConnectCalendarFromEmail,
  useInitCalendarAuth,
  useUpdateWorkspaceContext,
  usePreviewWebsiteContext,
  useAssistantDeliverySettings,
  useAssistantUsage,
  useUpdateAssistantDeliverySettings,
  useRunAssistantDailySummary,
  useAssistantWhatsAppAccounts,
  useAssistantWhatsAppBinding,
  useUpdateAssistantWhatsAppBinding,
  useDeleteAssistantWhatsAppBinding,
  useUpdateWorkspaceOnboarding,
  useWorkspaceOnboarding,
} from '@/lib/hooks/queries';
import { api, getErrorMessage } from '@/lib/api';
import {
  useWorkspaceInvitations,
  useCreateInvitation,
  useRevokeInvitation,
  useResendInvitation,
} from '@/lib/hooks/queries/useInvitations';
import {
  useWebhooks,
  useCreateWebhook,
  useUpdateWebhook,
  useDeleteWebhook,
  useTestWebhook,
  useWebhookEventTypes,
} from '@/lib/hooks/queries/useWebhooks';
import type { Webhook, WebhookCreate } from '@/lib/hooks/queries/useWebhooks';
import {
  useAPIKeys,
  useAPIKeyScopes,
  useCreateAPIKey,
  useRevokeAPIKey,
  useDeleteAPIKey,
} from '@/lib/hooks/queries/useAPIKeys';
import {
  useHubSpotStatus,
  useConnectHubSpot,
  useDisconnectHubSpot,
  useUpdateHubSpotSettings,
  useHubSpotSyncLogs,
  useTestHubSpotConnection,
} from '@/lib/hooks/queries/useHubSpot';
import {
  useSalesforceStatus,
  useConnectSalesforce,
  useDisconnectSalesforce,
  useUpdateSalesforceSettings,
  useSalesforceSyncLogs,
  useTestSalesforceConnection,
} from '@/lib/hooks/queries/useSalesforce';
import {
  usePipedriveStatus,
  useConnectPipedrive,
  useDisconnectPipedrive,
  useUpdatePipedriveSettings,
  usePipedriveSyncLogs,
  useTestPipedriveConnection,
} from '@/lib/hooks/queries/usePipedrive';
import {
  useCloseStatus,
  useConnectClose,
  useDisconnectClose,
  useUpdateCloseSettings,
  useCloseSyncLogs,
  useTestCloseConnection,
} from '@/lib/hooks/queries/useClose';
import {
  useSlackStatus,
  useSlackChannels,
  useConnectSlack,
  useDisconnectSlack,
  useUpdateSlackSettings,
  useSlackNotificationLogs,
  useTestSlackConnection,
  useSendTestSlackNotification,
} from '@/lib/hooks/queries/useSlack';
import type {
  CheckpointType,
  OnboardingStep,
  Workspace,
  LinkedInAccount,
  BillingOverview,
  CalendarAccount,
  CalendarProvider,
} from '@/lib/types';
import { useWorkspaceStore } from '@/lib/workspace';

export const Route = createLazyFileRoute('/dashboard/settings')({
  component: SettingsPage,
});

type SettingsTab =
  | 'profile'
  | 'workspaces'
  | 'members'
  | 'ai_agent'
  | 'notifications'
  | 'billing'
  | 'integrations';

function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [mobileTabsOpen, setMobileTabsOpen] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const { logout } = useAuth();
  const navigate = useNavigate();

  // Handle OAuth callback status from URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const status = urlParams.get('status');
    const message = urlParams.get('message');
    const tab = urlParams.get('tab');

    if (status === 'success') {
      const accountType = tab === 'calendar' ? 'Calendar' : 'Email';
      setNotification({
        type: 'success',
        message: `${accountType} account connected successfully!`,
      });
      setActiveTab('integrations');
    } else if (status === 'error') {
      const accountType = tab === 'calendar' ? 'calendar' : 'email';
      setNotification({
        type: 'error',
        message: message || `Failed to connect ${accountType} account`,
      });
      setActiveTab('integrations');
    }

    // Clear URL params without page reload
    if (status) {
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, []);

  // Auto-dismiss notification
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleLogout = () => {
    logout();
    navigate({ to: '/login' } as never);
  };

  const tabs: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
    { id: 'profile', label: 'Profile Settings', icon: <SettingsIcon /> },
    { id: 'workspaces', label: 'Workspaces', icon: <WorkspaceIcon /> },
    { id: 'members', label: 'Members', icon: <MembersIcon /> },
    { id: 'ai_agent', label: 'Parrot Brain', icon: <AIAgentIcon /> },
    { id: 'notifications', label: 'Notifications', icon: <NotificationIcon /> },
    { id: 'billing', label: 'Billing', icon: <BillingIcon /> },
    { id: 'integrations', label: 'Integrations', icon: <IntegrationIcon /> },
  ];

  const activeTabLabel = tabs.find((t) => t.id === activeTab)?.label || 'Settings';

  return (
    <div className="flex min-h-[calc(100vh-7rem)] flex-col gap-0 lg:flex-row">
      {/* Notification Toast */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed left-1/2 top-4 z-50 -translate-x-1/2 rounded-lg px-4 py-3 shadow-lg ${
              notification.type === 'success'
                ? 'border border-[#86EFAC] bg-[#F0FDF4] text-[#166534]'
                : 'border border-[#FECACA] bg-[#FEF2F2] text-[#DC2626]'
            }`}
          >
            <div className="flex items-center gap-2">
              {notification.type === 'success' ? (
                <CheckIcon className="h-5 w-5" />
              ) : (
                <WarningIcon className="h-5 w-5" />
              )}
              <span className="font-medium">{notification.message}</span>
              <button
                onClick={() => setNotification(null)}
                className="ml-2 rounded p-1 hover:bg-black/5"
              >
                <span className="text-lg leading-none">&times;</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
            {activeTab === 'ai_agent' && <AIAgentSettings key="ai_agent" />}
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
  const [showBuySeatsModal, setShowBuySeatsModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingWorkspace, setEditingWorkspace] = useState<Workspace | null>(null);
  const [setupWorkspace, setSetupWorkspace] = useState<Workspace | null>(null);

  // Fetch workspaces from API
  const { data: workspacesData = [], isLoading, error, refetch } = useWorkspaces();

  // Fetch billing data
  const {
    data: billingData,
    isLoading: isBillingLoading,
    error: billingError,
  } = useBillingOverview();

  // Filter workspaces by search query
  const workspaces = workspacesData.filter((w) =>
    w.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get seat counts from billing data
  const totalSeats = billingData?.sender_count ?? 0;
  const usedSeats = billingData?.linkedin_accounts_connected ?? 0;
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
              {billingError ? (
                <span className="mt-2 inline-block rounded-full bg-[#FEF2F2] px-3 py-1 text-sm font-medium text-[#EF4444]">
                  Failed to load billing
                </span>
              ) : (
                <span className="mt-2 inline-block rounded-full bg-[#F0FDF4] px-3 py-1 text-sm font-medium text-[#22C55E]">
                  {availableSeats} available seats
                </span>
              )}
            </div>
            <button
              onClick={() => setShowBuySeatsModal(true)}
              disabled={!billingData || isBillingLoading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#3B82F6] px-4 py-2.5 font-medium text-white transition-colors hover:bg-[#2563EB] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              <PlusIcon />
              {isBillingLoading ? 'Loading...' : 'Buy more seats'}
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
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setSetupWorkspace(workspace)}
                        className="rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm font-medium text-[#64748B] hover:bg-[#F8FAFC]"
                      >
                        Setup
                      </button>
                      <button
                        onClick={() => setEditingWorkspace(workspace)}
                        className="rounded-lg p-2 text-[#64748B] hover:bg-[#F1F5F9]"
                        title="Configure working hours"
                      >
                        <SettingsIcon />
                      </button>
                    </div>
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
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSetupWorkspace(workspace)}
                    className="rounded-lg border border-[#E2E8F0] px-3 py-1.5 text-sm font-medium text-[#64748B] hover:bg-[#F8FAFC]"
                  >
                    Setup
                  </button>
                  <button
                    onClick={() => setEditingWorkspace(workspace)}
                    className="rounded-lg p-2 text-[#64748B] hover:bg-[#F1F5F9]"
                    title="Configure working hours"
                  >
                    <SettingsIcon />
                  </button>
                </div>
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
        {setupWorkspace && (
          <WorkspaceSetupModal workspace={setupWorkspace} onClose={() => setSetupWorkspace(null)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editingWorkspace && (
          <WorkspaceWorkingHoursModal
            workspace={editingWorkspace}
            onClose={() => setEditingWorkspace(null)}
          />
        )}
      </AnimatePresence>

      {/* Buy More Seats Modal */}
      <AnimatePresence>
        {showBuySeatsModal && billingData && (
          <BuySeatsModal billingData={billingData} onClose={() => setShowBuySeatsModal(false)} />
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

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
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
    </motion.div>,
    document.body
  );
}

function WorkspaceSetupModal({
  workspace,
  onClose,
}: {
  workspace: Workspace;
  onClose: () => void;
}) {
  const { data: onboarding } = useWorkspaceOnboarding(workspace.id);
  const updateContext = useUpdateWorkspaceContext(workspace.id);
  const updateOnboarding = useUpdateWorkspaceOnboarding(workspace.id);
  const [websiteUrl, setWebsiteUrl] = useState(workspace.website_url || '');
  const [businessBlurb, setBusinessBlurb] = useState(workspace.business_blurb || '');
  const [icp, setIcp] = useState(workspace.icp || '');
  const [outreachIntent, setOutreachIntent] = useState(workspace.outreach_intent || '');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    setWebsiteUrl(workspace.website_url || '');
    setBusinessBlurb(workspace.business_blurb || '');
    setIcp(workspace.icp || '');
    setOutreachIntent(workspace.outreach_intent || '');
  }, [workspace]);

  const saveContext = async () => {
    setError(null);
    setSuccess(null);
    try {
      await updateContext.mutateAsync({
        website_url: websiteUrl.trim() || null,
        business_blurb: businessBlurb.trim() || null,
        icp: icp.trim() || null,
        outreach_intent: outreachIntent.trim() || null,
      });
      setSuccess('Workspace context saved.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save workspace context');
    }
  };

  const reopenOnboarding = async (step: OnboardingStep) => {
    setError(null);
    setSuccess(null);
    try {
      await updateOnboarding.mutateAsync({ current_step: step });
      setSuccess('Onboarding will show again on the dashboard.');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reopen onboarding');
    }
  };

  const isPending = updateContext.isPending || updateOnboarding.isPending;
  const canManageSetup = onboarding?.can_manage_setup ?? false;

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-[#1E293B]">Workspace setup</h2>
            <p className="mt-1 text-sm text-[#64748B]">
              Update reusable business context and reopen onboarding when you want to guide the
              workspace through setup again.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg px-3 py-2 text-sm font-medium text-[#64748B] hover:bg-[#F8FAFC]"
          >
            Close
          </button>
        </div>

        <div className="mt-6 grid gap-4">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-[#1E293B]">Website URL</span>
            <input
              type="url"
              value={websiteUrl}
              onChange={(event) => setWebsiteUrl(event.target.value)}
              placeholder="https://yourcompany.com"
              className="w-full rounded-lg border border-[#E2E8F0] px-4 py-3 focus:border-[#3B82F6] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/20"
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-[#1E293B]">
              Short business blurb
            </span>
            <textarea
              value={businessBlurb}
              onChange={(event) => setBusinessBlurb(event.target.value)}
              rows={3}
              placeholder="What do you sell and why does it matter?"
              className="w-full rounded-lg border border-[#E2E8F0] px-4 py-3 focus:border-[#3B82F6] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/20"
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-[#1E293B]">
              Ideal customer profile
            </span>
            <textarea
              value={icp}
              onChange={(event) => setIcp(event.target.value)}
              rows={3}
              placeholder="Who should Parrot target?"
              className="w-full rounded-lg border border-[#E2E8F0] px-4 py-3 focus:border-[#3B82F6] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/20"
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-[#1E293B]">Outreach intent</span>
            <textarea
              value={outreachIntent}
              onChange={(event) => setOutreachIntent(event.target.value)}
              rows={3}
              placeholder="What outcome should outreach drive?"
              className="w-full rounded-lg border border-[#E2E8F0] px-4 py-3 focus:border-[#3B82F6] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/20"
            />
          </label>
        </div>

        {(error || success) && (
          <div
            className={`mt-4 rounded-lg border p-3 text-sm ${
              error
                ? 'border-[#FECACA] bg-[#FEF2F2] text-[#DC2626]'
                : 'border-[#BBF7D0] bg-[#F0FDF4] text-[#166534]'
            }`}
          >
            {error || success}
          </div>
        )}

        <div className="mt-6 flex flex-col gap-4 border-t border-[#E2E8F0] pt-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="font-semibold text-[#1E293B]">Save context</h3>
              <p className="text-sm text-[#64748B]">
                This updates the workspace data Parrot can reuse across campaigns and agents.
              </p>
            </div>
            <button
              onClick={saveContext}
              disabled={isPending || !canManageSetup}
              className="rounded-lg bg-[#3B82F6] px-5 py-2.5 font-medium text-white hover:bg-[#2563EB] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Save context
            </button>
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="font-semibold text-[#1E293B]">Resume onboarding</h3>
              <p className="text-sm text-[#64748B]">
                Reopen the dashboard modal from any step. Useful after someone skipped setup.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => reopenOnboarding('business_context')}
                disabled={isPending || !canManageSetup}
                className="rounded-lg border border-[#E2E8F0] px-4 py-2 text-sm font-medium text-[#64748B] hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Start at step 1
              </button>
              <button
                onClick={() => reopenOnboarding('channel_selection')}
                disabled={isPending || !canManageSetup}
                className="rounded-lg border border-[#E2E8F0] px-4 py-2 text-sm font-medium text-[#64748B] hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Start at step 2
              </button>
              <button
                onClick={() => reopenOnboarding('channel_connection')}
                disabled={isPending || !canManageSetup}
                className="rounded-lg border border-[#E2E8F0] px-4 py-2 text-sm font-medium text-[#64748B] hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Start at step 3
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>,
    document.body
  );
}

const PRICE_PER_SENDER = 99;

function BuySeatsModal({
  billingData,
  onClose,
}: {
  billingData: BillingOverview;
  onClose: () => void;
}) {
  const [additionalSeats, setAdditionalSeats] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const updateGrowthSenders = useUpdateGrowthSenders();
  const updateAgencyExtraSenders = useUpdateAgencyExtraSenders();
  const createGrowthCheckout = useCreateGrowthCheckout();
  const createAgencyCheckout = useCreateAgencyCheckout();

  const isAgency = billingData.plan === 'agency';
  const currentSeats = billingData.sender_count;
  const newTotalSeats = currentSeats + additionalSeats;

  // Check if user has an active subscription
  const hasActiveSubscription = billingData.subscription?.status === 'active';

  // Calculate price impact
  let newMonthlyCost: number;
  let additionalCost: number;

  if (isAgency) {
    // Agency: $20/month per extra sender beyond 30 included
    const currentExtraSenders = billingData.extra_senders;
    const newExtraSenders = currentExtraSenders + additionalSeats;
    newMonthlyCost = 999 + newExtraSenders * 20;
    additionalCost = additionalSeats * 20;
  } else {
    // Growth: Flat $99/sender
    newMonthlyCost = newTotalSeats * PRICE_PER_SENDER;
    additionalCost = additionalSeats * PRICE_PER_SENDER;
  }

  const handlePurchase = async () => {
    setError(null);
    try {
      if (hasActiveSubscription) {
        // User has active subscription - update it
        if (isAgency) {
          await updateAgencyExtraSenders.mutateAsync({
            extra_sender_count: billingData.extra_senders + additionalSeats,
          });
        } else {
          await updateGrowthSenders.mutateAsync({
            sender_count: newTotalSeats,
          });
        }
        onClose();
      } else {
        // User doesn't have subscription (e.g., partner) - redirect to checkout
        let checkoutUrl: string;
        if (isAgency) {
          const result = await createAgencyCheckout.mutateAsync({});
          checkoutUrl = result.checkout_url;
        } else {
          const result = await createGrowthCheckout.mutateAsync({
            sender_count: newTotalSeats,
          });
          checkoutUrl = result.checkout_url;
        }
        // Redirect to Stripe checkout
        window.location.href = checkoutUrl;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update subscription');
    }
  };

  const isPending =
    updateGrowthSenders.isPending ||
    updateAgencyExtraSenders.isPending ||
    createGrowthCheckout.isPending ||
    createAgencyCheckout.isPending;

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
      >
        <h2 className="mb-2 text-lg font-bold text-[#1E293B]">Buy more seats</h2>
        <p className="mb-6 text-sm text-[#64748B]">
          Add more seats to connect additional LinkedIn accounts.
        </p>

        {!hasActiveSubscription && (
          <div className="mb-6 rounded-lg bg-[#FEF3C7] p-3">
            <p className="text-sm text-[#92400E]">
              You'll be redirected to checkout to set up your subscription.
            </p>
          </div>
        )}

        {/* Current plan info */}
        <div className="mb-6 rounded-lg bg-[#F8FAFC] p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-[#64748B]">Current plan</span>
            <span className="font-medium capitalize text-[#1E293B]">{billingData.plan}</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-sm">
            <span className="text-[#64748B]">Current seats</span>
            <span className="font-medium text-[#1E293B]">{currentSeats}</span>
          </div>
        </div>

        {/* Seat selector */}
        <div className="mb-6">
          <label className="mb-2 block text-sm font-medium text-[#1E293B]">
            Additional seats to add
          </label>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setAdditionalSeats(Math.max(1, additionalSeats - 1))}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#E2E8F0] text-lg font-medium text-[#64748B] transition-all hover:border-[#3B82F6] hover:text-[#3B82F6]"
            >
              −
            </button>
            <span className="w-12 text-center text-2xl font-bold text-[#1E293B]">
              {additionalSeats}
            </span>
            <button
              onClick={() => setAdditionalSeats(Math.min(50, additionalSeats + 1))}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#E2E8F0] text-lg font-medium text-[#64748B] transition-all hover:border-[#3B82F6] hover:text-[#3B82F6]"
            >
              +
            </button>
          </div>
        </div>

        {/* Price summary */}
        <div className="mb-6 rounded-lg border border-[#E2E8F0] p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-[#64748B]">New total seats</span>
            <span className="font-medium text-[#1E293B]">{newTotalSeats}</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-sm">
            <span className="text-[#64748B]">Additional cost</span>
            <span className="font-medium text-[#22C55E]">+${additionalCost}/mo</span>
          </div>
          <div className="mt-3 border-t border-[#E2E8F0] pt-3">
            <div className="flex items-center justify-between">
              <span className="font-medium text-[#1E293B]">New monthly total</span>
              <span className="text-xl font-bold text-[#1E293B]">${newMonthlyCost}/mo</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-[#FEF2F2] p-3">
            <p className="text-sm text-[#EF4444]">{error}</p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isPending}
            className="flex-1 rounded-lg border border-[#E2E8F0] px-4 py-2.5 font-medium text-[#64748B] hover:bg-[#F8FAFC] disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handlePurchase}
            disabled={isPending}
            className="flex-1 rounded-lg bg-[#3B82F6] px-4 py-2.5 font-medium text-white hover:bg-[#2563EB] disabled:opacity-50"
          >
            {isPending
              ? 'Processing...'
              : hasActiveSubscription
                ? `Add ${additionalSeats} seat${additionalSeats > 1 ? 's' : ''}`
                : `Subscribe with ${newTotalSeats} seat${newTotalSeats > 1 ? 's' : ''}`}
          </button>
        </div>
      </motion.div>
    </motion.div>,
    document.body
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

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
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
    </motion.div>,
    document.body
  );
}

// ==================== MEMBERS SETTINGS ====================
function MembersSettings() {
  const { user } = useAuth();
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>('');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Fetch workspaces for the dropdown
  const { data: workspaces = [] } = useWorkspaces();

  // Auto-select first workspace when loaded
  useEffect(() => {
    if (workspaces.length > 0 && !selectedWorkspaceId) {
      setSelectedWorkspaceId(workspaces[0].id);
    }
  }, [workspaces, selectedWorkspaceId]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
        setMenuPosition(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle opening the menu with position calculation
  const handleOpenMenu = (memberId: string, buttonElement: HTMLButtonElement) => {
    if (openMenuId === memberId) {
      setOpenMenuId(null);
      setMenuPosition(null);
    } else {
      const rect = buttonElement.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.right - 192 + window.scrollX, // 192px = w-48
      });
      setOpenMenuId(memberId);
    }
  };

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
  const removeMember = useRemoveWorkspaceMember(selectedWorkspaceId);

  // Check if current user is admin in this workspace
  const currentUserMember = membersData.find((m) => m.user_id === user?.id);
  const isCurrentUserAdmin = currentUserMember?.role === 'admin';

  // Handle role change
  const handleRoleChange = async (memberId: string, newRole: 'admin' | 'member') => {
    setOpenMenuId(null);
    try {
      await api.patch(`/workspaces/${selectedWorkspaceId}/members/${memberId}`, { role: newRole });
      refetch();
    } catch {
      // Error handled silently
    }
  };

  // Handle member removal
  const handleRemoveMember = async (memberId: string, memberName: string) => {
    setOpenMenuId(null);
    if (
      confirm(`Are you sure you want to remove ${memberName || 'this member'} from the workspace?`)
    ) {
      try {
        await removeMember.mutateAsync(memberId);
      } catch {
        // Error handled by mutation
      }
    }
  };

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
                    {isCurrentUserAdmin && member.user_id !== user?.id && (
                      <button
                        onClick={(e) => handleOpenMenu(member.id, e.currentTarget)}
                        className="rounded-lg p-2 text-[#64748B] hover:bg-[#F1F5F9]"
                      >
                        <MoreIcon />
                      </button>
                    )}
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
                {isCurrentUserAdmin && member.user_id !== user?.id && (
                  <button
                    onClick={(e) => handleOpenMenu(member.id, e.currentTarget)}
                    className="flex-shrink-0 rounded-lg p-2 text-[#64748B] hover:bg-[#F1F5F9]"
                  >
                    <MoreIcon />
                  </button>
                )}
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

      {/* Member Actions Dropdown Menu (Portal) */}
      {openMenuId &&
        menuPosition &&
        createPortal(
          <div
            ref={menuRef}
            className="fixed z-50 w-48 overflow-hidden rounded-lg border border-[#E2E8F0] bg-white shadow-lg"
            style={{ top: menuPosition.top, left: menuPosition.left }}
          >
            <div className="py-1">
              {(() => {
                const member = members.find((m) => m.id === openMenuId);
                if (!member) return null;
                return (
                  <>
                    <button
                      onClick={() =>
                        handleRoleChange(member.id, member.role === 'admin' ? 'member' : 'admin')
                      }
                      className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-[#1E293B] hover:bg-[#F8FAFC]"
                    >
                      {member.role === 'admin' ? (
                        <>
                          <UserIcon className="h-4 w-4" />
                          Change to Member
                        </>
                      ) : (
                        <>
                          <CrownIcon className="h-4 w-4" />
                          Make Admin
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleRemoveMember(member.id, member.user_name || '')}
                      className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-[#EF4444] hover:bg-[#FEF2F2]"
                    >
                      <TrashIcon className="h-4 w-4" />
                      Remove from Workspace
                    </button>
                  </>
                );
              })()}
            </div>
          </div>,
          document.body
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

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
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
    </motion.div>,
    document.body
  );
}

// ==================== AI AGENT SETTINGS ====================
function AIAgentSettings() {
  const { data: workspaces = [], isLoading: isLoadingWorkspaces } = useWorkspaces();
  const currentWorkspaceId = useWorkspaceStore((s) => s.currentWorkspaceId);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>('');
  const [isSavingDefaults, setIsSavingDefaults] = useState(false);
  const [defaultsError, setDefaultsError] = useState<string | null>(null);
  const [defaultsSuccess, setDefaultsSuccess] = useState(false);
  const [contextError, setContextError] = useState<string | null>(null);
  const [contextSuccess, setContextSuccess] = useState<string | null>(null);
  const [deliveryError, setDeliveryError] = useState<string | null>(null);
  const [deliverySuccess, setDeliverySuccess] = useState<string | null>(null);
  const [whatsAppError, setWhatsAppError] = useState<string | null>(null);
  const [whatsAppSuccess, setWhatsAppSuccess] = useState<string | null>(null);

  // Prefer the current workspace, then fall back to the first available one.
  useEffect(() => {
    if (currentWorkspaceId && workspaces.some((workspace) => workspace.id === currentWorkspaceId)) {
      setSelectedWorkspaceId(currentWorkspaceId);
      return;
    }
    if (workspaces.length > 0 && !selectedWorkspaceId) {
      setSelectedWorkspaceId(workspaces[0].id);
    }
  }, [currentWorkspaceId, workspaces, selectedWorkspaceId]);

  const { data: workspace } = useWorkspace(selectedWorkspaceId);
  const updateWorkspace = useUpdateWorkspace(selectedWorkspaceId);
  const updateWorkspaceContext = useUpdateWorkspaceContext(selectedWorkspaceId);
  const previewWebsiteContext = usePreviewWebsiteContext(selectedWorkspaceId);
  const { data: deliverySettings } = useAssistantDeliverySettings(selectedWorkspaceId);
  const { data: assistantUsage } = useAssistantUsage(selectedWorkspaceId);
  const updateDeliverySettings = useUpdateAssistantDeliverySettings(selectedWorkspaceId);
  const runDailySummary = useRunAssistantDailySummary(selectedWorkspaceId);
  const { data: whatsappAccounts = [] } = useAssistantWhatsAppAccounts(selectedWorkspaceId);
  const { data: whatsappBinding } = useAssistantWhatsAppBinding(selectedWorkspaceId);
  const updateWhatsAppBinding = useUpdateAssistantWhatsAppBinding(selectedWorkspaceId);
  const deleteWhatsAppBinding = useDeleteAssistantWhatsAppBinding(selectedWorkspaceId);

  // Form state — reset when workspace changes
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [businessBlurb, setBusinessBlurb] = useState('');
  const [icp, setIcp] = useState('');
  const [outreachIntent, setOutreachIntent] = useState('');
  const [brandTone, setBrandTone] = useState('');
  const [valueProposition, setValueProposition] = useState('');
  const [ctaPreference, setCtaPreference] = useState('');
  const [replyGuardrails, setReplyGuardrails] = useState('');
  const [forbiddenClaims, setForbiddenClaims] = useState('');
  const [agentGoal, setAgentGoal] = useState('');
  const [agentTone, setAgentTone] = useState<'professional' | 'friendly' | 'casual'>(
    'professional'
  );
  const [agentCompanyName, setAgentCompanyName] = useState('');
  const [agentCompanyContext, setAgentCompanyContext] = useState('');
  const [agentProductDescription, setAgentProductDescription] = useState('');
  const [agentSchedulingLink, setAgentSchedulingLink] = useState('');
  const [agentSenderTitle, setAgentSenderTitle] = useState('');
  const [agentCustomInstructions, setAgentCustomInstructions] = useState('');
  const [dailySummaryEnabled, setDailySummaryEnabled] = useState(true);
  const [deliveryChannel, setDeliveryChannel] = useState<'dashboard' | 'whatsapp' | 'both'>(
    'dashboard'
  );
  const [dailySummaryTime, setDailySummaryTime] = useState('09:00');
  const [deliveryTimezone, setDeliveryTimezone] = useState('America/New_York');
  const [includeCampaignHealth, setIncludeCampaignHealth] = useState(true);
  const [includeSenderHealth, setIncludeSenderHealth] = useState(true);
  const [includeInboxSummary, setIncludeInboxSummary] = useState(true);
  const [includeWorkspaceGaps, setIncludeWorkspaceGaps] = useState(true);
  const [whatsAppDailyLimit, setWhatsAppDailyLimit] = useState('100');
  const [voiceDailyMinutesLimit, setVoiceDailyMinutesLimit] = useState('30');
  const [monthlyTokenAlertThreshold, setMonthlyTokenAlertThreshold] = useState('200000');
  const [selectedWhatsAppAccountId, setSelectedWhatsAppAccountId] = useState('');

  // Sync form state when workspace data loads or changes
  useEffect(() => {
    if (workspace) {
      setWebsiteUrl(workspace.website_url || '');
      setBusinessBlurb(workspace.business_blurb || '');
      setIcp(workspace.icp || '');
      setOutreachIntent(workspace.outreach_intent || '');
      setBrandTone(workspace.brand_tone || '');
      setValueProposition(workspace.value_proposition || '');
      setCtaPreference(workspace.cta_preference || '');
      setReplyGuardrails(workspace.reply_guardrails || '');
      setForbiddenClaims(workspace.forbidden_claims || '');
      const d = workspace.agent_defaults || {};
      setAgentGoal(d.goal || '');
      setAgentTone(d.tone || 'professional');
      setAgentCompanyName(d.company_name || '');
      setAgentCompanyContext(d.company_context || '');
      setAgentProductDescription(d.product_description || '');
      setAgentSchedulingLink(d.scheduling_link || '');
      setAgentSenderTitle(d.sender_title || '');
      setAgentCustomInstructions(d.custom_instructions || '');
      setDefaultsError(null);
      setDefaultsSuccess(false);
      setContextError(null);
      setContextSuccess(null);
      setDeliveryError(null);
      setDeliverySuccess(null);
      setWhatsAppError(null);
      setWhatsAppSuccess(null);
    }
  }, [workspace]);

  useEffect(() => {
    if (deliverySettings) {
      setDailySummaryEnabled(deliverySettings.daily_summary_enabled);
      setDeliveryChannel(deliverySettings.delivery_channel);
      setDailySummaryTime(deliverySettings.daily_summary_time);
      setDeliveryTimezone(deliverySettings.timezone);
      setIncludeCampaignHealth(deliverySettings.include_campaign_health);
      setIncludeSenderHealth(deliverySettings.include_sender_health);
      setIncludeInboxSummary(deliverySettings.include_inbox_summary);
      setIncludeWorkspaceGaps(deliverySettings.include_workspace_gaps);
      setWhatsAppDailyLimit(String(deliverySettings.whatsapp_daily_interaction_limit));
      setVoiceDailyMinutesLimit(String(deliverySettings.voice_daily_minutes_limit));
      setMonthlyTokenAlertThreshold(String(deliverySettings.monthly_token_alert_threshold));
    } else if (workspace?.working_hours?.timezone) {
      setDeliveryTimezone(workspace.working_hours.timezone);
    }
  }, [deliverySettings, workspace]);

  useEffect(() => {
    if (whatsappBinding) {
      setSelectedWhatsAppAccountId(whatsappBinding.unipile_account_id);
      return;
    }
    if (!selectedWhatsAppAccountId && whatsappAccounts.length > 0) {
      setSelectedWhatsAppAccountId(whatsappAccounts[0].unipile_account_id);
    }
  }, [whatsappBinding, whatsappAccounts, selectedWhatsAppAccountId]);

  const handleAnalyzeWebsite = async () => {
    setContextError(null);
    setContextSuccess(null);

    if (!selectedWorkspaceId || !websiteUrl.trim()) {
      setContextError('Enter a website URL before running analysis.');
      return;
    }

    try {
      const preview = await previewWebsiteContext.mutateAsync({
        website_url: websiteUrl.trim(),
      });
      setBusinessBlurb(preview.business_blurb || '');
      setIcp(preview.icp || '');
      setOutreachIntent(preview.outreach_intent || '');
      setContextSuccess('Website analysis applied. Review the fields before saving.');
    } catch (err) {
      setContextError(err instanceof Error ? err.message : 'Failed to analyze website');
    }
  };

  const handleSaveContext = async () => {
    setContextError(null);
    setContextSuccess(null);

    try {
      await updateWorkspaceContext.mutateAsync({
        website_url: websiteUrl.trim() || null,
        business_blurb: businessBlurb.trim() || null,
        icp: icp.trim() || null,
        outreach_intent: outreachIntent.trim() || null,
        brand_tone: brandTone.trim() || null,
        value_proposition: valueProposition.trim() || null,
        cta_preference: ctaPreference.trim() || null,
        reply_guardrails: replyGuardrails.trim() || null,
        forbidden_claims: forbiddenClaims.trim() || null,
      });
      setContextSuccess('Business context saved.');
    } catch (err) {
      setContextError(err instanceof Error ? err.message : 'Failed to save business context');
    }
  };

  const handleSave = async () => {
    setDefaultsError(null);
    setDefaultsSuccess(false);
    setIsSavingDefaults(true);

    try {
      await updateWorkspace.mutateAsync({
        agent_defaults: {
          goal: agentGoal,
          tone: agentTone,
          company_name: agentCompanyName,
          company_context: agentCompanyContext,
          product_description: agentProductDescription,
          scheduling_link: agentSchedulingLink,
          sender_title: agentSenderTitle,
          custom_instructions: agentCustomInstructions,
        },
      });
      setDefaultsSuccess(true);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setDefaultsError(error?.response?.data?.detail || 'Failed to save AI agent defaults');
    } finally {
      setIsSavingDefaults(false);
    }
  };

  const handleSaveDeliverySettings = async () => {
    setDeliveryError(null);
    setDeliverySuccess(null);
    try {
      await updateDeliverySettings.mutateAsync({
        daily_summary_enabled: dailySummaryEnabled,
        delivery_channel: deliveryChannel,
        daily_summary_time: dailySummaryTime,
        timezone: deliveryTimezone,
        include_campaign_health: includeCampaignHealth,
        include_sender_health: includeSenderHealth,
        include_inbox_summary: includeInboxSummary,
        include_workspace_gaps: includeWorkspaceGaps,
        whatsapp_daily_interaction_limit: Number(whatsAppDailyLimit),
        voice_daily_minutes_limit: Number(voiceDailyMinutesLimit),
        monthly_token_alert_threshold: Number(monthlyTokenAlertThreshold),
      });
      setDeliverySuccess('Assistant delivery settings saved.');
    } catch (err) {
      setDeliveryError(
        err instanceof Error ? err.message : 'Failed to save assistant delivery settings'
      );
    }
  };

  const handleRunDailySummary = async () => {
    setDeliveryError(null);
    setDeliverySuccess(null);
    try {
      await updateDeliverySettings.mutateAsync({
        daily_summary_enabled: dailySummaryEnabled,
        delivery_channel: deliveryChannel,
        daily_summary_time: dailySummaryTime,
        timezone: deliveryTimezone,
        include_campaign_health: includeCampaignHealth,
        include_sender_health: includeSenderHealth,
        include_inbox_summary: includeInboxSummary,
        include_workspace_gaps: includeWorkspaceGaps,
        whatsapp_daily_interaction_limit: Number(whatsAppDailyLimit),
        voice_daily_minutes_limit: Number(voiceDailyMinutesLimit),
        monthly_token_alert_threshold: Number(monthlyTokenAlertThreshold),
      });
      await runDailySummary.mutateAsync();
      setDeliverySuccess('Daily workspace summary delivered to Assistant.');
    } catch (err) {
      setDeliveryError(err instanceof Error ? err.message : 'Failed to run daily summary');
    }
  };

  const handleSaveWhatsAppBinding = async () => {
    setWhatsAppError(null);
    setWhatsAppSuccess(null);
    if (!selectedWhatsAppAccountId) {
      setWhatsAppError('Select a WhatsApp account first.');
      return;
    }
    try {
      await updateWhatsAppBinding.mutateAsync({
        unipile_account_id: selectedWhatsAppAccountId,
      });
      setWhatsAppSuccess('WhatsApp assistant channel connected.');
    } catch (err) {
      setWhatsAppError(err instanceof Error ? err.message : 'Failed to connect WhatsApp channel');
    }
  };

  const handleRemoveWhatsAppBinding = async () => {
    setWhatsAppError(null);
    setWhatsAppSuccess(null);
    try {
      await deleteWhatsAppBinding.mutateAsync();
      setWhatsAppSuccess('WhatsApp assistant channel removed.');
    } catch (err) {
      setWhatsAppError(err instanceof Error ? err.message : 'Failed to remove WhatsApp channel');
    }
  };

  // Auto-dismiss success
  useEffect(() => {
    if (defaultsSuccess || contextSuccess || deliverySuccess || whatsAppSuccess) {
      const timer = setTimeout(() => {
        setDefaultsSuccess(false);
        setContextSuccess(null);
        setDeliverySuccess(null);
        setWhatsAppSuccess(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [defaultsSuccess, contextSuccess, deliverySuccess, whatsAppSuccess]);

  if (isLoadingWorkspaces) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-center py-12"
      >
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#E2E8F0] border-t-[#FF6B35]" />
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
        <h2 className="text-xl font-bold text-[#1E293B]">Parrot Brain</h2>
        <p className="mt-1 text-sm text-[#64748B]">
          Keep Parrot's business context and reply-agent defaults in one place. The business context
          shapes targeting and copy quality, while the defaults below pre-populate new Reply Agent
          steps.
        </p>
      </div>

      {/* Workspace Selector */}
      {workspaces.length > 1 && (
        <div>
          <label className="block text-sm font-medium text-[#1E293B]">Workspace</label>
          <select
            value={selectedWorkspaceId}
            onChange={(e) => setSelectedWorkspaceId(e.target.value)}
            className="mt-2 w-full rounded-lg border border-[#E2E8F0] px-4 py-2.5 text-[#1E293B] focus:border-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20"
          >
            {workspaces.map((ws) => (
              <option key={ws.id} value={ws.id}>
                {ws.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="rounded-xl border border-[#E2E8F0] bg-white p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-[#1E293B]">Business Context</h3>
            <p className="mt-1 text-sm text-[#64748B]">
              This is the durable workspace context Parrot uses to understand what you sell, who you
              target, and what outreach should achieve.
            </p>
          </div>
          <button
            onClick={handleAnalyzeWebsite}
            disabled={!selectedWorkspaceId || !websiteUrl.trim() || previewWebsiteContext.isPending}
            className="rounded-lg border border-[#CBD5E1] px-4 py-2 text-sm font-medium text-[#1E293B] hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {previewWebsiteContext.isPending ? 'Analyzing...' : 'Analyze website'}
          </button>
        </div>

        <div className="mt-6 grid gap-6">
          <div>
            <label className="block text-sm font-medium text-[#1E293B]">Website URL</label>
            <input
              type="url"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="https://yourcompany.com"
              className="mt-2 w-full rounded-lg border border-[#E2E8F0] px-4 py-2.5 text-[#1E293B] placeholder:text-[#94A3B8] focus:border-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20"
            />
            <p className="mt-1 text-xs text-[#64748B]">
              Use website analysis to draft the fields below, then edit them before saving.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1E293B]">Business Blurb</label>
            <textarea
              value={businessBlurb}
              onChange={(e) => setBusinessBlurb(e.target.value)}
              placeholder="What does your company do, and why does it matter?"
              rows={3}
              className="mt-2 w-full rounded-lg border border-[#E2E8F0] px-4 py-2.5 text-[#1E293B] placeholder:text-[#94A3B8] focus:border-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1E293B]">
              Ideal Customer Profile
            </label>
            <textarea
              value={icp}
              onChange={(e) => setIcp(e.target.value)}
              placeholder="Who should Parrot target?"
              rows={3}
              className="mt-2 w-full rounded-lg border border-[#E2E8F0] px-4 py-2.5 text-[#1E293B] placeholder:text-[#94A3B8] focus:border-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1E293B]">Outreach Intent</label>
            <textarea
              value={outreachIntent}
              onChange={(e) => setOutreachIntent(e.target.value)}
              placeholder="What outcome should outreach drive?"
              rows={3}
              className="mt-2 w-full rounded-lg border border-[#E2E8F0] px-4 py-2.5 text-[#1E293B] placeholder:text-[#94A3B8] focus:border-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1E293B]">Brand Tone</label>
            <input
              type="text"
              value={brandTone}
              onChange={(e) => setBrandTone(e.target.value)}
              placeholder="Direct, credible, and low-hype"
              className="mt-2 w-full rounded-lg border border-[#E2E8F0] px-4 py-2.5 text-[#1E293B] placeholder:text-[#94A3B8] focus:border-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1E293B]">Value Proposition</label>
            <textarea
              value={valueProposition}
              onChange={(e) => setValueProposition(e.target.value)}
              placeholder="What is the clearest concrete result your product creates?"
              rows={3}
              className="mt-2 w-full rounded-lg border border-[#E2E8F0] px-4 py-2.5 text-[#1E293B] placeholder:text-[#94A3B8] focus:border-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1E293B]">CTA Preference</label>
            <textarea
              value={ctaPreference}
              onChange={(e) => setCtaPreference(e.target.value)}
              placeholder="Preferred call to action, e.g. short intro call, send overview first, etc."
              rows={2}
              className="mt-2 w-full rounded-lg border border-[#E2E8F0] px-4 py-2.5 text-[#1E293B] placeholder:text-[#94A3B8] focus:border-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1E293B]">Reply Guardrails</label>
            <textarea
              value={replyGuardrails}
              onChange={(e) => setReplyGuardrails(e.target.value)}
              placeholder="Rules the AI should follow when drafting or replying."
              rows={3}
              className="mt-2 w-full rounded-lg border border-[#E2E8F0] px-4 py-2.5 text-[#1E293B] placeholder:text-[#94A3B8] focus:border-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1E293B]">Forbidden Claims</label>
            <textarea
              value={forbiddenClaims}
              onChange={(e) => setForbiddenClaims(e.target.value)}
              placeholder="Claims, promises, or topics the AI must avoid."
              rows={3}
              className="mt-2 w-full rounded-lg border border-[#E2E8F0] px-4 py-2.5 text-[#1E293B] placeholder:text-[#94A3B8] focus:border-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20"
            />
          </div>
        </div>

        {(contextError || contextSuccess) && (
          <div
            className={`mt-6 rounded-xl border p-4 ${
              contextError ? 'border-[#EF4444]/20 bg-[#FEF2F2]' : 'border-[#86EFAC] bg-[#F0FDF4]'
            }`}
          >
            <p
              className={`text-sm font-medium ${
                contextError ? 'text-[#991B1B]' : 'text-[#166534]'
              }`}
            >
              {contextError || contextSuccess}
            </p>
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSaveContext}
            disabled={!selectedWorkspaceId || updateWorkspaceContext.isPending}
            className="rounded-lg bg-[#0F172A] px-6 py-2.5 font-medium text-white hover:bg-[#1E293B] disabled:opacity-50"
          >
            {updateWorkspaceContext.isPending ? 'Saving...' : 'Save Context'}
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-[#E2E8F0] bg-white p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-[#1E293B]">Assistant Delivery</h3>
          <p className="mt-1 text-sm text-[#64748B]">
            Configure the daily workspace summary that Parrot can post into Assistant. This uses the
            workspace timezone and current operational data.
          </p>
        </div>

        <div className="grid gap-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-[#64748B]">
                WhatsApp Today
              </div>
              <div className="mt-2 text-2xl font-semibold text-[#1E293B]">
                {assistantUsage
                  ? `${assistantUsage.whatsapp_interactions_today}/${assistantUsage.whatsapp_daily_interaction_limit}`
                  : '--'}
              </div>
              <p className="mt-1 text-xs text-[#64748B]">
                Remaining: {assistantUsage ? assistantUsage.whatsapp_remaining_today : '--'}
              </p>
            </div>
            <div className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-[#64748B]">
                Voice Today
              </div>
              <div className="mt-2 text-2xl font-semibold text-[#1E293B]">
                {assistantUsage
                  ? `${assistantUsage.voice_minutes_today}/${assistantUsage.voice_daily_minutes_limit}m`
                  : '--'}
              </div>
              <p className="mt-1 text-xs text-[#64748B]">
                Remaining seconds:{' '}
                {assistantUsage ? assistantUsage.voice_seconds_remaining_today : '--'}
              </p>
            </div>
            <div className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-[#64748B]">
                Monthly Tokens
              </div>
              <div className="mt-2 text-2xl font-semibold text-[#1E293B]">
                {assistantUsage ? assistantUsage.monthly_total_tokens.toLocaleString() : '--'}
              </div>
              <p
                className={`mt-1 text-xs ${
                  assistantUsage?.monthly_token_alert_reached ? 'text-[#B45309]' : 'text-[#64748B]'
                }`}
              >
                Alert at{' '}
                {assistantUsage
                  ? assistantUsage.monthly_token_alert_threshold.toLocaleString()
                  : '--'}
              </p>
            </div>
            <div className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-[#64748B]">
                Reliability
              </div>
              <div className="mt-2 text-2xl font-semibold text-[#1E293B]">
                {assistantUsage ? assistantUsage.failed_runs_last_24h : '--'}
              </div>
              <p className="mt-1 text-xs text-[#64748B]">
                failed runs in 24h, {assistantUsage ? assistantUsage.qr_transfers_last_7d : '--'} QR
                handoffs in 7d
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-[#E2E8F0] p-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-[#1E293B]">WhatsApp Assistant Channel</h4>
                <p className="mt-1 text-sm text-[#64748B]">
                  Select the Unipile WhatsApp account Parrot should use for assistant chat and
                  optional summary delivery.
                </p>
                <select
                  value={selectedWhatsAppAccountId}
                  onChange={(e) => setSelectedWhatsAppAccountId(e.target.value)}
                  className="mt-3 w-full rounded-lg border border-[#E2E8F0] px-4 py-2.5 text-[#1E293B] focus:border-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20"
                >
                  {whatsappAccounts.length === 0 ? (
                    <option value="">No WhatsApp accounts found in Unipile</option>
                  ) : null}
                  {whatsappAccounts.map((account) => (
                    <option key={account.unipile_account_id} value={account.unipile_account_id}>
                      {account.name || account.phone_number || account.unipile_account_id}
                    </option>
                  ))}
                </select>
                <div className="mt-2 text-xs text-[#64748B]">
                  {whatsappBinding ? (
                    <span>
                      Connected:{' '}
                      {whatsappBinding.account_name ||
                        whatsappBinding.phone_number ||
                        whatsappBinding.unipile_account_id}
                    </span>
                  ) : (
                    <span>No WhatsApp assistant channel connected yet.</span>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                {whatsappBinding ? (
                  <button
                    onClick={handleRemoveWhatsAppBinding}
                    disabled={deleteWhatsAppBinding.isPending}
                    className="rounded-lg border border-[#E2E8F0] px-4 py-2.5 text-sm font-medium text-[#1E293B] hover:bg-[#F8FAFC] disabled:opacity-50"
                  >
                    {deleteWhatsAppBinding.isPending ? 'Removing...' : 'Remove'}
                  </button>
                ) : null}
                <button
                  onClick={handleSaveWhatsAppBinding}
                  disabled={
                    !selectedWorkspaceId ||
                    !selectedWhatsAppAccountId ||
                    updateWhatsAppBinding.isPending
                  }
                  className="rounded-lg border border-[#CBD5E1] px-4 py-2.5 text-sm font-medium text-[#1E293B] hover:bg-[#F8FAFC] disabled:opacity-50"
                >
                  {updateWhatsAppBinding.isPending ? 'Connecting...' : 'Connect WhatsApp'}
                </button>
              </div>
            </div>

            {(whatsAppError || whatsAppSuccess) && (
              <div
                className={`mt-4 rounded-xl border p-4 ${
                  whatsAppError
                    ? 'border-[#EF4444]/20 bg-[#FEF2F2]'
                    : 'border-[#86EFAC] bg-[#F0FDF4]'
                }`}
              >
                <p
                  className={`text-sm font-medium ${
                    whatsAppError ? 'text-[#991B1B]' : 'text-[#166534]'
                  }`}
                >
                  {whatsAppError || whatsAppSuccess}
                </p>
              </div>
            )}
          </div>

          <label className="flex items-start gap-3 rounded-lg border border-[#E2E8F0] p-4">
            <input
              type="checkbox"
              checked={dailySummaryEnabled}
              onChange={(e) => setDailySummaryEnabled(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-[#CBD5E1] text-[#FF6B35] focus:ring-[#FF6B35]"
            />
            <div>
              <div className="font-medium text-[#1E293B]">Enable daily workspace summary</div>
              <div className="mt-1 text-sm text-[#64748B]">
                Post one read-only daily summary with campaign health, inbox activity, and setup
                gaps.
              </div>
            </div>
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-[#1E293B]">Delivery Channel</label>
              <select
                value={deliveryChannel}
                onChange={(e) =>
                  setDeliveryChannel(e.target.value as 'dashboard' | 'whatsapp' | 'both')
                }
                className="mt-2 w-full rounded-lg border border-[#E2E8F0] px-4 py-2.5 text-[#1E293B] focus:border-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20"
              >
                <option value="dashboard">Dashboard Assistant</option>
                <option value="whatsapp">WhatsApp Assistant</option>
                <option value="both">Dashboard + WhatsApp</option>
              </select>
              <p className="mt-1 text-xs text-[#64748B]">
                WhatsApp delivery requires an active assistant WhatsApp thread for the connected
                channel.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1E293B]">Daily Send Time</label>
              <input
                type="time"
                value={dailySummaryTime}
                onChange={(e) => setDailySummaryTime(e.target.value)}
                className="mt-2 w-full rounded-lg border border-[#E2E8F0] px-4 py-2.5 text-[#1E293B] focus:border-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1E293B]">Timezone</label>
            <input
              type="text"
              value={deliveryTimezone}
              onChange={(e) => setDeliveryTimezone(e.target.value)}
              placeholder="America/New_York"
              className="mt-2 w-full rounded-lg border border-[#E2E8F0] px-4 py-2.5 text-[#1E293B] placeholder:text-[#94A3B8] focus:border-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-[#1E293B]">
                WhatsApp Daily Limit
              </label>
              <input
                type="number"
                min={1}
                value={whatsAppDailyLimit}
                onChange={(e) => setWhatsAppDailyLimit(e.target.value)}
                className="mt-2 w-full rounded-lg border border-[#E2E8F0] px-4 py-2.5 text-[#1E293B] focus:border-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20"
              />
              <p className="mt-1 text-xs text-[#64748B]">
                Max inbound WhatsApp assistant prompts per workspace day.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1E293B]">
                Voice Daily Minutes
              </label>
              <input
                type="number"
                min={1}
                value={voiceDailyMinutesLimit}
                onChange={(e) => setVoiceDailyMinutesLimit(e.target.value)}
                className="mt-2 w-full rounded-lg border border-[#E2E8F0] px-4 py-2.5 text-[#1E293B] focus:border-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20"
              />
              <p className="mt-1 text-xs text-[#64748B]">
                Shared dashboard voice allowance per workspace day.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1E293B]">
                Monthly Token Alert
              </label>
              <input
                type="number"
                min={1000}
                step={1000}
                value={monthlyTokenAlertThreshold}
                onChange={(e) => setMonthlyTokenAlertThreshold(e.target.value)}
                className="mt-2 w-full rounded-lg border border-[#E2E8F0] px-4 py-2.5 text-[#1E293B] focus:border-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20"
              />
              <p className="mt-1 text-xs text-[#64748B]">
                Warn when combined assistant monthly tokens cross this threshold.
              </p>
            </div>
          </div>

          <div>
            <div className="block text-sm font-medium text-[#1E293B]">Summary Sections</div>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {[
                {
                  checked: includeCampaignHealth,
                  setChecked: setIncludeCampaignHealth,
                  label: 'Campaign health',
                },
                {
                  checked: includeSenderHealth,
                  setChecked: setIncludeSenderHealth,
                  label: 'Sender and account health',
                },
                {
                  checked: includeInboxSummary,
                  setChecked: setIncludeInboxSummary,
                  label: 'Inbox activity',
                },
                {
                  checked: includeWorkspaceGaps,
                  setChecked: setIncludeWorkspaceGaps,
                  label: 'Workspace setup gaps',
                },
              ].map((item) => (
                <label
                  key={item.label}
                  className="flex items-center gap-3 rounded-lg border border-[#E2E8F0] px-4 py-3"
                >
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={(e) => item.setChecked(e.target.checked)}
                    className="h-4 w-4 rounded border-[#CBD5E1] text-[#FF6B35] focus:ring-[#FF6B35]"
                  />
                  <span className="text-sm text-[#1E293B]">{item.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-4 text-sm text-[#64748B]">
            {deliverySettings?.last_summary_sent_at ? (
              <span>
                Last summary sent:{' '}
                {new Date(deliverySettings.last_summary_sent_at).toLocaleString()}
              </span>
            ) : (
              <span>No daily summary has been sent yet.</span>
            )}
          </div>

          {(deliveryError || deliverySuccess) && (
            <div
              className={`rounded-xl border p-4 ${
                deliveryError ? 'border-[#EF4444]/20 bg-[#FEF2F2]' : 'border-[#86EFAC] bg-[#F0FDF4]'
              }`}
            >
              <p
                className={`text-sm font-medium ${
                  deliveryError ? 'text-[#991B1B]' : 'text-[#166534]'
                }`}
              >
                {deliveryError || deliverySuccess}
              </p>
            </div>
          )}

          <div className="flex flex-wrap justify-end gap-3">
            <button
              onClick={handleRunDailySummary}
              disabled={
                !selectedWorkspaceId ||
                runDailySummary.isPending ||
                updateDeliverySettings.isPending
              }
              className="rounded-lg border border-[#CBD5E1] px-4 py-2.5 text-sm font-medium text-[#1E293B] hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {runDailySummary.isPending || updateDeliverySettings.isPending
                ? 'Running...'
                : 'Run now'}
            </button>
            <button
              onClick={handleSaveDeliverySettings}
              disabled={!selectedWorkspaceId || updateDeliverySettings.isPending}
              className="rounded-lg bg-[#0F172A] px-6 py-2.5 font-medium text-white hover:bg-[#1E293B] disabled:opacity-50"
            >
              {updateDeliverySettings.isPending ? 'Saving...' : 'Save Delivery Settings'}
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-[#E2E8F0] bg-white p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-[#1E293B]">Reply Agent Defaults</h3>
          <p className="mt-1 text-sm text-[#64748B]">
            These values pre-populate new Reply Agent steps in the campaign builder.
          </p>
        </div>
        <div className="space-y-6">
          {/* Goal */}
          <div>
            <label className="block text-sm font-medium text-[#1E293B]">Goal</label>
            <textarea
              value={agentGoal}
              onChange={(e) => setAgentGoal(e.target.value)}
              placeholder="Book a meeting with the lead"
              rows={2}
              className="mt-2 w-full rounded-lg border border-[#E2E8F0] px-4 py-2.5 text-[#1E293B] placeholder:text-[#94A3B8] focus:border-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20"
            />
            <p className="mt-1 text-xs text-[#64748B]">
              What should the AI agent try to achieve in reply conversations?
            </p>
          </div>

          {/* Tone */}
          <div>
            <label className="block text-sm font-medium text-[#1E293B]">Tone</label>
            <select
              value={agentTone}
              onChange={(e) =>
                setAgentTone(e.target.value as 'professional' | 'friendly' | 'casual')
              }
              className="mt-2 w-full rounded-lg border border-[#E2E8F0] px-4 py-2.5 text-[#1E293B] focus:border-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20"
            >
              <option value="professional">Professional</option>
              <option value="friendly">Friendly</option>
              <option value="casual">Casual</option>
            </select>
          </div>

          {/* Sender Title */}
          <div>
            <label className="block text-sm font-medium text-[#1E293B]">Your Title / Role</label>
            <input
              type="text"
              value={agentSenderTitle}
              onChange={(e) => setAgentSenderTitle(e.target.value)}
              placeholder="VP of Sales"
              className="mt-2 w-full rounded-lg border border-[#E2E8F0] px-4 py-2.5 text-[#1E293B] placeholder:text-[#94A3B8] focus:border-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20"
            />
            <p className="mt-1 text-xs text-[#64748B]">
              Your role or job title — the agent will use this to present itself correctly
            </p>
          </div>

          {/* Company Name */}
          <div>
            <label className="block text-sm font-medium text-[#1E293B]">Company Name</label>
            <input
              type="text"
              value={agentCompanyName}
              onChange={(e) => setAgentCompanyName(e.target.value)}
              placeholder="Acme Inc."
              className="mt-2 w-full rounded-lg border border-[#E2E8F0] px-4 py-2.5 text-[#1E293B] placeholder:text-[#94A3B8] focus:border-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20"
            />
            <p className="mt-1 text-xs text-[#64748B]">
              Your company name as the agent should reference it
            </p>
          </div>

          {/* Company Context */}
          <div>
            <label className="block text-sm font-medium text-[#1E293B]">Company Context</label>
            <textarea
              value={agentCompanyContext}
              onChange={(e) => setAgentCompanyContext(e.target.value)}
              placeholder="We help B2B companies..."
              rows={3}
              className="mt-2 w-full rounded-lg border border-[#E2E8F0] px-4 py-2.5 text-[#1E293B] placeholder:text-[#94A3B8] focus:border-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20"
            />
            <p className="mt-1 text-xs text-[#64748B]">
              Brief description of your company for the AI agent
            </p>
          </div>

          {/* Product Description */}
          <div>
            <label className="block text-sm font-medium text-[#1E293B]">Product Description</label>
            <textarea
              value={agentProductDescription}
              onChange={(e) => setAgentProductDescription(e.target.value)}
              placeholder="Our platform combines..."
              rows={3}
              className="mt-2 w-full rounded-lg border border-[#E2E8F0] px-4 py-2.5 text-[#1E293B] placeholder:text-[#94A3B8] focus:border-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20"
            />
            <p className="mt-1 text-xs text-[#64748B]">
              Describe your product or service so the AI can reference it
            </p>
          </div>

          {/* Scheduling Link */}
          <div>
            <label className="block text-sm font-medium text-[#1E293B]">Scheduling Link</label>
            <input
              type="url"
              value={agentSchedulingLink}
              onChange={(e) => setAgentSchedulingLink(e.target.value)}
              placeholder="https://calendly.com/you/30min"
              className="mt-2 w-full rounded-lg border border-[#E2E8F0] px-4 py-2.5 text-[#1E293B] placeholder:text-[#94A3B8] focus:border-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20"
            />
            <p className="mt-1 text-xs text-[#64748B]">
              Calendar link the agent will share when booking meetings
            </p>
          </div>

          {/* Custom Instructions */}
          <div>
            <label className="block text-sm font-medium text-[#1E293B]">Custom Instructions</label>
            <textarea
              value={agentCustomInstructions}
              onChange={(e) => setAgentCustomInstructions(e.target.value)}
              placeholder={`Examples:\n- If a lead asks about pricing, say "Let me connect you with our sales team" and hand off.\n- Always mention our free trial when a lead shows interest.\n- Never discuss competitors by name.`}
              rows={6}
              className="mt-2 w-full rounded-lg border border-[#E2E8F0] px-4 py-2.5 text-[#1E293B] placeholder:text-[#94A3B8] focus:border-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20"
            />
            <p className="mt-1 text-xs text-[#64748B]">
              Tell the agent exactly how to handle specific situations — e.g. how to respond to
              pricing questions, objections, or particular topics. These instructions take effect
              alongside the goal and tone above.
            </p>
          </div>
        </div>

        {/* Error / Success */}
        {defaultsError && (
          <div className="mt-6 flex items-start gap-3 rounded-xl border border-[#EF4444]/20 bg-[#FEF2F2] p-4">
            <WarningIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#EF4444]" />
            <div className="flex-1">
              <p className="text-sm font-medium text-[#991B1B]">Error</p>
              <p className="text-xs text-[#DC2626]">{defaultsError}</p>
            </div>
          </div>
        )}
        {defaultsSuccess && (
          <div className="mt-6 flex items-center gap-2 rounded-xl border border-[#86EFAC] bg-[#F0FDF4] p-4">
            <CheckIcon className="h-5 w-5 text-[#22C55E]" />
            <p className="text-sm font-medium text-[#166534]">
              AI agent defaults saved successfully
            </p>
          </div>
        )}

        {/* Save Button */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSave}
            disabled={isSavingDefaults}
            className="rounded-lg bg-[#FF6B35] px-6 py-2.5 font-medium text-white hover:bg-[#E85A2A] disabled:opacity-50"
          >
            {isSavingDefaults ? 'Saving...' : 'Save Defaults'}
          </button>
        </div>
      </div>

      {/* Info Box */}
      <div className="flex items-start gap-3 rounded-xl border border-[#3B82F6]/20 bg-[#EFF6FF] p-4">
        <InfoIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#3B82F6]" />
        <div className="flex-1 text-xs text-[#1E3A8A]">
          <p className="font-medium">How AI Agent defaults work</p>
          <ul className="mt-2 list-inside list-disc space-y-1">
            <li>These values pre-populate new Reply Agent steps in the campaign builder</li>
            <li>You can still override them per-campaign in the step configuration</li>
            <li>Changes here won't affect existing campaign steps</li>
          </ul>
        </div>
      </div>
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
                    : 'bg-[#64748B] text-white'
                }`}
              >
                {billing?.subscription?.status === 'active'
                  ? 'Active'
                  : billing?.subscription?.status || 'Inactive'}
              </span>
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
              Tip: With {billing.sender_count}+ senders, the Agency plan ($999/mo for 30 senders)
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
  const [showWebhooksModal, setShowWebhooksModal] = useState(false);
  const [showAPIKeysModal, setShowAPIKeysModal] = useState(false);
  const [showHubSpotModal, setShowHubSpotModal] = useState(false);
  const [showSalesforceModal, setShowSalesforceModal] = useState(false);
  const [showPipedriveModal, setShowPipedriveModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showSlackModal, setShowSlackModal] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [editingLinkedInAccount, setEditingLinkedInAccount] = useState<LinkedInAccount | null>(
    null
  );
  const { data: emailAccounts = [], isLoading: emailsLoading } = useEmailAccounts();
  const { data: linkedInAccounts = [], isLoading: linkedInLoading } = useLinkedInAccounts();
  const { data: calendarAccounts = [], isLoading: calendarLoading } = useCalendarAccounts();
  const { data: webhooksData } = useWebhooks();
  const { data: apiKeysData } = useAPIKeys();
  const { data: hubspotStatus } = useHubSpotStatus();
  const { data: salesforceStatus } = useSalesforceStatus();
  const { data: pipedriveStatus } = usePipedriveStatus();
  const { data: closeStatus } = useCloseStatus();
  const { data: slackStatus } = useSlackStatus();

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
                        ? `${account.subscription_type === 'premium' ? 'LinkedIn Premium' : account.subscription_type === 'sales_nav' ? 'Sales Navigator' : account.subscription_type === 'recruiter' ? 'Recruiter' : ''} - `
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
      {/* Calendar Accounts */}
      <div className="rounded-xl border border-[#E2E8F0] bg-white p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-[#1E293B]">Calendar Accounts</h3>
            <p className="mt-1 text-sm text-[#64748B]">
              Connect your calendar for availability checking and meeting booking
            </p>
          </div>
          <button
            onClick={() => setShowCalendarModal(true)}
            className="flex items-center gap-2 rounded-lg bg-[#14B8A6] px-4 py-2.5 font-medium text-white transition-colors hover:bg-[#0D9488]"
          >
            <PlusIcon />
            Connect Calendar
          </button>
        </div>

        {/* Connected Calendar Accounts */}
        {calendarLoading ? (
          <div className="flex items-center justify-center py-6">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#14B8A6] border-t-transparent" />
          </div>
        ) : calendarAccounts.length > 0 ? (
          <div className="space-y-3">
            {calendarAccounts.map((account) => (
              <SettingsCalendarAccountRow key={account.id} account={account} />
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="rounded-xl border-2 border-dashed border-[#E2E8F0] p-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-[#F8FAFC]">
              <CalendarIcon />
            </div>
            <p className="text-sm text-[#64748B]">No calendar accounts connected yet</p>
            <p className="mt-1 text-xs text-[#94A3B8]">
              Connect a calendar to enable availability checking
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
            connected={hubspotStatus?.connected ?? false}
            onClick={() => setShowHubSpotModal(true)}
          />
          <IntegrationCard
            name="Salesforce"
            description="Enterprise CRM integration"
            icon={<SalesforceIcon />}
            color="#00A1E0"
            connected={salesforceStatus?.connected ?? false}
            onClick={() => setShowSalesforceModal(true)}
          />
          <IntegrationCard
            name="Pipedrive"
            description="Deal and pipeline management"
            icon={<PipedriveIcon />}
            color="#1D1D1D"
            connected={pipedriveStatus?.connected ?? false}
            onClick={() => setShowPipedriveModal(true)}
          />
          <IntegrationCard
            name="Close CRM"
            description="Sales productivity platform"
            icon={<CloseIcon />}
            color="#5C6BC0"
            connected={closeStatus?.connected ?? false}
            onClick={() => setShowCloseModal(true)}
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
            description="Use Webhooks to connect"
            icon={<ZapierIcon />}
            color="#FF4A00"
            connected={false}
            onClick={() => setShowWebhooksModal(true)}
          />
          <IntegrationCard
            name="Make (Integromat)"
            description="Use Webhooks to connect"
            icon={<MakeIcon />}
            color="#6E56FF"
            connected={false}
            onClick={() => setShowWebhooksModal(true)}
          />
          <IntegrationCard
            name="Slack"
            description="Get notifications in Slack"
            icon={<SlackIcon />}
            color="#4A154B"
            connected={slackStatus?.connected ?? false}
            onClick={() => setShowSlackModal(true)}
          />
          <IntegrationCard
            name="Webhooks"
            description="Custom API integrations"
            icon={<WebhookIcon />}
            color="#64748B"
            connected={(webhooksData?.webhooks?.length ?? 0) > 0}
            isWebhook
            count={webhooksData?.webhooks?.filter((w) => w.is_active).length}
            onClick={() => setShowWebhooksModal(true)}
          />
          <IntegrationCard
            name="API Keys"
            description="Access the public REST API"
            icon={<KeyIcon />}
            color="#8B5CF6"
            connected={(apiKeysData?.api_keys?.length ?? 0) > 0}
            isWebhook
            count={apiKeysData?.api_keys?.filter((k) => k.is_active).length}
            onClick={() => setShowAPIKeysModal(true)}
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
      {/* Webhooks Management Modal */}
      <AnimatePresence>
        {showWebhooksModal && (
          <WebhooksManagementModal onClose={() => setShowWebhooksModal(false)} />
        )}
      </AnimatePresence>
      {/* API Keys Management Modal */}
      <AnimatePresence>
        {showAPIKeysModal && <APIKeysManagementModal onClose={() => setShowAPIKeysModal(false)} />}
      </AnimatePresence>
      {/* HubSpot Management Modal */}
      <AnimatePresence>
        {showHubSpotModal && <HubSpotManagementModal onClose={() => setShowHubSpotModal(false)} />}
      </AnimatePresence>
      {/* Salesforce Management Modal */}
      <AnimatePresence>
        {showSalesforceModal && (
          <SalesforceManagementModal onClose={() => setShowSalesforceModal(false)} />
        )}
      </AnimatePresence>
      {/* Pipedrive Management Modal */}
      <AnimatePresence>
        {showPipedriveModal && (
          <PipedriveManagementModal onClose={() => setShowPipedriveModal(false)} />
        )}
      </AnimatePresence>
      {/* Close Management Modal */}
      <AnimatePresence>
        {showCloseModal && <CloseManagementModal onClose={() => setShowCloseModal(false)} />}
      </AnimatePresence>
      {/* Slack Management Modal */}
      <AnimatePresence>
        {showSlackModal && <SlackManagementModal onClose={() => setShowSlackModal(false)} />}
      </AnimatePresence>
      {/* Calendar Connection Modal */}
      <AnimatePresence>
        {showCalendarModal && (
          <SettingsConnectCalendarModal onClose={() => setShowCalendarModal(false)} />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function SettingsCalendarAccountRow({ account }: { account: CalendarAccount }) {
  const deleteAccount = useDeleteCalendarAccount();
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = async () => {
    await deleteAccount.mutateAsync(account.id);
    setShowConfirm(false);
  };

  return (
    <>
      <div className="flex items-center justify-between rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
        <div className="flex items-center gap-4">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-lg ${
              account.provider === 'google' ? 'bg-[#EA4335]/10' : 'bg-[#00A4EF]/10'
            }`}
          >
            {account.provider === 'google' ? (
              <GoogleIcon className="h-6 w-6" />
            ) : (
              <MicrosoftIcon className="h-6 w-6" />
            )}
          </div>
          <div>
            <p className="font-medium text-[#1E293B]">{account.email_address}</p>
            <p className="text-sm text-[#64748B]">
              {account.provider === 'google' ? 'Google' : 'Microsoft'} -{' '}
              {account.status === 'connected' ? 'Connected' : 'Disconnected'}
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowConfirm(true)}
          className="rounded-lg px-3 py-1.5 text-sm font-medium text-[#EF4444] transition-colors hover:bg-[#FEF2F2]"
        >
          Disconnect
        </button>
      </div>

      <AnimatePresence>
        {showConfirm &&
          createPortal(
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
              onClick={() => setShowConfirm(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={(e: React.MouseEvent) => e.stopPropagation()}
                className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
              >
                <h3 className="text-lg font-semibold text-[#1E293B]">Disconnect Calendar</h3>
                <p className="mt-2 text-sm text-[#64748B]">
                  Are you sure you want to disconnect{' '}
                  <span className="font-medium text-[#1E293B]">{account.email_address}</span>?
                </p>
                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => setShowConfirm(false)}
                    className="flex-1 rounded-lg border border-[#E2E8F0] px-4 py-2.5 font-medium text-[#64748B] hover:bg-[#F8FAFC]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleteAccount.isPending}
                    className="flex-1 rounded-lg bg-[#EF4444] px-4 py-2.5 font-medium text-white transition-colors hover:bg-[#DC2626] disabled:opacity-50"
                  >
                    {deleteAccount.isPending ? 'Disconnecting...' : 'Disconnect'}
                  </button>
                </div>
              </motion.div>
            </motion.div>,
            document.body
          )}
      </AnimatePresence>
    </>
  );
}

function SettingsConnectCalendarModal({ onClose }: { onClose: () => void }) {
  const [isLoading, setIsLoading] = useState<CalendarProvider | null>(null);
  const [connectingEmailId, setConnectingEmailId] = useState<string | null>(null);
  const [showNewAuth, setShowNewAuth] = useState(false);
  const [error, setError] = useState('');
  const currentWorkspaceId = useWorkspaceStore((s) => s.currentWorkspaceId);
  const initCalendarAuth = useInitCalendarAuth();
  const connectFromEmail = useConnectCalendarFromEmail();
  const { data: emailAccounts } = useEmailAccounts();

  // Email accounts that can share calendar access (Google/Microsoft only, not IMAP)
  const reusableEmailAccounts = (emailAccounts ?? []).filter(
    (ea) => ea.provider === 'google' || ea.provider === 'microsoft'
  );

  const handleConnectFromEmail = async (emailAccountId: string) => {
    setConnectingEmailId(emailAccountId);
    setError('');
    try {
      await connectFromEmail.mutateAsync(emailAccountId);
      onClose();
    } catch (err) {
      setError(getErrorMessage(err));
      setConnectingEmailId(null);
    }
  };

  const handleConnect = async (provider: CalendarProvider) => {
    setIsLoading(provider);
    setError('');
    try {
      const returnUrl = `${window.location.origin}/dashboard/settings?tab=calendar`;
      const result = await initCalendarAuth.mutateAsync({
        provider,
        workspaceId: currentWorkspaceId ?? undefined,
        returnUrl,
      });
      window.location.href = result.url;
    } catch (err) {
      setError(getErrorMessage(err));
      setIsLoading(null);
    }
  };

  const showReusable = reusableEmailAccounts.length > 0 && !showNewAuth;

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
        className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        {/* Header */}
        <div className="border-b border-[#E2E8F0] bg-gradient-to-r from-[#F0FDFA] to-[#ECFDF5] px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#14B8A6]/10">
                <CalendarIcon />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[#1E293B]">Connect Calendar</h2>
                <p className="text-sm text-[#64748B]">
                  {showReusable
                    ? 'Use an existing email account or connect a new one'
                    : 'Choose your calendar provider'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-[#64748B] transition-colors hover:bg-[#E2E8F0]"
            >
              <CloseIcon />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 rounded-lg border border-[#FECACA] bg-[#FEF2F2] p-3 text-sm text-[#DC2626]">
              {error}
            </div>
          )}

          {showReusable ? (
            <>
              <p className="mb-3 text-sm text-[#64748B]">
                Your connected email accounts already have calendar access:
              </p>
              <div className="space-y-3">
                {reusableEmailAccounts.map((ea) => (
                  <button
                    key={ea.id}
                    onClick={() => handleConnectFromEmail(ea.id)}
                    disabled={connectingEmailId !== null}
                    className="flex w-full items-center gap-4 rounded-xl border border-[#E2E8F0] p-4 transition-all hover:border-[#14B8A6]/30 hover:bg-[#F0FDFA] disabled:opacity-50"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm">
                      {ea.provider === 'google' ? (
                        <GoogleIcon className="h-6 w-6" />
                      ) : (
                        <MicrosoftIcon className="h-6 w-6" />
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-medium text-[#1E293B]">{ea.email_address}</p>
                      <p className="text-sm text-[#64748B]">
                        {ea.provider === 'google' ? 'Google' : 'Microsoft'} Calendar
                      </p>
                    </div>
                    {connectingEmailId === ea.id ? (
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#14B8A6] border-t-transparent" />
                    ) : (
                      <span className="text-sm font-medium text-[#14B8A6]">Use this calendar</span>
                    )}
                  </button>
                ))}
              </div>

              <div className="mt-4 text-center">
                <button
                  onClick={() => setShowNewAuth(true)}
                  className="text-sm text-[#64748B] underline decoration-[#94A3B8] underline-offset-2 transition-colors hover:text-[#1E293B]"
                >
                  Or connect a different account
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-3">
                <button
                  onClick={() => handleConnect('google')}
                  disabled={isLoading !== null}
                  className="flex w-full items-center gap-4 rounded-xl border border-[#E2E8F0] p-4 transition-all hover:border-[#14B8A6]/30 hover:bg-[#F0FDFA] disabled:opacity-50"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm">
                    <GoogleIcon className="h-6 w-6" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-[#1E293B]">Google Calendar</p>
                    <p className="text-sm text-[#64748B]">
                      Connect your Gmail or Google Workspace calendar
                    </p>
                  </div>
                  {isLoading === 'google' ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#14B8A6] border-t-transparent" />
                  ) : (
                    <svg
                      className="h-5 w-5 text-[#94A3B8]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </button>

                <button
                  onClick={() => handleConnect('microsoft')}
                  disabled={isLoading !== null}
                  className="flex w-full items-center gap-4 rounded-xl border border-[#E2E8F0] p-4 transition-all hover:border-[#14B8A6]/30 hover:bg-[#F0FDFA] disabled:opacity-50"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm">
                    <MicrosoftIcon className="h-6 w-6" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-[#1E293B]">Microsoft Outlook</p>
                    <p className="text-sm text-[#64748B]">
                      Connect your Outlook or Microsoft 365 calendar
                    </p>
                  </div>
                  {isLoading === 'microsoft' ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#14B8A6] border-t-transparent" />
                  ) : (
                    <svg
                      className="h-5 w-5 text-[#94A3B8]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </button>
              </div>

              <p className="mt-4 text-center text-xs text-[#94A3B8]">
                You'll be redirected to securely authorize calendar access via OAuth
              </p>

              {reusableEmailAccounts.length > 0 && (
                <div className="mt-2 text-center">
                  <button
                    onClick={() => setShowNewAuth(false)}
                    className="text-sm text-[#64748B] underline decoration-[#94A3B8] underline-offset-2 transition-colors hover:text-[#1E293B]"
                  >
                    Back to email accounts
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>
    </motion.div>,
    document.body
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
  onClick,
  count,
}: {
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  connected: boolean;
  isWebhook?: boolean;
  comingSoon?: boolean;
  onClick?: () => void;
  count?: number;
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
            {count !== undefined && count > 0 && (
              <span className="rounded-full bg-[#DBEAFE] px-2 py-0.5 text-[10px] font-medium text-[#3B82F6]">
                {count} active
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
          onClick={onClick}
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
  const currentWorkspaceId = useWorkspaceStore((s) => s.currentWorkspaceId);

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
      const result = await pollStatus.mutateAsync({
        accountId,
        workspaceId: currentWorkspaceId || undefined,
      });
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
      const result = await connectWithCredentials.mutateAsync({
        username,
        password,
        workspace_id: currentWorkspaceId || undefined,
      });
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
        workspace_id: currentWorkspaceId || undefined,
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
        workspace_id: currentWorkspaceId || undefined,
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

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
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
    </motion.div>,
    document.body
  );
}

type EmailAuthStep = 'method' | 'imap' | 'success' | 'loading';

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
  const initGoogleOAuth = useInitGoogleOAuth();
  const initGmailHostedAuth = useInitGmailHostedAuth();
  const initMicrosoftOAuth = useInitMicrosoftOAuth();
  const { data: authConfig } = useEmailAuthConfig();

  const handleGoogleOAuth = async () => {
    setError('');
    setStep('loading');
    try {
      // Pass current URL so user returns here after OAuth
      const returnUrl = window.location.href.split('?')[0];

      // Use appropriate auth method based on config
      const isHostedAuth = authConfig?.gmail_auth_method === 'unipile';
      const result = isHostedAuth
        ? await initGmailHostedAuth.mutateAsync({ returnUrl })
        : await initGoogleOAuth.mutateAsync({ returnUrl });

      // Redirect to OAuth consent screen
      window.location.href = result.url;
    } catch (err) {
      setError(getErrorMessage(err));
      setStep('method');
    }
  };

  const handleMicrosoftOAuth = async () => {
    setError('');
    setStep('loading');
    try {
      // Pass current URL so user returns here after OAuth
      const returnUrl = window.location.href.split('?')[0];
      const result = await initMicrosoftOAuth.mutateAsync({ returnUrl });
      // Redirect to Microsoft OAuth consent screen
      window.location.href = result.url;
    } catch (err) {
      setError(getErrorMessage(err));
      setStep('method');
    }
  };

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
      setError(getErrorMessage(err));
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

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
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

              {error && (
                <div className="mb-4 rounded-lg border border-[#FECACA] bg-[#FEF2F2] p-3 text-sm text-[#DC2626]">
                  {error}
                </div>
              )}

              <div className="space-y-3">
                <button
                  onClick={handleGoogleOAuth}
                  className="flex w-full items-center gap-4 rounded-xl border border-[#E2E8F0] p-4 transition-all hover:border-[#EA4335]/30 hover:bg-[#FEF2F2]"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#EA4335]/10">
                    <GmailIcon className="h-7 w-7" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-[#1E293B]">Gmail / Google Workspace</p>
                    <p className="text-sm text-[#64748B]">Connect with your Google account</p>
                  </div>
                </button>

                <button
                  onClick={handleMicrosoftOAuth}
                  className="flex w-full items-center gap-4 rounded-xl border border-[#E2E8F0] p-4 transition-all hover:border-[#0078D4]/30 hover:bg-[#EFF6FF]"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#0078D4]/10">
                    <OutlookIcon className="h-7 w-7" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-[#1E293B]">Outlook / Microsoft 365</p>
                    <p className="text-sm text-[#64748B]">Connect with your Microsoft account</p>
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

          {/* Loading step */}
          {step === 'loading' && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center p-12"
            >
              <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-[#E2E8F0] border-t-[#FF6B35]" />
              <p className="text-[#64748B]">Connecting to your email provider...</p>
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
    </motion.div>,
    document.body
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

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
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
    </motion.div>,
    document.body
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

// ==================== WEBHOOKS MANAGEMENT MODAL ====================
function WebhooksManagementModal({ onClose }: { onClose: () => void }) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newWebhook, setNewWebhook] = useState<Partial<WebhookCreate>>({
    name: '',
    url: '',
    events: [],
    is_active: true,
  });
  const [testResult, setTestResult] = useState<{ success: boolean; error?: string } | null>(null);

  const { data: webhooksData, isLoading } = useWebhooks();
  const { data: eventTypesData } = useWebhookEventTypes();
  const createWebhook = useCreateWebhook();
  const updateWebhook = useUpdateWebhook();
  const deleteWebhook = useDeleteWebhook();
  const testWebhook = useTestWebhook();

  const webhooks = webhooksData?.webhooks || [];
  const eventTypes = eventTypesData?.event_types || [];

  const handleCreate = async () => {
    if (!newWebhook.name || !newWebhook.url || !newWebhook.events?.length) return;

    try {
      await createWebhook.mutateAsync(newWebhook as WebhookCreate);
      setShowCreateForm(false);
      setNewWebhook({ name: '', url: '', events: [], is_active: true });
    } catch {
      // Error handled by mutation
    }
  };

  const handleToggleActive = async (webhook: Webhook) => {
    await updateWebhook.mutateAsync({
      webhookId: webhook.id,
      data: { is_active: !webhook.is_active },
    });
  };

  const handleDelete = async (webhookId: string) => {
    if (confirm('Are you sure you want to delete this webhook?')) {
      await deleteWebhook.mutateAsync(webhookId);
    }
  };

  const handleTest = async (webhookId: string) => {
    setTestResult(null);
    try {
      const result = await testWebhook.mutateAsync({ webhookId });
      setTestResult({ success: result.success, error: result.error || undefined });
    } catch {
      setTestResult({ success: false, error: 'Failed to send test' });
    }
  };

  const toggleEvent = (event: string) => {
    const events = newWebhook.events || [];
    if (events.includes(event)) {
      setNewWebhook({ ...newWebhook, events: events.filter((e) => e !== event) });
    } else {
      setNewWebhook({ ...newWebhook, events: [...events, event] });
    }
  };

  // Group events by category
  const eventsByCategory = eventTypes.reduce(
    (acc, et) => {
      if (!acc[et.category]) acc[et.category] = [];
      acc[et.category].push(et);
      return acc;
    },
    {} as Record<string, typeof eventTypes>
  );

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-[#1E293B]">Webhooks</h2>
            <p className="text-sm text-[#64748B]">
              Send events to external services like Zapier, Make, or your own API
            </p>
          </div>
          <button onClick={onClose} className="text-[#64748B] hover:text-[#1E293B]">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Create Button or Form */}
        {!showCreateForm ? (
          <button
            onClick={() => setShowCreateForm(true)}
            className="mb-6 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#E2E8F0] p-4 text-[#64748B] transition-colors hover:border-[#FF6B35] hover:text-[#FF6B35]"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add Webhook
          </button>
        ) : (
          <div className="mb-6 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
            <h3 className="mb-4 font-semibold text-[#1E293B]">New Webhook</h3>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-[#1E293B]">Name</label>
                <input
                  type="text"
                  value={newWebhook.name}
                  onChange={(e) => setNewWebhook({ ...newWebhook, name: e.target.value })}
                  placeholder="My Zapier Webhook"
                  className="w-full rounded-lg border border-[#E2E8F0] px-4 py-2 text-[#1E293B] focus:border-[#FF6B35] focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-[#1E293B]">URL</label>
                <input
                  type="url"
                  value={newWebhook.url}
                  onChange={(e) => setNewWebhook({ ...newWebhook, url: e.target.value })}
                  placeholder="https://hooks.zapier.com/..."
                  className="w-full rounded-lg border border-[#E2E8F0] px-4 py-2 text-[#1E293B] focus:border-[#FF6B35] focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-[#1E293B]">
                  Secret (optional, for signature verification)
                </label>
                <input
                  type="text"
                  value={newWebhook.secret || ''}
                  onChange={(e) => setNewWebhook({ ...newWebhook, secret: e.target.value })}
                  placeholder="your-secret-key"
                  className="w-full rounded-lg border border-[#E2E8F0] px-4 py-2 text-[#1E293B] focus:border-[#FF6B35] focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-[#1E293B]">Events</label>
                <div className="max-h-48 space-y-3 overflow-y-auto rounded-lg border border-[#E2E8F0] bg-white p-3">
                  {Object.entries(eventsByCategory).map(([category, events]) => (
                    <div key={category}>
                      <p className="mb-1 text-xs font-semibold uppercase text-[#64748B]">
                        {category}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {events.map((et) => (
                          <button
                            key={et.event}
                            onClick={() => toggleEvent(et.event)}
                            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                              newWebhook.events?.includes(et.event)
                                ? 'bg-[#FF6B35] text-white'
                                : 'bg-[#F1F5F9] text-[#64748B] hover:bg-[#E2E8F0]'
                            }`}
                            title={et.description}
                          >
                            {et.event.split('.')[1]}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                {newWebhook.events && newWebhook.events.length > 0 && (
                  <p className="mt-1 text-xs text-[#64748B]">
                    {newWebhook.events.length} event(s) selected
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleCreate}
                  disabled={
                    createWebhook.isPending ||
                    !newWebhook.name ||
                    !newWebhook.url ||
                    !newWebhook.events?.length
                  }
                  className="rounded-lg bg-[#FF6B35] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#E85A2A] disabled:opacity-50"
                >
                  {createWebhook.isPending ? 'Creating...' : 'Create Webhook'}
                </button>
                <button
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewWebhook({ name: '', url: '', events: [], is_active: true });
                  }}
                  className="rounded-lg bg-[#F1F5F9] px-4 py-2 text-sm font-semibold text-[#64748B] transition-colors hover:bg-[#E2E8F0]"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Test Result Toast */}
        {testResult && (
          <div
            className={`mb-4 rounded-lg p-3 text-sm ${
              testResult.success ? 'bg-[#F0FDF4] text-[#22C55E]' : 'bg-[#FEF2F2] text-[#EF4444]'
            }`}
          >
            {testResult.success
              ? 'Test webhook sent successfully!'
              : `Test failed: ${testResult.error}`}
          </div>
        )}

        {/* Webhooks List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#FF6B35] border-t-transparent" />
          </div>
        ) : webhooks.length === 0 && !showCreateForm ? (
          <div className="rounded-xl border border-dashed border-[#E2E8F0] p-8 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#F1F5F9]">
              <WebhookIcon />
            </div>
            <p className="font-medium text-[#1E293B]">No webhooks configured</p>
            <p className="mt-1 text-sm text-[#64748B]">
              Create a webhook to send events to Zapier, Make, or your own API
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {webhooks.map((webhook) => (
              <div
                key={webhook.id}
                className="rounded-xl border border-[#E2E8F0] p-4 transition-all hover:border-[#3B82F6]/30"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-[#1E293B]">{webhook.name}</p>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          webhook.is_active
                            ? 'bg-[#F0FDF4] text-[#22C55E]'
                            : 'bg-[#F1F5F9] text-[#64748B]'
                        }`}
                      >
                        {webhook.is_active ? 'Active' : 'Paused'}
                      </span>
                    </div>
                    <p className="mt-1 break-all text-xs text-[#64748B]">{webhook.url}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {webhook.events.slice(0, 5).map((event) => (
                        <span
                          key={event}
                          className="rounded bg-[#F1F5F9] px-2 py-0.5 text-xs text-[#64748B]"
                        >
                          {event}
                        </span>
                      ))}
                      {webhook.events.length > 5 && (
                        <span className="rounded bg-[#F1F5F9] px-2 py-0.5 text-xs text-[#64748B]">
                          +{webhook.events.length - 5} more
                        </span>
                      )}
                    </div>
                    <div className="mt-2 flex gap-4 text-xs text-[#64748B]">
                      <span>Sent: {webhook.total_sent}</span>
                      <span>Failed: {webhook.total_failed}</span>
                      {webhook.last_triggered_at && (
                        <span>
                          Last triggered: {new Date(webhook.last_triggered_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    {webhook.last_error && (
                      <p className="mt-1 text-xs text-[#EF4444]">
                        Last error: {webhook.last_error}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleTest(webhook.id)}
                      disabled={testWebhook.isPending}
                      className="rounded-lg bg-[#F1F5F9] px-3 py-1.5 text-xs font-medium text-[#64748B] hover:bg-[#E2E8F0]"
                      title="Send test webhook"
                    >
                      Test
                    </button>
                    <button
                      onClick={() => handleToggleActive(webhook)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                        webhook.is_active
                          ? 'bg-[#FEF3C7] text-[#D97706] hover:bg-[#FDE68A]'
                          : 'bg-[#F0FDF4] text-[#22C55E] hover:bg-[#DCFCE7]'
                      }`}
                    >
                      {webhook.is_active ? 'Pause' : 'Enable'}
                    </button>
                    <button
                      onClick={() => handleDelete(webhook.id)}
                      className="rounded-lg bg-[#FEF2F2] px-3 py-1.5 text-xs font-medium text-[#EF4444] hover:bg-[#FEE2E2]"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>,
    document.body
  );
}

function APIKeysManagementModal({ onClose }: { onClose: () => void }) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [selectedScopes, setSelectedScopes] = useState<string[]>(['read']);
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const { data: apiKeysData, isLoading } = useAPIKeys();
  const { data: scopesData } = useAPIKeyScopes();
  const createAPIKey = useCreateAPIKey();
  const revokeAPIKey = useRevokeAPIKey();
  const deleteAPIKey = useDeleteAPIKey();

  const apiKeys = apiKeysData?.api_keys || [];
  // scopesData.scopes is an array of { scope: string, description: string }
  const availableScopes = scopesData?.scopes?.map((s) => s.scope) || ['read', 'write', 'delete'];

  const handleCreate = async () => {
    if (!newKeyName || selectedScopes.length === 0) return;

    try {
      const result = await createAPIKey.mutateAsync({
        name: newKeyName,
        scopes: selectedScopes,
      });
      setCreatedKey(result.key);
      setShowCreateForm(false);
      setNewKeyName('');
      setSelectedScopes(['read']);
    } catch {
      // Error handled by mutation
    }
  };

  const handleCopy = () => {
    if (createdKey) {
      navigator.clipboard.writeText(createdKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRevoke = async (keyId: string) => {
    if (
      confirm(
        'Are you sure you want to revoke this API key? It will no longer work for authentication.'
      )
    ) {
      await revokeAPIKey.mutateAsync(keyId);
    }
  };

  const handleDelete = async (keyId: string) => {
    if (confirm('Are you sure you want to permanently delete this API key?')) {
      await deleteAPIKey.mutateAsync(keyId);
    }
  };

  const toggleScope = (scope: string) => {
    if (selectedScopes.includes(scope)) {
      setSelectedScopes(selectedScopes.filter((s) => s !== scope));
    } else {
      setSelectedScopes([...selectedScopes, scope]);
    }
  };

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-[#1E293B]">API Keys</h2>
            <p className="text-sm text-[#64748B]">
              Manage API keys for external integrations and the public REST API
            </p>
          </div>
          <button onClick={onClose} className="text-[#64748B] hover:text-[#1E293B]">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Newly Created Key Alert */}
        {createdKey && (
          <div className="mb-6 rounded-xl border border-[#FEF3C7] bg-[#FFFBEB] p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#FEF3C7]">
                <svg
                  className="h-5 w-5 text-[#D97706]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-[#92400E]">Save your API key now!</p>
                <p className="mt-1 text-sm text-[#B45309]">
                  This is the only time you'll see this key. Copy it now and store it securely.
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <code className="flex-1 break-all rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 font-mono text-sm text-[#1E293B]">
                    {createdKey}
                  </code>
                  <button
                    onClick={handleCopy}
                    className="rounded-lg bg-[#FF6B35] px-4 py-2 text-sm font-medium text-white hover:bg-[#E85A2A]"
                  >
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <button
                  onClick={() => setCreatedKey(null)}
                  className="mt-3 text-sm text-[#D97706] underline hover:text-[#92400E]"
                >
                  I've saved my key
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create Button or Form */}
        {!showCreateForm ? (
          <button
            onClick={() => setShowCreateForm(true)}
            className="mb-6 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#E2E8F0] p-4 text-[#64748B] transition-colors hover:border-[#FF6B35] hover:text-[#FF6B35]"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Create API Key
          </button>
        ) : (
          <div className="mb-6 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
            <h3 className="mb-4 font-semibold text-[#1E293B]">New API Key</h3>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-[#1E293B]">Name</label>
                <input
                  type="text"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="My Integration Key"
                  className="w-full rounded-lg border border-[#E2E8F0] px-4 py-2 text-[#1E293B] focus:border-[#FF6B35] focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-[#1E293B]">Permissions</label>
                <div className="flex flex-wrap gap-2">
                  {availableScopes.map((scope) => (
                    <button
                      key={scope}
                      onClick={() => toggleScope(scope)}
                      className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                        selectedScopes.includes(scope)
                          ? 'bg-[#8B5CF6] text-white'
                          : 'bg-[#F1F5F9] text-[#64748B] hover:bg-[#E2E8F0]'
                      }`}
                    >
                      {scope.charAt(0).toUpperCase() + scope.slice(1)}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-xs text-[#64748B]">
                  {selectedScopes.length === 0
                    ? 'Select at least one permission'
                    : `Selected: ${selectedScopes.join(', ')}`}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleCreate}
                  disabled={createAPIKey.isPending || !newKeyName || selectedScopes.length === 0}
                  className="rounded-lg bg-[#FF6B35] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#E85A2A] disabled:opacity-50"
                >
                  {createAPIKey.isPending ? 'Creating...' : 'Create API Key'}
                </button>
                <button
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewKeyName('');
                    setSelectedScopes(['read']);
                  }}
                  className="rounded-lg bg-[#F1F5F9] px-4 py-2 text-sm font-semibold text-[#64748B] transition-colors hover:bg-[#E2E8F0]"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* API Keys List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#FF6B35] border-t-transparent" />
          </div>
        ) : apiKeys.length === 0 && !showCreateForm && !createdKey ? (
          <div className="rounded-xl border border-dashed border-[#E2E8F0] p-8 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#F1F5F9]">
              <KeyIcon />
            </div>
            <p className="font-medium text-[#1E293B]">No API keys created</p>
            <p className="mt-1 text-sm text-[#64748B]">
              Create an API key to access the public REST API
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {apiKeys.map((apiKey) => (
              <div
                key={apiKey.id}
                className="rounded-xl border border-[#E2E8F0] p-4 transition-all hover:border-[#3B82F6]/30"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-[#1E293B]">{apiKey.name}</p>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          apiKey.is_active
                            ? 'bg-[#F0FDF4] text-[#22C55E]'
                            : 'bg-[#FEF2F2] text-[#EF4444]'
                        }`}
                      >
                        {apiKey.is_active ? 'Active' : 'Revoked'}
                      </span>
                    </div>
                    <p className="mt-1 font-mono text-xs text-[#64748B]">
                      sp_live_{apiKey.key_prefix}...
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {apiKey.scopes.map((scope) => (
                        <span
                          key={scope}
                          className="rounded bg-[#F1F5F9] px-2 py-0.5 text-xs text-[#64748B]"
                        >
                          {scope}
                        </span>
                      ))}
                    </div>
                    <div className="mt-2 flex gap-4 text-xs text-[#64748B]">
                      <span>Requests: {apiKey.total_requests}</span>
                      {apiKey.last_used_at && (
                        <span>Last used: {new Date(apiKey.last_used_at).toLocaleDateString()}</span>
                      )}
                      <span>Created: {new Date(apiKey.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {apiKey.is_active && (
                      <button
                        onClick={() => handleRevoke(apiKey.id)}
                        className="rounded-lg bg-[#FEF3C7] px-3 py-1.5 text-xs font-medium text-[#D97706] hover:bg-[#FDE68A]"
                      >
                        Revoke
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(apiKey.id)}
                      className="rounded-lg bg-[#FEF2F2] px-3 py-1.5 text-xs font-medium text-[#EF4444] hover:bg-[#FEE2E2]"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* API Documentation Link */}
        <div className="mt-6 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#EDE9FE]">
              <svg
                className="h-5 w-5 text-[#8B5CF6]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <div>
              <p className="font-medium text-[#1E293B]">API Documentation</p>
              <p className="text-sm text-[#64748B]">
                View the public API endpoints at{' '}
                <code className="rounded bg-[#E2E8F0] px-1">/api/v1/public/</code>
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>,
    document.body
  );
}

function KeyIcon() {
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
        d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z"
      />
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

function AIAgentIcon() {
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
        d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
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

function UserIcon({ className = '' }: { className?: string }) {
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
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
      />
    </svg>
  );
}

function TrashIcon({ className = '' }: { className?: string }) {
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
        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
      />
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

function GoogleIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fill="#EA4335"
        d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.27 0 3.198 2.698 1.24 6.65l4.026 3.115Z"
      />
      <path
        fill="#34A853"
        d="M16.04 18.013c-1.09.703-2.474 1.078-4.04 1.078a7.077 7.077 0 0 1-6.723-4.823l-4.04 3.067A11.965 11.965 0 0 0 12 24c2.933 0 5.735-1.043 7.834-3l-3.793-2.987Z"
      />
      <path
        fill="#4A90E2"
        d="M19.834 21c2.195-2.048 3.62-5.096 3.62-9 0-.71-.109-1.473-.272-2.182H12v4.637h6.436c-.317 1.559-1.17 2.766-2.395 3.558L19.834 21Z"
      />
      <path
        fill="#FBBC05"
        d="M5.277 14.268A7.12 7.12 0 0 1 4.909 12c0-.782.125-1.533.357-2.235L1.24 6.65A11.934 11.934 0 0 0 0 12c0 1.92.445 3.73 1.237 5.335l4.04-3.067Z"
      />
    </svg>
  );
}

function MicrosoftIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 23 23">
      <path fill="#f35325" d="M1 1h10v10H1z" />
      <path fill="#81bc06" d="M12 1h10v10H12z" />
      <path fill="#05a6f0" d="M1 12h10v10H1z" />
      <path fill="#ffba08" d="M12 12h10v10H12z" />
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

// ==================== HUBSPOT MANAGEMENT MODAL ====================
function HubSpotManagementModal({ onClose }: { onClose: () => void }) {
  const { data: status, isLoading } = useHubSpotStatus();
  const { data: syncLogs } = useHubSpotSyncLogs({ limit: 10 });
  const connectHubSpot = useConnectHubSpot();
  const disconnectHubSpot = useDisconnectHubSpot();
  const updateSettings = useUpdateHubSpotSettings();
  const testConnection = useTestHubSpotConnection();

  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleConnect = async () => {
    try {
      const result = await connectHubSpot.mutateAsync(undefined);
      // Redirect to HubSpot OAuth
      window.location.href = result.authorization_url;
    } catch {
      // Error handled by mutation
    }
  };

  const handleDisconnect = async () => {
    if (confirm('Are you sure you want to disconnect HubSpot? This will stop syncing data.')) {
      await disconnectHubSpot.mutateAsync();
    }
  };

  const handleTest = async () => {
    try {
      const result = await testConnection.mutateAsync();
      setTestResult(result);
    } catch {
      setTestResult({ success: false, message: 'Connection test failed' });
    }
  };

  const handleToggleSync = async (enabled: boolean) => {
    await updateSettings.mutateAsync({ sync_enabled: enabled });
  };

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-xl"
              style={{ backgroundColor: '#FF7A5915' }}
            >
              <HubSpotIcon />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#1E293B]">HubSpot Integration</h2>
              <p className="text-sm text-[#64748B]">
                Sync your leads and activities with HubSpot CRM
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#64748B] hover:text-[#1E293B]">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#FF7A59] border-t-transparent" />
          </div>
        ) : !status?.connected ? (
          /* Not Connected State */
          <div className="py-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#FF7A59]/10">
              <HubSpotIcon />
            </div>
            <h3 className="text-lg font-semibold text-[#1E293B]">Connect to HubSpot</h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-[#64748B]">
              Connect your HubSpot account to automatically sync leads, contacts, and activities
              between SalesParrot and HubSpot CRM.
            </p>
            <div className="mt-6 space-y-3">
              <button
                onClick={handleConnect}
                disabled={connectHubSpot.isPending}
                className="inline-flex items-center gap-2 rounded-lg bg-[#FF7A59] px-6 py-3 font-medium text-white transition-colors hover:bg-[#E85A2A] disabled:opacity-50"
              >
                {connectHubSpot.isPending ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <HubSpotIcon />
                    Connect HubSpot
                  </>
                )}
              </button>
            </div>
            <div className="mt-8 rounded-xl bg-[#F8FAFC] p-4 text-left">
              <p className="mb-2 text-sm font-medium text-[#1E293B]">What gets synced:</p>
              <ul className="space-y-2 text-sm text-[#64748B]">
                <li className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-[#22C55E]" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Lead contact information
                </li>
                <li className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-[#22C55E]" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Lead status changes
                </li>
                <li className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-[#22C55E]" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Message and email activities
                </li>
              </ul>
            </div>
          </div>
        ) : (
          /* Connected State */
          <div className="space-y-6">
            {/* Connection Status */}
            <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#22C55E]/10">
                    <svg className="h-5 w-5 text-[#22C55E]" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-[#1E293B]">Connected</p>
                    <p className="text-sm text-[#64748B]">
                      {status.hub_domain || 'HubSpot Account'}
                      {status.portal_id && ` (Portal: ${status.portal_id})`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleTest}
                    disabled={testConnection.isPending}
                    className="rounded-lg border border-[#E2E8F0] px-3 py-1.5 text-sm font-medium text-[#64748B] hover:bg-white"
                  >
                    {testConnection.isPending ? 'Testing...' : 'Test Connection'}
                  </button>
                  <button
                    onClick={handleDisconnect}
                    disabled={disconnectHubSpot.isPending}
                    className="rounded-lg border border-[#EF4444] px-3 py-1.5 text-sm font-medium text-[#EF4444] hover:bg-[#FEF2F2]"
                  >
                    Disconnect
                  </button>
                </div>
              </div>
              {testResult && (
                <div
                  className={`mt-3 rounded-lg p-3 text-sm ${testResult.success ? 'bg-[#F0FDF4] text-[#22C55E]' : 'bg-[#FEF2F2] text-[#EF4444]'}`}
                >
                  {testResult.message}
                </div>
              )}
            </div>
            {/* Sync Settings */}
            <div className="rounded-xl border border-[#E2E8F0] p-4">
              <h3 className="mb-4 font-semibold text-[#1E293B]">Sync Settings</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-[#1E293B]">Enable Sync</p>
                    <p className="text-sm text-[#64748B]">Automatically sync data with HubSpot</p>
                  </div>
                  <button
                    onClick={() => handleToggleSync(!status.sync_enabled)}
                    disabled={updateSettings.isPending}
                    className={`relative h-6 w-11 rounded-full transition-colors ${
                      status.sync_enabled ? 'bg-[#22C55E]' : 'bg-[#E2E8F0]'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                        status.sync_enabled ? 'left-[22px]' : 'left-0.5'
                      }`}
                    />
                  </button>
                </div>
                {status.last_synced_at && (
                  <p className="text-sm text-[#64748B]">
                    Last synced: {new Date(status.last_synced_at).toLocaleString()}
                  </p>
                )}
                {status.last_error && (
                  <div className="rounded-lg bg-[#FEF2F2] p-3 text-sm text-[#EF4444]">
                    Last error: {status.last_error}
                  </div>
                )}
              </div>
            </div>
            {/* Recent Sync Activity */}
            {syncLogs && syncLogs.length > 0 && (
              <div className="rounded-xl border border-[#E2E8F0] p-4">
                <h3 className="mb-4 font-semibold text-[#1E293B]">Recent Sync Activity</h3>
                <div className="max-h-48 space-y-2 overflow-y-auto">
                  {syncLogs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center justify-between rounded-lg bg-[#F8FAFC] p-3 text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`h-2 w-2 rounded-full ${
                            log.success ? 'bg-[#22C55E]' : 'bg-[#EF4444]'
                          }`}
                        />
                        <span className="text-[#1E293B]">{log.operation}</span>
                        <span className="text-[#64748B]">({log.direction})</span>
                      </div>
                      <span className="text-[#94A3B8]">
                        {new Date(log.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </motion.div>,
    document.body
  );
}

// ==================== SALESFORCE MANAGEMENT MODAL ====================
function SalesforceManagementModal({ onClose }: { onClose: () => void }) {
  const { data: status, isLoading } = useSalesforceStatus();
  const { data: syncLogs } = useSalesforceSyncLogs({ limit: 10 });
  const connectSalesforce = useConnectSalesforce();
  const disconnectSalesforce = useDisconnectSalesforce();
  const updateSettings = useUpdateSalesforceSettings();
  const testConnection = useTestSalesforceConnection();

  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleConnect = async () => {
    try {
      const result = await connectSalesforce.mutateAsync(undefined);
      window.location.href = result.authorization_url;
    } catch {
      // Error handled by mutation
    }
  };

  const handleDisconnect = async () => {
    if (confirm('Are you sure you want to disconnect Salesforce? This will stop syncing data.')) {
      await disconnectSalesforce.mutateAsync();
    }
  };

  const handleTest = async () => {
    try {
      const result = await testConnection.mutateAsync();
      setTestResult(result);
    } catch {
      setTestResult({ success: false, message: 'Connection test failed' });
    }
  };

  const handleToggleSync = async (enabled: boolean) => {
    await updateSettings.mutateAsync({ sync_enabled: enabled });
  };

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-xl"
              style={{ backgroundColor: '#00A1E015' }}
            >
              <SalesforceIcon />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#1E293B]">Salesforce Integration</h2>
              <p className="text-sm text-[#64748B]">
                Sync your leads and activities with Salesforce CRM
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#64748B] hover:text-[#1E293B]">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#00A1E0] border-t-transparent" />
          </div>
        ) : !status?.connected ? (
          <div className="py-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#00A1E0]/10">
              <SalesforceIcon />
            </div>
            <h3 className="text-lg font-semibold text-[#1E293B]">Connect to Salesforce</h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-[#64748B]">
              Connect your Salesforce account to automatically sync leads, contacts, and activities
              between SalesParrot and Salesforce CRM.
            </p>
            <div className="mt-6 space-y-3">
              <button
                onClick={handleConnect}
                disabled={connectSalesforce.isPending}
                className="inline-flex items-center gap-2 rounded-lg bg-[#00A1E0] px-6 py-3 font-medium text-white transition-colors hover:bg-[#0088C7] disabled:opacity-50"
              >
                {connectSalesforce.isPending ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <SalesforceIcon />
                    Connect Salesforce
                  </>
                )}
              </button>
            </div>
            <div className="mt-8 rounded-xl bg-[#F8FAFC] p-4 text-left">
              <p className="mb-2 text-sm font-medium text-[#1E293B]">What gets synced:</p>
              <ul className="space-y-2 text-sm text-[#64748B]">
                <li className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-[#22C55E]" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Lead contact information
                </li>
                <li className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-[#22C55E]" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Lead status changes
                </li>
                <li className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-[#22C55E]" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Message and email activities
                </li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#22C55E]/10">
                    <svg className="h-5 w-5 text-[#22C55E]" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-[#1E293B]">Connected</p>
                    <p className="text-sm text-[#64748B]">
                      {status.instance_url || 'Salesforce Account'}
                      {status.organization_id && ` (Org: ${status.organization_id})`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleTest}
                    disabled={testConnection.isPending}
                    className="rounded-lg border border-[#E2E8F0] px-3 py-1.5 text-sm font-medium text-[#64748B] hover:bg-white"
                  >
                    {testConnection.isPending ? 'Testing...' : 'Test Connection'}
                  </button>
                  <button
                    onClick={handleDisconnect}
                    disabled={disconnectSalesforce.isPending}
                    className="rounded-lg border border-[#EF4444] px-3 py-1.5 text-sm font-medium text-[#EF4444] hover:bg-[#FEF2F2]"
                  >
                    Disconnect
                  </button>
                </div>
              </div>
              {testResult && (
                <div
                  className={`mt-3 rounded-lg p-3 text-sm ${testResult.success ? 'bg-[#F0FDF4] text-[#22C55E]' : 'bg-[#FEF2F2] text-[#EF4444]'}`}
                >
                  {testResult.message}
                </div>
              )}
            </div>

            <div className="rounded-xl border border-[#E2E8F0] p-4">
              <h3 className="mb-4 font-semibold text-[#1E293B]">Sync Settings</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-[#1E293B]">Enable Sync</p>
                    <p className="text-sm text-[#64748B]">
                      Automatically sync data with Salesforce
                    </p>
                  </div>
                  <button
                    onClick={() => handleToggleSync(!status.sync_enabled)}
                    disabled={updateSettings.isPending}
                    className={`relative h-6 w-11 rounded-full transition-colors ${
                      status.sync_enabled ? 'bg-[#22C55E]' : 'bg-[#E2E8F0]'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                        status.sync_enabled ? 'left-[22px]' : 'left-0.5'
                      }`}
                    />
                  </button>
                </div>
                {status.last_synced_at && (
                  <p className="text-sm text-[#64748B]">
                    Last synced: {new Date(status.last_synced_at).toLocaleString()}
                  </p>
                )}
                {status.last_error && (
                  <div className="rounded-lg bg-[#FEF2F2] p-3 text-sm text-[#EF4444]">
                    Last error: {status.last_error}
                  </div>
                )}
              </div>
            </div>

            {syncLogs && syncLogs.length > 0 && (
              <div className="rounded-xl border border-[#E2E8F0] p-4">
                <h3 className="mb-4 font-semibold text-[#1E293B]">Recent Sync Activity</h3>
                <div className="max-h-48 space-y-2 overflow-y-auto">
                  {syncLogs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center justify-between rounded-lg bg-[#F8FAFC] p-3 text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`h-2 w-2 rounded-full ${
                            log.success ? 'bg-[#22C55E]' : 'bg-[#EF4444]'
                          }`}
                        />
                        <span className="text-[#1E293B]">{log.operation}</span>
                        <span className="text-[#64748B]">({log.direction})</span>
                      </div>
                      <span className="text-[#94A3B8]">
                        {new Date(log.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </motion.div>,
    document.body
  );
}

// ==================== PIPEDRIVE MANAGEMENT MODAL ====================
function PipedriveManagementModal({ onClose }: { onClose: () => void }) {
  const { data: status, isLoading } = usePipedriveStatus();
  const { data: syncLogs } = usePipedriveSyncLogs({ limit: 10 });
  const connectPipedrive = useConnectPipedrive();
  const disconnectPipedrive = useDisconnectPipedrive();
  const updateSettings = useUpdatePipedriveSettings();
  const testConnection = useTestPipedriveConnection();

  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleConnect = async () => {
    try {
      const result = await connectPipedrive.mutateAsync(undefined);
      window.location.href = result.authorization_url;
    } catch {
      // Error handled by mutation
    }
  };

  const handleDisconnect = async () => {
    if (confirm('Are you sure you want to disconnect Pipedrive? This will stop syncing data.')) {
      await disconnectPipedrive.mutateAsync();
    }
  };

  const handleTest = async () => {
    try {
      const result = await testConnection.mutateAsync();
      setTestResult(result);
    } catch {
      setTestResult({ success: false, message: 'Connection test failed' });
    }
  };

  const handleToggleSync = async (enabled: boolean) => {
    await updateSettings.mutateAsync({ sync_enabled: enabled });
  };

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-xl"
              style={{ backgroundColor: '#01745915' }}
            >
              <PipedriveIcon />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#1E293B]">Pipedrive Integration</h2>
              <p className="text-sm text-[#64748B]">
                Sync your leads and activities with Pipedrive CRM
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#64748B] hover:text-[#1E293B]">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#017459] border-t-transparent" />
          </div>
        ) : !status?.connected ? (
          <div className="py-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#017459]/10">
              <PipedriveIcon />
            </div>
            <h3 className="text-lg font-semibold text-[#1E293B]">Connect to Pipedrive</h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-[#64748B]">
              Connect your Pipedrive account to automatically sync leads, persons, and activities
              between SalesParrot and Pipedrive CRM.
            </p>
            <div className="mt-6 space-y-3">
              <button
                onClick={handleConnect}
                disabled={connectPipedrive.isPending}
                className="inline-flex items-center gap-2 rounded-lg bg-[#017459] px-6 py-3 font-medium text-white transition-colors hover:bg-[#015B47] disabled:opacity-50"
              >
                {connectPipedrive.isPending ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <PipedriveIcon />
                    Connect Pipedrive
                  </>
                )}
              </button>
            </div>
            <div className="mt-8 rounded-xl bg-[#F8FAFC] p-4 text-left">
              <p className="mb-2 text-sm font-medium text-[#1E293B]">What gets synced:</p>
              <ul className="space-y-2 text-sm text-[#64748B]">
                <li className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-[#22C55E]" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Lead/Person contact information
                </li>
                <li className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-[#22C55E]" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Deal status and stages
                </li>
                <li className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-[#22C55E]" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Message and email activities
                </li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#22C55E]/10">
                    <svg className="h-5 w-5 text-[#22C55E]" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-[#1E293B]">Connected</p>
                    <p className="text-sm text-[#64748B]">
                      {status.company_domain || 'Pipedrive Account'}
                      {status.company_id && ` (ID: ${status.company_id})`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleTest}
                    disabled={testConnection.isPending}
                    className="rounded-lg border border-[#E2E8F0] px-3 py-1.5 text-sm font-medium text-[#64748B] hover:bg-white"
                  >
                    {testConnection.isPending ? 'Testing...' : 'Test Connection'}
                  </button>
                  <button
                    onClick={handleDisconnect}
                    disabled={disconnectPipedrive.isPending}
                    className="rounded-lg border border-[#EF4444] px-3 py-1.5 text-sm font-medium text-[#EF4444] hover:bg-[#FEF2F2]"
                  >
                    Disconnect
                  </button>
                </div>
              </div>
              {testResult && (
                <div
                  className={`mt-3 rounded-lg p-3 text-sm ${testResult.success ? 'bg-[#F0FDF4] text-[#22C55E]' : 'bg-[#FEF2F2] text-[#EF4444]'}`}
                >
                  {testResult.message}
                </div>
              )}
            </div>

            <div className="rounded-xl border border-[#E2E8F0] p-4">
              <h3 className="mb-4 font-semibold text-[#1E293B]">Sync Settings</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-[#1E293B]">Enable Sync</p>
                    <p className="text-sm text-[#64748B]">Automatically sync data with Pipedrive</p>
                  </div>
                  <button
                    onClick={() => handleToggleSync(!status.sync_enabled)}
                    disabled={updateSettings.isPending}
                    className={`relative h-6 w-11 rounded-full transition-colors ${
                      status.sync_enabled ? 'bg-[#22C55E]' : 'bg-[#E2E8F0]'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                        status.sync_enabled ? 'left-[22px]' : 'left-0.5'
                      }`}
                    />
                  </button>
                </div>
                {status.last_synced_at && (
                  <p className="text-sm text-[#64748B]">
                    Last synced: {new Date(status.last_synced_at).toLocaleString()}
                  </p>
                )}
                {status.last_error && (
                  <div className="rounded-lg bg-[#FEF2F2] p-3 text-sm text-[#EF4444]">
                    Last error: {status.last_error}
                  </div>
                )}
              </div>
            </div>

            {syncLogs && syncLogs.length > 0 && (
              <div className="rounded-xl border border-[#E2E8F0] p-4">
                <h3 className="mb-4 font-semibold text-[#1E293B]">Recent Sync Activity</h3>
                <div className="max-h-48 space-y-2 overflow-y-auto">
                  {syncLogs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center justify-between rounded-lg bg-[#F8FAFC] p-3 text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`h-2 w-2 rounded-full ${
                            log.success ? 'bg-[#22C55E]' : 'bg-[#EF4444]'
                          }`}
                        />
                        <span className="text-[#1E293B]">{log.operation}</span>
                        <span className="text-[#64748B]">({log.direction})</span>
                      </div>
                      <span className="text-[#94A3B8]">
                        {new Date(log.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </motion.div>,
    document.body
  );
}

// ==================== CLOSE MANAGEMENT MODAL ====================
function CloseManagementModal({ onClose }: { onClose: () => void }) {
  const { data: status, isLoading } = useCloseStatus();
  const { data: syncLogs } = useCloseSyncLogs({ limit: 10 });
  const connectClose = useConnectClose();
  const disconnectClose = useDisconnectClose();
  const updateSettings = useUpdateCloseSettings();
  const testConnection = useTestCloseConnection();

  const [apiKey, setApiKey] = useState('');
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleConnect = async () => {
    if (!apiKey.trim()) return;
    try {
      await connectClose.mutateAsync({ apiKey: apiKey.trim() });
      setApiKey('');
    } catch {
      // Error handled by mutation
    }
  };

  const handleDisconnect = async () => {
    if (confirm('Are you sure you want to disconnect Close CRM? This will stop syncing data.')) {
      await disconnectClose.mutateAsync();
    }
  };

  const handleTest = async () => {
    try {
      const result = await testConnection.mutateAsync();
      setTestResult(result);
    } catch {
      setTestResult({ success: false, message: 'Connection test failed' });
    }
  };

  const handleToggleSync = async (enabled: boolean) => {
    await updateSettings.mutateAsync({ sync_enabled: enabled });
  };

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-xl"
              style={{ backgroundColor: '#39393915' }}
            >
              <CloseIcon />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#1E293B]">Close CRM Integration</h2>
              <p className="text-sm text-[#64748B]">
                Sync your leads and activities with Close CRM
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#64748B] hover:text-[#1E293B]">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#393939] border-t-transparent" />
          </div>
        ) : !status?.connected ? (
          <div className="py-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#393939]/10">
              <CloseIcon />
            </div>
            <h3 className="text-lg font-semibold text-[#1E293B]">Connect to Close CRM</h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-[#64748B]">
              Connect your Close CRM account using an API key to automatically sync leads and
              activities.
            </p>
            <div className="mx-auto mt-6 max-w-sm space-y-4">
              <div className="text-left">
                <label className="mb-1 block text-sm font-medium text-[#1E293B]">
                  Close API Key
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="api_xxxxxxxxxxxxxxxx"
                  className="w-full rounded-lg border border-[#E2E8F0] px-4 py-2.5 text-sm focus:border-[#393939] focus:outline-none focus:ring-1 focus:ring-[#393939]"
                />
                <p className="mt-1 text-xs text-[#64748B]">
                  Find your API key in Close → Settings → API Keys
                </p>
              </div>
              <button
                onClick={handleConnect}
                disabled={connectClose.isPending || !apiKey.trim()}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#393939] px-6 py-3 font-medium text-white transition-colors hover:bg-[#2A2A2A] disabled:opacity-50"
              >
                {connectClose.isPending ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <CloseIcon />
                    Connect Close CRM
                  </>
                )}
              </button>
            </div>
            <div className="mt-8 rounded-xl bg-[#F8FAFC] p-4 text-left">
              <p className="mb-2 text-sm font-medium text-[#1E293B]">What gets synced:</p>
              <ul className="space-y-2 text-sm text-[#64748B]">
                <li className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-[#22C55E]" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Lead contact information
                </li>
                <li className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-[#22C55E]" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Lead status and pipeline stages
                </li>
                <li className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-[#22C55E]" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Email and call activities
                </li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#22C55E]/10">
                    <svg className="h-5 w-5 text-[#22C55E]" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-[#1E293B]">Connected</p>
                    <p className="text-sm text-[#64748B]">
                      {status.organization_name || 'Close CRM Account'}
                      {status.organization_id && ` (ID: ${status.organization_id})`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleTest}
                    disabled={testConnection.isPending}
                    className="rounded-lg border border-[#E2E8F0] px-3 py-1.5 text-sm font-medium text-[#64748B] hover:bg-white"
                  >
                    {testConnection.isPending ? 'Testing...' : 'Test Connection'}
                  </button>
                  <button
                    onClick={handleDisconnect}
                    disabled={disconnectClose.isPending}
                    className="rounded-lg border border-[#EF4444] px-3 py-1.5 text-sm font-medium text-[#EF4444] hover:bg-[#FEF2F2]"
                  >
                    Disconnect
                  </button>
                </div>
              </div>
              {testResult && (
                <div
                  className={`mt-3 rounded-lg p-3 text-sm ${testResult.success ? 'bg-[#F0FDF4] text-[#22C55E]' : 'bg-[#FEF2F2] text-[#EF4444]'}`}
                >
                  {testResult.message}
                </div>
              )}
            </div>

            <div className="rounded-xl border border-[#E2E8F0] p-4">
              <h3 className="mb-4 font-semibold text-[#1E293B]">Sync Settings</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-[#1E293B]">Enable Sync</p>
                    <p className="text-sm text-[#64748B]">Automatically sync data with Close CRM</p>
                  </div>
                  <button
                    onClick={() => handleToggleSync(!status.sync_enabled)}
                    disabled={updateSettings.isPending}
                    className={`relative h-6 w-11 rounded-full transition-colors ${
                      status.sync_enabled ? 'bg-[#22C55E]' : 'bg-[#E2E8F0]'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                        status.sync_enabled ? 'left-[22px]' : 'left-0.5'
                      }`}
                    />
                  </button>
                </div>
                {status.last_synced_at && (
                  <p className="text-sm text-[#64748B]">
                    Last synced: {new Date(status.last_synced_at).toLocaleString()}
                  </p>
                )}
                {status.last_error && (
                  <div className="rounded-lg bg-[#FEF2F2] p-3 text-sm text-[#EF4444]">
                    Last error: {status.last_error}
                  </div>
                )}
              </div>
            </div>

            {syncLogs && syncLogs.length > 0 && (
              <div className="rounded-xl border border-[#E2E8F0] p-4">
                <h3 className="mb-4 font-semibold text-[#1E293B]">Recent Sync Activity</h3>
                <div className="max-h-48 space-y-2 overflow-y-auto">
                  {syncLogs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center justify-between rounded-lg bg-[#F8FAFC] p-3 text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`h-2 w-2 rounded-full ${
                            log.success ? 'bg-[#22C55E]' : 'bg-[#EF4444]'
                          }`}
                        />
                        <span className="text-[#1E293B]">{log.operation}</span>
                        <span className="text-[#64748B]">({log.direction})</span>
                      </div>
                      <span className="text-[#94A3B8]">
                        {new Date(log.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </motion.div>,
    document.body
  );
}

// ==================== SLACK MANAGEMENT MODAL ====================
function SlackManagementModal({ onClose }: { onClose: () => void }) {
  const { data: status, isLoading } = useSlackStatus();
  const { refetch: refetchChannels } = useSlackChannels();
  const { data: notificationLogs } = useSlackNotificationLogs({ limit: 10 });
  const connectSlack = useConnectSlack();
  const disconnectSlack = useDisconnectSlack();
  const updateSettings = useUpdateSlackSettings();
  const testConnection = useTestSlackConnection();
  const sendTestNotification = useSendTestSlackNotification();

  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleConnect = async () => {
    try {
      const result = await connectSlack.mutateAsync(undefined);
      window.location.href = result.authorization_url;
    } catch {
      // Error handled by mutation
    }
  };

  const handleDisconnect = async () => {
    if (
      confirm('Are you sure you want to disconnect Slack? You will stop receiving notifications.')
    ) {
      await disconnectSlack.mutateAsync();
    }
  };

  const handleTest = async () => {
    try {
      const result = await testConnection.mutateAsync();
      setTestResult(result);
    } catch {
      setTestResult({ success: false, message: 'Connection test failed' });
    }
  };

  const handleSendTestNotification = async () => {
    try {
      const result = await sendTestNotification.mutateAsync();
      setTestResult(result);
    } catch {
      setTestResult({ success: false, message: 'Failed to send test notification' });
    }
  };

  const handleToggleSetting = async (
    setting: 'notify_replies' | 'notify_connections' | 'notify_campaigns',
    enabled: boolean
  ) => {
    await updateSettings.mutateAsync({ [setting]: enabled });
  };

  useEffect(() => {
    if (status?.connected) {
      refetchChannels();
    }
  }, [status?.connected, refetchChannels]);

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-xl"
              style={{ backgroundColor: '#4A154B15' }}
            >
              <SlackIcon />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#1E293B]">Slack Integration</h2>
              <p className="text-sm text-[#64748B]">
                Get notifications about replies, connections, and campaigns
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#64748B] hover:text-[#1E293B]">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#4A154B] border-t-transparent" />
          </div>
        ) : !status?.connected ? (
          <div className="py-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#4A154B]/10">
              <SlackIcon />
            </div>
            <h3 className="text-lg font-semibold text-[#1E293B]">Connect to Slack</h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-[#64748B]">
              Connect your Slack workspace to receive real-time notifications about new replies,
              connection accepts, and campaign updates.
            </p>
            <div className="mt-6 space-y-3">
              <button
                onClick={handleConnect}
                disabled={connectSlack.isPending}
                className="inline-flex items-center gap-2 rounded-lg bg-[#4A154B] px-6 py-3 font-medium text-white transition-colors hover:bg-[#3B1039] disabled:opacity-50"
              >
                {connectSlack.isPending ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <SlackIcon />
                    Add to Slack
                  </>
                )}
              </button>
            </div>
            <div className="mt-8 rounded-xl bg-[#F8FAFC] p-4 text-left">
              <p className="mb-2 text-sm font-medium text-[#1E293B]">
                You'll get notifications for:
              </p>
              <ul className="space-y-2 text-sm text-[#64748B]">
                <li className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-[#22C55E]" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  New replies to your messages
                </li>
                <li className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-[#22C55E]" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Connection request accepts
                </li>
                <li className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-[#22C55E]" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Campaign status updates
                </li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#22C55E]/10">
                    <svg className="h-5 w-5 text-[#22C55E]" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-[#1E293B]">Connected</p>
                    <p className="text-sm text-[#64748B]">
                      {status.team_name || 'Slack Workspace'}
                      {status.default_channel_name && ` → #${status.default_channel_name}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleTest}
                    disabled={testConnection.isPending}
                    className="rounded-lg border border-[#E2E8F0] px-3 py-1.5 text-sm font-medium text-[#64748B] hover:bg-white"
                  >
                    {testConnection.isPending ? 'Testing...' : 'Test Connection'}
                  </button>
                  <button
                    onClick={handleDisconnect}
                    disabled={disconnectSlack.isPending}
                    className="rounded-lg border border-[#EF4444] px-3 py-1.5 text-sm font-medium text-[#EF4444] hover:bg-[#FEF2F2]"
                  >
                    Disconnect
                  </button>
                </div>
              </div>
              {testResult && (
                <div
                  className={`mt-3 rounded-lg p-3 text-sm ${testResult.success ? 'bg-[#F0FDF4] text-[#22C55E]' : 'bg-[#FEF2F2] text-[#EF4444]'}`}
                >
                  {testResult.message}
                </div>
              )}
            </div>

            <div className="rounded-xl border border-[#E2E8F0] p-4">
              <h3 className="mb-4 font-semibold text-[#1E293B]">Notification Settings</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-[#1E293B]">New Replies</p>
                    <p className="text-sm text-[#64748B]">Get notified when leads reply</p>
                  </div>
                  <button
                    onClick={() => handleToggleSetting('notify_replies', !status.notify_replies)}
                    disabled={updateSettings.isPending}
                    className={`relative h-6 w-11 rounded-full transition-colors ${
                      status.notify_replies ? 'bg-[#22C55E]' : 'bg-[#E2E8F0]'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                        status.notify_replies ? 'left-[22px]' : 'left-0.5'
                      }`}
                    />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-[#1E293B]">Connection Accepts</p>
                    <p className="text-sm text-[#64748B]">Get notified when connections accept</p>
                  </div>
                  <button
                    onClick={() =>
                      handleToggleSetting('notify_connections', !status.notify_connections)
                    }
                    disabled={updateSettings.isPending}
                    className={`relative h-6 w-11 rounded-full transition-colors ${
                      status.notify_connections ? 'bg-[#22C55E]' : 'bg-[#E2E8F0]'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                        status.notify_connections ? 'left-[22px]' : 'left-0.5'
                      }`}
                    />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-[#1E293B]">Campaign Updates</p>
                    <p className="text-sm text-[#64748B]">
                      Get notified about campaign status changes
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      handleToggleSetting('notify_campaigns', !status.notify_campaigns)
                    }
                    disabled={updateSettings.isPending}
                    className={`relative h-6 w-11 rounded-full transition-colors ${
                      status.notify_campaigns ? 'bg-[#22C55E]' : 'bg-[#E2E8F0]'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                        status.notify_campaigns ? 'left-[22px]' : 'left-0.5'
                      }`}
                    />
                  </button>
                </div>
              </div>
              <div className="mt-4 border-t border-[#E2E8F0] pt-4">
                <button
                  onClick={handleSendTestNotification}
                  disabled={sendTestNotification.isPending}
                  className="rounded-lg border border-[#E2E8F0] px-4 py-2 text-sm font-medium text-[#64748B] hover:bg-[#F8FAFC]"
                >
                  {sendTestNotification.isPending ? 'Sending...' : 'Send Test Notification'}
                </button>
              </div>
            </div>

            {status.last_error && (
              <div className="rounded-lg bg-[#FEF2F2] p-3 text-sm text-[#EF4444]">
                Last error: {status.last_error}
              </div>
            )}

            {notificationLogs && notificationLogs.length > 0 && (
              <div className="rounded-xl border border-[#E2E8F0] p-4">
                <h3 className="mb-4 font-semibold text-[#1E293B]">Recent Notifications</h3>
                <div className="max-h-48 space-y-2 overflow-y-auto">
                  {notificationLogs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center justify-between rounded-lg bg-[#F8FAFC] p-3 text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`h-2 w-2 rounded-full ${
                            log.success ? 'bg-[#22C55E]' : 'bg-[#EF4444]'
                          }`}
                        />
                        <span className="text-[#1E293B]">{log.event_type}</span>
                      </div>
                      <span className="text-[#94A3B8]">
                        {new Date(log.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </motion.div>,
    document.body
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
