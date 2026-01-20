import { createFileRoute } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import { useState } from 'react';
import {
  useAnalyticsOverviewStats,
  useChannelPerformance,
  useTopCampaigns,
  useSenderPerformance,
  useReplyRateTrend,
  useDashboardChart,
} from '../../lib/hooks/queries';

export const Route = createFileRoute('/dashboard/analytics')({
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const [dateRange, setDateRange] = useState('30d');
  const [activeTab, setActiveTab] = useState<'overview' | 'campaigns' | 'senders'>('overview');

  // Fetch real data
  const { data: overviewData, isLoading: overviewLoading } = useAnalyticsOverviewStats(dateRange);
  const { data: chartData, isLoading: chartLoading } = useDashboardChart(dateRange);
  const { data: channelData, isLoading: channelLoading } = useChannelPerformance(dateRange);
  const { data: campaignsData, isLoading: campaignsLoading } = useTopCampaigns(dateRange, 10);
  const { data: sendersData, isLoading: sendersLoading } = useSenderPerformance(dateRange);
  const { data: replyTrendData, isLoading: replyTrendLoading } = useReplyRateTrend(dateRange);

  // Transform overview stats for display
  const overviewStats = overviewData
    ? [
        {
          label: 'Total Outreach',
          value: overviewData.total_outreach.toLocaleString(),
          change: overviewData.total_outreach_change,
          trend: overviewData.total_outreach_change.startsWith('-') ? 'down' : 'up',
        },
        {
          label: 'Connections Made',
          value: overviewData.connections_made.toLocaleString(),
          change: overviewData.connections_made_change,
          trend: overviewData.connections_made_change.startsWith('-') ? 'down' : 'up',
        },
        {
          label: 'Reply Rate',
          value: overviewData.reply_rate,
          change: overviewData.reply_rate_change,
          trend: overviewData.reply_rate_change.startsWith('-') ? 'down' : 'up',
        },
        {
          label: 'Meetings Booked',
          value:
            overviewData.meetings_booked !== null ? overviewData.meetings_booked.toString() : '--',
          change: '',
          trend: 'up',
          notTracked: overviewData.meetings_booked === null,
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-bold text-[#1E293B] sm:text-2xl">Analytics</h1>
          <p className="mt-1 text-sm text-[#64748B] sm:text-base">
            Track your outreach performance
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="flex-1 rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 sm:flex-none sm:px-4"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="365d">Last year</option>
          </select>
          <button className="flex items-center gap-2 rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-sm font-medium text-[#64748B] hover:bg-[#F8FAFC] sm:px-4">
            <DownloadIcon />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex w-full gap-1 overflow-x-auto rounded-lg bg-[#F8FAFC] p-1 sm:w-fit">
        {(['overview', 'campaigns', 'senders'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium transition-colors sm:flex-none ${
              activeTab === tab
                ? 'bg-white text-[#1E293B] shadow-sm'
                : 'text-[#64748B] hover:text-[#1E293B]'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
        {overviewLoading
          ? Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="animate-pulse rounded-xl border border-[#E2E8F0] bg-white p-4 md:p-5"
              >
                <div className="mb-2 h-3 w-20 rounded bg-[#E2E8F0]" />
                <div className="flex items-baseline gap-2">
                  <div className="h-7 w-16 rounded bg-[#E2E8F0]" />
                  <div className="h-4 w-10 rounded bg-[#E2E8F0]" />
                </div>
              </div>
            ))
          : overviewStats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="rounded-xl border border-[#E2E8F0] bg-white p-4 md:p-5"
              >
                <p className="mb-1 text-xs text-[#64748B] sm:text-sm">{stat.label}</p>
                <div className="flex items-baseline gap-1 sm:gap-2">
                  <span
                    className={`text-xl font-bold sm:text-2xl ${stat.notTracked ? 'text-[#94A3B8]' : 'text-[#1E293B]'}`}
                  >
                    {stat.value}
                  </span>
                  {stat.change && (
                    <span
                      className={`text-sm font-medium ${
                        stat.trend === 'up' ? 'text-[#22C55E]' : 'text-[#EF4444]'
                      }`}
                    >
                      {stat.change}
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
      </div>

      {/* Main Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Outreach Activity Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl border border-[#E2E8F0] bg-white p-4 md:p-6"
        >
          <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center md:mb-6">
            <h2 className="text-base font-semibold text-[#1E293B] md:text-lg">Outreach Activity</h2>
            <div className="flex items-center gap-3 text-xs sm:gap-4 sm:text-sm">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-[#0A66C2] sm:h-3 sm:w-3" />
                <span className="text-[#64748B]">LinkedIn</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-[#FF6B35] sm:h-3 sm:w-3" />
                <span className="text-[#64748B]">Email</span>
              </div>
            </div>
          </div>
          <div className="flex h-48 items-end justify-between gap-2 md:h-64 md:gap-3">
            {chartLoading ? (
              // Loading skeleton
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex flex-1 flex-col items-center gap-2">
                  <div className="flex h-36 w-full items-end justify-center gap-0.5 md:h-48 md:gap-1">
                    <div
                      className="w-4 animate-pulse rounded-t bg-[#E2E8F0] sm:w-6 md:w-8"
                      style={{ height: '50%' }}
                    />
                    <div
                      className="w-4 animate-pulse rounded-t bg-[#E2E8F0] sm:w-6 md:w-8"
                      style={{ height: '40%' }}
                    />
                  </div>
                  <div className="h-3 w-10 animate-pulse rounded bg-[#E2E8F0]" />
                </div>
              ))
            ) : chartData?.labels?.length ? (
              chartData.labels.map((label, i) => {
                // Calculate max for scaling
                const maxConnections = Math.max(...(chartData.connections || []), 1);
                const maxEmails = Math.max(...(chartData.emails || []), 1);
                const maxVal = Math.max(maxConnections, maxEmails, 1);

                const linkedinHeight = ((chartData.connections?.[i] || 0) / maxVal) * 100;
                const emailHeight = ((chartData.emails?.[i] || 0) / maxVal) * 100;

                return (
                  <div key={label} className="flex flex-1 flex-col items-center gap-2">
                    <div className="flex h-36 w-full items-end justify-center gap-0.5 md:h-48 md:gap-1">
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${Math.max(linkedinHeight, 2)}%` }}
                        transition={{ duration: 0.5, delay: i * 0.1 }}
                        className="w-4 rounded-t bg-[#0A66C2] sm:w-6 md:w-8"
                        title={`LinkedIn: ${chartData.connections?.[i] || 0}`}
                      />
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${Math.max(emailHeight, 2)}%` }}
                        transition={{ duration: 0.5, delay: i * 0.1 + 0.05 }}
                        className="w-4 rounded-t bg-[#FF6B35] sm:w-6 md:w-8"
                        title={`Email: ${chartData.emails?.[i] || 0}`}
                      />
                    </div>
                    <span className="text-[10px] text-[#94A3B8] sm:text-xs">{label}</span>
                  </div>
                );
              })
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center text-[#94A3B8]">
                <p className="text-sm">No activity data</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Reply Rate Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-xl border border-[#E2E8F0] bg-white p-4 md:p-6"
        >
          <h2 className="mb-4 text-base font-semibold text-[#1E293B] md:mb-6 md:text-lg">
            Reply Rate Trend
          </h2>
          {replyTrendLoading ? (
            <div className="flex h-48 animate-pulse items-center justify-center md:h-64">
              <div className="h-full w-full rounded bg-[#E2E8F0]" />
            </div>
          ) : replyTrendData?.length ? (
            <>
              <div className="flex h-48 items-end md:h-64">
                <svg className="h-full w-full" viewBox="0 0 400 200" preserveAspectRatio="none">
                  {/* Grid lines */}
                  {[0, 25, 50, 75, 100].map((y) => (
                    <line
                      key={y}
                      x1="0"
                      y1={200 - (y / 100) * 200}
                      x2="400"
                      y2={200 - (y / 100) * 200}
                      stroke="#E2E8F0"
                      strokeDasharray="4"
                    />
                  ))}
                  {/* Line chart based on real data */}
                  {(() => {
                    const maxRate = Math.max(...replyTrendData.map((p) => p.rate), 1);
                    const points = replyTrendData.map((point, i) => {
                      const x = (i / (replyTrendData.length - 1 || 1)) * 400;
                      const y = 200 - (point.rate / maxRate) * 180; // Leave some margin
                      return `${x} ${y}`;
                    });
                    const pathD = `M ${points.join(' L ')}`;
                    const areaD = `M ${points.join(' L ')} L 400 200 L 0 200 Z`;
                    return (
                      <>
                        <motion.path
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ duration: 1, delay: 0.5 }}
                          d={pathD}
                          fill="none"
                          stroke="#FF6B35"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <motion.path
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 0.1 }}
                          transition={{ duration: 0.5, delay: 1 }}
                          d={areaD}
                          fill="#FF6B35"
                        />
                      </>
                    );
                  })()}
                </svg>
              </div>
              <div className="mt-2 flex justify-between text-xs text-[#94A3B8]">
                {replyTrendData.map((point, i) => (
                  <span key={i} title={`${point.rate.toFixed(1)}%`}>
                    {point.label}
                  </span>
                ))}
              </div>
            </>
          ) : (
            <div className="flex h-48 items-center justify-center text-[#94A3B8] md:h-64">
              <p className="text-sm">No reply rate data yet</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Performance by Channel */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="rounded-xl border border-[#E2E8F0] bg-white p-4 md:p-6"
      >
        <h2 className="mb-4 text-base font-semibold text-[#1E293B] md:mb-6 md:text-lg">
          Performance by Channel
        </h2>
        {channelLoading ? (
          <div className="grid animate-pulse gap-8 md:grid-cols-2">
            {[0, 1].map((i) => (
              <div key={i}>
                <div className="mb-4 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-[#E2E8F0]" />
                  <div>
                    <div className="mb-1 h-4 w-20 rounded bg-[#E2E8F0]" />
                    <div className="h-3 w-28 rounded bg-[#E2E8F0]" />
                  </div>
                </div>
                <div className="space-y-3">
                  {[0, 1, 2].map((j) => (
                    <div key={j}>
                      <div className="mb-1 flex justify-between">
                        <div className="h-3 w-24 rounded bg-[#E2E8F0]" />
                        <div className="h-3 w-10 rounded bg-[#E2E8F0]" />
                      </div>
                      <div className="h-2 rounded-full bg-[#E2E8F0]" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : channelData ? (
          <div className="grid gap-8 md:grid-cols-2">
            {/* LinkedIn */}
            <div>
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0A66C2]/10">
                  <LinkedInIcon className="h-5 w-5 text-[#0A66C2]" />
                </div>
                <div>
                  <h3 className="font-semibold text-[#1E293B]">LinkedIn</h3>
                  <p className="text-sm text-[#64748B]">
                    {channelData.linkedin_messages_sent.toLocaleString()} messages sent
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                <MetricRow
                  label="Connection Rate"
                  value={channelData.linkedin_connection_rate}
                  color="#22C55E"
                />
                <MetricRow
                  label="Message Reply Rate"
                  value={channelData.linkedin_reply_rate}
                  color="#FF6B35"
                />
                <MetricRow
                  label="Avg. Response Time"
                  value={channelData.linkedin_avg_response_time || '--'}
                  color="#3B82F6"
                  notTracked={!channelData.linkedin_avg_response_time}
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#14B8A6]/10">
                  <EmailIcon className="h-5 w-5 text-[#14B8A6]" />
                </div>
                <div>
                  <h3 className="font-semibold text-[#1E293B]">Email</h3>
                  <p className="text-sm text-[#64748B]">
                    {channelData.email_sent.toLocaleString()} emails sent
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                <MetricRow
                  label="Open Rate"
                  value={channelData.email_open_rate || '--'}
                  color="#22C55E"
                  notTracked={!channelData.email_open_rate}
                />
                <MetricRow
                  label="Reply Rate"
                  value={channelData.email_reply_rate}
                  color="#FF6B35"
                />
                <MetricRow
                  label="Bounce Rate"
                  value={channelData.email_bounce_rate || '--'}
                  color="#EF4444"
                  notTracked={!channelData.email_bounce_rate}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center py-8 text-[#94A3B8]">
            <p className="text-sm">No channel data available</p>
          </div>
        )}
      </motion.div>

      {/* Top Performing Campaigns */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="overflow-hidden rounded-xl border border-[#E2E8F0] bg-white"
      >
        <div className="border-b border-[#E2E8F0] px-4 py-4 md:px-6">
          <h2 className="text-base font-semibold text-[#1E293B] md:text-lg">
            Top Performing Campaigns
          </h2>
        </div>

        {campaignsLoading ? (
          <div className="p-4 md:p-6">
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="mb-2 flex justify-between">
                    <div className="h-4 w-32 rounded bg-[#E2E8F0]" />
                    <div className="h-4 w-16 rounded bg-[#E2E8F0]" />
                  </div>
                  <div className="flex gap-4">
                    <div className="h-2 w-24 rounded bg-[#E2E8F0]" />
                    <div className="h-2 w-24 rounded bg-[#E2E8F0]" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : campaignsData?.length ? (
          <>
            {/* Desktop Table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#64748B]">
                      Campaign
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#64748B]">
                      Sent
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#64748B]">
                      Connection Rate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#64748B]">
                      Reply Rate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#64748B]">
                      Meetings
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {campaignsData.map((campaign) => (
                    <tr key={campaign.id} className="hover:bg-[#F8FAFC]">
                      <td className="px-6 py-4 font-medium text-[#1E293B]">{campaign.name}</td>
                      <td className="px-6 py-4 text-[#64748B]">{campaign.sent}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-[#E2E8F0]">
                            <div
                              className="h-full rounded-full bg-[#22C55E]"
                              style={{ width: `${Math.min(campaign.connection_rate, 100)}%` }}
                            />
                          </div>
                          <span className="text-sm text-[#1E293B]">
                            {campaign.connection_rate.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-[#E2E8F0]">
                            <div
                              className="h-full rounded-full bg-[#FF6B35]"
                              style={{ width: `${Math.min(campaign.reply_rate, 100)}%` }}
                            />
                          </div>
                          <span className="text-sm text-[#1E293B]">
                            {campaign.reply_rate.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {campaign.meetings !== null ? (
                          <span className="rounded-full bg-[#F0FDF4] px-2 py-1 text-sm font-medium text-[#22C55E]">
                            {campaign.meetings}
                          </span>
                        ) : (
                          <span className="text-sm text-[#94A3B8]">--</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="divide-y divide-[#E2E8F0] md:hidden">
              {campaignsData.map((campaign) => (
                <div key={campaign.id} className="p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="font-medium text-[#1E293B]">{campaign.name}</h3>
                    {campaign.meetings !== null ? (
                      <span className="rounded-full bg-[#F0FDF4] px-2 py-1 text-xs font-medium text-[#22C55E]">
                        {campaign.meetings} meetings
                      </span>
                    ) : (
                      <span className="text-xs text-[#94A3B8]">--</span>
                    )}
                  </div>
                  <p className="mb-3 text-sm text-[#64748B]">{campaign.sent} sent</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="mb-1 text-xs text-[#64748B]">Connection</p>
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#E2E8F0]">
                          <div
                            className="h-full rounded-full bg-[#22C55E]"
                            style={{ width: `${Math.min(campaign.connection_rate, 100)}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-[#1E293B]">
                          {campaign.connection_rate.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="mb-1 text-xs text-[#64748B]">Reply</p>
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#E2E8F0]">
                          <div
                            className="h-full rounded-full bg-[#FF6B35]"
                            style={{ width: `${Math.min(campaign.reply_rate, 100)}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-[#1E293B]">
                          {campaign.reply_rate.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-[#94A3B8]">
            <p className="text-sm">No campaign data available</p>
            <p className="text-xs">Start a campaign to see performance here</p>
          </div>
        )}
      </motion.div>

      {/* Sender Performance */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="rounded-xl border border-[#E2E8F0] bg-white p-4 md:p-6"
      >
        <h2 className="mb-4 text-base font-semibold text-[#1E293B] md:mb-6 md:text-lg">
          Sender Performance
        </h2>
        {sendersLoading ? (
          <div className="grid animate-pulse gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-xl bg-[#F8FAFC] p-4">
                <div className="mb-4 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-[#E2E8F0]" />
                  <div>
                    <div className="mb-1 h-4 w-20 rounded bg-[#E2E8F0]" />
                    <div className="h-3 w-14 rounded bg-[#E2E8F0]" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <div className="h-3 w-16 rounded bg-[#E2E8F0]" />
                    <div className="h-3 w-8 rounded bg-[#E2E8F0]" />
                  </div>
                  <div className="flex justify-between">
                    <div className="h-3 w-16 rounded bg-[#E2E8F0]" />
                    <div className="h-3 w-8 rounded bg-[#E2E8F0]" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : sendersData?.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {sendersData.map((sender) => (
              <div key={sender.id} className="rounded-xl bg-[#F8FAFC] p-4">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#FF6B35] to-[#14B8A6] text-sm font-medium text-white">
                    {sender.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-[#1E293B]">{sender.name}</p>
                    <p className="text-xs text-[#64748B]">{sender.sent} sent</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#64748B]">Connection</span>
                    <span className="font-medium text-[#22C55E]">
                      {sender.connection_rate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#64748B]">Reply</span>
                    <span className="font-medium text-[#FF6B35]">
                      {sender.reply_rate.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-[#94A3B8]">
            <p className="text-sm">No sender data available</p>
            <p className="text-xs">Connect accounts and start sending to see performance</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}

function MetricRow({
  label,
  value,
  color,
  notTracked = false,
}: {
  label: string;
  value: string;
  color: string;
  notTracked?: boolean;
}) {
  const numericValue = parseFloat(value);
  const maxValue = value.includes('%') ? 100 : 24;

  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="text-[#64748B]">{label}</span>
        <span className={`font-medium ${notTracked ? 'text-[#94A3B8]' : 'text-[#1E293B]'}`}>
          {value}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[#E2E8F0]">
        {!notTracked && !isNaN(numericValue) && (
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min((numericValue / maxValue) * 100, 100)}%` }}
            transition={{ duration: 0.5 }}
            className="h-full rounded-full"
            style={{ backgroundColor: color }}
          />
        )}
      </div>
    </div>
  );
}

// Icons
function DownloadIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
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
