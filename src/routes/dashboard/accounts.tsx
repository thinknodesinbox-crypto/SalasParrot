import { createFileRoute } from '@tanstack/react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import {
  useLinkedInAccounts,
  useDeleteLinkedInAccount,
  useSyncLinkedInChats,
  useConnectLinkedInWithCredentials,
  useConnectLinkedInWithCookie,
  useSolveLinkedInCheckpoint,
  usePollLinkedInStatus,
  useEmailAccounts,
  useDeleteEmailAccount,
  useSyncEmailInbox,
  useConnectEmailIMAP,
  useInitGoogleOAuth,
  useInitMicrosoftOAuth,
  useInitGmailHostedAuth,
  useEmailAuthConfig,
  useAttachEmailToLinkedIn,
  useDetachEmailFromLinkedIn,
} from '../../lib/hooks/queries';
import type { LinkedInAccount, EmailAccount, CheckpointType } from '../../lib/types';
import { getErrorMessage } from '../../lib/api';

export const Route = createFileRoute('/dashboard/accounts')({
  component: AccountsPage,
});

type AccountTab = 'linkedin' | 'email';

function AccountsPage() {
  const [activeTab, setActiveTab] = useState<AccountTab>('linkedin');
  const [showConnectLinkedInModal, setShowConnectLinkedInModal] = useState(false);
  const [showConnectEmailModal, setShowConnectEmailModal] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Handle OAuth callback status from URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const status = urlParams.get('status');
    const message = urlParams.get('message');

    if (status === 'success') {
      setNotification({ type: 'success', message: 'Email account connected successfully!' });
      setActiveTab('email'); // Switch to email tab to show the new account
    } else if (status === 'error') {
      setNotification({ type: 'error', message: message || 'Failed to connect email account' });
      setActiveTab('email');
    }

    // Clear URL params without page reload
    if (status) {
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, []);

  // Auto-dismiss notification after 5 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const {
    data: linkedInAccounts = [],
    isLoading: linkedInLoading,
    error: linkedInError,
    refetch: refetchLinkedIn,
  } = useLinkedInAccounts();

  const {
    data: emailAccounts = [],
    isLoading: emailLoading,
    error: emailError,
    refetch: refetchEmail,
  } = useEmailAccounts();

  const isLoading = activeTab === 'linkedin' ? linkedInLoading : emailLoading;
  const error = activeTab === 'linkedin' ? linkedInError : emailError;
  const refetch = activeTab === 'linkedin' ? refetchLinkedIn : refetchEmail;

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <LoadingSpinner />
          <p className="text-[#64748B]">Loading accounts...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#FEF2F2]">
            <AlertIcon className="h-8 w-8 text-[#EF4444]" />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-[#1E293B]">Failed to load accounts</h3>
          <p className="mb-4 text-[#64748B]">{error.message}</p>
          <button
            onClick={() => refetch()}
            className="rounded-lg bg-[#0A66C2] px-4 py-2 font-medium text-white transition-colors hover:bg-[#004182]"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* OAuth Callback Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`flex items-center justify-between rounded-lg border p-4 ${
              notification.type === 'success'
                ? 'border-[#BBF7D0] bg-[#F0FDF4] text-[#166534]'
                : 'border-[#FECACA] bg-[#FEF2F2] text-[#DC2626]'
            }`}
          >
            <div className="flex items-center gap-3">
              {notification.type === 'success' ? (
                <CheckCircleIcon className="h-5 w-5 flex-shrink-0" />
              ) : (
                <AlertIcon className="h-5 w-5 flex-shrink-0" />
              )}
              <span className="text-sm font-medium">{notification.message}</span>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="ml-4 flex-shrink-0 rounded p-1 transition-colors hover:bg-black/5"
            >
              <CloseIcon />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Page Header with Tabs */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-xl font-bold text-[#1E293B] md:text-2xl">Sender Accounts</h1>
            <p className="mt-1 text-sm text-[#64748B] md:text-base">
              Connect and manage your LinkedIn and email senders
            </p>
          </div>
          <button
            onClick={() =>
              activeTab === 'linkedin'
                ? setShowConnectLinkedInModal(true)
                : setShowConnectEmailModal(true)
            }
            className={`flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 font-medium text-white transition-colors sm:w-auto ${
              activeTab === 'linkedin'
                ? 'bg-[#0A66C2] hover:bg-[#004182]'
                : 'bg-[#FF6B35] hover:bg-[#E65A2C]'
            }`}
          >
            {activeTab === 'linkedin' ? <LinkedInIcon /> : <EmailIcon />}
            Connect {activeTab === 'linkedin' ? 'LinkedIn' : 'Email'}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-[#E2E8F0]">
          <button
            onClick={() => setActiveTab('linkedin')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === 'linkedin'
                ? 'border-b-2 border-[#0A66C2] text-[#0A66C2]'
                : 'text-[#64748B] hover:text-[#1E293B]'
            }`}
          >
            <LinkedInIcon className="h-4 w-4" />
            LinkedIn ({linkedInAccounts.length})
          </button>
          <button
            onClick={() => setActiveTab('email')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === 'email'
                ? 'border-b-2 border-[#FF6B35] text-[#FF6B35]'
                : 'text-[#64748B] hover:text-[#1E293B]'
            }`}
          >
            <EmailIcon className="h-4 w-4" />
            Email ({emailAccounts.length})
          </button>
        </div>
      </div>

      {/* Info Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`flex items-start gap-3 rounded-xl border p-4 ${
          activeTab === 'linkedin'
            ? 'border-[#3B82F6]/20 bg-gradient-to-r from-[#EFF6FF] to-[#F0F9FF]'
            : 'border-[#FF6B35]/20 bg-gradient-to-r from-[#FFF7ED] to-[#FFFBEB]'
        }`}
      >
        <div
          className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${
            activeTab === 'linkedin' ? 'bg-[#3B82F6]/10' : 'bg-[#FF6B35]/10'
          }`}
        >
          <InfoIcon
            className={`h-5 w-5 ${activeTab === 'linkedin' ? 'text-[#3B82F6]' : 'text-[#FF6B35]'}`}
          />
        </div>
        <div>
          <p className="text-sm font-medium text-[#1E293B]">
            {activeTab === 'linkedin'
              ? 'LinkedIn accounts become "senders" when assigned to campaigns'
              : 'Email accounts enable follow-up emails in your campaigns'}
          </p>
          <p className="mt-1 text-sm text-[#64748B]">
            {activeTab === 'linkedin'
              ? 'Connect multiple accounts to scale your outreach while each account stays within safe daily limits.'
              : 'Connect your email accounts to send personalized follow-ups when LinkedIn connections are not accepted.'}
          </p>
        </div>
      </motion.div>

      {/* Content based on active tab */}
      <AnimatePresence mode="wait">
        {activeTab === 'linkedin' ? (
          <motion.div
            key="linkedin"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            {linkedInAccounts.length === 0 ? (
              <EmptyState onConnect={() => setShowConnectLinkedInModal(true)} />
            ) : (
              <AccountsList accounts={linkedInAccounts} />
            )}
          </motion.div>
        ) : (
          <motion.div
            key="email"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            {emailAccounts.length === 0 ? (
              <EmailEmptyState onConnect={() => setShowConnectEmailModal(true)} />
            ) : (
              <EmailAccountsList accounts={emailAccounts} />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Connect Modals */}
      <AnimatePresence>
        {showConnectLinkedInModal && (
          <ConnectLinkedInModal onClose={() => setShowConnectLinkedInModal(false)} />
        )}
        {showConnectEmailModal && (
          <ConnectEmailModal onClose={() => setShowConnectEmailModal(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}

function EmptyState({ onConnect }: { onConnect: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-[#E2E8F0] bg-white p-8 md:p-12"
    >
      <div className="mx-auto max-w-lg text-center">
        {/* Illustration */}
        <div className="relative mx-auto mb-8 h-40 w-40">
          {/* Background circles */}
          <div className="absolute inset-0 animate-pulse rounded-full bg-gradient-to-br from-[#EFF6FF] to-[#DBEAFE]" />
          <div className="absolute inset-6 rounded-full bg-white shadow-inner" />

          {/* Center icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[#E2E8F0] bg-white shadow-lg">
              <LinkedInIcon className="h-8 w-8 text-[#0A66C2]" />
            </div>
          </div>

          {/* Floating connection icon */}
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0],
            }}
            transition={{ duration: 3, repeat: Infinity }}
            className="absolute -right-2 bottom-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF6B35] to-[#F97316] shadow-lg"
          >
            <LinkIcon className="h-6 w-6 text-white" />
          </motion.div>
        </div>

        <h2 className="mb-3 text-2xl font-bold text-[#1E293B]">No LinkedIn accounts connected</h2>
        <p className="mb-8 text-lg text-[#64748B]">
          Connect your LinkedIn account to start sending connection requests and messages
          automatically.
        </p>

        <button
          onClick={onConnect}
          className="inline-flex items-center gap-3 rounded-xl bg-[#0A66C2] px-8 py-4 font-semibold text-white shadow-[0_4px_14px_rgba(10,102,194,0.35)] transition-all hover:-translate-y-0.5 hover:bg-[#004182] hover:shadow-[0_6px_20px_rgba(10,102,194,0.4)]"
        >
          <LinkedInIcon className="h-5 w-5" />
          Connect Your First Account
        </button>

        {/* Trust badges */}
        <div className="mt-10 flex items-center justify-center gap-6 text-sm text-[#64748B]">
          <div className="flex items-center gap-2">
            <ShieldCheckIcon className="h-4 w-4 text-[#22C55E]" />
            <span>Encrypted & Secure</span>
          </div>
          <div className="flex items-center gap-2">
            <ClockIcon className="h-4 w-4 text-[#3B82F6]" />
            <span>Safe Daily Limits</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function AccountsList({ accounts }: { accounts: LinkedInAccount[] }) {
  const deleteAccount = useDeleteLinkedInAccount();
  const syncChats = useSyncLinkedInChats();
  const detachEmail = useDetachEmailFromLinkedIn();
  const { data: emailAccounts = [] } = useEmailAccounts();
  const attachEmail = useAttachEmailToLinkedIn();

  const [syncingAccountId, setSyncingAccountId] = useState<string | null>(null);
  const [disconnectModal, setDisconnectModal] = useState<{
    open: boolean;
    accountId: string;
    accountName: string;
  }>({
    open: false,
    accountId: '',
    accountName: '',
  });
  const [attachEmailModal, setAttachEmailModal] = useState<{
    open: boolean;
    linkedinAccountId: string;
  }>({
    open: false,
    linkedinAccountId: '',
  });

  const handleDeleteClick = (accountId: string, accountName: string) => {
    setDisconnectModal({ open: true, accountId, accountName });
  };

  const handleSyncClick = async (accountId: string) => {
    setSyncingAccountId(accountId);
    try {
      const result = await syncChats.mutateAsync(accountId);
      console.log('Sync result:', result);
    } finally {
      setSyncingAccountId(null);
    }
  };

  const closeModal = () => {
    setDisconnectModal({ open: false, accountId: '', accountName: '' });
  };

  const handleConfirmDelete = async () => {
    await deleteAccount.mutateAsync({ accountId: disconnectModal.accountId });
    closeModal();
  };

  const handleAttachEmail = (linkedinAccountId: string) => {
    setAttachEmailModal({ open: true, linkedinAccountId });
  };

  const handleDetachEmail = async (emailAccountId: string) => {
    await detachEmail.mutateAsync(emailAccountId);
  };

  const handleConfirmAttachEmail = async (emailAccountId: string) => {
    await attachEmail.mutateAsync({
      emailAccountId,
      linkedinAccountId: attachEmailModal.linkedinAccountId,
    });
    setAttachEmailModal({ open: false, linkedinAccountId: '' });
  };

  // Get unattached email accounts for the attach modal
  const unattachedEmailAccounts = emailAccounts.filter((email) => !email.linkedin_account_id);

  // Calculate total daily capacity from daily_limits
  const totalDailyCapacity = accounts.reduce((sum, a) => {
    const limits = a.daily_limits || {};
    return sum + (limits.connections || 0) + (limits.messages || 0);
  }, 0);

  return (
    <div className="space-y-4">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
        <StatCard
          label="Total Accounts"
          value={accounts.length.toString()}
          icon={<AccountsIcon />}
          color="#0A66C2"
        />
        <StatCard
          label="Active Senders"
          value={accounts.filter((a) => a.status === 'connected').length.toString()}
          icon={<ActiveIcon />}
          color="#22C55E"
        />
        <StatCard
          label="Daily Capacity"
          value={totalDailyCapacity.toString()}
          icon={<CapacityIcon />}
          color="#FF6B35"
        />
        <StatCard
          label="Premium Accounts"
          value={accounts.filter((a) => a.subscription_type !== 'free').length.toString()}
          icon={<SentTodayIcon />}
          color="#8B5CF6"
        />
      </div>

      {/* Accounts Table */}
      <div className="rounded-xl border border-[#E2E8F0] bg-white">
        {/* Desktop Table */}
        <div className="hidden overflow-x-auto rounded-xl lg:block">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#64748B]">
                  Account
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#64748B]">
                  Email Account
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#64748B]">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#64748B]">
                  Daily Limit
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#64748B]">
                  Last Synced
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[#64748B]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {accounts.map((account) => (
                <AccountRow
                  key={account.id}
                  account={account}
                  onDelete={handleDeleteClick}
                  onSync={handleSyncClick}
                  isSyncing={syncingAccountId === account.id}
                  onAttachEmail={handleAttachEmail}
                  onDetachEmail={handleDetachEmail}
                />
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="divide-y divide-[#E2E8F0] lg:hidden">
          {accounts.map((account) => (
            <AccountCard
              key={account.id}
              account={account}
              onDelete={handleDeleteClick}
              onSync={handleSyncClick}
              isSyncing={syncingAccountId === account.id}
              onAttachEmail={handleAttachEmail}
              onDetachEmail={handleDetachEmail}
            />
          ))}
        </div>
      </div>

      {/* Disconnect Confirmation Modal */}
      <AnimatePresence>
        {disconnectModal.open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
            onClick={closeModal}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
            >
              <div className="p-6">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#FEF2F2]">
                  <svg
                    className="h-6 w-6 text-[#EF4444]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
                <h3 className="mb-2 text-center text-lg font-bold text-[#1E293B]">
                  Disconnect LinkedIn Account?
                </h3>
                <p className="mb-6 text-center text-[#64748B]">
                  Are you sure you want to disconnect{' '}
                  <span className="font-medium text-[#1E293B]">{disconnectModal.accountName}</span>?
                  This will stop all active campaigns using this account.
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={closeModal}
                    disabled={deleteAccount.isPending}
                    className="flex-1 rounded-xl border border-[#E2E8F0] px-4 py-2.5 font-medium text-[#1E293B] transition-colors hover:bg-[#F8FAFC] disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmDelete}
                    disabled={deleteAccount.isPending}
                    className="flex-1 rounded-xl bg-[#EF4444] px-4 py-2.5 font-medium text-white transition-colors hover:bg-[#DC2626] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {deleteAccount.isPending ? 'Disconnecting...' : 'Disconnect'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Attach Email Modal */}
      <AnimatePresence>
        {attachEmailModal.open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
            onClick={() => setAttachEmailModal({ open: false, linkedinAccountId: '' })}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
            >
              <div className="p-6">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#FF6B35]/10">
                  <EmailIcon className="h-6 w-6 text-[#FF6B35]" />
                </div>
                <h3 className="mb-2 text-center text-lg font-bold text-[#1E293B]">
                  Attach Email Account
                </h3>
                <p className="mb-6 text-center text-[#64748B]">
                  Select an email account to attach to this LinkedIn sender for email follow-ups.
                </p>

                {unattachedEmailAccounts.length === 0 ? (
                  <div className="mb-6 rounded-lg border border-dashed border-[#E2E8F0] p-6 text-center">
                    <p className="text-sm text-[#64748B]">
                      No unattached email accounts available.
                    </p>
                    <p className="mt-2 text-sm text-[#94A3B8]">
                      Connect an email account first from the Email tab.
                    </p>
                  </div>
                ) : (
                  <div className="mb-6 space-y-2">
                    {unattachedEmailAccounts.map((email) => (
                      <button
                        key={email.id}
                        onClick={() => handleConfirmAttachEmail(email.id)}
                        disabled={attachEmail.isPending}
                        className="flex w-full items-center gap-3 rounded-xl border border-[#E2E8F0] p-3 text-left transition-colors hover:border-[#FF6B35] hover:bg-[#FFF7ED] disabled:opacity-50"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#FF6B35]/10">
                          <EmailIcon className="h-5 w-5 text-[#FF6B35]" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-[#1E293B]">{email.email_address}</p>
                          <p className="text-sm capitalize text-[#64748B]">{email.provider}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                <button
                  onClick={() => setAttachEmailModal({ open: false, linkedinAccountId: '' })}
                  className="w-full rounded-xl border border-[#E2E8F0] px-4 py-2.5 font-medium text-[#1E293B] transition-colors hover:bg-[#F8FAFC]"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AccountCard({
  account,
  onDelete,
  onSync,
  isSyncing,
  onAttachEmail,
  onDetachEmail,
}: {
  account: LinkedInAccount;
  onDelete: (id: string, name: string) => void;
  onSync: (id: string) => void;
  isSyncing: boolean;
  onAttachEmail: (linkedinAccountId: string) => void;
  onDetachEmail: (emailAccountId: string) => void;
}) {
  const hasEmail = !!account.email_account;
  const [menuOpen, setMenuOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });

  useEffect(() => {
    if (menuOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + 4,
        right: window.innerWidth - rect.right,
      });
    }
  }, [menuOpen]);

  const statusColors: Record<string, { bg: string; text: string; label: string }> = {
    connected: { bg: 'bg-[#F0FDF4]', text: 'text-[#22C55E]', label: 'Connected' },
    disconnected: { bg: 'bg-[#F8FAFC]', text: 'text-[#64748B]', label: 'Disconnected' },
    warning: { bg: 'bg-[#FFFBEB]', text: 'text-[#F59E0B]', label: 'Warning' },
    banned: { bg: 'bg-[#FEF2F2]', text: 'text-[#EF4444]', label: 'Banned' },
  };

  const status = statusColors[account.status] || statusColors.disconnected;
  const displayName = account.name || 'LinkedIn Account';
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2);
  const dailyLimit =
    (account.daily_limits?.connections || 0) + (account.daily_limits?.messages || 0);

  const subscriptionLabels: Record<string, string> = {
    free: 'Free',
    premium: 'Premium',
    sales_nav: 'Sales Navigator',
    recruiter: 'Recruiter',
  };

  return (
    <div className="p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {account.avatar_url ? (
            <img
              src={account.avatar_url}
              alt={displayName}
              className="h-10 w-10 flex-shrink-0 rounded-full"
            />
          ) : (
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#0A66C2] to-[#004182] font-semibold text-white">
              {initials}
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate font-medium text-[#1E293B]">{displayName}</p>
            <p className="truncate text-sm text-[#64748B]">
              {subscriptionLabels[account.subscription_type] || 'Free'}
            </p>
          </div>
        </div>
        <div className="flex flex-shrink-0 items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${status.bg} ${status.text}`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            {status.label}
          </span>
          <div className="relative">
            <button
              ref={buttonRef}
              onClick={() => setMenuOpen(!menuOpen)}
              className="rounded-lg p-1.5 transition-colors hover:bg-[#E2E8F0]"
            >
              <MoreIcon />
            </button>
            <AnimatePresence>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-[100]" onClick={() => setMenuOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    style={{ top: menuPosition.top, right: menuPosition.right }}
                    className="fixed z-[101] w-48 rounded-lg border border-[#E2E8F0] bg-white py-1 shadow-lg"
                  >
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        onSync(account.id);
                      }}
                      disabled={isSyncing}
                      className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-[#1E293B] hover:bg-[#F8FAFC] disabled:opacity-50"
                    >
                      {isSyncing ? (
                        <>
                          <LoadingSpinner />
                          Syncing...
                        </>
                      ) : (
                        'Sync Messages'
                      )}
                    </button>
                    {hasEmail ? (
                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          onDetachEmail(account.email_account!.id);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-[#1E293B] hover:bg-[#F8FAFC]"
                      >
                        Detach Email
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          onAttachEmail(account.id);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-[#1E293B] hover:bg-[#F8FAFC]"
                      >
                        Attach Email
                      </button>
                    )}
                    {account.profile_url && (
                      <a
                        href={account.profile_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full px-4 py-2 text-left text-sm text-[#1E293B] hover:bg-[#F8FAFC]"
                      >
                        View LinkedIn Profile
                      </a>
                    )}
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        onDelete(account.id, account.name || 'LinkedIn Account');
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-[#EF4444] hover:bg-[#FEF2F2]"
                    >
                      Disconnect
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Attached Email */}
      {hasEmail && (
        <div className="mb-3 flex items-center gap-2 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FF6B35]/10">
            <EmailIcon className="h-4 w-4 text-[#FF6B35]" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-[#1E293B]">
              {account.email_account!.email_address}
            </p>
            <p className="text-xs capitalize text-[#64748B]">{account.email_account!.provider}</p>
          </div>
        </div>
      )}

      {/* Daily Limits */}
      <div className="mb-3">
        <div className="mb-1 flex items-center justify-between text-xs">
          <span className="text-[#64748B]">Daily Limit</span>
          <span className="font-medium text-[#1E293B]">{dailyLimit} actions</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-[#E2E8F0]">
          <div className="h-full rounded-full bg-[#0A66C2]" style={{ width: '100%' }} />
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-sm">
        {account.last_synced_at && (
          <div>
            <span className="text-[#94A3B8]">Last synced: </span>
            <span className="text-[#1E293B]">
              {new Date(account.last_synced_at).toLocaleDateString()}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function AccountRow({
  account,
  onDelete,
  onSync,
  isSyncing,
  onAttachEmail,
  onDetachEmail,
}: {
  account: LinkedInAccount;
  onDelete: (id: string, name: string) => void;
  onSync: (id: string) => void;
  isSyncing: boolean;
  onAttachEmail: (linkedinAccountId: string) => void;
  onDetachEmail: (emailAccountId: string) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });

  useEffect(() => {
    if (menuOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + 4,
        right: window.innerWidth - rect.right,
      });
    }
  }, [menuOpen]);

  const statusColors: Record<string, { bg: string; text: string; label: string }> = {
    connected: { bg: 'bg-[#F0FDF4]', text: 'text-[#22C55E]', label: 'Connected' },
    disconnected: { bg: 'bg-[#F8FAFC]', text: 'text-[#64748B]', label: 'Disconnected' },
    warning: { bg: 'bg-[#FFFBEB]', text: 'text-[#F59E0B]', label: 'Warning' },
    banned: { bg: 'bg-[#FEF2F2]', text: 'text-[#EF4444]', label: 'Banned' },
  };

  const status = statusColors[account.status] || statusColors.disconnected;
  const displayName = account.name || 'LinkedIn Account';
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2);
  const dailyLimit =
    (account.daily_limits?.connections || 0) + (account.daily_limits?.messages || 0);

  const subscriptionLabels: Record<string, string> = {
    free: 'Free',
    premium: 'Premium',
    sales_nav: 'Sales Navigator',
    recruiter: 'Recruiter',
  };

  const hasEmail = !!account.email_account;

  return (
    <tr className="transition-colors hover:bg-[#F8FAFC]">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          {account.avatar_url ? (
            <img src={account.avatar_url} alt={displayName} className="h-10 w-10 rounded-full" />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#0A66C2] to-[#004182] font-semibold text-white">
              {initials}
            </div>
          )}
          <div>
            <p className="font-medium text-[#1E293B]">{displayName}</p>
            <p className="text-sm text-[#64748B]">
              {subscriptionLabels[account.subscription_type] || 'Free'}
            </p>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        {hasEmail ? (
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FF6B35]/10">
              <EmailIcon className="h-4 w-4 text-[#FF6B35]" />
            </div>
            <div>
              <p className="text-sm font-medium text-[#1E293B]">
                {account.email_account!.email_address}
              </p>
              <p className="text-xs capitalize text-[#64748B]">{account.email_account!.provider}</p>
            </div>
          </div>
        ) : (
          <button
            onClick={() => onAttachEmail(account.id)}
            className="flex items-center gap-2 rounded-lg border border-dashed border-[#E2E8F0] px-3 py-2 text-sm text-[#64748B] transition-colors hover:border-[#FF6B35] hover:text-[#FF6B35]"
          >
            <PlusIcon className="h-4 w-4" />
            Attach Email
          </button>
        )}
      </td>
      <td className="px-6 py-4">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${status.bg} ${status.text}`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
          {status.label}
        </span>
      </td>
      <td className="px-6 py-4">
        <div className="w-32">
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="text-[#64748B]">Daily Limit</span>
            <span className="font-medium text-[#1E293B]">{dailyLimit}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-[#E2E8F0]">
            <div className="h-full rounded-full bg-[#0A66C2]" style={{ width: '100%' }} />
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        {account.last_synced_at ? (
          <span className="text-[#64748B]">
            {new Date(account.last_synced_at).toLocaleDateString()}
          </span>
        ) : (
          <span className="text-[#94A3B8]">Never</span>
        )}
      </td>
      <td className="px-6 py-4 text-right">
        <div className="relative">
          <button
            ref={buttonRef}
            onClick={() => setMenuOpen(!menuOpen)}
            className="rounded-lg p-2 transition-colors hover:bg-[#E2E8F0]"
          >
            <MoreIcon />
          </button>
          <AnimatePresence>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-[100]" onClick={() => setMenuOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  style={{ top: menuPosition.top, right: menuPosition.right }}
                  className="fixed z-[101] w-48 rounded-lg border border-[#E2E8F0] bg-white py-1 shadow-lg"
                >
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onSync(account.id);
                    }}
                    disabled={isSyncing}
                    className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-[#1E293B] hover:bg-[#F8FAFC] disabled:opacity-50"
                  >
                    {isSyncing ? (
                      <>
                        <LoadingSpinner />
                        Syncing...
                      </>
                    ) : (
                      'Sync Messages'
                    )}
                  </button>
                  {hasEmail ? (
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        onDetachEmail(account.email_account!.id);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-[#1E293B] hover:bg-[#F8FAFC]"
                    >
                      Detach Email
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        onAttachEmail(account.id);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-[#1E293B] hover:bg-[#F8FAFC]"
                    >
                      Attach Email
                    </button>
                  )}
                  {account.profile_url && (
                    <a
                      href={account.profile_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full px-4 py-2 text-left text-sm text-[#1E293B] hover:bg-[#F8FAFC]"
                    >
                      View LinkedIn Profile
                    </a>
                  )}
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onDelete(account.id, account.name || 'LinkedIn Account');
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-[#EF4444] hover:bg-[#FEF2F2]"
                  >
                    Disconnect
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </td>
    </tr>
  );
}

// Connect LinkedIn Modal - Uses Unipile custom auth
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
  const maxPollAttempts = 10; // Max 10 attempts (~20 minutes total)

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
  // Intentionally excludes isPolling/startAutoPolling to prevent infinite loops
  useEffect(() => {
    console.log('[useEffect] step:', step, 'accountId:', accountId, 'isPolling:', isPolling);
    if (step === 'in_app_validation' && accountId && !isPolling) {
      console.log('[useEffect] Starting auto polling');
      startAutoPolling();
    }
    return () => {
      console.log('[useEffect cleanup] Stopping polling');
      stopPolling();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, accountId]);

  const startAutoPolling = async () => {
    console.log('[startAutoPolling] isPolling:', isPolling);
    if (isPolling) return;
    console.log('[startAutoPolling] Starting polling');
    setIsPolling(true);
    setPollAttempts(0);
    setError('');
    pollOnce();
  };

  const pollOnce = async () => {
    if (!accountId) {
      console.log('[pollOnce] No accountId, returning');
      return;
    }

    console.log('[pollOnce] Polling with accountId:', accountId);

    try {
      const result = await pollStatus.mutateAsync(accountId);
      console.log('[pollOnce] Poll result:', result);
      if (result.status === 'connected') {
        console.log('[pollOnce] Status connected, handling response');
        handleAuthResponse(result);
      } else if (result.status === 'checkpoint') {
        // Still waiting or another checkpoint, schedule next poll
        console.log('[pollOnce] Status checkpoint, scheduling next poll');
        scheduleNextPoll();
      } else if (result.status === 'pending') {
        // Account still being created/verified, continue polling
        console.log('[pollOnce] Status pending, scheduling next poll');
        scheduleNextPoll();
      } else {
        // Unknown status, try to handle it
        console.log(
          '[pollOnce] Unknown status:',
          (result as { status: string }).status,
          'handling response'
        );
        handleAuthResponse(
          result as { status: string; account_id?: string; checkpoint?: { type: CheckpointType } }
        );
      }
    } catch (err) {
      console.log('[pollOnce] Error caught:', err);
      // Timeout or error - retry if under max attempts
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
    // Wait 2 seconds between polls
    console.log('[scheduleNextPoll] Scheduling next poll in 2 seconds');
    pollIntervalRef.current = setTimeout(() => {
      console.log('[scheduleNextPoll] Timeout fired, calling pollOnce');
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
      setError(getErrorMessage(err));
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
      setError(getErrorMessage(err));
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
      setError(getErrorMessage(err));
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
                <h2 className="text-lg font-bold text-[#1E293B]">Connect LinkedIn Account</h2>
                <button onClick={onClose} className="rounded-lg p-2 hover:bg-[#F8FAFC]">
                  <CloseIcon />
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
                      <LoadingSpinner />
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
                      <LoadingSpinner />
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
                  <CloseIcon />
                </button>
              </div>

              <div className="mb-6 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#0A66C2]/10">
                  <ShieldCheckIcon className="h-8 w-8 text-[#0A66C2]" />
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
                    <LoadingSpinner />
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
                <button
                  onClick={() => {
                    stopPolling();
                    onClose();
                  }}
                  className="rounded-lg p-2 hover:bg-[#F8FAFC]"
                >
                  <CloseIcon />
                </button>
              </div>

              <div className="mb-6 text-center">
                <div className="relative mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#0A66C2]/10">
                  <SmartphoneIcon className="h-8 w-8 text-[#0A66C2]" />
                  {isPolling && (
                    <div className="absolute inset-0 animate-spin rounded-full border-2 border-[#0A66C2] border-t-transparent" />
                  )}
                </div>
                <p className="mb-2 font-medium text-[#1E293B]">
                  {isPolling ? 'Waiting for confirmation...' : 'Confirm in LinkedIn App'}
                </p>
                <p className="text-sm text-[#64748B]">
                  Open the LinkedIn app on your phone and approve the login request.
                </p>
                {isPolling && pollAttempts > 0 && (
                  <p className="mt-2 text-xs text-[#94A3B8]">
                    Attempt {pollAttempts} of {maxPollAttempts}
                  </p>
                )}
              </div>

              {error && (
                <div className="mb-4 rounded-lg border border-[#EF4444]/20 bg-[#FEF2F2] p-3">
                  <p className="text-sm text-[#EF4444]">{error}</p>
                </div>
              )}

              {!isPolling && error && (
                <button
                  onClick={startAutoPolling}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#0A66C2] px-4 py-2.5 font-medium text-white hover:bg-[#004182]"
                >
                  Try Again
                </button>
              )}

              {isPolling && (
                <div className="flex items-center justify-center gap-2 text-sm text-[#64748B]">
                  <LoadingSpinner />
                  <span>Checking status automatically...</span>
                </div>
              )}
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
                <CheckCircleIcon className="h-8 w-8 text-[#22C55E]" />
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

// ==================== Email Account Components ====================

function EmailEmptyState({ onConnect }: { onConnect: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-[#E2E8F0] bg-white p-8 md:p-12"
    >
      <div className="mx-auto max-w-lg text-center">
        <div className="relative mx-auto mb-8 h-40 w-40">
          <div className="absolute inset-0 animate-pulse rounded-full bg-gradient-to-br from-[#FFF7ED] to-[#FFEDD5]" />
          <div className="absolute inset-6 rounded-full bg-white shadow-inner" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[#E2E8F0] bg-white shadow-lg">
              <EmailIcon className="h-8 w-8 text-[#FF6B35]" />
            </div>
          </div>
          <motion.div
            animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="absolute -right-2 bottom-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF6B35] to-[#F97316] shadow-lg"
          >
            <LinkIcon className="h-6 w-6 text-white" />
          </motion.div>
        </div>

        <h2 className="mb-3 text-2xl font-bold text-[#1E293B]">No email accounts connected</h2>
        <p className="mb-8 text-lg text-[#64748B]">
          Connect your email account to send follow-up emails when LinkedIn connections aren't
          accepted.
        </p>

        <button
          onClick={onConnect}
          className="inline-flex items-center gap-3 rounded-xl bg-[#FF6B35] px-8 py-4 font-semibold text-white shadow-[0_4px_14px_rgba(255,107,53,0.35)] transition-all hover:-translate-y-0.5 hover:bg-[#E65A2C] hover:shadow-[0_6px_20px_rgba(255,107,53,0.4)]"
        >
          <EmailIcon className="h-5 w-5" />
          Connect Your First Email
        </button>

        <div className="mt-10 flex items-center justify-center gap-6 text-sm text-[#64748B]">
          <div className="flex items-center gap-2">
            <ShieldCheckIcon className="h-4 w-4 text-[#22C55E]" />
            <span>Secure OAuth</span>
          </div>
          <div className="flex items-center gap-2">
            <ClockIcon className="h-4 w-4 text-[#3B82F6]" />
            <span>Daily Limits</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function EmailAccountsList({ accounts }: { accounts: EmailAccount[] }) {
  const deleteAccount = useDeleteEmailAccount();
  const syncInbox = useSyncEmailInbox();
  const [syncingAccountId, setSyncingAccountId] = useState<string | null>(null);
  const [disconnectModal, setDisconnectModal] = useState<{
    open: boolean;
    accountId: string;
    accountEmail: string;
  }>({
    open: false,
    accountId: '',
    accountEmail: '',
  });

  const handleDeleteClick = (accountId: string, accountEmail: string) => {
    setDisconnectModal({ open: true, accountId, accountEmail });
  };

  const handleSyncClick = async (accountId: string) => {
    setSyncingAccountId(accountId);
    try {
      await syncInbox.mutateAsync(accountId);
    } finally {
      setSyncingAccountId(null);
    }
  };

  const closeModal = () => {
    setDisconnectModal({ open: false, accountId: '', accountEmail: '' });
  };

  const handleConfirmDelete = async () => {
    await deleteAccount.mutateAsync(disconnectModal.accountId);
    closeModal();
  };

  const totalDailyCapacity = accounts.reduce((sum, a) => sum + (a.daily_limit || 100), 0);

  return (
    <div className="space-y-4">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
        <StatCard
          label="Total Accounts"
          value={accounts.length.toString()}
          icon={<EmailIcon />}
          color="#FF6B35"
        />
        <StatCard
          label="Active"
          value={accounts.filter((a) => a.status === 'connected').length.toString()}
          icon={<ActiveIcon />}
          color="#22C55E"
        />
        <StatCard
          label="Daily Capacity"
          value={totalDailyCapacity.toString()}
          icon={<CapacityIcon />}
          color="#3B82F6"
        />
        <StatCard
          label="Google/Microsoft"
          value={accounts.filter((a) => a.provider !== 'imap').length.toString()}
          icon={<SentTodayIcon />}
          color="#8B5CF6"
        />
      </div>

      {/* Accounts List */}
      <div className="rounded-xl border border-[#E2E8F0] bg-white">
        <div className="divide-y divide-[#E2E8F0]">
          {accounts.map((account) => (
            <EmailAccountRow
              key={account.id}
              account={account}
              onDelete={handleDeleteClick}
              onSync={handleSyncClick}
              isSyncing={syncingAccountId === account.id}
            />
          ))}
        </div>
      </div>

      {/* Disconnect Confirmation Modal */}
      <AnimatePresence>
        {disconnectModal.open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
            onClick={closeModal}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
            >
              <div className="p-6">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#FEF2F2]">
                  <AlertIcon className="h-6 w-6 text-[#EF4444]" />
                </div>
                <h3 className="mb-2 text-center text-lg font-bold text-[#1E293B]">
                  Disconnect Email Account?
                </h3>
                <p className="mb-6 text-center text-[#64748B]">
                  Are you sure you want to disconnect{' '}
                  <span className="font-medium text-[#1E293B]">{disconnectModal.accountEmail}</span>
                  ?
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={closeModal}
                    disabled={deleteAccount.isPending}
                    className="flex-1 rounded-xl border border-[#E2E8F0] px-4 py-2.5 font-medium text-[#1E293B] transition-colors hover:bg-[#F8FAFC] disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmDelete}
                    disabled={deleteAccount.isPending}
                    className="flex-1 rounded-xl bg-[#EF4444] px-4 py-2.5 font-medium text-white transition-colors hover:bg-[#DC2626] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {deleteAccount.isPending ? 'Disconnecting...' : 'Disconnect'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function EmailAccountRow({
  account,
  onDelete,
  onSync,
  isSyncing,
}: {
  account: EmailAccount;
  onDelete: (id: string, email: string) => void;
  onSync: (id: string) => void;
  isSyncing: boolean;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });

  useEffect(() => {
    if (menuOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + 4,
        right: window.innerWidth - rect.right,
      });
    }
  }, [menuOpen]);

  const statusColors: Record<string, { bg: string; text: string; label: string }> = {
    connected: { bg: 'bg-[#F0FDF4]', text: 'text-[#22C55E]', label: 'Connected' },
    disconnected: { bg: 'bg-[#F8FAFC]', text: 'text-[#64748B]', label: 'Disconnected' },
    reconnect_required: { bg: 'bg-[#FFFBEB]', text: 'text-[#F59E0B]', label: 'Reconnect Required' },
  };

  const providerLabels: Record<string, string> = {
    google: 'Gmail',
    microsoft: 'Outlook',
    imap: 'IMAP',
  };

  const providerColors: Record<string, string> = {
    google: '#EA4335',
    microsoft: '#0078D4',
    imap: '#64748B',
  };

  const status = statusColors[account.status] || statusColors.disconnected;
  const displayName = account.display_name || account.email_address;
  const initials = displayName.split(/[@.]/)[0].slice(0, 2).toUpperCase();

  return (
    <div className="flex items-center justify-between gap-4 p-4">
      <div className="flex min-w-0 items-center gap-3">
        <div
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full font-semibold text-white"
          style={{ backgroundColor: providerColors[account.provider] || '#64748B' }}
        >
          {initials}
        </div>
        <div className="min-w-0">
          <p className="truncate font-medium text-[#1E293B]">{displayName}</p>
          <p className="truncate text-sm text-[#64748B]">
            {providerLabels[account.provider]} • {account.daily_limit} emails/day
          </p>
        </div>
      </div>

      <div className="flex flex-shrink-0 items-center gap-3">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${status.bg} ${status.text}`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
          {status.label}
        </span>

        <div className="relative">
          <button
            ref={buttonRef}
            onClick={() => setMenuOpen(!menuOpen)}
            className="rounded-lg p-1.5 transition-colors hover:bg-[#E2E8F0]"
          >
            <MoreIcon />
          </button>
          <AnimatePresence>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-[100]" onClick={() => setMenuOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  style={{ top: menuPosition.top, right: menuPosition.right }}
                  className="fixed z-[101] w-48 rounded-lg border border-[#E2E8F0] bg-white py-1 shadow-lg"
                >
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onSync(account.id);
                    }}
                    disabled={isSyncing}
                    className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-[#1E293B] hover:bg-[#F8FAFC] disabled:opacity-50"
                  >
                    {isSyncing ? (
                      <>
                        <LoadingSpinner />
                        Syncing...
                      </>
                    ) : (
                      'Sync Inbox'
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onDelete(account.id, account.email_address);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-[#EF4444] hover:bg-[#FEF2F2]"
                  >
                    Disconnect
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// Connect Email Modal - Custom Auth Flow
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
      const returnUrl = window.location.href.split('?')[0]; // Remove any existing query params

      // Use appropriate auth method based on config
      const isHostedAuth = authConfig?.gmail_auth_method === 'unipile';
      const result = isHostedAuth
        ? await initGmailHostedAuth.mutateAsync({ returnUrl })
        : await initGoogleOAuth.mutateAsync({ returnUrl });

      // Redirect to OAuth consent screen (either Unipile hosted or Google direct)
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
      const returnUrl = window.location.href.split('?')[0]; // Remove any existing query params
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
                  <CloseIcon />
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
                    <GoogleIcon className="h-7 w-7" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-[#1E293B]">Gmail</p>
                    <p className="text-sm text-[#64748B]">Connect with Google account</p>
                  </div>
                </button>

                <button
                  onClick={handleMicrosoftOAuth}
                  className="flex w-full items-center gap-4 rounded-xl border border-[#E2E8F0] p-4 transition-all hover:border-[#0078D4]/30 hover:bg-[#EFF6FF]"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#0078D4]/10">
                    <MicrosoftIcon className="h-7 w-7" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-[#1E293B]">Outlook / Microsoft 365</p>
                    <p className="text-sm text-[#64748B]">Connect with Microsoft account</p>
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
                      <LoadingSpinner />
                      Connecting...
                    </>
                  ) : (
                    'Connect'
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {/* Loading - OAuth redirect in progress */}
          {step === 'loading' && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-6 text-center"
            >
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center">
                <LoadingSpinner />
              </div>
              <h2 className="mb-2 text-lg font-bold text-[#1E293B]">Redirecting...</h2>
              <p className="text-[#64748B]">Taking you to sign in with your email provider.</p>
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
                <CheckCircleIcon className="h-8 w-8 text-[#22C55E]" />
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

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 transition-shadow hover:shadow-md">
      <div className="flex items-center gap-3">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${color}15` }}
        >
          <div style={{ color }}>{icon}</div>
        </div>
        <div>
          <p className="text-2xl font-bold text-[#1E293B]">{value}</p>
          <p className="text-xs text-[#64748B]">{label}</p>
        </div>
      </div>
    </div>
  );
}

// Icons
function LinkedInIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path d="M16.338 16.338H13.67V12.16c0-.995-.017-2.277-1.387-2.277-1.39 0-1.601 1.086-1.601 2.207v4.248H8.014v-8.59h2.559v1.174h.037c.356-.675 1.227-1.387 2.526-1.387 2.703 0 3.203 1.778 3.203 4.092v4.711zM5.005 6.575a1.548 1.548 0 11-.003-3.096 1.548 1.548 0 01.003 3.096zm-1.337 9.763H6.34v-8.59H3.667v8.59zM17.668 1H2.328C1.595 1 1 1.581 1 2.298v15.403C1 18.418 1.595 19 2.328 19h15.34c.734 0 1.332-.582 1.332-1.299V2.298C19 1.581 18.402 1 17.668 1z" />
    </svg>
  );
}

function InfoIcon({ className = 'w-5 h-5' }: { className?: string }) {
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
        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function LinkIcon({ className = 'w-5 h-5' }: { className?: string }) {
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
        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
      />
    </svg>
  );
}

function ShieldCheckIcon({ className = 'w-5 h-5' }: { className?: string }) {
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
        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
      />
    </svg>
  );
}

function ClockIcon({ className = 'w-5 h-5' }: { className?: string }) {
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
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function CheckCircleIcon({ className = 'w-5 h-5' }: { className?: string }) {
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

function AlertIcon({ className = 'w-5 h-5' }: { className?: string }) {
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
        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
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
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function PlusIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  );
}

function MoreIcon() {
  return (
    <svg
      className="h-5 w-5 text-[#64748B]"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
      />
    </svg>
  );
}

function AccountsIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
      />
    </svg>
  );
}

function ActiveIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function CapacityIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  );
}

function SentTodayIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
    </svg>
  );
}

function LoadingSpinner() {
  return (
    <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
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
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 4c-4.418 0-8 3.582-8 8s3.582 8 8 8c.35 0 .694-.023 1.032-.066a5.5 5.5 0 01-.032-.934c0-2.485 2.015-4.5 4.5-4.5.322 0 .637.034.941.098C19.455 11.99 16.116 4 12 4z"
      />
      <circle cx="8" cy="10" r="1" fill="currentColor" />
      <circle cx="10" cy="14" r="1" fill="currentColor" />
      <circle cx="14" cy="11" r="1" fill="currentColor" />
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
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
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
      strokeWidth={2}
    >
      <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
      <line x1="12" y1="18" x2="12.01" y2="18" />
    </svg>
  );
}

function EmailIcon({ className = 'w-5 h-5' }: { className?: string }) {
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
        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
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
