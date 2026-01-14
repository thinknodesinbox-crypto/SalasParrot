import { createFileRoute } from '@tanstack/react-router'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useCallback } from 'react'
import { SequenceCanvas, StepPalette, NodeConfigPanel, type SequenceNode } from '@/components/campaign/SequenceCanvas'

export const Route = createFileRoute('/dashboard/campaigns')({
  component: CampaignsPage,
})

interface Campaign {
  id: string
  name: string
  description?: string
  status: 'draft' | 'active' | 'paused' | 'completed'
  leads: number
  sent: number
  connected: number
  replied: number
  connectionRate: number
  replyRate: number
  senders: number
  createdAt: string
  steps: CampaignStep[]
}

interface CampaignStep {
  id: string
  type: 'linkedin_connect' | 'linkedin_message' | 'linkedin_follow' | 'linkedin_view' | 'email' | 'delay'
  config: Record<string, unknown>
}

function CampaignsPage() {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null)
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'paused' | 'draft'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const [campaigns, setCampaigns] = useState<Campaign[]>([
    // Empty state - remove sample data
  ])

  const filteredCampaigns = campaigns.filter(c => {
    if (filterStatus !== 'all' && c.status !== filterStatus) return false
    if (searchQuery && !c.name.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-[#1E293B]">Campaigns</h1>
          <p className="text-[#64748B] mt-1 text-sm md:text-base">Create and manage your outreach sequences</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#FF6B35] text-white font-medium rounded-lg hover:bg-[#E85A2A] transition-colors w-full sm:w-auto"
        >
          <PlusIcon />
          Start New Campaign
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
        <div className="flex-1 relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search campaigns..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[#E2E8F0] bg-white focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35]"
          />
        </div>
        <div className="flex bg-white border border-[#E2E8F0] rounded-lg p-1 overflow-x-auto">
          {(['all', 'active', 'paused', 'draft'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 sm:px-4 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                filterStatus === status
                  ? 'bg-[#FF6B35] text-white'
                  : 'text-[#64748B] hover:text-[#1E293B]'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {campaigns.length === 0 ? (
        <EmptyState onCreate={() => setShowCreateModal(true)} />
      ) : (
        <CampaignsList
          campaigns={filteredCampaigns}
          onSelect={setSelectedCampaign}
        />
      )}

      {/* Create Campaign Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateCampaignModal
            onClose={() => setShowCreateModal(false)}
            onCreate={(campaign) => {
              setCampaigns([...campaigns, campaign])
              setShowCreateModal(false)
            }}
          />
        )}
      </AnimatePresence>

      {/* Campaign Detail Drawer */}
      <AnimatePresence>
        {selectedCampaign && (
          <CampaignDetailDrawer
            campaign={selectedCampaign}
            onClose={() => setSelectedCampaign(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl border border-[#E2E8F0] p-12 text-center"
    >
      <div className="max-w-md mx-auto">
        {/* Illustration */}
        <div className="w-32 h-32 mx-auto mb-6 relative">
          <div className="absolute inset-0 bg-[#FFF7ED] rounded-full" />
          <div className="absolute inset-4 bg-[#FFEDD5] rounded-full flex items-center justify-center">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
              <CampaignIcon className="w-6 h-6 text-[#FF6B35]" />
            </div>
          </div>
          {/* Floating steps */}
          <motion.div
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute -left-4 top-1/3 w-8 h-8 bg-[#0A66C2] rounded-lg flex items-center justify-center"
          >
            <LinkedInIcon className="w-4 h-4 text-white" />
          </motion.div>
          <motion.div
            animate={{ y: [0, 5, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
            className="absolute -right-4 top-1/2 w-8 h-8 bg-[#14B8A6] rounded-lg flex items-center justify-center"
          >
            <EmailIcon className="w-4 h-4 text-white" />
          </motion.div>
        </div>

        <h2 className="text-xl font-bold text-[#1E293B] mb-2">
          No campaigns yet
        </h2>
        <p className="text-[#64748B] mb-8">
          Create your first multi-channel campaign. Combine LinkedIn and email touchpoints to maximize your reply rates.
        </p>

        <button
          onClick={onCreate}
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#FF6B35] text-white font-semibold rounded-xl hover:bg-[#E85A2A] transition-colors shadow-[0_4px_14px_rgba(255,107,53,0.25)]"
        >
          <PlusIcon className="w-5 h-5" />
          Create Your First Campaign
        </button>

        <div className="mt-8 bg-[#F8FAFC] rounded-xl p-4 text-left">
          <h3 className="font-medium text-[#1E293B] mb-3">What you can do:</h3>
          <ul className="space-y-2">
            <li className="flex items-start gap-2 text-sm text-[#64748B]">
              <CheckIcon className="w-4 h-4 text-[#22C55E] mt-0.5 flex-shrink-0" />
              Combine LinkedIn + Email in one sequence
            </li>
            <li className="flex items-start gap-2 text-sm text-[#64748B]">
              <CheckIcon className="w-4 h-4 text-[#22C55E] mt-0.5 flex-shrink-0" />
              Use "If Connected" logic for smart routing
            </li>
            <li className="flex items-start gap-2 text-sm text-[#64748B]">
              <CheckIcon className="w-4 h-4 text-[#22C55E] mt-0.5 flex-shrink-0" />
              Auto-rotate between multiple senders
            </li>
          </ul>
        </div>
      </div>
    </motion.div>
  )
}

function CampaignsList({
  campaigns,
  onSelect
}: {
  campaigns: Campaign[]
  onSelect: (campaign: Campaign) => void
}) {
  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
      {/* Desktop Table */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
              <th className="text-left px-6 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wider">Campaign</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wider">Status</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wider">Progress</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wider">Performance</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wider">Senders</th>
              <th className="text-right px-6 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E8F0]">
            {campaigns.map((campaign) => (
              <CampaignRow key={campaign.id} campaign={campaign} onSelect={onSelect} />
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden divide-y divide-[#E2E8F0]">
        {campaigns.map((campaign) => (
          <CampaignCard key={campaign.id} campaign={campaign} onSelect={onSelect} />
        ))}
      </div>
    </div>
  )
}

function CampaignCard({
  campaign,
  onSelect
}: {
  campaign: Campaign
  onSelect: (campaign: Campaign) => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)

  const statusColors = {
    draft: { bg: 'bg-[#F8FAFC]', text: 'text-[#64748B]', dot: 'bg-[#94A3B8]' },
    active: { bg: 'bg-[#F0FDF4]', text: 'text-[#22C55E]', dot: 'bg-[#22C55E]' },
    paused: { bg: 'bg-[#FFFBEB]', text: 'text-[#F59E0B]', dot: 'bg-[#F59E0B]' },
    completed: { bg: 'bg-[#EFF6FF]', text: 'text-[#3B82F6]', dot: 'bg-[#3B82F6]' },
  }

  const status = statusColors[campaign.status]
  const progressPercent = campaign.leads > 0 ? (campaign.sent / campaign.leads) * 100 : 0

  return (
    <div
      className="p-4 hover:bg-[#F8FAFC] transition-colors cursor-pointer"
      onClick={() => onSelect(campaign)}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0 flex-1">
          <p className="font-medium text-[#1E293B] truncate">{campaign.name}</p>
          {campaign.description && (
            <p className="text-sm text-[#64748B] truncate mt-0.5">{campaign.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${status.bg} ${status.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
            {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
          </span>
          <div className="relative" onClick={(e) => e.stopPropagation()}>
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
                    <button className="w-full px-4 py-2 text-left text-sm text-[#1E293B] hover:bg-[#F8FAFC]">
                      Edit Campaign
                    </button>
                    {campaign.status === 'active' ? (
                      <button className="w-full px-4 py-2 text-left text-sm text-[#F59E0B] hover:bg-[#FFFBEB]">
                        Pause Campaign
                      </button>
                    ) : campaign.status !== 'completed' ? (
                      <button className="w-full px-4 py-2 text-left text-sm text-[#22C55E] hover:bg-[#F0FDF4]">
                        Start Campaign
                      </button>
                    ) : null}
                    <button className="w-full px-4 py-2 text-left text-sm text-[#EF4444] hover:bg-[#FEF2F2]">
                      Delete
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
          <span className="text-[#64748B]">{campaign.sent} / {campaign.leads} sent</span>
          <span className="font-medium text-[#1E293B]">{Math.round(progressPercent)}%</span>
        </div>
        <div className="h-1.5 bg-[#E2E8F0] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#FF6B35] rounded-full transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-1">
          <ConnectIcon className="w-4 h-4 text-[#22C55E]" />
          <span className="text-[#64748B]">{campaign.connectionRate}%</span>
        </div>
        <div className="flex items-center gap-1">
          <ReplyIcon className="w-4 h-4 text-[#FF6B35]" />
          <span className="text-[#64748B]">{campaign.replyRate}%</span>
        </div>
        <div className="flex items-center gap-1 ml-auto">
          <div className="flex -space-x-2">
            {Array.from({ length: Math.min(campaign.senders, 3) }).map((_, i) => (
              <div
                key={i}
                className="w-6 h-6 rounded-full bg-gradient-to-br from-[#0A66C2] to-[#004182] border-2 border-white flex items-center justify-center text-white text-[10px]"
              >
                {String.fromCharCode(65 + i)}
              </div>
            ))}
          </div>
          {campaign.senders > 3 && (
            <span className="text-xs text-[#64748B] ml-1">+{campaign.senders - 3}</span>
          )}
        </div>
      </div>
    </div>
  )
}

function CampaignRow({
  campaign,
  onSelect
}: {
  campaign: Campaign
  onSelect: (campaign: Campaign) => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)

  const statusColors = {
    draft: { bg: 'bg-[#F8FAFC]', text: 'text-[#64748B]', dot: 'bg-[#94A3B8]' },
    active: { bg: 'bg-[#F0FDF4]', text: 'text-[#22C55E]', dot: 'bg-[#22C55E]' },
    paused: { bg: 'bg-[#FFFBEB]', text: 'text-[#F59E0B]', dot: 'bg-[#F59E0B]' },
    completed: { bg: 'bg-[#EFF6FF]', text: 'text-[#3B82F6]', dot: 'bg-[#3B82F6]' },
  }

  const status = statusColors[campaign.status]
  const progressPercent = campaign.leads > 0 ? (campaign.sent / campaign.leads) * 100 : 0

  return (
    <tr
      className="hover:bg-[#F8FAFC] transition-colors cursor-pointer"
      onClick={() => onSelect(campaign)}
    >
      <td className="px-6 py-4">
        <div>
          <p className="font-medium text-[#1E293B]">{campaign.name}</p>
          {campaign.description && (
            <p className="text-sm text-[#64748B] truncate max-w-xs">{campaign.description}</p>
          )}
        </div>
      </td>
      <td className="px-6 py-4">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${status.bg} ${status.text}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
          {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
        </span>
      </td>
      <td className="px-6 py-4">
        <div className="w-32">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-[#64748B]">{campaign.sent} / {campaign.leads}</span>
            <span className="font-medium text-[#1E293B]">{Math.round(progressPercent)}%</span>
          </div>
          <div className="h-1.5 bg-[#E2E8F0] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#FF6B35] rounded-full transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <ConnectIcon className="w-4 h-4 text-[#22C55E]" />
            <span className="text-[#1E293B]">{campaign.connectionRate}%</span>
          </div>
          <div className="flex items-center gap-1">
            <ReplyIcon className="w-4 h-4 text-[#FF6B35]" />
            <span className="text-[#1E293B]">{campaign.replyRate}%</span>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-1">
          <div className="flex -space-x-2">
            {Array.from({ length: Math.min(campaign.senders, 3) }).map((_, i) => (
              <div
                key={i}
                className="w-7 h-7 rounded-full bg-gradient-to-br from-[#0A66C2] to-[#004182] border-2 border-white flex items-center justify-center text-white text-xs"
              >
                {String.fromCharCode(65 + i)}
              </div>
            ))}
          </div>
          {campaign.senders > 3 && (
            <span className="text-xs text-[#64748B] ml-1">+{campaign.senders - 3}</span>
          )}
        </div>
      </td>
      <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
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
                    Edit Campaign
                  </button>
                  {campaign.status === 'active' ? (
                    <button className="w-full px-4 py-2 text-left text-sm text-[#F59E0B] hover:bg-[#FFFBEB]">
                      Pause Campaign
                    </button>
                  ) : campaign.status !== 'completed' ? (
                    <button className="w-full px-4 py-2 text-left text-sm text-[#22C55E] hover:bg-[#F0FDF4]">
                      Start Campaign
                    </button>
                  ) : null}
                  <button className="w-full px-4 py-2 text-left text-sm text-[#1E293B] hover:bg-[#F8FAFC]">
                    Duplicate
                  </button>
                  <button className="w-full px-4 py-2 text-left text-sm text-[#EF4444] hover:bg-[#FEF2F2]">
                    Delete
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

function CreateCampaignModal({
  onClose,
  onCreate
}: {
  onClose: () => void
  onCreate: (campaign: Campaign) => void
}) {
  const [step, setStep] = useState<'name' | 'leads' | 'sequence' | 'senders' | 'review'>('name')
  const [campaignName, setCampaignName] = useState('')
  const [campaignDescription, setCampaignDescription] = useState('')
  const [selectedLeadList, setSelectedLeadList] = useState<string | null>(null)
  const [sequenceNodes, setSequenceNodes] = useState<SequenceNode[]>([
    { id: 'start', type: 'start', data: {} },
    { id: 'end', type: 'end', data: {} },
  ])
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)

  const selectedNode = sequenceNodes.find(n => n.id === selectedNodeId) || null

  const handleAddStep = useCallback((type: SequenceNode['type']) => {
    const newNode: SequenceNode = {
      id: `node-${Date.now()}`,
      type,
      data: type === 'delay' ? { delayDays: 1, delayHours: 0 } : type === 'condition' ? { condition: 'connected' } : {},
    }
    // Insert before the end node
    const endIndex = sequenceNodes.findIndex(n => n.type === 'end')
    if (endIndex !== -1) {
      const newNodes = [...sequenceNodes]
      newNodes.splice(endIndex, 0, newNode)
      setSequenceNodes(newNodes)
    } else {
      setSequenceNodes([...sequenceNodes, newNode])
    }
  }, [sequenceNodes])

  const handleUpdateNode = useCallback((data: Partial<SequenceNode['data']>) => {
    if (!selectedNodeId) return
    setSequenceNodes(nodes => nodes.map(n =>
      n.id === selectedNodeId ? { ...n, data: { ...n.data, ...data } } : n
    ))
  }, [selectedNodeId])

  // Convert sequence nodes to campaign steps for saving
  const steps: CampaignStep[] = sequenceNodes
    .filter(n => n.type !== 'start' && n.type !== 'end')
    .map(n => ({
      id: n.id,
      type: n.type as CampaignStep['type'],
      config: n.data,
    }))

  const stepConfigs = [
    { id: 'name', label: 'Name', number: 1 },
    { id: 'leads', label: 'Leads', number: 2 },
    { id: 'sequence', label: 'Sequence', number: 3 },
    { id: 'senders', label: 'Senders', number: 4 },
    { id: 'review', label: 'Review', number: 5 },
  ]

  const currentStepIndex = stepConfigs.findIndex(s => s.id === step)

  const handleCreate = () => {
    onCreate({
      id: Date.now().toString(),
      name: campaignName,
      description: campaignDescription,
      status: 'draft',
      leads: 0,
      sent: 0,
      connected: 0,
      replied: 0,
      connectionRate: 0,
      replyRate: 0,
      senders: 0,
      createdAt: 'Just now',
      steps
    })
  }

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
        className={`bg-white rounded-2xl w-full overflow-hidden shadow-xl max-h-[90vh] flex flex-col ${
          step === 'sequence' ? 'max-w-6xl' : 'max-w-3xl'
        }`}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#1E293B]">Create Campaign</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-[#F8FAFC]">
            <CloseIcon />
          </button>
        </div>

        {/* Progress */}
        <div className="px-6 py-4 border-b border-[#E2E8F0]">
          <div className="flex items-center justify-between">
            {stepConfigs.map((s, i) => (
              <div key={s.id} className="flex items-center">
                <div className={`flex items-center gap-2 ${i <= currentStepIndex ? 'text-[#FF6B35]' : 'text-[#94A3B8]'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    i < currentStepIndex ? 'bg-[#FF6B35] text-white' :
                    i === currentStepIndex ? 'bg-[#FFF7ED] text-[#FF6B35] border-2 border-[#FF6B35]' :
                    'bg-[#F8FAFC] text-[#94A3B8]'
                  }`}>
                    {i < currentStepIndex ? '✓' : s.number}
                  </div>
                  <span className="text-sm font-medium hidden sm:block">{s.label}</span>
                </div>
                {i < stepConfigs.length - 1 && (
                  <div className={`w-8 sm:w-12 h-0.5 mx-2 ${i < currentStepIndex ? 'bg-[#FF6B35]' : 'bg-[#E2E8F0]'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className={`flex-1 overflow-y-auto ${step === 'sequence' ? 'p-6' : 'p-6'}`}>
          <AnimatePresence mode="wait">
            {step === 'name' && (
              <motion.div
                key="name"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div>
                  <h3 className="text-lg font-semibold text-[#1E293B] mb-1">Name your campaign</h3>
                  <p className="text-sm text-[#64748B]">Give your campaign a memorable name and description.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1E293B] mb-2">
                    Campaign Name *
                  </label>
                  <input
                    type="text"
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                    placeholder="e.g., Q1 Tech Leaders Outreach"
                    className="w-full px-4 py-3 rounded-xl border border-[#E2E8F0] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1E293B] mb-2">
                    Description (optional)
                  </label>
                  <textarea
                    value={campaignDescription}
                    onChange={(e) => setCampaignDescription(e.target.value)}
                    placeholder="Describe the goal of this campaign..."
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-[#E2E8F0] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35] resize-none"
                  />
                </div>
              </motion.div>
            )}

            {step === 'leads' && (
              <motion.div
                key="leads"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div>
                  <h3 className="text-lg font-semibold text-[#1E293B] mb-1">Select your leads</h3>
                  <p className="text-sm text-[#64748B]">Choose a lead list to target with this campaign.</p>
                </div>
                <div className="grid gap-3">
                  {/* Sample lead lists */}
                  {['Q1 Tech Leaders', 'Series A Founders', 'Agency Partners'].map((list, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedLeadList(list)}
                      className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                        selectedLeadList === list
                          ? 'border-[#FF6B35] bg-[#FFF7ED]'
                          : 'border-[#E2E8F0] hover:border-[#FF6B35]/30'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        selectedLeadList === list ? 'bg-[#FF6B35]' : 'bg-[#F8FAFC]'
                      }`}>
                        <ListIcon className={`w-5 h-5 ${selectedLeadList === list ? 'text-white' : 'text-[#64748B]'}`} />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-medium text-[#1E293B]">{list}</p>
                        <p className="text-sm text-[#64748B]">{150 + i * 50} leads • {80 + i * 10} enriched</p>
                      </div>
                      {selectedLeadList === list && (
                        <CheckCircleIcon className="w-5 h-5 text-[#FF6B35]" />
                      )}
                    </button>
                  ))}
                </div>
                <button className="w-full p-4 border-2 border-dashed border-[#E2E8F0] rounded-xl hover:border-[#FF6B35]/50 hover:bg-[#FFF7ED]/50 transition-colors text-center">
                  <PlusIcon className="w-5 h-5 text-[#94A3B8] mx-auto mb-1" />
                  <span className="text-sm text-[#64748B]">Import new leads</span>
                </button>
              </motion.div>
            )}

            {step === 'sequence' && (
              <motion.div
                key="sequence"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="h-full -m-6"
              >
                {/* Mobile Layout - Stacked */}
                <div className="lg:hidden relative flex flex-col h-[calc(100vh-300px)] min-h-[400px] bg-[#FAFBFC]">
                  {/* Mobile Step Palette - Horizontal scroll */}
                  <div className="p-3 border-b border-[#E2E8F0] bg-white">
                    <p className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-2">Add Steps</p>
                    <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
                      {[
                        { type: 'linkedin_connect' as const, label: 'Connect', color: '#0A66C2' },
                        { type: 'linkedin_message' as const, label: 'Message', color: '#0A66C2' },
                        { type: 'email' as const, label: 'Email', color: '#14B8A6' },
                        { type: 'delay' as const, label: 'Wait', color: '#F59E0B' },
                        { type: 'condition' as const, label: 'If/Then', color: '#8B5CF6' },
                      ].map((item) => (
                        <button
                          key={item.type}
                          onClick={() => handleAddStep(item.type)}
                          className="flex-shrink-0 px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white hover:border-[#FF6B35]/30 transition-all"
                        >
                          <span className="text-xs font-medium" style={{ color: item.color }}>{item.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Mobile Canvas */}
                  <div className="flex-1 overflow-y-auto">
                    <SequenceCanvas
                      nodes={sequenceNodes}
                      onNodesChange={setSequenceNodes}
                      onNodeSelect={(node) => setSelectedNodeId(node?.id || null)}
                      selectedNodeId={selectedNodeId}
                    />
                  </div>

                  {/* Mobile Config Panel - Bottom Sheet */}
                  <AnimatePresence>
                    {selectedNode && selectedNode.type !== 'start' && selectedNode.type !== 'end' && (
                      <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        className="absolute bottom-0 left-0 right-0 bg-white border-t border-[#E2E8F0] rounded-t-2xl shadow-lg max-h-[60vh] overflow-y-auto"
                      >
                        <div className="w-12 h-1 bg-[#E2E8F0] rounded-full mx-auto my-3" />
                        <NodeConfigPanel
                          node={selectedNode}
                          onUpdate={handleUpdateNode}
                          onClose={() => setSelectedNodeId(null)}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Desktop Layout - Side by side */}
                <div className="hidden lg:flex h-[500px] bg-[#FAFBFC] rounded-lg overflow-hidden border border-[#E2E8F0]">
                  {/* Step Palette */}
                  <StepPalette
                    onAddStep={handleAddStep}
                    onApplyTemplate={(nodes) => setSequenceNodes(nodes)}
                  />

                  {/* Main Canvas */}
                  <SequenceCanvas
                    nodes={sequenceNodes}
                    onNodesChange={setSequenceNodes}
                    onNodeSelect={(node) => setSelectedNodeId(node?.id || null)}
                    selectedNodeId={selectedNodeId}
                  />

                  {/* Node Config Panel */}
                  <AnimatePresence>
                    {selectedNode && selectedNode.type !== 'start' && selectedNode.type !== 'end' && (
                      <NodeConfigPanel
                        node={selectedNode}
                        onUpdate={handleUpdateNode}
                        onClose={() => setSelectedNodeId(null)}
                      />
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}

            {step === 'senders' && (
              <motion.div
                key="senders"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div>
                  <h3 className="text-lg font-semibold text-[#1E293B] mb-1">Assign senders</h3>
                  <p className="text-sm text-[#64748B]">Select LinkedIn accounts to send from. We'll auto-rotate between them.</p>
                </div>

                <div className="bg-[#F8FAFC] rounded-xl p-4 text-center">
                  <LinkedInIcon className="w-8 h-8 text-[#94A3B8] mx-auto mb-2" />
                  <p className="text-sm text-[#64748B] mb-3">No LinkedIn accounts connected yet</p>
                  <button className="px-4 py-2 bg-[#0A66C2] text-white text-sm font-medium rounded-lg hover:bg-[#004182]">
                    Connect LinkedIn Account
                  </button>
                </div>
              </motion.div>
            )}

            {step === 'review' && (
              <motion.div
                key="review"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div>
                  <h3 className="text-lg font-semibold text-[#1E293B] mb-1">Review your campaign</h3>
                  <p className="text-sm text-[#64748B]">Make sure everything looks good before launching.</p>
                </div>

                <div className="space-y-4">
                  <div className="bg-[#F8FAFC] rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-[#64748B]">Campaign Name</span>
                      <span className="font-medium text-[#1E293B]">{campaignName || 'Untitled'}</span>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-[#64748B]">Lead List</span>
                      <span className="font-medium text-[#1E293B]">{selectedLeadList || 'None selected'}</span>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-[#64748B]">Sequence Steps</span>
                      <span className="font-medium text-[#1E293B]">{steps.length} steps</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[#64748B]">Senders</span>
                      <span className="font-medium text-[#1E293B]">0 connected</span>
                    </div>
                  </div>

                  <div className="bg-[#FFFBEB] border border-[#F59E0B]/20 rounded-xl p-4 flex items-start gap-3">
                    <WarningIcon className="w-5 h-5 text-[#F59E0B] flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-[#92400E]">Campaign saved as draft</p>
                      <p className="text-xs text-[#B45309]">Connect a LinkedIn account to start this campaign.</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#E2E8F0] flex items-center justify-between">
          <button
            onClick={() => {
              const steps: Array<'name' | 'leads' | 'sequence' | 'senders' | 'review'> = ['name', 'leads', 'sequence', 'senders', 'review']
              const currentIndex = steps.indexOf(step)
              if (currentIndex > 0) setStep(steps[currentIndex - 1])
            }}
            disabled={step === 'name'}
            className="px-4 py-2 text-[#64748B] font-medium disabled:opacity-50"
          >
            Back
          </button>
          <button
            onClick={() => {
              const steps: Array<'name' | 'leads' | 'sequence' | 'senders' | 'review'> = ['name', 'leads', 'sequence', 'senders', 'review']
              const currentIndex = steps.indexOf(step)
              if (currentIndex < steps.length - 1) {
                setStep(steps[currentIndex + 1])
              } else {
                handleCreate()
              }
            }}
            disabled={step === 'name' && !campaignName}
            className="px-6 py-2 bg-[#FF6B35] text-white font-medium rounded-lg hover:bg-[#E85A2A] disabled:opacity-50"
          >
            {step === 'review' ? 'Create Campaign' : 'Continue'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

function CampaignDetailDrawer({
  campaign,
  onClose
}: {
  campaign: Campaign
  onClose: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        onClick={(e) => e.stopPropagation()}
        className="absolute right-0 top-0 h-full w-full max-w-2xl bg-white shadow-xl"
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-[#1E293B]">{campaign.name}</h2>
              <p className="text-sm text-[#64748B]">{campaign.description || 'No description'}</p>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-[#F8FAFC]">
              <CloseIcon />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="text-center py-12 text-[#64748B]">
              Campaign details would be shown here
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

function StepIcon({ type }: { type: CampaignStep['type'] }) {
  switch (type) {
    case 'linkedin_connect':
      return <div className="w-8 h-8 rounded-lg bg-[#0A66C2]/10 flex items-center justify-center"><LinkedInIcon className="w-4 h-4 text-[#0A66C2]" /></div>
    case 'linkedin_message':
      return <div className="w-8 h-8 rounded-lg bg-[#0A66C2]/10 flex items-center justify-center"><MessageIcon className="w-4 h-4 text-[#0A66C2]" /></div>
    case 'email':
      return <div className="w-8 h-8 rounded-lg bg-[#14B8A6]/10 flex items-center justify-center"><EmailIcon className="w-4 h-4 text-[#14B8A6]" /></div>
    case 'delay':
      return <div className="w-8 h-8 rounded-lg bg-[#F59E0B]/10 flex items-center justify-center"><ClockIcon className="w-4 h-4 text-[#F59E0B]" /></div>
    default:
      return null
  }
}

function getStepLabel(type: CampaignStep['type']): string {
  switch (type) {
    case 'linkedin_connect': return 'Connection Request'
    case 'linkedin_message': return 'LinkedIn Message'
    case 'linkedin_follow': return 'Follow Profile'
    case 'linkedin_view': return 'View Profile'
    case 'email': return 'Send Email'
    case 'delay': return 'Wait / Delay'
    default: return 'Unknown Step'
  }
}

// Icons
function PlusIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  )
}

function SearchIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={`w-5 h-5 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  )
}

function CampaignIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
    </svg>
  )
}

function LinkedInIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path d="M16.338 16.338H13.67V12.16c0-.995-.017-2.277-1.387-2.277-1.39 0-1.601 1.086-1.601 2.207v4.248H8.014v-8.59h2.559v1.174h.037c.356-.675 1.227-1.387 2.526-1.387 2.703 0 3.203 1.778 3.203 4.092v4.711zM5.005 6.575a1.548 1.548 0 11-.003-3.096 1.548 1.548 0 01.003 3.096zm-1.337 9.763H6.34v-8.59H3.667v8.59zM17.668 1H2.328C1.595 1 1 1.581 1 2.298v15.403C1 18.418 1.595 19 2.328 19h15.34c.734 0 1.332-.582 1.332-1.299V2.298C19 1.581 18.402 1 17.668 1z" />
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

function MessageIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
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

function CheckIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
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

function ConnectIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM3 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 019.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
    </svg>
  )
}

function ReplyIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
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

function CloseIcon() {
  return (
    <svg className="w-5 h-5 text-[#64748B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

function ListIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  )
}

function WarningIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  )
}
