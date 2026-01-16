import { createFileRoute } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import { useState } from 'react';

export const Route = createFileRoute('/dashboard/analytics')({
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const [dateRange, setDateRange] = useState('30d');
  const [activeTab, setActiveTab] = useState<'overview' | 'campaigns' | 'senders'>('overview');

  const overviewStats = [
    { label: 'Total Outreach', value: '4,521', change: '+18%', trend: 'up' },
    { label: 'Connections Made', value: '892', change: '+24%', trend: 'up' },
    { label: 'Reply Rate', value: '19.4%', change: '+2.3%', trend: 'up' },
    { label: 'Meetings Booked', value: '47', change: '+12%', trend: 'up' },
  ];

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
        {overviewStats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="rounded-xl border border-[#E2E8F0] bg-white p-4 md:p-5"
          >
            <p className="mb-1 text-xs text-[#64748B] sm:text-sm">{stat.label}</p>
            <div className="flex items-baseline gap-1 sm:gap-2">
              <span className="text-xl font-bold text-[#1E293B] sm:text-2xl">{stat.value}</span>
              <span
                className={`text-sm font-medium ${
                  stat.trend === 'up' ? 'text-[#22C55E]' : 'text-[#EF4444]'
                }`}
              >
                {stat.change}
              </span>
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
            {['Week 1', 'Week 2', 'Week 3', 'Week 4'].map((week, i) => {
              const linkedinHeights = [65, 72, 58, 85];
              const emailHeights = [45, 52, 48, 62];
              return (
                <div key={week} className="flex flex-1 flex-col items-center gap-2">
                  <div className="flex h-36 w-full items-end justify-center gap-0.5 md:h-48 md:gap-1">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${linkedinHeights[i]}%` }}
                      transition={{ duration: 0.5, delay: i * 0.1 }}
                      className="w-4 rounded-t bg-[#0A66C2] sm:w-6 md:w-8"
                    />
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${emailHeights[i]}%` }}
                      transition={{ duration: 0.5, delay: i * 0.1 + 0.05 }}
                      className="w-4 rounded-t bg-[#FF6B35] sm:w-6 md:w-8"
                    />
                  </div>
                  <span className="text-[10px] text-[#94A3B8] sm:text-xs">{week}</span>
                </div>
              );
            })}
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
              {/* Line chart */}
              <motion.path
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1, delay: 0.5 }}
                d="M 0 160 Q 50 150 100 140 T 200 120 T 300 100 T 400 80"
                fill="none"
                stroke="#FF6B35"
                strokeWidth="3"
                strokeLinecap="round"
              />
              {/* Area fill */}
              <motion.path
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.1 }}
                transition={{ duration: 0.5, delay: 1 }}
                d="M 0 160 Q 50 150 100 140 T 200 120 T 300 100 T 400 80 L 400 200 L 0 200 Z"
                fill="#FF6B35"
              />
            </svg>
          </div>
          <div className="mt-2 flex justify-between text-xs text-[#94A3B8]">
            <span>Week 1</span>
            <span>Week 2</span>
            <span>Week 3</span>
            <span>Week 4</span>
          </div>
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
        <div className="grid gap-8 md:grid-cols-2">
          {/* LinkedIn */}
          <div>
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0A66C2]/10">
                <LinkedInIcon className="h-5 w-5 text-[#0A66C2]" />
              </div>
              <div>
                <h3 className="font-semibold text-[#1E293B]">LinkedIn</h3>
                <p className="text-sm text-[#64748B]">2,834 messages sent</p>
              </div>
            </div>
            <div className="space-y-3">
              <MetricRow label="Connection Rate" value="58.4%" color="#22C55E" />
              <MetricRow label="Message Reply Rate" value="21.2%" color="#FF6B35" />
              <MetricRow label="Avg. Response Time" value="4.2h" color="#3B82F6" />
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
                <p className="text-sm text-[#64748B]">1,687 emails sent</p>
              </div>
            </div>
            <div className="space-y-3">
              <MetricRow label="Open Rate" value="45.8%" color="#22C55E" />
              <MetricRow label="Reply Rate" value="16.4%" color="#FF6B35" />
              <MetricRow label="Bounce Rate" value="2.1%" color="#EF4444" />
            </div>
          </div>
        </div>
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
              {[
                {
                  name: 'Q1 Tech Leaders',
                  sent: 450,
                  connectionRate: 62,
                  replyRate: 24,
                  meetings: 18,
                },
                {
                  name: 'Series A Founders',
                  sent: 320,
                  connectionRate: 58,
                  replyRate: 22,
                  meetings: 14,
                },
                {
                  name: 'Agency Partners',
                  sent: 280,
                  connectionRate: 55,
                  replyRate: 19,
                  meetings: 11,
                },
                {
                  name: 'VP Sales Outreach',
                  sent: 215,
                  connectionRate: 51,
                  replyRate: 17,
                  meetings: 8,
                },
              ].map((campaign, index) => (
                <tr key={index} className="hover:bg-[#F8FAFC]">
                  <td className="px-6 py-4 font-medium text-[#1E293B]">{campaign.name}</td>
                  <td className="px-6 py-4 text-[#64748B]">{campaign.sent}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-[#E2E8F0]">
                        <div
                          className="h-full rounded-full bg-[#22C55E]"
                          style={{ width: `${campaign.connectionRate}%` }}
                        />
                      </div>
                      <span className="text-sm text-[#1E293B]">{campaign.connectionRate}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-[#E2E8F0]">
                        <div
                          className="h-full rounded-full bg-[#FF6B35]"
                          style={{ width: `${campaign.replyRate}%` }}
                        />
                      </div>
                      <span className="text-sm text-[#1E293B]">{campaign.replyRate}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="rounded-full bg-[#F0FDF4] px-2 py-1 text-sm font-medium text-[#22C55E]">
                      {campaign.meetings}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="divide-y divide-[#E2E8F0] md:hidden">
          {[
            { name: 'Q1 Tech Leaders', sent: 450, connectionRate: 62, replyRate: 24, meetings: 18 },
            {
              name: 'Series A Founders',
              sent: 320,
              connectionRate: 58,
              replyRate: 22,
              meetings: 14,
            },
            { name: 'Agency Partners', sent: 280, connectionRate: 55, replyRate: 19, meetings: 11 },
            {
              name: 'VP Sales Outreach',
              sent: 215,
              connectionRate: 51,
              replyRate: 17,
              meetings: 8,
            },
          ].map((campaign, index) => (
            <div key={index} className="p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-medium text-[#1E293B]">{campaign.name}</h3>
                <span className="rounded-full bg-[#F0FDF4] px-2 py-1 text-xs font-medium text-[#22C55E]">
                  {campaign.meetings} meetings
                </span>
              </div>
              <p className="mb-3 text-sm text-[#64748B]">{campaign.sent} sent</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="mb-1 text-xs text-[#64748B]">Connection</p>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#E2E8F0]">
                      <div
                        className="h-full rounded-full bg-[#22C55E]"
                        style={{ width: `${campaign.connectionRate}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-[#1E293B]">
                      {campaign.connectionRate}%
                    </span>
                  </div>
                </div>
                <div>
                  <p className="mb-1 text-xs text-[#64748B]">Reply</p>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#E2E8F0]">
                      <div
                        className="h-full rounded-full bg-[#FF6B35]"
                        style={{ width: `${campaign.replyRate}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-[#1E293B]">
                      {campaign.replyRate}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { name: 'John Doe', sent: 892, connectionRate: 61, replyRate: 23 },
            { name: 'Jane Smith', sent: 756, connectionRate: 58, replyRate: 21 },
            { name: 'Bob Wilson', sent: 634, connectionRate: 55, replyRate: 19 },
            { name: 'Alice Brown', sent: 552, connectionRate: 52, replyRate: 17 },
          ].map((sender, index) => (
            <div key={index} className="rounded-xl bg-[#F8FAFC] p-4">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#FF6B35] to-[#14B8A6] text-sm font-medium text-white">
                  {sender.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')}
                </div>
                <div>
                  <p className="font-medium text-[#1E293B]">{sender.name}</p>
                  <p className="text-xs text-[#64748B]">{sender.sent} sent</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#64748B]">Connection</span>
                  <span className="font-medium text-[#22C55E]">{sender.connectionRate}%</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#64748B]">Reply</span>
                  <span className="font-medium text-[#FF6B35]">{sender.replyRate}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

function MetricRow({ label, value, color }: { label: string; value: string; color: string }) {
  const numericValue = parseFloat(value);
  const maxValue = value.includes('%') ? 100 : 24;

  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="text-[#64748B]">{label}</span>
        <span className="font-medium text-[#1E293B]">{value}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[#E2E8F0]">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min((numericValue / maxValue) * 100, 100)}%` }}
          transition={{ duration: 0.5 }}
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
        />
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
