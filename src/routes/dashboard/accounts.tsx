import { createFileRoute } from '@tanstack/react-router'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import {
  useLinkedInAccounts,
  useDeleteLinkedInAccount,
  useConnectLinkedInWithCredentials,
  useConnectLinkedInWithCookie,
  useSolveLinkedInCheckpoint,
  usePollLinkedInStatus,
} from '../../lib/hooks/queries'
import type { LinkedInAccount, CheckpointType } from '../../lib/types'

export const Route = createFileRoute('/dashboard/accounts')({
  component: AccountsPage,
})

function AccountsPage() {
  const [showConnectModal, setShowConnectModal] = useState(false)
  const { data: accounts = [], isLoading, error, refetch } = useLinkedInAccounts()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <LoadingSpinner />
          <p className="text-[#64748B]">Loading accounts...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-[#FEF2F2] rounded-full flex items-center justify-center">
            <AlertIcon className="w-8 h-8 text-[#EF4444]" />
          </div>
          <h3 className="text-lg font-semibold text-[#1E293B] mb-2">Failed to load accounts</h3>
          <p className="text-[#64748B] mb-4">{error.message}</p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-[#0A66C2] text-white font-medium rounded-lg hover:bg-[#004182] transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-[#1E293B]">LinkedIn Accounts</h1>
          <p className="text-[#64748B] mt-1 text-sm md:text-base">Connect and manage your LinkedIn senders</p>
        </div>
        <button
          onClick={() => setShowConnectModal(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#0A66C2] text-white font-medium rounded-lg hover:bg-[#004182] transition-colors w-full sm:w-auto"
        >
          <LinkedInIcon />
          Connect Account
        </button>
      </div>

      {/* Info Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-[#EFF6FF] to-[#F0F9FF] border border-[#3B82F6]/20 rounded-xl p-4 flex items-start gap-3"
      >
        <div className="w-10 h-10 rounded-xl bg-[#3B82F6]/10 flex items-center justify-center flex-shrink-0">
          <InfoIcon className="w-5 h-5 text-[#3B82F6]" />
        </div>
        <div>
          <p className="text-sm text-[#1E293B] font-medium">
            LinkedIn accounts become "senders" when assigned to campaigns
          </p>
          <p className="text-sm text-[#64748B] mt-1">
            Connect multiple accounts to scale your outreach while each account stays within safe daily limits.
          </p>
        </div>
      </motion.div>

      {/* Accounts List or Empty State */}
      {accounts.length === 0 ? (
        <EmptyState onConnect={() => setShowConnectModal(true)} />
      ) : (
        <AccountsList accounts={accounts} />
      )}

      {/* Connect Modal */}
      <AnimatePresence>
        {showConnectModal && (
          <ConnectLinkedInModal
            onClose={() => setShowConnectModal(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function EmptyState({ onConnect }: { onConnect: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl border border-[#E2E8F0] p-8 md:p-12"
    >
      <div className="max-w-lg mx-auto text-center">
        {/* Illustration */}
        <div className="w-40 h-40 mx-auto mb-8 relative">
          {/* Background circles */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#EFF6FF] to-[#DBEAFE] rounded-full animate-pulse" />
          <div className="absolute inset-6 bg-white rounded-full shadow-inner" />

          {/* Center icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 bg-white rounded-2xl shadow-lg flex items-center justify-center border border-[#E2E8F0]">
              <LinkedInIcon className="w-8 h-8 text-[#0A66C2]" />
            </div>
          </div>

          {/* Floating connection icon */}
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0]
            }}
            transition={{ duration: 3, repeat: Infinity }}
            className="absolute -right-2 bottom-4 w-12 h-12 bg-gradient-to-br from-[#FF6B35] to-[#F97316] rounded-xl flex items-center justify-center shadow-lg"
          >
            <LinkIcon className="w-6 h-6 text-white" />
          </motion.div>
        </div>

        <h2 className="text-2xl font-bold text-[#1E293B] mb-3">
          No LinkedIn accounts connected
        </h2>
        <p className="text-[#64748B] mb-8 text-lg">
          Connect your LinkedIn account to start sending connection requests and messages automatically.
        </p>

        <button
          onClick={onConnect}
          className="inline-flex items-center gap-3 px-8 py-4 bg-[#0A66C2] text-white font-semibold rounded-xl hover:bg-[#004182] transition-all shadow-[0_4px_14px_rgba(10,102,194,0.35)] hover:shadow-[0_6px_20px_rgba(10,102,194,0.4)] hover:-translate-y-0.5"
        >
          <LinkedInIcon className="w-5 h-5" />
          Connect Your First Account
        </button>

        {/* Trust badges */}
        <div className="mt-10 flex items-center justify-center gap-6 text-sm text-[#64748B]">
          <div className="flex items-center gap-2">
            <ShieldCheckIcon className="w-4 h-4 text-[#22C55E]" />
            <span>Encrypted & Secure</span>
          </div>
          <div className="flex items-center gap-2">
            <ClockIcon className="w-4 h-4 text-[#3B82F6]" />
            <span>Safe Daily Limits</span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function AccountsList({ accounts }: { accounts: LinkedInAccount[] }) {
  const deleteAccount = useDeleteLinkedInAccount()

  const handleDelete = async (accountId: string) => {
    if (confirm('Are you sure you want to disconnect this LinkedIn account?')) {
      try {
        await deleteAccount.mutateAsync(accountId)
      } catch {
        // Error handling is done in the mutation
      }
    }
  }

  // Calculate total daily capacity from daily_limits
  const totalDailyCapacity = accounts.reduce((sum, a) => {
    const limits = a.daily_limits || {}
    return sum + (limits.connections || 0) + (limits.messages || 0)
  }, 0)

  return (
    <div className="space-y-4">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatCard
          label="Total Accounts"
          value={accounts.length.toString()}
          icon={<AccountsIcon />}
          color="#0A66C2"
        />
        <StatCard
          label="Active Senders"
          value={accounts.filter(a => a.status === 'connected').length.toString()}
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
          value={accounts.filter(a => a.subscription_type !== 'free').length.toString()}
          icon={<SentTodayIcon />}
          color="#8B5CF6"
        />
      </div>

      {/* Accounts Table */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
        {/* Desktop Table */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
                <th className="text-left px-6 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wider">Account</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wider">Daily Limit</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wider">Last Synced</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wider">Profile</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {accounts.map((account) => (
                <AccountRow key={account.id} account={account} onDelete={handleDelete} />
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="lg:hidden divide-y divide-[#E2E8F0]">
          {accounts.map((account) => (
            <AccountCard key={account.id} account={account} onDelete={handleDelete} />
          ))}
        </div>
      </div>
    </div>
  )
}

function AccountCard({ account, onDelete }: { account: LinkedInAccount; onDelete: (id: string) => void }) {
  const [menuOpen, setMenuOpen] = useState(false)

  const statusColors: Record<string, { bg: string; text: string; label: string }> = {
    connected: { bg: 'bg-[#F0FDF4]', text: 'text-[#22C55E]', label: 'Connected' },
    disconnected: { bg: 'bg-[#F8FAFC]', text: 'text-[#64748B]', label: 'Disconnected' },
    warning: { bg: 'bg-[#FFFBEB]', text: 'text-[#F59E0B]', label: 'Warning' },
    banned: { bg: 'bg-[#FEF2F2]', text: 'text-[#EF4444]', label: 'Banned' },
  }

  const status = statusColors[account.status] || statusColors.disconnected
  const displayName = account.name || 'LinkedIn Account'
  const initials = displayName.split(' ').map(n => n[0]).join('').slice(0, 2)
  const dailyLimit = (account.daily_limits?.connections || 0) + (account.daily_limits?.messages || 0)

  const subscriptionLabels: Record<string, string> = {
    free: 'Free',
    premium: 'Premium',
    sales_nav: 'Sales Navigator',
    recruiter: 'Recruiter',
  }

  return (
    <div className="p-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          {account.avatar_url ? (
            <img
              src={account.avatar_url}
              alt={displayName}
              className="w-10 h-10 rounded-full flex-shrink-0"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0A66C2] to-[#004182] flex items-center justify-center text-white font-semibold flex-shrink-0">
              {initials}
            </div>
          )}
          <div className="min-w-0">
            <p className="font-medium text-[#1E293B] truncate">{displayName}</p>
            <p className="text-sm text-[#64748B] truncate">{subscriptionLabels[account.subscription_type] || 'Free'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${status.bg} ${status.text}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            {status.label}
          </span>
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1.5 rounded-lg hover:bg-[#E2E8F0] transition-colors"
            >
              <MoreIcon />
            </button>
            <AnimatePresence>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg border border-[#E2E8F0] shadow-lg py-1 z-50"
                  >
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
                        setMenuOpen(false)
                        onDelete(account.id)
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

      {/* Daily Limits */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-[#64748B]">Daily Limit</span>
          <span className="font-medium text-[#1E293B]">{dailyLimit} actions</span>
        </div>
        <div className="h-1.5 bg-[#E2E8F0] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#0A66C2] rounded-full"
            style={{ width: '100%' }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-sm">
        {account.last_synced_at && (
          <div>
            <span className="text-[#94A3B8]">Last synced: </span>
            <span className="text-[#1E293B]">{new Date(account.last_synced_at).toLocaleDateString()}</span>
          </div>
        )}
      </div>
    </div>
  )
}

function AccountRow({ account, onDelete }: { account: LinkedInAccount; onDelete: (id: string) => void }) {
  const [menuOpen, setMenuOpen] = useState(false)

  const statusColors: Record<string, { bg: string; text: string; label: string }> = {
    connected: { bg: 'bg-[#F0FDF4]', text: 'text-[#22C55E]', label: 'Connected' },
    disconnected: { bg: 'bg-[#F8FAFC]', text: 'text-[#64748B]', label: 'Disconnected' },
    warning: { bg: 'bg-[#FFFBEB]', text: 'text-[#F59E0B]', label: 'Warning' },
    banned: { bg: 'bg-[#FEF2F2]', text: 'text-[#EF4444]', label: 'Banned' },
  }

  const status = statusColors[account.status] || statusColors.disconnected
  const displayName = account.name || 'LinkedIn Account'
  const initials = displayName.split(' ').map(n => n[0]).join('').slice(0, 2)
  const dailyLimit = (account.daily_limits?.connections || 0) + (account.daily_limits?.messages || 0)

  const subscriptionLabels: Record<string, string> = {
    free: 'Free',
    premium: 'Premium',
    sales_nav: 'Sales Navigator',
    recruiter: 'Recruiter',
  }

  return (
    <tr className="hover:bg-[#F8FAFC] transition-colors">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          {account.avatar_url ? (
            <img
              src={account.avatar_url}
              alt={displayName}
              className="w-10 h-10 rounded-full"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0A66C2] to-[#004182] flex items-center justify-center text-white font-semibold">
              {initials}
            </div>
          )}
          <div>
            <p className="font-medium text-[#1E293B]">{displayName}</p>
            <p className="text-sm text-[#64748B]">{subscriptionLabels[account.subscription_type] || 'Free'}</p>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${status.bg} ${status.text}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-current" />
          {status.label}
        </span>
      </td>
      <td className="px-6 py-4">
        <div className="w-32">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-[#64748B]">Daily Limit</span>
            <span className="font-medium text-[#1E293B]">{dailyLimit}</span>
          </div>
          <div className="h-1.5 bg-[#E2E8F0] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#0A66C2] rounded-full"
              style={{ width: '100%' }}
            />
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        {account.last_synced_at ? (
          <span className="text-[#64748B]">{new Date(account.last_synced_at).toLocaleDateString()}</span>
        ) : (
          <span className="text-[#94A3B8]">Never</span>
        )}
      </td>
      <td className="px-6 py-4">
        {account.profile_url ? (
          <a
            href={account.profile_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#0A66C2] hover:underline"
          >
            View Profile
          </a>
        ) : (
          <span className="text-[#94A3B8]">-</span>
        )}
      </td>
      <td className="px-6 py-4 text-right">
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 rounded-lg hover:bg-[#E2E8F0] transition-colors"
          >
            <MoreIcon />
          </button>
          <AnimatePresence>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg border border-[#E2E8F0] shadow-lg py-1 z-50"
                >
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
                      setMenuOpen(false)
                      onDelete(account.id)
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
  )
}

// Connect LinkedIn Modal - Uses Unipile custom auth
type LinkedInAuthStep = 'method' | 'credentials' | 'cookie' | 'checkpoint' | 'in_app_validation' | 'success'

function ConnectLinkedInModal({
  onClose,
}: {
  onClose: () => void
}) {
  const [step, setStep] = useState<LinkedInAuthStep>('method')
  const [error, setError] = useState('')

  // Credentials form state
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  // Cookie form state
  const [cookie, setCookie] = useState('')
  const [userAgent, setUserAgent] = useState('')

  // Checkpoint state
  const [accountId, setAccountId] = useState('')
  const [checkpointType, setCheckpointType] = useState<CheckpointType | null>(null)
  const [verificationCode, setVerificationCode] = useState('')

  const connectWithCredentials = useConnectLinkedInWithCredentials()
  const connectWithCookie = useConnectLinkedInWithCookie()
  const solveCheckpoint = useSolveLinkedInCheckpoint()
  const pollStatus = usePollLinkedInStatus()

  const handleAuthResponse = (data: { status: string; account_id?: string; checkpoint?: { type: CheckpointType } }) => {
    if (data.status === 'connected') {
      setStep('success')
      setTimeout(() => onClose(), 1500)
    } else if (data.status === 'checkpoint' && data.checkpoint) {
      setAccountId(data.account_id || '')
      setCheckpointType(data.checkpoint.type)
      if (data.checkpoint.type === 'IN_APP_VALIDATION') {
        setStep('in_app_validation')
      } else {
        setStep('checkpoint')
      }
    }
  }

  const handleCredentialsSubmit = async () => {
    setError('')
    if (!username || !password) {
      setError('Please fill in all fields')
      return
    }

    try {
      const result = await connectWithCredentials.mutateAsync({ username, password })
      handleAuthResponse(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect')
    }
  }

  const handleCookieSubmit = async () => {
    setError('')
    if (!cookie) {
      setError('Please enter the li_at cookie')
      return
    }

    try {
      const result = await connectWithCookie.mutateAsync({
        access_token: cookie,
        user_agent: userAgent || undefined,
      })
      handleAuthResponse(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect')
    }
  }

  const handleCheckpointSubmit = async () => {
    setError('')
    if (!verificationCode) {
      setError('Please enter the verification code')
      return
    }

    try {
      const result = await solveCheckpoint.mutateAsync({
        account_id: accountId,
        code: verificationCode,
      })
      handleAuthResponse(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify')
    }
  }

  const handlePollStatus = async () => {
    setError('')
    try {
      const result = await pollStatus.mutateAsync(accountId)
      handleAuthResponse(result)
    } catch (err) {
      setError('Timed out waiting for confirmation. Please try again.')
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl"
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
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-[#1E293B]">Connect LinkedIn Account</h2>
                <button onClick={onClose} className="p-2 rounded-lg hover:bg-[#F8FAFC]">
                  <CloseIcon />
                </button>
              </div>

              <p className="text-[#64748B] mb-6">
                Choose how you want to connect your LinkedIn account.
              </p>

              <div className="space-y-3">
                <button
                  onClick={() => setStep('credentials')}
                  className="w-full flex items-center gap-4 p-4 border border-[#E2E8F0] rounded-xl hover:border-[#0A66C2]/30 hover:bg-[#F8FAFC] transition-all"
                >
                  <div className="w-12 h-12 rounded-xl bg-[#0A66C2]/10 flex items-center justify-center">
                    <LinkedInIcon className="w-7 h-7 text-[#0A66C2]" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-[#1E293B]">Email & Password</p>
                    <p className="text-sm text-[#64748B]">Sign in with your LinkedIn credentials</p>
                  </div>
                </button>

                <button
                  onClick={() => setStep('cookie')}
                  className="w-full flex items-center gap-4 p-4 border border-[#E2E8F0] rounded-xl hover:border-[#0A66C2]/30 hover:bg-[#F8FAFC] transition-all"
                >
                  <div className="w-12 h-12 rounded-xl bg-[#64748B]/10 flex items-center justify-center">
                    <CookieIcon className="w-7 h-7 text-[#64748B]" />
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
              <div className="flex items-center gap-3 mb-6">
                <button onClick={() => setStep('method')} className="p-2 rounded-lg hover:bg-[#F8FAFC]">
                  <BackArrowIcon />
                </button>
                <h2 className="text-lg font-bold text-[#1E293B]">Sign in to LinkedIn</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#1E293B] mb-2">Email</label>
                  <input
                    type="email"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full px-4 py-2.5 rounded-lg border border-[#E2E8F0] focus:outline-none focus:ring-2 focus:ring-[#0A66C2]/20 focus:border-[#0A66C2]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1E293B] mb-2">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Your LinkedIn password"
                    className="w-full px-4 py-2.5 rounded-lg border border-[#E2E8F0] focus:outline-none focus:ring-2 focus:ring-[#0A66C2]/20 focus:border-[#0A66C2]"
                  />
                </div>

                {error && (
                  <div className="p-3 bg-[#FEF2F2] border border-[#EF4444]/20 rounded-lg">
                    <p className="text-sm text-[#EF4444]">{error}</p>
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setStep('method')}
                  className="flex-1 px-4 py-2.5 border border-[#E2E8F0] rounded-lg font-medium text-[#64748B] hover:bg-[#F8FAFC]"
                >
                  Back
                </button>
                <button
                  onClick={handleCredentialsSubmit}
                  disabled={connectWithCredentials.isPending}
                  className="flex-1 px-4 py-2.5 bg-[#0A66C2] text-white rounded-lg font-medium hover:bg-[#004182] disabled:opacity-50 flex items-center justify-center gap-2"
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
              <div className="flex items-center gap-3 mb-6">
                <button onClick={() => setStep('method')} className="p-2 rounded-lg hover:bg-[#F8FAFC]">
                  <BackArrowIcon />
                </button>
                <h2 className="text-lg font-bold text-[#1E293B]">Connect with Cookie</h2>
              </div>

              <div className="p-4 bg-[#FFF7ED] border border-[#FF6B35]/20 rounded-xl mb-4">
                <div className="flex items-start gap-3">
                  <InfoIcon className="w-5 h-5 text-[#FF6B35] flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-[#92400E]">
                    <p className="font-medium">How to get your li_at cookie:</p>
                    <ol className="mt-1 list-decimal list-inside space-y-1">
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
                  <label className="block text-sm font-medium text-[#1E293B] mb-2">li_at Cookie</label>
                  <textarea
                    value={cookie}
                    onChange={(e) => setCookie(e.target.value)}
                    placeholder="Paste your li_at cookie value here"
                    rows={3}
                    className="w-full px-4 py-2.5 rounded-lg border border-[#E2E8F0] focus:outline-none focus:ring-2 focus:ring-[#0A66C2]/20 focus:border-[#0A66C2] resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1E293B] mb-2">User Agent (Optional)</label>
                  <input
                    type="text"
                    value={userAgent}
                    onChange={(e) => setUserAgent(e.target.value)}
                    placeholder="Your browser's user agent"
                    className="w-full px-4 py-2.5 rounded-lg border border-[#E2E8F0] focus:outline-none focus:ring-2 focus:ring-[#0A66C2]/20 focus:border-[#0A66C2]"
                  />
                  <p className="text-xs text-[#64748B] mt-1">Recommended to prevent disconnection</p>
                </div>

                {error && (
                  <div className="p-3 bg-[#FEF2F2] border border-[#EF4444]/20 rounded-lg">
                    <p className="text-sm text-[#EF4444]">{error}</p>
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setStep('method')}
                  className="flex-1 px-4 py-2.5 border border-[#E2E8F0] rounded-lg font-medium text-[#64748B] hover:bg-[#F8FAFC]"
                >
                  Back
                </button>
                <button
                  onClick={handleCookieSubmit}
                  disabled={connectWithCookie.isPending}
                  className="flex-1 px-4 py-2.5 bg-[#0A66C2] text-white rounded-lg font-medium hover:bg-[#004182] disabled:opacity-50 flex items-center justify-center gap-2"
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
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-[#1E293B]">Verification Required</h2>
                <button onClick={onClose} className="p-2 rounded-lg hover:bg-[#F8FAFC]">
                  <CloseIcon />
                </button>
              </div>

              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-4 bg-[#0A66C2]/10 rounded-full flex items-center justify-center">
                  <ShieldCheckIcon className="w-8 h-8 text-[#0A66C2]" />
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
                  <label className="block text-sm font-medium text-[#1E293B] mb-2">
                    {checkpointType === 'PHONE_REGISTER' ? 'Phone Number' : 'Verification Code'}
                  </label>
                  <input
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    placeholder={checkpointType === 'PHONE_REGISTER' ? '(+1)1234567890' : 'Enter code'}
                    className="w-full px-4 py-2.5 rounded-lg border border-[#E2E8F0] focus:outline-none focus:ring-2 focus:ring-[#0A66C2]/20 focus:border-[#0A66C2] text-center text-lg tracking-widest"
                  />
                </div>

                {error && (
                  <div className="p-3 bg-[#FEF2F2] border border-[#EF4444]/20 rounded-lg">
                    <p className="text-sm text-[#EF4444]">{error}</p>
                  </div>
                )}
              </div>

              <button
                onClick={handleCheckpointSubmit}
                disabled={solveCheckpoint.isPending}
                className="w-full mt-6 px-4 py-2.5 bg-[#0A66C2] text-white rounded-lg font-medium hover:bg-[#004182] disabled:opacity-50 flex items-center justify-center gap-2"
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
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-[#1E293B]">Confirm in LinkedIn App</h2>
                <button onClick={onClose} className="p-2 rounded-lg hover:bg-[#F8FAFC]">
                  <CloseIcon />
                </button>
              </div>

              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-4 bg-[#0A66C2]/10 rounded-full flex items-center justify-center">
                  <SmartphoneIcon className="w-8 h-8 text-[#0A66C2]" />
                </div>
                <p className="text-[#64748B]">
                  Open the LinkedIn app on your phone and confirm the login request.
                </p>
              </div>

              {error && (
                <div className="p-3 mb-4 bg-[#FEF2F2] border border-[#EF4444]/20 rounded-lg">
                  <p className="text-sm text-[#EF4444]">{error}</p>
                </div>
              )}

              <button
                onClick={handlePollStatus}
                disabled={pollStatus.isPending}
                className="w-full px-4 py-2.5 bg-[#0A66C2] text-white rounded-lg font-medium hover:bg-[#004182] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {pollStatus.isPending ? (
                  <>
                    <LoadingSpinner />
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
              <div className="w-16 h-16 mx-auto mb-4 bg-[#F0FDF4] rounded-full flex items-center justify-center">
                <CheckCircleIcon className="w-8 h-8 text-[#22C55E]" />
              </div>
              <h2 className="text-lg font-bold text-[#1E293B] mb-2">Successfully Connected!</h2>
              <p className="text-[#64748B]">Your LinkedIn account has been connected.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  )
}

function StatCard({ label, value, icon, color }: { label: string; value: string; icon: React.ReactNode; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
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
  )
}

// Icons
function LinkedInIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path d="M16.338 16.338H13.67V12.16c0-.995-.017-2.277-1.387-2.277-1.39 0-1.601 1.086-1.601 2.207v4.248H8.014v-8.59h2.559v1.174h.037c.356-.675 1.227-1.387 2.526-1.387 2.703 0 3.203 1.778 3.203 4.092v4.711zM5.005 6.575a1.548 1.548 0 11-.003-3.096 1.548 1.548 0 01.003 3.096zm-1.337 9.763H6.34v-8.59H3.667v8.59zM17.668 1H2.328C1.595 1 1 1.581 1 2.298v15.403C1 18.418 1.595 19 2.328 19h15.34c.734 0 1.332-.582 1.332-1.299V2.298C19 1.581 18.402 1 17.668 1z" />
    </svg>
  )
}

function InfoIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function LinkIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    </svg>
  )
}

function ShieldCheckIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  )
}

function ClockIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function CheckCircleIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function AlertIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg className="w-5 h-5 text-[#64748B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

function MoreIcon() {
  return (
    <svg className="w-5 h-5 text-[#64748B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
    </svg>
  )
}

function AccountsIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  )
}

function ActiveIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  )
}

function CapacityIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  )
}

function SentTodayIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
    </svg>
  )
}

function LoadingSpinner() {
  return (
    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  )
}

function CookieIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4c-4.418 0-8 3.582-8 8s3.582 8 8 8c.35 0 .694-.023 1.032-.066a5.5 5.5 0 01-.032-.934c0-2.485 2.015-4.5 4.5-4.5.322 0 .637.034.941.098C19.455 11.99 16.116 4 12 4z" />
      <circle cx="8" cy="10" r="1" fill="currentColor" />
      <circle cx="10" cy="14" r="1" fill="currentColor" />
      <circle cx="14" cy="11" r="1" fill="currentColor" />
    </svg>
  )
}

function BackArrowIcon() {
  return (
    <svg className="w-5 h-5 text-[#64748B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
  )
}

function SmartphoneIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
      <line x1="12" y1="18" x2="12.01" y2="18" />
    </svg>
  )
}
