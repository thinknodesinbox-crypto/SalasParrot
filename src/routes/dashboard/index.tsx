import { createFileRoute } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { useState } from 'react'

export const Route = createFileRoute('/dashboard/')({
  component: DashboardHome,
})

function DashboardHome() {
  const [dateRange, setDateRange] = useState('7d')

  // Mock data for demonstration
  const stats = [
    { label: 'Connections Sent', value: 156, change: '+12%', trend: 'up', color: '#3B82F6' },
    { label: 'Connections Accepted', value: 89, rate: '57.1%', trend: 'up', color: '#22C55E' },
    { label: 'Messages Sent', value: 234, change: '+8%', trend: 'up', color: '#F59E0B' },
    { label: 'Message Replies', value: 45, rate: '19.2%', trend: 'up', color: '#8B5CF6' },
    { label: 'Emails Sent', value: 312, change: '+15%', trend: 'up', color: '#FF6B35' },
    { label: 'Email Replies', value: 67, rate: '21.5%', trend: 'up', color: '#14B8A6' },
  ]

  const recentActivity = [
    { type: 'connection', name: 'Sarah Johnson', company: 'TechCorp', time: '2 min ago', status: 'accepted' },
    { type: 'reply', name: 'Michael Chen', company: 'StartupXYZ', time: '15 min ago', status: 'replied', channel: 'linkedin' },
    { type: 'email', name: 'Emily Davis', company: 'GrowthCo', time: '1 hour ago', status: 'opened' },
    { type: 'connection', name: 'David Wilson', company: 'SalesForce', time: '2 hours ago', status: 'pending' },
    { type: 'reply', name: 'Lisa Wang', company: 'CloudTech', time: '3 hours ago', status: 'replied', channel: 'email' },
  ]

  const activeCampaigns = [
    { name: 'Q1 Outreach - Tech Leaders', status: 'active', progress: 68, leads: 450, sent: 306, replies: 42 },
    { name: 'Series A Founders', status: 'active', progress: 45, leads: 200, sent: 90, replies: 18 },
    { name: 'Agency Partners', status: 'paused', progress: 82, leads: 150, sent: 123, replies: 31 },
  ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#1E293B]">Dashboard</h1>
          <p className="text-sm sm:text-base text-[#64748B] mt-1">Welcome back! Here's what's happening with your outreach.</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="w-full sm:w-auto px-3 sm:px-4 py-2 bg-white border border-[#E2E8F0] rounded-lg text-sm text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35]"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className="bg-white rounded-xl p-3 md:p-4 border border-[#E2E8F0] hover:border-[#FF6B35]/30 transition-colors"
          >
            <div className="flex items-center gap-1.5 md:gap-2 mb-1.5 md:mb-2">
              <div
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: stat.color }}
              />
              <span className="text-[10px] sm:text-xs text-[#64748B] font-medium truncate">{stat.label}</span>
            </div>
            <div className="flex items-baseline gap-1 sm:gap-2">
              <span className="text-xl sm:text-2xl font-bold text-[#1E293B]">{stat.value}</span>
              {stat.rate && (
                <span className="text-[10px] sm:text-xs font-medium text-[#22C55E]">{stat.rate}</span>
              )}
              {stat.change && (
                <span className="text-[10px] sm:text-xs font-medium text-[#22C55E]">{stat.change}</span>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-4 md:gap-6">
        {/* Activity Chart Placeholder */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="lg:col-span-2 bg-white rounded-xl border border-[#E2E8F0] p-4 md:p-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 md:mb-6">
            <h2 className="text-base md:text-lg font-semibold text-[#1E293B]">Activity Overview</h2>
            <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#3B82F6]" />
                <span className="text-[#64748B]">Connections</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#FF6B35]" />
                <span className="text-[#64748B]">Emails</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#22C55E]" />
                <span className="text-[#64748B]">Replies</span>
              </div>
            </div>
          </div>

          {/* Chart Area */}
          <div className="h-48 md:h-64 flex items-end justify-between gap-1 sm:gap-2 px-0 sm:px-4">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => {
              const heights = [45, 62, 58, 78, 85, 42, 35]
              const emailHeights = [30, 45, 52, 60, 72, 35, 28]
              const replyHeights = [12, 18, 22, 28, 32, 14, 10]
              return (
                <div key={day} className="flex-1 flex flex-col items-center gap-1 sm:gap-2">
                  <div className="w-full flex items-end justify-center gap-0.5 sm:gap-1 h-36 md:h-48">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${heights[i]}%` }}
                      transition={{ duration: 0.5, delay: i * 0.05 }}
                      className="w-2 sm:w-3 bg-[#3B82F6] rounded-t-sm"
                    />
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${emailHeights[i]}%` }}
                      transition={{ duration: 0.5, delay: i * 0.05 + 0.1 }}
                      className="w-2 sm:w-3 bg-[#FF6B35] rounded-t-sm"
                    />
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${replyHeights[i]}%` }}
                      transition={{ duration: 0.5, delay: i * 0.05 + 0.2 }}
                      className="w-2 sm:w-3 bg-[#22C55E] rounded-t-sm"
                    />
                  </div>
                  <span className="text-[10px] sm:text-xs text-[#94A3B8]">{day}</span>
                </div>
              )
            })}
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="bg-white rounded-xl border border-[#E2E8F0] p-4 md:p-6"
        >
          <h2 className="text-base md:text-lg font-semibold text-[#1E293B] mb-3 md:mb-4">Recent Activity</h2>
          <div className="space-y-3 md:space-y-4">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-start gap-2 sm:gap-3">
                <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  activity.status === 'accepted' ? 'bg-[#F0FDF4]' :
                  activity.status === 'replied' ? 'bg-[#FFF7ED]' :
                  activity.status === 'opened' ? 'bg-[#EFF6FF]' :
                  'bg-[#F8FAFC]'
                }`}>
                  {activity.type === 'connection' && <ConnectionIcon className={activity.status === 'accepted' ? 'text-[#22C55E]' : 'text-[#94A3B8]'} />}
                  {activity.type === 'reply' && <ReplyIcon className="text-[#FF6B35]" />}
                  {activity.type === 'email' && <EmailIcon className="text-[#3B82F6]" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-[#1E293B] truncate">{activity.name}</p>
                  <p className="text-[10px] sm:text-xs text-[#64748B]">{activity.company}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className={`text-[10px] sm:text-xs font-medium px-1.5 sm:px-2 py-0.5 rounded-full ${
                    activity.status === 'accepted' ? 'bg-[#F0FDF4] text-[#22C55E]' :
                    activity.status === 'replied' ? 'bg-[#FFF7ED] text-[#FF6B35]' :
                    activity.status === 'opened' ? 'bg-[#EFF6FF] text-[#3B82F6]' :
                    'bg-[#F8FAFC] text-[#94A3B8]'
                  }`}>
                    {activity.status}
                  </span>
                  <p className="text-[10px] sm:text-xs text-[#94A3B8] mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-3 md:mt-4 py-2 text-sm font-medium text-[#FF6B35] hover:bg-[#FFF7ED] rounded-lg transition-colors">
            View all activity
          </button>
        </motion.div>
      </div>

      {/* Active Campaigns */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
        className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden"
      >
        <div className="px-4 md:px-6 py-3 md:py-4 border-b border-[#E2E8F0] flex items-center justify-between">
          <h2 className="text-base md:text-lg font-semibold text-[#1E293B]">Active Campaigns</h2>
          <button className="text-xs sm:text-sm font-medium text-[#FF6B35] hover:text-[#E85A2A] transition-colors">
            View all
          </button>
        </div>
        <div className="divide-y divide-[#E2E8F0]">
          {activeCampaigns.map((campaign, index) => (
            <div key={index} className="px-4 md:px-6 py-3 md:py-4 hover:bg-[#F8FAFC] transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 mb-2 sm:mb-3">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${campaign.status === 'active' ? 'bg-[#22C55E]' : 'bg-[#F59E0B]'}`} />
                  <span className="font-medium text-[#1E293B] text-sm sm:text-base truncate">{campaign.name}</span>
                  <span className={`text-[10px] sm:text-xs font-medium px-1.5 sm:px-2 py-0.5 rounded-full flex-shrink-0 ${
                    campaign.status === 'active' ? 'bg-[#F0FDF4] text-[#22C55E]' : 'bg-[#FFFBEB] text-[#F59E0B]'
                  }`}>
                    {campaign.status}
                  </span>
                </div>
                <div className="flex items-center gap-3 sm:gap-6 text-[10px] sm:text-sm text-[#64748B]">
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
                <div className="flex-1 h-1.5 sm:h-2 bg-[#E2E8F0] rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${campaign.progress}%` }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    className="h-full bg-[#FF6B35] rounded-full"
                  />
                </div>
                <span className="text-xs sm:text-sm font-medium text-[#1E293B]">{campaign.progress}%</span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.5 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4"
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
  )
}

function QuickActionCard({
  icon,
  title,
  description,
  href,
  color
}: {
  icon: React.ReactNode
  title: string
  description: string
  href: string
  color: string
}) {
  return (
    <a
      href={href}
      className="bg-white rounded-xl border border-[#E2E8F0] p-3 sm:p-5 hover:border-[#FF6B35]/30 hover:shadow-md transition-all duration-200 group"
    >
      <div
        className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center mb-2 sm:mb-3 transition-transform group-hover:scale-110"
        style={{ backgroundColor: `${color}15` }}
      >
        <div style={{ color }} className="scale-75 sm:scale-100">{icon}</div>
      </div>
      <h3 className="font-semibold text-[#1E293B] mb-0.5 sm:mb-1 group-hover:text-[#FF6B35] transition-colors text-xs sm:text-base">{title}</h3>
      <p className="text-[10px] sm:text-sm text-[#64748B] line-clamp-2">{description}</p>
    </a>
  )
}

// Icons
function ConnectionIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={`w-4 h-4 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM3 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 019.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
    </svg>
  )
}

function ReplyIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={`w-4 h-4 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
    </svg>
  )
}

function EmailIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={`w-4 h-4 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
    </svg>
  )
}

function LeadsSmallIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  )
}

function SentIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
    </svg>
  )
}

function ReplySmallIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
    </svg>
  )
}

function AddAccountIcon() {
  return (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path d="M16.338 16.338H13.67V12.16c0-.995-.017-2.277-1.387-2.277-1.39 0-1.601 1.086-1.601 2.207v4.248H8.014v-8.59h2.559v1.174h.037c.356-.675 1.227-1.387 2.526-1.387 2.703 0 3.203 1.778 3.203 4.092v4.711zM5.005 6.575a1.548 1.548 0 11-.003-3.096 1.548 1.548 0 01.003 3.096zm-1.337 9.763H6.34v-8.59H3.667v8.59zM17.668 1H2.328C1.595 1 1 1.581 1 2.298v15.403C1 18.418 1.595 19 2.328 19h15.34c.734 0 1.332-.582 1.332-1.299V2.298C19 1.581 18.402 1 17.668 1z" />
    </svg>
  )
}

function ImportLeadsIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
    </svg>
  )
}

function NewCampaignIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  )
}

function ViewInboxIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859m-19.5.338V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 00-2.15-1.588H6.911a2.25 2.25 0 00-2.15 1.588L2.35 13.177a2.25 2.25 0 00-.1.661z" />
    </svg>
  )
}
