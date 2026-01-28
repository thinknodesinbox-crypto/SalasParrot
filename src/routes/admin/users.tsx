import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  useAdminUsers,
  useUpdateAdminUser,
  useDeleteAdminUser,
  useImpersonateUser,
} from '@/lib/hooks/queries/useAdmin';
import { setAccessToken } from '@/lib/api';
import type { AdminUser, AdminUserUpdate } from '@/lib/types';
import {
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  Eye,
} from 'lucide-react';

export const Route = createFileRoute('/admin/users')({
  component: AdminUsersPage,
});

function AdminUsersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [deletingUser, setDeletingUser] = useState<AdminUser | null>(null);

  const { data, isLoading } = useAdminUsers({
    page,
    perPage: 20,
    search: search || undefined,
    subscriptionStatus: statusFilter || undefined,
  });

  const updateUser = useUpdateAdminUser();
  const deleteUser = useDeleteAdminUser();
  const impersonateUser = useImpersonateUser();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const handleImpersonate = async (user: AdminUser) => {
    try {
      const result = await impersonateUser.mutateAsync(user.id);
      // Store the impersonation token
      setAccessToken(result.access_token);
      // Store impersonation info in sessionStorage
      sessionStorage.setItem(
        'impersonating',
        JSON.stringify({
          userId: result.user_id,
          userEmail: result.user_email,
          expiresIn: result.expires_in,
        })
      );
      window.location.href = '/dashboard';
    } catch {
      // Error handled by mutation
    }
  };

  const handleDelete = async () => {
    if (!deletingUser) return;
    try {
      await deleteUser.mutateAsync(deletingUser.id);
      setDeletingUser(null);
    } catch {
      // Error handled by mutation
    }
  };

  const totalPages = data ? Math.ceil(data.total / data.per_page) : 1;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Users</h1>
        <p className="text-gray-400">Manage all platform users</p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <form onSubmit={handleSearch} className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="h-10 w-full max-w-md rounded-lg border border-white/10 bg-white/5 pl-10 pr-4 text-sm text-white placeholder-gray-400 focus:border-[#14B8A6] focus:outline-none"
          />
        </form>

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="h-10 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white focus:border-[#14B8A6] focus:outline-none"
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="trialing">Trialing</option>
          <option value="partner">Partner</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-white/10 bg-[#111113]">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10 text-left">
              <th className="px-6 py-4 text-xs font-medium uppercase text-gray-400">User</th>
              <th className="px-6 py-4 text-xs font-medium uppercase text-gray-400">Status</th>
              <th className="px-6 py-4 text-xs font-medium uppercase text-gray-400">Plan</th>
              <th className="px-6 py-4 text-xs font-medium uppercase text-gray-400">Senders</th>
              <th className="px-6 py-4 text-xs font-medium uppercase text-gray-400">Created</th>
              <th className="px-6 py-4 text-xs font-medium uppercase text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                  Loading...
                </td>
              </tr>
            ) : data?.items.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                  No users found
                </td>
              </tr>
            ) : (
              data?.items.map((user) => (
                <UserRow
                  key={user.id}
                  user={user}
                  onEdit={() => setEditingUser(user)}
                  onDelete={() => setDeletingUser(user)}
                  onImpersonate={() => handleImpersonate(user)}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data && data.total > data.per_page && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-gray-400">
            Showing {(page - 1) * data.per_page + 1} to {Math.min(page * data.per_page, data.total)}{' '}
            of {data.total} users
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-gray-400 hover:bg-white/5 disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-3 text-sm text-gray-400">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page === totalPages}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-gray-400 hover:bg-white/5 disabled:opacity-50"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      <AnimatePresence>
        {editingUser && (
          <EditUserModal
            user={editingUser}
            onClose={() => setEditingUser(null)}
            onSave={async (data) => {
              await updateUser.mutateAsync({ userId: editingUser.id, data });
              setEditingUser(null);
            }}
            isLoading={updateUser.isPending}
          />
        )}
      </AnimatePresence>

      {/* Delete Confirmation */}
      <AnimatePresence>
        {deletingUser && (
          <DeleteConfirmModal
            user={deletingUser}
            onClose={() => setDeletingUser(null)}
            onConfirm={handleDelete}
            isLoading={deleteUser.isPending}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function UserRow({
  user,
  onEdit,
  onDelete,
  onImpersonate,
}: {
  user: AdminUser;
  onEdit: () => void;
  onDelete: () => void;
  onImpersonate: () => void;
}) {
  const [showMenu, setShowMenu] = useState(false);

  const getStatusBadge = (status: string | null) => {
    const statusColors: Record<string, string> = {
      active: 'bg-green-500/10 text-green-500',
      trialing: 'bg-blue-500/10 text-blue-500',
      partner: 'bg-purple-500/10 text-purple-500',
      inactive: 'bg-gray-500/10 text-gray-500',
      past_due: 'bg-yellow-500/10 text-yellow-500',
    };
    return statusColors[status || 'inactive'] || statusColors.inactive;
  };

  return (
    <tr className="border-b border-white/5 hover:bg-white/5">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#14B8A6]/10 text-[#14B8A6]">
            {user.name?.[0]?.toUpperCase() || user.email[0]?.toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-medium text-white">{user.name || 'No name'}</p>
              {user.is_admin && (
                <span className="rounded bg-yellow-500/10 px-1.5 py-0.5 text-xs text-yellow-500">
                  Admin
                </span>
              )}
            </div>
            <p className="text-sm text-gray-400">{user.email}</p>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-medium ${getStatusBadge(user.subscription_status)}`}
        >
          {user.subscription_status || 'inactive'}
        </span>
      </td>
      <td className="px-6 py-4">
        <span className="text-sm text-white">{user.plan || 'starter'}</span>
      </td>
      <td className="px-6 py-4">
        <span className="text-sm text-white">{user.sender_count}</span>
      </td>
      <td className="px-6 py-4">
        <span className="text-sm text-gray-400">
          {new Date(user.created_at).toLocaleDateString()}
        </span>
      </td>
      <td className="px-6 py-4">
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-white/10"
          >
            <MoreHorizontal className="h-4 w-4 text-gray-400" />
          </button>

          {showMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 top-full z-20 mt-1 w-48 rounded-lg border border-white/10 bg-[#1A1A1C] py-1 shadow-xl">
                <button
                  onClick={() => {
                    onImpersonate();
                    setShowMenu(false);
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-white/5"
                >
                  <Eye className="h-4 w-4" />
                  Impersonate
                </button>
                <button
                  onClick={() => {
                    onEdit();
                    setShowMenu(false);
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-white/5"
                >
                  <Edit className="h-4 w-4" />
                  Edit
                </button>
                <button
                  onClick={() => {
                    onDelete();
                    setShowMenu(false);
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-white/5"
                >
                  <Trash2 className="h-4 w-4" />
                  Deactivate
                </button>
              </div>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}

function EditUserModal({
  user,
  onClose,
  onSave,
  isLoading,
}: {
  user: AdminUser;
  onClose: () => void;
  onSave: (data: AdminUserUpdate) => Promise<void>;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState<AdminUserUpdate>({
    name: user.name || '',
    email: user.email,
    is_admin: user.is_admin,
    is_active: user.is_active,
    subscription_status: user.subscription_status || 'inactive',
    sender_count: user.sender_count,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
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
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-xl border border-white/10 bg-[#111113] p-6"
      >
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Edit User</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm text-gray-400">Name</label>
            <input
              type="text"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-white focus:border-[#14B8A6] focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm text-gray-400">Email</label>
            <input
              type="email"
              value={formData.email || ''}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-white focus:border-[#14B8A6] focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm text-gray-400">Subscription Status</label>
            <select
              value={formData.subscription_status || 'inactive'}
              onChange={(e) => setFormData({ ...formData, subscription_status: e.target.value })}
              className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-white focus:border-[#14B8A6] focus:outline-none"
            >
              <option value="active">Active</option>
              <option value="trialing">Trialing</option>
              <option value="partner">Partner</option>
              <option value="inactive">Inactive</option>
              <option value="past_due">Past Due</option>
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm text-gray-400">Sender Count</label>
            <input
              type="number"
              min="0"
              value={formData.sender_count || 0}
              onChange={(e) =>
                setFormData({ ...formData, sender_count: parseInt(e.target.value) || 0 })
              }
              className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-white focus:border-[#14B8A6] focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.is_admin}
                onChange={(e) => setFormData({ ...formData, is_admin: e.target.checked })}
                className="h-4 w-4 rounded border-white/10 bg-white/5 text-[#14B8A6] focus:ring-[#14B8A6]"
              />
              <span className="text-sm text-gray-300">Admin</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="h-4 w-4 rounded border-white/10 bg-white/5 text-[#14B8A6] focus:ring-[#14B8A6]"
              />
              <span className="text-sm text-gray-300">Active</span>
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-white/10 px-4 py-2 text-sm text-gray-300 hover:bg-white/5"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="rounded-lg bg-[#14B8A6] px-4 py-2 text-sm font-medium text-white hover:bg-[#14B8A6]/90 disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

function DeleteConfirmModal({
  user,
  onClose,
  onConfirm,
  isLoading,
}: {
  user: AdminUser;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-xl border border-white/10 bg-[#111113] p-6"
      >
        <h2 className="mb-2 text-lg font-semibold text-white">Deactivate User</h2>
        <p className="mb-6 text-sm text-gray-400">
          Are you sure you want to deactivate <strong className="text-white">{user.email}</strong>?
          They will no longer be able to access the platform.
        </p>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-lg border border-white/10 px-4 py-2 text-sm text-gray-300 hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50"
          >
            {isLoading ? 'Deactivating...' : 'Deactivate'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
