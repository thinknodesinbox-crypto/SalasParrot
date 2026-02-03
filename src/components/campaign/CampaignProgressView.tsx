import { motion } from 'framer-motion';
import {
  useCampaignMetrics,
  useCampaignProgress,
  useLeadBreakdown,
  useCampaignProgressStream,
} from '@/lib/hooks/queries/useCampaignProgress';
import type { LeadBreakdown, StepProgressItem } from '@/lib/types';

interface CampaignProgressViewProps {
  campaignId: string;
}

export function CampaignProgressView({ campaignId }: CampaignProgressViewProps) {
  const { data: metrics, isLoading: metricsLoading } = useCampaignMetrics(campaignId);
  const { data: progress, isLoading: progressLoading } = useCampaignProgress(campaignId);
  const { data: breakdown, isLoading: breakdownLoading } = useLeadBreakdown(campaignId);

  // Connect to SSE for real-time updates
  const { isConnected } = useCampaignProgressStream(campaignId);

  if (metricsLoading || progressLoading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Real-time connection indicator */}
      <div className="flex items-center gap-2 text-sm text-[#64748B]">
        <span className={`h-2 w-2 rounded-full ${isConnected ? 'bg-[#22C55E]' : 'bg-[#94A3B8]'}`} />
        {isConnected ? 'Live updates' : 'Connecting...'}
      </div>

      {/* Overall Progress Bar */}
      <div className="rounded-xl border border-[#E2E8F0] bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-[#1E293B]">Campaign Progress</h3>
          <span className="text-2xl font-bold text-[#FF6B35]">
            {progress?.overall_progress.toFixed(1)}%
          </span>
        </div>
        <div className="h-4 w-full overflow-hidden rounded-full bg-[#F1F5F9]">
          <motion.div
            className="h-full bg-gradient-to-r from-[#FF6B35] to-[#FF8F5C]"
            initial={{ width: 0 }}
            animate={{ width: `${progress?.overall_progress || 0}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
        {progress?.estimated_completion && (
          <p className="mt-2 text-sm text-[#64748B]">
            Estimated completion: {new Date(progress.estimated_completion).toLocaleString()}
          </p>
        )}
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <MetricCard label="Total Leads" value={metrics?.total_leads || 0} icon={<UsersIcon />} />
        <MetricCard
          label="Completed"
          value={progress?.leads_completed || 0}
          icon={<CheckIcon />}
          color="green"
        />
        <MetricCard
          label="In Progress"
          value={progress?.leads_in_progress || 0}
          icon={<ClockIcon />}
          color="blue"
        />
        <MetricCard
          label="Processing Rate"
          value={`${metrics?.processing_speed?.toFixed(1) || 0}/hr`}
          icon={<TrendingUpIcon />}
          color="purple"
        />
      </div>

      {/* Lead Status Breakdown */}
      {breakdown && !breakdownLoading && <LeadStatusBreakdown breakdown={breakdown} />}

      {/* Step Funnel Visualization */}
      {progress && progress.steps_breakdown.length > 0 && (
        <StepFunnelVisualization steps={progress.steps_breakdown} />
      )}
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon,
  color = 'gray',
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  color?: 'gray' | 'green' | 'blue' | 'purple' | 'orange';
}) {
  const colorClasses = {
    gray: 'bg-[#F8FAFC] text-[#64748B]',
    green: 'bg-[#F0FDF4] text-[#22C55E]',
    blue: 'bg-[#EFF6FF] text-[#3B82F6]',
    purple: 'bg-[#F5F3FF] text-[#8B5CF6]',
    orange: 'bg-[#FFF7ED] text-[#FF6B35]',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-[#E2E8F0] bg-white p-4"
    >
      <div className={`mb-2 inline-flex rounded-lg p-2 ${colorClasses[color]}`}>{icon}</div>
      <p className="text-2xl font-bold text-[#1E293B]">{value}</p>
      <p className="text-sm text-[#64748B]">{label}</p>
    </motion.div>
  );
}

function LeadStatusBreakdown({ breakdown }: { breakdown: LeadBreakdown }) {
  const statusColors: Record<string, string> = {
    new: '#94A3B8',
    contacted: '#3B82F6',
    accepted: '#22C55E',
    replied: '#14B8A6',
    qualified: '#8B5CF6',
    not_interested: '#F59E0B',
    error: '#EF4444',
  };

  const statusLabels: Record<string, string> = {
    new: 'New',
    contacted: 'Contacted',
    accepted: 'Accepted',
    replied: 'Replied',
    qualified: 'Qualified',
    not_interested: 'Not Interested',
    error: 'Error',
  };

  return (
    <div className="rounded-xl border border-[#E2E8F0] bg-white p-6">
      <h3 className="mb-4 text-lg font-semibold text-[#1E293B]">Lead Status Distribution</h3>
      <div className="space-y-3">
        {breakdown.by_status.map((item) => (
          <div key={item.status} className="flex items-center gap-3">
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: statusColors[item.status] || '#94A3B8' }}
            />
            <span className="flex-1 text-[#1E293B]">
              {statusLabels[item.status] || item.status}
            </span>
            <span className="font-medium text-[#1E293B]">{item.count}</span>
            <span className="w-16 text-right text-sm text-[#64748B]">{item.percentage}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StepFunnelVisualization({ steps }: { steps: StepProgressItem[] }) {
  const stepTypeLabels: Record<string, string> = {
    connection_request: 'Connection Request',
    message: 'Message',
    inmail: 'InMail',
    profile_view: 'Profile View',
    wait: 'Wait',
    condition: 'Condition',
    email: 'Email',
    email_followup: 'Email Follow-up',
    end: 'End',
    enrichment: 'Email Enrichment',
  };

  const maxLeads = Math.max(...steps.map((s) => s.leads_at_step + s.leads_completed), 1);

  return (
    <div className="rounded-xl border border-[#E2E8F0] bg-white p-6">
      <h3 className="mb-4 text-lg font-semibold text-[#1E293B]">Sequence Funnel</h3>
      <div className="space-y-2">
        {steps.map((step, index) => {
          const total = step.leads_at_step + step.leads_completed;
          const width = maxLeads > 0 ? (total / maxLeads) * 100 : 0;

          return (
            <motion.div
              key={step.step_id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center gap-3"
            >
              <span className="w-8 text-center text-sm font-medium text-[#64748B]">
                {step.step_order}
              </span>
              <div className="flex-1">
                <div className="mb-1 flex justify-between text-sm">
                  <span className="text-[#1E293B]">
                    {stepTypeLabels[step.step_type] || step.step_type}
                  </span>
                  <span className="text-[#64748B]">
                    {step.leads_at_step} active / {step.leads_completed} done
                  </span>
                </div>
                <div className="h-6 w-full overflow-hidden rounded-lg bg-[#F1F5F9]">
                  <motion.div
                    className="h-full bg-gradient-to-r from-[#3B82F6] to-[#60A5FA]"
                    initial={{ width: 0 }}
                    animate={{ width: `${width}%` }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-32 rounded-xl bg-[#F1F5F9]" />
      <div className="grid grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 rounded-xl bg-[#F1F5F9]" />
        ))}
      </div>
      <div className="h-64 rounded-xl bg-[#F1F5F9]" />
    </div>
  );
}

// Icon components
function UsersIcon() {
  return (
    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
      <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
      <path
        fillRule="evenodd"
        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function TrendingUpIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
      />
    </svg>
  );
}
