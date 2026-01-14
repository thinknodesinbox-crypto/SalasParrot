import { createFileRoute } from '@tanstack/react-router'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'

export const Route = createFileRoute('/dashboard/accounts')({
  component: AccountsPage,
})

interface LinkedInAccount {
  id: string
  name: string
  email: string
  avatar?: string
  status: 'connected' | 'warming' | 'paused' | 'error'
  dailyLimit: number
  sentToday: number
  connectionRate: number
  campaigns: number
}

function AccountsPage() {
  const [showConnectModal, setShowConnectModal] = useState(false)
  const [accounts, setAccounts] = useState<LinkedInAccount[]>([])

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
            onSuccess={(account) => {
              setAccounts([...accounts, account])
              setShowConnectModal(false)
            }}
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
          value={accounts.reduce((sum, a) => sum + a.dailyLimit, 0).toString()}
          icon={<CapacityIcon />}
          color="#FF6B35"
        />
        <StatCard
          label="Sent Today"
          value={accounts.reduce((sum, a) => sum + a.sentToday, 0).toString()}
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
                <th className="text-left px-6 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wider">Daily Progress</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wider">Connection Rate</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wider">Campaigns</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {accounts.map((account) => (
                <AccountRow key={account.id} account={account} />
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="lg:hidden divide-y divide-[#E2E8F0]">
          {accounts.map((account) => (
            <AccountCard key={account.id} account={account} />
          ))}
        </div>
      </div>
    </div>
  )
}

function AccountCard({ account }: { account: LinkedInAccount }) {
  const [menuOpen, setMenuOpen] = useState(false)

  const statusColors = {
    connected: { bg: 'bg-[#F0FDF4]', text: 'text-[#22C55E]', label: 'Connected' },
    warming: { bg: 'bg-[#FFFBEB]', text: 'text-[#F59E0B]', label: 'Warming Up' },
    paused: { bg: 'bg-[#F8FAFC]', text: 'text-[#64748B]', label: 'Paused' },
    error: { bg: 'bg-[#FEF2F2]', text: 'text-[#EF4444]', label: 'Error' },
  }

  const status = statusColors[account.status]
  const progressPercent = (account.sentToday / account.dailyLimit) * 100

  return (
    <div className="p-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0A66C2] to-[#004182] flex items-center justify-center text-white font-semibold flex-shrink-0">
            {account.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div className="min-w-0">
            <p className="font-medium text-[#1E293B] truncate">{account.name}</p>
            <p className="text-sm text-[#64748B] truncate">{account.email}</p>
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
                    <button className="w-full px-4 py-2 text-left text-sm text-[#1E293B] hover:bg-[#F8FAFC]">
                      View Details
                    </button>
                    <button className="w-full px-4 py-2 text-left text-sm text-[#F59E0B] hover:bg-[#FFFBEB]">
                      Pause Account
                    </button>
                    <button className="w-full px-4 py-2 text-left text-sm text-[#EF4444] hover:bg-[#FEF2F2]">
                      Disconnect
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-[#64748B]">Daily: {account.sentToday} / {account.dailyLimit}</span>
          <span className="font-medium text-[#1E293B]">{Math.round(progressPercent)}%</span>
        </div>
        <div className="h-1.5 bg-[#E2E8F0] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#FF6B35] rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-sm">
        <div>
          <span className="text-[#94A3B8]">Connect: </span>
          <span className="font-medium text-[#22C55E]">{account.connectionRate}%</span>
        </div>
        <div>
          <span className="text-[#94A3B8]">Campaigns: </span>
          <span className="text-[#1E293B]">{account.campaigns}</span>
        </div>
      </div>
    </div>
  )
}

function AccountRow({ account }: { account: LinkedInAccount }) {
  const [menuOpen, setMenuOpen] = useState(false)

  const statusColors = {
    connected: { bg: 'bg-[#F0FDF4]', text: 'text-[#22C55E]', label: 'Connected' },
    warming: { bg: 'bg-[#FFFBEB]', text: 'text-[#F59E0B]', label: 'Warming Up' },
    paused: { bg: 'bg-[#F8FAFC]', text: 'text-[#64748B]', label: 'Paused' },
    error: { bg: 'bg-[#FEF2F2]', text: 'text-[#EF4444]', label: 'Error' },
  }

  const status = statusColors[account.status]
  const progressPercent = (account.sentToday / account.dailyLimit) * 100

  return (
    <tr className="hover:bg-[#F8FAFC] transition-colors">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0A66C2] to-[#004182] flex items-center justify-center text-white font-semibold">
            {account.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div>
            <p className="font-medium text-[#1E293B]">{account.name}</p>
            <p className="text-sm text-[#64748B]">{account.email}</p>
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
            <span className="text-[#64748B]">{account.sentToday} / {account.dailyLimit}</span>
            <span className="font-medium text-[#1E293B]">{Math.round(progressPercent)}%</span>
          </div>
          <div className="h-1.5 bg-[#E2E8F0] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#FF6B35] rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <span className="font-medium text-[#22C55E]">{account.connectionRate}%</span>
      </td>
      <td className="px-6 py-4">
        <span className="text-[#1E293B]">{account.campaigns}</span>
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
                  <button className="w-full px-4 py-2 text-left text-sm text-[#1E293B] hover:bg-[#F8FAFC]">
                    View Details
                  </button>
                  <button className="w-full px-4 py-2 text-left text-sm text-[#1E293B] hover:bg-[#F8FAFC]">
                    Edit Limits
                  </button>
                  <button className="w-full px-4 py-2 text-left text-sm text-[#F59E0B] hover:bg-[#FFFBEB]">
                    Pause Account
                  </button>
                  <button className="w-full px-4 py-2 text-left text-sm text-[#EF4444] hover:bg-[#FEF2F2]">
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

// Simplified Connect LinkedIn Modal - Direct credentials entry
function ConnectLinkedInModal({
  onClose,
  onSuccess
}: {
  onClose: () => void
  onSuccess: (account: LinkedInAccount) => void
}) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [inboxPrivacy, setInboxPrivacy] = useState<'all' | 'salesparrot_only'>('salesparrot_only')
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState<'credentials' | 'verification' | 'success'>('credentials')
  const [verificationCode, setVerificationCode] = useState('')

  const handleConnect = () => {
    if (!email || !password) return
    setIsLoading(true)
    // Simulate connection - in real app this would call API
    setTimeout(() => {
      setIsLoading(false)
      setStep('verification')
    }, 2000)
  }

  const handleVerify = () => {
    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
      setStep('success')
    }, 1500)
  }

  const handleFinish = () => {
    onSuccess({
      id: Date.now().toString(),
      name: email.split('@')[0].split('.').map(n => n.charAt(0).toUpperCase() + n.slice(1)).join(' '),
      email: email,
      status: 'warming',
      dailyLimit: 50,
      sentToday: 0,
      connectionRate: 0,
      campaigns: 0
    })
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
        className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] flex items-center justify-center">
              <LinkedInIcon className="w-5 h-5 text-[#0A66C2]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#1E293B]">Connect LinkedIn</h2>
              <p className="text-xs text-[#64748B]">Secure connection</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[#F8FAFC] transition-colors"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            {step === 'credentials' && (
              <motion.div
                key="credentials"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-5"
              >
                {/* Email Input */}
                <div>
                  <label className="block text-sm font-medium text-[#1E293B] mb-2">
                    LinkedIn Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2">
                      <EmailIcon className="w-5 h-5 text-[#94A3B8]" />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@company.com"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#0A66C2]/20 focus:border-[#0A66C2] focus:bg-white transition-all text-[#1E293B]"
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div>
                  <label className="block text-sm font-medium text-[#1E293B] mb-2">
                    LinkedIn Password
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2">
                      <LockIcon className="w-5 h-5 text-[#94A3B8]" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full pl-10 pr-12 py-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#0A66C2]/20 focus:border-[#0A66C2] focus:bg-white transition-all text-[#1E293B]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-[#E2E8F0] transition-colors"
                    >
                      {showPassword ? <EyeOffIcon className="w-4 h-4 text-[#64748B]" /> : <EyeIcon className="w-4 h-4 text-[#64748B]" />}
                    </button>
                  </div>
                </div>

                {/* Inbox Privacy Config */}
                <div>
                  <label className="block text-sm font-medium text-[#1E293B] mb-2">
                    Conversation Sync Preference
                  </label>
                  <p className="text-xs text-[#64748B] mb-3">
                    Choose which LinkedIn conversations to sync with SalesParrot
                  </p>
                  <div className="space-y-2">
                    <label
                      className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                        inboxPrivacy === 'salesparrot_only'
                          ? 'border-[#0A66C2] bg-[#EFF6FF]'
                          : 'border-[#E2E8F0] hover:border-[#0A66C2]/30'
                      }`}
                    >
                      <input
                        type="radio"
                        name="inboxPrivacy"
                        value="salesparrot_only"
                        checked={inboxPrivacy === 'salesparrot_only'}
                        onChange={() => setInboxPrivacy('salesparrot_only')}
                        className="mt-0.5 text-[#0A66C2] focus:ring-[#0A66C2]"
                      />
                      <div>
                        <p className="text-sm font-medium text-[#1E293B]">SalesParrot conversations only</p>
                        <p className="text-xs text-[#64748B]">Only sync conversations started through SalesParrot campaigns</p>
                      </div>
                    </label>
                    <label
                      className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                        inboxPrivacy === 'all'
                          ? 'border-[#0A66C2] bg-[#EFF6FF]'
                          : 'border-[#E2E8F0] hover:border-[#0A66C2]/30'
                      }`}
                    >
                      <input
                        type="radio"
                        name="inboxPrivacy"
                        value="all"
                        checked={inboxPrivacy === 'all'}
                        onChange={() => setInboxPrivacy('all')}
                        className="mt-0.5 text-[#0A66C2] focus:ring-[#0A66C2]"
                      />
                      <div>
                        <p className="text-sm font-medium text-[#1E293B]">All LinkedIn conversations</p>
                        <p className="text-xs text-[#64748B]">Sync all your LinkedIn inbox conversations for unified management</p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Security Notice */}
                <div className="flex items-start gap-2 p-3 bg-[#F0FDF4] border border-[#22C55E]/20 rounded-xl">
                  <ShieldCheckIcon className="w-4 h-4 text-[#22C55E] mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-[#166534]">
                    Your credentials are encrypted end-to-end. We use secure session tokens and never store your password.
                  </p>
                </div>

                {/* Connect Button */}
                <button
                  onClick={handleConnect}
                  disabled={!email || !password || isLoading}
                  className="w-full py-3.5 bg-[#0A66C2] text-white font-semibold rounded-xl hover:bg-[#004182] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <LoadingSpinner />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <LinkedInIcon className="w-5 h-5" />
                      Connect Account
                    </>
                  )}
                </button>
              </motion.div>
            )}

            {step === 'verification' && (
              <motion.div
                key="verification"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="text-center"
              >
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-[#F0FDF4] to-[#DCFCE7] rounded-2xl flex items-center justify-center">
                  <ShieldCheckIcon className="w-8 h-8 text-[#22C55E]" />
                </div>
                <h3 className="text-lg font-bold text-[#1E293B] mb-1">Verify Your Identity</h3>
                <p className="text-sm text-[#64748B] mb-6">
                  LinkedIn sent a verification code to your email or phone
                </p>

                <div className="mb-6">
                  <input
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    maxLength={6}
                    className="w-full px-4 py-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] text-center text-2xl tracking-[0.5em] font-mono focus:outline-none focus:ring-2 focus:ring-[#0A66C2]/20 focus:border-[#0A66C2] focus:bg-white transition-all"
                  />
                </div>

                <button
                  onClick={handleVerify}
                  disabled={verificationCode.length !== 6 || isLoading}
                  className="w-full py-3.5 bg-[#0A66C2] text-white font-semibold rounded-xl hover:bg-[#004182] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <LoadingSpinner />
                      Verifying...
                    </>
                  ) : (
                    'Verify & Connect'
                  )}
                </button>

                <p className="text-sm text-[#64748B] mt-4">
                  Didn't receive a code?{' '}
                  <button className="text-[#0A66C2] font-medium hover:underline">Resend</button>
                </p>
              </motion.div>
            )}

            {step === 'success' && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-4"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                  className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-[#F0FDF4] to-[#DCFCE7] rounded-full flex items-center justify-center"
                >
                  <CheckCircleIcon className="w-10 h-10 text-[#22C55E]" />
                </motion.div>

                <h3 className="text-xl font-bold text-[#1E293B] mb-2">Account Connected!</h3>
                <p className="text-[#64748B] mb-6">
                  Your LinkedIn account is warming up for safe sending. This takes about 3 days.
                </p>

                {/* Warmup Progress */}
                <div className="bg-[#F8FAFC] rounded-xl p-4 mb-6 text-left">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-[#1E293B]">Warmup Progress</span>
                    <span className="text-xs text-[#64748B]">Day 1 of 3</span>
                  </div>
                  <div className="h-2 bg-[#E2E8F0] rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: '33%' }}
                      transition={{ delay: 0.3, duration: 0.5 }}
                      className="h-full bg-gradient-to-r from-[#FF6B35] to-[#F97316] rounded-full"
                    />
                  </div>
                  <p className="text-xs text-[#64748B] mt-2">
                    Daily limits will gradually increase to protect your account
                  </p>
                </div>

                <button
                  onClick={handleFinish}
                  className="w-full py-3.5 bg-[#FF6B35] text-white font-semibold rounded-xl hover:bg-[#E85A2A] transition-all"
                >
                  View My Accounts
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
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

function EmailIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  )
}

function LockIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  )
}

function EyeIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  )
}

function EyeOffIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
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
