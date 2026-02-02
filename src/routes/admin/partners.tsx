import { createFileRoute } from '@tanstack/react-router';
import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  usePartnerCodes,
  useCreatePartnerCode,
  useUpdatePartnerCode,
  useDisablePartnerCode,
  useEnablePartnerCode,
  useDuplicatePartnerCode,
  useDeletePartnerCode,
  usePartnerCodeTemplates,
} from '@/lib/hooks/queries/useAdmin';
import { useAdminTheme } from '@/lib/adminTheme';
import type {
  PartnerCode,
  PartnerCodeCreate,
  PartnerCodeUpdate,
  PartnerCodeTemplate,
} from '@/lib/types';
import {
  Search,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Copy,
  X,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  XCircle,
  Power,
  PowerOff,
  Users,
  DollarSign,
  Calendar,
  Hash,
} from 'lucide-react';

export const Route = createFileRoute('/admin/partners')({
  component: AdminPartnerCodesPage,
});

function AdminPartnerCodesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCode, setEditingCode] = useState<PartnerCode | null>(null);
  const [viewingCode, setViewingCode] = useState<PartnerCode | null>(null);
  const [duplicatingCode, setDuplicatingCode] = useState<PartnerCode | null>(null);
  const [deletingCode, setDeletingCode] = useState<PartnerCode | null>(null);
  const { theme } = useAdminTheme();

  const isDark = theme === 'dark';

  const { data, isLoading } = usePartnerCodes({
    page,
    perPage: 20,
    search: search || undefined,
    isActive: statusFilter === 'active' ? true : statusFilter === 'inactive' ? false : undefined,
    expired: statusFilter === 'expired' ? true : undefined,
  });

  const createCode = useCreatePartnerCode();
  const updateCode = useUpdatePartnerCode();
  const disableCode = useDisablePartnerCode();
  const enableCode = useEnablePartnerCode();
  const duplicateCode = useDuplicatePartnerCode();
  const deleteCode = useDeletePartnerCode();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const handleCreate = async (data: PartnerCodeCreate) => {
    await createCode.mutateAsync(data);
    setShowCreateModal(false);
  };

  const handleUpdate = async (data: PartnerCodeUpdate) => {
    if (!editingCode) return;
    await updateCode.mutateAsync({ codeId: editingCode.id, data });
    setEditingCode(null);
  };

  const handleToggleStatus = async (code: PartnerCode) => {
    if (code.is_active) {
      await disableCode.mutateAsync(code.id);
    } else {
      await enableCode.mutateAsync(code.id);
    }
  };

  const handleDuplicate = async (newCode?: string) => {
    if (!duplicatingCode) return;
    await duplicateCode.mutateAsync({ codeId: duplicatingCode.id, newCode });
    setDuplicatingCode(null);
  };

  const handleDelete = async () => {
    if (!deletingCode) return;
    await deleteCode.mutateAsync(deletingCode.id);
    setDeletingCode(null);
  };

  const totalPages = data ? Math.ceil(data.total / data.per_page) : 1;

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Partner Codes
          </h1>
          <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
            Create and manage partner codes for free access
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 rounded-lg bg-[#14B8A6] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#14B8A6]/90"
        >
          <Plus className="h-4 w-4" />
          Create Code
        </button>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <form onSubmit={handleSearch} className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by code, partner name, or email..."
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
            All Codes
          </option>
          <option
            value="active"
            className={isDark ? 'bg-[#1A1A1C] text-white' : 'bg-white text-gray-900'}
          >
            Active
          </option>
          <option
            value="inactive"
            className={isDark ? 'bg-[#1A1A1C] text-white' : 'bg-white text-gray-900'}
          >
            Disabled
          </option>
          <option
            value="expired"
            className={isDark ? 'bg-[#1A1A1C] text-white' : 'bg-white text-gray-900'}
          >
            Expired
          </option>
        </select>
      </div>

      {/* Table */}
      <div
        className={`overflow-hidden rounded-xl border ${isDark ? 'border-white/10 bg-[#111113]' : 'border-gray-200 bg-white'}`}
      >
        <table className="w-full">
          <thead>
            <tr className={`border-b text-left ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
              <th
                className={`px-6 py-4 text-xs font-medium uppercase ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
              >
                Code
              </th>
              <th
                className={`px-6 py-4 text-xs font-medium uppercase ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
              >
                Partner
              </th>
              <th
                className={`px-6 py-4 text-xs font-medium uppercase ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
              >
                Access
              </th>
              <th
                className={`px-6 py-4 text-xs font-medium uppercase ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
              >
                Uses
              </th>
              <th
                className={`px-6 py-4 text-xs font-medium uppercase ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
              >
                Status
              </th>
              <th
                className={`px-6 py-4 text-xs font-medium uppercase ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
              >
                Expires
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
                  colSpan={7}
                  className={`px-6 py-12 text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
                >
                  Loading...
                </td>
              </tr>
            ) : data?.items.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className={`px-6 py-12 text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
                >
                  No partner codes found
                </td>
              </tr>
            ) : (
              data?.items.map((code) => (
                <PartnerCodeRow
                  key={code.id}
                  code={code}
                  onView={() => setViewingCode(code)}
                  onEdit={() => setEditingCode(code)}
                  onDuplicate={() => setDuplicatingCode(code)}
                  onToggleStatus={() => handleToggleStatus(code)}
                  onDelete={() => setDeletingCode(code)}
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
            of {data.total} codes
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

      {/* Create Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateCodeModal
            onClose={() => setShowCreateModal(false)}
            onCreate={handleCreate}
            isLoading={createCode.isPending}
          />
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingCode && (
          <EditCodeModal
            code={editingCode}
            onClose={() => setEditingCode(null)}
            onSave={handleUpdate}
            isLoading={updateCode.isPending}
          />
        )}
      </AnimatePresence>

      {/* View Modal */}
      <AnimatePresence>
        {viewingCode && <ViewCodeModal code={viewingCode} onClose={() => setViewingCode(null)} />}
      </AnimatePresence>

      {/* Duplicate Modal */}
      <AnimatePresence>
        {duplicatingCode && (
          <DuplicateCodeModal
            code={duplicatingCode}
            onClose={() => setDuplicatingCode(null)}
            onDuplicate={handleDuplicate}
            isLoading={duplicateCode.isPending}
          />
        )}
      </AnimatePresence>

      {/* Delete Confirmation */}
      <AnimatePresence>
        {deletingCode && (
          <DeleteConfirmModal
            code={deletingCode}
            onClose={() => setDeletingCode(null)}
            onConfirm={handleDelete}
            isLoading={deleteCode.isPending}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function PartnerCodeRow({
  code,
  onView,
  onEdit,
  onDuplicate,
  onToggleStatus,
  onDelete,
  isDark,
}: {
  code: PartnerCode;
  onView: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onToggleStatus: () => void;
  onDelete: () => void;
  isDark: boolean;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleToggleMenu = () => {
    if (!showMenu && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const menuHeight = 220; // Approximate menu height

      if (spaceBelow < menuHeight) {
        // Position above the button
        setMenuStyle({
          position: 'fixed',
          bottom: window.innerHeight - rect.top,
          right: window.innerWidth - rect.right,
        });
      } else {
        // Position below the button
        setMenuStyle({
          position: 'fixed',
          top: rect.bottom,
          right: window.innerWidth - rect.right,
        });
      }
    }
    setShowMenu(!showMenu);
  };

  const getStatusDisplay = () => {
    if (!code.is_active) {
      return (
        <span className="flex items-center gap-1.5 text-sm text-gray-400">
          <XCircle className="h-4 w-4" />
          Disabled
        </span>
      );
    }
    if (code.is_expired) {
      return (
        <span className="flex items-center gap-1.5 text-sm text-yellow-500">
          <AlertCircle className="h-4 w-4" />
          Expired
        </span>
      );
    }
    if (code.is_maxed_out) {
      return (
        <span className="flex items-center gap-1.5 text-sm text-orange-500">
          <AlertCircle className="h-4 w-4" />
          Maxed Out
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1.5 text-sm text-green-500">
        <CheckCircle className="h-4 w-4" />
        Active
      </span>
    );
  };

  return (
    <tr
      className={`border-b ${isDark ? 'border-white/5 hover:bg-white/5' : 'border-gray-100 hover:bg-gray-50'}`}
    >
      <td className="px-6 py-4">
        <button
          onClick={onView}
          className="font-mono text-sm font-medium text-[#14B8A6] hover:underline"
        >
          {code.code}
        </button>
      </td>
      <td className="px-6 py-4">
        <div>
          <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {code.partner_name}
          </p>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            {code.partner_email}
          </p>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex flex-col gap-1">
          <span
            className={`inline-flex w-fit rounded-full px-2 py-0.5 text-xs font-medium ${
              code.access_type === 'full'
                ? 'bg-[#14B8A6]/10 text-[#14B8A6]'
                : 'bg-orange-500/10 text-orange-400'
            }`}
          >
            {code.access_type === 'full' ? 'Full Access' : 'Limited'}
          </span>
          <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            {code.duration_days ? `${code.duration_days} days` : 'Lifetime'}
          </span>
        </div>
      </td>
      <td className="px-6 py-4">
        <span className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {code.current_uses}
          {code.max_uses && (
            <span className={isDark ? 'text-gray-400' : 'text-gray-500'}> / {code.max_uses}</span>
          )}
        </span>
      </td>
      <td className="px-6 py-4">{getStatusDisplay()}</td>
      <td className="px-6 py-4">
        <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          {code.code_expiry ? new Date(code.code_expiry).toLocaleDateString() : 'Never'}
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
                    onView();
                    setShowMenu(false);
                  }}
                  className={`flex w-full items-center gap-2 px-4 py-2 text-sm ${
                    isDark ? 'text-gray-300 hover:bg-white/5' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Users className="h-4 w-4" />
                  View Details
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
                    onDuplicate();
                    setShowMenu(false);
                  }}
                  className={`flex w-full items-center gap-2 px-4 py-2 text-sm ${
                    isDark ? 'text-gray-300 hover:bg-white/5' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Copy className="h-4 w-4" />
                  Duplicate
                </button>
                <button
                  onClick={() => {
                    onToggleStatus();
                    setShowMenu(false);
                  }}
                  className={`flex w-full items-center gap-2 px-4 py-2 text-sm ${
                    isDark ? 'hover:bg-white/5' : 'hover:bg-gray-100'
                  } ${code.is_active ? 'text-yellow-400' : 'text-green-400'}`}
                >
                  {code.is_active ? (
                    <>
                      <PowerOff className="h-4 w-4" />
                      Disable
                    </>
                  ) : (
                    <>
                      <Power className="h-4 w-4" />
                      Enable
                    </>
                  )}
                </button>
                {code.current_uses === 0 && (
                  <button
                    onClick={() => {
                      onDelete();
                      setShowMenu(false);
                    }}
                    className={`flex w-full items-center gap-2 px-4 py-2 text-sm text-red-400 ${
                      isDark ? 'hover:bg-white/5' : 'hover:bg-gray-100'
                    }`}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}

function CreateCodeModal({
  onClose,
  onCreate,
  isLoading,
}: {
  onClose: () => void;
  onCreate: (data: PartnerCodeCreate) => Promise<void>;
  isLoading: boolean;
}) {
  const { data: templates } = usePartnerCodeTemplates();
  const [selectedTemplate, setSelectedTemplate] = useState<PartnerCodeTemplate | null>(null);
  const [formData, setFormData] = useState<PartnerCodeCreate>({
    code: '',
    partner_name: '',
    partner_email: '',
    access_type: 'full',
    duration_days: 30,
    new_users_only: true,
    revenue_share_enabled: false,
  });

  const applyTemplate = (template: PartnerCodeTemplate) => {
    setSelectedTemplate(template);
    setFormData({
      ...formData,
      access_type: template.access_type,
      duration_days: template.duration_days,
      revenue_share_enabled: template.revenue_share_enabled,
      revenue_share_percent: template.revenue_share_percent,
      revenue_share_duration: template.revenue_share_duration,
      max_senders: template.max_senders,
      api_access: template.api_access,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Convert empty code to undefined so backend will auto-generate
    const data = {
      ...formData,
      code: formData.code?.trim() || undefined,
    };
    onCreate(data);
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
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-white/10 bg-[#111113] p-6"
      >
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Create Partner Code</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Templates */}
        {templates && templates.length > 0 && (
          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-gray-400">Quick Templates</label>
            <div className="flex flex-wrap gap-2">
              {templates.map((template) => (
                <button
                  key={template.name}
                  type="button"
                  onClick={() => applyTemplate(template)}
                  className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                    selectedTemplate?.name === template.name
                      ? 'border-[#14B8A6] bg-[#14B8A6]/10 text-[#14B8A6]'
                      : 'border-white/10 text-gray-300 hover:border-white/20 hover:bg-white/5'
                  }`}
                >
                  {template.name}
                </button>
              ))}
            </div>
            {selectedTemplate && (
              <p className="mt-2 text-xs text-gray-500">{selectedTemplate.description}</p>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm text-gray-400">
                Code <span className="text-gray-500">(auto-generated if empty)</span>
              </label>
              <input
                type="text"
                value={formData.code || ''}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="PARTNER50"
                className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 font-mono text-white focus:border-[#14B8A6] focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-gray-400">Partner Name *</label>
              <input
                type="text"
                required
                value={formData.partner_name}
                onChange={(e) => setFormData({ ...formData, partner_name: e.target.value })}
                placeholder="John Doe"
                className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-white focus:border-[#14B8A6] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm text-gray-400">Partner Email *</label>
            <input
              type="email"
              required
              value={formData.partner_email}
              onChange={(e) => setFormData({ ...formData, partner_email: e.target.value })}
              placeholder="partner@company.com"
              className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-white focus:border-[#14B8A6] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm text-gray-400">Access Type</label>
              <select
                value={formData.access_type}
                onChange={(e) =>
                  setFormData({ ...formData, access_type: e.target.value as 'full' | 'limited' })
                }
                className="h-10 w-full rounded-lg border border-white/10 bg-[#1A1A1C] px-3 text-white focus:border-[#14B8A6] focus:outline-none"
              >
                <option value="full" className="bg-[#1A1A1C] text-white">
                  Full Access
                </option>
                <option value="limited" className="bg-[#1A1A1C] text-white">
                  Limited Access
                </option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-gray-400">
                Duration (days) <span className="text-gray-500">(empty = lifetime)</span>
              </label>
              <input
                type="number"
                min="1"
                value={formData.duration_days || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    duration_days: e.target.value ? parseInt(e.target.value) : null,
                  })
                }
                placeholder="30"
                className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-white focus:border-[#14B8A6] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm text-gray-400">
                Max Uses <span className="text-gray-500">(empty = unlimited)</span>
              </label>
              <input
                type="number"
                min="1"
                value={formData.max_uses || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    max_uses: e.target.value ? parseInt(e.target.value) : null,
                  })
                }
                placeholder="100"
                className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-white focus:border-[#14B8A6] focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-gray-400">
                Code Expiry <span className="text-gray-500">(empty = never)</span>
              </label>
              <input
                type="date"
                value={formData.code_expiry ? formData.code_expiry.split('T')[0] : ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    code_expiry: e.target.value
                      ? new Date(e.target.value).toISOString()
                      : undefined,
                  })
                }
                className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-white focus:border-[#14B8A6] focus:outline-none"
              />
            </div>
          </div>

          {/* Code Restrictions */}
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.new_users_only ?? true}
                onChange={(e) => setFormData({ ...formData, new_users_only: e.target.checked })}
                className="h-4 w-4 rounded border-white/10 bg-white/5 text-[#14B8A6] focus:ring-[#14B8A6]"
              />
              <span className="text-sm text-gray-300">New users only</span>
            </label>
            <span className="text-xs text-gray-500">
              (Uncheck to allow existing users to redeem)
            </span>
          </div>

          {/* Revenue Share */}
          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <div className="mb-3 flex items-center gap-3">
              <input
                type="checkbox"
                id="revenue_share"
                checked={formData.revenue_share_enabled}
                onChange={(e) =>
                  setFormData({ ...formData, revenue_share_enabled: e.target.checked })
                }
                className="h-4 w-4 rounded border-white/10 bg-white/5 text-[#14B8A6] focus:ring-[#14B8A6]"
              />
              <label htmlFor="revenue_share" className="text-sm font-medium text-white">
                Enable Revenue Share
              </label>
            </div>

            {formData.revenue_share_enabled && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm text-gray-400">Percentage</label>
                  <input
                    type="number"
                    min="10"
                    max="50"
                    value={formData.revenue_share_percent || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        revenue_share_percent: parseInt(e.target.value) || null,
                      })
                    }
                    placeholder="25"
                    className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-white focus:border-[#14B8A6] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm text-gray-400">Duration</label>
                  <select
                    value={formData.revenue_share_duration || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        revenue_share_duration: e.target
                          .value as PartnerCodeCreate['revenue_share_duration'],
                      })
                    }
                    className="h-10 w-full rounded-lg border border-white/10 bg-[#1A1A1C] px-3 text-white focus:border-[#14B8A6] focus:outline-none"
                  >
                    <option value="" className="bg-[#1A1A1C] text-white">
                      Select duration
                    </option>
                    <option value="first_payment" className="bg-[#1A1A1C] text-white">
                      First Payment Only
                    </option>
                    <option value="3_months" className="bg-[#1A1A1C] text-white">
                      3 Months
                    </option>
                    <option value="1_year" className="bg-[#1A1A1C] text-white">
                      1 Year
                    </option>
                    <option value="lifetime" className="bg-[#1A1A1C] text-white">
                      Lifetime
                    </option>
                  </select>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-sm text-gray-400">Notes</label>
            <textarea
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white focus:border-[#14B8A6] focus:outline-none"
              placeholder="Internal notes about this partner code..."
            />
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
              disabled={isLoading || !formData.partner_name || !formData.partner_email}
              className="rounded-lg bg-[#14B8A6] px-4 py-2 text-sm font-medium text-white hover:bg-[#14B8A6]/90 disabled:opacity-50"
            >
              {isLoading ? 'Creating...' : 'Create Code'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

function EditCodeModal({
  code,
  onClose,
  onSave,
  isLoading,
}: {
  code: PartnerCode;
  onClose: () => void;
  onSave: (data: PartnerCodeUpdate) => Promise<void>;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState<PartnerCodeUpdate>({
    partner_name: code.partner_name,
    partner_email: code.partner_email,
    notes: code.notes || '',
    access_type: code.access_type,
    duration_days: code.duration_days,
    max_uses: code.max_uses,
    new_users_only: code.new_users_only,
    revenue_share_enabled: code.revenue_share_enabled,
    revenue_share_percent: code.revenue_share_percent,
    revenue_share_duration: code.revenue_share_duration,
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
          <div>
            <h2 className="text-lg font-semibold text-white">Edit Partner Code</h2>
            <p className="font-mono text-sm text-[#14B8A6]">{code.code}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm text-gray-400">Partner Name</label>
            <input
              type="text"
              value={formData.partner_name || ''}
              onChange={(e) => setFormData({ ...formData, partner_name: e.target.value })}
              className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-white focus:border-[#14B8A6] focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm text-gray-400">Partner Email</label>
            <input
              type="email"
              value={formData.partner_email || ''}
              onChange={(e) => setFormData({ ...formData, partner_email: e.target.value })}
              className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-white focus:border-[#14B8A6] focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm text-gray-400">Notes</label>
            <textarea
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white focus:border-[#14B8A6] focus:outline-none"
            />
          </div>

          {/* Code Restrictions */}
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.new_users_only ?? true}
                onChange={(e) => setFormData({ ...formData, new_users_only: e.target.checked })}
                className="h-4 w-4 rounded border-white/10 bg-white/5 text-[#14B8A6] focus:ring-[#14B8A6]"
              />
              <span className="text-sm text-gray-300">New users only</span>
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

function ViewCodeModal({ code, onClose }: { code: PartnerCode; onClose: () => void }) {
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
        className="w-full max-w-lg rounded-xl border border-white/10 bg-[#111113] p-6"
      >
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Partner Code Details</h2>
            <p className="font-mono text-xl text-[#14B8A6]">{code.code}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Partner Info */}
          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <h3 className="mb-2 text-sm font-medium text-gray-400">Partner</h3>
            <p className="text-white">{code.partner_name}</p>
            <p className="text-sm text-gray-400">{code.partner_email}</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <div className="flex items-center gap-2 text-gray-400">
                <Hash className="h-4 w-4" />
                <span className="text-sm">Uses</span>
              </div>
              <p className="mt-1 text-xl font-semibold text-white">
                {code.current_uses}
                {code.max_uses && <span className="text-gray-400"> / {code.max_uses}</span>}
              </p>
            </div>

            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <div className="flex items-center gap-2 text-gray-400">
                <Calendar className="h-4 w-4" />
                <span className="text-sm">Duration</span>
              </div>
              <p className="mt-1 text-xl font-semibold text-white">
                {code.duration_days ? `${code.duration_days} days` : 'Lifetime'}
              </p>
            </div>

            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <div className="flex items-center gap-2 text-gray-400">
                <Users className="h-4 w-4" />
                <span className="text-sm">Access Type</span>
              </div>
              <p className="mt-1 text-xl font-semibold capitalize text-white">{code.access_type}</p>
            </div>

            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <div className="flex items-center gap-2 text-gray-400">
                <DollarSign className="h-4 w-4" />
                <span className="text-sm">Revenue Share</span>
              </div>
              <p className="mt-1 text-xl font-semibold text-white">
                {code.revenue_share_enabled ? `${code.revenue_share_percent}%` : 'None'}
              </p>
            </div>
          </div>

          {/* Settings */}
          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <h3 className="mb-3 text-sm font-medium text-gray-400">Settings</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">New Users Only</span>
                <span className="text-white">{code.new_users_only ? 'Yes' : 'No'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Single Use Per User</span>
                <span className="text-white">{code.single_use_per_user ? 'Yes' : 'No'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">API Access</span>
                <span className="text-white">{code.api_access ? 'Yes' : 'No'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Export Data</span>
                <span className="text-white">{code.export_data ? 'Yes' : 'No'}</span>
              </div>
              {code.max_senders && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Max Senders</span>
                  <span className="text-white">{code.max_senders}</span>
                </div>
              )}
            </div>
          </div>

          {code.notes && (
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <h3 className="mb-2 text-sm font-medium text-gray-400">Notes</h3>
              <p className="text-sm text-white">{code.notes}</p>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-lg border border-white/10 px-4 py-2 text-sm text-gray-300 hover:bg-white/5"
          >
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function DuplicateCodeModal({
  code,
  onClose,
  onDuplicate,
  isLoading,
}: {
  code: PartnerCode;
  onClose: () => void;
  onDuplicate: (newCode?: string) => Promise<void>;
  isLoading: boolean;
}) {
  const [newCode, setNewCode] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onDuplicate(newCode || undefined);
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
        className="w-full max-w-sm rounded-xl border border-white/10 bg-[#111113] p-6"
      >
        <h2 className="mb-2 text-lg font-semibold text-white">Duplicate Code</h2>
        <p className="mb-4 text-sm text-gray-400">
          Create a copy of <strong className="font-mono text-[#14B8A6]">{code.code}</strong> with a
          new code string.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="mb-1.5 block text-sm text-gray-400">
              New Code <span className="text-gray-500">(auto-generated if empty)</span>
            </label>
            <input
              type="text"
              value={newCode}
              onChange={(e) => setNewCode(e.target.value.toUpperCase())}
              placeholder="NEWCODE50"
              className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 font-mono text-white focus:border-[#14B8A6] focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-3">
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
              {isLoading ? 'Duplicating...' : 'Duplicate'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

function DeleteConfirmModal({
  code,
  onClose,
  onConfirm,
  isLoading,
}: {
  code: PartnerCode;
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
        <h2 className="mb-2 text-lg font-semibold text-white">Delete Partner Code</h2>
        <p className="mb-6 text-sm text-gray-400">
          Are you sure you want to delete{' '}
          <strong className="font-mono text-[#14B8A6]">{code.code}</strong>? This action cannot be
          undone.
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
            {isLoading ? 'Deleting...' : 'Delete Code'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
