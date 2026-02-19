import { createFileRoute } from '@tanstack/react-router';
import { createPortal } from 'react-dom';
import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  useAdminUsers,
  useUpdateAdminUser,
  useDeleteAdminUser,
  useImpersonateUser,
} from '@/lib/hooks/queries/useAdmin';
import { useAdminTheme } from '@/lib/adminTheme';
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
  AlertTriangle,
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
  const [deleteMode, setDeleteMode] = useState<'soft' | 'permanent'>('soft');
  const { theme } = useAdminTheme();

  const isDark = theme === 'dark';

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
      await deleteUser.mutateAsync({
        userId: deletingUser.id,
        permanent: deleteMode === 'permanent',
      });
      setDeletingUser(null);
      setDeleteMode('soft');
    } catch {
      // Error handled by mutation
    }
  };

  const totalPages = data ? Math.ceil(data.total / data.per_page) : 1;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Users</h1>
        <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>Manage all platform users</p>
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
            className={`h-10 w-full max-w-md rounded-lg border pl-10 pr-4 text-sm placeholder-gray-400 focus:border-[#14B8A6] focus:outline-none ${
              isDark
                ? 'border-white/10 bg-white/5 text-white'
                : 'border-gray-200 bg-white text-gray-900'
            }`}
          />
        </form>

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className={`h-10 rounded-lg border px-3 text-sm focus:border-[#14B8A6] focus:outline-none ${
            isDark
              ? 'border-white/10 bg-[#1A1A1C] text-white'
              : 'border-gray-200 bg-white text-gray-900'
          }`}
        >
          <option
            value=""
            className={isDark ? 'bg-[#1A1A1C] text-white' : 'bg-white text-gray-900'}
          >
            All Statuses
          </option>
          <option
            value="active"
            className={isDark ? 'bg-[#1A1A1C] text-white' : 'bg-white text-gray-900'}
          >
            Active
          </option>
          <option
            value="trialing"
            className={isDark ? 'bg-[#1A1A1C] text-white' : 'bg-white text-gray-900'}
          >
            Trialing
          </option>
          <option
            value="partner"
            className={isDark ? 'bg-[#1A1A1C] text-white' : 'bg-white text-gray-900'}
          >
            Partner
          </option>
          <option
            value="inactive"
            className={isDark ? 'bg-[#1A1A1C] text-white' : 'bg-white text-gray-900'}
          >
            Inactive
          </option>
        </select>
      </div>

      {/* Table */}
      <div
        className={`overflow-x-auto rounded-xl border ${isDark ? 'border-white/10 bg-[#111113]' : 'border-gray-200 bg-white'}`}
      >
        <table className="w-full">
          <thead>
            <tr className={`border-b text-left ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
              <th
                className={`px-6 py-4 text-xs font-medium uppercase ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
              >
                User
              </th>
              <th
                className={`px-6 py-4 text-xs font-medium uppercase ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
              >
                Status
              </th>
              <th
                className={`px-6 py-4 text-xs font-medium uppercase ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
              >
                Plan
              </th>
              <th
                className={`px-6 py-4 text-xs font-medium uppercase ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
              >
                Senders
              </th>
              <th
                className={`px-6 py-4 text-xs font-medium uppercase ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
              >
                Created
              </th>
              <th
                className={`px-6 py-4 text-xs font-medium uppercase ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td
                  colSpan={6}
                  className={`px-6 py-12 text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
                >
                  Loading...
                </td>
              </tr>
            ) : data?.items.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className={`px-6 py-12 text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
                >
                  No users found
                </td>
              </tr>
            ) : (
              data?.items.map((user) => (
                <UserRow
                  key={user.id}
                  user={user}
                  onEdit={() => setEditingUser(user)}
                  onDeactivate={() => {
                    setDeleteMode('soft');
                    setDeletingUser(user);
                  }}
                  onDeletePermanently={() => {
                    setDeleteMode('permanent');
                    setDeletingUser(user);
                  }}
                  onImpersonate={() => handleImpersonate(user)}
                  isDark={isDark}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data && data.total > data.per_page && (
        <div className="mt-4 flex items-center justify-between">
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Showing {(page - 1) * data.per_page + 1} to {Math.min(page * data.per_page, data.total)}{' '}
            of {data.total} users
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className={`flex h-9 w-9 items-center justify-center rounded-lg border disabled:opacity-50 ${
                isDark
                  ? 'border-white/10 text-gray-400 hover:bg-white/5'
                  : 'border-gray-200 text-gray-500 hover:bg-gray-100'
              }`}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className={`px-3 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page === totalPages}
              className={`flex h-9 w-9 items-center justify-center rounded-lg border disabled:opacity-50 ${
                isDark
                  ? 'border-white/10 text-gray-400 hover:bg-white/5'
                  : 'border-gray-200 text-gray-500 hover:bg-gray-100'
              }`}
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
            isDark={isDark}
          />
        )}
      </AnimatePresence>

      {/* Delete Confirmation */}
      <AnimatePresence>
        {deletingUser && (
          <DeleteConfirmModal
            user={deletingUser}
            permanent={deleteMode === 'permanent'}
            onClose={() => {
              setDeletingUser(null);
              setDeleteMode('soft');
            }}
            onConfirm={handleDelete}
            isLoading={deleteUser.isPending}
            isDark={isDark}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function UserRow({
  user,
  onEdit,
  onDeactivate,
  onDeletePermanently,
  onImpersonate,
  isDark,
}: {
  user: AdminUser;
  onEdit: () => void;
  onDeactivate: () => void;
  onDeletePermanently: () => void;
  onImpersonate: () => void;
  isDark: boolean;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
  const buttonRef = useRef<HTMLButtonElement>(null);

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

  const handleToggleMenu = () => {
    if (!showMenu && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const menuHeight = 140; // Approximate menu height

      // Position menu using fixed coordinates
      if (spaceBelow < menuHeight) {
        // Open upward
        setMenuStyle({
          position: 'fixed',
          top: rect.top - menuHeight,
          right: window.innerWidth - rect.right,
        });
      } else {
        // Open downward
        setMenuStyle({
          position: 'fixed',
          top: rect.bottom + 4,
          right: window.innerWidth - rect.right,
        });
      }
    }
    setShowMenu(!showMenu);
  };

  return (
    <tr
      className={`border-b ${isDark ? 'border-white/5 hover:bg-white/5' : 'border-gray-100 hover:bg-gray-50'}`}
    >
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#14B8A6]/10 text-[#14B8A6]">
            {user.name?.[0]?.toUpperCase() || user.email[0]?.toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {user.name || 'No name'}
              </p>
              {user.is_admin && (
                <span className="rounded bg-yellow-500/10 px-1.5 py-0.5 text-xs text-yellow-500">
                  Admin
                </span>
              )}
            </div>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{user.email}</p>
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
        <span className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {user.plan || 'starter'}
        </span>
      </td>
      <td className="px-6 py-4">
        <span className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {user.sender_count}
        </span>
      </td>
      <td className="px-6 py-4">
        <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          {new Date(user.created_at).toLocaleDateString()}
        </span>
      </td>
      <td className="px-6 py-4">
        <div className="relative">
          <button
            ref={buttonRef}
            onClick={handleToggleMenu}
            className={`flex h-8 w-8 items-center justify-center rounded-lg ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}
          >
            <MoreHorizontal className="h-4 w-4 text-gray-400" />
          </button>

          {showMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
              <div
                style={menuStyle}
                className={`z-50 w-48 rounded-lg border py-1 shadow-xl ${
                  isDark ? 'border-white/10 bg-[#1A1A1C]' : 'border-gray-200 bg-white'
                }`}
              >
                <button
                  onClick={() => {
                    onImpersonate();
                    setShowMenu(false);
                  }}
                  className={`flex w-full items-center gap-2 px-4 py-2 text-sm ${
                    isDark ? 'text-gray-300 hover:bg-white/5' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Eye className="h-4 w-4" />
                  Impersonate
                </button>
                <button
                  onClick={() => {
                    onEdit();
                    setShowMenu(false);
                  }}
                  className={`flex w-full items-center gap-2 px-4 py-2 text-sm ${
                    isDark ? 'text-gray-300 hover:bg-white/5' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Edit className="h-4 w-4" />
                  Edit
                </button>
                <button
                  onClick={() => {
                    onDeactivate();
                    setShowMenu(false);
                  }}
                  className={`flex w-full items-center gap-2 px-4 py-2 text-sm text-yellow-500 ${
                    isDark ? 'hover:bg-white/5' : 'hover:bg-gray-100'
                  }`}
                >
                  <X className="h-4 w-4" />
                  Deactivate
                </button>
                <button
                  onClick={() => {
                    onDeletePermanently();
                    setShowMenu(false);
                  }}
                  className={`flex w-full items-center gap-2 px-4 py-2 text-sm text-red-500 ${
                    isDark ? 'hover:bg-white/5' : 'hover:bg-gray-100'
                  }`}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete permanently
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
  isDark,
}: {
  user: AdminUser;
  onClose: () => void;
  onSave: (data: AdminUserUpdate) => Promise<void>;
  isLoading: boolean;
  isDark: boolean;
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

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-md rounded-xl border p-6 ${isDark ? 'border-white/10 bg-[#111113]' : 'border-gray-200 bg-white'}`}
      >
        <div className="mb-6 flex items-center justify-between">
          <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Edit User
          </h2>
          <button
            onClick={onClose}
            className={
              isDark ? 'text-gray-400 hover:text-white' : 'text-gray-400 hover:text-gray-600'
            }
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={`mb-1.5 block text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Name
            </label>
            <input
              type="text"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`h-10 w-full rounded-lg border px-3 focus:border-[#14B8A6] focus:outline-none ${
                isDark
                  ? 'border-white/10 bg-white/5 text-white'
                  : 'border-gray-200 bg-gray-50 text-gray-900'
              }`}
            />
          </div>

          <div>
            <label className={`mb-1.5 block text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Email
            </label>
            <input
              type="email"
              value={formData.email || ''}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className={`h-10 w-full rounded-lg border px-3 focus:border-[#14B8A6] focus:outline-none ${
                isDark
                  ? 'border-white/10 bg-white/5 text-white'
                  : 'border-gray-200 bg-gray-50 text-gray-900'
              }`}
            />
          </div>

          <div>
            <label className={`mb-1.5 block text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Subscription Status
            </label>
            <select
              value={formData.subscription_status || 'inactive'}
              onChange={(e) => setFormData({ ...formData, subscription_status: e.target.value })}
              className={`h-10 w-full rounded-lg border px-3 focus:border-[#14B8A6] focus:outline-none ${
                isDark
                  ? 'border-white/10 bg-[#1A1A1C] text-white'
                  : 'border-gray-200 bg-white text-gray-900'
              }`}
            >
              <option
                value="active"
                className={isDark ? 'bg-[#1A1A1C] text-white' : 'bg-white text-gray-900'}
              >
                Active
              </option>
              <option
                value="trialing"
                className={isDark ? 'bg-[#1A1A1C] text-white' : 'bg-white text-gray-900'}
              >
                Trialing
              </option>
              <option
                value="partner"
                className={isDark ? 'bg-[#1A1A1C] text-white' : 'bg-white text-gray-900'}
              >
                Partner
              </option>
              <option
                value="inactive"
                className={isDark ? 'bg-[#1A1A1C] text-white' : 'bg-white text-gray-900'}
              >
                Inactive
              </option>
              <option
                value="past_due"
                className={isDark ? 'bg-[#1A1A1C] text-white' : 'bg-white text-gray-900'}
              >
                Past Due
              </option>
            </select>
          </div>

          <div>
            <label className={`mb-1.5 block text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Sender Count
            </label>
            <input
              type="number"
              min="0"
              value={formData.sender_count || 0}
              onChange={(e) =>
                setFormData({ ...formData, sender_count: parseInt(e.target.value) || 0 })
              }
              className={`h-10 w-full rounded-lg border px-3 focus:border-[#14B8A6] focus:outline-none ${
                isDark
                  ? 'border-white/10 bg-white/5 text-white'
                  : 'border-gray-200 bg-gray-50 text-gray-900'
              }`}
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
              <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Admin</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="h-4 w-4 rounded border-white/10 bg-white/5 text-[#14B8A6] focus:ring-[#14B8A6]"
              />
              <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                Active
              </span>
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className={`rounded-lg border px-4 py-2 text-sm ${
                isDark
                  ? 'border-white/10 text-gray-300 hover:bg-white/5'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-100'
              }`}
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
    </motion.div>,
    document.body
  );
}

function DeleteConfirmModal({
  user,
  permanent,
  onClose,
  onConfirm,
  isLoading,
  isDark,
}: {
  user: AdminUser;
  permanent: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
  isDark: boolean;
}) {
  const [confirmText, setConfirmText] = useState('');

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-sm rounded-xl border p-6 ${isDark ? 'border-white/10 bg-[#111113]' : 'border-gray-200 bg-white'}`}
      >
        {permanent ? (
          <>
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/10">
                <AlertTriangle className="h-5 w-5 text-red-500" />
              </div>
              <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Delete User Permanently
              </h2>
            </div>
            <p className={`mb-3 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              This will permanently delete{' '}
              <strong className={isDark ? 'text-white' : 'text-gray-900'}>{user.email}</strong> and
              all their data including leads, campaigns, messages, and connected accounts. This
              action cannot be undone.
            </p>
            <p className={`mb-4 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Type <strong className="text-red-500">DELETE</strong> to confirm:
            </p>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="DELETE"
              className={`mb-6 h-10 w-full rounded-lg border px-3 text-sm focus:border-red-500 focus:outline-none ${
                isDark
                  ? 'border-white/10 bg-white/5 text-white placeholder-gray-500'
                  : 'border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400'
              }`}
            />
          </>
        ) : (
          <>
            <h2 className={`mb-2 text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Deactivate User
            </h2>
            <p className={`mb-6 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Are you sure you want to deactivate{' '}
              <strong className={isDark ? 'text-white' : 'text-gray-900'}>{user.email}</strong>?
              They will no longer be able to access the platform. Their data will be preserved.
            </p>
          </>
        )}

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className={`rounded-lg border px-4 py-2 text-sm ${
              isDark
                ? 'border-white/10 text-gray-300 hover:bg-white/5'
                : 'border-gray-200 text-gray-600 hover:bg-gray-100'
            }`}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading || (permanent && confirmText !== 'DELETE')}
            className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50"
          >
            {isLoading
              ? permanent
                ? 'Deleting...'
                : 'Deactivating...'
              : permanent
                ? 'Delete permanently'
                : 'Deactivate'}
          </button>
        </div>
      </motion.div>
    </motion.div>,
    document.body
  );
}
