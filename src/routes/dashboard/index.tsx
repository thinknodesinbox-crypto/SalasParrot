import { createFileRoute, Link } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  useDashboardStats,
  useDashboardChart,
  useDashboardActivity,
  useDashboardCampaigns,
} from '../../lib/hooks/queries';
import { useAuthStore } from '../../lib/auth';
import type { PartnerAccessInfo } from '../../lib/types';

export const Route = createFileRoute('/dashboard/')({
  component: DashboardHome,
});

function DashboardHome() {
  const [dateRange, setDateRange] = useState('7d');
  const [dismissedPartnerBanner, setDismissedPartnerBanner] = useState(false);
  const { user } = useAuthStore();

  // Show toast when trial is started (check URL params)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const billing = params.get('billing');
    const partnerCode = params.get('partner');
    if (billing === 'success') {
      toast.success('Welcome! Your subscription is now active.', {
        duration: 5000,
        icon: '🎉',
      });
      // Clean up URL
      window.history.replaceState({}, '', '/dashboard');
    }
    if (partnerCode === 'activated') {
      toast.success('Partner access activated! Enjoy your benefits.', {
        duration: 5000,
        icon: '🎉',
      });
      // Clean up URL
      window.history.replaceState({}, '', '/dashboard');
    }
  }, []);

  // Fetch real data
  const { data: statsData, isLoading: statsLoading } = useDashboardStats(dateRange);
  const { data: chartData, isLoading: chartLoading } = useDashboardChart(dateRange);
  const { data: activityData, isLoading: activityLoading } = useDashboardActivity(5);
  const { data: campaignsData, isLoading: campaignsLoading } = useDashboardCampaigns();

  // Transform stats data for display
  const stats = statsData
    ? [
        {
          label: 'Connections Sent',
          value: statsData.connections_sent,
          change: statsData.connections_sent_change,
          color: '#3B82F6',
        },
        {
          label: 'Connections Accepted',
          value: statsData.connections_accepted,
          change: statsData.connections_accepted_change,
          rate: statsData.acceptance_rate,
          color: '#22C55E',
        },
        {
          label: 'Messages Sent',
          value: statsData.messages_sent,
          change: statsData.messages_sent_change,
          color: '#F59E0B',
        },
        {
          label: 'Message Replies',
          value: statsData.message_replies,
          rate: statsData.message_reply_rate,
          color: '#8B5CF6',
        },
        {
          label: 'Emails Sent',
          value: statsData.emails_sent,
          change: statsData.emails_sent_change,
          color: '#FF6B35',
        },
        {
          label: 'Email Replies',
          value: statsData.email_replies,
          rate: statsData.email_reply_rate,
          color: '#14B8A6',
        },
      ]
    : [];

  const recentActivity = activityData || [];
  const activeCampaigns = campaignsData || [];

  return (
    <div className="space-y-6">
      {/* Partner Access Banner */}
      {user?.partner_access && !dismissedPartnerBanner && (
        <PartnerAccessBanner
          partnerAccess={user.partner_access}
          onDismiss={() => setDismissedPartnerBanner(true)}
        />
      )}

      {/* Page Header */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center sm:gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#1E293B] sm:text-2xl">Dashboard</h1>
          <p className="mt-1 text-sm text-[#64748B] sm:text-base">
            Welcome back! Here's what's happening with your outreach.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="w-full rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-sm text-[#1E293B] focus:border-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 sm:w-auto sm:px-4"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-6">
        {statsLoading
          ? Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="animate-pulse rounded-xl border border-[#E2E8F0] bg-white p-3 md:p-4"
              >
                <div className="mb-1.5 flex items-center gap-1.5 md:mb-2 md:gap-2">
                  <div className="h-2 w-2 rounded-full bg-[#E2E8F0]" />
                  <div className="h-3 w-20 rounded bg-[#E2E8F0]" />
                </div>
                <div className="flex items-baseline gap-1 sm:gap-2">
                  <div className="h-7 w-12 rounded bg-[#E2E8F0]" />
                  <div className="h-4 w-10 rounded bg-[#E2E8F0]" />
                </div>
              </div>
            ))
          : stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="rounded-xl border border-[#E2E8F0] bg-white p-3 transition-colors hover:border-[#FF6B35]/30 md:p-4"
              >
                <div className="mb-1.5 flex items-center gap-1.5 md:mb-2 md:gap-2">
                  <div
                    className="h-2 w-2 flex-shrink-0 rounded-full"
                    style={{ backgroundColor: stat.color }}
                  />
                  <span className="truncate text-[10px] font-medium text-[#64748B] sm:text-xs">
                    {stat.label}
                  </span>
                </div>
                <div className="flex items-baseline gap-1 sm:gap-2">
                  <span className="text-xl font-bold text-[#1E293B] sm:text-2xl">{stat.value}</span>
                  {stat.rate && (
                    <span
                      className={`text-[10px] font-medium sm:text-xs ${stat.rate.startsWith('-') ? 'text-[#EF4444]' : 'text-[#22C55E]'}`}
                    >
                      {stat.rate}
                    </span>
                  )}
                  {stat.change && (
                    <span
                      className={`text-[10px] font-medium sm:text-xs ${stat.change.startsWith('-') ? 'text-[#EF4444]' : 'text-[#22C55E]'}`}
                    >
                      {stat.change}
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-4 md:gap-6 lg:grid-cols-3">
        {/* Activity Chart Placeholder */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="rounded-xl border border-[#E2E8F0] bg-white p-4 md:p-6 lg:col-span-2"
        >
          <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center md:mb-6">
            <h2 className="text-base font-semibold text-[#1E293B] md:text-lg">Activity Overview</h2>
            <div className="flex items-center gap-3 text-xs sm:gap-4 sm:text-sm">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-[#3B82F6] sm:h-3 sm:w-3" />
                <span className="text-[#64748B]">Connections</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-[#FF6B35] sm:h-3 sm:w-3" />
                <span className="text-[#64748B]">Emails</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-[#22C55E] sm:h-3 sm:w-3" />
                <span className="text-[#64748B]">Replies</span>
              </div>
            </div>
          </div>

          {/* Chart Area */}
          <div className="flex h-48 items-end justify-between gap-1 px-0 sm:gap-2 sm:px-4 md:h-64">
            {chartLoading ? (
              // Loading skeleton
              Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="flex flex-1 flex-col items-center gap-1 sm:gap-2">
                  <div className="flex h-36 w-full items-end justify-center gap-0.5 sm:gap-1 md:h-48">
                    <div
                      className="w-2 animate-pulse rounded-t-sm bg-[#E2E8F0] sm:w-3"
                      style={{ height: '40%' }}
                    />
                    <div
                      className="w-2 animate-pulse rounded-t-sm bg-[#E2E8F0] sm:w-3"
                      style={{ height: '30%' }}
                    />
                    <div
                      className="w-2 animate-pulse rounded-t-sm bg-[#E2E8F0] sm:w-3"
                      style={{ height: '20%' }}
                    />
                  </div>
                  <div className="h-3 w-6 animate-pulse rounded bg-[#E2E8F0]" />
                </div>
              ))
            ) : chartData?.labels?.length ? (
              chartData.labels.map((label, i) => {
                // Calculate heights as percentages based on max value
                const maxConnections = Math.max(...(chartData.connections || []), 1);
                const maxEmails = Math.max(...(chartData.emails || []), 1);
                const maxReplies = Math.max(...(chartData.replies || []), 1);
                const maxVal = Math.max(maxConnections, maxEmails, maxReplies, 1);

                const connectionHeight = ((chartData.connections?.[i] || 0) / maxVal) * 100;
                const emailHeight = ((chartData.emails?.[i] || 0) / maxVal) * 100;
                const replyHeight = ((chartData.replies?.[i] || 0) / maxVal) * 100;

                return (
                  <div key={label} className="flex flex-1 flex-col items-center gap-1 sm:gap-2">
                    <div className="flex h-36 w-full items-end justify-center gap-0.5 sm:gap-1 md:h-48">
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${Math.max(connectionHeight, 2)}%` }}
                        transition={{ duration: 0.5, delay: i * 0.05 }}
                        className="w-2 rounded-t-sm bg-[#3B82F6] sm:w-3"
                        title={`Connections: ${chartData.connections?.[i] || 0}`}
                      />
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${Math.max(emailHeight, 2)}%` }}
                        transition={{ duration: 0.5, delay: i * 0.05 + 0.1 }}
                        className="w-2 rounded-t-sm bg-[#FF6B35] sm:w-3"
                        title={`Emails: ${chartData.emails?.[i] || 0}`}
                      />
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${Math.max(replyHeight, 2)}%` }}
                        transition={{ duration: 0.5, delay: i * 0.05 + 0.2 }}
                        className="w-2 rounded-t-sm bg-[#22C55E] sm:w-3"
                        title={`Replies: ${chartData.replies?.[i] || 0}`}
                      />
                    </div>
                    <span className="text-[10px] text-[#94A3B8] sm:text-xs">{label}</span>
                  </div>
                );
              })
            ) : (
              // Empty state
              <div className="flex h-full w-full flex-col items-center justify-center text-[#94A3B8]">
                <p className="text-sm">No activity data yet</p>
                <p className="text-xs">Start a campaign to see your activity here</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="rounded-xl border border-[#E2E8F0] bg-white p-4 md:p-6"
        >
          <h2 className="mb-3 text-base font-semibold text-[#1E293B] md:mb-4 md:text-lg">
            Recent Activity
          </h2>
          <div className="space-y-3 md:space-y-4">
            {activityLoading ? (
              // Loading skeleton
              Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="flex animate-pulse items-start gap-2 sm:gap-3">
                  <div className="h-7 w-7 flex-shrink-0 rounded-full bg-[#E2E8F0] sm:h-8 sm:w-8" />
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 h-3 w-24 rounded bg-[#E2E8F0]" />
                    <div className="h-2 w-16 rounded bg-[#E2E8F0]" />
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <div className="h-5 w-16 rounded-full bg-[#E2E8F0]" />
                    <div className="mt-1 h-2 w-12 rounded bg-[#E2E8F0]" />
                  </div>
                </div>
              ))
            ) : recentActivity.length > 0 ? (
              recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start gap-2 sm:gap-3">
                  <div
                    className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full sm:h-8 sm:w-8 ${
                      activity.status === 'accepted'
                        ? 'bg-[#F0FDF4]'
                        : activity.status === 'replied'
                          ? 'bg-[#FFF7ED]'
                          : activity.status === 'sent'
                            ? 'bg-[#EFF6FF]'
                            : 'bg-[#F8FAFC]'
                    }`}
                  >
                    {activity.type === 'connection' && (
                      <ConnectionIcon
                        className={
                          activity.status === 'accepted' ? 'text-[#22C55E]' : 'text-[#94A3B8]'
                        }
                      />
                    )}
                    {activity.type === 'reply' && <ReplyIcon className="text-[#FF6B35]" />}
                    {(activity.type === 'email' || activity.type === 'status_change') && (
                      <EmailIcon className="text-[#3B82F6]" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-[#1E293B] sm:text-sm">
                      {activity.name}
                    </p>
                    <p className="text-[10px] text-[#64748B] sm:text-xs">
                      {activity.company || 'Unknown company'}
                    </p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium sm:px-2 sm:text-xs ${
                        activity.status === 'accepted'
                          ? 'bg-[#F0FDF4] text-[#22C55E]'
                          : activity.status === 'replied'
                            ? 'bg-[#FFF7ED] text-[#FF6B35]'
                            : activity.status === 'sent'
                              ? 'bg-[#EFF6FF] text-[#3B82F6]'
                              : 'bg-[#F8FAFC] text-[#94A3B8]'
                      }`}
                    >
                      {activity.status}
                    </span>
                    <p className="mt-1 text-[10px] text-[#94A3B8] sm:text-xs">{activity.time}</p>
                  </div>
                </div>
              ))
            ) : (
              // Empty state
              <div className="flex flex-col items-center justify-center py-8 text-center text-[#94A3B8]">
                <p className="text-sm">No recent activity</p>
                <p className="text-xs">Activity will appear here once you start outreach</p>
              </div>
            )}
          </div>
          {recentActivity.length > 0 && (
            <Link
              to="/dashboard/inbox"
              className="mt-3 block w-full rounded-lg py-2 text-center text-sm font-medium text-[#FF6B35] transition-colors hover:bg-[#FFF7ED] md:mt-4"
            >
              View all activity
            </Link>
          )}
        </motion.div>
      </div>

      {/* Active Campaigns */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
        className="overflow-hidden rounded-xl border border-[#E2E8F0] bg-white"
      >
        <div className="flex items-center justify-between border-b border-[#E2E8F0] px-4 py-3 md:px-6 md:py-4">
          <h2 className="text-base font-semibold text-[#1E293B] md:text-lg">Active Campaigns</h2>
          <Link
            to="/dashboard/campaigns"
            className="text-xs font-medium text-[#FF6B35] transition-colors hover:text-[#E85A2A] sm:text-sm"
          >
            View all
          </Link>
        </div>
        <div className="divide-y divide-[#E2E8F0]">
          {campaignsLoading ? (
            // Loading skeleton
            Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="animate-pulse px-4 py-3 md:px-6 md:py-4">
                <div className="mb-2 flex flex-col justify-between gap-2 sm:mb-3 sm:flex-row sm:items-center sm:gap-3">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="h-2 w-2 rounded-full bg-[#E2E8F0]" />
                    <div className="h-4 w-40 rounded bg-[#E2E8F0]" />
                    <div className="h-5 w-14 rounded-full bg-[#E2E8F0]" />
                  </div>
                  <div className="flex items-center gap-3 sm:gap-6">
                    <div className="h-4 w-12 rounded bg-[#E2E8F0]" />
                    <div className="h-4 w-12 rounded bg-[#E2E8F0]" />
                    <div className="h-4 w-12 rounded bg-[#E2E8F0]" />
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="h-2 flex-1 rounded-full bg-[#E2E8F0]" />
                  <div className="h-4 w-10 rounded bg-[#E2E8F0]" />
                </div>
              </div>
            ))
          ) : activeCampaigns.length > 0 ? (
            activeCampaigns.map((campaign, index) => (
              <Link
                key={campaign.id}
                to="/dashboard/campaigns"
                className="block px-4 py-3 transition-colors hover:bg-[#F8FAFC] md:px-6 md:py-4"
              >
                <div className="mb-2 flex flex-col justify-between gap-2 sm:mb-3 sm:flex-row sm:items-center sm:gap-3">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div
                      className={`h-2 w-2 flex-shrink-0 rounded-full ${campaign.status === 'active' ? 'bg-[#22C55E]' : 'bg-[#F59E0B]'}`}
                    />
                    <span className="truncate text-sm font-medium text-[#1E293B] sm:text-base">
                      {campaign.name}
                    </span>
                    <span
                      className={`flex-shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium sm:px-2 sm:text-xs ${
                        campaign.status === 'active'
                          ? 'bg-[#F0FDF4] text-[#22C55E]'
                          : 'bg-[#FFFBEB] text-[#F59E0B]'
                      }`}
                    >
                      {campaign.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-[#64748B] sm:gap-6 sm:text-sm">
                    <div className="flex items-center gap-1">
                      <LeadsSmallIcon />
                      <span>{campaign.leads}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <SentIcon />
                      <span>{campaign.sent}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <ReplySmallIcon />
                      <span>{campaign.replies}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#E2E8F0] sm:h-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${campaign.progress}%` }}
                      transition={{ duration: 0.6, delay: index * 0.1 }}
                      className="h-full rounded-full bg-[#FF6B35]"
                    />
                  </div>
                  <span className="text-xs font-medium text-[#1E293B] sm:text-sm">
                    {campaign.progress}%
                  </span>
                </div>
              </Link>
            ))
          ) : (
            // Empty state
            <div className="flex flex-col items-center justify-center py-12 text-center text-[#94A3B8]">
              <p className="text-sm">No active campaigns</p>
              <p className="mb-4 text-xs">Create your first campaign to start outreach</p>
              <Link
                to="/dashboard/campaigns"
                className="rounded-lg bg-[#FF6B35] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#E85A2A]"
              >
                Create Campaign
              </Link>
            </div>
          )}
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.5 }}
        className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4"
      >
        <QuickActionCard
          icon={<AddAccountIcon />}
          title="Connect LinkedIn"
          description="Add a LinkedIn account to start sending"
          href="/dashboard/accounts"
          color="#0A66C2"
        />
        <QuickActionCard
          icon={<ImportLeadsIcon />}
          title="Import Leads"
          description="Upload CSV or import from Sales Nav"
          href="/dashboard/leads"
          color="#14B8A6"
        />
        <QuickActionCard
          icon={<NewCampaignIcon />}
          title="New Campaign"
          description="Create a multi-channel sequence"
          href="/dashboard/campaigns"
          color="#FF6B35"
        />
        <QuickActionCard
          icon={<ViewInboxIcon />}
          title="Check Inbox"
          description="View and respond to messages"
          href="/dashboard/inbox"
          color="#8B5CF6"
        />
      </motion.div>
    </div>
  );
}

function PartnerAccessBanner({
  partnerAccess,
  onDismiss,
}: {
  partnerAccess: PartnerAccessInfo;
  onDismiss: () => void;
}) {
  const isExpiringSoon =
    partnerAccess.days_until_expiry !== null && partnerAccess.days_until_expiry <= 7;
  const isLifetime = partnerAccess.days_until_expiry === null;
  const isLimited = partnerAccess.access_type === 'limited';

  // Determine banner style based on status
  const bannerStyles = partnerAccess.is_expired
    ? 'bg-red-50 border-red-200'
    : isExpiringSoon
      ? 'bg-amber-50 border-amber-200'
      : 'bg-teal-50 border-teal-200';

  const iconColor = partnerAccess.is_expired
    ? 'text-red-500'
    : isExpiringSoon
      ? 'text-amber-500'
      : 'text-teal-500';

  if (partnerAccess.is_expired) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`relative rounded-xl border p-4 ${bannerStyles}`}
      >
        <button
          onClick={onDismiss}
          className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
        <div className="flex items-start gap-3">
          <div className={`mt-0.5 ${iconColor}`}>
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-red-800">Partner Access Expired</h3>
            <p className="mt-1 text-sm text-red-700">
              Your partner access via code{' '}
              <span className="font-mono font-semibold">{partnerAccess.code}</span> has expired.
            </p>
            <div className="mt-3">
              <Link
                to="/pricing"
                className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
              >
                Upgrade to Continue
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative rounded-xl border p-4 ${bannerStyles}`}
    >
      <button
        onClick={onDismiss}
        className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 ${iconColor}`}>
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            />
          </svg>
        </div>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3
              className={`text-sm font-semibold ${isExpiringSoon ? 'text-amber-800' : 'text-teal-800'}`}
            >
              Partner Access Active
            </h3>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                partnerAccess.access_type === 'full'
                  ? 'bg-teal-100 text-teal-700'
                  : 'bg-amber-100 text-amber-700'
              }`}
            >
              {partnerAccess.access_type === 'full' ? 'Full Access' : 'Limited Access'}
            </span>
          </div>
          <p className={`mt-1 text-sm ${isExpiringSoon ? 'text-amber-700' : 'text-teal-700'}`}>
            Using code <span className="font-mono font-semibold">{partnerAccess.code}</span> &mdash;{' '}
            {isLifetime ? (
              <span className="font-medium">Lifetime access</span>
            ) : isExpiringSoon ? (
              <span className="font-medium">
                {partnerAccess.days_until_expiry === 0
                  ? 'Expires today!'
                  : partnerAccess.days_until_expiry === 1
                    ? 'Expires tomorrow!'
                    : `${partnerAccess.days_until_expiry} days remaining`}
              </span>
            ) : (
              <span>{partnerAccess.days_until_expiry} days remaining</span>
            )}
          </p>

          {/* Show restrictions for limited access */}
          {isLimited && (
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              {partnerAccess.max_senders && (
                <span className="rounded bg-white/60 px-2 py-1 text-amber-700">
                  Max {partnerAccess.max_senders} sender{partnerAccess.max_senders > 1 ? 's' : ''}
                </span>
              )}
              {partnerAccess.max_sequences && (
                <span className="rounded bg-white/60 px-2 py-1 text-amber-700">
                  Max {partnerAccess.max_sequences} sequence
                  {partnerAccess.max_sequences > 1 ? 's' : ''}
                </span>
              )}
              {partnerAccess.max_emails_per_day && (
                <span className="rounded bg-white/60 px-2 py-1 text-amber-700">
                  {partnerAccess.max_emails_per_day} emails/day
                </span>
              )}
              {partnerAccess.api_access === false && (
                <span className="rounded bg-white/60 px-2 py-1 text-amber-700">No API access</span>
              )}
            </div>
          )}

          {/* Upgrade CTA for expiring soon */}
          {isExpiringSoon && (
            <div className="mt-3">
              <Link
                to="/pricing"
                className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-700"
              >
                Upgrade Before It Expires
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </Link>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function QuickActionCard({
  icon,
  title,
  description,
  href,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
  color: string;
}) {
  return (
    <a
      href={href}
      className="group rounded-xl border border-[#E2E8F0] bg-white p-3 transition-all duration-200 hover:border-[#FF6B35]/30 hover:shadow-md sm:p-5"
    >
      <div
        className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg transition-transform group-hover:scale-110 sm:mb-3 sm:h-10 sm:w-10"
        style={{ backgroundColor: `${color}15` }}
      >
        <div style={{ color }} className="scale-75 sm:scale-100">
          {icon}
        </div>
      </div>
      <h3 className="mb-0.5 text-xs font-semibold text-[#1E293B] transition-colors group-hover:text-[#FF6B35] sm:mb-1 sm:text-base">
        {title}
      </h3>
      <p className="line-clamp-2 text-[10px] text-[#64748B] sm:text-sm">{description}</p>
    </a>
  );
}

// Icons
function ConnectionIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      className={`h-4 w-4 ${className}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM3 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 019.374 21c-2.331 0-4.512-.645-6.374-1.766z"
      />
    </svg>
  );
}

function ReplyIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      className={`h-4 w-4 ${className}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3"
      />
    </svg>
  );
}

function EmailIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      className={`h-4 w-4 ${className}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
      />
    </svg>
  );
}

function LeadsSmallIcon() {
  return (
    <svg
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
      />
    </svg>
  );
}

function SentIcon() {
  return (
    <svg
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
      />
    </svg>
  );
}

function ReplySmallIcon() {
  return (
    <svg
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
      />
    </svg>
  );
}

function AddAccountIcon() {
  return (
    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
      <path d="M16.338 16.338H13.67V12.16c0-.995-.017-2.277-1.387-2.277-1.39 0-1.601 1.086-1.601 2.207v4.248H8.014v-8.59h2.559v1.174h.037c.356-.675 1.227-1.387 2.526-1.387 2.703 0 3.203 1.778 3.203 4.092v4.711zM5.005 6.575a1.548 1.548 0 11-.003-3.096 1.548 1.548 0 01.003 3.096zm-1.337 9.763H6.34v-8.59H3.667v8.59zM17.668 1H2.328C1.595 1 1 1.581 1 2.298v15.403C1 18.418 1.595 19 2.328 19h15.34c.734 0 1.332-.582 1.332-1.299V2.298C19 1.581 18.402 1 17.668 1z" />
    </svg>
  );
}

function ImportLeadsIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
      />
    </svg>
  );
}

function NewCampaignIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}

function ViewInboxIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859m-19.5.338V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 00-2.15-1.588H6.911a2.25 2.25 0 00-2.15 1.588L2.35 13.177a2.25 2.25 0 00-.1.661z"
      />
    </svg>
  );
}
