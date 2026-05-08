import { useEffect, useMemo, useState, type ReactNode } from 'react';
import type {
  DiscoveryScheduleType,
  DiscoverySearchPreview,
  DiscoverySearchType,
  LeadList,
  LinkedInAccount,
  SavedDiscoverySearch,
} from '@/lib/types';

export interface DiscoveryFormState {
  description: string;
  targetWebsites: string;
  specialInstructions: string;
  linkedinAccountId: string;
  destinationListId: string;
  scheduleIntervalDays: string;
}

interface DiscoverySearchBuilderProps {
  form: DiscoveryFormState;
  onChange: (next: Partial<DiscoveryFormState>) => void;
  onPreview: () => void;
  onSave: (mode: 'save' | 'save_run') => void;
  onCreateLeadList: (name: string) => Promise<void>;
  preview: DiscoverySearchPreview | null;
  isPreviewing: boolean;
  isSaving: boolean;
  isCreatingLeadList: boolean;
  leadLists: LeadList[];
  linkedInAccounts: LinkedInAccount[];
  editingSearch?: SavedDiscoverySearch | null;
}

export function DiscoverySearchBuilder({
  form,
  onChange,
  onPreview,
  onSave,
  onCreateLeadList,
  preview,
  isPreviewing,
  isSaving,
  isCreatingLeadList,
  leadLists,
  linkedInAccounts,
  editingSearch,
}: DiscoverySearchBuilderProps) {
  const [destinationMode, setDestinationMode] = useState<'existing' | 'new'>(
    form.destinationListId ? 'existing' : 'new'
  );
  const [newListName, setNewListName] = useState('');
  const destinationLabel = useMemo(
    () =>
      leadLists.find((list) => list.id === form.destinationListId)?.name ||
      'No destination selected',
    [form.destinationListId, leadLists]
  );
  const generatedSearchType: DiscoverySearchType =
    /\b(funding|funded|raised|launch|launched|hire|hiring|appointed|promoted|acquired|acquisition|expansion|expanding|partnership|merged|opening|opened)\b/i.test(
      form.description
    )
      ? 'event'
      : 'intent';
  const generatedName = buildGeneratedSearchName(form.description, generatedSearchType);
  const scheduleType = inferScheduleType(form.scheduleIntervalDays);
  const scheduleEnabled = scheduleType !== 'once';
  const activeLinkedInAccount =
    linkedInAccounts.find((account) => account.id === form.linkedinAccountId) ||
    linkedInAccounts[0];
  const linkedInEnabled = Boolean(activeLinkedInAccount);

  useEffect(() => {
    setDestinationMode(form.destinationListId ? 'existing' : 'new');
  }, [form.destinationListId]);

  useEffect(() => {
    if (!newListName.trim()) {
      setNewListName(generatedName);
    }
  }, [generatedName, newListName]);

  const parsedDomains = useMemo(
    () =>
      Array.from(
        new Set(
          form.targetWebsites
            .split(/[\n,]/)
            .map((value) => cleanDomain(value))
            .filter(Boolean)
        )
      ),
    [form.targetWebsites]
  );

  const appendInstruction = (text: string) => {
    const current = form.specialInstructions.trim();
    const next = current ? `${current}\n${text}` : text;
    onChange({ specialInstructions: next });
  };

  return (
    <div className="space-y-6 rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4 border-b border-[#F1F5F9] pb-5">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-[#FFF7ED] px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#FF6B35]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#FF6B35]" aria-hidden="true" />
            Discovery
          </div>
          <h2 className="mt-2 text-xl font-semibold text-[#1E293B]">
            {editingSearch ? 'Edit Discovery Search' : 'New Discovery Search'}
          </h2>
          <p className="mt-1 text-sm text-[#64748B]">
            Describe the leads you want, choose where results should go, and discovery will handle
            the sourcing automatically.
          </p>
        </div>
      </div>

      <label className="block space-y-2">
        <span className="flex items-center gap-2 text-sm font-medium text-[#334155]">
          <span className="text-base" aria-hidden="true">
            🎯
          </span>
          What are you looking for?
        </span>
        <textarea
          value={form.description}
          onChange={(event) => onChange({ description: event.target.value })}
          rows={4}
          className="w-full rounded-xl border border-[#CBD5E1] bg-white px-4 py-3 text-sm leading-relaxed text-[#1E293B] outline-none transition placeholder:text-[#94A3B8] focus:border-[#FF6B35] focus:ring-2 focus:ring-[#FF6B35]/15"
          placeholder="Find VPs of Sales at recently funded B2B SaaS companies in Europe."
        />
      </label>

      <div className="grid gap-4 lg:grid-cols-2">
        <FieldCard
          icon="🌐"
          title="Target websites"
          subtitle="Discovery will prioritize people and companies tied to these websites."
          accent={parsedDomains.length > 0}
          badge={
            parsedDomains.length > 0
              ? `${parsedDomains.length} domain${parsedDomains.length === 1 ? '' : 's'}`
              : 'Optional'
          }
        >
          <textarea
            value={form.targetWebsites}
            onChange={(event) => onChange({ targetWebsites: event.target.value })}
            rows={4}
            className="w-full rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 font-mono text-[13px] text-[#1E293B] outline-none transition placeholder:font-sans placeholder:text-[#94A3B8] focus:border-[#FF6B35] focus:ring-2 focus:ring-[#FF6B35]/15"
            placeholder={'acme.com\nstripe.com\nnotion.so'}
          />
          {parsedDomains.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {parsedDomains.map((domain) => (
                <span
                  key={domain}
                  className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-[#0F172A] ring-1 ring-[#E2E8F0]"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-[#14B8A6]" aria-hidden="true" />
                  {domain}
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-[11px] text-[#94A3B8]">
              One domain per line. Commas also work.
            </p>
          )}
        </FieldCard>

        <FieldCard
          icon="✨"
          title="Special instructions"
          subtitle="Add exclusions, seniority guidance, niche context, or anything that should improve match quality."
          accent={form.specialInstructions.trim().length > 0}
          badge="Optional"
        >
          <textarea
            value={form.specialInstructions}
            onChange={(event) => onChange({ specialInstructions: event.target.value })}
            rows={4}
            className="w-full rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-sm leading-relaxed text-[#1E293B] outline-none transition placeholder:text-[#94A3B8] focus:border-[#FF6B35] focus:ring-2 focus:ring-[#FF6B35]/15"
            placeholder="Prioritize direct owners of the problem, avoid agencies, and prefer companies actively hiring."
          />
          <div className="mt-3">
            <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-[#94A3B8]">
              Quick add
            </p>
            <div className="flex flex-wrap gap-1.5">
              {INSTRUCTION_SUGGESTIONS.map((text) => (
                <button
                  key={text}
                  type="button"
                  onClick={() => appendInstruction(text)}
                  className="rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-[#475569] ring-1 ring-[#E2E8F0] transition hover:bg-[#F8FAFC] hover:text-[#1E293B]"
                >
                  + {text}
                </button>
              ))}
            </div>
          </div>
        </FieldCard>
      </div>

      <div className="rounded-2xl border border-[#E2E8F0] bg-gradient-to-br from-[#F8FAFC] to-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wide text-[#94A3B8]">
              Search summary
            </div>
            <div className="mt-1 text-sm text-[#475569]">
              Saved as <span className="font-semibold text-[#1E293B]">{generatedName}</span>
            </div>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
              generatedSearchType === 'event'
                ? 'bg-[#FFF7ED] text-[#C2410C]'
                : 'bg-[#ECFEFF] text-[#0E7490]'
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                generatedSearchType === 'event' ? 'bg-[#F97316]' : 'bg-[#14B8A6]'
              }`}
              aria-hidden="true"
            />
            {generatedSearchType === 'event' ? 'Event-driven' : 'Intent-based'}
          </span>
        </div>
      </div>

      <div className="rounded-2xl border border-[#E2E8F0] bg-white p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-[#94A3B8]">
            Search coverage
          </div>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          <CoverageChip active label="Web" hint="Always on" />
          <CoverageChip
            active={Boolean(form.targetWebsites.trim())}
            label="Website targeting"
            hint={form.targetWebsites.trim() ? `${parsedDomains.length} domains` : 'Optional'}
          />
          <CoverageChip
            active={linkedInEnabled}
            label="LinkedIn"
            hint={linkedInEnabled ? 'Connected' : 'Not connected'}
          />
        </div>
        <p className="mt-3 text-sm text-[#64748B]">
          Discovery always searches the web. If you have a LinkedIn account connected, it adds
          LinkedIn profile discovery automatically. When target websites are provided, Discovery
          uses them to narrow results and increase relevance.
        </p>
        {linkedInAccounts.length > 1 ? (
          <label className="mt-4 block space-y-2">
            <span className="text-sm font-medium text-[#334155]">LinkedIn account to use</span>
            <select
              value={form.linkedinAccountId}
              onChange={(event) => onChange({ linkedinAccountId: event.target.value })}
              className="w-full rounded-xl border border-[#CBD5E1] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#FF6B35] focus:ring-2 focus:ring-[#FF6B35]/15"
            >
              {linkedInAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name || account.profile_url || account.id}
                </option>
              ))}
            </select>
          </label>
        ) : activeLinkedInAccount ? (
          <div className="mt-3 text-xs text-[#64748B]">
            Using LinkedIn account:{' '}
            <span className="font-medium text-[#334155]">
              {activeLinkedInAccount.name ||
                activeLinkedInAccount.profile_url ||
                activeLinkedInAccount.id}
            </span>
          </div>
        ) : (
          <div className="mt-3 text-xs text-[#64748B]">
            Connect a LinkedIn account to add LinkedIn sourcing. Until then, discovery will use web
            search only.
          </div>
        )}
      </div>

      <label className="block space-y-2">
        <span className="flex items-center gap-2 text-sm font-medium text-[#334155]">
          <span className="text-base" aria-hidden="true">
            📥
          </span>
          Destination list
        </span>
        <div className="space-y-3 rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
          <div className="grid gap-3 md:grid-cols-2">
            <button
              type="button"
              onClick={() => setDestinationMode('new')}
              className={`rounded-2xl border p-4 text-left transition ${
                destinationMode === 'new'
                  ? 'border-[#FDBA74] bg-[#FFF7ED]'
                  : 'border-[#E2E8F0] bg-white hover:bg-[#F8FAFC]'
              }`}
            >
              <div className="font-medium text-[#1E293B]">Create new list</div>
              <div className="mt-1 text-sm text-[#64748B]">
                Start a fresh destination list from this discovery search.
              </div>
            </button>
            <button
              type="button"
              onClick={() => setDestinationMode('existing')}
              disabled={!leadLists.length}
              className={`rounded-2xl border p-4 text-left transition ${
                destinationMode === 'existing'
                  ? 'border-[#FDBA74] bg-[#FFF7ED]'
                  : 'border-[#E2E8F0] bg-white hover:bg-[#F8FAFC]'
              } disabled:cursor-not-allowed disabled:opacity-50`}
            >
              <div className="font-medium text-[#1E293B]">Use existing list</div>
              <div className="mt-1 text-sm text-[#64748B]">
                Add discovered leads into a list you already have.
              </div>
            </button>
          </div>

          {destinationMode === 'new' ? (
            <div className="space-y-3">
              <label className="space-y-2">
                <span className="text-sm font-medium text-[#334155]">New list name</span>
                <input
                  value={newListName}
                  onChange={(event) => setNewListName(event.target.value)}
                  className="w-full rounded-xl border border-[#CBD5E1] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#FF6B35]"
                  placeholder="Discovery list"
                />
              </label>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => void onCreateLeadList(newListName)}
                  disabled={isCreatingLeadList || !newListName.trim()}
                  className="rounded-xl border border-[#CBD5E1] bg-white px-4 py-2.5 text-sm font-medium text-[#334155] transition hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isCreatingLeadList ? 'Creating list...' : 'Create list'}
                </button>
                <div className="text-xs text-[#64748B]">
                  {form.destinationListId
                    ? `Selected list: ${destinationLabel}`
                    : 'Create the list here, then discovery will use it automatically.'}
                </div>
              </div>
            </div>
          ) : (
            <select
              value={form.destinationListId}
              onChange={(event) => onChange({ destinationListId: event.target.value })}
              className="w-full rounded-xl border border-[#CBD5E1] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#FF6B35]"
            >
              <option value="">Select a list</option>
              {leadLists.map((list) => (
                <option key={list.id} value={list.id}>
                  {list.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </label>

      <div className="rounded-2xl border border-[#E2E8F0] p-4">
        <div className="flex items-start gap-2">
          <span className="text-base" aria-hidden="true">
            ⏱️
          </span>
          <div>
            <h3 className="font-medium text-[#1E293B]">Scheduling</h3>
            <p className="mt-1 text-sm text-[#64748B]">
              Keep this as a one-time search or let it run on a simple cadence.
            </p>
          </div>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <ScheduleOptionCard
            label="Run once"
            description="No recurring schedule"
            active={!scheduleEnabled}
            onClick={() => onChange({ scheduleIntervalDays: '0' })}
          />
          <ScheduleOptionCard
            label="Weekly"
            description="Runs every week"
            active={scheduleType === 'weekly'}
            onClick={() => onChange({ scheduleIntervalDays: '7' })}
          />
          <ScheduleOptionCard
            label="Bi-weekly"
            description="Runs every two weeks"
            active={scheduleType === 'biweekly'}
            onClick={() => onChange({ scheduleIntervalDays: '14' })}
          />
          <ScheduleOptionCard
            label="Custom"
            description="Choose your own interval"
            active={scheduleType === 'custom'}
            onClick={() => onChange({ scheduleIntervalDays: form.scheduleIntervalDays || '21' })}
          />
        </div>
        {scheduleType === 'custom' ? (
          <div className="mt-4">
            <label className="space-y-2">
              <span className="text-sm font-medium text-[#334155]">Repeat every</span>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={1}
                  value={form.scheduleIntervalDays}
                  onChange={(event) => onChange({ scheduleIntervalDays: event.target.value })}
                  className="w-28 rounded-xl border border-[#CBD5E1] px-4 py-3 text-sm outline-none transition focus:border-[#FF6B35]"
                />
                <span className="text-sm text-[#64748B]">days</span>
              </div>
            </label>
          </div>
        ) : null}
      </div>

      <div className="rounded-2xl border border-[#E2E8F0] bg-gradient-to-br from-[#FFFBEB] to-white p-4">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-[#94A3B8]">
          <span aria-hidden="true">👁️</span>
          Preview
        </div>
        <div className="mt-2 text-sm text-[#475569]">
          {preview?.summary ||
            `Saved as ${generatedName}. Results will flow into ${destinationLabel}.`}
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

      <div className="flex flex-wrap items-center justify-end gap-3 border-t border-[#F1F5F9] pt-5">
        <button
          type="button"
          onClick={onPreview}
          disabled={isPreviewing}
          className="rounded-xl border border-[#CBD5E1] px-4 py-2.5 text-sm font-medium text-[#334155] transition hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPreviewing ? 'Previewing…' : 'Preview Search'}
        </button>
        <button
          type="button"
          onClick={() => onSave('save')}
          disabled={isSaving}
          className="rounded-xl bg-[#1E293B] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-[#0F172A] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? 'Saving…' : editingSearch ? 'Save Changes' : 'Save Search'}
        </button>
        <button
          type="button"
          onClick={() => onSave('save_run')}
          disabled={isSaving}
          className="rounded-xl bg-[#FF6B35] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-[#EA580C] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? 'Working…' : editingSearch ? 'Save and Run' : 'Create and Run'}
        </button>
      </div>
    </div>
  );
}

function inferScheduleType(scheduleIntervalDays: string): DiscoveryScheduleType | 'once' {
  const days = Number(scheduleIntervalDays || 0);
  if (!days) return 'once';
  if (days === 7) return 'weekly';
  if (days === 14) return 'biweekly';
  return 'custom';
}

function buildGeneratedSearchName(description: string, searchType: DiscoverySearchType) {
  const cleaned = description.replace(/\s+/g, ' ').trim().replace(/[.]+$/, '');
  if (!cleaned) {
    return searchType === 'event' ? 'Event Discovery Search' : 'Intent Discovery Search';
  }

  const title = cleaned.length > 72 ? `${cleaned.slice(0, 69).trimEnd()}...` : cleaned;
  return title;
}

function ScheduleOptionCard({
  label,
  description,
  active,
  onClick,
}: {
  label: string;
  description: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border p-4 text-left transition ${
        active ? 'border-[#FDBA74] bg-[#FFF7ED]' : 'border-[#E2E8F0] bg-white hover:bg-[#F8FAFC]'
      }`}
    >
      <div className="font-medium text-[#1E293B]">{label}</div>
      <div className="mt-1 text-sm text-[#64748B]">{description}</div>
    </button>
  );
}

const INSTRUCTION_SUGGESTIONS = [
  'Exclude agencies and consultancies',
  'Senior decision-makers only',
  'Recently funded companies',
  'Avoid existing customers',
];

function cleanDomain(value: string): string {
  return value
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '')
    .replace(/\/.*$/, '')
    .toLowerCase();
}

function FieldCard({
  icon,
  title,
  subtitle,
  badge,
  accent,
  children,
}: {
  icon: string;
  title: string;
  subtitle: string;
  badge?: string;
  accent?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 transition ${
        accent
          ? 'border-[#FDBA74] bg-gradient-to-br from-[#FFF7ED] to-white'
          : 'border-[#E2E8F0] bg-[#F8FAFC]'
      }`}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <span className="text-base leading-5" aria-hidden="true">
            {icon}
          </span>
          <div>
            <div className="text-sm font-semibold text-[#1E293B]">{title}</div>
            <p className="mt-0.5 text-[12px] leading-snug text-[#64748B]">{subtitle}</p>
          </div>
        </div>
        {badge ? (
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
              accent ? 'bg-[#FF6B35] text-white' : 'bg-white text-[#94A3B8] ring-1 ring-[#E2E8F0]'
            }`}
          >
            {badge}
          </span>
        ) : null}
      </div>
      {children}
    </div>
  );
}

function CoverageChip({ active, label, hint }: { active: boolean; label: string; hint: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ring-1 ${
        active
          ? 'bg-[#ECFDF5] text-[#047857] ring-[#A7F3D0]'
          : 'bg-[#F8FAFC] text-[#94A3B8] ring-[#E2E8F0]'
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-[#10B981]' : 'bg-[#CBD5E1]'}`}
        aria-hidden="true"
      />
      {label}
      <span className="text-[10px] font-normal opacity-70">· {hint}</span>
    </span>
  );
}
