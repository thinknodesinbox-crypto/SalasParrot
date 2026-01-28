import { createFileRoute } from '@tanstack/react-router';
import { useAdminStats, useAdminSignupTrends } from '@/lib/hooks/queries/useAdmin';
import { Users, UserPlus, Rocket, MessageSquare, TrendingUp, Calendar } from 'lucide-react';

export const Route = createFileRoute('/admin/')({
  component: AdminDashboard,
});

function AdminDashboard() {
  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const { data: trends } = useAdminSignupTrends(30);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
        <p className="text-gray-400">Overview of platform activity</p>
      </div>

      {/* Stats Grid */}
      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Users"
          value={stats?.total_users ?? 0}
          icon={Users}
          loading={statsLoading}
          subtitle={`${stats?.active_users ?? 0} active (30d)`}
        />
        <StatCard
          title="Partners"
          value={stats?.total_partners ?? 0}
          icon={UserPlus}
          loading={statsLoading}
          subtitle={`${stats?.active_partners ?? 0} active`}
        />
        <StatCard
          title="Campaigns"
          value={stats?.total_campaigns ?? 0}
          icon={Rocket}
          loading={statsLoading}
          subtitle={`${stats?.active_campaigns ?? 0} running`}
        />
        <StatCard
          title="Messages Sent"
          value={stats?.total_messages_sent ?? 0}
          icon={MessageSquare}
          loading={statsLoading}
          subtitle={`${stats?.total_leads ?? 0} leads`}
        />
      </div>

      {/* Growth Stats */}
      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-[#111113] p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-gray-400">New Users Today</p>
              <p className="text-2xl font-bold text-white">{stats?.new_users_today ?? 0}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#111113] p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
              <Calendar className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-gray-400">This Week</p>
              <p className="text-2xl font-bold text-white">{stats?.new_users_this_week ?? 0}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#111113] p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
              <Calendar className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <p className="text-sm text-gray-400">This Month</p>
              <p className="text-2xl font-bold text-white">{stats?.new_users_this_month ?? 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Signup Trends */}
      {trends && trends.daily.length > 0 && (
        <div className="rounded-xl border border-white/10 bg-[#111113] p-6">
          <h2 className="mb-4 text-lg font-semibold text-white">Signup Trends (Last 30 Days)</h2>
          <div className="h-48">
            <div className="flex h-full items-end gap-1">
              {trends.daily.map((day, index) => {
                const maxCount = Math.max(...trends.daily.map((d) => d.count), 1);
                const height = (day.count / maxCount) * 100;
                return (
                  <div
                    key={index}
                    className="group relative flex-1"
                    title={`${day.date}: ${day.count} signups`}
                  >
                    <div
                      className="w-full rounded-t bg-[#14B8A6] transition-colors hover:bg-[#14B8A6]/80"
                      style={{ height: `${Math.max(height, 2)}%` }}
                    />
                    <div className="absolute bottom-full left-1/2 mb-2 hidden -translate-x-1/2 rounded bg-gray-800 px-2 py-1 text-xs text-white group-hover:block">
                      {day.date}: {day.count}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  loading,
  subtitle,
}: {
  title: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  loading?: boolean;
  subtitle?: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#111113] p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#14B8A6]/10">
          <Icon className="h-5 w-5 text-[#14B8A6]" />
        </div>
      </div>
      <div>
        <p className="text-sm text-gray-400">{title}</p>
        {loading ? (
          <div className="mt-1 h-8 w-20 animate-pulse rounded bg-white/10" />
        ) : (
          <p className="text-2xl font-bold text-white">{value.toLocaleString()}</p>
        )}
        {subtitle && <p className="mt-1 text-xs text-gray-500">{subtitle}</p>}
      </div>
    </div>
  );
}
