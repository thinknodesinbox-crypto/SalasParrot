import { createFileRoute, Link } from '@tanstack/react-router'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useRef, useEffect } from 'react'
import {
  useLeads,
  useLeadLists,
  useImportLeadsFromCSV,
  useStartImport,
  useImportJobStatus,
  useCancelImport,
  useLinkedInAccounts,
  useUpdateLeadList,
  useDeleteLeadList,
} from '../../lib/hooks/queries'
import type { Lead, LeadList, LinkedInAccount, ImportType } from '../../lib/types'

export const Route = createFileRoute('/dashboard/leads')({
  component: LeadsPage,
})

type ImportMethod =
  | 'linkedin_search'
  | 'sales_nav_leads'
  | 'sales_nav_accounts'
  | 'linkedin_recruiter'
  | 'linkedin_events'
  | 'linkedin_post_reactors'
  | 'csv'
  | 'linkedin_companies'
  | 'paste_urls'

const IMPORT_METHODS: {
  id: ImportMethod
  title: string
  description: string
  icon: React.ReactNode
  color: string
  category: 'linkedin' | 'import'
  comingSoon?: boolean
}[] = [
  {
    id: 'linkedin_search',
    title: 'LinkedIn Search',
    description: 'Search and import leads directly from LinkedIn people search',
    icon: <LinkedInSearchIcon />,
    color: '#0A66C2',
    category: 'linkedin',
  },
  {
    id: 'sales_nav_leads',
    title: 'Sales Navigator (Leads)',
    description: 'Export leads from your Sales Navigator saved searches',
    icon: <SalesNavIcon />,
    color: '#0A66C2',
    category: 'linkedin',
  },
  {
    id: 'sales_nav_accounts',
    title: 'Sales Navigator (Accounts)',
    description: 'Export accounts/companies from Sales Navigator',
    icon: <SalesNavAccountsIcon />,
    color: '#0A66C2',
    category: 'linkedin',
  },
  {
    id: 'linkedin_recruiter',
    title: 'LinkedIn Recruiter',
    description: 'Import candidates from LinkedIn Recruiter searches',
    icon: <RecruiterIcon />,
    color: '#0A66C2',
    category: 'linkedin',
  },
  {
    id: 'linkedin_events',
    title: 'LinkedIn Events',
    description: 'Import attendees from LinkedIn event pages',
    icon: <EventIcon />,
    color: '#0A66C2',
    category: 'linkedin',
    comingSoon: true,
  },
  {
    id: 'linkedin_post_reactors',
    title: 'LinkedIn Post Reactors',
    description: 'Import people who reacted to specific LinkedIn posts',
    icon: <ReactorsIcon />,
    color: '#0A66C2',
    category: 'linkedin',
  },
  {
    id: 'linkedin_companies',
    title: 'LinkedIn Companies',
    description: 'Search and import employees from company pages',
    icon: <CompaniesIcon />,
    color: '#0A66C2',
    category: 'linkedin',
  },
  {
    id: 'csv',
    title: 'Import from CSV',
    description: 'Upload a CSV file with LinkedIn URLs or contact info',
    icon: <CSVIcon />,
    color: '#22C55E',
    category: 'import',
  },
  {
    id: 'paste_urls',
    title: 'Paste LinkedIn URLs',
    description: 'Paste LinkedIn profile URLs directly',
    icon: <PasteIcon />,
    color: '#8B5CF6',
    category: 'import',
  },
]

function LeadsPage() {
  const [showImportModal, setShowImportModal] = useState(false)
  const [selectedListId, setSelectedListId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'enriched' | 'not_enriched'>('all')
  const [editingList, setEditingList] = useState<LeadList | null>(null)
  const [deletingList, setDeletingList] = useState<LeadList | null>(null)

  // Fetch lead lists from API
  const { data: listsResponse, isLoading: listsLoading, error: listsError, refetch: refetchLists } = useLeadLists()
  const lists = listsResponse?.lists || []

  // Fetch leads filtered by selected list
  const { data: leadsResponse, isLoading: leadsLoading } = useLeads(
    selectedListId ? { list_id: selectedListId } : undefined
  )
  const leads = leadsResponse?.leads || []

  const isLoading = listsLoading
  const error = listsError
  const refetch = refetchLists

  // Get the selected list object
  const selectedList = selectedListId ? lists.find(l => l.id === selectedListId) : null

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <LoadingSpinner />
          <p className="text-[#64748B]">Loading leads...</p>
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
          <h3 className="text-lg font-semibold text-[#1E293B] mb-2">Failed to load leads</h3>
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
          <h1 className="text-xl md:text-2xl font-bold text-[#1E293B]">Leads</h1>
          <p className="text-[#64748B] mt-1 text-sm md:text-base">Import, organize, and enrich your prospects</p>
        </div>
        <button
          onClick={() => setShowImportModal(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#FF6B35] text-white font-medium rounded-lg hover:bg-[#E85A2A] transition-colors w-full sm:w-auto shadow-[0_2px_8px_rgba(255,107,53,0.25)]"
        >
          <PlusIcon />
          Add Leads
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 md:gap-4">
        <div className="flex-1 relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search lists or leads..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[#E2E8F0] bg-white focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35] transition-all"
          />
        </div>
        <div className="flex gap-2 md:gap-4 overflow-x-auto">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as 'all' | 'enriched' | 'not_enriched')}
            className="px-3 md:px-4 py-2.5 rounded-lg border border-[#E2E8F0] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35] min-w-[120px]"
          >
            <option value="all">All Lists</option>
            <option value="enriched">Enriched</option>
            <option value="not_enriched">Not Enriched</option>
          </select>
          <select
            className="px-3 md:px-4 py-2.5 rounded-lg border border-[#E2E8F0] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35] min-w-[140px]"
          >
            <option value="">Campaign Status</option>
            <option value="in_campaign">In Campaign</option>
            <option value="not_in_campaign">Not in Campaign</option>
          </select>
        </div>
      </div>

      {/* Content */}
      {lists.length === 0 && !selectedListId ? (
        <EmptyState onImport={() => setShowImportModal(true)} />
      ) : selectedListId && selectedList ? (
        <LeadListDetail
          list={selectedList}
          leads={leads}
          isLoading={leadsLoading}
          onBack={() => setSelectedListId(null)}
        />
      ) : (
        <LeadListsGrid
          lists={lists}
          onSelectList={setSelectedListId}
          onEditList={setEditingList}
          onDeleteList={setDeletingList}
        />
      )}

      {/* Edit List Modal */}
      {editingList && (
        <EditListModal
          list={editingList}
          onClose={() => setEditingList(null)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingList && (
        <DeleteListModal
          list={deletingList}
          onClose={() => setDeletingList(null)}
          onDeleted={() => {
            setDeletingList(null)
            if (selectedListId === deletingList.id) {
              setSelectedListId(null)
            }
          }}
        />
      )}

      {/* Import Modal */}
      <AnimatePresence>
        {showImportModal && (
          <ImportLeadsModal
            onClose={() => setShowImportModal(false)}
            onSuccess={() => {
              refetchLists()
              setShowImportModal(false)
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function EmptyState({ onImport }: { onImport: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl border border-[#E2E8F0] p-8 md:p-12"
    >
      <div className="max-w-lg mx-auto text-center">
        {/* Illustration */}
        <div className="w-40 h-40 mx-auto mb-8 relative">
          <div className="absolute inset-0 bg-gradient-to-br from-[#FFF7ED] to-[#FFEDD5] rounded-full" />
          <div className="absolute inset-6 bg-white rounded-full shadow-inner" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 bg-white rounded-2xl shadow-lg flex items-center justify-center border border-[#E2E8F0]">
              <ListIcon className="w-8 h-8 text-[#FF6B35]" />
            </div>
          </div>
          <motion.div
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute -right-2 top-4 w-10 h-10 bg-gradient-to-br from-[#14B8A6] to-[#0D9488] rounded-xl flex items-center justify-center shadow-lg"
          >
            <EnrichIcon className="w-5 h-5 text-white" />
          </motion.div>
          <motion.div
            animate={{ y: [0, 5, 0] }}
            transition={{ duration: 2.5, repeat: Infinity }}
            className="absolute -left-2 bottom-6 w-8 h-8 bg-[#0A66C2] rounded-lg flex items-center justify-center shadow-lg"
          >
            <LinkedInSmallIcon className="w-4 h-4 text-white" />
          </motion.div>
        </div>

        <h2 className="text-2xl font-bold text-[#1E293B] mb-3">No lead lists yet</h2>
        <p className="text-[#64748B] mb-8 text-lg">
          Import prospects from LinkedIn, Sales Navigator, CSV, or paste URLs. We'll automatically find verified business emails.
        </p>

        <button
          onClick={onImport}
          className="inline-flex items-center gap-2 px-8 py-4 bg-[#FF6B35] text-white font-semibold rounded-xl hover:bg-[#E85A2A] transition-all shadow-[0_4px_14px_rgba(255,107,53,0.35)] hover:shadow-[0_6px_20px_rgba(255,107,53,0.4)] hover:-translate-y-0.5"
        >
          <PlusIcon className="w-5 h-5" />
          Import Your First Leads
        </button>

        {/* Import options preview */}
        <div className="mt-10 grid grid-cols-3 gap-3">
          {[
            { icon: <LinkedInSmallIcon className="w-4 h-4 text-[#0A66C2]" />, label: 'LinkedIn', bg: '#EFF6FF' },
            { icon: <SalesNavIcon className="w-4 h-4 text-[#0A66C2]" />, label: 'Sales Nav', bg: '#EFF6FF' },
            { icon: <CSVIcon className="w-4 h-4 text-[#22C55E]" />, label: 'CSV Upload', bg: '#F0FDF4' },
          ].map((item, i) => (
            <div key={i} className="p-3 rounded-lg" style={{ backgroundColor: item.bg }}>
              <div className="flex justify-center mb-2">{item.icon}</div>
              <p className="text-xs font-medium text-[#1E293B]">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

function LeadListsGrid({
  lists,
  onSelectList,
  onEditList,
  onDeleteList,
}: {
  lists: LeadList[]
  onSelectList: (id: string) => void
  onEditList: (list: LeadList) => void
  onDeleteList: (list: LeadList) => void
}) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {lists.map((list, index) => (
        <motion.div
          key={list.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className="bg-white rounded-xl border border-[#E2E8F0] p-5 text-left hover:border-[#FF6B35]/30 hover:shadow-md transition-all group relative"
        >
          <div className="flex items-start justify-between mb-4">
            <button
              onClick={() => onSelectList(list.id)}
              className="w-10 h-10 rounded-lg bg-[#FFF7ED] flex items-center justify-center"
            >
              <ListIcon className="w-5 h-5 text-[#FF6B35]" />
            </button>
            <div className="relative" ref={openMenuId === list.id ? menuRef : undefined}>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setOpenMenuId(openMenuId === list.id ? null : list.id)
                }}
                className="p-1.5 rounded-lg hover:bg-[#F1F5F9] transition-colors opacity-0 group-hover:opacity-100"
              >
                <MoreIcon className="w-4 h-4 text-[#64748B]" />
              </button>
              {openMenuId === list.id && (
                <div className="absolute right-0 top-8 w-36 bg-white rounded-lg border border-[#E2E8F0] shadow-lg py-1 z-10">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setOpenMenuId(null)
                      onEditList(list)
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-[#1E293B] hover:bg-[#F8FAFC] flex items-center gap-2"
                  >
                    <EditIcon className="w-4 h-4 text-[#64748B]" />
                    Rename
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setOpenMenuId(null)
                      onDeleteList(list)
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-[#EF4444] hover:bg-[#FEF2F2] flex items-center gap-2"
                  >
                    <TrashIcon className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>
          <button
            onClick={() => onSelectList(list.id)}
            className="text-left w-full"
          >
            <h3 className="font-semibold text-[#1E293B] mb-1 group-hover:text-[#FF6B35] transition-colors">
              {list.name}
            </h3>
            <div className="flex items-center gap-4 text-sm text-[#64748B]">
              <span>{list.lead_count} leads</span>
              <span className="flex items-center gap-1">
                <EnrichIcon className="w-3.5 h-3.5 text-[#14B8A6]" />
                {list.enriched_count} enriched
              </span>
            </div>
            <div className="flex items-center justify-between mt-3">
              {list.source && (
                <span className="text-xs text-[#94A3B8] px-2 py-0.5 bg-[#F8FAFC] rounded">{list.source}</span>
              )}
              <span className="text-xs text-[#94A3B8]">{formatDate(list.created_at)}</span>
            </div>
          </button>
        </motion.div>
      ))}
    </div>
  )
}

function LeadListDetail({
  list,
  leads,
  isLoading,
  onBack
}: {
  list: LeadList
  leads: Lead[]
  isLoading: boolean
  onBack: () => void
}) {
  const [selectedLeads, setSelectedLeads] = useState<string[]>([])
  const enrichmentPercent = list.lead_count > 0 ? Math.round((list.enriched_count / list.lead_count) * 100) : 0

  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <button onClick={onBack} className="text-[#64748B] hover:text-[#1E293B] transition-colors flex items-center gap-1">
          <BackIcon className="w-4 h-4" />
          All Lists
        </button>
        <ChevronRightIcon className="w-4 h-4 text-[#94A3B8]" />
        <span className="text-[#1E293B] font-medium">{list.name}</span>
      </div>

      {/* List Header */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#FFF7ED] flex items-center justify-center">
              <ListIcon className="w-6 h-6 text-[#FF6B35]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#1E293B]">{list.name}</h2>
              <div className="flex items-center gap-4 text-sm text-[#64748B] mt-1">
                <span>{list.lead_count} leads</span>
                <span className="flex items-center gap-1">
                  <EnrichIcon className="w-3.5 h-3.5 text-[#14B8A6]" />
                  {list.enriched_count} emails found
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <button className="px-4 py-2 border border-[#E2E8F0] rounded-lg text-sm font-medium text-[#64748B] hover:bg-[#F8FAFC] transition-colors">
              Export
            </button>
            <button className="px-4 py-2 border border-[#E2E8F0] rounded-lg text-sm font-medium text-[#14B8A6] hover:bg-[#F0FDFA] transition-colors flex items-center gap-2">
              <EnrichIcon className="w-4 h-4" />
              Enrich All
            </button>
            <Link
              to="/dashboard/campaigns"
              className="px-4 py-2 bg-[#FF6B35] text-white rounded-lg text-sm font-medium hover:bg-[#E85A2A] transition-colors flex items-center gap-2"
            >
              <CampaignIcon className="w-4 h-4" />
              Add to Campaign
            </Link>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-6 pt-6 border-t border-[#E2E8F0]">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-[#64748B]">Email enrichment progress</span>
            <span className="font-medium text-[#1E293B]">{enrichmentPercent}%</span>
          </div>
          <div className="h-2 bg-[#E2E8F0] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#14B8A6] to-[#0D9488] rounded-full transition-all"
              style={{ width: `${enrichmentPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Leads Table */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedLeads.length === leads.length && leads.length > 0}
                    onChange={(e) => setSelectedLeads(e.target.checked ? leads.map(l => l.id) : [])}
                    className="rounded border-[#E2E8F0] text-[#FF6B35] focus:ring-[#FF6B35]"
                  />
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wider">Lead</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wider">Company</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wider">Location</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wider">Email</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wider">Status</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-[#64748B]">
                    <div className="flex items-center justify-center gap-2">
                      <LoadingSpinner />
                      <span>Loading leads...</span>
                    </div>
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-[#64748B]">
                    No leads in this list yet
                  </td>
                </tr>
              ) : (
                leads.map((lead) => (
                  <LeadRow
                    key={lead.id}
                    lead={lead}
                    selected={selectedLeads.includes(lead.id)}
                    onSelect={(selected) => {
                      if (selected) {
                        setSelectedLeads([...selectedLeads, lead.id])
                      } else {
                        setSelectedLeads(selectedLeads.filter(id => id !== lead.id))
                      }
                    }}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function LeadRow({
  lead,
  selected,
  onSelect
}: {
  lead: Lead
  selected: boolean
  onSelect: (selected: boolean) => void
}) {
  const statusColors: Record<string, { bg: string; text: string; label: string }> = {
    new: { bg: 'bg-[#F8FAFC]', text: 'text-[#64748B]', label: 'New' },
    contacted: { bg: 'bg-[#FFF7ED]', text: 'text-[#FF6B35]', label: 'Contacted' },
    accepted: { bg: 'bg-[#EFF6FF]', text: 'text-[#3B82F6]', label: 'Accepted' },
    replied: { bg: 'bg-[#F0FDF4]', text: 'text-[#22C55E]', label: 'Replied' },
    qualified: { bg: 'bg-[#F0FDFA]', text: 'text-[#14B8A6]', label: 'Qualified' },
    not_interested: { bg: 'bg-[#FEF2F2]', text: 'text-[#EF4444]', label: 'Not Interested' },
  }

  const status = statusColors[lead.status] || statusColors.new

  return (
    <tr className="hover:bg-[#F8FAFC] transition-colors">
      <td className="px-6 py-4">
        <input
          type="checkbox"
          checked={selected}
          onChange={(e) => onSelect(e.target.checked)}
          className="rounded border-[#E2E8F0] text-[#FF6B35] focus:ring-[#FF6B35]"
        />
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          {lead.avatar_url ? (
            <img
              src={lead.avatar_url}
              alt=""
              className="w-9 h-9 rounded-full object-cover"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#FF6B35] to-[#14B8A6] flex items-center justify-center text-white text-sm font-medium">
              {[lead.first_name, lead.last_name].filter(Boolean).map((n) => n?.[0] || '').join('') || '?'}
            </div>
          )}
          <div>
            <p className="font-medium text-[#1E293B]">{[lead.first_name, lead.last_name].filter(Boolean).join(' ') || 'Unknown'}</p>
            <p className="text-sm text-[#64748B] truncate max-w-[200px]" title={lead.headline || lead.title || undefined}>
              {lead.headline || lead.title}
            </p>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 text-[#1E293B]">{lead.company || '-'}</td>
      <td className="px-6 py-4 text-[#64748B]">{lead.location || '-'}</td>
      <td className="px-6 py-4">
        {lead.email ? (
          <span className="text-[#1E293B]">{lead.email}</span>
        ) : (
          <span className="text-[#94A3B8] italic">Not found</span>
        )}
      </td>
      <td className="px-6 py-4">
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${status.bg} ${status.text}`}>
          {status.label}
        </span>
      </td>
      <td className="px-6 py-4 text-right">
        <div className="flex items-center justify-end gap-2">
          {lead.linkedin_url && (
            <a
              href={lead.linkedin_url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg hover:bg-[#EFF6FF] text-[#0A66C2] transition-colors"
            >
              <LinkedInSmallIcon />
            </a>
          )}
          <button className="p-2 rounded-lg hover:bg-[#F8FAFC] text-[#64748B] transition-colors">
            <MoreIcon />
          </button>
        </div>
      </td>
    </tr>
  )
}

// Main Import Modal with all methods
function ImportLeadsModal({
  onClose,
  onSuccess
}: {
  onClose: () => void
  onSuccess: () => void
}) {
  const [selectedMethod, setSelectedMethod] = useState<ImportMethod | null>(null)
  const [step, setStep] = useState<'method' | 'configure' | 'processing' | 'complete'>('method')
  const [listName, setListName] = useState('')
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null)
  const [importResult, setImportResult] = useState<{ created: number; skipped: number } | null>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const [currentJobId, setCurrentJobId] = useState<string | null>(null)

  // Hooks
  const importCSVMutation = useImportLeadsFromCSV()
  const startImportMutation = useStartImport()
  const cancelImportMutation = useCancelImport()
  const { data: linkedInAccounts, isLoading: accountsLoading } = useLinkedInAccounts()

  // Poll for import job status
  const { data: jobStatus } = useImportJobStatus(
    currentJobId || '',
    !!currentJobId && step === 'processing',
    2000 // Poll every 2 seconds
  )

  // Handle job completion
  useEffect(() => {
    if (jobStatus && currentJobId) {
      if (jobStatus.status === 'completed') {
        setImportResult({
          created: jobStatus.created_count,
          skipped: jobStatus.skipped_count,
        })
        setStep('complete')
        setCurrentJobId(null)
      } else if (jobStatus.status === 'failed') {
        setImportError(jobStatus.error_message || 'Import failed')
        setStep('configure')
        setCurrentJobId(null)
      } else if (jobStatus.status === 'cancelled') {
        setImportError('Import was cancelled')
        setStep('configure')
        setCurrentJobId(null)
      }
    }
  }, [jobStatus, currentJobId])

  // Set default account when accounts load
  useEffect(() => {
    if (linkedInAccounts && linkedInAccounts.length > 0 && !selectedAccountId) {
      const connectedAccount = linkedInAccounts.find(a => a.status === 'connected')
      if (connectedAccount) {
        setSelectedAccountId(connectedAccount.id)
      }
    }
  }, [linkedInAccounts, selectedAccountId])

  const handleBack = () => {
    if (step === 'configure') {
      setSelectedMethod(null)
      setStep('method')
    }
  }

  const handleCSVImport = async (file: File) => {
    if (!listName.trim()) {
      setImportError('Please enter a list name')
      return
    }

    setStep('processing')
    setImportError(null)

    try {
      const result = await importCSVMutation.mutateAsync({
        file,
        list_name: listName.trim(),
      })
      setImportResult(result)
      setStep('complete')
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'Import failed')
      setStep('configure')
    }
  }

  // For LinkedIn-based imports (starts background job)
  const handleLinkedInImport = async (sourceUrl: string, sourceData?: string[]) => {
    if (!listName.trim()) {
      setImportError('Please enter a list name')
      return
    }

    if (!sourceUrl?.trim() && (!sourceData || sourceData.length === 0)) {
      setImportError('Please enter a URL or data')
      return
    }

    if (!selectedAccountId) {
      setImportError('Please select a LinkedIn account')
      return
    }

    setStep('processing')
    setImportError(null)

    try {
      const result = await startImportMutation.mutateAsync({
        list_name: listName.trim(),
        import_type: selectedMethod as ImportType,
        linkedin_account_id: selectedAccountId,
        source_url: sourceUrl || undefined,
        source_data: sourceData,
      })
      setCurrentJobId(result.job_id)
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'Failed to start import')
      setStep('configure')
    }
  }

  const handleCancelImport = async () => {
    if (currentJobId) {
      try {
        await cancelImportMutation.mutateAsync(currentJobId)
      } catch (error) {
        // Ignore errors
      }
    }
    setStep('configure')
    setCurrentJobId(null)
  }

  const handleFinish = () => {
    onSuccess()
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
        className={`bg-white rounded-2xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh] ${
          step === 'method' ? 'max-w-4xl' : 'max-w-2xl'
        }`}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            {step !== 'method' && step !== 'processing' && step !== 'complete' && (
              <button onClick={handleBack} className="p-2 rounded-lg hover:bg-[#F8FAFC] -ml-2">
                <BackIcon className="w-5 h-5 text-[#64748B]" />
              </button>
            )}
            <div>
              <h2 className="text-lg font-bold text-[#1E293B]">
                {step === 'method' ? 'Add Leads' :
                 step === 'configure' ? IMPORT_METHODS.find(m => m.id === selectedMethod)?.title :
                 step === 'processing' ? 'Importing...' : 'Import Complete'}
              </h2>
              {step === 'method' && (
                <p className="text-sm text-[#64748B]">Choose how you'd like to import leads</p>
              )}
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-[#F8FAFC]">
            <CloseIcon />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            {step === 'method' && (
              <motion.div
                key="method"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-6"
              >
                {/* Layout: Methods on left, Preview on right */}
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Import Methods List */}
                  <div className="lg:w-[360px] flex-shrink-0">
                    <p className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-3 px-1">
                      Import Methods
                    </p>
                    <div className="space-y-2">
                      {IMPORT_METHODS.map((method) => (
                        <button
                          key={method.id}
                          onClick={() => {
                            if (!method.comingSoon) {
                              setSelectedMethod(method.id)
                              setStep('configure')
                            }
                          }}
                          disabled={method.comingSoon}
                          className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left group ${
                            method.comingSoon
                              ? 'border-[#E2E8F0] bg-[#F8FAFC] opacity-60 cursor-not-allowed'
                              : selectedMethod === method.id
                              ? 'border-[#FF6B35] bg-[#FFF7ED]'
                              : 'border-[#E2E8F0] hover:border-[#FF6B35]/30 hover:bg-[#F8FAFC]'
                          }`}
                        >
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform ${!method.comingSoon ? 'group-hover:scale-110' : ''}`}
                            style={{ backgroundColor: `${method.color}15` }}
                          >
                            <div style={{ color: method.color }}>{method.icon}</div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-[#1E293B] text-sm">{method.title}</p>
                              {method.comingSoon && (
                                <span className="px-1.5 py-0.5 text-[10px] font-medium bg-[#64748B] text-white rounded">
                                  Coming Soon
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-[#64748B] truncate">{method.description}</p>
                          </div>
                          {!method.comingSoon && (
                            <ChevronRightIcon className="w-4 h-4 text-[#94A3B8] flex-shrink-0 group-hover:text-[#FF6B35]" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Preview/Info Panel */}
                  <div className="flex-1 bg-[#F8FAFC] rounded-xl p-6 hidden lg:block">
                    <div className="h-full flex flex-col items-center justify-center text-center">
                      <div className="w-20 h-20 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4 border border-[#E2E8F0]">
                        <ImportIcon className="w-10 h-10 text-[#FF6B35]" />
                      </div>
                      <h3 className="text-lg font-semibold text-[#1E293B] mb-2">
                        Select an import method
                      </h3>
                      <p className="text-sm text-[#64748B] max-w-xs">
                        Choose from LinkedIn sources, upload a CSV file, or paste profile URLs directly to import your leads.
                      </p>

                      {/* Features preview */}
                      <div className="mt-8 w-full max-w-xs">
                        <div className="flex items-center gap-3 text-left p-3 bg-white rounded-lg border border-[#E2E8F0] mb-2">
                          <div className="w-8 h-8 rounded-lg bg-[#F0FDFA] flex items-center justify-center">
                            <EnrichIcon className="w-4 h-4 text-[#14B8A6]" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-[#1E293B]">Auto Email Enrichment</p>
                            <p className="text-xs text-[#64748B]">We find verified emails automatically</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-left p-3 bg-white rounded-lg border border-[#E2E8F0]">
                          <div className="w-8 h-8 rounded-lg bg-[#EFF6FF] flex items-center justify-center">
                            <SparkleIcon className="w-4 h-4 text-[#3B82F6]" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-[#1E293B]">Duplicate Detection</p>
                            <p className="text-xs text-[#64748B]">We skip leads you already have</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 'configure' && selectedMethod && (
              <motion.div
                key="configure"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <ImportMethodConfig
                  method={selectedMethod}
                  listName={listName}
                  setListName={setListName}
                  onCSVImport={handleCSVImport}
                  onLinkedInImport={handleLinkedInImport}
                  importError={importError}
                  linkedInAccounts={linkedInAccounts || []}
                  accountsLoading={accountsLoading}
                  selectedAccountId={selectedAccountId}
                  setSelectedAccountId={setSelectedAccountId}
                />
              </motion.div>
            )}

            {step === 'processing' && (
              <motion.div
                key="processing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-12 text-center"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  className="w-16 h-16 mx-auto mb-6 border-4 border-[#E2E8F0] border-t-[#FF6B35] rounded-full"
                />
                <h3 className="text-lg font-semibold text-[#1E293B] mb-2">Importing your leads...</h3>
                <p className="text-[#64748B] mb-4">This may take a moment depending on list size.</p>

                {/* Progress info */}
                {jobStatus && (
                  <div className="max-w-xs mx-auto">
                    {/* Progress bar */}
                    <div className="h-2 bg-[#E2E8F0] rounded-full overflow-hidden mb-3">
                      <motion.div
                        className="h-full bg-gradient-to-r from-[#FF6B35] to-[#E85A2A] rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${jobStatus.progress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                    <div className="flex justify-between text-sm text-[#64748B]">
                      <span>{jobStatus.processed_count} processed</span>
                      <span>{Math.round(jobStatus.progress)}%</span>
                    </div>
                    <div className="mt-2 text-sm">
                      <span className="text-[#22C55E]">{jobStatus.created_count} created</span>
                      {jobStatus.skipped_count > 0 && (
                        <span className="text-[#94A3B8] ml-3">{jobStatus.skipped_count} skipped</span>
                      )}
                    </div>
                  </div>
                )}

                {/* Cancel button */}
                <button
                  onClick={handleCancelImport}
                  className="mt-6 px-4 py-2 text-sm text-[#64748B] hover:text-[#EF4444] transition-colors"
                >
                  Cancel Import
                </button>
              </motion.div>
            )}

            {step === 'complete' && (
              <motion.div
                key="complete"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-12 text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200 }}
                  className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-[#F0FDF4] to-[#DCFCE7] rounded-full flex items-center justify-center"
                >
                  <CheckCircleIcon className="w-10 h-10 text-[#22C55E]" />
                </motion.div>
                <h3 className="text-xl font-bold text-[#1E293B] mb-2">Import Complete!</h3>
                <p className="text-[#64748B] mb-2">
                  {importResult?.created || 0} leads imported successfully.
                  {importResult?.skipped ? ` ${importResult.skipped} duplicates skipped.` : ''}
                </p>
                <p className="text-sm text-[#14B8A6] mb-8">Email enrichment is starting in the background.</p>
                <button
                  onClick={handleFinish}
                  className="px-8 py-3 bg-[#FF6B35] text-white font-semibold rounded-xl hover:bg-[#E85A2A] transition-all"
                >
                  View Your Leads
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  )
}

// Import method configuration panels
function ImportMethodConfig({
  method,
  listName,
  setListName,
  onCSVImport,
  onLinkedInImport,
  importError,
  linkedInAccounts,
  accountsLoading,
  selectedAccountId,
  setSelectedAccountId,
}: {
  method: ImportMethod
  listName: string
  setListName: (name: string) => void
  onCSVImport: (file: File) => void
  onLinkedInImport: (sourceUrl: string, sourceData?: string[]) => void
  importError?: string | null
  linkedInAccounts: LinkedInAccount[]
  accountsLoading: boolean
  selectedAccountId: string | null
  setSelectedAccountId: (id: string | null) => void
}) {
  const [pastedUrls, setPastedUrls] = useState('')
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [searchUrl, setSearchUrl] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const methodInfo = IMPORT_METHODS.find(m => m.id === method)!
  const connectedAccounts = linkedInAccounts.filter(a => a.status === 'connected')

  // CSV import
  if (method === 'csv') {
    return (
      <div className="p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-[#1E293B] mb-2">List Name</label>
          <input
            type="text"
            value={listName}
            onChange={(e) => setListName(e.target.value)}
            placeholder="e.g., Q1 Tech Leaders"
            className="w-full px-4 py-3 rounded-xl border border-[#E2E8F0] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#1E293B] mb-2">CSV File</label>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
            className="hidden"
          />
          {csvFile ? (
            <div className="flex items-center gap-3 p-4 bg-[#F0FDF4] border border-[#22C55E]/20 rounded-xl">
              <div className="w-10 h-10 rounded-lg bg-[#22C55E]/10 flex items-center justify-center">
                <CSVIcon className="w-5 h-5 text-[#22C55E]" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-[#1E293B]">{csvFile.name}</p>
                <p className="text-sm text-[#64748B]">{Math.round(csvFile.size / 1024)} KB</p>
              </div>
              <button onClick={() => setCsvFile(null)} className="p-2 rounded-lg hover:bg-[#22C55E]/10">
                <CloseIcon />
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full p-8 border-2 border-dashed border-[#E2E8F0] rounded-xl hover:border-[#FF6B35]/50 hover:bg-[#FFF7ED]/50 transition-colors"
            >
              <UploadIcon className="w-10 h-10 text-[#94A3B8] mx-auto mb-3" />
              <p className="font-medium text-[#1E293B]">Click to upload or drag and drop</p>
              <p className="text-sm text-[#64748B] mt-1">CSV files up to 10MB</p>
            </button>
          )}
        </div>

        <div className="bg-[#F8FAFC] rounded-xl p-4">
          <p className="text-sm font-medium text-[#1E293B] mb-2">Required columns:</p>
          <div className="flex flex-wrap gap-2">
            <span className="px-2 py-1 bg-white rounded text-xs text-[#64748B] border">linkedin_url</span>
            <span className="text-xs text-[#94A3B8]">or</span>
            <span className="px-2 py-1 bg-white rounded text-xs text-[#64748B] border">first_name</span>
            <span className="px-2 py-1 bg-white rounded text-xs text-[#64748B] border">last_name</span>
            <span className="px-2 py-1 bg-white rounded text-xs text-[#64748B] border">company</span>
          </div>
        </div>

        {importError && (
          <div className="p-3 bg-[#FEF2F2] border border-[#EF4444]/20 rounded-xl text-sm text-[#EF4444]">
            {importError}
          </div>
        )}

        <button
          onClick={() => csvFile && onCSVImport(csvFile)}
          disabled={!csvFile || !listName.trim()}
          className="w-full py-3.5 bg-[#FF6B35] text-white font-semibold rounded-xl hover:bg-[#E85A2A] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Import Leads
        </button>
      </div>
    )
  }

  // Paste URLs
  if (method === 'paste_urls') {
    const urlList = pastedUrls.split('\n').map(u => u.trim()).filter(u => u)

    return (
      <div className="p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-[#1E293B] mb-2">List Name</label>
          <input
            type="text"
            value={listName}
            onChange={(e) => setListName(e.target.value)}
            placeholder="e.g., Q1 Tech Leaders"
            className="w-full px-4 py-3 rounded-xl border border-[#E2E8F0] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35]"
          />
        </div>

        {/* LinkedIn Account Selector */}
        <LinkedInAccountSelector
          accounts={connectedAccounts}
          loading={accountsLoading}
          selectedId={selectedAccountId}
          onSelect={setSelectedAccountId}
        />

        <div>
          <label className="block text-sm font-medium text-[#1E293B] mb-2">LinkedIn Profile URLs</label>
          <textarea
            value={pastedUrls}
            onChange={(e) => setPastedUrls(e.target.value)}
            placeholder="https://linkedin.com/in/johndoe&#10;https://linkedin.com/in/janedoe&#10;..."
            rows={8}
            className="w-full px-4 py-3 rounded-xl border border-[#E2E8F0] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35] resize-none font-mono text-sm"
          />
          <p className="text-xs text-[#64748B] mt-2">
            {urlList.length} URLs detected
          </p>
        </div>

        {importError && (
          <div className="p-3 bg-[#FEF2F2] border border-[#EF4444]/20 rounded-xl text-sm text-[#EF4444]">
            {importError}
          </div>
        )}

        <button
          onClick={() => onLinkedInImport('', urlList)}
          disabled={urlList.length === 0 || !listName || !selectedAccountId}
          className="w-full py-3.5 bg-[#FF6B35] text-white font-semibold rounded-xl hover:bg-[#E85A2A] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Import Leads
        </button>
      </div>
    )
  }

  // LinkedIn/Sales Navigator based imports
  return (
    <div className="p-6 space-y-5">
      {/* Method header */}
      <div className="flex items-center gap-4 pb-4 border-b border-[#E2E8F0]">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${methodInfo.color}15` }}
        >
          <div style={{ color: methodInfo.color }}>{methodInfo.icon}</div>
        </div>
        <div>
          <h3 className="font-semibold text-[#1E293B]">{methodInfo.title}</h3>
          <p className="text-sm text-[#64748B]">{methodInfo.description}</p>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-[#1E293B] mb-2">List Name</label>
        <input
          type="text"
          value={listName}
          onChange={(e) => setListName(e.target.value)}
          placeholder="e.g., Q1 Tech Leaders"
          className="w-full px-4 py-3 rounded-xl border border-[#E2E8F0] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35]"
        />
      </div>

      {/* LinkedIn Account Selector */}
      <LinkedInAccountSelector
        accounts={connectedAccounts}
        loading={accountsLoading}
        selectedId={selectedAccountId}
        onSelect={setSelectedAccountId}
      />

      <div>
        <label className="block text-sm font-medium text-[#1E293B] mb-2">
          {method === 'linkedin_search' && 'LinkedIn Search URL'}
          {method === 'sales_nav_leads' && 'Sales Navigator Lead Search URL'}
          {method === 'sales_nav_accounts' && 'Sales Navigator Account Search URL'}
          {method === 'linkedin_recruiter' && 'LinkedIn Recruiter Search URL'}
          {method === 'linkedin_events' && 'LinkedIn Event URL'}
          {method === 'linkedin_post_reactors' && 'LinkedIn Post URL'}
          {method === 'linkedin_companies' && 'LinkedIn Company Page URL'}
        </label>
        <input
          type="url"
          value={searchUrl}
          onChange={(e) => setSearchUrl(e.target.value)}
          placeholder={
            method === 'linkedin_search' ? 'https://linkedin.com/search/results/people/...' :
            method === 'sales_nav_leads' ? 'https://linkedin.com/sales/search/people/...' :
            method === 'sales_nav_accounts' ? 'https://linkedin.com/sales/search/company/...' :
            method === 'linkedin_recruiter' ? 'https://linkedin.com/recruiter/...' :
            method === 'linkedin_events' ? 'https://linkedin.com/events/...' :
            method === 'linkedin_post_reactors' ? 'https://linkedin.com/posts/...' :
            'https://linkedin.com/company/...'
          }
          className="w-full px-4 py-3 rounded-xl border border-[#E2E8F0] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35]"
        />
      </div>

      {/* How it works section */}
      <div className="bg-[#F8FAFC] rounded-xl p-4">
        <p className="text-sm font-medium text-[#1E293B] mb-3">How it works:</p>
        <ol className="space-y-2 text-sm text-[#64748B]">
          <li className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-[#FF6B35] text-white text-xs flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
            <span>
              {method === 'linkedin_search' && 'Perform your search on LinkedIn and copy the URL'}
              {method === 'sales_nav_leads' && 'Create or open a lead search in Sales Navigator'}
              {method === 'sales_nav_accounts' && 'Create or open an account search in Sales Navigator'}
              {method === 'linkedin_recruiter' && 'Open your candidate search in Recruiter'}
              {method === 'linkedin_events' && 'Go to the LinkedIn event page and copy the URL'}
              {method === 'linkedin_post_reactors' && 'Find the post and copy its URL'}
              {method === 'linkedin_companies' && 'Go to the company page and copy the URL'}
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-[#FF6B35] text-white text-xs flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
            <span>Paste the URL above and give your list a name</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-[#FF6B35] text-white text-xs flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
            <span>We'll extract all profiles and automatically enrich them with verified emails</span>
          </li>
        </ol>
      </div>

      {importError && (
        <div className="p-3 bg-[#FEF2F2] border border-[#EF4444]/20 rounded-xl text-sm text-[#EF4444]">
          {importError}
        </div>
      )}

      <button
        onClick={() => onLinkedInImport(searchUrl)}
        disabled={!searchUrl || !listName || !selectedAccountId}
        className="w-full py-3.5 bg-[#FF6B35] text-white font-semibold rounded-xl hover:bg-[#E85A2A] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        Import Leads
      </button>
    </div>
  )
}

// LinkedIn Account Selector Component
function LinkedInAccountSelector({
  accounts,
  loading,
  selectedId,
  onSelect,
}: {
  accounts: LinkedInAccount[]
  loading: boolean
  selectedId: string | null
  onSelect: (id: string | null) => void
}) {
  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 w-32 bg-[#E2E8F0] rounded mb-2" />
        <div className="h-12 bg-[#E2E8F0] rounded-xl" />
      </div>
    )
  }

  if (accounts.length === 0) {
    return (
      <div className="p-4 bg-[#FEF3C7] border border-[#F59E0B]/20 rounded-xl">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#F59E0B]/10 flex items-center justify-center flex-shrink-0">
            <AlertIcon className="w-4 h-4 text-[#F59E0B]" />
          </div>
          <div>
            <p className="font-medium text-[#92400E]">No LinkedIn accounts connected</p>
            <p className="text-sm text-[#B45309] mt-1">
              Connect a LinkedIn account in Settings to import leads from LinkedIn.
            </p>
            <Link
              to="/dashboard/settings"
              className="inline-flex items-center gap-1 text-sm font-medium text-[#F59E0B] hover:text-[#D97706] mt-2"
            >
              Go to Settings
              <ChevronRightIcon className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <label className="block text-sm font-medium text-[#1E293B] mb-2">
        LinkedIn Account
      </label>
      <div className="space-y-2">
        {accounts.map((account) => (
          <button
            key={account.id}
            onClick={() => onSelect(account.id)}
            className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
              selectedId === account.id
                ? 'border-[#0A66C2] bg-[#EFF6FF]'
                : 'border-[#E2E8F0] hover:border-[#0A66C2]/30'
            }`}
          >
            {account.avatar_url ? (
              <img
                src={account.avatar_url}
                alt=""
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-[#0A66C2] flex items-center justify-center text-white font-medium">
                {account.name?.[0] || 'L'}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-[#1E293B] truncate">{account.name || 'LinkedIn Account'}</p>
              <p className="text-xs text-[#64748B] capitalize">{account.subscription_type}</p>
            </div>
            {selectedId === account.id && (
              <div className="w-5 h-5 rounded-full bg-[#0A66C2] flex items-center justify-center">
                <CheckIcon className="w-3 h-3 text-white" />
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

// Edit List Modal
function EditListModal({ list, onClose }: { list: LeadList; onClose: () => void }) {
  const [name, setName] = useState(list.name)
  const [error, setError] = useState('')
  const updateListMutation = useUpdateLeadList()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!name.trim()) {
      setError('List name is required')
      return
    }

    try {
      await updateListMutation.mutateAsync({ listId: list.id, name: name.trim() })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update list')
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-xl shadow-xl w-full max-w-md"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6">
            <h2 className="text-xl font-bold text-[#1E293B] mb-4">Rename List</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-[#1E293B] mb-1">
                  List Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35]"
                  placeholder="Enter list name"
                  autoFocus
                />
                {error && <p className="text-sm text-[#EF4444] mt-1">{error}</p>}
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-[#64748B] hover:text-[#1E293B] font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateListMutation.isPending}
                  className="px-4 py-2 bg-[#FF6B35] text-white font-medium rounded-lg hover:bg-[#E85A2A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updateListMutation.isPending ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// Delete List Modal
function DeleteListModal({
  list,
  onClose,
  onDeleted,
}: {
  list: LeadList
  onClose: () => void
  onDeleted: () => void
}) {
  const [error, setError] = useState('')
  const deleteListMutation = useDeleteLeadList()

  const handleDelete = async () => {
    setError('')
    try {
      await deleteListMutation.mutateAsync(list.id)
      onDeleted()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete list')
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-xl shadow-xl w-full max-w-md"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6">
            <div className="w-12 h-12 rounded-full bg-[#FEF2F2] flex items-center justify-center mx-auto mb-4">
              <TrashIcon className="w-6 h-6 text-[#EF4444]" />
            </div>
            <h2 className="text-xl font-bold text-[#1E293B] text-center mb-2">Delete List</h2>
            <p className="text-[#64748B] text-center mb-6">
              Are you sure you want to delete <span className="font-semibold text-[#1E293B]">"{list.name}"</span>?
              This will remove the list but keep all {list.lead_count} leads in the system.
            </p>
            {error && <p className="text-sm text-[#EF4444] text-center mb-4">{error}</p>}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 border border-[#E2E8F0] text-[#1E293B] font-medium rounded-lg hover:bg-[#F8FAFC] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteListMutation.isPending}
                className="flex-1 px-4 py-2.5 bg-[#EF4444] text-white font-medium rounded-lg hover:bg-[#DC2626] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleteListMutation.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
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

function ListIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  )
}

function EnrichIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  )
}

function LinkedInSmallIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path d="M16.338 16.338H13.67V12.16c0-.995-.017-2.277-1.387-2.277-1.39 0-1.601 1.086-1.601 2.207v4.248H8.014v-8.59h2.559v1.174h.037c.356-.675 1.227-1.387 2.526-1.387 2.703 0 3.203 1.778 3.203 4.092v4.711zM5.005 6.575a1.548 1.548 0 11-.003-3.096 1.548 1.548 0 01.003 3.096zm-1.337 9.763H6.34v-8.59H3.667v8.59zM17.668 1H2.328C1.595 1 1 1.581 1 2.298v15.403C1 18.418 1.595 19 2.328 19h15.34c.734 0 1.332-.582 1.332-1.299V2.298C19 1.581 18.402 1 17.668 1z" />
    </svg>
  )
}

function LinkedInSearchIcon() {
  return (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
    </svg>
  )
}

function SalesNavIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.47 2H3.53A1.45 1.45 0 002 3.38v17.24A1.45 1.45 0 003.53 22h16.94a1.45 1.45 0 001.53-1.38V3.38A1.45 1.45 0 0020.47 2zM8.09 18.74h-3v-9h3v9zm-1.5-10.28a1.75 1.75 0 110-3.5 1.75 1.75 0 010 3.5zm12.32 10.28h-3v-4.83c0-1.21-.43-2-1.52-2A1.65 1.65 0 0012.85 13a2 2 0 00-.1.73v5h-3v-9h2.88v1.24a3 3 0 012.71-1.49c2 0 3.45 1.29 3.45 4.06v5.2z"/>
      <circle cx="17" cy="7" r="3" fill="#0A66C2"/>
    </svg>
  )
}

function SalesNavAccountsIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z"/>
    </svg>
  )
}

function RecruiterIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="7" r="4"/>
      <path d="M5 21v-2a4 4 0 014-4h6a4 4 0 014 4v2"/>
      <path d="M16 3.13a4 4 0 010 7.75"/>
      <path d="M21 21v-2a4 4 0 00-3-3.85"/>
    </svg>
  )
}

function EventIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
      <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01"/>
    </svg>
  )
}

function ReactorsIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3zM7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3"/>
    </svg>
  )
}

function CompaniesIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M3 21h18"/>
      <path d="M9 21V8a1 1 0 011-1h4a1 1 0 011 1v13"/>
      <path d="M3 21V11a1 1 0 011-1h2a1 1 0 011 1v10"/>
      <path d="M17 21V5a1 1 0 011-1h2a1 1 0 011 1v16"/>
    </svg>
  )
}

function CSVIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  )
}

function PasteIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  )
}

function ImportIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
  )
}

function SparkleIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  )
}

function ChevronRightIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
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

function MoreIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
    </svg>
  )
}

function EditIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
    </svg>
  )
}

function TrashIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
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

function BackIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  )
}

function UploadIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
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

function CheckIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
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
