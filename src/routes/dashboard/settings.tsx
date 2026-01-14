import { createFileRoute } from '@tanstack/react-router'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'

export const Route = createFileRoute('/dashboard/settings')({
  component: SettingsPage,
})

type SettingsTab = 'profile' | 'workspaces' | 'members' | 'notifications' | 'billing' | 'integrations'

function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile')
  const [mobileTabsOpen, setMobileTabsOpen] = useState(false)

  const tabs: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
    { id: 'profile', label: 'Profile Settings', icon: <SettingsIcon /> },
    { id: 'workspaces', label: 'Workspaces', icon: <WorkspaceIcon /> },
    { id: 'members', label: 'Members', icon: <MembersIcon /> },
    { id: 'notifications', label: 'Notifications', icon: <NotificationIcon /> },
    { id: 'billing', label: 'Billing', icon: <BillingIcon /> },
    { id: 'integrations', label: 'Integrations', icon: <IntegrationIcon /> },
  ]

  const activeTabLabel = tabs.find(t => t.id === activeTab)?.label || 'Settings'

  return (
    <div className="flex flex-col lg:flex-row gap-0 min-h-[calc(100vh-7rem)]">
      {/* Mobile Tab Selector */}
      <div className="lg:hidden bg-white border-b border-[#E2E8F0] p-4">
        <button
          onClick={() => setMobileTabsOpen(!mobileTabsOpen)}
          className="w-full flex items-center justify-between px-4 py-3 bg-[#F8FAFC] rounded-lg"
        >
          <span className="font-medium text-[#1E293B]">{activeTabLabel}</span>
          <motion.div
            animate={{ rotate: mobileTabsOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
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
                        setActiveTab(tab.id)
                        setMobileTabsOpen(false)
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                        activeTab === tab.id
                          ? 'bg-[#EFF6FF] text-[#3B82F6]'
                          : 'text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#1E293B]'
                      }`}
                    >
                      <span className={activeTab === tab.id ? 'text-[#3B82F6]' : 'text-[#94A3B8]'}>{tab.icon}</span>
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
      <div className="hidden lg:flex w-64 bg-white border-r border-[#E2E8F0] flex-col flex-shrink-0">
        <div className="p-6 border-b border-[#E2E8F0]">
          <h1 className="text-xl font-bold text-[#1E293B]">Settings</h1>
        </div>

        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            {tabs.map((tab) => (
              <li key={tab.id}>
                <button
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-[#EFF6FF] text-[#3B82F6] border-l-4 border-[#3B82F6] -ml-1 pl-5'
                      : 'text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#1E293B]'
                  }`}
                >
                  <span className={activeTab === tab.id ? 'text-[#3B82F6]' : 'text-[#94A3B8]'}>{tab.icon}</span>
                  {tab.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-[#E2E8F0]">
          <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-[#E2E8F0] rounded-lg text-sm font-medium text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#1E293B] transition-colors">
            <LogoutIcon />
            Log out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 bg-[#F8FAFC] overflow-y-auto">
        <div className="p-4 md:p-6 lg:p-8 max-w-4xl">
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
  )
}

// ==================== PROFILE SETTINGS ====================
function ProfileSettings() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

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

      <div className="bg-white rounded-xl border border-[#E2E8F0] p-6">
        <div className="space-y-6 max-w-md">
          <div>
            <label className="block text-sm font-medium text-[#1E293B] mb-2">
              Current Password
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              className="w-full px-4 py-3 rounded-lg border border-[#E2E8F0] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/20 focus:border-[#3B82F6] transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1E293B] mb-2">
              New Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              className="w-full px-4 py-3 rounded-lg border border-[#E2E8F0] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/20 focus:border-[#3B82F6] transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1E293B] mb-2">
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              className="w-full px-4 py-3 rounded-lg border border-[#E2E8F0] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/20 focus:border-[#3B82F6] transition-all"
            />
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button className="px-6 py-2.5 bg-[#3B82F6] text-white font-medium rounded-lg hover:bg-[#2563EB] transition-colors">
            Save changes
          </button>
        </div>
      </div>
    </motion.div>
  )
}

// ==================== WORKSPACE SETTINGS ====================
function WorkspaceSettings() {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const workspaces = [
    { name: 'Main Workspace', seats: 3, limit: null },
    { name: 'Sales Team', seats: 5, limit: 10 },
  ]

  const totalSeats = 10
  const usedSeats = workspaces.reduce((acc, w) => acc + w.seats, 0)
  const availableSeats = totalSeats - usedSeats

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
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold text-[#1E293B]">Shared resources</h3>
            <p className="text-sm text-[#64748B] mt-1 max-w-lg">
              The pool of seats is shared between all workspaces. You can limit the number of seats for a specific workspace in the workspace settings.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="sm:text-right">
              <div className="flex items-center gap-2">
                <CheckCircleIcon className="w-5 h-5 text-[#22C55E]" />
                <span className="font-semibold text-[#1E293B]">Used seats</span>
                <span className="text-[#64748B]">{usedSeats} / {totalSeats}</span>
              </div>
              <span className="inline-block mt-2 px-3 py-1 bg-[#F0FDF4] text-[#22C55E] text-sm font-medium rounded-full">
                {availableSeats} available seats
              </span>
            </div>
            <button className="flex items-center gap-2 px-4 py-2.5 bg-[#3B82F6] text-white font-medium rounded-lg hover:bg-[#2563EB] transition-colors w-full sm:w-auto justify-center">
              <PlusIcon />
              Buy more seats
            </button>
          </div>
        </div>
      </div>

      {/* Workspaces List */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
        <div className="px-4 md:px-6 py-4 border-b border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-[#1E293B]">Workspaces</h3>
            <span className="px-2 py-0.5 bg-[#F1F5F9] text-[#64748B] text-sm rounded-full">{workspaces.length}</span>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 border border-[#E2E8F0] rounded-lg text-sm font-medium text-[#64748B] hover:bg-[#F8FAFC] transition-colors w-full sm:w-auto"
          >
            <PlusIcon />
            <span className="sm:inline">Create a new workspace</span>
          </button>
        </div>

        {/* Search */}
        <div className="px-4 md:px-6 py-4 border-b border-[#E2E8F0]">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search workspaces"
              className="w-full max-w-sm pl-10 pr-4 py-2 rounded-lg border border-[#E2E8F0] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/20 focus:border-[#3B82F6]"
            />
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
                <th className="text-left px-6 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wider">Workspaces</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wider">Used seats</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wider">Workspace seats limit</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wider"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {workspaces.map((workspace, index) => (
                <tr key={index} className="hover:bg-[#F8FAFC] transition-colors">
                  <td className="px-6 py-4 font-medium text-[#1E293B]">{workspace.name}</td>
                  <td className="px-6 py-4 text-[#64748B]">{workspace.seats}</td>
                  <td className="px-6 py-4">
                    {workspace.limit ? (
                      <span className="text-[#64748B]">{workspace.limit}</span>
                    ) : (
                      <span className="px-2 py-1 bg-[#F0FDF4] text-[#22C55E] text-xs font-medium rounded">No limit</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 rounded-lg hover:bg-[#F1F5F9] text-[#64748B]">
                      <MoreIcon />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden divide-y divide-[#E2E8F0]">
          {workspaces.map((workspace, index) => (
            <div key={index} className="p-4 hover:bg-[#F8FAFC] transition-colors">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-[#1E293B]">{workspace.name}</span>
                <button className="p-2 rounded-lg hover:bg-[#F1F5F9] text-[#64748B]">
                  <MoreIcon />
                </button>
              </div>
              <div className="flex flex-wrap gap-4 text-sm">
                <div>
                  <span className="text-[#94A3B8]">Seats: </span>
                  <span className="text-[#64748B]">{workspace.seats}</span>
                </div>
                <div>
                  <span className="text-[#94A3B8]">Limit: </span>
                  {workspace.limit ? (
                    <span className="text-[#64748B]">{workspace.limit}</span>
                  ) : (
                    <span className="px-2 py-0.5 bg-[#F0FDF4] text-[#22C55E] text-xs font-medium rounded">No limit</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create Workspace Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateWorkspaceModal onClose={() => setShowCreateModal(false)} />
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function CreateWorkspaceModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('')
  const [seatLimit, setSeatLimit] = useState('')

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl"
      >
        <h2 className="text-lg font-bold text-[#1E293B] mb-4">Create new workspace</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#1E293B] mb-2">Workspace name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Marketing Team"
              className="w-full px-4 py-3 rounded-lg border border-[#E2E8F0] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/20 focus:border-[#3B82F6]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1E293B] mb-2">Seat limit (optional)</label>
            <input
              type="number"
              value={seatLimit}
              onChange={(e) => setSeatLimit(e.target.value)}
              placeholder="Leave empty for no limit"
              className="w-full px-4 py-3 rounded-lg border border-[#E2E8F0] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/20 focus:border-[#3B82F6]"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-[#E2E8F0] rounded-lg font-medium text-[#64748B] hover:bg-[#F8FAFC]"
          >
            Cancel
          </button>
          <button
            onClick={onClose}
            disabled={!name}
            className="flex-1 px-4 py-2.5 bg-[#3B82F6] text-white rounded-lg font-medium hover:bg-[#2563EB] disabled:opacity-50"
          >
            Create workspace
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ==================== MEMBERS SETTINGS ====================
function MembersSettings() {
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterWorkspace, setFilterWorkspace] = useState('all')

  const members = [
    { name: 'John Doe', email: 'john@company.com', role: 'Owner', workspaces: 'All Workspaces', avatar: 'JD' },
    { name: 'Sarah Johnson', email: 'sarah@company.com', role: 'Admin', workspaces: 'Sales Team', avatar: 'SJ' },
    { name: 'Mike Chen', email: 'mike@company.com', role: 'Member', workspaces: 'Main Workspace', avatar: 'MC' },
  ]

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
      <div className="bg-[#EFF6FF] border border-[#3B82F6]/20 rounded-xl p-4 flex items-start gap-3">
        <InfoIcon className="w-5 h-5 text-[#3B82F6] flex-shrink-0 mt-0.5" />
        <p className="text-sm text-[#1E293B]">
          Here you can manage all members within the organization, regardless of what workspaces they belong to. If you want to manage them on a workspace level, you can do it from the 'Workspaces' screen.
        </p>
      </div>

      {/* Members List */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
        {/* Filters and Actions */}
        <div className="px-4 md:px-6 py-4 border-b border-[#E2E8F0] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search members"
                className="w-full max-w-sm pl-10 pr-4 py-2 rounded-lg border border-[#E2E8F0] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/20 focus:border-[#3B82F6]"
              />
            </div>
            <select
              value={filterWorkspace}
              onChange={(e) => setFilterWorkspace(e.target.value)}
              className="px-4 py-2 rounded-lg border border-[#E2E8F0] text-sm focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/20 focus:border-[#3B82F6] w-full sm:w-auto"
            >
              <option value="all">All</option>
              <option value="main">Main Workspace</option>
              <option value="sales">Sales Team</option>
            </select>
          </div>
          <button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#3B82F6] text-white font-medium rounded-lg hover:bg-[#2563EB] transition-colors w-full md:w-auto"
          >
            <PlusIcon />
            Invite members
          </button>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
                <th className="text-left px-6 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wider">Workspace members</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wider">Role</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wider">Workspaces</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wider"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {members.map((member, index) => (
                <tr key={index} className="hover:bg-[#F8FAFC] transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#64748B] to-[#94A3B8] flex items-center justify-center text-white text-sm font-medium">
                        {member.avatar}
                      </div>
                      <div>
                        <p className="font-medium text-[#1E293B]">{member.name}</p>
                        <p className="text-sm text-[#64748B]">{member.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                      member.role === 'Owner'
                        ? 'bg-[#EFF6FF] text-[#3B82F6]'
                        : member.role === 'Admin'
                        ? 'bg-[#F0FDF4] text-[#22C55E]'
                        : 'bg-[#F8FAFC] text-[#64748B]'
                    }`}>
                      {member.role === 'Owner' && <CrownIcon className="w-3 h-3" />}
                      {member.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-[#64748B]">{member.workspaces}</td>
                  <td className="px-6 py-4 text-right">
                    {member.role !== 'Owner' && (
                      <button className="p-2 rounded-lg hover:bg-[#F1F5F9] text-[#64748B]">
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
        <div className="md:hidden divide-y divide-[#E2E8F0]">
          {members.map((member, index) => (
            <div key={index} className="p-4 hover:bg-[#F8FAFC] transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#64748B] to-[#94A3B8] flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                    {member.avatar}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-[#1E293B]">{member.name}</p>
                    <p className="text-sm text-[#64748B] truncate">{member.email}</p>
                  </div>
                </div>
                {member.role !== 'Owner' && (
                  <button className="p-2 rounded-lg hover:bg-[#F1F5F9] text-[#64748B] flex-shrink-0">
                    <MoreIcon />
                  </button>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-3 ml-13">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                  member.role === 'Owner'
                    ? 'bg-[#EFF6FF] text-[#3B82F6]'
                    : member.role === 'Admin'
                    ? 'bg-[#F0FDF4] text-[#22C55E]'
                    : 'bg-[#F8FAFC] text-[#64748B]'
                }`}>
                  {member.role === 'Owner' && <CrownIcon className="w-3 h-3" />}
                  {member.role}
                </span>
                <span className="text-xs text-[#94A3B8]">{member.workspaces}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Invite Modal */}
      <AnimatePresence>
        {showInviteModal && (
          <InviteMemberModal onClose={() => setShowInviteModal(false)} />
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function InviteMemberModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('member')
  const [workspace, setWorkspace] = useState('all')

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl"
      >
        <h2 className="text-lg font-bold text-[#1E293B] mb-4">Invite team member</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#1E293B] mb-2">Email address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="colleague@company.com"
              className="w-full px-4 py-3 rounded-lg border border-[#E2E8F0] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/20 focus:border-[#3B82F6]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1E293B] mb-2">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-[#E2E8F0] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/20 focus:border-[#3B82F6]"
            >
              <option value="member">Member - Can run campaigns</option>
              <option value="admin">Admin - Full access</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1E293B] mb-2">Workspace access</label>
            <select
              value={workspace}
              onChange={(e) => setWorkspace(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-[#E2E8F0] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/20 focus:border-[#3B82F6]"
            >
              <option value="all">All Workspaces</option>
              <option value="main">Main Workspace only</option>
              <option value="sales">Sales Team only</option>
            </select>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-[#E2E8F0] rounded-lg font-medium text-[#64748B] hover:bg-[#F8FAFC]"
          >
            Cancel
          </button>
          <button
            onClick={onClose}
            disabled={!email}
            className="flex-1 px-4 py-2.5 bg-[#3B82F6] text-white rounded-lg font-medium hover:bg-[#2563EB] disabled:opacity-50"
          >
            Send invitation
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
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
  })

  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications({ ...notifications, [key]: !notifications[key] })
  }

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

      <div className="bg-white rounded-xl border border-[#E2E8F0] p-6">
        <div className="mb-6">
          <h3 className="font-semibold text-[#1E293B]">Events</h3>
          <p className="text-sm text-[#64748B] mt-1">Select the events and channels you want to receive notifications to</p>
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
          <button className="px-6 py-2.5 bg-[#3B82F6] text-white font-medium rounded-lg hover:bg-[#2563EB] transition-colors">
            Save Settings
          </button>
        </div>
      </div>
    </motion.div>
  )
}

function NotificationItem({
  icon,
  label,
  tooltip,
  checked,
  onChange
}: {
  icon: React.ReactNode
  label: string
  tooltip: string
  checked: boolean
  onChange: () => void
}) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-[#E2E8F0] last:border-0">
      <div className="flex items-center gap-3">
        <span className="text-[#64748B]">{icon}</span>
        <span className="font-medium text-[#1E293B]">{label}</span>
        <button className="p-1 rounded-full hover:bg-[#F8FAFC]" title={tooltip}>
          <QuestionIcon className="w-4 h-4 text-[#94A3B8]" />
        </button>
      </div>
      <button
        onClick={onChange}
        className={`w-12 h-6 rounded-full transition-colors relative ${
          checked ? 'bg-[#3B82F6]' : 'bg-[#E2E8F0]'
        }`}
      >
        <span
          className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform shadow ${
            checked ? 'translate-x-6' : ''
          }`}
        />
      </button>
    </div>
  )
}

// ==================== BILLING SETTINGS ====================
function BillingSettings() {
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
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-6">
        <h3 className="font-semibold text-[#1E293B] mb-4">Current Plan</h3>
        <div className="flex items-center justify-between p-5 bg-gradient-to-r from-[#FF6B35]/10 to-[#FF6B35]/5 rounded-xl border border-[#FF6B35]/20">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-xl font-bold text-[#1E293B]">Growth Plan</span>
              <span className="px-2.5 py-1 bg-[#FF6B35] text-white text-xs font-medium rounded-full">Active</span>
            </div>
            <p className="text-sm text-[#64748B] mt-2">10 LinkedIn senders, Unlimited leads, Email enrichment included</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-[#1E293B]">$590<span className="text-base font-normal text-[#64748B]">/mo</span></p>
            <p className="text-sm text-[#64748B]">Next billing: Feb 1, 2026</p>
          </div>
        </div>
        <div className="mt-4 flex gap-3">
          <button className="px-4 py-2.5 bg-[#FF6B35] text-white font-medium rounded-lg hover:bg-[#E85A2A] transition-colors">
            Upgrade Plan
          </button>
          <button className="px-4 py-2.5 border border-[#E2E8F0] text-[#64748B] font-medium rounded-lg hover:bg-[#F8FAFC] transition-colors">
            View Invoices
          </button>
        </div>
      </div>

      {/* Payment Method */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-6">
        <h3 className="font-semibold text-[#1E293B] mb-4">Payment Method</h3>
        <div className="flex items-center justify-between p-4 bg-[#F8FAFC] rounded-lg">
          <div className="flex items-center gap-4">
            <div className="w-14 h-9 bg-gradient-to-r from-[#1A1F71] to-[#2D45B8] rounded-md flex items-center justify-center">
              <span className="text-white text-xs font-bold tracking-wide">VISA</span>
            </div>
            <div>
              <p className="font-medium text-[#1E293B]">Ending in 4242</p>
              <p className="text-sm text-[#64748B]">Expires 12/28</p>
            </div>
          </div>
          <button className="text-sm text-[#3B82F6] font-medium hover:text-[#2563EB]">
            Update
          </button>
        </div>
      </div>

      {/* Usage */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-6">
        <h3 className="font-semibold text-[#1E293B] mb-4">Usage This Month</h3>
        <div className="space-y-5">
          <UsageBar label="LinkedIn Senders" used={7} total={10} unit="accounts" />
          <UsageBar label="Email Enrichments" used={2450} total={0} unit="unlimited" />
          <UsageBar label="Active Campaigns" used={4} total={20} unit="campaigns" />
        </div>
      </div>
    </motion.div>
  )
}

function UsageBar({ label, used, total, unit }: { label: string; used: number; total: number; unit: string }) {
  const isUnlimited = unit === 'unlimited' || total === 0
  const percent = isUnlimited ? 100 : (used / total) * 100
  const isWarning = !isUnlimited && percent > 75
  const isDanger = !isUnlimited && percent > 90

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-[#1E293B]">{label}</span>
        {isUnlimited ? (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-[#64748B]">{used.toLocaleString()} used</span>
            <span className="px-2 py-0.5 bg-[#F0FDF4] text-[#22C55E] text-xs font-medium rounded-full">Unlimited</span>
          </div>
        ) : (
          <span className={`text-sm font-medium ${isDanger ? 'text-[#EF4444]' : isWarning ? 'text-[#F59E0B]' : 'text-[#64748B]'}`}>
            {used.toLocaleString()} / {total.toLocaleString()} {unit}
          </span>
        )}
      </div>
      <div className="h-2 bg-[#E2E8F0] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            isUnlimited ? 'bg-[#22C55E]' : isDanger ? 'bg-[#EF4444]' : isWarning ? 'bg-[#F59E0B]' : 'bg-[#3B82F6]'
          }`}
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>
    </div>
  )
}

// ==================== INTEGRATION SETTINGS ====================
function IntegrationSettings() {
  const [showEmailModal, setShowEmailModal] = useState(false)

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

      {/* Email Accounts for Follow-ups */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-semibold text-[#1E293B]">Email Accounts</h3>
            <p className="text-sm text-[#64748B] mt-1">Connect your email for sending follow-up messages to leads</p>
          </div>
          <button
            onClick={() => setShowEmailModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#FF6B35] text-white font-medium rounded-lg hover:bg-[#E85A2A] transition-colors"
          >
            <PlusIcon />
            Connect Email
          </button>
        </div>

        {/* Connected Email Accounts */}
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-[#EA4335]/10 flex items-center justify-center">
                <GmailIcon className="w-6 h-6" />
              </div>
              <div>
                <p className="font-medium text-[#1E293B]">john@company.com</p>
                <p className="text-sm text-[#64748B]">Gmail - Connected</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 bg-[#F0FDF4] text-[#22C55E] text-xs font-medium rounded-full">Primary</span>
              <button className="p-2 rounded-lg hover:bg-[#E2E8F0] text-[#64748B]">
                <MoreIcon />
              </button>
            </div>
          </div>
        </div>

        {/* Empty State */}
        <div className="mt-4 p-6 border-2 border-dashed border-[#E2E8F0] rounded-xl text-center">
          <div className="w-12 h-12 mx-auto mb-3 bg-[#F8FAFC] rounded-xl flex items-center justify-center">
            <EmailIcon className="w-6 h-6 text-[#94A3B8]" />
          </div>
          <p className="text-sm text-[#64748B]">Connect additional email accounts for sending follow-ups</p>
          <p className="text-xs text-[#94A3B8] mt-1">Supports Gmail, Outlook, and custom SMTP</p>
        </div>
      </div>

      {/* CRM Integrations */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-6">
        <div className="mb-6">
          <h3 className="font-semibold text-[#1E293B]">CRM Integrations</h3>
          <p className="text-sm text-[#64748B] mt-1">Sync your leads and activities with your CRM</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <IntegrationCard
            name="HubSpot"
            description="Sync leads, deals, and activities"
            icon={<HubSpotIcon />}
            color="#FF7A59"
            connected={true}
          />
          <IntegrationCard
            name="Salesforce"
            description="Enterprise CRM integration"
            icon={<SalesforceIcon />}
            color="#00A1E0"
            connected={false}
          />
          <IntegrationCard
            name="Pipedrive"
            description="Deal and pipeline management"
            icon={<PipedriveIcon />}
            color="#1D1D1D"
            connected={false}
          />
          <IntegrationCard
            name="Close CRM"
            description="Sales productivity platform"
            icon={<CloseIcon />}
            color="#5C6BC0"
            connected={false}
          />
        </div>
      </div>

      {/* Automation Integrations */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-6">
        <div className="mb-6">
          <h3 className="font-semibold text-[#1E293B]">Automation & Webhooks</h3>
          <p className="text-sm text-[#64748B] mt-1">Connect to 5000+ apps or build custom integrations</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <IntegrationCard
            name="Zapier"
            description="Connect to 5000+ apps"
            icon={<ZapierIcon />}
            color="#FF4A00"
            connected={true}
          />
          <IntegrationCard
            name="Make (Integromat)"
            description="Visual automation platform"
            icon={<MakeIcon />}
            color="#6E56FF"
            connected={false}
          />
          <IntegrationCard
            name="Slack"
            description="Get notifications in Slack"
            icon={<SlackIcon />}
            color="#4A154B"
            connected={false}
          />
          <IntegrationCard
            name="Webhooks"
            description="Custom API integrations"
            icon={<WebhookIcon />}
            color="#64748B"
            connected={false}
            isWebhook
          />
        </div>
      </div>

      {/* Email Connection Modal */}
      <AnimatePresence>
        {showEmailModal && (
          <ConnectEmailModal onClose={() => setShowEmailModal(false)} />
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function IntegrationCard({
  name,
  description,
  icon,
  color,
  connected,
  isWebhook = false
}: {
  name: string
  description: string
  icon: React.ReactNode
  color: string
  connected: boolean
  isWebhook?: boolean
}) {
  return (
    <div className="flex items-center justify-between p-4 border border-[#E2E8F0] rounded-xl hover:border-[#3B82F6]/30 hover:shadow-sm transition-all">
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${color}15` }}
        >
          <div style={{ color }}>{icon}</div>
        </div>
        <div>
          <p className="font-medium text-[#1E293B]">{name}</p>
          <p className="text-xs text-[#64748B]">{description}</p>
        </div>
      </div>
      <button
        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
          connected
            ? 'bg-[#F0FDF4] text-[#22C55E] hover:bg-[#DCFCE7]'
            : 'bg-[#F8FAFC] text-[#64748B] hover:bg-[#E2E8F0]'
        }`}
      >
        {connected ? 'Connected' : isWebhook ? 'Configure' : 'Connect'}
      </button>
    </div>
  )
}

function ConnectEmailModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<'select' | 'gmail' | 'outlook' | 'smtp'>('select')

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-xl"
      >
        <AnimatePresence mode="wait">
          {step === 'select' && (
            <motion.div
              key="select"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-[#1E293B]">Connect Email Account</h2>
                <button onClick={onClose} className="p-2 rounded-lg hover:bg-[#F8FAFC]">
                  <XIcon />
                </button>
              </div>

              <p className="text-[#64748B] mb-6">
                Connect your email account to send follow-up messages to leads who don't accept your LinkedIn connection request.
              </p>

              <div className="space-y-3">
                <button
                  onClick={() => setStep('gmail')}
                  className="w-full flex items-center gap-4 p-4 border border-[#E2E8F0] rounded-xl hover:border-[#EA4335]/30 hover:bg-[#FEF2F2]/30 transition-all group"
                >
                  <div className="w-12 h-12 rounded-xl bg-[#EA4335]/10 flex items-center justify-center">
                    <GmailIcon className="w-7 h-7" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-[#1E293B] group-hover:text-[#EA4335]">Gmail</p>
                    <p className="text-sm text-[#64748B]">Connect with your Google account</p>
                  </div>
                  <ChevronRightIcon className="w-5 h-5 text-[#94A3B8] group-hover:text-[#EA4335]" />
                </button>

                <button
                  onClick={() => setStep('outlook')}
                  className="w-full flex items-center gap-4 p-4 border border-[#E2E8F0] rounded-xl hover:border-[#0078D4]/30 hover:bg-[#EFF6FF]/30 transition-all group"
                >
                  <div className="w-12 h-12 rounded-xl bg-[#0078D4]/10 flex items-center justify-center">
                    <OutlookIcon className="w-7 h-7" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-[#1E293B] group-hover:text-[#0078D4]">Outlook / Office 365</p>
                    <p className="text-sm text-[#64748B]">Connect with your Microsoft account</p>
                  </div>
                  <ChevronRightIcon className="w-5 h-5 text-[#94A3B8] group-hover:text-[#0078D4]" />
                </button>

                <button
                  onClick={() => setStep('smtp')}
                  className="w-full flex items-center gap-4 p-4 border border-[#E2E8F0] rounded-xl hover:border-[#64748B]/30 hover:bg-[#F8FAFC] transition-all group"
                >
                  <div className="w-12 h-12 rounded-xl bg-[#64748B]/10 flex items-center justify-center">
                    <ServerIcon className="w-7 h-7 text-[#64748B]" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-[#1E293B]">Custom SMTP</p>
                    <p className="text-sm text-[#64748B]">Connect any email provider via SMTP</p>
                  </div>
                  <ChevronRightIcon className="w-5 h-5 text-[#94A3B8]" />
                </button>
              </div>

              <div className="mt-6 p-4 bg-[#FFF7ED] border border-[#FF6B35]/20 rounded-xl">
                <div className="flex items-start gap-3">
                  <InfoIcon className="w-5 h-5 text-[#FF6B35] flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-[#92400E]">
                    <p className="font-medium">Why connect email?</p>
                    <p className="mt-1">When leads don't accept your LinkedIn request, we'll automatically follow up via email - increasing your reply rate by up to 40%.</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {step === 'gmail' && (
            <motion.div
              key="gmail"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <button onClick={() => setStep('select')} className="p-2 rounded-lg hover:bg-[#F8FAFC]">
                  <BackIcon />
                </button>
                <h2 className="text-lg font-bold text-[#1E293B]">Connect Gmail</h2>
              </div>

              <div className="text-center py-8">
                <div className="w-20 h-20 mx-auto mb-4 bg-[#EA4335]/10 rounded-2xl flex items-center justify-center">
                  <GmailIcon className="w-10 h-10" />
                </div>
                <h3 className="text-lg font-semibold text-[#1E293B] mb-2">Sign in with Google</h3>
                <p className="text-[#64748B] mb-6 max-w-sm mx-auto">
                  We'll open a secure Google sign-in window. Allow SalesParrot to send emails on your behalf.
                </p>
                <button className="px-6 py-3 bg-[#EA4335] text-white font-medium rounded-xl hover:bg-[#D33426] flex items-center gap-2 mx-auto">
                  <GoogleIcon className="w-5 h-5" />
                  Sign in with Google
                </button>
                <p className="text-xs text-[#94A3B8] mt-4">
                  We only request permission to send emails. We never read or store your emails.
                </p>
              </div>
            </motion.div>
          )}

          {step === 'outlook' && (
            <motion.div
              key="outlook"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <button onClick={() => setStep('select')} className="p-2 rounded-lg hover:bg-[#F8FAFC]">
                  <BackIcon />
                </button>
                <h2 className="text-lg font-bold text-[#1E293B]">Connect Outlook</h2>
              </div>

              <div className="text-center py-8">
                <div className="w-20 h-20 mx-auto mb-4 bg-[#0078D4]/10 rounded-2xl flex items-center justify-center">
                  <OutlookIcon className="w-10 h-10" />
                </div>
                <h3 className="text-lg font-semibold text-[#1E293B] mb-2">Sign in with Microsoft</h3>
                <p className="text-[#64748B] mb-6 max-w-sm mx-auto">
                  We'll open a secure Microsoft sign-in window. Allow SalesParrot to send emails on your behalf.
                </p>
                <button className="px-6 py-3 bg-[#0078D4] text-white font-medium rounded-xl hover:bg-[#006CBF] flex items-center gap-2 mx-auto">
                  <MicrosoftIcon className="w-5 h-5" />
                  Sign in with Microsoft
                </button>
                <p className="text-xs text-[#94A3B8] mt-4">
                  Works with Outlook.com, Office 365, and Exchange accounts.
                </p>
              </div>
            </motion.div>
          )}

          {step === 'smtp' && (
            <motion.div
              key="smtp"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <button onClick={() => setStep('select')} className="p-2 rounded-lg hover:bg-[#F8FAFC]">
                  <BackIcon />
                </button>
                <h2 className="text-lg font-bold text-[#1E293B]">Connect via SMTP</h2>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#1E293B] mb-2">SMTP Host</label>
                    <input
                      type="text"
                      placeholder="smtp.example.com"
                      className="w-full px-4 py-2.5 rounded-lg border border-[#E2E8F0] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/20 focus:border-[#3B82F6]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#1E293B] mb-2">Port</label>
                    <input
                      type="text"
                      placeholder="587"
                      className="w-full px-4 py-2.5 rounded-lg border border-[#E2E8F0] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/20 focus:border-[#3B82F6]"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1E293B] mb-2">Email Address</label>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    className="w-full px-4 py-2.5 rounded-lg border border-[#E2E8F0] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/20 focus:border-[#3B82F6]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1E293B] mb-2">Password / App Password</label>
                  <input
                    type="password"
                    placeholder="Your email password or app password"
                    className="w-full px-4 py-2.5 rounded-lg border border-[#E2E8F0] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/20 focus:border-[#3B82F6]"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="tls" className="rounded border-[#E2E8F0] text-[#3B82F6] focus:ring-[#3B82F6]" defaultChecked />
                  <label htmlFor="tls" className="text-sm text-[#64748B]">Use TLS/SSL encryption</label>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setStep('select')}
                  className="flex-1 px-4 py-2.5 border border-[#E2E8F0] rounded-lg font-medium text-[#64748B] hover:bg-[#F8FAFC]"
                >
                  Cancel
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 bg-[#3B82F6] text-white rounded-lg font-medium hover:bg-[#2563EB]"
                >
                  Test & Connect
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  )
}

// ==================== ICONS ====================
function SettingsIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

function WorkspaceIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
    </svg>
  )
}

function MembersIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  )
}

function NotificationIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
    </svg>
  )
}

function BillingIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
    </svg>
  )
}

function IntegrationIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 6.087c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.036-1.007-1.875-2.25-1.875s-2.25.84-2.25 1.875c0 .369.128.713.349 1.003.215.283.401.604.401.959v0a.64.64 0 01-.657.643 48.39 48.39 0 01-4.163-.3c.186 1.613.293 3.25.315 4.907a.656.656 0 01-.658.663v0c-.355 0-.676-.186-.959-.401a1.647 1.647 0 00-1.003-.349c-1.036 0-1.875 1.007-1.875 2.25s.84 2.25 1.875 2.25c.369 0 .713-.128 1.003-.349.283-.215.604-.401.959-.401v0c.31 0 .555.26.532.57a48.039 48.039 0 01-.642 5.056c1.518.19 3.058.309 4.616.354a.64.64 0 00.657-.643v0c0-.355-.186-.676-.401-.959a1.647 1.647 0 01-.349-1.003c0-1.035 1.008-1.875 2.25-1.875 1.243 0 2.25.84 2.25 1.875 0 .369-.128.713-.349 1.003-.215.283-.4.604-.4.959v0c0 .333.277.599.61.58a48.1 48.1 0 005.427-.63 48.05 48.05 0 00.582-4.717.532.532 0 00-.533-.57v0c-.355 0-.676.186-.959.401-.29.221-.634.349-1.003.349-1.035 0-1.875-1.007-1.875-2.25s.84-2.25 1.875-2.25c.37 0 .713.128 1.003.349.283.215.604.401.96.401v0a.656.656 0 00.658-.663 48.422 48.422 0 00-.37-5.36c-1.886.342-3.81.574-5.766.689a.578.578 0 01-.61-.58v0z" />
    </svg>
  )
}

function LogoutIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
    </svg>
  )
}

function ChevronDownIcon() {
  return (
    <svg className="w-5 h-5 text-[#64748B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  )
}

function MoreIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
    </svg>
  )
}

function CheckCircleIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function InfoIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
    </svg>
  )
}

function CrownIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path d="M10 2l2.5 5 5.5.75-4 3.75 1 5.5L10 14.25 4.5 17l1-5.5-4-3.75L7 7z" />
    </svg>
  )
}

function MessageSquareIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
    </svg>
  )
}

function DisconnectIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
    </svg>
  )
}

function CampaignIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
    </svg>
  )
}

function ChartIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  )
}

function QuestionIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
    </svg>
  )
}

function EmailIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
    </svg>
  )
}

function XIcon() {
  return (
    <svg className="w-5 h-5 text-[#64748B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

function BackIcon() {
  return (
    <svg className="w-5 h-5 text-[#64748B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  )
}

function ChevronRightIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  )
}

function GmailIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path fill="#EA4335" d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 010 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z"/>
    </svg>
  )
}

function OutlookIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path fill="#0078D4" d="M24 7.387v10.478c0 .23-.08.424-.238.576a.806.806 0 01-.59.234h-8.86v-6.521l1.83 1.184a.404.404 0 00.424.012l6.998-4.295v-.017l.198-.104a.236.236 0 00.238-.107zm0-1.58v.788l-7.455 4.578-2.233-1.449V5.75h8.86c.228 0 .42.076.578.228a.79.79 0 01.25.578v-.001zM14.312 5.75v16.5H1.03a.985.985 0 01-.72-.303A1.007 1.007 0 010 21.22V4.03c0-.283.103-.527.31-.732a.992.992 0 01.72-.297h13.282zm-7.24 12.75c1.143 0 2.072-.39 2.787-1.172.716-.781 1.074-1.797 1.074-3.047 0-1.266-.355-2.293-1.066-3.082-.711-.789-1.636-1.183-2.775-1.183-1.154 0-2.089.392-2.803 1.175-.715.783-1.072 1.803-1.072 3.059 0 1.25.354 2.266 1.063 3.047.709.781 1.64 1.172 2.793 1.172zm.04-6.531c.59 0 1.06.236 1.412.707.352.471.528 1.09.528 1.855 0 .782-.174 1.41-.52 1.887-.347.477-.82.715-1.42.715-.608 0-1.083-.234-1.426-.703-.342-.469-.513-1.092-.513-1.87 0-.797.172-1.425.516-1.884.343-.459.816-.688 1.42-.688z"/>
    </svg>
  )
}

function ServerIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 17.25v-.228a4.5 4.5 0 00-.12-1.03l-2.268-9.64a3.375 3.375 0 00-3.285-2.602H7.923a3.375 3.375 0 00-3.285 2.602l-2.268 9.64a4.5 4.5 0 00-.12 1.03v.228m19.5 0a3 3 0 01-3 3H5.25a3 3 0 01-3-3m19.5 0a3 3 0 00-3-3H5.25a3 3 0 00-3 3m16.5 0h.008v.008h-.008v-.008zm-3 0h.008v.008h-.008v-.008z" />
    </svg>
  )
}

function GoogleIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}

function MicrosoftIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path fill="#F25022" d="M1 1h10v10H1z"/>
      <path fill="#00A4EF" d="M1 13h10v10H1z"/>
      <path fill="#7FBA00" d="M13 1h10v10H13z"/>
      <path fill="#FFB900" d="M13 13h10v10H13z"/>
    </svg>
  )
}

// CRM Integration Icons
function HubSpotIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.164 7.93V5.084a2.198 2.198 0 001.267-1.984 2.21 2.21 0 00-4.418 0c0 .9.545 1.678 1.321 2.02v2.79a6.125 6.125 0 00-3.126 1.236L5.93 3.61a2.36 2.36 0 00.112-.7 2.34 2.34 0 10-2.34 2.34c.424 0 .82-.114 1.162-.31l7.137 5.415a6.085 6.085 0 00-.67 2.78c0 .989.24 1.92.658 2.748l-2.19 2.19a1.95 1.95 0 00-.598-.095 1.961 1.961 0 101.961 1.961c0-.214-.035-.42-.098-.612l2.164-2.163a6.11 6.11 0 003.754 1.283 6.128 6.128 0 000-12.255 6.07 6.07 0 00-2.818.688zM17 15.545a3.128 3.128 0 110-6.256 3.128 3.128 0 010 6.256z"/>
    </svg>
  )
}

function SalesforceIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M10.006 5.415a4.195 4.195 0 013.045-1.306c1.56 0 2.954.9 3.69 2.205.63-.3 1.35-.465 2.1-.465 2.85 0 5.159 2.34 5.159 5.22s-2.31 5.22-5.16 5.22c-.345 0-.69-.045-1.02-.12a3.93 3.93 0 01-3.54 2.22c-.555 0-1.08-.12-1.56-.33a4.68 4.68 0 01-4.11 2.49c-2.16 0-4.005-1.455-4.56-3.45a4.07 4.07 0 01-.72.06c-2.22 0-4.02-1.83-4.02-4.08 0-1.665.99-3.09 2.4-3.72a4.757 4.757 0 01-.165-1.23c0-2.58 2.055-4.665 4.59-4.665 1.5 0 2.835.72 3.69 1.845l-.015-.015z"/>
    </svg>
  )
}

function PipedriveIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
    </svg>
  )
}

function ZapierIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M15.478 12.889l-2.711 2.71a3.47 3.47 0 01-.656-.656l2.711-2.711a3.424 3.424 0 01.656.657zm-6.3 6.3c.191.24.408.46.656.656l2.711-2.71a3.47 3.47 0 01-.657-.657l-2.71 2.711zm-.656-6.3a3.424 3.424 0 01.656-.657l-2.71-2.71a3.424 3.424 0 01-.657.656l2.711 2.711zm6.3-6.3a3.424 3.424 0 01-.656.656l2.71 2.711a3.424 3.424 0 01.657-.656l-2.711-2.711zM12 9.244c.465 0 .918.054 1.355.154l.868-3.244A7.7 7.7 0 0012 5.8a7.7 7.7 0 00-2.222.354l.867 3.244c.437-.1.89-.154 1.355-.154zm2.756 2.756c0-.465-.054-.918-.154-1.355l-3.244.867a3.854 3.854 0 000 .976l3.244.867c.1-.437.154-.89.154-1.355zm-2.756 2.756c-.465 0-.918-.054-1.355-.154l-.867 3.244a7.7 7.7 0 002.222.354 7.7 7.7 0 002.222-.354l-.867-3.244a3.854 3.854 0 01-1.355.154zM9.244 12c0 .465.054.918.154 1.355l3.244-.867a3.854 3.854 0 000-.976l-3.244-.867A3.854 3.854 0 009.244 12z"/>
    </svg>
  )
}

function MakeIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="12" r="10" fillOpacity="0.2"/>
      <circle cx="12" cy="12" r="6"/>
    </svg>
  )
}

function SlackIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M5.042 15.165a2.528 2.528 0 01-2.52 2.523A2.528 2.528 0 010 15.165a2.527 2.527 0 012.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 012.521-2.52 2.527 2.527 0 012.521 2.52v6.313A2.528 2.528 0 018.834 24a2.528 2.528 0 01-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 01-2.521-2.52A2.528 2.528 0 018.834 0a2.528 2.528 0 012.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 012.521 2.521 2.528 2.528 0 01-2.521 2.521H2.522A2.528 2.528 0 010 8.834a2.528 2.528 0 012.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 012.522-2.521A2.528 2.528 0 0124 8.834a2.528 2.528 0 01-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 01-2.523 2.521 2.527 2.527 0 01-2.52-2.521V2.522A2.527 2.527 0 0115.165 0a2.528 2.528 0 012.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 012.523 2.522A2.528 2.528 0 0115.165 24a2.527 2.527 0 01-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 01-2.52-2.523 2.526 2.526 0 012.52-2.52h6.313A2.527 2.527 0 0124 15.165a2.528 2.528 0 01-2.522 2.523h-6.313z"/>
    </svg>
  )
}

function WebhookIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
    </svg>
  )
}
