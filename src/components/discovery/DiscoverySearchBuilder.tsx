import { useMemo } from 'react';
import type {
  DiscoveryScheduleType,
  DiscoverySearchPreview,
  DiscoverySearchStatus,
  DiscoverySearchType,
  LeadList,
  LinkedInAccount,
  SavedDiscoverySearch,
} from '@/lib/types';

export interface DiscoveryFormState {
  name: string;
  searchType: DiscoverySearchType;
  description: string;
  keywords: string;
  targetTitles: string;
  locations: string;
  eventTypes: string;
  webEnabled: boolean;
  webMaxResults: string;
  linkedinEnabled: boolean;
  linkedinAccountId: string;
  linkedinSearchParams: string;
  linkedinMaxResults: string;
  destinationListId: string;
  scheduleEnabled: boolean;
  scheduleType: DiscoveryScheduleType;
  scheduleTime: string;
  scheduleDayOfWeek: string;
  scheduleIntervalDays: string;
  status: DiscoverySearchStatus;
}

interface DiscoverySearchBuilderProps {
  form: DiscoveryFormState;
  onChange: (next: Partial<DiscoveryFormState>) => void;
  onPreview: () => void;
  onSave: (mode: 'save' | 'save_run') => void;
  preview: DiscoverySearchPreview | null;
  isPreviewing: boolean;
  isSaving: boolean;
  leadLists: LeadList[];
  linkedInAccounts: LinkedInAccount[];
  editingSearch?: SavedDiscoverySearch | null;
}

const dayOptions = [
  { value: '0', label: 'Monday' },
  { value: '1', label: 'Tuesday' },
  { value: '2', label: 'Wednesday' },
  { value: '3', label: 'Thursday' },
  { value: '4', label: 'Friday' },
  { value: '5', label: 'Saturday' },
  { value: '6', label: 'Sunday' },
];

export function DiscoverySearchBuilder({
  form,
  onChange,
  onPreview,
  onSave,
  preview,
  isPreviewing,
  isSaving,
  leadLists,
  linkedInAccounts,
  editingSearch,
}: DiscoverySearchBuilderProps) {
  const destinationLabel = useMemo(
    () =>
      leadLists.find((list) => list.id === form.destinationListId)?.name ||
      'No destination selected',
    [form.destinationListId, leadLists]
  );

  return (
    <div className="space-y-5 rounded-2xl border border-[#E2E8F0] bg-white p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-[#1E293B]">
            {editingSearch ? 'Edit Discovery Search' : 'New Discovery Search'}
          </h2>
          <p className="mt-1 text-sm text-[#64748B]">
            Build a recurring intent or event-driven discovery search across LinkedIn and the web.
          </p>
        </div>
        <span className="rounded-full bg-[#FFF7ED] px-3 py-1 text-xs font-medium text-[#C2410C]">
          Separate from lead imports
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-medium text-[#334155]">Search name</span>
          <input
            value={form.name}
            onChange={(event) => onChange({ name: event.target.value })}
            className="w-full rounded-xl border border-[#CBD5E1] px-4 py-3 text-sm outline-none transition focus:border-[#FF6B35]"
            placeholder="Pipeline expansion monitor"
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-[#334155]">Search type</span>
          <select
            value={form.searchType}
            onChange={(event) =>
              onChange({ searchType: event.target.value as DiscoverySearchType })
            }
            className="w-full rounded-xl border border-[#CBD5E1] px-4 py-3 text-sm outline-none transition focus:border-[#FF6B35]"
          >
            <option value="intent">Intent-based</option>
            <option value="event">Event-driven</option>
          </select>
        </label>
      </div>

      <label className="space-y-2">
        <span className="text-sm font-medium text-[#334155]">Search description</span>
        <textarea
          value={form.description}
          onChange={(event) => onChange({ description: event.target.value })}
          rows={4}
          className="w-full rounded-xl border border-[#CBD5E1] px-4 py-3 text-sm outline-none transition focus:border-[#FF6B35]"
          placeholder="Find VPs of Revenue at B2B SaaS companies showing expansion or hiring signals in Europe."
        />
      </label>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-medium text-[#334155]">Keywords</span>
          <input
            value={form.keywords}
            onChange={(event) => onChange({ keywords: event.target.value })}
            className="w-full rounded-xl border border-[#CBD5E1] px-4 py-3 text-sm outline-none transition focus:border-[#FF6B35]"
            placeholder="revenue operations, expansion, hiring"
          />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium text-[#334155]">Target titles</span>
          <input
            value={form.targetTitles}
            onChange={(event) => onChange({ targetTitles: event.target.value })}
            className="w-full rounded-xl border border-[#CBD5E1] px-4 py-3 text-sm outline-none transition focus:border-[#FF6B35]"
            placeholder="VP Sales, Head of Growth"
          />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium text-[#334155]">Locations</span>
          <input
            value={form.locations}
            onChange={(event) => onChange({ locations: event.target.value })}
            className="w-full rounded-xl border border-[#CBD5E1] px-4 py-3 text-sm outline-none transition focus:border-[#FF6B35]"
            placeholder="London, Berlin"
          />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium text-[#334155]">Event types</span>
          <input
            value={form.eventTypes}
            onChange={(event) => onChange({ eventTypes: event.target.value })}
            className="w-full rounded-xl border border-[#CBD5E1] px-4 py-3 text-sm outline-none transition focus:border-[#FF6B35]"
            placeholder="funding, hiring, launch"
          />
        </label>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-[#E2E8F0] p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-[#1E293B]">Web Search Source</h3>
              <p className="mt-1 text-sm text-[#64748B]">
                Use GPT web search to surface public signals.
              </p>
            </div>
            <input
              type="checkbox"
              checked={form.webEnabled}
              onChange={(event) => onChange({ webEnabled: event.target.checked })}
              className="h-4 w-4 rounded border-[#CBD5E1] text-[#FF6B35] focus:ring-[#FF6B35]"
            />
          </div>
          <label className="mt-4 block space-y-2">
            <span className="text-sm font-medium text-[#334155]">Max web results</span>
            <input
              type="number"
              min={1}
              max={25}
              value={form.webMaxResults}
              onChange={(event) => onChange({ webMaxResults: event.target.value })}
              className="w-full rounded-xl border border-[#CBD5E1] px-4 py-3 text-sm outline-none transition focus:border-[#FF6B35]"
            />
          </label>
        </div>

        <div className="rounded-2xl border border-[#E2E8F0] p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-[#1E293B]">LinkedIn Source</h3>
              <p className="mt-1 text-sm text-[#64748B]">
                Use a connected LinkedIn account with structured search params.
              </p>
            </div>
            <input
              type="checkbox"
              checked={form.linkedinEnabled}
              onChange={(event) => onChange({ linkedinEnabled: event.target.checked })}
              className="h-4 w-4 rounded border-[#CBD5E1] text-[#FF6B35] focus:ring-[#FF6B35]"
            />
          </div>
          <div className="mt-4 grid gap-4">
            <label className="space-y-2">
              <span className="text-sm font-medium text-[#334155]">LinkedIn account</span>
              <select
                value={form.linkedinAccountId}
                onChange={(event) => onChange({ linkedinAccountId: event.target.value })}
                className="w-full rounded-xl border border-[#CBD5E1] px-4 py-3 text-sm outline-none transition focus:border-[#FF6B35]"
              >
                <option value="">Select an account</option>
                {linkedInAccounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name || account.profile_url || account.id}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium text-[#334155]">
                LinkedIn search params JSON
              </span>
              <textarea
                value={form.linkedinSearchParams}
                onChange={(event) => onChange({ linkedinSearchParams: event.target.value })}
                rows={5}
                className="w-full rounded-xl border border-[#CBD5E1] px-4 py-3 font-mono text-xs outline-none transition focus:border-[#FF6B35]"
                placeholder='{"api":"classic","category":"people","keywords":"vp sales"}'
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium text-[#334155]">Max LinkedIn results</span>
              <input
                type="number"
                min={1}
                max={50}
                value={form.linkedinMaxResults}
                onChange={(event) => onChange({ linkedinMaxResults: event.target.value })}
                className="w-full rounded-xl border border-[#CBD5E1] px-4 py-3 text-sm outline-none transition focus:border-[#FF6B35]"
              />
            </label>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-medium text-[#334155]">Destination list</span>
          <select
            value={form.destinationListId}
            onChange={(event) => onChange({ destinationListId: event.target.value })}
            className="w-full rounded-xl border border-[#CBD5E1] px-4 py-3 text-sm outline-none transition focus:border-[#FF6B35]"
          >
            <option value="">No list selected</option>
            {leadLists.map((list) => (
              <option key={list.id} value={list.id}>
                {list.name}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-[#334155]">Initial status</span>
          <select
            value={form.status}
            onChange={(event) => onChange({ status: event.target.value as DiscoverySearchStatus })}
            className="w-full rounded-xl border border-[#CBD5E1] px-4 py-3 text-sm outline-none transition focus:border-[#FF6B35]"
          >
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
          </select>
        </label>
      </div>

      <div className="rounded-2xl border border-[#E2E8F0] p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-[#1E293B]">Scheduling</h3>
            <p className="mt-1 text-sm text-[#64748B]">
              Weekly, bi-weekly, or a custom interval in the workspace timezone.
            </p>
          </div>
          <input
            type="checkbox"
            checked={form.scheduleEnabled}
            onChange={(event) => onChange({ scheduleEnabled: event.target.checked })}
            className="h-4 w-4 rounded border-[#CBD5E1] text-[#FF6B35] focus:ring-[#FF6B35]"
          />
        </div>
        {form.scheduleEnabled ? (
          <div className="mt-4 grid gap-4 md:grid-cols-4">
            <label className="space-y-2">
              <span className="text-sm font-medium text-[#334155]">Cadence</span>
              <select
                value={form.scheduleType}
                onChange={(event) =>
                  onChange({ scheduleType: event.target.value as DiscoveryScheduleType })
                }
                className="w-full rounded-xl border border-[#CBD5E1] px-4 py-3 text-sm outline-none transition focus:border-[#FF6B35]"
              >
                <option value="weekly">Weekly</option>
                <option value="biweekly">Bi-weekly</option>
                <option value="custom">Custom</option>
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium text-[#334155]">Time</span>
              <input
                type="time"
                value={form.scheduleTime}
                onChange={(event) => onChange({ scheduleTime: event.target.value })}
                className="w-full rounded-xl border border-[#CBD5E1] px-4 py-3 text-sm outline-none transition focus:border-[#FF6B35]"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium text-[#334155]">Day</span>
              <select
                value={form.scheduleDayOfWeek}
                onChange={(event) => onChange({ scheduleDayOfWeek: event.target.value })}
                className="w-full rounded-xl border border-[#CBD5E1] px-4 py-3 text-sm outline-none transition focus:border-[#FF6B35]"
              >
                {dayOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium text-[#334155]">Custom interval days</span>
              <input
                type="number"
                min={1}
                value={form.scheduleIntervalDays}
                onChange={(event) => onChange({ scheduleIntervalDays: event.target.value })}
                className="w-full rounded-xl border border-[#CBD5E1] px-4 py-3 text-sm outline-none transition focus:border-[#FF6B35]"
              />
            </label>
          </div>
        ) : null}
      </div>

      <div className="rounded-2xl bg-[#F8FAFC] p-4">
        <div className="text-sm font-medium text-[#334155]">Preview</div>
        <div className="mt-2 text-sm text-[#475569]">
          {preview?.summary || `Results will flow into ${destinationLabel}.`}
        </div>
        {preview?.next_run_at ? (
          <div className="mt-2 text-xs text-[#64748B]">
            Next run: {new Date(preview.next_run_at).toLocaleString()}
          </div>
        ) : null}
        {preview?.warnings?.length ? (
          <div className="mt-3 rounded-xl border border-[#FDE68A] bg-[#FFFBEB] px-3 py-2 text-xs text-[#92400E]">
            {preview.warnings.join(' ')}
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onPreview}
          disabled={isPreviewing}
          className="rounded-xl border border-[#CBD5E1] px-4 py-2.5 text-sm font-medium text-[#334155] transition hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPreviewing ? 'Previewing...' : 'Preview Search'}
        </button>
        <button
          type="button"
          onClick={() => onSave('save')}
          disabled={isSaving}
          className="rounded-xl bg-[#1E293B] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#0F172A] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? 'Saving...' : editingSearch ? 'Save Changes' : 'Save Search'}
        </button>
        <button
          type="button"
          onClick={() => onSave('save_run')}
          disabled={isSaving}
          className="rounded-xl bg-[#FF6B35] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#EA580C] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? 'Working...' : editingSearch ? 'Save and Run' : 'Create and Run'}
        </button>
      </div>
    </div>
  );
}
