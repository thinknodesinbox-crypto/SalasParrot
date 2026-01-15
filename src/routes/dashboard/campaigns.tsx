import { createFileRoute } from '@tanstack/react-router'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useCallback } from 'react'
import { SequenceCanvas, StepPalette, NodeConfigPanel, type SequenceNode } from '@/components/campaign/SequenceCanvas'
import { useCampaigns, useCreateCampaign, useDeleteCampaign, useStartCampaign, usePauseCampaign } from '../../lib/hooks/queries'
import type { Campaign, CampaignStatus } from '../../lib/types'
import { api } from '@/lib/api'
import { prepareNodesForSave } from '@/lib/utils/campaignStepMapper'

export const Route = createFileRoute('/dashboard/campaigns')({
  component: CampaignsPage,
})

function CampaignsPage() {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null)
  const [filterStatus, setFilterStatus] = useState<'all' | CampaignStatus>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Use API hooks
  const { data: campaigns = [], isLoading, error, refetch } = useCampaigns(
    filterStatus !== 'all' ? { status: filterStatus } : undefined
  )

  // Client-side search filter (status filtering is done server-side)
  const filteredCampaigns = campaigns.filter(c => {
    if (searchQuery && !c.name.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <LoadingSpinner />
          <p className="text-[#64748B]">Loading campaigns...</p>
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
          <h3 className="text-lg font-semibold text-[#1E293B] mb-2">Failed to load campaigns</h3>
          <p className="text-[#64748B] mb-4">{error.message}</p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-[#FF6B35] text-white font-medium rounded-lg hover:bg-[#E85A2A] transition-colors"
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
              <th className="text-left px-6 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wider">Created</th>
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
  const deleteCampaign = useDeleteCampaign()

  const statusColors: Record<string, { bg: string; text: string; dot: string }> = {
    draft: { bg: 'bg-[#F8FAFC]', text: 'text-[#64748B]', dot: 'bg-[#94A3B8]' },
    active: { bg: 'bg-[#F0FDF4]', text: 'text-[#22C55E]', dot: 'bg-[#22C55E]' },
    paused: { bg: 'bg-[#FFFBEB]', text: 'text-[#F59E0B]', dot: 'bg-[#F59E0B]' },
    completed: { bg: 'bg-[#EFF6FF]', text: 'text-[#3B82F6]', dot: 'bg-[#3B82F6]' },
  }

  const status = statusColors[campaign.status] || statusColors.draft

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this campaign?')) {
      try {
        await deleteCampaign.mutateAsync(campaign.id)
      } catch {
        // Error handling is done in the mutation
      }
    }
  }

  return (
    <div
      className="p-4 hover:bg-[#F8FAFC] transition-colors cursor-pointer"
      onClick={() => onSelect(campaign)}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0 flex-1">
          <p className="font-medium text-[#1E293B] truncate">{campaign.name}</p>
          <p className="text-sm text-[#64748B] truncate mt-0.5">
            Created {new Date(campaign.created_at).toLocaleDateString()}
          </p>
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
                    <CampaignActionButtons campaign={campaign} onClose={() => setMenuOpen(false)} />
                    <button
                      onClick={() => {
                        setMenuOpen(false)
                        handleDelete()
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-[#EF4444] hover:bg-[#FEF2F2]"
                    >
                      Delete
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Status info */}
      <div className="flex items-center gap-4 text-sm text-[#64748B]">
        <span>Created {new Date(campaign.created_at).toLocaleDateString()}</span>
      </div>
    </div>
  )
}

// Helper component for start/pause buttons
function CampaignActionButtons({ campaign, onClose }: { campaign: Campaign; onClose: () => void }) {
  const startCampaign = useStartCampaign(campaign.id)
  const pauseCampaign = usePauseCampaign(campaign.id)

  if (campaign.status === 'active') {
    return (
      <button
        onClick={async () => {
          onClose()
          await pauseCampaign.mutateAsync()
        }}
        className="w-full px-4 py-2 text-left text-sm text-[#F59E0B] hover:bg-[#FFFBEB]"
      >
        Pause Campaign
      </button>
    )
  }

  if (campaign.status !== 'completed') {
    return (
      <button
        onClick={async () => {
          onClose()
          await startCampaign.mutateAsync()
        }}
        className="w-full px-4 py-2 text-left text-sm text-[#22C55E] hover:bg-[#F0FDF4]"
      >
        Start Campaign
      </button>
    )
  }

  return null
}

function CampaignRow({
  campaign,
  onSelect
}: {
  campaign: Campaign
  onSelect: (campaign: Campaign) => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const deleteCampaign = useDeleteCampaign()

  const statusColors: Record<string, { bg: string; text: string; dot: string }> = {
    draft: { bg: 'bg-[#F8FAFC]', text: 'text-[#64748B]', dot: 'bg-[#94A3B8]' },
    active: { bg: 'bg-[#F0FDF4]', text: 'text-[#22C55E]', dot: 'bg-[#22C55E]' },
    paused: { bg: 'bg-[#FFFBEB]', text: 'text-[#F59E0B]', dot: 'bg-[#F59E0B]' },
    completed: { bg: 'bg-[#EFF6FF]', text: 'text-[#3B82F6]', dot: 'bg-[#3B82F6]' },
  }

  const status = statusColors[campaign.status] || statusColors.draft

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this campaign?')) {
      try {
        await deleteCampaign.mutateAsync(campaign.id)
      } catch {
        // Error handling is done in the mutation
      }
    }
  }

  return (
    <tr
      className="hover:bg-[#F8FAFC] transition-colors cursor-pointer"
      onClick={() => onSelect(campaign)}
    >
      <td className="px-6 py-4">
        <div>
          <p className="font-medium text-[#1E293B]">{campaign.name}</p>
          <p className="text-sm text-[#64748B]">ID: {campaign.id.slice(0, 8)}...</p>
        </div>
      </td>
      <td className="px-6 py-4">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${status.bg} ${status.text}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
          {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
        </span>
      </td>
      <td className="px-6 py-4">
        <span className="text-[#64748B]">
          {new Date(campaign.created_at).toLocaleDateString()}
        </span>
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
                  <CampaignActionButtons campaign={campaign} onClose={() => setMenuOpen(false)} />
                  <button
                    onClick={() => {
                      setMenuOpen(false)
                      handleDelete()
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-[#EF4444] hover:bg-[#FEF2F2]"
                  >
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
}: {
  onClose: () => void
}) {
  const createCampaign = useCreateCampaign()
  const [step, setStep] = useState<'name' | 'leads' | 'sequence' | 'senders' | 'review'>('name')
  const [campaignName, setCampaignName] = useState('')
  const [campaignDescription, setCampaignDescription] = useState('')
  const [selectedLeadList, setSelectedLeadList] = useState<string | null>(null)
  const [sequenceNodes, setSequenceNodes] = useState<SequenceNode[]>([
    { id: 'start', type: 'start', data: {} },
    { id: 'end', type: 'end', data: {} },
  ])
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

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

  const stepConfigs = [
    { id: 'name', label: 'Name', number: 1 },
    { id: 'leads', label: 'Leads', number: 2 },
    { id: 'sequence', label: 'Sequence', number: 3 },
    { id: 'senders', label: 'Senders', number: 4 },
    { id: 'review', label: 'Review', number: 5 },
  ]

  const currentStepIndex = stepConfigs.findIndex(s => s.id === step)

  const handleCreate = async () => {
    setError(null)
    try {
      // Step 1: Create the campaign
      const campaign = await createCampaign.mutateAsync({
        name: campaignName,
      })

      // Step 2: Save all sequence steps
      const stepsToSave = prepareNodesForSave(sequenceNodes)

      if (stepsToSave.length > 0) {
        // Create steps sequentially to maintain order
        for (const stepData of stepsToSave) {
          await api.post(`/campaigns/${campaign.id}/steps`, stepData)
        }
      }

      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create campaign')
    }
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
                      <span className="font-medium text-[#1E293B]">{sequenceNodes.filter(n => n.type !== 'start' && n.type !== 'end').length} steps</span>
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

                  {error && (
                    <div className="bg-[#FEF2F2] border border-[#EF4444]/20 rounded-xl p-4 flex items-start gap-3">
                      <AlertIcon className="w-5 h-5 text-[#EF4444] flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-[#DC2626]">Error creating campaign</p>
                        <p className="text-xs text-[#EF4444]">{error}</p>
                      </div>
                    </div>
                  )}
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
              <p className="text-sm text-[#64748B]">Status: {campaign.status}</p>
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


function WarningIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
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

function LoadingSpinner() {
  return (
    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  )
}
