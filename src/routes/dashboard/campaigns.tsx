import { createFileRoute, useSearch, useNavigate } from '@tanstack/react-router';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useCallback, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  SequenceCanvas,
  StepPalette,
  NodeConfigPanel,
  type SequenceNode,
} from '@/components/campaign/SequenceCanvas';
import { CampaignProgressView } from '@/components/campaign/CampaignProgressView';
import { ImportLeadsModal } from './leads';
import {
  useCampaigns,
  useCampaign,
  useCreateCampaign,
  useUpdateCampaign,
  useDeleteCampaign,
  useStartCampaign,
  usePauseCampaign,
  useResumeCampaign,
  useCloneCampaign,
  useLeadLists,
  useLinkedInAccounts,
  useEmailAccounts,
  useLeadAvailabilityPreview,
  useSequenceTemplates,
  useSaveSequenceTemplate,
  useDeleteSequenceTemplate,
  useWorkspace,
} from '../../lib/hooks/queries';
import { useCurrentWorkspace } from '../../lib/workspace';
import type { Campaign, CampaignStatus } from '../../lib/types';
import { api } from '@/lib/api';
import {
  prepareNodesForSave,
  buildBranchRelationships,
  buildNextStepRelationships,
  reconstructBranchInfo,
  mapStepTypeToNodeType,
  mapConfigToNodeData,
  mapNodeDataToConfig,
} from '@/lib/utils/campaignStepMapper';
import {
  validateCampaignSequence,
  hasSequenceWarnings,
  hasSequenceErrors,
  type SequenceWarning,
  type ValidationContext,
} from '@/lib/utils/campaignSequenceValidator';
import { showSuccessToast, showErrorToast } from '@/lib/toast';
import { queryKeys } from '@/lib/queryClient';

type CampaignsSearch = {
  createWithList?: string;
};

export const Route = createFileRoute('/dashboard/campaigns')({
  component: CampaignsPage,
  validateSearch: (search: Record<string, unknown>): CampaignsSearch => {
    return {
      createWithList: search.createWithList as string | undefined,
    };
  },
});

function CampaignsPage() {
  const { createWithList } = useSearch({ from: '/dashboard/campaigns' });
  const navigate = useNavigate();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [preSelectedLeadListId, setPreSelectedLeadListId] = useState<string | null>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | CampaignStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Auto-open modal when coming from lead list with createWithList param
  useEffect(() => {
    if (createWithList) {
      setPreSelectedLeadListId(createWithList);
      setShowCreateModal(true);
      // Clear the search param from URL
      navigate({ to: '/dashboard/campaigns', search: {}, replace: true });
    }
  }, [createWithList, navigate]);

  // Use API hooks
  const {
    data: campaigns = [],
    isLoading,
    error,
    refetch,
  } = useCampaigns(filterStatus !== 'all' ? { status: filterStatus } : undefined);

  // Client-side search filter (status filtering is done server-side)
  const filteredCampaigns = campaigns.filter((c) => {
    if (searchQuery && !c.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <LoadingSpinner />
          <p className="text-[#64748B]">Loading campaigns...</p>
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
          <h3 className="mb-2 text-lg font-semibold text-[#1E293B]">Failed to load campaigns</h3>
          <p className="mb-4 text-[#64748B]">{error.message}</p>
          <button
            onClick={() => refetch()}
            className="rounded-lg bg-[#FF6B35] px-4 py-2 font-medium text-white transition-colors hover:bg-[#E85A2A]"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-bold text-[#1E293B] md:text-2xl">Campaigns</h1>
          <p className="mt-1 text-sm text-[#64748B] md:text-base">
            Create and manage your outreach sequences
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#FF6B35] px-4 py-2.5 font-medium text-white transition-colors hover:bg-[#E85A2A] sm:w-auto"
        >
          <PlusIcon />
          Start New Campaign
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:gap-4">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search campaigns..."
            className="w-full rounded-lg border border-[#E2E8F0] bg-white py-2.5 pl-10 pr-4 focus:border-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20"
          />
        </div>
        <div className="flex overflow-x-auto rounded-lg border border-[#E2E8F0] bg-white p-1">
          {(['all', 'active', 'paused', 'draft'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors sm:px-4 ${
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
        <EmptyState onCreate={() => setShowCreateModal(true)} filterStatus={filterStatus} />
      ) : (
        <CampaignsList
          campaigns={filteredCampaigns}
          onSelect={setSelectedCampaign}
          onEdit={(campaign) => {
            setEditingCampaign(campaign);
            setShowCreateModal(true);
          }}
        />
      )}

      {/* Create Campaign Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateCampaignModal
            onClose={() => {
              setShowCreateModal(false);
              setPreSelectedLeadListId(null);
              setEditingCampaign(null);
            }}
            preSelectedLeadListId={preSelectedLeadListId}
            editingCampaign={editingCampaign}
          />
        )}
      </AnimatePresence>

      {/* Campaign Detail Drawer */}
      <AnimatePresence>
        {selectedCampaign && (
          <CampaignDetailDrawer
            campaign={selectedCampaign}
            onClose={() => setSelectedCampaign(null)}
            onEdit={(campaign) => {
              setEditingCampaign(campaign);
              setSelectedCampaign(null);
              setShowCreateModal(true);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function EmptyState({
  onCreate,
  filterStatus,
}: {
  onCreate: () => void;
  filterStatus: 'all' | CampaignStatus;
}) {
  // Show different content based on filter
  const isFiltered = filterStatus !== 'all';

  const getFilteredEmptyContent = () => {
    switch (filterStatus) {
      case 'active':
        return {
          title: 'No active campaigns',
          description:
            "You don't have any campaigns currently running. Start a draft campaign or create a new one to begin outreach.",
        };
      case 'paused':
        return {
          title: 'No paused campaigns',
          description: "You don't have any paused campaigns. Campaigns you pause will appear here.",
        };
      case 'draft':
        return {
          title: 'No draft campaigns',
          description: "You don't have any draft campaigns. Create a new campaign to get started.",
        };
      default:
        return {
          title: 'No campaigns yet',
          description:
            'Create your first multi-channel campaign. Combine LinkedIn and email touchpoints to maximize your reply rates.',
        };
    }
  };

  const content = getFilteredEmptyContent();

  // Simplified empty state for filtered views
  if (isFiltered) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-[#E2E8F0] bg-white p-12 text-center"
      >
        <div className="mx-auto max-w-md">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#F1F5F9]">
            <CampaignIcon className="h-8 w-8 text-[#94A3B8]" />
          </div>
          <h2 className="mb-2 text-xl font-bold text-[#1E293B]">{content.title}</h2>
          <p className="mb-6 text-[#64748B]">{content.description}</p>
          <button
            onClick={onCreate}
            className="inline-flex items-center gap-2 rounded-xl bg-[#FF6B35] px-6 py-3 font-semibold text-white shadow-[0_4px_14px_rgba(255,107,53,0.25)] transition-colors hover:bg-[#E85A2A]"
          >
            <PlusIcon className="h-5 w-5" />
            Create Campaign
          </button>
        </div>
      </motion.div>
    );
  }

  // Full empty state for "all" view (no campaigns at all)
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-[#E2E8F0] bg-white p-12 text-center"
    >
      <div className="mx-auto max-w-md">
        {/* Illustration */}
        <div className="relative mx-auto mb-6 h-32 w-32">
          <div className="absolute inset-0 rounded-full bg-[#FFF7ED]" />
          <div className="absolute inset-4 flex items-center justify-center rounded-full bg-[#FFEDD5]">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm">
              <CampaignIcon className="h-6 w-6 text-[#FF6B35]" />
            </div>
          </div>
          {/* Floating steps */}
          <motion.div
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute -left-4 top-1/3 flex h-8 w-8 items-center justify-center rounded-lg bg-[#0A66C2]"
          >
            <LinkedInIcon className="h-4 w-4 text-white" />
          </motion.div>
          <motion.div
            animate={{ y: [0, 5, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
            className="absolute -right-4 top-1/2 flex h-8 w-8 items-center justify-center rounded-lg bg-[#14B8A6]"
          >
            <EmailIcon className="h-4 w-4 text-white" />
          </motion.div>
        </div>

        <h2 className="mb-2 text-xl font-bold text-[#1E293B]">{content.title}</h2>
        <p className="mb-8 text-[#64748B]">{content.description}</p>

        <button
          onClick={onCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-[#FF6B35] px-6 py-3 font-semibold text-white shadow-[0_4px_14px_rgba(255,107,53,0.25)] transition-colors hover:bg-[#E85A2A]"
        >
          <PlusIcon className="h-5 w-5" />
          Create Your First Campaign
        </button>

        <div className="mt-8 rounded-xl bg-[#F8FAFC] p-4 text-left">
          <h3 className="mb-3 font-medium text-[#1E293B]">What you can do:</h3>
          <ul className="space-y-2">
            <li className="flex items-start gap-2 text-sm text-[#64748B]">
              <CheckIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#22C55E]" />
              Combine LinkedIn + Email in one sequence
            </li>
            <li className="flex items-start gap-2 text-sm text-[#64748B]">
              <CheckIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#22C55E]" />
              Use "If Connected" logic for smart routing
            </li>
            <li className="flex items-start gap-2 text-sm text-[#64748B]">
              <CheckIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#22C55E]" />
              Auto-rotate between multiple senders
            </li>
          </ul>
        </div>
      </div>
    </motion.div>
  );
}

function CampaignsList({
  campaigns,
  onSelect,
  onEdit,
}: {
  campaigns: Campaign[];
  onSelect: (campaign: Campaign) => void;
  onEdit: (campaign: Campaign) => void;
}) {
  return (
    <div className="rounded-xl border border-[#E2E8F0] bg-white">
      {/* Desktop Table */}
      <div className="hidden lg:block">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#64748B]">
                Campaign
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#64748B]">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#64748B]">
                Created
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[#64748B]">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E8F0]">
            {campaigns.map((campaign) => (
              <CampaignRow
                key={campaign.id}
                campaign={campaign}
                onSelect={onSelect}
                onEdit={onEdit}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="divide-y divide-[#E2E8F0] lg:hidden">
        {campaigns.map((campaign) => (
          <CampaignCard key={campaign.id} campaign={campaign} onSelect={onSelect} onEdit={onEdit} />
        ))}
      </div>
    </div>
  );
}

function CampaignCard({
  campaign,
  onSelect,
  onEdit,
}: {
  campaign: Campaign;
  onSelect: (campaign: Campaign) => void;
  onEdit: (campaign: Campaign) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const deleteCampaign = useDeleteCampaign();
  const startCampaign = useStartCampaign(campaign.id);
  const pauseCampaign = usePauseCampaign(campaign.id);
  const resumeCampaign = useResumeCampaign(campaign.id);

  const statusColors: Record<string, { bg: string; text: string; dot: string }> = {
    draft: { bg: 'bg-[#F8FAFC]', text: 'text-[#64748B]', dot: 'bg-[#94A3B8]' },
    active: { bg: 'bg-[#F0FDF4]', text: 'text-[#22C55E]', dot: 'bg-[#22C55E]' },
    paused: { bg: 'bg-[#FFFBEB]', text: 'text-[#F59E0B]', dot: 'bg-[#F59E0B]' },
    completed: { bg: 'bg-[#EFF6FF]', text: 'text-[#3B82F6]', dot: 'bg-[#3B82F6]' },
  };

  const status = statusColors[campaign.status] || statusColors.draft;

  const handleDelete = async () => {
    try {
      await deleteCampaign.mutateAsync(campaign.id);
      setShowDeleteModal(false);
    } catch {
      // Error handling is done in the mutation
    }
  };

  return (
    <div
      className="cursor-pointer p-4 transition-colors hover:bg-[#F8FAFC]"
      onClick={() => onSelect(campaign)}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-[#1E293B]">{campaign.name}</p>
          <p className="mt-0.5 truncate text-sm text-[#64748B]">
            Created {new Date(campaign.created_at).toLocaleDateString()}
          </p>
        </div>
        <div className="flex flex-shrink-0 items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${status.bg} ${status.text}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
            {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
          </span>
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="rounded-lg p-1.5 transition-colors hover:bg-[#E2E8F0]"
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
                    className="absolute right-0 top-full z-50 mt-1 w-48 rounded-lg border border-[#E2E8F0] bg-white py-1 shadow-lg"
                  >
                    <button
                      onClick={() => {
                        onSelect(campaign);
                        setMenuOpen(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-[#1E293B] hover:bg-[#F8FAFC]"
                    >
                      View Details
                    </button>
                    {campaign.status !== 'completed' && (
                      <button
                        onClick={() => {
                          onEdit(campaign);
                          setMenuOpen(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-[#1E293B] hover:bg-[#F8FAFC]"
                      >
                        Edit
                      </button>
                    )}
                    {campaign.status === 'draft' && (
                      <button
                        onClick={async () => {
                          setMenuOpen(false);
                          await startCampaign.mutateAsync();
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-[#22C55E] hover:bg-[#F0FDF4]"
                      >
                        Start Campaign
                      </button>
                    )}
                    {campaign.status === 'active' && (
                      <button
                        onClick={async () => {
                          setMenuOpen(false);
                          await pauseCampaign.mutateAsync();
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-[#F59E0B] hover:bg-[#FFFBEB]"
                      >
                        Pause Campaign
                      </button>
                    )}
                    {campaign.status === 'paused' && (
                      <button
                        onClick={async () => {
                          setMenuOpen(false);
                          await resumeCampaign.mutateAsync();
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-[#22C55E] hover:bg-[#F0FDF4]"
                      >
                        Resume Campaign
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        setShowDeleteModal(true);
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
      {showDeleteModal && (
        <DeleteCampaignModal
          campaignName={campaign.name}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDelete}
          isDeleting={deleteCampaign.isPending}
        />
      )}
    </div>
  );
}

// Helper component for start/pause buttons
function CampaignRow({
  campaign,
  onSelect,
  onEdit,
}: {
  campaign: Campaign;
  onSelect: (campaign: Campaign) => void;
  onEdit: (campaign: Campaign) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const deleteCampaign = useDeleteCampaign();
  const startCampaign = useStartCampaign(campaign.id);
  const pauseCampaign = usePauseCampaign(campaign.id);
  const resumeCampaign = useResumeCampaign(campaign.id);

  const statusColors: Record<string, { bg: string; text: string; dot: string }> = {
    draft: { bg: 'bg-[#F8FAFC]', text: 'text-[#64748B]', dot: 'bg-[#94A3B8]' },
    active: { bg: 'bg-[#F0FDF4]', text: 'text-[#22C55E]', dot: 'bg-[#22C55E]' },
    paused: { bg: 'bg-[#FFFBEB]', text: 'text-[#F59E0B]', dot: 'bg-[#F59E0B]' },
    completed: { bg: 'bg-[#EFF6FF]', text: 'text-[#3B82F6]', dot: 'bg-[#3B82F6]' },
  };

  const status = statusColors[campaign.status] || statusColors.draft;

  const handleDelete = async () => {
    try {
      await deleteCampaign.mutateAsync(campaign.id);
      setShowDeleteModal(false);
    } catch {
      // Error handling is done in the mutation
    }
  };

  return (
    <tr
      className={`cursor-pointer transition-colors hover:bg-[#F8FAFC] ${menuOpen ? 'relative z-10' : ''}`}
      onClick={() => onSelect(campaign)}
    >
      <td className="px-6 py-4">
        <div>
          <p className="font-medium text-[#1E293B]">{campaign.name}</p>
          <p className="text-sm text-[#64748B]">ID: {campaign.id.slice(0, 8)}...</p>
        </div>
      </td>
      <td className="px-6 py-4">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${status.bg} ${status.text}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
          {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
        </span>
      </td>
      <td className="px-6 py-4">
        <span className="text-[#64748B]">{new Date(campaign.created_at).toLocaleDateString()}</span>
      </td>
      <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="rounded-lg p-2 transition-colors hover:bg-[#E2E8F0]"
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
                  className="absolute right-0 top-full z-50 mt-1 w-48 rounded-lg border border-[#E2E8F0] bg-white py-1 shadow-lg"
                >
                  <button
                    onClick={() => {
                      onSelect(campaign);
                      setMenuOpen(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-[#1E293B] hover:bg-[#F8FAFC]"
                  >
                    View Details
                  </button>
                  {campaign.status !== 'completed' && (
                    <button
                      onClick={() => {
                        onEdit(campaign);
                        setMenuOpen(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-[#1E293B] hover:bg-[#F8FAFC]"
                    >
                      Edit
                    </button>
                  )}
                  {campaign.status === 'draft' && (
                    <button
                      onClick={async () => {
                        setMenuOpen(false);
                        await startCampaign.mutateAsync();
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-[#22C55E] hover:bg-[#F0FDF4]"
                    >
                      Start Campaign
                    </button>
                  )}
                  {campaign.status === 'active' && (
                    <button
                      onClick={async () => {
                        setMenuOpen(false);
                        await pauseCampaign.mutateAsync();
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-[#F59E0B] hover:bg-[#FFFBEB]"
                    >
                      Pause Campaign
                    </button>
                  )}
                  {campaign.status === 'paused' && (
                    <button
                      onClick={async () => {
                        setMenuOpen(false);
                        await resumeCampaign.mutateAsync();
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-[#22C55E] hover:bg-[#F0FDF4]"
                    >
                      Resume Campaign
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      setShowDeleteModal(true);
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
      {showDeleteModal && (
        <DeleteCampaignModal
          campaignName={campaign.name}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDelete}
          isDeleting={deleteCampaign.isPending}
        />
      )}
    </tr>
  );
}

function CreateCampaignModal({
  onClose,
  preSelectedLeadListId,
  editingCampaign,
}: {
  onClose: () => void;
  preSelectedLeadListId?: string | null;
  editingCampaign?: Campaign | null;
}) {
  const isEditMode = !!editingCampaign;
  const isActiveCampaign =
    isEditMode && (editingCampaign?.status === 'active' || editingCampaign?.status === 'paused');
  const queryClient = useQueryClient();

  // State declarations — skip to sequence step for active/paused campaigns
  const [step, setStep] = useState<'name' | 'leads' | 'sequence' | 'senders' | 'review'>(
    isActiveCampaign ? 'sequence' : 'name'
  );
  const [campaignName, setCampaignName] = useState('');
  const [campaignDescription, setCampaignDescription] = useState('');
  const [selectedLeadListId, setSelectedLeadListId] = useState<string | null>(
    preSelectedLeadListId || null
  );
  const [selectedSenderIds, setSelectedSenderIds] = useState<string[]>([]);
  const [senderEmailMap, setSenderEmailMap] = useState<Record<string, string>>({});
  const [sequenceNodes, setSequenceNodes] = useState<SequenceNode[]>([
    { id: 'start', type: 'start', data: {} },
    { id: 'end', type: 'end', data: {} },
  ]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [validationWarnings, setValidationWarnings] = useState<SequenceWarning[]>([]);
  const [showWarningDialog, setShowWarningDialog] = useState(false);
  const [pendingStartImmediately, setPendingStartImmediately] = useState(false);
  const [showImportLeadsModal, setShowImportLeadsModal] = useState(false);

  // API hooks
  const createCampaign = useCreateCampaign();
  const updateCampaign = useUpdateCampaign(editingCampaign?.id || '');
  const { data: campaignDetails, isLoading: detailsLoading } = useCampaign(
    editingCampaign?.id || ''
  );
  const { data: leadListsData, isLoading: leadListsLoading } = useLeadLists();
  const leadLists = leadListsData?.lists || [];
  const { data: linkedInAccounts = [], isLoading: accountsLoading } = useLinkedInAccounts();
  const { data: emailAccounts = [] } = useEmailAccounts();
  const { data: leadAvailability, isLoading: availabilityLoading } =
    useLeadAvailabilityPreview(selectedLeadListId);

  // Sequence template hooks
  const { data: userTemplates = [] } = useSequenceTemplates();
  const saveTemplate = useSaveSequenceTemplate();
  const deleteTemplate = useDeleteSequenceTemplate();

  // Check if sequence has email steps
  const hasEmailSteps = sequenceNodes.some((n) => n.type === 'email');
  const connectedEmailAccounts = emailAccounts.filter((a) => a.status === 'connected');

  // Auto-initialize sender email map from LinkedIn account defaults
  useEffect(() => {
    if (hasEmailSteps) {
      setSenderEmailMap((prev) => {
        const next = { ...prev };
        let changed = false;
        for (const id of selectedSenderIds) {
          if (!next[id]) {
            const account = linkedInAccounts.find((a) => a.id === id);
            if (account?.default_email_account_id) {
              next[id] = account.default_email_account_id;
              changed = true;
            }
          }
        }
        // Clean up deselected senders
        for (const id of Object.keys(next)) {
          if (!selectedSenderIds.includes(id)) {
            delete next[id];
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    }
  }, [hasEmailSteps, selectedSenderIds, linkedInAccounts]);

  // Derive selectedEmailIds for backward-compatible checks
  const selectedEmailIds = [...new Set(Object.values(senderEmailMap).filter(Boolean))];
  const allSendersHaveEmail = !hasEmailSteps || selectedSenderIds.every((id) => senderEmailMap[id]);

  // Check if any connected account has InMail capability (Premium, Sales Nav, or Recruiter)
  const hasInmailCapability = linkedInAccounts.some(
    (account) =>
      account.status === 'connected' &&
      ['premium', 'sales_nav', 'recruiter'].includes(account.subscription_type)
  );

  // Get current workspace from global store
  const { currentWorkspaceId } = useCurrentWorkspace();
  const { data: currentWorkspaceData } = useWorkspace(currentWorkspaceId || '');

  const selectedNode = sequenceNodes.find((n) => n.id === selectedNodeId) || null;

  // Pre-fill form when editing a campaign
  useEffect(() => {
    if (isEditMode && campaignDetails && !detailsLoading) {
      // Set campaign name
      setCampaignName(campaignDetails.name || '');

      // Convert backend steps to frontend nodes
      if (campaignDetails.steps && campaignDetails.steps.length > 0) {
        const nodes: SequenceNode[] = [{ id: 'start', type: 'start', data: {} }];

        // Sort steps by order
        const sortedSteps = [...campaignDetails.steps].sort((a, b) => a.order - b.order);

        // Reconstruct branch relationships from condition steps
        const branchInfo = reconstructBranchInfo(sortedSteps);

        sortedSteps.forEach((step) => {
          // Map backend step type to frontend node type
          const mappedType = mapStepTypeToNodeType(step.type);
          if (!mappedType) {
            console.error(`Unknown step type: ${step.type}`);
            return;
          }

          // Check if this step belongs to a branch
          const branchData = branchInfo.get(step.id);

          nodes.push({
            id: step.id,
            type: mappedType,
            data: mapConfigToNodeData(step.config || {}),
            parentId: branchData?.parentId,
            branch: branchData?.branch,
          });
        });

        nodes.push({ id: 'end', type: 'end', data: {} });
        setSequenceNodes(nodes);
      }

      // Set selected senders and email pairings
      if (campaignDetails.senders) {
        setSelectedSenderIds(campaignDetails.senders.map((s) => s.linkedin_account_id));
        const emailMap: Record<string, string> = {};
        for (const sender of campaignDetails.senders) {
          if (sender.email_account_id) {
            emailMap[sender.linkedin_account_id] = sender.email_account_id;
          }
        }
        setSenderEmailMap(emailMap);
      }

      // Note: We don't set selectedLeadListId because we don't have that info from campaignDetails
      // The leads are already assigned but we can't change the list in edit mode
    }
  }, [isEditMode, campaignDetails, detailsLoading]);

  const handleAddStep = useCallback(
    (type: SequenceNode['type']) => {
      if (!selectedNodeId) return;

      const selectedNode = sequenceNodes.find((n) => n.id === selectedNodeId);
      if (!selectedNode) return;

      const newNode: SequenceNode = {
        id: `node-${Date.now()}`,
        type,
        data:
          type === 'delay'
            ? { delayDays: 1, delayHours: 0 }
            : type === 'condition'
              ? { condition: 'connected' }
              : {},
        // Inherit branch context from the selected node
        parentId: selectedNode.parentId,
        branch: selectedNode.branch,
      };

      const afterIndex = sequenceNodes.findIndex((n) => n.id === selectedNodeId);
      const newNodes = [...sequenceNodes];

      if (selectedNode.type === 'condition') {
        // If a condition is selected, insert after it and all its branch children
        let insertAfter = afterIndex;
        for (let i = afterIndex + 1; i < newNodes.length; i++) {
          if (newNodes[i].parentId === selectedNode.id) {
            insertAfter = i;
          } else {
            break;
          }
        }
        newNodes.splice(insertAfter + 1, 0, newNode);
      } else {
        // Insert right after the selected node
        newNodes.splice(afterIndex + 1, 0, newNode);
      }

      setSequenceNodes(newNodes);
    },
    [sequenceNodes, selectedNodeId]
  );

  const handleUpdateNode = useCallback(
    (data: Partial<SequenceNode['data']>) => {
      if (!selectedNodeId) return;
      setSequenceNodes((nodes) =>
        nodes.map((n) => (n.id === selectedNodeId ? { ...n, data: { ...n.data, ...data } } : n))
      );
    },
    [selectedNodeId]
  );

  // Validate sequence nodes before proceeding
  const validateSequence = useCallback((): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];
    const actionNodes = sequenceNodes.filter((n) => n.type !== 'start' && n.type !== 'end');

    if (actionNodes.length === 0) {
      errors.push('Add at least one action to your sequence');
      return { valid: false, errors };
    }

    actionNodes.forEach((node, index) => {
      const stepNum = index + 1;

      if (node.type === 'linkedin_message') {
        if (!node.data.message || !node.data.message.trim()) {
          errors.push(`Step ${stepNum} (Message): Message text is required`);
        }
      }

      if (node.type === 'email') {
        if (!node.data.subject || !node.data.subject.trim()) {
          errors.push(`Step ${stepNum} (Email): Subject is required`);
        }
        if (!node.data.message || !node.data.message.trim()) {
          errors.push(`Step ${stepNum} (Email): Email body is required`);
        }
      }

      if (node.type === 'delay') {
        const days = node.data.delayDays || 0;
        const hours = node.data.delayHours || 0;
        if (days <= 0 && hours <= 0) {
          errors.push(`Step ${stepNum} (Wait): Set a delay of at least 1 hour or 1 day`);
        }
      }
    });

    return { valid: errors.length === 0, errors };
  }, [sequenceNodes]);

  // Check if sequence is valid (for disabling Continue button)
  const sequenceValidation = validateSequence();
  const isSequenceValid = sequenceValidation.valid;

  const stepConfigs = [
    { id: 'name', label: 'Name', number: 1 },
    { id: 'leads', label: 'Leads', number: 2 },
    { id: 'sequence', label: 'Sequence', number: 3 },
    { id: 'senders', label: 'Senders', number: 4 },
    { id: 'review', label: 'Review', number: 5 },
  ];

  const currentStepIndex = stepConfigs.findIndex((s) => s.id === step);

  // Validate sequence and show warning dialog if needed
  const handleSaveWithValidation = (startImmediately = false) => {
    setError(null);

    // Validate required fields first
    if (!campaignName || !campaignName.trim()) {
      setError('Campaign name is required');
      return;
    }

    // Skip validation for draft saves — only validate when starting
    if (!startImmediately) {
      handleCreate(false);
      return;
    }

    // Validate sequence for potential issues
    // Check if any selected sender has InMail capability
    const hasInmailCapableSenders = selectedSenderIds.some((senderId) => {
      const account = linkedInAccounts.find((a) => a.id === senderId);
      return (
        account &&
        account.status === 'connected' &&
        ['premium', 'sales_nav', 'recruiter'].includes(account.subscription_type)
      );
    });

    const validationContext: ValidationContext = {
      hasInmailCapableSenders,
      hasEmailAccountSelected: selectedEmailIds.length > 0,
    };

    const warnings = validateCampaignSequence(sequenceNodes, validationContext);

    if (hasSequenceWarnings(warnings)) {
      // Show warning dialog and let user decide
      setValidationWarnings(warnings);
      setPendingStartImmediately(true);
      setShowWarningDialog(true);
      return;
    }

    // No warnings, proceed with start
    handleCreate(true);
  };

  const handleCreate = async (startImmediately = false) => {
    setError(null);
    setIsSaving(true);
    setShowWarningDialog(false);

    // Validate required fields
    if (!campaignName || !campaignName.trim()) {
      setError('Campaign name is required');
      setIsSaving(false);
      return;
    }

    try {
      // Active campaign: config-only save (no delete-and-recreate)
      if (isActiveCampaign && editingCampaign) {
        const campaignId = editingCampaign.id;

        // Update campaign name
        if (updateCampaign) {
          await updateCampaign.mutateAsync({ name: campaignName });
        }

        // Patch each step's config individually
        for (const node of sequenceNodes) {
          if (node.type === 'start' || node.type === 'end') continue;
          const config = mapNodeDataToConfig(node);
          await api.patch(`/campaigns/${campaignId}/steps/${node.id}`, { config });
        }

        // Invalidate queries to refresh campaign data
        await queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.detail(campaignId) });
        await queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.all });

        showSuccessToast(
          'Campaign updated!',
          `"${campaignName}" has been updated. Changes take effect immediately for new leads.`
        );

        onClose();
        return;
      }

      let campaignId: string;

      if (isEditMode && editingCampaign && updateCampaign) {
        // Edit mode: Update existing campaign
        campaignId = editingCampaign.id;

        // Step 1: Update campaign name
        await updateCampaign.mutateAsync({ name: campaignName });

        // Step 2: Delete all existing steps
        if (campaignDetails?.steps) {
          for (const step of campaignDetails.steps) {
            try {
              await api.delete(`/campaigns/${campaignId}/steps/${step.id}`);
            } catch (err) {
              console.error('Failed to delete step:', step.id, err);
            }
          }
        }

        // Step 3: Delete all existing senders
        if (campaignDetails?.senders) {
          for (const sender of campaignDetails.senders) {
            try {
              await api.delete(`/campaigns/${campaignId}/senders/${sender.id}`);
            } catch (err) {
              console.error('Failed to delete sender:', sender.id, err);
            }
          }
        }
      } else {
        // Create mode: Create new campaign
        if (!currentWorkspaceId) {
          setError('No workspace selected. Please select a workspace from the header first.');
          setIsSaving(false);
          return;
        }
        const campaign = await createCampaign.mutateAsync({
          name: campaignName,
          workspace_id: currentWorkspaceId,
        });
        campaignId = campaign.id;
      }

      // Step 4: Save all sequence steps (both create and edit mode)
      const stepsToSave = prepareNodesForSave(sequenceNodes);
      const nodeIdToStepId = new Map<string, string>();
      const createdStepIds: string[] = [];

      if (stepsToSave.length > 0) {
        try {
          // Create steps sequentially to maintain order
          for (const stepData of stepsToSave) {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { nodeId, parentNodeId, branch, ...stepPayload } = stepData;
            const response = await api.post(`/campaigns/${campaignId}/steps`, stepPayload);
            const stepId = response.data.id;
            // Track the mapping from frontend nodeId to backend stepId
            nodeIdToStepId.set(nodeId, stepId);
            createdStepIds.push(stepId);
          }

          // Step 4b: Update condition steps with their branch relationships and next_step_id
          const branchRelationships = buildBranchRelationships(stepsToSave, nodeIdToStepId);
          const nextStepRelationships = buildNextStepRelationships(stepsToSave, nodeIdToStepId);

          for (const [conditionStepId, branches] of branchRelationships) {
            // Get the next_step_id for fall-through when branches are empty
            const nextStepId = nextStepRelationships.get(conditionStepId);
            await api.patch(`/campaigns/${campaignId}/steps/${conditionStepId}`, {
              true_branch_step_id: branches.trueBranchStepId || null,
              false_branch_step_id: branches.falseBranchStepId || null,
              next_step_id: nextStepId, // For fall-through when branches are empty
            });
          }

          // Step 4c: Update non-condition steps with their next_step_id for proper sequencing
          for (const [stepId, nextStepId] of nextStepRelationships) {
            const step = stepsToSave.find((s) => nodeIdToStepId.get(s.nodeId) === stepId);
            // Skip condition steps (already updated above with branch IDs)
            if (step && step.type !== 'condition') {
              await api.patch(`/campaigns/${campaignId}/steps/${stepId}`, {
                next_step_id: nextStepId,
              });
            }
          }
        } catch (stepError) {
          // Rollback: delete any created steps if there was an error
          console.error('Error creating steps, rolling back:', stepError);
          for (const stepId of createdStepIds) {
            try {
              await api.delete(`/campaigns/${campaignId}/steps/${stepId}`);
            } catch (deleteErr) {
              console.error('Failed to rollback step:', stepId, deleteErr);
            }
          }
          throw stepError; // Re-throw to be caught by outer error handler
        }
      }

      // Step 5: Add senders to campaign (both create and edit mode)
      // Each sender is paired with its explicitly chosen email from senderEmailMap
      if (selectedSenderIds.length > 0) {
        for (const senderId of selectedSenderIds) {
          const emailAccountId = senderEmailMap[senderId] || undefined;
          try {
            await api.post(`/campaigns/${campaignId}/senders`, {
              linkedin_account_id: senderId,
              ...(emailAccountId && { email_account_id: emailAccountId }),
            });
          } catch (senderErr) {
            console.error('Failed to add sender:', senderId, senderErr);
          }
        }
      }

      // Step 6: Assign leads from selected list (both create and edit mode)
      if (selectedLeadListId) {
        try {
          await api.post(`/campaigns/${campaignId}/assign-leads`, {
            list_id: selectedLeadListId,
          });
        } catch (leadErr) {
          console.error('Failed to assign leads:', leadErr);
        }
      }

      // Invalidate queries to refresh campaign data
      await queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.detail(campaignId) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.all });

      // Step 7: Start campaign if requested
      if (startImmediately && selectedSenderIds.length > 0) {
        try {
          await api.post(`/campaigns/${campaignId}/start`);
          // Invalidate queries again to update campaign status
          await queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.detail(campaignId) });
          await queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.all });
          showSuccessToast(
            'Campaign started!',
            `"${campaignName}" is now active and processing leads.`
          );
        } catch (startErr: unknown) {
          console.error('Failed to start campaign:', startErr);

          // Parse backend error for better UX
          let errorMessage = 'Campaign was created but failed to start.';

          const axiosError = startErr as { response?: { data?: { detail?: string } } };
          if (axiosError?.response?.data?.detail) {
            const detail = axiosError.response.data.detail;
            if (typeof detail === 'string') {
              // Extract the meaningful part of the error
              if (detail.includes('Campaign has no leads assigned')) {
                errorMessage =
                  'Campaign was created but cannot start: No available leads were assigned. All leads from the selected list are already in other active campaigns. Please pause or complete other campaigns to free up leads, then try starting this campaign again.';
              } else if (detail.includes('validation failed')) {
                errorMessage = `Campaign was created but cannot start: ${detail}`;
              } else {
                errorMessage = `Campaign was created but failed to start: ${detail}`;
              }
            }
          }

          setError(errorMessage);
          setIsSaving(false);
          return; // Don't close modal on error
        }
      } else {
        // Show success toast for save without starting
        showSuccessToast(
          isEditMode ? 'Campaign updated!' : 'Campaign saved!',
          isEditMode
            ? `"${campaignName}" has been updated successfully.`
            : `"${campaignName}" has been saved as a draft.`
        );
      }

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save campaign');
    } finally {
      setIsSaving(false);
    }
  };

  return createPortal(
    <>
      {/* Validation Warning Dialog */}
      <AnimatePresence>
        {showWarningDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4"
            onClick={() => setShowWarningDialog(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl"
            >
              <div className="mb-4 flex items-start gap-3">
                <div
                  className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${hasSequenceErrors(validationWarnings) ? 'bg-red-100' : 'bg-amber-100'}`}
                >
                  <WarningIcon
                    className={`h-5 w-5 ${hasSequenceErrors(validationWarnings) ? 'text-red-600' : 'text-amber-600'}`}
                  />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[#1E293B]">
                    {hasSequenceErrors(validationWarnings)
                      ? 'Issues Must Be Fixed'
                      : 'Potential Issues Detected'}
                  </h3>
                  <p className="mt-1 text-sm text-[#64748B]">
                    {hasSequenceErrors(validationWarnings)
                      ? 'Your sequence has issues that need to be resolved before proceeding.'
                      : 'We found some patterns in your sequence that might not work as expected.'}
                  </p>
                </div>
              </div>

              <div className="mb-6 max-h-64 overflow-y-auto rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-4">
                <ul className="space-y-3">
                  {validationWarnings.map((warning, index) => (
                    <li key={index} className="flex gap-2 text-sm">
                      <span
                        className={`mt-0.5 flex-shrink-0 ${warning.type === 'error' ? 'text-red-500' : 'text-amber-500'}`}
                      >
                        {warning.type === 'error' ? '✕' : '⚠'}
                      </span>
                      <div>
                        <p className="font-medium text-[#1E293B]">{warning.message}</p>
                        {warning.suggestion && (
                          <p className="mt-1 text-[#64748B]">{warning.suggestion}</p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowWarningDialog(false);
                    setStep('sequence');
                  }}
                  className="rounded-lg border border-[#E2E8F0] px-4 py-2 font-medium text-[#64748B] hover:bg-[#F8FAFC]"
                >
                  Go Back & Fix
                </button>
                {!hasSequenceErrors(validationWarnings) && (
                  <button
                    onClick={() => handleCreate(pendingStartImmediately)}
                    className="rounded-lg bg-amber-500 px-4 py-2 font-medium text-white hover:bg-amber-600"
                  >
                    Continue Anyway
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Modal */}
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
          className={`flex max-h-[95vh] w-full flex-col overflow-hidden rounded-2xl bg-white shadow-xl ${
            step === 'sequence' ? 'max-w-[95vw]' : 'max-w-3xl'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#E2E8F0] px-6 py-4">
            <h2 className="text-lg font-bold text-[#1E293B]">
              {isEditMode ? 'Edit Campaign' : 'Create Campaign'}
            </h2>
            <button
              onClick={onClose}
              disabled={isSaving}
              className="rounded-lg p-2 hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <CloseIcon />
            </button>
          </div>

          {/* Loading state when fetching campaign details in edit mode */}
          {isEditMode && detailsLoading ? (
            <div className="flex min-h-[400px] items-center justify-center p-6">
              <div className="flex flex-col items-center gap-3">
                <LoadingSpinner />
                <p className="text-[#64748B]">Loading campaign details...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Progress */}
              <div className="border-b border-[#E2E8F0] px-6 py-4">
                <div className="flex items-center justify-between">
                  {stepConfigs.map((s, i) => (
                    <div key={s.id} className="flex items-center">
                      <div
                        className={`flex items-center gap-2 ${i <= currentStepIndex ? 'text-[#FF6B35]' : 'text-[#94A3B8]'}`}
                      >
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                            i < currentStepIndex
                              ? 'bg-[#FF6B35] text-white'
                              : i === currentStepIndex
                                ? 'border-2 border-[#FF6B35] bg-[#FFF7ED] text-[#FF6B35]'
                                : 'bg-[#F8FAFC] text-[#94A3B8]'
                          }`}
                        >
                          {i < currentStepIndex ? '✓' : s.number}
                        </div>
                        <span className="hidden text-sm font-medium sm:block">{s.label}</span>
                      </div>
                      {i < stepConfigs.length - 1 && (
                        <div
                          className={`mx-2 h-0.5 w-8 sm:w-12 ${i < currentStepIndex ? 'bg-[#FF6B35]' : 'bg-[#E2E8F0]'}`}
                        />
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
                        <h3 className="mb-1 text-lg font-semibold text-[#1E293B]">
                          Name your campaign
                        </h3>
                        <p className="text-sm text-[#64748B]">
                          Give your campaign a memorable name and description.
                        </p>
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-medium text-[#1E293B]">
                          Campaign Name *
                        </label>
                        <input
                          type="text"
                          value={campaignName}
                          onChange={(e) => setCampaignName(e.target.value)}
                          placeholder="e.g., Q1 Tech Leaders Outreach"
                          className="w-full rounded-xl border border-[#E2E8F0] px-4 py-3 focus:border-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-medium text-[#1E293B]">
                          Description (optional)
                        </label>
                        <textarea
                          value={campaignDescription}
                          onChange={(e) => setCampaignDescription(e.target.value)}
                          placeholder="Describe the goal of this campaign..."
                          rows={3}
                          className="w-full resize-none rounded-xl border border-[#E2E8F0] px-4 py-3 focus:border-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20"
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
                      {isActiveCampaign ? (
                        <>
                          <div>
                            <h3 className="mb-1 text-lg font-semibold text-[#1E293B]">
                              Campaign Leads
                            </h3>
                            <p className="text-sm text-[#64748B]">
                              Leads are managed from the campaign detail view.
                            </p>
                          </div>
                          <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-5">
                            <div className="flex items-center gap-4">
                              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#FF6B35]">
                                <ListIcon className="h-6 w-6 text-white" />
                              </div>
                              <div>
                                <p className="text-2xl font-bold text-[#1E293B]">
                                  {campaignDetails?.lead_count || 0}
                                </p>
                                <p className="text-sm text-[#64748B]">leads assigned</p>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-start gap-2 rounded-lg border border-[#3B82F6]/20 bg-[#F0F9FF] p-3">
                            <InfoIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#3B82F6]" />
                            <p className="text-xs text-[#1E293B]">
                              To add or remove leads, close this editor and use the campaign detail
                              view. Lead changes take effect immediately.
                            </p>
                          </div>
                        </>
                      ) : (
                        <>
                          <div>
                            <h3 className="mb-1 text-lg font-semibold text-[#1E293B]">
                              {isEditMode ? 'Add leads to campaign' : 'Select your leads'}
                            </h3>
                            <p className="text-sm text-[#64748B]">
                              {isEditMode
                                ? `This campaign currently has ${campaignDetails?.lead_count || 0} leads. Select a list to add more.`
                                : 'Choose a lead list to target with this campaign.'}
                            </p>
                          </div>
                          {leadListsLoading ? (
                            <div className="flex items-center justify-center py-8">
                              <LoadingSpinner />
                            </div>
                          ) : leadLists.length === 0 ? (
                            <div className="py-8 text-center">
                              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-[#F8FAFC]">
                                <ListIcon className="h-6 w-6 text-[#94A3B8]" />
                              </div>
                              <p className="mb-2 text-[#64748B]">No lead lists yet</p>
                              <p className="text-sm text-[#94A3B8]">
                                Import leads first to create a campaign.
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {isEditMode && (
                                <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
                                  <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#FF6B35]">
                                      <ListIcon className="h-5 w-5 text-white" />
                                    </div>
                                    <div className="flex-1">
                                      <p className="font-medium text-[#1E293B]">
                                        Current Campaign Leads
                                      </p>
                                      <p className="text-sm text-[#64748B]">
                                        {campaignDetails?.lead_count || 0} leads already assigned
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              )}
                              <div className="grid gap-3">
                                {leadLists.map((list) => (
                                  <button
                                    key={list.id}
                                    onClick={() => setSelectedLeadListId(list.id)}
                                    className={`flex items-center gap-4 rounded-xl border p-4 transition-all ${
                                      selectedLeadListId === list.id
                                        ? 'border-[#FF6B35] bg-[#FFF7ED]'
                                        : 'border-[#E2E8F0] hover:border-[#FF6B35]/30'
                                    }`}
                                  >
                                    <div
                                      className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                                        selectedLeadListId === list.id
                                          ? 'bg-[#FF6B35]'
                                          : 'bg-[#F8FAFC]'
                                      }`}
                                    >
                                      <ListIcon
                                        className={`h-5 w-5 ${selectedLeadListId === list.id ? 'text-white' : 'text-[#64748B]'}`}
                                      />
                                    </div>
                                    <div className="flex-1 text-left">
                                      <p className="font-medium text-[#1E293B]">{list.name}</p>
                                      <p className="text-sm text-[#64748B]">
                                        {list.lead_count} leads • {list.enriched_count} enriched
                                      </p>
                                    </div>
                                    {selectedLeadListId === list.id && (
                                      <CheckCircleIcon className="h-5 w-5 text-[#FF6B35]" />
                                    )}
                                  </button>
                                ))}
                              </div>
                              <button
                                onClick={() => setShowImportLeadsModal(true)}
                                className="w-full rounded-xl border-2 border-dashed border-[#E2E8F0] p-4 text-center transition-colors hover:border-[#FF6B35]/50 hover:bg-[#FFF7ED]/50"
                              >
                                <PlusIcon className="mx-auto mb-1 h-5 w-5 text-[#94A3B8]" />
                                <span className="text-sm text-[#64748B]">Import new leads</span>
                              </button>

                              {/* Lead Availability Info */}
                              {selectedLeadListId && leadAvailability && !availabilityLoading && (
                                <div className="mt-4 space-y-2">
                                  {leadAvailability.available === 0 ? (
                                    // Critical: No leads available
                                    <div className="flex items-start gap-3 rounded-xl border border-[#EF4444]/20 bg-[#FEF2F2] p-4">
                                      <WarningIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#EF4444]" />
                                      <div className="flex-1">
                                        <p className="text-sm font-bold text-[#991B1B]">
                                          Cannot Create Campaign: No Available Leads
                                        </p>
                                        <p className="mt-1 text-xs text-[#DC2626]">
                                          All {leadAvailability.total} leads from this list are
                                          currently assigned to active or paused campaigns. You must
                                          pause or complete other campaigns to free up leads before
                                          creating a new campaign with this list.
                                        </p>
                                        <p className="mt-2 text-xs font-medium text-[#991B1B]">
                                          Available: {leadAvailability.available} /{' '}
                                          {leadAvailability.total} leads
                                        </p>
                                      </div>
                                    </div>
                                  ) : leadAvailability.in_active_campaigns > 0 ? (
                                    // Warning: Some leads unavailable
                                    <div className="flex items-start gap-3 rounded-xl border border-[#F59E0B]/20 bg-[#FFFBEB] p-4">
                                      <WarningIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#F59E0B]" />
                                      <div className="flex-1">
                                        <p className="text-sm font-medium text-[#92400E]">
                                          Lead Availability Warning
                                        </p>
                                        <p className="mt-1 text-xs text-[#B45309]">
                                          {leadAvailability.in_active_campaigns} of{' '}
                                          {leadAvailability.total} leads are already in active or
                                          paused campaigns and cannot be reassigned.
                                        </p>
                                        <p className="mt-2 text-xs font-medium text-[#92400E]">
                                          Available: {leadAvailability.available} /{' '}
                                          {leadAvailability.total} leads
                                        </p>
                                      </div>
                                    </div>
                                  ) : (
                                    // Success: All leads available
                                    <div className="flex items-start gap-3 rounded-xl border border-[#22C55E]/20 bg-[#DCFCE7] p-4">
                                      <CheckIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#22C55E]" />
                                      <div className="flex-1">
                                        <p className="text-sm font-medium text-[#166534]">
                                          All leads available
                                        </p>
                                        <p className="mt-1 text-xs text-[#15803D]">
                                          All {leadAvailability.total} leads from this list are
                                          available to be assigned to this campaign.
                                        </p>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </motion.div>
                  )}

                  {step === 'sequence' && (
                    <motion.div
                      key="sequence"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="-m-6 h-full"
                    >
                      {/* Sequence Validation Warnings */}
                      {!isSequenceValid && sequenceValidation.errors.length > 0 && (
                        <div className="mx-6 mb-4 mt-6 rounded-lg border border-[#FCD34D] bg-[#FFFBEB] p-3">
                          <div className="flex items-start gap-2">
                            <svg
                              className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#F59E0B]"
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
                            <div className="flex-1">
                              <p className="text-sm font-medium text-[#92400E]">
                                Please fix the following before continuing:
                              </p>
                              <ul className="mt-1 space-y-0.5">
                                {sequenceValidation.errors.map((err, i) => (
                                  <li key={i} className="text-sm text-[#B45309]">
                                    • {err}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Active campaign info banner */}
                      {isActiveCampaign && (
                        <div className="mx-6 mb-4 mt-6 flex items-start gap-2.5 rounded-lg border border-[#3B82F6]/20 bg-[#EFF6FF] p-3">
                          <InfoIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#3B82F6]" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-[#1E40AF]">
                              Campaign is {editingCampaign?.status}
                            </p>
                            <p className="mt-0.5 text-xs text-[#1D4ED8]">
                              You can edit step content and timing. The sequence structure (adding,
                              removing, or reordering steps) cannot be changed once a campaign has
                              been started.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Mobile Layout - Stacked */}
                      <div className="relative flex h-[calc(100vh-200px)] min-h-[500px] flex-col bg-[#FAFBFC] lg:hidden">
                        {/* Mobile Step Palette - Horizontal scroll (hidden for active campaigns) */}
                        {!isActiveCampaign && (
                          <div className="border-b border-[#E2E8F0] bg-white p-3">
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">
                              Add Steps
                            </p>
                            <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2">
                              {[
                                {
                                  type: 'linkedin_connect' as const,
                                  label: 'Connect',
                                  color: '#0A66C2',
                                },
                                {
                                  type: 'linkedin_message' as const,
                                  label: 'Message',
                                  color: '#0A66C2',
                                },
                                { type: 'email' as const, label: 'Email', color: '#14B8A6' },
                                { type: 'delay' as const, label: 'Wait', color: '#F59E0B' },
                                { type: 'condition' as const, label: 'If/Then', color: '#8B5CF6' },
                              ].map((item) => (
                                <button
                                  key={item.type}
                                  onClick={() => handleAddStep(item.type)}
                                  className="flex-shrink-0 rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 transition-all hover:border-[#FF6B35]/30"
                                >
                                  <span
                                    className="text-xs font-medium"
                                    style={{ color: item.color }}
                                  >
                                    {item.label}
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Mobile Canvas */}
                        <div className="flex-1 overflow-y-auto">
                          <SequenceCanvas
                            nodes={sequenceNodes}
                            onNodesChange={setSequenceNodes}
                            onNodeSelect={(node) => setSelectedNodeId(node?.id || null)}
                            selectedNodeId={selectedNodeId}
                            hasInmailCapability={hasInmailCapability}
                            readonlyStructure={isActiveCampaign}
                            agentDefaults={currentWorkspaceData?.agent_defaults}
                          />
                        </div>

                        {/* Mobile Config Panel - Bottom Sheet */}
                        <AnimatePresence>
                          {selectedNode &&
                            selectedNode.type !== 'start' &&
                            selectedNode.type !== 'end' && (
                              <motion.div
                                initial={{ y: '100%' }}
                                animate={{ y: 0 }}
                                exit={{ y: '100%' }}
                                className="absolute bottom-0 left-0 right-0 max-h-[60vh] overflow-y-auto rounded-t-2xl border-t border-[#E2E8F0] bg-white shadow-lg"
                              >
                                <div className="mx-auto my-3 h-1 w-12 rounded-full bg-[#E2E8F0]" />
                                <NodeConfigPanel
                                  node={selectedNode}
                                  onUpdate={handleUpdateNode}
                                  onClose={() => setSelectedNodeId(null)}
                                  readonlyStructure={isActiveCampaign}
                                />
                              </motion.div>
                            )}
                        </AnimatePresence>
                      </div>

                      {/* Desktop Layout - Side by side */}
                      <div className="hidden h-[80vh] max-h-[900px] min-h-[600px] overflow-hidden rounded-lg border border-[#E2E8F0] bg-[#FAFBFC] lg:flex">
                        {/* Step Palette / Edit Guidance Panel */}
                        {isActiveCampaign ? (
                          <div className="w-72 flex-shrink-0 overflow-y-auto border-r border-[#E2E8F0] bg-white p-4">
                            <div className="mb-4">
                              <h3 className="text-sm font-semibold text-[#1E293B]">
                                Edit Step Content
                              </h3>
                              <p className="mt-1 text-xs text-[#64748B]">
                                Click any step on the canvas to edit its content.
                              </p>
                            </div>

                            <div className="mb-4 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-3">
                              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#64748B]">
                                What you can edit
                              </p>
                              <ul className="space-y-1.5 text-xs text-[#475569]">
                                <li className="flex items-center gap-2">
                                  <span className="text-[#22C55E]">&#10003;</span>
                                  Message text and variables
                                </li>
                                <li className="flex items-center gap-2">
                                  <span className="text-[#22C55E]">&#10003;</span>
                                  Email subject and body
                                </li>
                                <li className="flex items-center gap-2">
                                  <span className="text-[#22C55E]">&#10003;</span>
                                  Wait duration (days / hours)
                                </li>
                                <li className="flex items-center gap-2">
                                  <span className="text-[#22C55E]">&#10003;</span>
                                  Condition type (replied, connected, etc.)
                                </li>
                              </ul>
                            </div>

                            <div className="mb-4 rounded-lg border border-[#F59E0B]/20 bg-[#FFFBEB] p-3">
                              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#92400E]">
                                Not editable while active
                              </p>
                              <ul className="space-y-1.5 text-xs text-[#92400E]">
                                <li className="flex items-center gap-2">
                                  <span>&#10007;</span>
                                  Adding or removing steps
                                </li>
                                <li className="flex items-center gap-2">
                                  <span>&#10007;</span>
                                  Reordering steps
                                </li>
                                <li className="flex items-center gap-2">
                                  <span>&#10007;</span>
                                  Changing branch structure
                                </li>
                              </ul>
                              <p className="mt-2 text-[10px] text-[#B45309]">
                                Sequence structure cannot be changed once a campaign has been
                                started.
                              </p>
                            </div>

                            <div className="rounded-lg border border-[#3B82F6]/20 bg-[#EFF6FF] p-3">
                              <p className="text-xs text-[#1D4ED8]">
                                Changes take effect immediately for leads that haven't reached the
                                edited step yet. Leads that already passed a step won't be affected.
                              </p>
                            </div>
                          </div>
                        ) : (
                          <StepPalette
                            onAddStep={handleAddStep}
                            onApplyTemplate={(nodes) => setSequenceNodes(nodes)}
                            hasInmailCapability={hasInmailCapability}
                            selectedNodeId={selectedNodeId}
                            userTemplates={userTemplates}
                            onSaveAsTemplate={async (name, description) => {
                              await saveTemplate.mutateAsync({
                                name,
                                description,
                                nodes: sequenceNodes,
                              });
                            }}
                            onDeleteTemplate={async (id) => {
                              await deleteTemplate.mutateAsync(id);
                            }}
                          />
                        )}

                        {/* Main Canvas */}
                        <SequenceCanvas
                          nodes={sequenceNodes}
                          onNodesChange={setSequenceNodes}
                          onNodeSelect={(node) => setSelectedNodeId(node?.id || null)}
                          selectedNodeId={selectedNodeId}
                          hasInmailCapability={hasInmailCapability}
                          readonlyStructure={isActiveCampaign}
                          agentDefaults={currentWorkspaceData?.agent_defaults}
                        />

                        {/* Node Config Panel */}
                        <AnimatePresence>
                          {selectedNode &&
                            selectedNode.type !== 'start' &&
                            selectedNode.type !== 'end' && (
                              <NodeConfigPanel
                                node={selectedNode}
                                onUpdate={handleUpdateNode}
                                onClose={() => setSelectedNodeId(null)}
                                readonlyStructure={isActiveCampaign}
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
                      {isActiveCampaign ? (
                        <>
                          <div>
                            <h3 className="mb-1 text-lg font-semibold text-[#1E293B]">
                              Campaign Senders
                            </h3>
                            <p className="text-sm text-[#64748B]">
                              Senders are managed from the campaign detail view.
                            </p>
                          </div>
                          <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-5">
                            <div className="flex items-center gap-4">
                              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#0A66C2]">
                                <LinkedInIcon className="h-6 w-6 text-white" />
                              </div>
                              <div>
                                <p className="text-2xl font-bold text-[#1E293B]">
                                  {campaignDetails?.senders?.length || 0}
                                </p>
                                <p className="text-sm text-[#64748B]">senders active</p>
                              </div>
                            </div>
                          </div>
                          {campaignDetails?.senders && campaignDetails.senders.length > 0 && (
                            <div className="space-y-2">
                              {campaignDetails.senders.map((sender) => {
                                const account = linkedInAccounts.find(
                                  (a) => a.id === sender.linkedin_account_id
                                );
                                return (
                                  <div
                                    key={sender.id}
                                    className="flex items-center gap-3 rounded-xl border border-[#E2E8F0] bg-white p-3"
                                  >
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#0A66C2] to-[#004182]">
                                      <span className="text-xs font-semibold text-white">
                                        {account?.name?.charAt(0) || 'S'}
                                      </span>
                                    </div>
                                    <div className="flex-1">
                                      <p className="text-sm font-medium text-[#1E293B]">
                                        {account?.name || 'LinkedIn Account'}
                                      </p>
                                    </div>
                                    <span className="rounded-full bg-[#DCFCE7] px-2 py-0.5 text-xs font-medium text-[#166534]">
                                      Active
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                          <div className="flex items-start gap-2 rounded-lg border border-[#3B82F6]/20 bg-[#F0F9FF] p-3">
                            <InfoIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#3B82F6]" />
                            <p className="text-xs text-[#1E293B]">
                              To add or remove senders, close this editor and use the campaign
                              detail view. Sender changes take effect immediately.
                            </p>
                          </div>
                        </>
                      ) : (
                        <>
                          <div>
                            <h3 className="mb-1 text-lg font-semibold text-[#1E293B]">
                              Assign senders
                            </h3>
                            <p className="text-sm text-[#64748B]">
                              Select LinkedIn accounts to send from. We'll auto-rotate between them.
                            </p>
                          </div>

                          {accountsLoading ? (
                            <div className="flex items-center justify-center py-8">
                              <LoadingSpinner />
                            </div>
                          ) : linkedInAccounts.length === 0 ? (
                            <div className="rounded-xl bg-[#F8FAFC] p-4 text-center">
                              <LinkedInIcon className="mx-auto mb-2 h-8 w-8 text-[#94A3B8]" />
                              <p className="mb-3 text-sm text-[#64748B]">
                                No LinkedIn accounts connected yet
                              </p>
                              <button className="rounded-lg bg-[#0A66C2] px-4 py-2 text-sm font-medium text-white hover:bg-[#004182]">
                                Connect LinkedIn Account
                              </button>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {/* Select All */}
                              <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
                                <span className="text-sm text-[#64748B]">
                                  {selectedSenderIds.length} of {linkedInAccounts.length} selected
                                </span>
                                <button
                                  onClick={() => {
                                    if (selectedSenderIds.length === linkedInAccounts.length) {
                                      setSelectedSenderIds([]);
                                    } else {
                                      setSelectedSenderIds(linkedInAccounts.map((a) => a.id));
                                    }
                                  }}
                                  className="text-sm font-medium text-[#0A66C2] hover:underline"
                                >
                                  {selectedSenderIds.length === linkedInAccounts.length
                                    ? 'Deselect all'
                                    : 'Select all'}
                                </button>
                              </div>

                              {/* Account List */}
                              <div className="max-h-[400px] space-y-2 overflow-y-auto">
                                {linkedInAccounts.map((account) => {
                                  const isSelected = selectedSenderIds.includes(account.id);
                                  const pairedEmailId = senderEmailMap[account.id];
                                  const hasMissingEmail =
                                    hasEmailSteps && isSelected && !pairedEmailId;
                                  return (
                                    <motion.div
                                      key={account.id}
                                      className={`rounded-xl border transition-all ${
                                        isSelected
                                          ? hasMissingEmail
                                            ? 'border-[#F59E0B] bg-[#FFFBEB]'
                                            : 'border-[#0A66C2] bg-[#EFF6FF]'
                                          : 'border-[#E2E8F0] hover:border-[#0A66C2]/30 hover:bg-[#F8FAFC]'
                                      }`}
                                      whileHover={{ scale: 1.01 }}
                                      whileTap={{ scale: 0.99 }}
                                    >
                                      <div
                                        className="flex cursor-pointer items-center gap-3 p-3"
                                        onClick={() => {
                                          if (isSelected) {
                                            setSelectedSenderIds((ids) =>
                                              ids.filter((id) => id !== account.id)
                                            );
                                          } else {
                                            setSelectedSenderIds((ids) => [...ids, account.id]);
                                          }
                                        }}
                                      >
                                        {/* Checkbox */}
                                        <div
                                          className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border-2 transition-colors ${
                                            isSelected
                                              ? 'border-[#0A66C2] bg-[#0A66C2]'
                                              : 'border-[#D1D5DB]'
                                          }`}
                                        >
                                          {isSelected && (
                                            <svg
                                              className="h-3 w-3 text-white"
                                              fill="none"
                                              viewBox="0 0 24 24"
                                              stroke="currentColor"
                                              strokeWidth={3}
                                            >
                                              <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M5 13l4 4L19 7"
                                              />
                                            </svg>
                                          )}
                                        </div>

                                        {/* Avatar */}
                                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#0A66C2] to-[#004182]">
                                          {account.avatar_url ? (
                                            <img
                                              src={account.avatar_url}
                                              alt={account.name || 'Account'}
                                              className="h-10 w-10 rounded-full object-cover"
                                            />
                                          ) : (
                                            <span className="text-sm font-semibold text-white">
                                              {account.name?.charAt(0) || 'U'}
                                            </span>
                                          )}
                                        </div>

                                        {/* Info */}
                                        <div className="min-w-0 flex-1">
                                          <p className="truncate font-medium text-[#1E293B]">
                                            {account.name || 'Unknown'}
                                          </p>
                                          <p className="truncate text-sm text-[#64748B]">
                                            {account.profile_url || 'LinkedIn Account'}
                                          </p>
                                        </div>

                                        {/* Status */}
                                        <div
                                          className={`flex-shrink-0 rounded-full px-2 py-1 text-xs font-medium ${
                                            account.status === 'connected'
                                              ? 'bg-[#DCFCE7] text-[#166534]'
                                              : account.status === 'warning'
                                                ? 'bg-[#FEF3C7] text-[#92400E]'
                                                : 'bg-[#FEE2E2] text-[#DC2626]'
                                          }`}
                                        >
                                          {account.status === 'connected'
                                            ? 'Connected'
                                            : account.status === 'warning'
                                              ? 'Warning'
                                              : account.status === 'disconnected'
                                                ? 'Disconnected'
                                                : 'Banned'}
                                        </div>
                                      </div>

                                      {/* Inline email dropdown - shown when selected and has email steps */}
                                      {hasEmailSteps && isSelected && (
                                        <div className="border-t border-[#E2E8F0]/50 px-3 pb-3 pt-2">
                                          <div className="flex items-center gap-2">
                                            <EmailIcon className="h-4 w-4 flex-shrink-0 text-[#64748B]" />
                                            <select
                                              value={pairedEmailId || ''}
                                              onChange={(e) => {
                                                e.stopPropagation();
                                                setSenderEmailMap((prev) => {
                                                  const next = { ...prev };
                                                  if (e.target.value) {
                                                    next[account.id] = e.target.value;
                                                  } else {
                                                    delete next[account.id];
                                                  }
                                                  return next;
                                                });
                                              }}
                                              onClick={(e) => e.stopPropagation()}
                                              className={`flex-1 rounded-lg border px-2 py-1.5 text-sm focus:outline-none focus:ring-1 ${
                                                pairedEmailId
                                                  ? 'border-[#22C55E]/30 bg-white text-[#1E293B] focus:border-[#22C55E] focus:ring-[#22C55E]/20'
                                                  : 'border-[#F59E0B]/50 bg-[#FFFBEB] text-[#92400E] focus:border-[#F59E0B] focus:ring-[#F59E0B]/20'
                                              }`}
                                            >
                                              <option value="">Select email account...</option>
                                              {connectedEmailAccounts.map((email) => (
                                                <option key={email.id} value={email.id}>
                                                  {email.email_address}
                                                </option>
                                              ))}
                                            </select>
                                            {pairedEmailId ? (
                                              <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[#22C55E]">
                                                <svg
                                                  className="h-3 w-3 text-white"
                                                  fill="none"
                                                  viewBox="0 0 24 24"
                                                  stroke="currentColor"
                                                  strokeWidth={3}
                                                >
                                                  <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M5 13l4 4L19 7"
                                                  />
                                                </svg>
                                              </div>
                                            ) : (
                                              <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[#F59E0B]">
                                                <span className="text-xs font-bold text-white">
                                                  !
                                                </span>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      )}
                                    </motion.div>
                                  );
                                })}
                              </div>

                              {/* Info tip */}
                              <div className="flex items-start gap-2 rounded-lg border border-[#3B82F6]/20 bg-[#F0F9FF] p-3">
                                <InfoIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#3B82F6]" />
                                <p className="text-xs text-[#1E293B]">
                                  Selected accounts will auto-rotate to send messages, keeping each
                                  within safe daily limits.
                                </p>
                              </div>

                              {/* Email pairing warning */}
                              {hasEmailSteps &&
                                selectedSenderIds.length > 0 &&
                                !allSendersHaveEmail && (
                                  <div className="flex items-start gap-2 rounded-lg border border-[#F59E0B]/20 bg-[#FFFBEB] p-3">
                                    <WarningIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#F59E0B]" />
                                    <p className="text-xs text-[#92400E]">
                                      {selectedSenderIds.filter((id) => !senderEmailMap[id]).length}{' '}
                                      sender(s) have no email account assigned. Assign an email to
                                      each sender to enable email steps.
                                    </p>
                                  </div>
                                )}
                            </div>
                          )}
                        </>
                      )}
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
                        <h3 className="mb-1 text-lg font-semibold text-[#1E293B]">
                          {isActiveCampaign ? 'Review changes' : 'Review your campaign'}
                        </h3>
                        <p className="text-sm text-[#64748B]">
                          {isActiveCampaign
                            ? 'Review your changes before saving. Changes take effect immediately.'
                            : 'Make sure everything looks good before launching.'}
                        </p>
                      </div>

                      <div className="space-y-4">
                        <div className="rounded-xl bg-[#F8FAFC] p-4">
                          <div className="mb-2 flex items-center justify-between">
                            <span className="text-sm text-[#64748B]">Campaign Name</span>
                            <span className="font-medium text-[#1E293B]">
                              {campaignName || 'Untitled'}
                            </span>
                          </div>
                          <div className="mb-2 flex items-center justify-between">
                            <span className="text-sm text-[#64748B]">
                              {isEditMode ? 'Leads' : 'Lead List'}
                            </span>
                            <span className="font-medium text-[#1E293B]">
                              {isActiveCampaign ? (
                                <>{campaignDetails?.lead_count || 0} assigned</>
                              ) : isEditMode ? (
                                <>
                                  {campaignDetails?.lead_count || 0} current
                                  {selectedLeadListId &&
                                    ` + ${leadLists.find((l) => l.id === selectedLeadListId)?.lead_count || 0} new`}
                                </>
                              ) : (
                                leadLists.find((l) => l.id === selectedLeadListId)?.name ||
                                'None selected'
                              )}
                            </span>
                          </div>
                          {!isEditMode && selectedLeadListId && leadAvailability && (
                            <div className="mb-2 flex items-center justify-between">
                              <span className="text-sm text-[#64748B]">Available Leads</span>
                              <span
                                className={`font-medium ${
                                  leadAvailability.available === 0
                                    ? 'text-[#EF4444]'
                                    : 'text-[#22C55E]'
                                }`}
                              >
                                {leadAvailability.available} / {leadAvailability.total}
                              </span>
                            </div>
                          )}
                          <div className="mb-2 flex items-center justify-between">
                            <span className="text-sm text-[#64748B]">Sequence Steps</span>
                            <span className="font-medium text-[#1E293B]">
                              {
                                sequenceNodes.filter((n) => n.type !== 'start' && n.type !== 'end')
                                  .length
                              }{' '}
                              steps
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-[#64748B]">LinkedIn Senders</span>
                            <span className="font-medium text-[#1E293B]">
                              {isActiveCampaign
                                ? `${campaignDetails?.senders?.length || 0} active`
                                : `${selectedSenderIds.length} selected`}
                            </span>
                          </div>
                          {hasEmailSteps && (
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-[#64748B]">Email Pairing</span>
                              <span
                                className={`font-medium ${allSendersHaveEmail ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}
                              >
                                {allSendersHaveEmail
                                  ? `All ${selectedSenderIds.length} sender(s) paired`
                                  : `${selectedSenderIds.filter((id) => !senderEmailMap[id]).length} sender(s) missing email`}
                              </span>
                            </div>
                          )}
                        </div>

                        {isActiveCampaign ? (
                          <div className="flex items-start gap-3 rounded-xl border border-[#3B82F6]/20 bg-[#F0F9FF] p-4">
                            <InfoIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#3B82F6]" />
                            <div>
                              <p className="text-sm font-medium text-[#1E40AF]">
                                Campaign is {editingCampaign?.status}
                              </p>
                              <p className="text-xs text-[#3B82F6]">
                                Save to apply your changes. Updated step content takes effect
                                immediately for leads that haven't reached the edited steps yet.
                              </p>
                            </div>
                          </div>
                        ) : !isEditMode &&
                          selectedLeadListId &&
                          leadAvailability &&
                          leadAvailability.available === 0 ? (
                          <div className="flex items-start gap-3 rounded-xl border border-[#EF4444]/20 bg-[#FEF2F2] p-4">
                            <WarningIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#EF4444]" />
                            <div>
                              <p className="text-sm font-bold text-[#991B1B]">
                                Cannot Start Campaign
                              </p>
                              <p className="text-xs text-[#DC2626]">
                                No leads are available from the selected list. All leads are
                                assigned to other active campaigns. You can save as draft, but
                                cannot start until leads become available.
                              </p>
                            </div>
                          </div>
                        ) : selectedSenderIds.length === 0 ? (
                          <div className="flex items-start gap-3 rounded-xl border border-[#F59E0B]/20 bg-[#FFFBEB] p-4">
                            <WarningIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#F59E0B]" />
                            <div>
                              <p className="text-sm font-medium text-[#92400E]">
                                Campaign saved as draft
                              </p>
                              <p className="text-xs text-[#B45309]">
                                Select at least one sender to start this campaign.
                              </p>
                            </div>
                          </div>
                        ) : hasEmailSteps && !allSendersHaveEmail ? (
                          <div className="flex items-start gap-3 rounded-xl border border-[#F59E0B]/20 bg-[#FFFBEB] p-4">
                            <WarningIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#F59E0B]" />
                            <div>
                              <p className="text-sm font-medium text-[#92400E]">
                                Email pairing incomplete
                              </p>
                              <p className="text-xs text-[#B45309]">
                                {selectedSenderIds.filter((id) => !senderEmailMap[id]).length}{' '}
                                sender(s) are missing an email account. Go back to assign emails
                                before starting.
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start gap-3 rounded-xl border border-[#22C55E]/20 bg-[#DCFCE7] p-4">
                            <CheckIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#22C55E]" />
                            <div>
                              <p className="text-sm font-medium text-[#166534]">Ready to launch</p>
                              <p className="text-xs text-[#15803D]">
                                {selectedSenderIds.length} sender
                                {selectedSenderIds.length > 1 ? 's' : ''} will auto-rotate to send
                                messages.
                              </p>
                            </div>
                          </div>
                        )}

                        {error && (
                          <div className="flex items-start gap-3 rounded-xl border border-[#EF4444]/20 bg-[#FEF2F2] p-4">
                            <AlertIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#EF4444]" />
                            <div>
                              <p className="text-sm font-medium text-[#DC2626]">
                                Error creating campaign
                              </p>
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
              <div className="flex items-center justify-between border-t border-[#E2E8F0] px-6 py-4">
                <button
                  onClick={() => {
                    const steps: Array<'name' | 'leads' | 'sequence' | 'senders' | 'review'> = [
                      'name',
                      'leads',
                      'sequence',
                      'senders',
                      'review',
                    ];
                    const currentIndex = steps.indexOf(step);
                    if (currentIndex > 0) setStep(steps[currentIndex - 1]);
                  }}
                  disabled={step === 'name' || isSaving}
                  className="px-4 py-2 font-medium text-[#64748B] disabled:opacity-50"
                >
                  Back
                </button>
                <div className="flex gap-2">
                  {step === 'review' && (
                    <>
                      {isActiveCampaign ? (
                        <button
                          onClick={() => handleSaveWithValidation(false)}
                          disabled={!campaignName || isSaving}
                          className="rounded-lg bg-[#FF6B35] px-6 py-2 font-medium text-white hover:bg-[#E85A2A] disabled:opacity-50"
                        >
                          {isSaving ? 'Saving...' : 'Save Changes'}
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => handleSaveWithValidation(false)}
                            disabled={!campaignName || isSaving}
                            className="rounded-lg border border-[#E2E8F0] px-6 py-2 font-medium text-[#64748B] hover:bg-[#F8FAFC] disabled:opacity-50"
                          >
                            {isSaving ? 'Saving...' : isEditMode ? 'Save Changes' : 'Save as Draft'}
                          </button>
                          {selectedSenderIds.length > 0 && allSendersHaveEmail && (
                            <button
                              onClick={() => handleSaveWithValidation(true)}
                              disabled={
                                !campaignName ||
                                isSaving ||
                                (!isEditMode &&
                                  !!selectedLeadListId &&
                                  !!leadAvailability &&
                                  leadAvailability.available === 0)
                              }
                              className="rounded-lg bg-[#22C55E] px-6 py-2 font-medium text-white hover:bg-[#16A34A] disabled:opacity-50"
                              title={
                                !isEditMode &&
                                selectedLeadListId &&
                                leadAvailability &&
                                leadAvailability.available === 0
                                  ? 'Cannot start: No available leads'
                                  : ''
                              }
                            >
                              {isSaving
                                ? 'Starting...'
                                : isEditMode
                                  ? 'Save and Start'
                                  : 'Create and Start'}
                            </button>
                          )}
                        </>
                      )}
                    </>
                  )}
                  {step !== 'review' && (
                    <button
                      onClick={() => {
                        // Validate lead availability before moving forward from leads step
                        if (
                          step === 'leads' &&
                          selectedLeadListId &&
                          leadAvailability &&
                          leadAvailability.available === 0
                        ) {
                          setError(
                            `Cannot continue: All ${leadAvailability.total} leads from this list are already assigned to active campaigns. Please select a different list or pause the active campaign to free up leads.`
                          );
                          return;
                        }

                        // Validate sequence before moving forward from sequence step
                        if (step === 'sequence') {
                          const validation = validateSequence();
                          if (!validation.valid) {
                            setError(validation.errors.join('\n'));
                            return;
                          }
                        }

                        const steps: Array<'name' | 'leads' | 'sequence' | 'senders' | 'review'> = [
                          'name',
                          'leads',
                          'sequence',
                          'senders',
                          'review',
                        ];
                        const currentIndex = steps.indexOf(step);
                        setStep(steps[currentIndex + 1]);
                      }}
                      disabled={
                        !campaignName || // Campaign name is required at all steps
                        (step === 'name' &&
                          (!campaignName || (!isEditMode && !currentWorkspaceId))) || // Workspace required for new campaigns
                        (step === 'leads' &&
                          selectedLeadListId &&
                          leadAvailability &&
                          leadAvailability.available === 0) || // Block if no available leads
                        (step === 'sequence' && !isSequenceValid) || // Block if sequence has validation errors
                        isSaving
                      }
                      className="rounded-lg bg-[#FF6B35] px-6 py-2 font-medium text-white hover:bg-[#E85A2A] disabled:opacity-50"
                    >
                      Continue
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </motion.div>
      </motion.div>

      {/* Import Leads Modal */}
      {showImportLeadsModal && (
        <ImportLeadsModal
          onClose={() => setShowImportLeadsModal(false)}
          onSuccess={(listId) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.leadLists.all });
            if (listId) setSelectedLeadListId(listId);
            setShowImportLeadsModal(false);
          }}
        />
      )}
    </>,
    document.body
  );
}

function CampaignDetailDrawer({
  campaign,
  onClose,
  onEdit,
}: {
  campaign: Campaign;
  onClose: () => void;
  onEdit: (campaign: Campaign) => void;
}) {
  const { data: campaignDetails } = useCampaign(campaign.id);
  const startCampaign = useStartCampaign(campaign.id);
  const pauseCampaign = usePauseCampaign(campaign.id);
  const resumeCampaign = useResumeCampaign(campaign.id);
  const deleteCampaign = useDeleteCampaign();
  const cloneCampaign = useCloneCampaign();
  const [showCloneDialog, setShowCloneDialog] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [cloneName, setCloneName] = useState('');

  const updateCampaign = useUpdateCampaign(campaign.id);
  const { data: linkedInAccounts = [] } = useLinkedInAccounts();
  const steps = campaignDetails?.steps || [];
  const senders = campaignDetails?.senders || [];
  const leadCount = campaignDetails?.lead_count || 0;

  // Compute max daily connection limit from sender account subscription types
  const CONNECTION_LIMITS: Record<string, number> = {
    free: 20,
    premium: 25,
    sales_nav: 25,
    recruiter: 25,
  };
  const maxDailyLimit =
    senders.reduce((max, sender) => {
      const account = linkedInAccounts.find((a) => a.id === sender.linkedin_account_id);
      const subType = account?.subscription_type || 'free';
      const customLimit = account?.daily_limits?.connection_requests;
      const accountLimit = customLimit ?? CONNECTION_LIMITS[subType] ?? 20;
      return Math.max(max, accountLimit);
    }, 0) || CONNECTION_LIMITS.free;

  // Local state for campaign controls
  const [pauseNewSends, setPauseNewSends] = useState(false);
  const [dailyLimitInput, setDailyLimitInput] = useState<string>('');
  const [controlsInitialized, setControlsInitialized] = useState(false);

  // Sync local state with campaign data (only on initial load / after external changes)
  useEffect(() => {
    if (campaignDetails) {
      if (!controlsInitialized) {
        setPauseNewSends(campaignDetails.pause_new_sends ?? false);
        setDailyLimitInput(
          campaignDetails.daily_connection_limit != null
            ? String(campaignDetails.daily_connection_limit)
            : ''
        );
        setControlsInitialized(true);
      }
    }
  }, [campaignDetails, controlsInitialized]);

  const statusColors: Record<string, { bg: string; text: string; dot: string }> = {
    draft: { bg: 'bg-[#F8FAFC]', text: 'text-[#64748B]', dot: 'bg-[#94A3B8]' },
    active: { bg: 'bg-[#F0FDF4]', text: 'text-[#22C55E]', dot: 'bg-[#22C55E]' },
    paused: { bg: 'bg-[#FFFBEB]', text: 'text-[#F59E0B]', dot: 'bg-[#F59E0B]' },
    completed: { bg: 'bg-[#EFF6FF]', text: 'text-[#3B82F6]', dot: 'bg-[#3B82F6]' },
  };

  const status = statusColors[campaign.status] || statusColors.draft;

  const handleDelete = async () => {
    try {
      await deleteCampaign.mutateAsync(campaign.id);
      setShowDeleteModal(false);
      onClose();
    } catch {
      // Error handled by mutation
    }
  };

  const handleClone = async () => {
    if (!cloneName.trim()) {
      alert('Please enter a name for the cloned campaign');
      return;
    }
    try {
      await cloneCampaign.mutateAsync({
        campaignId: campaign.id,
        name: cloneName,
      });
      setShowCloneDialog(false);
      setCloneName('');
      showSuccessToast(
        'Campaign cloned!',
        `"${cloneName}" has been created with the same sequence.`
      );
      onClose();
    } catch {
      // Error handled by mutation
    }
  };

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        onClick={(e) => e.stopPropagation()}
        className="absolute right-0 top-0 h-full w-full max-w-3xl bg-white shadow-xl"
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="border-b border-[#E2E8F0] px-6 py-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h2 className="text-xl font-bold text-[#1E293B]">
                  {campaign.name || 'Untitled Campaign'}
                </h2>
                <div className="mt-2 flex items-center gap-3">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${status.bg} ${status.text}`}
                  >
                    <span className={`h-2 w-2 rounded-full ${status.dot}`} />
                    {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                  </span>
                  <span className="text-sm text-[#64748B]">
                    Created {new Date(campaign.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <button onClick={onClose} className="rounded-lg p-2 hover:bg-[#F8FAFC]">
                <CloseIcon />
              </button>
            </div>

            {/* Action Buttons */}
            <div className="mt-4 flex flex-wrap gap-2">
              {campaign.status !== 'completed' && (
                <button
                  onClick={() => onEdit(campaign)}
                  className="rounded-lg border border-[#FF6B35] px-4 py-2 text-sm font-medium text-[#FF6B35] hover:bg-[#FFF5F2]"
                >
                  Edit
                </button>
              )}
              {campaign.status === 'draft' && (
                <button
                  onClick={async () => {
                    await startCampaign.mutateAsync();
                  }}
                  className="rounded-lg bg-[#22C55E] px-4 py-2 text-sm font-medium text-white hover:bg-[#16A34A]"
                >
                  Start Campaign
                </button>
              )}
              {campaign.status === 'active' && (
                <button
                  onClick={async () => {
                    await pauseCampaign.mutateAsync();
                  }}
                  className="rounded-lg bg-[#F59E0B] px-4 py-2 text-sm font-medium text-white hover:bg-[#D97706]"
                >
                  Pause Campaign
                </button>
              )}
              {campaign.status === 'paused' && (
                <button
                  onClick={async () => {
                    await resumeCampaign.mutateAsync();
                  }}
                  className="rounded-lg bg-[#22C55E] px-4 py-2 text-sm font-medium text-white hover:bg-[#16A34A]"
                >
                  Resume Campaign
                </button>
              )}
              <button
                onClick={() => {
                  setCloneName(`${campaign.name} (Copy)`);
                  setShowCloneDialog(true);
                }}
                className="rounded-lg border border-[#64748B] px-4 py-2 text-sm font-medium text-[#64748B] hover:bg-[#F8FAFC]"
              >
                Clone
              </button>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="rounded-lg border border-[#EF4444] px-4 py-2 text-sm font-medium text-[#EF4444] hover:bg-[#FEF2F2]"
              >
                Delete
              </button>
            </div>
          </div>

          {/* Delete Confirmation */}
          {showDeleteModal && (
            <DeleteCampaignModal
              campaignName={campaign.name}
              onClose={() => setShowDeleteModal(false)}
              onConfirm={handleDelete}
              isDeleting={deleteCampaign.isPending}
            />
          )}

          {/* Clone Dialog */}
          {showCloneDialog && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
              <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
                <h3 className="mb-4 text-lg font-semibold text-[#1E293B]">Clone Campaign</h3>
                <p className="mb-4 text-sm text-[#64748B]">
                  This will create a new campaign with the same sequence and senders, but no leads.
                </p>
                <div className="mb-4">
                  <label className="mb-2 block text-sm font-medium text-[#1E293B]">
                    New Campaign Name
                  </label>
                  <input
                    type="text"
                    value={cloneName}
                    onChange={(e) => setCloneName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleClone();
                    }}
                    className="w-full rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm focus:border-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20"
                    placeholder="Enter campaign name"
                    autoFocus
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => {
                      setShowCloneDialog(false);
                      setCloneName('');
                    }}
                    className="rounded-lg border border-[#E2E8F0] px-4 py-2 text-sm font-medium text-[#64748B] hover:bg-[#F8FAFC]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleClone}
                    disabled={!cloneName.trim()}
                    className="rounded-lg bg-[#FF6B35] px-4 py-2 text-sm font-medium text-white hover:bg-[#E85A2A] disabled:opacity-50"
                  >
                    Clone Campaign
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              {/* Campaign Controls */}
              {campaign.status !== 'completed' && (
                <div>
                  <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[#64748B]">
                    Campaign Controls
                  </h3>
                  <div className="space-y-4 rounded-lg border border-[#E2E8F0] bg-white p-4">
                    {/* Pause New Outreach Toggle */}
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-[#1E293B]">Pause New Outreach</p>
                        <p className="text-xs text-[#64748B]">
                          Stop sending to new leads. Leads already in the sequence will continue.
                        </p>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={pauseNewSends}
                        onClick={async () => {
                          const newValue = !pauseNewSends;
                          setPauseNewSends(newValue);
                          try {
                            await updateCampaign.mutateAsync({ pause_new_sends: newValue });
                          } catch {
                            setPauseNewSends(!newValue);
                          }
                        }}
                        disabled={updateCampaign.isPending}
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 ${
                          pauseNewSends ? 'bg-[#F59E0B]' : 'bg-[#E2E8F0]'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                            pauseNewSends ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {pauseNewSends && (
                      <div className="rounded-md bg-[#FFFBEB] px-3 py-2 text-xs text-[#92400E]">
                        New outreach is paused. New leads are held in place and will resume when you
                        turn this off.
                      </div>
                    )}

                    {/* Daily Connection Limit */}
                    <div className="border-t border-[#F1F5F9] pt-4">
                      <p className="text-sm font-medium text-[#1E293B]">Daily Connection Limit</p>
                      <p className="mb-3 text-xs text-[#64748B]">
                        Max connection requests per day for this campaign (max {maxDailyLimit}).
                        Leave empty for no cap.
                      </p>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="1"
                          max={maxDailyLimit}
                          placeholder="No limit"
                          value={dailyLimitInput}
                          onChange={(e) => {
                            const raw = e.target.value;
                            if (raw === '') {
                              setDailyLimitInput('');
                            } else {
                              const num = parseInt(raw, 10);
                              setDailyLimitInput(
                                String(isNaN(num) ? '' : Math.min(num, maxDailyLimit))
                              );
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              (e.target as HTMLInputElement).blur();
                            }
                          }}
                          className="w-24 rounded-lg border border-[#E2E8F0] px-3 py-1.5 text-center text-sm focus:border-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20"
                        />
                        <span className="text-xs text-[#94A3B8]">/day</span>
                        <button
                          type="button"
                          onClick={async () => {
                            const val = dailyLimitInput.trim();
                            const newLimit = val === '' ? null : parseInt(val, 10);
                            if (newLimit !== null && (newLimit < 1 || isNaN(newLimit))) return;
                            try {
                              await updateCampaign.mutateAsync({
                                daily_connection_limit: newLimit,
                              });
                              showSuccessToast('Saved', 'Daily connection limit updated');
                            } catch (err) {
                              const axiosErr = err as { message?: string };
                              showErrorToast(
                                'Invalid limit',
                                axiosErr?.message || 'Failed to update limit'
                              );
                            }
                          }}
                          disabled={updateCampaign.isPending}
                          className="rounded-md bg-[#FF6B35] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#E85A2A] disabled:opacity-50"
                        >
                          {updateCampaign.isPending ? 'Saving...' : 'Save'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Steps Section - Visual Tree */}
              <div>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[#64748B]">
                  Sequence ({steps.filter((s) => s.type !== 'end').length} steps)
                </h3>
                {steps.length === 0 ? (
                  <div className="rounded-lg border border-[#E2E8F0] p-4 text-center text-sm text-[#64748B]">
                    No steps configured yet
                  </div>
                ) : (
                  <div className="rounded-lg border border-[#E2E8F0] bg-[#FAFBFC] p-6">
                    <div className="flex flex-col items-center">
                      {/* Campaign Start */}
                      <div className="flex items-center gap-2 text-[#1E293B]">
                        <svg
                          className="h-5 w-5 text-[#22C55E]"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
                          />
                        </svg>
                        <span className="font-medium">Campaign Start</span>
                      </div>

                      {/* Steps - filter out end steps (they are branch terminators) */}
                      {steps
                        .filter((s) => s.type !== 'end')
                        .map((step) => (
                          <div key={step.id} className="flex flex-col items-center">
                            {/* Connector Line */}
                            <div className="h-6 w-0.5 bg-[#CBD5E1]" />

                            {/* Step Node */}
                            <SequenceStepNode step={step} />
                          </div>
                        ))}

                      {/* End connector */}
                      <div className="h-6 w-0.5 bg-[#CBD5E1]" />

                      {/* Campaign End */}
                      <div className="flex items-center gap-2 rounded-full border-2 border-[#E2E8F0] bg-white px-4 py-2">
                        <svg
                          className="h-4 w-4 text-[#64748B]"
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
                        <span className="text-sm font-medium text-[#64748B]">End</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Senders Section */}
              <div>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[#64748B]">
                  Senders ({senders.length})
                </h3>
                {senders.length === 0 ? (
                  <div className="rounded-lg border border-[#E2E8F0] p-4 text-center text-sm text-[#64748B]">
                    No senders assigned yet
                  </div>
                ) : (
                  <div className="space-y-2">
                    {senders.map((sender) => (
                      <div
                        key={sender.id}
                        className="flex items-center gap-3 rounded-lg border border-[#E2E8F0] bg-white p-3"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0A66C2] text-white">
                          <LinkedInIcon className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-[#1E293B]">LinkedIn Account</p>
                          <p className="text-xs text-[#64748B]">
                            {sender.linkedin_account_id.slice(0, 8)}...
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Leads Section */}
              <div>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[#64748B]">
                  Leads ({leadCount})
                </h3>
                <div className="rounded-lg border border-[#E2E8F0] p-4">
                  <p className="text-sm text-[#64748B]">
                    {leadCount} leads assigned to this campaign
                  </p>
                </div>
              </div>

              {/* Progress Tracking Section - only show for active/paused campaigns */}
              {(campaign.status === 'active' || campaign.status === 'paused') && (
                <div>
                  <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[#64748B]">
                    Progress Tracking
                  </h3>
                  <CampaignProgressView campaignId={campaign.id} />
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>,
    document.body
  );
}

// Step node component for visual sequence display
function SequenceStepNode({ step }: { step: { type: string; config: Record<string, unknown> } }) {
  const stepConfigs: Record<
    string,
    { label: string; color: string; icon: React.ReactNode; getDetail?: () => string | null }
  > = {
    profile_view: {
      label: 'View Profile',
      color: '#0A66C2',
      icon: (
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
          />
        </svg>
      ),
    },
    follow: {
      label: 'Follow',
      color: '#0A66C2',
      icon: (
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
          />
        </svg>
      ),
    },
    connection_request: {
      label: 'Connect',
      color: '#0A66C2',
      icon: <LinkedInIcon className="h-4 w-4" />,
      getDetail: () =>
        step.config.message ? String(step.config.message).slice(0, 50) + '...' : null,
    },
    message: {
      label: 'Message',
      color: '#0A66C2',
      icon: (
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
      ),
      getDetail: () =>
        step.config.message ? String(step.config.message).slice(0, 50) + '...' : null,
    },
    wait: {
      label: 'Wait',
      color: '#F59E0B',
      icon: (
        <svg
          className="h-4 w-4"
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
      ),
      getDetail: () => {
        const days = Number(step.config.delay_days) || 0;
        const hours = Number(step.config.delay_hours) || 0;
        if (days === 0 && hours === 0) return null;
        const parts = [];
        if (days > 0) parts.push(`${days} day${days > 1 ? 's' : ''}`);
        if (hours > 0) parts.push(`${hours} hour${hours > 1 ? 's' : ''}`);
        return parts.join(' ');
      },
    },
    condition: {
      label: 'Condition',
      color: '#8B5CF6',
      icon: (
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
      getDetail: () => {
        const condType = step.config.condition_type;
        if (condType === 'connected') return 'If Connected';
        if (condType === 'replied' || condType === 'message_replied') return 'If Message Replied';
        if (condType === 'message_seen') return 'If Message Seen';
        if (condType === 'email_opened' || condType === 'opened') return 'If Email Opened';
        if (condType === 'email_link_clicked') return 'If Email Link Clicked';
        if (condType === 'email_replied') return 'If Email Replied';
        return null;
      },
    },
    email: {
      label: 'Email',
      color: '#14B8A6',
      icon: <EmailIcon className="h-4 w-4" />,
      getDetail: () =>
        step.config.subject ? String(step.config.subject).slice(0, 50) + '...' : null,
    },
    inmail: {
      label: 'InMail',
      color: '#0A66C2',
      icon: <EmailIcon className="h-4 w-4" />,
      getDetail: () =>
        step.config.subject ? String(step.config.subject).slice(0, 50) + '...' : null,
    },
    like_post: {
      label: 'Like Post',
      color: '#0A66C2',
      icon: (
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
          />
        </svg>
      ),
    },
  };

  const config = stepConfigs[step.type] || {
    label: step.type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
    color: '#64748B',
    icon: (
      <svg
        className="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
      </svg>
    ),
  };

  const detail = config.getDetail?.();

  return (
    <div className="inline-flex flex-col items-center gap-1">
      <div className="inline-flex items-center gap-2 rounded-full border-2 border-[#E2E8F0] bg-white px-4 py-2.5">
        <div
          className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: `${config.color}15`, color: config.color }}
        >
          {config.icon}
        </div>
        <span className="whitespace-nowrap text-sm font-medium text-[#1E293B]">{config.label}</span>
      </div>
      {detail && <p className="max-w-[200px] truncate text-xs text-[#64748B]">{detail}</p>}
    </div>
  );
}

// Icons
function PlusIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}

function SearchIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      className={`h-5 w-5 ${className}`}
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

function CampaignIcon({ className = 'w-5 h-5' }: { className?: string }) {
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
        d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
      />
    </svg>
  );
}

function LinkedInIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path d="M16.338 16.338H13.67V12.16c0-.995-.017-2.277-1.387-2.277-1.39 0-1.601 1.086-1.601 2.207v4.248H8.014v-8.59h2.559v1.174h.037c.356-.675 1.227-1.387 2.526-1.387 2.703 0 3.203 1.778 3.203 4.092v4.711zM5.005 6.575a1.548 1.548 0 11-.003-3.096 1.548 1.548 0 01.003 3.096zm-1.337 9.763H6.34v-8.59H3.667v8.59zM17.668 1H2.328C1.595 1 1 1.581 1 2.298v15.403C1 18.418 1.595 19 2.328 19h15.34c.734 0 1.332-.582 1.332-1.299V2.298C19 1.581 18.402 1 17.668 1z" />
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

function CheckIcon({ className = 'w-4 h-4' }: { className?: string }) {
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

function ListIcon({ className = 'w-5 h-5' }: { className?: string }) {
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
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  );
}

function WarningIcon({ className = 'w-5 h-5' }: { className?: string }) {
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

function DeleteCampaignModal({
  campaignName,
  onClose,
  onConfirm,
  isDeleting,
}: {
  campaignName: string;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
}) {
  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
              <svg
                className="h-5 w-5 text-red-600"
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
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[#1E293B]">Delete Campaign</h3>
              <p className="text-sm text-[#64748B]">This action cannot be undone</p>
            </div>
          </div>

          <p className="mb-6 text-sm text-[#64748B]">
            Are you sure you want to delete{' '}
            <span className="font-medium text-[#1E293B]">{campaignName}</span>? All campaign data
            including leads progress and history will be permanently removed.
          </p>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isDeleting}
              className="flex-1 rounded-lg border border-[#E2E8F0] px-4 py-2.5 text-sm font-medium text-[#64748B] hover:bg-[#F8FAFC] disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isDeleting}
              className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              {isDeleting ? (
                <span className="flex items-center justify-center gap-2">
                  <LoadingSpinner />
                  Deleting...
                </span>
              ) : (
                'Delete Campaign'
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}
