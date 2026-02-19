import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  useCampaignMetrics,
  useCampaignProgress,
  useLeadBreakdown,
  useCampaignErrors,
  useCampaignActivity,
  useCampaignProgressStream,
} from '@/lib/hooks/queries/useCampaignProgress';
import type {
  CampaignErrors,
  CampaignActivity,
  LeadBreakdown,
  SenderActivityItem,
  StepProgressItem,
} from '@/lib/types';

interface CampaignProgressViewProps {
  campaignId: string;
}

export function CampaignProgressView({ campaignId }: CampaignProgressViewProps) {
  const { data: metrics, isLoading: metricsLoading } = useCampaignMetrics(campaignId);
  const { data: progress, isLoading: progressLoading } = useCampaignProgress(campaignId);
  const { data: breakdown } = useLeadBreakdown(campaignId);
  const { data: errors } = useCampaignErrors(campaignId);
  const { data: activity } = useCampaignActivity(campaignId);

  // Connect to SSE for real-time updates
  const { isConnected } = useCampaignProgressStream(campaignId);

  if (metricsLoading || progressLoading) {
    return <LoadingSkeleton />;
  }

  // Derive sender limit text for Today card
  const senderLimitText = metrics?.sender_activity?.length
    ? (() => {
        const linkedInSenders = metrics.sender_activity.filter((s) => s.channel === 'linkedin');
        const emailSenders = metrics.sender_activity.filter((s) => s.channel === 'email');
        const parts: string[] = [];

        if (linkedInSenders.length > 0) {
          const totalCR = linkedInSenders.reduce((sum, s) => sum + s.connection_requests_today, 0);
          const totalLimit = linkedInSenders.reduce((sum, s) => sum + s.daily_limit, 0);
          if (totalCR >= totalLimit) parts.push(`LinkedIn limit reached (${totalLimit})`);
          else parts.push(`${totalLimit - totalCR} LinkedIn remaining`);
        }
        if (emailSenders.length > 0) {
          const totalEmails = emailSenders.reduce((sum, s) => sum + s.emails_today, 0);
          const totalLimit = emailSenders.reduce((sum, s) => sum + s.email_daily_limit, 0);
          if (totalEmails >= totalLimit) parts.push(`Email limit reached (${totalLimit})`);
          else parts.push(`${totalLimit - totalEmails} emails remaining`);
        }
        return parts.join(' · ') || undefined;
      })()
    : undefined;

  return (
    <div className="space-y-4">
      {/* Status Banner */}
      <StatusBanner
        isConnected={isConnected}
        statusSummary={metrics?.status_summary || ''}
        statusType={metrics?.status_type || 'active'}
      />

      {/* Overall Progress Bar */}
      <ProgressBar
        progress={progress?.overall_progress || 0}
        estimatedCompletion={progress?.estimated_completion || null}
        leadsCompleted={progress?.leads_completed || 0}
        leadsInProgress={progress?.leads_in_progress || 0}
        leadsPending={progress?.leads_pending || 0}
        totalLeads={metrics?.total_leads || 0}
      />

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard label="Total Leads" value={metrics?.total_leads || 0} icon={<UsersIcon />} />
        <MetricCard
          label="Accepted"
          value={
            (metrics?.leads_by_status?.accepted || 0) +
            (metrics?.leads_by_status?.replied || 0) +
            (metrics?.leads_by_status?.qualified || 0)
          }
          subtitle={`${metrics?.leads_by_status?.contacted || 0} awaiting response`}
          icon={<CheckIcon />}
          color="green"
        />
        <MetricCard
          label="Replied"
          value={
            (metrics?.leads_by_status?.replied || 0) + (metrics?.leads_by_status?.qualified || 0)
          }
          subtitle={
            metrics?.leads_by_status?.not_interested
              ? `${metrics.leads_by_status.not_interested} not interested`
              : undefined
          }
          icon={<ClockIcon />}
          color="blue"
        />
        <MetricCard
          label="Sent Today"
          value={metrics?.actions_today || 0}
          subtitle={senderLimitText}
          icon={<TrendingUpIcon />}
          color="purple"
        />
      </div>

      {/* Sender Activity */}
      {metrics?.sender_activity && metrics.sender_activity.length > 0 && (
        <SenderActivityPanel senders={metrics.sender_activity} />
      )}

      {/* Lead Status Distribution */}
      {breakdown && <LeadStatusBreakdown breakdown={breakdown} />}

      {/* Errors Panel */}
      {errors && errors.total_errors > 0 && <ErrorsPanel errors={errors} />}

      {/* Step Funnel */}
      {progress && progress.steps_breakdown.length > 0 && (
        <StepFunnelVisualization
          steps={progress.steps_breakdown}
          processingSpeed={metrics?.processing_speed || 0}
        />
      )}

      {/* Activity Feed */}
      {activity && activity.activities.length > 0 && <ActivityFeed activity={activity} />}
    </div>
  );
}

/* ─── Status Banner ─── */
function StatusBanner({
  isConnected,
  statusSummary,
  statusType,
}: {
  isConnected: boolean;
  statusSummary: string;
  statusType: string;
}) {
  const config: Record<string, { bg: string; border: string; dot: string; text: string }> = {
    active: {
      bg: 'bg-[#F0FDF4]',
      border: 'border-[#22C55E]/20',
      dot: 'bg-[#22C55E]',
      text: 'text-[#166534]',
    },
    at_limit: {
      bg: 'bg-[#FFFBEB]',
      border: 'border-[#F59E0B]/20',
      dot: 'bg-[#F59E0B]',
      text: 'text-[#92400E]',
    },
    waiting: {
      bg: 'bg-[#EFF6FF]',
      border: 'border-[#3B82F6]/20',
      dot: 'bg-[#3B82F6]',
      text: 'text-[#1E40AF]',
    },
    complete: {
      bg: 'bg-[#F0FDF4]',
      border: 'border-[#22C55E]/20',
      dot: 'bg-[#22C55E]',
      text: 'text-[#166534]',
    },
  };

  const style = config[statusType] || config.active;

  return (
    <div
      className={`flex items-center justify-between rounded-lg border px-4 py-2.5 ${style.bg} ${style.border}`}
    >
      <div className="flex items-center gap-2.5">
        <span className="relative flex h-2.5 w-2.5">
          {isConnected && statusType === 'active' && (
            <span
              className={`absolute inline-flex h-full w-full animate-ping rounded-full ${style.dot} opacity-75`}
            />
          )}
          <span
            className={`relative inline-flex h-2.5 w-2.5 rounded-full ${isConnected ? style.dot : 'bg-[#94A3B8]'}`}
          />
        </span>
        <span className={`text-sm font-medium ${style.text}`}>
          {statusSummary || (isConnected ? 'Campaign is running' : 'Connecting...')}
        </span>
      </div>
      {isConnected && <span className="text-xs text-[#94A3B8]">Live</span>}
    </div>
  );
}

/* ─── Sender Activity Panel ─── */
function SenderActivityPanel({ senders }: { senders: SenderActivityItem[] }) {
  const linkedInSenders = senders.filter((s) => s.channel === 'linkedin');
  const emailSenders = senders.filter((s) => s.channel === 'email');

  return (
    <div className="rounded-xl border border-[#E2E8F0] bg-white p-5">
      <h3 className="mb-3 text-base font-semibold text-[#1E293B]">Sender Activity</h3>
      <div className="space-y-3">
        {linkedInSenders.length > 0 && (
          <>
            <p className="text-xs font-medium uppercase tracking-wider text-[#94A3B8]">LinkedIn</p>
            {linkedInSenders.map((sender, index) => {
              const usage = sender.connection_requests_today;
              const limit = sender.daily_limit;
              const percentage = limit > 0 ? Math.min((usage / limit) * 100, 100) : 0;
              const atLimit = usage >= limit;
              const nearLimit = percentage >= 80;

              return (
                <div key={`li-${index}`} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-[#1E293B]">{sender.name}</span>
                    <span
                      className={
                        atLimit
                          ? 'font-semibold text-[#EF4444]'
                          : nearLimit
                            ? 'font-medium text-[#F59E0B]'
                            : 'text-[#64748B]'
                      }
                    >
                      {usage}/{limit} requests today
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-[#F1F5F9]">
                    <motion.div
                      className={`h-full rounded-full ${atLimit ? 'bg-[#EF4444]' : nearLimit ? 'bg-[#F59E0B]' : 'bg-[#3B82F6]'}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>
              );
            })}
          </>
        )}
        {emailSenders.length > 0 && (
          <>
            <p className="text-xs font-medium uppercase tracking-wider text-[#94A3B8]">Email</p>
            {emailSenders.map((sender, index) => {
              const usage = sender.emails_today;
              const limit = sender.email_daily_limit;
              const percentage = limit > 0 ? Math.min((usage / limit) * 100, 100) : 0;
              const atLimit = usage >= limit;
              const nearLimit = percentage >= 80;

              return (
                <div key={`em-${index}`} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-[#1E293B]">{sender.name}</span>
                    <span
                      className={
                        atLimit
                          ? 'font-semibold text-[#EF4444]'
                          : nearLimit
                            ? 'font-medium text-[#F59E0B]'
                            : 'text-[#64748B]'
                      }
                    >
                      {usage}/{limit} emails today
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-[#F1F5F9]">
                    <motion.div
                      className={`h-full rounded-full ${atLimit ? 'bg-[#EF4444]' : nearLimit ? 'bg-[#F59E0B]' : 'bg-[#8B5CF6]'}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}

/* ─── Progress Bar ─── */
function ProgressBar({
  progress,
  estimatedCompletion,
  leadsCompleted,
  leadsInProgress,
  leadsPending,
}: {
  progress: number;
  estimatedCompletion: string | null;
  leadsCompleted: number;
  leadsInProgress: number;
  leadsPending: number;
  totalLeads: number;
}) {
  return (
    <div className="rounded-xl border border-[#E2E8F0] bg-white p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-base font-semibold text-[#1E293B]">Campaign Progress</h3>
        <span className="text-xl font-bold text-[#FF6B35]">{progress.toFixed(1)}%</span>
      </div>

      {/* Single progress bar driven by overall_progress */}
      <div className="mb-3 h-3 w-full overflow-hidden rounded-full bg-[#F1F5F9]">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-[#FF6B35] to-[#FF8F5E]"
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(progress, 100)}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#64748B]">
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-[#22C55E]" />
          {leadsCompleted} completed sequence
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-[#3B82F6]" />
          {leadsInProgress} in sequence
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-[#E2E8F0]" />
          {leadsPending} not started
        </span>
      </div>

      {estimatedCompletion && (
        <p className="mt-2 text-xs text-[#64748B]">
          Est. completion: {new Date(estimatedCompletion).toLocaleString()}
        </p>
      )}
    </div>
  );
}

/* ─── Metric Card ─── */
function MetricCard({
  label,
  value,
  subtitle,
  icon,
  color = 'gray',
  pulse = false,
}: {
  label: string;
  value: number | string;
  subtitle?: string;
  icon: React.ReactNode;
  color?: 'gray' | 'green' | 'blue' | 'purple' | 'orange';
  pulse?: boolean;
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
      className="relative overflow-hidden rounded-xl border border-[#E2E8F0] bg-white p-3"
    >
      {pulse && (
        <motion.div
          className="absolute inset-0 bg-[#3B82F6]/5"
          animate={{ opacity: [0, 0.5, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
      <div className={`mb-1.5 inline-flex rounded-lg p-1.5 ${colorClasses[color]}`}>{icon}</div>
      <p className="text-xl font-bold text-[#1E293B]">{value}</p>
      <p className="text-xs text-[#64748B]">{label}</p>
      {subtitle && <p className="text-[10px] text-[#94A3B8]">{subtitle}</p>}
    </motion.div>
  );
}

/* ─── Lead Status Breakdown ─── */
function LeadStatusBreakdown({ breakdown }: { breakdown: LeadBreakdown }) {
  const statusConfig: Record<string, { color: string; label: string }> = {
    new: { color: '#94A3B8', label: 'New' },
    contacted: { color: '#3B82F6', label: 'Contacted' },
    accepted: { color: '#22C55E', label: 'Accepted' },
    replied: { color: '#14B8A6', label: 'Replied' },
    qualified: { color: '#8B5CF6', label: 'Qualified' },
    not_interested: { color: '#F59E0B', label: 'Not Interested' },
    error: { color: '#EF4444', label: 'Error' },
  };

  return (
    <div className="rounded-xl border border-[#E2E8F0] bg-white p-5">
      <h3 className="mb-3 text-base font-semibold text-[#1E293B]">Lead Status Distribution</h3>
      <div className="space-y-2">
        {breakdown.by_status.map((item) => {
          const config = statusConfig[item.status];
          return (
            <div key={item.status} className="flex items-center gap-3">
              <div
                className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                style={{ backgroundColor: config?.color || '#94A3B8' }}
              />
              <span className="flex-1 text-sm text-[#1E293B]">{config?.label || item.status}</span>
              <span className="text-sm font-semibold text-[#1E293B]">{item.count}</span>
              <span className="w-14 text-right text-xs text-[#64748B]">{item.percentage}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Errors Panel ─── */
function ErrorsPanel({ errors }: { errors: CampaignErrors }) {
  const [expanded, setExpanded] = useState(false);
  const displayed = expanded ? errors.errors : errors.errors.slice(0, 3);

  const stepLabels: Record<string, string> = {
    profile_view: 'Profile View',
    connection_request: 'Connection Request',
    message: 'Message',
    wait: 'Wait',
    condition: 'Condition',
    email: 'Email',
    inmail: 'InMail',
    enrichment: 'Enrichment',
  };

  return (
    <div className="rounded-xl border border-[#EF4444]/20 bg-[#FEF2F2] p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#EF4444]">
            <AlertCircleIcon className="h-3.5 w-3.5 text-white" />
          </div>
          <h3 className="text-base font-semibold text-[#991B1B]">
            {errors.total_errors} Error{errors.total_errors !== 1 ? 's' : ''}
          </h3>
        </div>
        {errors.errors.length > 3 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs font-medium text-[#DC2626] hover:underline"
          >
            {expanded ? 'Show less' : `Show all ${errors.total_errors}`}
          </button>
        )}
      </div>

      <div className="space-y-2">
        <AnimatePresence>
          {displayed.map((error) => (
            <motion.div
              key={error.lead_id}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="rounded-lg bg-white/70 p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[#1E293B]">
                    {error.lead_name || 'Unknown Lead'}
                  </p>
                  <p className="mt-0.5 text-xs text-[#DC2626]">
                    {error.error_message || 'Unknown error'}
                  </p>
                </div>
                <div className="flex flex-shrink-0 flex-col items-end gap-0.5">
                  {error.current_step_type && (
                    <span className="rounded-full bg-[#FEE2E2] px-2 py-0.5 text-[10px] font-medium text-[#991B1B]">
                      {stepLabels[error.current_step_type] || error.current_step_type}
                    </span>
                  )}
                  <span className="text-[10px] text-[#94A3B8]">
                    {error.error_count} attempt{error.error_count !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
              {error.last_error_at && (
                <p className="mt-1 text-[10px] text-[#94A3B8]">
                  {formatTimeAgo(error.last_error_at)}
                </p>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ─── Step Funnel ─── */
function StepFunnelVisualization({
  steps,
  processingSpeed,
}: {
  steps: StepProgressItem[];
  processingSpeed: number;
}) {
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

  const conditionLabels: Record<string, string> = {
    connected: 'Connected?',
    is_connected: 'Connected?',
    accepted: 'Accepted?',
    replied: 'Replied?',
    has_email: 'Has Email?',
    email_opened: 'Email Opened?',
    email_link_clicked: 'Link Clicked?',
  };

  // Filter out 'end' steps from funnel
  const visibleSteps = steps.filter((s) => s.step_type !== 'end');
  const maxLeads = Math.max(...visibleSteps.map((s) => s.leads_at_step + s.leads_completed), 1);

  return (
    <div className="rounded-xl border border-[#E2E8F0] bg-white p-5">
      <h3 className="mb-3 text-base font-semibold text-[#1E293B]">Sequence Funnel</h3>
      <div className="space-y-2">
        {visibleSteps.map((step, index) => {
          const isActive = step.leads_at_step > 0;

          // Estimate time to process active leads at current rate
          const etaText =
            isActive && processingSpeed > 0
              ? formatDuration(step.leads_at_step / processingSpeed)
              : null;

          return (
            <motion.div
              key={step.step_id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="group flex items-center gap-3"
            >
              <span className="w-6 text-center text-xs font-medium text-[#94A3B8]">
                {step.step_order}
              </span>
              <div className="flex-1">
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 font-medium text-[#1E293B]">
                    {step.step_type === 'condition' && step.step_config?.condition_type
                      ? conditionLabels[step.step_config.condition_type as string] ||
                        `Condition: ${step.step_config.condition_type}`
                      : stepTypeLabels[step.step_type] || step.step_type}
                    {isActive && (
                      <motion.span
                        animate={{ scale: [1, 1.3, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="inline-block h-1.5 w-1.5 rounded-full bg-[#3B82F6]"
                      />
                    )}
                  </span>
                  <span className="text-[#64748B]">
                    <span className={isActive ? 'font-semibold text-[#3B82F6]' : ''}>
                      {step.leads_at_step} queued
                    </span>
                    {' / '}
                    <span className={step.leads_completed > 0 ? 'text-[#22C55E]' : ''}>
                      {step.leads_completed} completed
                    </span>
                    {etaText && <span className="ml-1 text-[10px] text-[#94A3B8]">~{etaText}</span>}
                  </span>
                </div>
                <div className="h-5 w-full overflow-hidden rounded-md bg-[#F1F5F9]">
                  <div className="flex h-full">
                    {/* Completed portion */}
                    {step.leads_completed > 0 && (
                      <motion.div
                        className="h-full bg-[#22C55E]/60"
                        initial={{ width: 0 }}
                        animate={{
                          width: `${maxLeads > 0 ? (step.leads_completed / maxLeads) * 100 : 0}%`,
                        }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                      />
                    )}
                    {/* Active portion */}
                    {step.leads_at_step > 0 && (
                      <motion.div
                        className="relative h-full overflow-hidden bg-gradient-to-r from-[#3B82F6] to-[#60A5FA]"
                        initial={{ width: 0 }}
                        animate={{
                          width: `${maxLeads > 0 ? (step.leads_at_step / maxLeads) * 100 : 0}%`,
                        }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                      >
                        {/* Shimmer effect for active steps */}
                        <motion.div
                          className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent"
                          animate={{ translateX: ['-100%', '100%'] }}
                          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                        />
                      </motion.div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Activity Feed ─── */
function ActivityFeed({ activity }: { activity: CampaignActivity }) {
  const [expanded, setExpanded] = useState(false);
  const displayed = expanded ? activity.activities : activity.activities.slice(0, 5);

  const stepLabels: Record<string, string> = {
    profile_view: 'Viewed profile of',
    connection_request: 'Sent connection request to',
    message: 'Sent message to',
    wait: 'Waiting on',
    condition: 'Evaluated condition for',
    email: 'Sent email to',
    inmail: 'Sent InMail to',
    enrichment: 'Enriched',
  };

  const outcomeIcons: Record<string, { icon: string; color: string }> = {
    completed: { icon: '✓', color: '#22C55E' },
    in_progress: { icon: '●', color: '#3B82F6' },
    error: { icon: '✕', color: '#EF4444' },
    skipped: { icon: '→', color: '#F59E0B' },
    branched_true: { icon: '✓', color: '#8B5CF6' },
    branched_false: { icon: '✕', color: '#F59E0B' },
  };

  return (
    <div className="rounded-xl border border-[#E2E8F0] bg-white p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-base font-semibold text-[#1E293B]">Recent Activity</h3>
        {activity.activities.length > 5 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs font-medium text-[#3B82F6] hover:underline"
          >
            {expanded ? 'Show less' : `Show all ${activity.activities.length}`}
          </button>
        )}
      </div>

      <div className="space-y-0">
        <AnimatePresence>
          {displayed.map((item, index) => {
            const outcome = outcomeIcons[item.outcome] || outcomeIcons.in_progress;
            return (
              <motion.div
                key={`${item.lead_id}-${item.timestamp}-${index}`}
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ delay: index * 0.03 }}
                className="flex items-start gap-3 border-b border-[#F1F5F9] py-2 last:border-0"
              >
                {/* Timeline dot */}
                <div className="mt-1.5 flex flex-col items-center">
                  <span
                    className="flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold text-white"
                    style={{ backgroundColor: outcome.color }}
                  >
                    {outcome.icon}
                  </span>
                  {index < displayed.length - 1 && (
                    <div className="mt-0.5 h-full w-px bg-[#E2E8F0]" />
                  )}
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-[#1E293B]">
                    <span className="text-[#64748B]">
                      {item.action_label || stepLabels[item.step_type] || item.step_type}
                    </span>{' '}
                    <span className="font-medium">{item.lead_name || 'Unknown'}</span>
                  </p>
                  <p className="text-[10px] text-[#94A3B8]">{formatTimeAgo(item.timestamp)}</p>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ─── Utilities ─── */
function formatTimeAgo(dateStr: string): string {
  // Backend sends UTC timestamps without 'Z' suffix — append it so JS parses as UTC
  const date = new Date(dateStr.endsWith('Z') ? dateStr : dateStr + 'Z');
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString();
}

function formatDuration(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  if (hours < 24) return `${hours.toFixed(1)}h`;
  return `${Math.round(hours / 24)}d`;
}

function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-10 rounded-lg bg-[#F1F5F9]" />
      <div className="h-28 rounded-xl bg-[#F1F5F9]" />
      <div className="grid grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-20 rounded-xl bg-[#F1F5F9]" />
        ))}
      </div>
      <div className="h-40 rounded-xl bg-[#F1F5F9]" />
    </div>
  );
}

/* ─── Icons ─── */
function UsersIcon() {
  return (
    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
      <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
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
    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
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
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
      />
    </svg>
  );
}

function AlertCircleIcon({ className = 'h-4 w-4' }: { className?: string }) {
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
