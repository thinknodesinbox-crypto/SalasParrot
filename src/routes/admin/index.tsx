import { createFileRoute } from '@tanstack/react-router';
import { useAdminStats, useAdminSignupTrends } from '@/lib/hooks/queries/useAdmin';
import { useAdminTheme } from '@/lib/adminTheme';
import { Users, UserPlus, Rocket, MessageSquare, TrendingUp, Calendar } from 'lucide-react';

export const Route = createFileRoute('/admin/')({
  component: AdminDashboard,
});

function AdminDashboard() {
  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const { data: trends, isLoading: trendsLoading, error: trendsError } = useAdminSignupTrends(30);
  const { theme } = useAdminTheme();

  const isDark = theme === 'dark';

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Admin Dashboard
        </h1>
        <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>Overview of platform activity</p>
      </div>

      {/* Stats Grid */}
      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Users"
          value={stats?.total_users ?? 0}
          icon={Users}
          loading={statsLoading}
          subtitle={`${stats?.active_users ?? 0} active (30d)`}
          isDark={isDark}
        />
        <StatCard
          title="Partners"
          value={stats?.total_partners ?? 0}
          icon={UserPlus}
          loading={statsLoading}
          subtitle={`${stats?.active_partners ?? 0} active`}
          isDark={isDark}
        />
        <StatCard
          title="Campaigns"
          value={stats?.total_campaigns ?? 0}
          icon={Rocket}
          loading={statsLoading}
          subtitle={`${stats?.active_campaigns ?? 0} running`}
          isDark={isDark}
        />
        <StatCard
          title="Messages Sent"
          value={stats?.total_messages_sent ?? 0}
          icon={MessageSquare}
          loading={statsLoading}
          subtitle={`${stats?.total_leads ?? 0} leads`}
          isDark={isDark}
        />
      </div>

      {/* Growth Stats */}
      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
        <div
          className={`rounded-xl border p-6 ${isDark ? 'border-white/10 bg-[#111113]' : 'border-gray-200 bg-white'}`}
        >
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                New Users Today
              </p>
              <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {stats?.new_users_today ?? 0}
              </p>
            </div>
          </div>
        </div>

        <div
          className={`rounded-xl border p-6 ${isDark ? 'border-white/10 bg-[#111113]' : 'border-gray-200 bg-white'}`}
        >
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
              <Calendar className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>This Week</p>
              <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {stats?.new_users_this_week ?? 0}
              </p>
            </div>
          </div>
        </div>

        <div
          className={`rounded-xl border p-6 ${isDark ? 'border-white/10 bg-[#111113]' : 'border-gray-200 bg-white'}`}
        >
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
              <Calendar className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>This Month</p>
              <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {stats?.new_users_this_month ?? 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Signup Trends */}
      <div
        className={`rounded-xl border p-6 ${isDark ? 'border-white/10 bg-[#111113]' : 'border-gray-200 bg-white'}`}
      >
        <h2 className={`mb-4 text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Signup Trends (Last 30 Days)
        </h2>
        <div className="h-48">
          {trendsLoading ? (
            <div className="flex h-full items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#14B8A6] border-t-transparent" />
            </div>
          ) : trendsError ? (
            <div className="flex h-full items-center justify-center">
              <p className={`text-sm ${isDark ? 'text-red-400' : 'text-red-500'}`}>
                Failed to load trends
              </p>
            </div>
          ) : trends && trends.daily.length > 0 ? (
            <div className="flex h-full items-end gap-1">
              {trends.daily.map((day, index) => {
                const maxCount = Math.max(...trends.daily.map((d) => d.count), 1);
                const height = (day.count / maxCount) * 100;
                return (
                  <div
                    key={index}
                    className="group relative h-full flex-1"
                    title={`${day.date}: ${day.count} signups`}
                  >
                    <div
                      className="absolute bottom-0 w-full rounded-t bg-[#14B8A6] transition-colors hover:bg-[#14B8A6]/80"
                      style={{ height: `${Math.max(height, 2)}%` }}
                    />
                    <div
                      className={`absolute bottom-full left-1/2 mb-2 hidden -translate-x-1/2 rounded px-2 py-1 text-xs text-white group-hover:block ${isDark ? 'bg-gray-800' : 'bg-gray-700'}`}
                    >
                      {day.date}: {day.count}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex h-full items-center justify-center">
              <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                No signup data available
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  loading,
  subtitle,
  isDark,
}: {
  title: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  loading?: boolean;
  subtitle?: string;
  isDark: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-6 ${isDark ? 'border-white/10 bg-[#111113]' : 'border-gray-200 bg-white'}`}
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#14B8A6]/10">
          <Icon className="h-5 w-5 text-[#14B8A6]" />
        </div>
      </div>
      <div>
        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{title}</p>
        {loading ? (
          <div
            className={`mt-1 h-8 w-20 animate-pulse rounded ${isDark ? 'bg-white/10' : 'bg-gray-200'}`}
          />
        ) : (
          <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {value.toLocaleString()}
          </p>
        )}
        {subtitle && (
          <p className={`mt-1 text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{subtitle}</p>
        )}
      </div>
    </div>
  );
}
