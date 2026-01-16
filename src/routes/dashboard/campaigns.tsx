import { createFileRoute, useSearch, useNavigate } from '@tanstack/react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useCallback, useEffect } from 'react';
import {
  SequenceCanvas,
  StepPalette,
  NodeConfigPanel,
  type SequenceNode,
} from '@/components/campaign/SequenceCanvas';
import {
  useCampaigns,
  useCreateCampaign,
  useDeleteCampaign,
  useStartCampaign,
  usePauseCampaign,
  useLeadLists,
  useLinkedInAccounts,
} from '../../lib/hooks/queries';
import type { Campaign, CampaignStatus } from '../../lib/types';
import { api } from '@/lib/api';
import { prepareNodesForSave } from '@/lib/utils/campaignStepMapper';

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
        <EmptyState onCreate={() => setShowCreateModal(true)} />
      ) : (
        <CampaignsList campaigns={filteredCampaigns} onSelect={setSelectedCampaign} />
      )}

      {/* Create Campaign Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateCampaignModal
            onClose={() => {
              setShowCreateModal(false);
              setPreSelectedLeadListId(null);
            }}
            preSelectedLeadListId={preSelectedLeadListId}
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
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
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

        <h2 className="mb-2 text-xl font-bold text-[#1E293B]">No campaigns yet</h2>
        <p className="mb-8 text-[#64748B]">
          Create your first multi-channel campaign. Combine LinkedIn and email touchpoints to
          maximize your reply rates.
        </p>

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
}: {
  campaigns: Campaign[];
  onSelect: (campaign: Campaign) => void;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-[#E2E8F0] bg-white">
      {/* Desktop Table */}
      <div className="hidden overflow-x-auto lg:block">
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
              <CampaignRow key={campaign.id} campaign={campaign} onSelect={onSelect} />
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="divide-y divide-[#E2E8F0] lg:hidden">
        {campaigns.map((campaign) => (
          <CampaignCard key={campaign.id} campaign={campaign} onSelect={onSelect} />
        ))}
      </div>
    </div>
  );
}

function CampaignCard({
  campaign,
  onSelect,
}: {
  campaign: Campaign;
  onSelect: (campaign: Campaign) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const deleteCampaign = useDeleteCampaign();

  const statusColors: Record<string, { bg: string; text: string; dot: string }> = {
    draft: { bg: 'bg-[#F8FAFC]', text: 'text-[#64748B]', dot: 'bg-[#94A3B8]' },
    active: { bg: 'bg-[#F0FDF4]', text: 'text-[#22C55E]', dot: 'bg-[#22C55E]' },
    paused: { bg: 'bg-[#FFFBEB]', text: 'text-[#F59E0B]', dot: 'bg-[#F59E0B]' },
    completed: { bg: 'bg-[#EFF6FF]', text: 'text-[#3B82F6]', dot: 'bg-[#3B82F6]' },
  };

  const status = statusColors[campaign.status] || statusColors.draft;

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this campaign?')) {
      try {
        await deleteCampaign.mutateAsync(campaign.id);
      } catch {
        // Error handling is done in the mutation
      }
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
                    <button className="w-full px-4 py-2 text-left text-sm text-[#1E293B] hover:bg-[#F8FAFC]">
                      View Details
                    </button>
                    <CampaignActionButtons campaign={campaign} onClose={() => setMenuOpen(false)} />
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        handleDelete();
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
  );
}

// Helper component for start/pause buttons
function CampaignActionButtons({ campaign, onClose }: { campaign: Campaign; onClose: () => void }) {
  const startCampaign = useStartCampaign(campaign.id);
  const pauseCampaign = usePauseCampaign(campaign.id);

  if (campaign.status === 'active') {
    return (
      <button
        onClick={async () => {
          onClose();
          await pauseCampaign.mutateAsync();
        }}
        className="w-full px-4 py-2 text-left text-sm text-[#F59E0B] hover:bg-[#FFFBEB]"
      >
        Pause Campaign
      </button>
    );
  }

  if (campaign.status !== 'completed') {
    return (
      <button
        onClick={async () => {
          onClose();
          await startCampaign.mutateAsync();
        }}
        className="w-full px-4 py-2 text-left text-sm text-[#22C55E] hover:bg-[#F0FDF4]"
      >
        Start Campaign
      </button>
    );
  }

  return null;
}

function CampaignRow({
  campaign,
  onSelect,
}: {
  campaign: Campaign;
  onSelect: (campaign: Campaign) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const deleteCampaign = useDeleteCampaign();

  const statusColors: Record<string, { bg: string; text: string; dot: string }> = {
    draft: { bg: 'bg-[#F8FAFC]', text: 'text-[#64748B]', dot: 'bg-[#94A3B8]' },
    active: { bg: 'bg-[#F0FDF4]', text: 'text-[#22C55E]', dot: 'bg-[#22C55E]' },
    paused: { bg: 'bg-[#FFFBEB]', text: 'text-[#F59E0B]', dot: 'bg-[#F59E0B]' },
    completed: { bg: 'bg-[#EFF6FF]', text: 'text-[#3B82F6]', dot: 'bg-[#3B82F6]' },
  };

  const status = statusColors[campaign.status] || statusColors.draft;

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this campaign?')) {
      try {
        await deleteCampaign.mutateAsync(campaign.id);
      } catch {
        // Error handling is done in the mutation
      }
    }
  };

  return (
    <tr
      className="cursor-pointer transition-colors hover:bg-[#F8FAFC]"
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
                  <button className="w-full px-4 py-2 text-left text-sm text-[#1E293B] hover:bg-[#F8FAFC]">
                    View Details
                  </button>
                  <CampaignActionButtons campaign={campaign} onClose={() => setMenuOpen(false)} />
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      handleDelete();
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
  );
}

function CreateCampaignModal({
  onClose,
  preSelectedLeadListId,
}: {
  onClose: () => void;
  preSelectedLeadListId?: string | null;
}) {
  const createCampaign = useCreateCampaign();
  const { data: leadListsData, isLoading: leadListsLoading } = useLeadLists();
  const leadLists = leadListsData?.lists || [];
  const { data: linkedInAccounts = [], isLoading: accountsLoading } = useLinkedInAccounts();
  // If we have a pre-selected lead list, start at 'leads' step so user can confirm or change it
  const [step, setStep] = useState<'name' | 'leads' | 'sequence' | 'senders' | 'review'>(
    preSelectedLeadListId ? 'leads' : 'name'
  );
  const [campaignName, setCampaignName] = useState('');
  const [campaignDescription, setCampaignDescription] = useState('');
  const [selectedLeadListId, setSelectedLeadListId] = useState<string | null>(
    preSelectedLeadListId || null
  );
  const [selectedSenderIds, setSelectedSenderIds] = useState<string[]>([]);
  const [sequenceNodes, setSequenceNodes] = useState<SequenceNode[]>([
    { id: 'start', type: 'start', data: {} },
    { id: 'end', type: 'end', data: {} },
  ]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedNode = sequenceNodes.find((n) => n.id === selectedNodeId) || null;

  const handleAddStep = useCallback(
    (type: SequenceNode['type']) => {
      const newNode: SequenceNode = {
        id: `node-${Date.now()}`,
        type,
        data:
          type === 'delay'
            ? { delayDays: 1, delayHours: 0 }
            : type === 'condition'
              ? { condition: 'connected' }
              : {},
      };
      // Insert before the end node
      const endIndex = sequenceNodes.findIndex((n) => n.type === 'end');
      if (endIndex !== -1) {
        const newNodes = [...sequenceNodes];
        newNodes.splice(endIndex, 0, newNode);
        setSequenceNodes(newNodes);
      } else {
        setSequenceNodes([...sequenceNodes, newNode]);
      }
    },
    [sequenceNodes]
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

  const stepConfigs = [
    { id: 'name', label: 'Name', number: 1 },
    { id: 'leads', label: 'Leads', number: 2 },
    { id: 'sequence', label: 'Sequence', number: 3 },
    { id: 'senders', label: 'Senders', number: 4 },
    { id: 'review', label: 'Review', number: 5 },
  ];

  const currentStepIndex = stepConfigs.findIndex((s) => s.id === step);

  const handleCreate = async () => {
    setError(null);
    try {
      // Step 1: Create the campaign
      const campaign = await createCampaign.mutateAsync({
        name: campaignName,
      });

      // Step 2: Save all sequence steps
      const stepsToSave = prepareNodesForSave(sequenceNodes);

      if (stepsToSave.length > 0) {
        // Create steps sequentially to maintain order
        for (const stepData of stepsToSave) {
          await api.post(`/campaigns/${campaign.id}/steps`, stepData);
        }
      }

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create campaign');
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
        className={`flex max-h-[95vh] w-full flex-col overflow-hidden rounded-2xl bg-white shadow-xl ${
          step === 'sequence' ? 'max-w-7xl' : 'max-w-3xl'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E2E8F0] px-6 py-4">
          <h2 className="text-lg font-bold text-[#1E293B]">Create Campaign</h2>
          <button onClick={onClose} className="rounded-lg p-2 hover:bg-[#F8FAFC]">
            <CloseIcon />
          </button>
        </div>

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
                  <h3 className="mb-1 text-lg font-semibold text-[#1E293B]">Name your campaign</h3>
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
                <div>
                  <h3 className="mb-1 text-lg font-semibold text-[#1E293B]">Select your leads</h3>
                  <p className="text-sm text-[#64748B]">
                    Choose a lead list to target with this campaign.
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
                            selectedLeadListId === list.id ? 'bg-[#FF6B35]' : 'bg-[#F8FAFC]'
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
                )}
                <button className="w-full rounded-xl border-2 border-dashed border-[#E2E8F0] p-4 text-center transition-colors hover:border-[#FF6B35]/50 hover:bg-[#FFF7ED]/50">
                  <PlusIcon className="mx-auto mb-1 h-5 w-5 text-[#94A3B8]" />
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
                className="-m-6 h-full"
              >
                {/* Mobile Layout - Stacked */}
                <div className="relative flex h-[calc(100vh-200px)] min-h-[500px] flex-col bg-[#FAFBFC] lg:hidden">
                  {/* Mobile Step Palette - Horizontal scroll */}
                  <div className="border-b border-[#E2E8F0] bg-white p-3">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">
                      Add Steps
                    </p>
                    <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2">
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
                          className="flex-shrink-0 rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 transition-all hover:border-[#FF6B35]/30"
                        >
                          <span className="text-xs font-medium" style={{ color: item.color }}>
                            {item.label}
                          </span>
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
                          />
                        </motion.div>
                      )}
                  </AnimatePresence>
                </div>

                {/* Desktop Layout - Side by side */}
                <div className="hidden h-[70vh] max-h-[800px] min-h-[500px] overflow-hidden rounded-lg border border-[#E2E8F0] bg-[#FAFBFC] lg:flex">
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
                    {selectedNode &&
                      selectedNode.type !== 'start' &&
                      selectedNode.type !== 'end' && (
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
                  <h3 className="mb-1 text-lg font-semibold text-[#1E293B]">Assign senders</h3>
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
                    <div className="max-h-[300px] space-y-2 overflow-y-auto">
                      {linkedInAccounts.map((account) => {
                        const isSelected = selectedSenderIds.includes(account.id);
                        return (
                          <motion.div
                            key={account.id}
                            onClick={() => {
                              if (isSelected) {
                                setSelectedSenderIds((ids) =>
                                  ids.filter((id) => id !== account.id)
                                );
                              } else {
                                setSelectedSenderIds((ids) => [...ids, account.id]);
                              }
                            }}
                            className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-all ${
                              isSelected
                                ? 'border-[#0A66C2] bg-[#EFF6FF]'
                                : 'border-[#E2E8F0] hover:border-[#0A66C2]/30 hover:bg-[#F8FAFC]'
                            }`}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                          >
                            {/* Checkbox */}
                            <div
                              className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border-2 transition-colors ${
                                isSelected ? 'border-[#0A66C2] bg-[#0A66C2]' : 'border-[#D1D5DB]'
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
                          </motion.div>
                        );
                      })}
                    </div>

                    {/* Info tip */}
                    <div className="flex items-start gap-2 rounded-lg border border-[#3B82F6]/20 bg-[#F0F9FF] p-3">
                      <InfoIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#3B82F6]" />
                      <p className="text-xs text-[#1E293B]">
                        Selected accounts will auto-rotate to send messages, keeping each within
                        safe daily limits.
                      </p>
                    </div>
                  </div>
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
                    Review your campaign
                  </h3>
                  <p className="text-sm text-[#64748B]">
                    Make sure everything looks good before launching.
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
                      <span className="text-sm text-[#64748B]">Lead List</span>
                      <span className="font-medium text-[#1E293B]">
                        {leadLists.find((l) => l.id === selectedLeadListId)?.name ||
                          'None selected'}
                      </span>
                    </div>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm text-[#64748B]">Sequence Steps</span>
                      <span className="font-medium text-[#1E293B]">
                        {sequenceNodes.filter((n) => n.type !== 'start' && n.type !== 'end').length}{' '}
                        steps
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[#64748B]">Senders</span>
                      <span className="font-medium text-[#1E293B]">
                        {selectedSenderIds.length} selected
                      </span>
                    </div>
                  </div>

                  {selectedSenderIds.length === 0 ? (
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
                  ) : (
                    <div className="flex items-start gap-3 rounded-xl border border-[#22C55E]/20 bg-[#DCFCE7] p-4">
                      <CheckIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#22C55E]" />
                      <div>
                        <p className="text-sm font-medium text-[#166534]">Ready to launch</p>
                        <p className="text-xs text-[#15803D]">
                          {selectedSenderIds.length} sender{selectedSenderIds.length > 1 ? 's' : ''}{' '}
                          will auto-rotate to send messages.
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
            disabled={step === 'name'}
            className="px-4 py-2 font-medium text-[#64748B] disabled:opacity-50"
          >
            Back
          </button>
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
              if (currentIndex < steps.length - 1) {
                setStep(steps[currentIndex + 1]);
              } else {
                handleCreate();
              }
            }}
            disabled={
              (step === 'name' && !campaignName) || (step === 'leads' && !selectedLeadListId)
            }
            className="rounded-lg bg-[#FF6B35] px-6 py-2 font-medium text-white hover:bg-[#E85A2A] disabled:opacity-50"
          >
            {step === 'review' ? 'Create Campaign' : 'Continue'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function CampaignDetailDrawer({ campaign, onClose }: { campaign: Campaign; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/50"
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
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#E2E8F0] px-6 py-4">
            <div>
              <h2 className="text-lg font-bold text-[#1E293B]">{campaign.name}</h2>
              <p className="text-sm text-[#64748B]">Status: {campaign.status}</p>
            </div>
            <button onClick={onClose} className="rounded-lg p-2 hover:bg-[#F8FAFC]">
              <CloseIcon />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="py-12 text-center text-[#64748B]">
              Campaign details would be shown here
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
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
