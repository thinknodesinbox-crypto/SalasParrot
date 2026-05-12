import { Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import type { AssistantAction } from '@/lib/types';
import {
  NodeConfigPanel,
  SequenceCanvas,
  type SequenceNode,
} from '@/components/campaign/SequenceCanvas';
import {
  buildBranchRelationships,
  buildNextStepRelationships,
  mapConfigToNodeData,
  mapStepTypeToNodeType,
  prepareNodesForSave,
  reconstructBranchInfo,
} from '@/lib/utils/campaignStepMapper';
import { AssistantSequencePreview } from './AssistantSequencePreview';

interface AssistantActionCardProps {
  action: AssistantAction;
  onApprove?: (actionId: string, note?: string) => void;
  onReject?: (actionId: string, reason?: string) => void;
  onEdit?: (actionId: string, payload: Record<string, unknown>, message?: string) => void;
  onExecute?: (actionId: string) => void;
  isApproving?: boolean;
  isRejecting?: boolean;
  isEditing?: boolean;
  isExecuting?: boolean;
}

function formatRecord(value: Record<string, unknown>) {
  const entries = Object.entries(value);
  if (entries.length === 0) return 'None';
  return entries
    .map(([key, item]) => `${key}: ${typeof item === 'string' ? item : JSON.stringify(item)}`)
    .join('\n');
}

function isOptionList(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function isSequenceStepList(
  value: unknown
): value is Array<{ order: number; type: string; config: Record<string, unknown> }> {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        typeof item === 'object' &&
        item !== null &&
        typeof (item as { order?: unknown }).order === 'number' &&
        typeof (item as { type?: unknown }).type === 'string' &&
        typeof (item as { config?: unknown }).config === 'object'
    )
  );
}

type AssistantSequenceStep = {
  order: number;
  type: string;
  config: Record<string, unknown>;
  next_step_order?: number | null;
  true_branch_order?: number | null;
  false_branch_order?: number | null;
};

function buildSequenceEditorNodes(steps: AssistantSequenceStep[]): SequenceNode[] {
  if (!steps.length) return [];

  const sortedSteps = [...steps].sort((a, b) => a.order - b.order);
  const pseudoIdByOrder = new Map(
    sortedSteps.map((step) => [step.order, `assistant-step-${step.order}`])
  );
  const backendSteps = sortedSteps.map((step) => ({
    id: pseudoIdByOrder.get(step.order) || `assistant-step-${step.order}`,
    type: step.type,
    config: step.config || {},
    order: step.order,
    true_branch_step_id:
      step.true_branch_order != null ? pseudoIdByOrder.get(step.true_branch_order) || null : null,
    false_branch_step_id:
      step.false_branch_order != null ? pseudoIdByOrder.get(step.false_branch_order) || null : null,
    next_step_id:
      step.next_step_order != null ? pseudoIdByOrder.get(step.next_step_order) || null : null,
  }));

  const branchInfo = reconstructBranchInfo(backendSteps);
  const sequenceNodes: SequenceNode[] = [{ id: 'assistant-start', type: 'start', data: {} }];

  backendSteps.forEach((step) => {
    const mappedType = mapStepTypeToNodeType(step.type as never);
    if (!mappedType) return;
    const branchData = branchInfo.get(step.id);
    sequenceNodes.push({
      id: step.id,
      type: mappedType,
      data: mapConfigToNodeData(step.config || {}),
      parentId: branchData?.parentId,
      branch: branchData?.branch,
    });
  });

  return sequenceNodes;
}

function parseOptionalOrder(value: string | undefined | null): number | null {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function isLeadSelectionPreview(value: unknown): value is {
  matched_count: number;
  sample_leads: Array<{ name?: string; company?: string | null; status?: string | null }>;
  filters?: Record<string, unknown>;
} {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { matched_count?: unknown }).matched_count === 'number' &&
    Array.isArray((value as { sample_leads?: unknown }).sample_leads)
  );
}

function isLeadScopeReview(value: unknown): value is {
  matched_count: number;
  sample_records: Array<{
    id?: string;
    name?: string;
    company?: string | null;
    status?: string | null;
    lead_list_name?: string | null;
    campaign_name?: string | null;
  }>;
  filters?: Record<string, unknown>;
  stale?: boolean;
  stale_reason?: string | null;
  reviewed_matched_count?: number;
} {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { matched_count?: unknown }).matched_count === 'number' &&
    Array.isArray((value as { sample_records?: unknown }).sample_records)
  );
}

function buildLeadsSearchFromSelectionPreview(
  preview: {
    filters?: Record<string, unknown>;
  } | null
) {
  const filters = preview?.filters;
  if (!filters) return undefined;
  const search: Record<string, unknown> = {};
  if (typeof filters.lead_list_id === 'string' && filters.lead_list_id) {
    search.listId = filters.lead_list_id;
  }
  if (typeof filters.status === 'string' && filters.status) {
    search.status = filters.status;
  }
  if (filters.has_email === true) {
    search.email = 'has_email';
  } else if (filters.has_email === false) {
    search.email = 'no_email';
  }
  if (filters.in_campaign === true) {
    search.campaign = 'in_campaign';
  } else if (filters.in_campaign === false) {
    search.campaign = 'not_in_campaign';
  }
  if (filters.imported_only === true) {
    search.importedOnly = true;
  }
  return Object.keys(search).length > 0 ? search : undefined;
}

function getRecordString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null;
}

function getRecordNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function getMixedList(value: unknown): Array<string | number> {
  return Array.isArray(value)
    ? value.filter(
        (item): item is string | number =>
          (typeof item === 'string' && item.trim().length > 0) ||
          (typeof item === 'number' && Number.isFinite(item))
      )
    : [];
}

function getStringList(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    : [];
}

function formatStepTypeLabel(type: string) {
  return type.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatFieldLabel(value: string) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatNetworkDistanceValue(value: Array<string | number>) {
  return value
    .map((item) => {
      if (typeof item === 'number') {
        return `${item}`;
      }
      return String(item).trim();
    })
    .filter((item) => item.length > 0)
    .join(', ');
}

function parseNetworkDistanceInput(value: string): Array<number | 'GROUP'> {
  return value
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter((item) => item.length > 0)
    .reduce<Array<number | 'GROUP'>>((acc, item) => {
      if (item === '1' || item === '1st') acc.push(1);
      else if (item === '2' || item === '2nd') acc.push(2);
      else if (item === '3' || item === '3rd') acc.push(3);
      else if (item === 'group') acc.push('GROUP');
      return acc;
    }, []);
}

type SelectionStatusFilter =
  | 'all'
  | 'new'
  | 'contacted'
  | 'accepted'
  | 'replied'
  | 'qualified'
  | 'not_interested';

type SelectionEmailFilter = 'all' | 'has_email' | 'no_email';
type SelectionCampaignFilter = 'all' | 'in_campaign' | 'not_in_campaign';

export function AssistantActionCard({
  action,
  onApprove,
  onReject,
  onEdit,
  onExecute,
  isApproving = false,
  isRejecting = false,
  isEditing = false,
  isExecuting = false,
}: AssistantActionCardProps) {
  const [isJsonEditorOpen, setIsJsonEditorOpen] = useState(false);
  const [isStructuredEditorOpen, setIsStructuredEditorOpen] = useState(false);
  const [jsonEditValue, setJsonEditValue] = useState('');
  const [editError, setEditError] = useState<string | null>(null);
  const [isSelectionEditorOpen, setIsSelectionEditorOpen] = useState(false);
  const [selectionStatus, setSelectionStatus] = useState<SelectionStatusFilter>('all');
  const [selectionEmail, setSelectionEmail] = useState<SelectionEmailFilter>('all');
  const [selectionCampaign, setSelectionCampaign] = useState<SelectionCampaignFilter>('all');
  const [selectionImportedOnly, setSelectionImportedOnly] = useState(false);
  const [campaignNameInput, setCampaignNameInput] = useState('');
  const [campaignDailyLimitInput, setCampaignDailyLimitInput] = useState('');
  const [importListNameInput, setImportListNameInput] = useState('');
  const [importTypeInput, setImportTypeInput] = useState('');
  const [importSourceUrlInput, setImportSourceUrlInput] = useState('');
  const [importKeywordsInput, setImportKeywordsInput] = useState('');
  const [importLocationInput, setImportLocationInput] = useState('');
  const [importNetworkDistanceInput, setImportNetworkDistanceInput] = useState('');
  const [importMaxLeadsInput, setImportMaxLeadsInput] = useState('');
  const [importUrlsText, setImportUrlsText] = useState('');
  const [replySubjectInput, setReplySubjectInput] = useState('');
  const [replyBodyInput, setReplyBodyInput] = useState('');
  const [listNameInput, setListNameInput] = useState('');
  const [listDescriptionInput, setListDescriptionInput] = useState('');
  const [listSourceInput, setListSourceInput] = useState('');
  const [snoozeUntilInput, setSnoozeUntilInput] = useState('');
  const [deliverySettingsDraft, setDeliverySettingsDraft] = useState<{
    dailySummaryEnabled: boolean;
    deliveryChannel: string;
    dailySummaryTime: string;
    timezone: string;
  }>({
    dailySummaryEnabled: true,
    deliveryChannel: 'dashboard',
    dailySummaryTime: '',
    timezone: '',
  });
  const [workspaceContextDraft, setWorkspaceContextDraft] = useState<Record<string, string>>({});
  const [campaignSequenceNodes, setCampaignSequenceNodes] = useState<SequenceNode[]>([]);
  const [campaignSequenceSelectedNodeId, setCampaignSequenceSelectedNodeId] = useState<
    string | null
  >(null);

  const canReview = action.status === 'awaiting_confirmation' || action.status === 'approved';
  const canExecute = action.status === 'approved';
  const previewPayload = action.preview.exact_payload as Record<string, unknown>;
  const livePayload = action.payload as Record<string, unknown>;
  const effectivePayload =
    Object.keys(previewPayload || {}).length > 0 ? previewPayload : livePayload;
  const beforeState =
    (action.target_ref.before as Record<string, unknown> | undefined) ||
    action.preview.before ||
    {};
  const pendingOptions = isOptionList((action.target_ref as Record<string, unknown>).options)
    ? ((action.target_ref as Record<string, unknown>).options as string[])
    : [];
  const isPendingTargetSelection = action.status === 'proposed' && pendingOptions.length > 0;
  const sequenceSteps = isSequenceStepList(effectivePayload?.steps)
    ? (effectivePayload.steps as Array<{
        order: number;
        type: string;
        config: Record<string, unknown>;
        next_step_order?: number | null;
        true_branch_order?: number | null;
        false_branch_order?: number | null;
      }>)
    : [];
  const legacySelectionPreview = isLeadSelectionPreview(
    (action.preview.after as Record<string, unknown>)?.selection_preview
  )
    ? ((action.preview.after as Record<string, unknown>).selection_preview as {
        matched_count: number;
        sample_leads: Array<{ name?: string; company?: string | null; status?: string | null }>;
        filters?: Record<string, unknown>;
      })
    : null;
  const scopeReview = isLeadScopeReview(action.preview.scope_review)
    ? action.preview.scope_review
    : legacySelectionPreview
      ? {
          matched_count: legacySelectionPreview.matched_count,
          sample_records: legacySelectionPreview.sample_leads,
          filters: legacySelectionPreview.filters,
          stale: false,
          stale_reason: null,
        }
      : null;
  const leadsSearch = buildLeadsSearchFromSelectionPreview(scopeReview);
  const selectionFilters =
    scopeReview && typeof scopeReview.filters === 'object' ? scopeReview.filters : null;
  const isScopeStale = Boolean(scopeReview?.stale);
  const staleScopeReason =
    typeof scopeReview?.stale_reason === 'string' && scopeReview.stale_reason
      ? scopeReview.stale_reason
      : null;
  const campaignActionTypes = new Set([
    'create_campaign',
    'pause_campaign',
    'resume_campaign',
    'start_campaign',
    'rename_campaign',
    'update_campaign_daily_limit',
    'update_campaign_steps',
    'stop_campaign',
  ]);
  const importActionTypes = new Set(['start_leads_import', 'cancel_leads_import']);
  const replyActionTypes = new Set(['create_reply_draft', 'send_reply_draft']);
  const settingsActionTypes = new Set(['update_delivery_settings']);
  const workspaceContextActionTypes = new Set(['update_workspace_context']);
  const mergeActionTypes = new Set(['merge_lead_lists']);
  const listActionTypes = new Set([
    'create_lead_list',
    'rename_lead_list',
    'create_marketing_list',
    'rename_marketing_list',
  ]);
  const conversationUtilityActionTypes = new Set(['mark_conversation_read', 'snooze_conversation']);
  const campaignId =
    getRecordString((action.result as Record<string, unknown> | null)?.campaign_id) ||
    getRecordString(action.target_ref.campaign_id);
  const conversationId =
    getRecordString((action.result as Record<string, unknown> | null)?.conversation_id) ||
    getRecordString(action.target_ref.conversation_id);
  const importLeadListId =
    getRecordString((action.result as Record<string, unknown> | null)?.lead_list_id) ||
    getRecordString(action.target_ref.lead_list_id);
  const shouldRenderCampaignSummary = campaignActionTypes.has(action.action_type);
  const shouldRenderImportSummary = importActionTypes.has(action.action_type);
  const shouldRenderReplySummary = replyActionTypes.has(action.action_type);
  const shouldRenderSettingsSummary = settingsActionTypes.has(action.action_type);
  const shouldRenderWorkspaceContextSummary = workspaceContextActionTypes.has(action.action_type);
  const shouldRenderMergeSummary = mergeActionTypes.has(action.action_type);
  const shouldRenderListSummary = listActionTypes.has(action.action_type);
  const shouldRenderConversationUtilitySummary = conversationUtilityActionTypes.has(
    action.action_type
  );
  const hideVerbosePayload =
    shouldRenderCampaignSummary ||
    shouldRenderImportSummary ||
    shouldRenderReplySummary ||
    shouldRenderSettingsSummary ||
    shouldRenderWorkspaceContextSummary ||
    shouldRenderMergeSummary ||
    shouldRenderListSummary ||
    shouldRenderConversationUtilitySummary;
  const advancedToggleLabel = hideVerbosePayload ? 'Advanced details' : null;
  const targetDisplayEntries = Object.entries(action.target_ref as Record<string, unknown>).filter(
    ([key]) => key !== 'options' && key !== 'target_key'
  );
  const targetDisplay = Object.fromEntries(targetDisplayEntries);
  const afterDisplayEntries = Object.entries(action.preview.after).filter(
    ([key]) => key !== 'selection_preview'
  );
  const afterDisplay = Object.fromEntries(afterDisplayEntries);
  const riskTone =
    action.risk_level === 'high'
      ? 'bg-[#FEF2F2] text-[#B91C1C]'
      : action.risk_level === 'medium'
        ? 'bg-[#FFFBEB] text-[#B45309]'
        : 'bg-[#ECFDF5] text-[#047857]';
  const expiresLabel = action.expires_at ? new Date(action.expires_at).toLocaleString() : null;
  const importType = getRecordString(effectivePayload.import_type) || 'Unknown';
  const importTargetListName = getRecordString(action.target_ref.lead_list_name);
  const importListName =
    importTargetListName ||
    getRecordString((action.result as Record<string, unknown> | null)?.lead_list_name) ||
    getRecordString(effectivePayload.list_name) ||
    'Lead import';
  const importTargetsExistingList = Boolean(
    getRecordString(action.target_ref.lead_list_id) || importTargetListName
  );
  const importSearchParams =
    typeof effectivePayload.search_params === 'object' && effectivePayload.search_params !== null
      ? (effectivePayload.search_params as Record<string, unknown>)
      : {};
  const importKeywords =
    getRecordString(effectivePayload.keywords) || getRecordString(importSearchParams.keywords);
  const importLocation =
    getRecordString(effectivePayload.location_name) ||
    getRecordString(importSearchParams.location_name);
  const importNetworkDistance = getMixedList(effectivePayload.network_distance).length
    ? getMixedList(effectivePayload.network_distance)
    : getMixedList(importSearchParams.network_distance);
  const importMaxLeads =
    getRecordNumber(effectivePayload.max_leads) ?? getRecordNumber(importSearchParams.max_leads);
  const importUrls = Array.isArray(effectivePayload.source_data)
    ? effectivePayload.source_data
    : [];
  const replySubject = getRecordString(effectivePayload.subject);
  const replyBody = getRecordString(effectivePayload.body);
  const campaignName =
    getRecordString(action.target_ref.campaign_name) ||
    getRecordString(effectivePayload.name) ||
    'Campaign';
  const campaignDailyLimit =
    getRecordNumber(effectivePayload.daily_connection_limit) ??
    getRecordNumber(beforeState.daily_connection_limit);
  const campaignStatusBefore = getRecordString(beforeState.campaign_status) || 'Unknown';
  const campaignNextStatus =
    action.action_type === 'pause_campaign'
      ? 'paused'
      : action.action_type === 'resume_campaign'
        ? 'active'
        : action.action_type === 'start_campaign'
          ? 'active'
          : action.action_type === 'stop_campaign'
            ? 'stopped'
            : null;
  const campaignLaunchValidation =
    typeof action.preview.after.launch_validation === 'object' &&
    action.preview.after.launch_validation !== null
      ? (action.preview.after.launch_validation as Record<string, unknown>)
      : null;
  const campaignLaunchErrors = Array.isArray(campaignLaunchValidation?.errors)
    ? campaignLaunchValidation.errors.map(String).filter(Boolean)
    : [];
  const campaignLaunchWarnings = Array.isArray(campaignLaunchValidation?.warnings)
    ? campaignLaunchValidation.warnings.map(String).filter(Boolean)
    : [];
  const campaignLaunchStepCount = getRecordNumber(campaignLaunchValidation?.step_count);
  const campaignLaunchSenderCount = getRecordNumber(campaignLaunchValidation?.active_sender_count);
  const supportsCampaignStructuredEditor = [
    'create_campaign',
    'rename_campaign',
    'update_campaign_daily_limit',
  ].includes(action.action_type);
  const supportsCampaignStepsStructuredEditor = action.action_type === 'update_campaign_steps';
  const supportsImportStructuredEditor = action.action_type === 'start_leads_import';
  const supportsReplyStructuredEditor = replyActionTypes.has(action.action_type);
  const supportsSettingsStructuredEditor = action.action_type === 'update_delivery_settings';
  const supportsWorkspaceContextStructuredEditor =
    action.action_type === 'update_workspace_context';
  const supportsListStructuredEditor = listActionTypes.has(action.action_type);
  const supportsConversationStructuredEditor = action.action_type === 'snooze_conversation';
  const supportsStructuredEditor =
    supportsCampaignStructuredEditor ||
    supportsCampaignStepsStructuredEditor ||
    supportsImportStructuredEditor ||
    supportsReplyStructuredEditor ||
    supportsSettingsStructuredEditor ||
    supportsWorkspaceContextStructuredEditor ||
    supportsListStructuredEditor ||
    supportsConversationStructuredEditor;
  const editButtonLabel = supportsStructuredEditor
    ? 'Edit'
    : hideVerbosePayload
      ? 'Edit JSON'
      : 'Edit';
  const workspaceContextFields = [
    'website_url',
    'business_blurb',
    'icp',
    'outreach_intent',
    'brand_tone',
    'value_proposition',
    'cta_preference',
    'reply_guardrails',
    'forbidden_claims',
  ] as const;
  const workspaceContextEntries = workspaceContextFields
    .map((field) => [field, getRecordString(effectivePayload[field]) || ''] as const)
    .filter(([, value]) => value);
  const listName =
    getRecordString(effectivePayload.name) ||
    getRecordString(action.target_ref.lead_list_name) ||
    getRecordString(action.target_ref.marketing_list_name) ||
    'List';
  const listDescription = getRecordString(effectivePayload.description);
  const listSource = getRecordString(effectivePayload.source);
  const snoozeUntil = getRecordString(effectivePayload.until);
  const mergePreview =
    typeof action.preview.after.merge_preview === 'object' &&
    action.preview.after.merge_preview !== null
      ? (action.preview.after.merge_preview as Record<string, unknown>)
      : null;
  const mergeSourceNames =
    getStringList(mergePreview?.source_lists).length > 0
      ? []
      : getStringList(effectivePayload.source_list_names);
  const mergeSourceListEntries =
    Array.isArray(mergePreview?.source_lists) && mergePreview?.source_lists.length > 0
      ? (mergePreview.source_lists as Array<Record<string, unknown>>)
      : [];
  const mergeSourceListNames =
    mergeSourceListEntries.length > 0
      ? mergeSourceListEntries
          .map((item) => getRecordString(item.name))
          .filter((item): item is string => Boolean(item))
      : mergeSourceNames;
  const mergeTargetListName =
    getRecordString((action.result as Record<string, unknown> | null)?.target_list_name) ||
    getRecordString(action.target_ref.lead_list_name) ||
    'Lead list';
  const mergeTargetListId =
    getRecordString((action.result as Record<string, unknown> | null)?.target_list_id) ||
    getRecordString(action.target_ref.lead_list_id);
  const mergeLeadsToAdd =
    getRecordNumber(mergePreview?.leads_to_add) ??
    getRecordNumber((action.result as Record<string, unknown> | null)?.merged);
  const mergeDuplicatesSkipped =
    getRecordNumber(mergePreview?.duplicates_skipped) ??
    getRecordNumber((action.result as Record<string, unknown> | null)?.duplicates_skipped);
  const mergeSourceListsReadyForDeletion = getRecordNumber(
    mergePreview?.source_lists_ready_for_deletion
  );
  const mergeSourceListsBlockedFromDeletion = getRecordNumber(
    mergePreview?.source_lists_blocked_from_deletion
  );
  const mergeDeletesSources = effectivePayload.delete_source_lists !== false;

  useEffect(() => {
    setJsonEditValue(JSON.stringify(action.preview.exact_payload || action.payload || {}, null, 2));
    setEditError(null);
    setIsJsonEditorOpen(false);
    setIsStructuredEditorOpen(false);
    setCampaignNameInput(
      getRecordString(effectivePayload.name) ||
        getRecordString(action.target_ref.campaign_name) ||
        ''
    );
    setCampaignDailyLimitInput(
      campaignDailyLimit !== null && campaignDailyLimit !== undefined
        ? String(campaignDailyLimit)
        : ''
    );
    setImportListNameInput(importListName === 'Lead import' ? '' : importListName);
    setImportTypeInput(importType === 'Unknown' ? '' : importType);
    setImportSourceUrlInput(getRecordString(effectivePayload.source_url) || '');
    setImportKeywordsInput(importKeywords || '');
    setImportLocationInput(importLocation || '');
    setImportNetworkDistanceInput(formatNetworkDistanceValue(importNetworkDistance));
    setImportMaxLeadsInput(
      importMaxLeads !== null && importMaxLeads !== undefined ? String(importMaxLeads) : ''
    );
    setImportUrlsText(
      Array.isArray(importUrls)
        ? importUrls
            .map((item) => String(item).trim())
            .filter(Boolean)
            .join('\n')
        : ''
    );
    setReplySubjectInput(replySubject || '');
    setReplyBodyInput(replyBody || '');
    setListNameInput(listName === 'List' ? '' : listName);
    setListDescriptionInput(listDescription || '');
    setListSourceInput(listSource || '');
    setSnoozeUntilInput(snoozeUntil || '');
    setDeliverySettingsDraft({
      dailySummaryEnabled: effectivePayload.daily_summary_enabled !== false,
      deliveryChannel: getRecordString(effectivePayload.delivery_channel) || 'dashboard',
      dailySummaryTime: getRecordString(effectivePayload.daily_summary_time) || '',
      timezone: getRecordString(effectivePayload.timezone) || '',
    });
    setWorkspaceContextDraft(
      Object.fromEntries(
        workspaceContextFields.map((field) => [
          field,
          getRecordString(effectivePayload[field]) || '',
        ])
      )
    );
    const initialSequenceNodes = buildSequenceEditorNodes(sequenceSteps);
    setCampaignSequenceNodes(initialSequenceNodes);
    setCampaignSequenceSelectedNodeId(
      initialSequenceNodes.find((node) => node.type !== 'start' && node.type !== 'end')?.id || null
    );
  }, [
    action.id,
    action.payload,
    action.preview.exact_payload,
    action.target_ref.campaign_name,
    campaignDailyLimit,
    importKeywords,
    importListName,
    importLocation,
    importMaxLeads,
    importType,
    replyBody,
    replySubject,
    effectivePayload.source_url,
    formatNetworkDistanceValue(importNetworkDistance),
    JSON.stringify(importUrls),
    listDescription,
    listName,
    listSource,
    JSON.stringify(sequenceSteps),
    snoozeUntil,
  ]);

  useEffect(() => {
    setIsSelectionEditorOpen(false);
    setSelectionStatus(
      typeof selectionFilters?.status === 'string'
        ? (selectionFilters.status as SelectionStatusFilter)
        : 'all'
    );
    setSelectionEmail(
      selectionFilters?.has_email === true
        ? 'has_email'
        : selectionFilters?.has_email === false
          ? 'no_email'
          : 'all'
    );
    setSelectionCampaign(
      selectionFilters?.in_campaign === true
        ? 'in_campaign'
        : selectionFilters?.in_campaign === false
          ? 'not_in_campaign'
          : 'all'
    );
    setSelectionImportedOnly(Boolean(selectionFilters?.imported_only));
  }, [selectionFilters, action.id]);

  const openPrimaryEditor = () => {
    setEditError(null);
    if (supportsStructuredEditor) {
      setIsJsonEditorOpen(false);
      setIsStructuredEditorOpen((value) => !value);
      return;
    }
    setIsStructuredEditorOpen(false);
    setIsJsonEditorOpen((value) => !value);
  };

  const openJsonEditor = () => {
    setEditError(null);
    setIsStructuredEditorOpen(false);
    setIsJsonEditorOpen(true);
  };

  const saveCampaignStructuredEdit = () => {
    if (!onEdit) return;
    const nextPayload: Record<string, unknown> = {};
    if (action.action_type === 'create_campaign' || action.action_type === 'rename_campaign') {
      const nextName = campaignNameInput.trim();
      if (!nextName) {
        setEditError('Campaign name is required.');
        return;
      }
      nextPayload.name = nextName;
    }
    if (action.action_type === 'update_campaign_daily_limit') {
      const trimmedLimit = campaignDailyLimitInput.trim();
      if (!trimmedLimit) {
        setEditError('Daily limit is required.');
        return;
      }
      const parsedLimit = Number(trimmedLimit);
      if (!Number.isFinite(parsedLimit) || parsedLimit < 0) {
        setEditError('Daily limit must be a valid number.');
        return;
      }
      nextPayload.daily_connection_limit = parsedLimit;
    }
    setEditError(null);
    onEdit(action.id, nextPayload, 'Campaign details updated from review card.');
    setIsStructuredEditorOpen(false);
  };

  const saveImportStructuredEdit = () => {
    if (!onEdit) return;
    const nextPayload: Record<string, unknown> = {
      import_type: importTypeInput.trim(),
      source_url: null,
      source_data: [],
      keywords: null,
      location_name: null,
      network_distance: [],
      search_params: null,
      max_leads: null,
    };
    if (importTargetsExistingList) {
      nextPayload.list_name = null;
    } else {
      nextPayload.list_name = importListNameInput.trim();
    }
    if (!importTargetsExistingList && !String(nextPayload.list_name).trim()) {
      setEditError('Import list name is required.');
      return;
    }
    if (!String(nextPayload.import_type).trim()) {
      setEditError('Import type is required.');
      return;
    }
    const normalizedImportType = String(nextPayload.import_type).trim().toLowerCase();
    if (normalizedImportType === 'linkedin_people_search') {
      const parsedNetworkDistance = parseNetworkDistanceInput(importNetworkDistanceInput);
      nextPayload.keywords = importKeywordsInput.trim() || null;
      nextPayload.location_name = importLocationInput.trim() || null;
      nextPayload.network_distance = parsedNetworkDistance;
      if (importMaxLeadsInput.trim()) {
        const parsedMaxLeads = Number(importMaxLeadsInput.trim());
        if (!Number.isFinite(parsedMaxLeads) || parsedMaxLeads <= 0) {
          setEditError('Max leads must be a valid positive number.');
          return;
        }
        nextPayload.max_leads = parsedMaxLeads;
      }
    } else if (normalizedImportType === 'paste_urls') {
      const urls = importUrlsText
        .split('\n')
        .map((item) => item.trim())
        .filter((item) => item.length > 0);
      if (urls.length === 0) {
        setEditError('Add at least one profile URL for pasted URL imports.');
        return;
      }
      nextPayload.source_data = urls;
    } else {
      const sourceUrl = importSourceUrlInput.trim();
      if (!sourceUrl) {
        setEditError('Source URL is required for this import type.');
        return;
      }
      nextPayload.source_url = sourceUrl;
      if (importMaxLeadsInput.trim()) {
        const parsedMaxLeads = Number(importMaxLeadsInput.trim());
        if (!Number.isFinite(parsedMaxLeads) || parsedMaxLeads <= 0) {
          setEditError('Max leads must be a valid positive number.');
          return;
        }
        nextPayload.max_leads = parsedMaxLeads;
      }
    }
    setEditError(null);
    onEdit(action.id, nextPayload, 'Import criteria updated from review card.');
    setIsStructuredEditorOpen(false);
  };

  const saveReplyStructuredEdit = () => {
    if (!onEdit) return;
    const nextPayload: Record<string, unknown> = {
      subject: replySubjectInput.trim() || null,
      body: replyBodyInput.trim(),
    };
    if (!String(nextPayload.body).trim()) {
      setEditError('Reply body is required.');
      return;
    }
    setEditError(null);
    onEdit(action.id, nextPayload, 'Reply content updated from review card.');
    setIsStructuredEditorOpen(false);
  };

  const saveSettingsStructuredEdit = () => {
    if (!onEdit) return;
    const nextPayload: Record<string, unknown> = {
      daily_summary_enabled: deliverySettingsDraft.dailySummaryEnabled,
      delivery_channel: deliverySettingsDraft.deliveryChannel.trim(),
      daily_summary_time: deliverySettingsDraft.dailySummaryTime.trim(),
      timezone: deliverySettingsDraft.timezone.trim(),
    };
    if (!String(nextPayload.delivery_channel).trim()) {
      setEditError('Delivery channel is required.');
      return;
    }
    if (!String(nextPayload.daily_summary_time).trim()) {
      setEditError('Daily summary time is required.');
      return;
    }
    if (!String(nextPayload.timezone).trim()) {
      setEditError('Timezone is required.');
      return;
    }
    setEditError(null);
    onEdit(action.id, nextPayload, 'Delivery settings updated from review card.');
    setIsStructuredEditorOpen(false);
  };

  const saveWorkspaceContextStructuredEdit = () => {
    if (!onEdit) return;
    const nextPayload = Object.fromEntries(
      Object.entries(workspaceContextDraft)
        .map(([key, value]) => [key, value.trim()])
        .filter(([, value]) => value.length > 0)
    );
    if (Object.keys(nextPayload).length === 0) {
      setEditError('Add at least one workspace context field to update.');
      return;
    }
    setEditError(null);
    onEdit(action.id, nextPayload, 'Workspace context updated from review card.');
    setIsStructuredEditorOpen(false);
  };

  const saveListStructuredEdit = () => {
    if (!onEdit) return;
    const nextPayload: Record<string, unknown> = {};
    const trimmedName = listNameInput.trim();
    if (!trimmedName) {
      setEditError('List name is required.');
      return;
    }
    nextPayload.name = trimmedName;
    if (action.action_type === 'create_lead_list' && listSourceInput.trim()) {
      nextPayload.source = listSourceInput.trim();
    }
    if (
      (action.action_type === 'create_marketing_list' ||
        action.action_type === 'rename_marketing_list') &&
      listDescriptionInput.trim()
    ) {
      nextPayload.description = listDescriptionInput.trim();
    }
    setEditError(null);
    onEdit(action.id, nextPayload, 'List details updated from review card.');
    setIsStructuredEditorOpen(false);
  };

  const saveConversationStructuredEdit = () => {
    if (!onEdit) return;
    const trimmedUntil = snoozeUntilInput.trim();
    if (!trimmedUntil) {
      setEditError('Snooze until is required.');
      return;
    }
    setEditError(null);
    onEdit(action.id, { until: trimmedUntil }, 'Conversation snooze updated from review card.');
    setIsStructuredEditorOpen(false);
  };

  const selectedCampaignSequenceNode =
    campaignSequenceNodes.find((node) => node.id === campaignSequenceSelectedNodeId) || null;

  const updateCampaignSequenceNode = (data: Partial<SequenceNode['data']>) => {
    if (!campaignSequenceSelectedNodeId) return;
    setCampaignSequenceNodes((current) =>
      current.map((node) =>
        node.id === campaignSequenceSelectedNodeId
          ? {
              ...node,
              data: {
                ...node.data,
                ...data,
              },
            }
          : node
      )
    );
  };

  const saveCampaignStepsStructuredEdit = () => {
    if (!onEdit) return;
    const editableNodes = campaignSequenceNodes.filter((node) => node.type !== 'start');
    if (editableNodes.length === 0) {
      setEditError('Sequence steps are required before this action can be saved.');
      return;
    }

    try {
      const preparedSteps = prepareNodesForSave(campaignSequenceNodes);
      const nodeIdToOrder = new Map(preparedSteps.map((step) => [step.nodeId, String(step.order)]));
      const branchRelationships = buildBranchRelationships(preparedSteps, nodeIdToOrder);
      const nextStepRelationships = buildNextStepRelationships(preparedSteps, nodeIdToOrder);
      const serializedSteps = preparedSteps
        .map((step) => {
          const serializedOrder = String(step.order);
          const branchRelationship = branchRelationships.get(serializedOrder);
          return {
            order: step.order,
            type: step.type,
            config: step.config,
            next_step_order: parseOptionalOrder(nextStepRelationships.get(serializedOrder)),
            true_branch_order: parseOptionalOrder(branchRelationship?.trueBranchStepId),
            false_branch_order: parseOptionalOrder(branchRelationship?.falseBranchStepId),
          };
        })
        .sort((left, right) => left.order - right.order);

      setEditError(null);
      onEdit(action.id, { steps: serializedSteps }, 'Campaign sequence updated from review card.');
      setIsStructuredEditorOpen(false);
    } catch (error) {
      setEditError(
        error instanceof Error
          ? error.message
          : 'Sequence changes could not be prepared for saving.'
      );
    }
  };

  return (
    <div className="mt-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-[#1E293B]">{action.preview.title}</div>
          <div className="mt-1 text-sm text-[#475569]">{action.preview.summary}</div>
          <div className="mt-3 flex flex-wrap gap-2">
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${riskTone}`}
            >
              {action.risk_level} risk
            </span>
            {expiresLabel ? (
              <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-[#475569]">
                Expires {expiresLabel}
              </span>
            ) : null}
          </div>
        </div>
        <div className="rounded-full bg-white px-2.5 py-1 text-xs font-medium capitalize text-[#475569]">
          {action.status.replace(/_/g, ' ')}
        </div>
      </div>

      {staleScopeReason ? (
        <div className="mt-3 rounded-lg border border-[#FECACA] bg-[#FEF2F2] p-3">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#B91C1C]">
            Scope Changed
          </div>
          <div className="text-sm text-[#991B1B]">{staleScopeReason}</div>
        </div>
      ) : null}

      {action.preview.warnings.length > 0 ? (
        <div className="mt-3 rounded-lg border border-[#FDE68A] bg-[#FFFBEB] p-3">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#B45309]">
            Review Warnings
          </div>
          <div className="space-y-1 text-sm text-[#92400E]">
            {action.preview.warnings.map((warning) => (
              <div key={warning}>{warning}</div>
            ))}
          </div>
        </div>
      ) : null}

      {sequenceSteps.length > 0 ? <AssistantSequencePreview steps={sequenceSteps} /> : null}

      {shouldRenderCampaignSummary ? (
        <div className="mt-3 rounded-lg border border-[#FBD38D] bg-[#FFF7ED] p-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-[#C2410C]">
                Campaign Review
              </div>
              <div className="mt-1 text-sm font-medium text-[#7C2D12]">{campaignName}</div>
            </div>
            {campaignId ? (
              <Link
                to="/dashboard/campaigns"
                search={{ campaignId }}
                className="inline-flex items-center rounded-lg border border-[#FDBA74] bg-white px-3 py-2 text-sm font-medium text-[#C2410C] transition-colors hover:bg-[#FFEDD5]"
              >
                Open In Campaigns
              </Link>
            ) : null}
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <div className="rounded-lg bg-white p-3 text-sm text-[#7C2D12]">
              <div className="font-medium text-[#9A3412]">Action</div>
              <div className="mt-1">
                {action.action_type === 'create_campaign'
                  ? 'Create a new campaign'
                  : action.action_type === 'update_campaign_steps'
                    ? 'Update the existing sequence'
                    : action.action_type === 'rename_campaign'
                      ? 'Rename this campaign'
                      : action.action_type === 'update_campaign_daily_limit'
                        ? 'Change the daily limit'
                        : action.action_type === 'start_campaign'
                          ? 'Launch this campaign'
                          : campaignNextStatus
                            ? `Move campaign to ${campaignNextStatus}`
                            : 'Update this campaign'}
              </div>
              {getRecordString(effectivePayload.name) &&
              getRecordString(effectivePayload.name) !==
                getRecordString(action.target_ref.campaign_name) ? (
                <div className="mt-1">New name: {getRecordString(effectivePayload.name)}</div>
              ) : null}
            </div>
            <div className="rounded-lg bg-white p-3 text-sm text-[#7C2D12]">
              <div className="font-medium text-[#9A3412]">Status / Limits</div>
              <div className="mt-1">Current status: {campaignStatusBefore}</div>
              {campaignNextStatus ? <div>Next status: {campaignNextStatus}</div> : null}
              <div>Daily limit: {campaignDailyLimit ?? 'Not set'}</div>
            </div>
            {action.action_type === 'start_campaign' ? (
              <div className="rounded-lg bg-white p-3 text-sm text-[#7C2D12]">
                <div className="font-medium text-[#9A3412]">Launch Readiness</div>
                <div className="mt-1">
                  Sequence: {campaignLaunchStepCount ?? 'Unknown'} step
                  {campaignLaunchStepCount === 1 ? '' : 's'}
                </div>
                <div>
                  Senders: {campaignLaunchSenderCount ?? 'Unknown'} active sender
                  {campaignLaunchSenderCount === 1 ? '' : 's'}
                </div>
                {campaignLaunchErrors.length > 0 ? (
                  <div className="mt-2 rounded-md border border-[#FECACA] bg-[#FEF2F2] px-2.5 py-2 text-[#991B1B]">
                    {campaignLaunchErrors[0]}
                  </div>
                ) : (
                  <div className="mt-2 rounded-md border border-[#BBF7D0] bg-[#F0FDF4] px-2.5 py-2 text-[#166534]">
                    Ready checks passed.
                  </div>
                )}
                {campaignLaunchWarnings.length > 0 ? (
                  <div className="mt-2 text-xs text-[#9A3412]">
                    {campaignLaunchWarnings.slice(0, 2).join(' ')}
                  </div>
                ) : null}
              </div>
            ) : null}
            <div className="rounded-lg bg-white p-3 text-sm text-[#7C2D12]">
              <div className="font-medium text-[#9A3412]">Sequence</div>
              <div className="mt-1">
                {sequenceSteps.length > 0
                  ? `${sequenceSteps.length} step${sequenceSteps.length === 1 ? '' : 's'} in this flow`
                  : 'No sequence changes in this action'}
              </div>
              {sequenceSteps.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {sequenceSteps.slice(0, 4).map((step) => (
                    <span
                      key={`${step.order}-${step.type}`}
                      className="rounded-full border border-[#FED7AA] bg-[#FFF7ED] px-2.5 py-1 text-xs font-medium text-[#9A3412]"
                    >
                      {step.order}. {formatStepTypeLabel(step.type)}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {shouldRenderImportSummary ? (
        <div className="mt-3 rounded-lg border border-[#BFDBFE] bg-[#EFF6FF] p-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-[#1D4ED8]">
                Import Review
              </div>
              <div className="mt-1 text-sm font-medium text-[#1E3A8A]">
                {action.action_type === 'cancel_leads_import'
                  ? getRecordString(action.target_ref.import_job_list_name) || 'Lead import'
                  : importListName}
              </div>
            </div>
            {importLeadListId ? (
              <Link
                to="/dashboard/leads"
                search={{ listId: importLeadListId }}
                className="inline-flex items-center rounded-lg border border-[#93C5FD] bg-white px-3 py-2 text-sm font-medium text-[#1D4ED8] transition-colors hover:bg-[#DBEAFE]"
              >
                Open In Leads
              </Link>
            ) : null}
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <div className="rounded-lg bg-white p-3 text-sm text-[#1E293B]">
              <div className="font-medium text-[#1D4ED8]">
                {action.action_type === 'cancel_leads_import' ? 'Action' : 'Destination'}
              </div>
              <div className="mt-1">
                {action.action_type === 'cancel_leads_import'
                  ? `Cancel the running import for ${
                      getRecordString(action.target_ref.import_job_list_name) || 'this list'
                    }`
                  : importTargetsExistingList
                    ? `Existing list: ${importListName}`
                    : `New list: ${importListName}`}
              </div>
              {action.action_type !== 'cancel_leads_import' ? <div>Type: {importType}</div> : null}
              {action.action_type !== 'cancel_leads_import' ? (
                <div>
                  Account:{' '}
                  {getRecordString(action.target_ref.linkedin_account_name) || 'Not resolved'}
                </div>
              ) : null}
            </div>
            <div className="rounded-lg bg-white p-3 text-sm text-[#1E293B]">
              <div className="font-medium text-[#1D4ED8]">Source</div>
              {getRecordString(effectivePayload.source_url) ? (
                <div className="mt-1 break-all">
                  URL: {getRecordString(effectivePayload.source_url)}
                </div>
              ) : null}
              {importUrls.length > 0 ? (
                <div className="mt-1">Pasted URLs: {importUrls.length}</div>
              ) : null}
              {!getRecordString(effectivePayload.source_url) && importUrls.length === 0 ? (
                <div className="mt-1 text-[#475569]">
                  Search-based import with configured criteria.
                </div>
              ) : null}
            </div>
            <div className="rounded-lg bg-white p-3 text-sm text-[#1E293B] md:col-span-2 xl:col-span-1">
              <div className="font-medium text-[#1D4ED8]">Config</div>
              {importKeywords ? <div className="mt-1">Keywords: {importKeywords}</div> : null}
              {importLocation ? <div>Location: {importLocation}</div> : null}
              {importNetworkDistance.length > 0 ? (
                <div>Network: {importNetworkDistance.join(', ')}</div>
              ) : null}
              {importMaxLeads !== null ? <div>Max leads: {importMaxLeads}</div> : null}
              {!importKeywords &&
              !importLocation &&
              importNetworkDistance.length === 0 &&
              importMaxLeads === null ? (
                <div className="mt-1 text-[#475569]">No extra search filters configured.</div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {shouldRenderMergeSummary ? (
        <div className="mt-3 rounded-lg border border-[#BFDBFE] bg-[#EFF6FF] p-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-[#1D4ED8]">
                Lead List Merge Review
              </div>
              <div className="mt-1 text-sm font-medium text-[#1E3A8A]">{mergeTargetListName}</div>
            </div>
            {mergeTargetListId ? (
              <Link
                to="/dashboard/leads"
                search={{ listId: mergeTargetListId }}
                className="inline-flex items-center rounded-lg border border-[#93C5FD] bg-white px-3 py-2 text-sm font-medium text-[#1D4ED8] transition-colors hover:bg-[#DBEAFE]"
              >
                Open In Leads
              </Link>
            ) : null}
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <div className="rounded-lg bg-white p-3 text-sm text-[#1E293B]">
              <div className="font-medium text-[#1D4ED8]">Destination</div>
              <div className="mt-1">Target list: {mergeTargetListName}</div>
              <div>
                Source lists:{' '}
                {mergeSourceListNames.length > 0 ? mergeSourceListNames.join(', ') : 'Not resolved'}
              </div>
            </div>
            <div className="rounded-lg bg-white p-3 text-sm text-[#1E293B]">
              <div className="font-medium text-[#1D4ED8]">Merge Result</div>
              <div className="mt-1">Unique leads to add: {mergeLeadsToAdd ?? 'Unknown'}</div>
              <div>Duplicates skipped: {mergeDuplicatesSkipped ?? 0}</div>
            </div>
            <div className="rounded-lg bg-white p-3 text-sm text-[#1E293B]">
              <div className="font-medium text-[#1D4ED8]">Source Cleanup</div>
              <div className="mt-1">
                {mergeDeletesSources
                  ? 'Delete source lists when safe'
                  : 'Keep source lists after merge'}
              </div>
              {mergeSourceListsReadyForDeletion !== null ? (
                <div>Ready to delete: {mergeSourceListsReadyForDeletion}</div>
              ) : null}
              {mergeSourceListsBlockedFromDeletion !== null ? (
                <div>Blocked from deletion: {mergeSourceListsBlockedFromDeletion}</div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {shouldRenderSettingsSummary ? (
        <div className="mt-3 rounded-lg border border-[#BBF7D0] bg-[#F0FDF4] p-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-[#15803D]">
            Delivery Settings Review
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-lg bg-white p-3 text-sm text-[#14532D]">
              <div className="font-medium text-[#15803D]">Daily summary</div>
              <div className="mt-1">
                {effectivePayload.daily_summary_enabled === false ? 'Disabled' : 'Enabled'}
              </div>
            </div>
            <div className="rounded-lg bg-white p-3 text-sm text-[#14532D]">
              <div className="font-medium text-[#15803D]">Channel</div>
              <div className="mt-1">
                {getRecordString(effectivePayload.delivery_channel) || 'dashboard'}
              </div>
            </div>
            <div className="rounded-lg bg-white p-3 text-sm text-[#14532D]">
              <div className="font-medium text-[#15803D]">Summary time</div>
              <div className="mt-1">
                {getRecordString(effectivePayload.daily_summary_time) || 'Not set'}
              </div>
            </div>
            <div className="rounded-lg bg-white p-3 text-sm text-[#14532D]">
              <div className="font-medium text-[#15803D]">Timezone</div>
              <div className="mt-1">{getRecordString(effectivePayload.timezone) || 'Not set'}</div>
            </div>
          </div>
        </div>
      ) : null}

      {shouldRenderWorkspaceContextSummary ? (
        <div className="mt-3 rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] p-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-[#334155]">
            Workspace Context Review
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {workspaceContextEntries.length > 0 ? (
              workspaceContextEntries.map(([field, value]) => (
                <div key={field} className="rounded-lg bg-white p-3 text-sm text-[#1E293B]">
                  <div className="font-medium text-[#334155]">{formatFieldLabel(field)}</div>
                  <div className="mt-1 whitespace-pre-wrap text-[#475569]">{value}</div>
                </div>
              ))
            ) : (
              <div className="rounded-lg bg-white p-3 text-sm text-[#475569]">
                No structured workspace context fields were included in this action.
              </div>
            )}
          </div>
        </div>
      ) : null}

      {shouldRenderListSummary ? (
        <div className="mt-3 rounded-lg border border-[#BFDBFE] bg-[#EFF6FF] p-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-[#1D4ED8]">
            {action.action_type.includes('marketing')
              ? 'Marketing List Review'
              : 'Lead List Review'}
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <div className="rounded-lg bg-white p-3 text-sm text-[#1E293B]">
              <div className="font-medium text-[#1D4ED8]">Action</div>
              <div className="mt-1">
                {action.action_type.startsWith('create_')
                  ? 'Create a new list'
                  : 'Rename the existing list'}
              </div>
              <div className="mt-1">Name: {listName}</div>
            </div>
            {action.action_type === 'create_lead_list' ? (
              <div className="rounded-lg bg-white p-3 text-sm text-[#1E293B]">
                <div className="font-medium text-[#1D4ED8]">Source</div>
                <div className="mt-1">{listSource || 'Not set'}</div>
              </div>
            ) : null}
            {action.action_type.includes('marketing') ? (
              <div className="rounded-lg bg-white p-3 text-sm text-[#1E293B]">
                <div className="font-medium text-[#1D4ED8]">Description</div>
                <div className="mt-1 whitespace-pre-wrap text-[#475569]">
                  {listDescription || 'No description provided'}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {shouldRenderConversationUtilitySummary ? (
        <div className="mt-3 rounded-lg border border-[#D8B4FE] bg-[#FAF5FF] p-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-[#7C3AED]">
                Conversation Review
              </div>
              <div className="mt-1 text-sm font-medium text-[#4C1D95]">
                {getRecordString(action.target_ref.conversation_name) || 'Conversation'}
              </div>
            </div>
            {conversationId ? (
              <Link
                to="/dashboard/inbox"
                search={{ conversationId }}
                className="inline-flex items-center rounded-lg border border-[#C4B5FD] bg-white px-3 py-2 text-sm font-medium text-[#6D28D9] transition-colors hover:bg-[#F3E8FF]"
              >
                Open In Inbox
              </Link>
            ) : null}
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <div className="rounded-lg bg-white p-3 text-sm text-[#1E293B]">
              <div className="font-medium text-[#6D28D9]">Action</div>
              <div className="mt-1">
                {action.action_type === 'mark_conversation_read'
                  ? 'Mark this conversation as read'
                  : 'Snooze this conversation'}
              </div>
            </div>
            {action.action_type === 'snooze_conversation' ? (
              <div className="rounded-lg bg-white p-3 text-sm text-[#1E293B]">
                <div className="font-medium text-[#6D28D9]">Until</div>
                <div className="mt-1">{snoozeUntil || 'Not set'}</div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {shouldRenderReplySummary ? (
        <div className="mt-3 rounded-lg border border-[#D8B4FE] bg-[#FAF5FF] p-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-[#7C3AED]">
                Reply Review
              </div>
              <div className="mt-1 text-sm font-medium text-[#4C1D95]">
                {getRecordString(action.target_ref.conversation_name) || 'Conversation reply'}
              </div>
            </div>
            {conversationId ? (
              <Link
                to="/dashboard/inbox"
                search={{ conversationId }}
                className="inline-flex items-center rounded-lg border border-[#C4B5FD] bg-white px-3 py-2 text-sm font-medium text-[#6D28D9] transition-colors hover:bg-[#F3E8FF]"
              >
                Open In Inbox
              </Link>
            ) : null}
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <div className="rounded-lg bg-white p-3 text-sm text-[#1E293B]">
              <div className="font-medium text-[#6D28D9]">Action</div>
              <div className="mt-1">
                {action.action_type === 'send_reply_draft'
                  ? 'Send this drafted reply now'
                  : 'Create a reply draft'}
              </div>
              <div className="mt-1">
                Conversation:{' '}
                {getRecordString(action.target_ref.conversation_name) || 'Unknown thread'}
              </div>
              {getRecordString(action.target_ref.draft_message_id) ? (
                <div className="mt-1">
                  Draft ID: {getRecordString(action.target_ref.draft_message_id)}
                </div>
              ) : null}
            </div>
            <div className="rounded-lg bg-white p-3 text-sm text-[#1E293B]">
              <div className="font-medium text-[#6D28D9]">Draft Preview</div>
              {replySubject ? (
                <div className="mt-1">
                  <span className="font-medium">Subject:</span> {replySubject}
                </div>
              ) : null}
              <div className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#334155]">
                {replyBody || 'No body provided'}
              </div>
              {replyBody ? (
                <div className="mt-2 text-xs text-[#64748B]">{replyBody.length} characters</div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {scopeReview ? (
        <div className="mt-3 rounded-lg border border-[#BFDBFE] bg-[#EFF6FF] p-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-[#1D4ED8]">
                Lead Selection
              </div>
              <div className="mt-1 text-sm font-medium text-[#1E3A8A]">
                {scopeReview.matched_count} of your lead
                {scopeReview.matched_count === 1 ? '' : 's'} will be affected
              </div>
            </div>
          </div>
          {scopeReview.sample_records.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {scopeReview.sample_records.map((lead, index) => (
                <div
                  key={`${lead.name || 'lead'}-${index}`}
                  className="rounded-full border border-[#BFDBFE] bg-white px-3 py-1.5 text-sm text-[#1E293B]"
                >
                  <span className="font-medium">{lead.name || 'Unknown lead'}</span>
                  {lead.company ? <span className="text-[#64748B]"> · {lead.company}</span> : null}
                  {lead.status ? <span className="text-[#94A3B8]"> · {lead.status}</span> : null}
                </div>
              ))}
            </div>
          ) : null}
          {leadsSearch ||
          (action.status !== 'executed' && action.status !== 'rejected' && onEdit) ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {leadsSearch ? (
                <Link
                  to="/dashboard/leads"
                  search={leadsSearch}
                  className="inline-flex items-center rounded-lg border border-[#93C5FD] bg-white px-3 py-2 text-sm font-medium text-[#1D4ED8] transition-colors hover:bg-[#DBEAFE]"
                >
                  Open In Leads
                </Link>
              ) : null}
              {action.status !== 'executed' && action.status !== 'rejected' && onEdit ? (
                <button
                  type="button"
                  onClick={() => setIsSelectionEditorOpen((value) => !value)}
                  className="inline-flex items-center rounded-lg border border-[#93C5FD] bg-white px-3 py-2 text-sm font-medium text-[#1D4ED8] transition-colors hover:bg-[#DBEAFE]"
                >
                  {isSelectionEditorOpen ? 'Close Selection Editor' : 'Edit Selection'}
                </button>
              ) : null}
            </div>
          ) : null}
          {isSelectionEditorOpen && selectionFilters ? (
            <div className="mt-3 rounded-lg border border-[#BFDBFE] bg-white p-3">
              <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#1D4ED8]">
                Selection Filters
              </div>
              {typeof selectionFilters.lead_list_name === 'string' &&
              selectionFilters.lead_list_name ? (
                <div className="mb-3 rounded-lg bg-[#F8FAFC] px-3 py-2 text-sm text-[#475569]">
                  Source list: {selectionFilters.lead_list_name}
                </div>
              ) : null}
              {typeof selectionFilters.search === 'string' && selectionFilters.search ? (
                <div className="mb-3 rounded-lg bg-[#F8FAFC] px-3 py-2 text-sm text-[#475569]">
                  Search: {selectionFilters.search}
                </div>
              ) : null}
              <div className="grid gap-3 md:grid-cols-2">
                <label className="text-sm text-[#1E293B]">
                  <div className="mb-1 font-medium">Status</div>
                  <select
                    value={selectionStatus}
                    onChange={(event) =>
                      setSelectionStatus(event.target.value as SelectionStatusFilter)
                    }
                    className="w-full rounded-lg border border-[#CBD5E1] px-3 py-2 text-sm text-[#1E293B] focus:border-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20"
                  >
                    <option value="all">All status</option>
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="accepted">Accepted</option>
                    <option value="replied">Replied</option>
                    <option value="qualified">Qualified</option>
                    <option value="not_interested">Not interested</option>
                  </select>
                </label>
                <label className="text-sm text-[#1E293B]">
                  <div className="mb-1 font-medium">Email</div>
                  <select
                    value={selectionEmail}
                    onChange={(event) =>
                      setSelectionEmail(event.target.value as SelectionEmailFilter)
                    }
                    className="w-full rounded-lg border border-[#CBD5E1] px-3 py-2 text-sm text-[#1E293B] focus:border-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20"
                  >
                    <option value="all">All emails</option>
                    <option value="has_email">Has email</option>
                    <option value="no_email">No email</option>
                  </select>
                </label>
                <label className="text-sm text-[#1E293B]">
                  <div className="mb-1 font-medium">Campaign</div>
                  <select
                    value={selectionCampaign}
                    onChange={(event) =>
                      setSelectionCampaign(event.target.value as SelectionCampaignFilter)
                    }
                    className="w-full rounded-lg border border-[#CBD5E1] px-3 py-2 text-sm text-[#1E293B] focus:border-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20"
                  >
                    <option value="all">All campaigns</option>
                    <option value="in_campaign">In campaign</option>
                    <option value="not_in_campaign">Not in campaign</option>
                  </select>
                </label>
                <label className="flex items-center gap-2 rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm text-[#1E293B]">
                  <input
                    type="checkbox"
                    checked={selectionImportedOnly}
                    onChange={(event) => setSelectionImportedOnly(event.target.checked)}
                    className="rounded border-[#CBD5E1] text-[#FF6B35] focus:ring-[#FF6B35]"
                  />
                  Imported only
                </label>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={isEditing}
                  onClick={() => {
                    const nextFilters: Record<string, unknown> = { ...selectionFilters };
                    if (selectionStatus === 'all') {
                      delete nextFilters.status;
                    } else {
                      nextFilters.status = selectionStatus;
                    }
                    if (selectionEmail === 'all') {
                      delete nextFilters.has_email;
                    } else {
                      nextFilters.has_email = selectionEmail === 'has_email';
                    }
                    if (selectionCampaign === 'all') {
                      delete nextFilters.in_campaign;
                    } else {
                      nextFilters.in_campaign = selectionCampaign === 'in_campaign';
                    }
                    if (selectionImportedOnly) {
                      nextFilters.imported_only = true;
                    } else {
                      delete nextFilters.imported_only;
                    }
                    onEdit?.(
                      action.id,
                      { lead_filters: nextFilters },
                      'Lead selection updated from review card.'
                    );
                    setIsSelectionEditorOpen(false);
                  }}
                  className="rounded-lg bg-[#FF6B35] px-3 py-2 text-sm font-medium text-white disabled:bg-[#CBD5E1]"
                >
                  {isEditing ? 'Saving...' : 'Save selection'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsSelectionEditorOpen(false)}
                  className="rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-sm font-medium text-[#1E293B]"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {!hideVerbosePayload ? (
        <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-lg border border-[#E2E8F0] bg-white p-3">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#94A3B8]">
              Target
            </div>
            <div className="whitespace-pre-wrap text-sm text-[#1E293B]">
              {formatRecord(targetDisplay)}
            </div>
          </div>
          <div className="rounded-lg border border-[#E2E8F0] bg-white p-3">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#94A3B8]">
              Before
            </div>
            <div className="whitespace-pre-wrap text-sm text-[#1E293B]">
              {formatRecord(action.preview.before)}
            </div>
          </div>
          <div className="rounded-lg border border-[#E2E8F0] bg-white p-3">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#94A3B8]">
              After
            </div>
            <div className="whitespace-pre-wrap text-sm text-[#1E293B]">
              {formatRecord(afterDisplay)}
            </div>
          </div>
          <div className="rounded-lg border border-[#E2E8F0] bg-white p-3">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#94A3B8]">
              Exact Payload
            </div>
            <div className="whitespace-pre-wrap text-sm text-[#1E293B]">
              {formatRecord(action.preview.exact_payload)}
            </div>
          </div>
        </div>
      ) : null}
      {hideVerbosePayload ? (
        <details className="mt-3 rounded-lg border border-[#E2E8F0] bg-white p-3">
          <summary className="cursor-pointer text-sm font-medium text-[#334155]">
            {advancedToggleLabel}
          </summary>
          <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-3">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#94A3B8]">
                Target
              </div>
              <div className="whitespace-pre-wrap text-sm text-[#1E293B]">
                {formatRecord(targetDisplay)}
              </div>
            </div>
            <div className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-3">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#94A3B8]">
                Before
              </div>
              <div className="whitespace-pre-wrap text-sm text-[#1E293B]">
                {formatRecord(action.preview.before)}
              </div>
            </div>
            <div className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-3">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#94A3B8]">
                After
              </div>
              <div className="whitespace-pre-wrap text-sm text-[#1E293B]">
                {formatRecord(afterDisplay)}
              </div>
            </div>
            <div className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-3">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#94A3B8]">
                Exact Payload
              </div>
              <div className="whitespace-pre-wrap text-sm text-[#1E293B]">
                {formatRecord(action.preview.exact_payload)}
              </div>
            </div>
          </div>
          {action.status !== 'executed' &&
          action.status !== 'rejected' &&
          !isPendingTargetSelection &&
          onEdit &&
          supportsStructuredEditor ? (
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={openJsonEditor}
                disabled={isEditing}
                className="rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-sm font-medium text-[#1E293B] disabled:bg-[#F1F5F9]"
              >
                Edit JSON
              </button>
            </div>
          ) : null}
        </details>
      ) : null}

      {isPendingTargetSelection ? (
        <div className="mt-3 rounded-lg border border-[#FDE68A] bg-[#FFFBEB] p-3">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#B45309]">
            Waiting For Target Selection
          </div>
          <div className="text-sm text-[#92400E]">
            Reply with one of these exact names to continue this action.
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {pendingOptions.map((option) => (
              <span
                key={option}
                className="rounded-full border border-[#FCD34D] bg-white px-3 py-1 text-sm text-[#92400E]"
              >
                {option}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {action.result ? (
        <div className="mt-3 rounded-lg border border-[#D1FAE5] bg-[#ECFDF5] p-3 text-sm text-[#065F46]">
          {formatRecord(action.result)}
        </div>
      ) : null}
      {action.error ? (
        <div className="mt-3 rounded-lg border border-[#FECACA] bg-[#FEF2F2] p-3 text-sm text-[#B91C1C]">
          {action.error}
        </div>
      ) : null}

      {isStructuredEditorOpen && supportsCampaignStructuredEditor ? (
        <div className="mt-3 space-y-3 rounded-lg border border-[#FBD38D] bg-white p-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-[#C2410C]">
            Edit Campaign
          </div>
          {action.action_type === 'create_campaign' || action.action_type === 'rename_campaign' ? (
            <label className="block text-sm text-[#1E293B]">
              <div className="mb-1 font-medium">Campaign name</div>
              <input
                value={campaignNameInput}
                onChange={(event) => setCampaignNameInput(event.target.value)}
                className="w-full rounded-lg border border-[#CBD5E1] px-3 py-2 text-sm text-[#1E293B] focus:border-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20"
              />
            </label>
          ) : null}
          {action.action_type === 'update_campaign_daily_limit' ? (
            <label className="block text-sm text-[#1E293B]">
              <div className="mb-1 font-medium">Daily limit</div>
              <input
                value={campaignDailyLimitInput}
                onChange={(event) => setCampaignDailyLimitInput(event.target.value)}
                inputMode="numeric"
                className="w-full rounded-lg border border-[#CBD5E1] px-3 py-2 text-sm text-[#1E293B] focus:border-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20"
              />
            </label>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={saveCampaignStructuredEdit}
              disabled={isEditing}
              className="rounded-lg bg-[#FF6B35] px-3 py-2 text-sm font-medium text-white disabled:bg-[#CBD5E1]"
            >
              {isEditing ? 'Saving...' : 'Save changes'}
            </button>
            <button
              type="button"
              onClick={() => setIsStructuredEditorOpen(false)}
              className="rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-sm font-medium text-[#1E293B]"
            >
              Cancel
            </button>
          </div>
          {editError ? <div className="text-sm text-[#B91C1C]">{editError}</div> : null}
        </div>
      ) : null}

      {isStructuredEditorOpen && supportsCampaignStepsStructuredEditor ? (
        <div className="mt-3 space-y-3 rounded-lg border border-[#FBD38D] bg-white p-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-[#C2410C]">
              Edit Campaign Sequence
            </div>
            <div className="mt-1 text-sm text-[#7C2D12]">
              Step order and branch structure stay locked here. Edit step content only.
            </div>
          </div>
          <div className="overflow-hidden rounded-xl border border-[#E2E8F0] bg-[#FAFBFC] lg:flex">
            <div className="h-[420px] min-h-[420px] flex-1">
              <SequenceCanvas
                nodes={campaignSequenceNodes}
                onNodesChange={setCampaignSequenceNodes}
                onNodeSelect={(node) => setCampaignSequenceSelectedNodeId(node?.id || null)}
                selectedNodeId={campaignSequenceSelectedNodeId}
                readonlyStructure
              />
            </div>
            <div className="border-t border-[#E2E8F0] lg:border-l lg:border-t-0">
              {selectedCampaignSequenceNode &&
              selectedCampaignSequenceNode.type !== 'start' &&
              selectedCampaignSequenceNode.type !== 'end' ? (
                <NodeConfigPanel
                  node={selectedCampaignSequenceNode}
                  onUpdate={updateCampaignSequenceNode}
                  onClose={() => setCampaignSequenceSelectedNodeId(null)}
                  readonlyStructure
                  suggestionContext={{
                    workspaceId: action.workspace_id,
                    campaignId,
                  }}
                />
              ) : (
                <div className="flex h-full min-h-[220px] w-full items-center justify-center bg-white px-6 py-8 text-sm text-[#64748B] lg:w-80">
                  Select a campaign step to edit its content.
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={saveCampaignStepsStructuredEdit}
              disabled={isEditing}
              className="rounded-lg bg-[#FF6B35] px-3 py-2 text-sm font-medium text-white disabled:bg-[#CBD5E1]"
            >
              {isEditing ? 'Saving...' : 'Save changes'}
            </button>
            <button
              type="button"
              onClick={() => setIsStructuredEditorOpen(false)}
              className="rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-sm font-medium text-[#1E293B]"
            >
              Cancel
            </button>
          </div>
          {editError ? <div className="text-sm text-[#B91C1C]">{editError}</div> : null}
        </div>
      ) : null}

      {isStructuredEditorOpen && supportsImportStructuredEditor ? (
        <div className="mt-3 space-y-3 rounded-lg border border-[#BFDBFE] bg-white p-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-[#1D4ED8]">
            Edit Import Criteria
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {importTargetsExistingList ? (
              <div className="text-sm text-[#1E293B]">
                <div className="mb-1 font-medium">Destination</div>
                <div className="rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] px-3 py-2">
                  Existing list: {importListName}
                </div>
              </div>
            ) : (
              <label className="text-sm text-[#1E293B]">
                <div className="mb-1 font-medium">List name</div>
                <input
                  value={importListNameInput}
                  onChange={(event) => setImportListNameInput(event.target.value)}
                  className="w-full rounded-lg border border-[#CBD5E1] px-3 py-2 text-sm text-[#1E293B] focus:border-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20"
                />
              </label>
            )}
            <label className="text-sm text-[#1E293B]">
              <div className="mb-1 font-medium">Import type</div>
              <select
                value={importTypeInput}
                onChange={(event) => setImportTypeInput(event.target.value)}
                className="w-full rounded-lg border border-[#CBD5E1] px-3 py-2 text-sm text-[#1E293B] focus:border-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20"
              >
                <option value="">Select import type</option>
                <option value="linkedin_people_search">LinkedIn people search</option>
                <option value="paste_urls">Paste profile URLs</option>
                <option value="sales_nav_leads">Sales Navigator search</option>
                <option value="linkedin_post_reactors">LinkedIn post reactors</option>
                <option value="linkedin_companies">LinkedIn company employees</option>
                <option value="linkedin_recruiter">LinkedIn recruiter search</option>
              </select>
            </label>
          </div>
          {importTypeInput === 'linkedin_people_search' ? (
            <div className="grid gap-3 md:grid-cols-2">
              <label className="text-sm text-[#1E293B]">
                <div className="mb-1 font-medium">Keywords</div>
                <input
                  value={importKeywordsInput}
                  onChange={(event) => setImportKeywordsInput(event.target.value)}
                  className="w-full rounded-lg border border-[#CBD5E1] px-3 py-2 text-sm text-[#1E293B] focus:border-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20"
                />
              </label>
              <label className="text-sm text-[#1E293B]">
                <div className="mb-1 font-medium">Location</div>
                <input
                  value={importLocationInput}
                  onChange={(event) => setImportLocationInput(event.target.value)}
                  className="w-full rounded-lg border border-[#CBD5E1] px-3 py-2 text-sm text-[#1E293B] focus:border-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20"
                />
              </label>
              <label className="text-sm text-[#1E293B]">
                <div className="mb-1 font-medium">Network distance</div>
                <input
                  value={importNetworkDistanceInput}
                  onChange={(event) => setImportNetworkDistanceInput(event.target.value)}
                  placeholder="2, 3, group"
                  className="w-full rounded-lg border border-[#CBD5E1] px-3 py-2 text-sm text-[#1E293B] focus:border-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20"
                />
              </label>
              <label className="text-sm text-[#1E293B]">
                <div className="mb-1 font-medium">Max leads</div>
                <input
                  value={importMaxLeadsInput}
                  onChange={(event) => setImportMaxLeadsInput(event.target.value)}
                  inputMode="numeric"
                  className="w-full rounded-lg border border-[#CBD5E1] px-3 py-2 text-sm text-[#1E293B] focus:border-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20"
                />
              </label>
            </div>
          ) : null}
          {importTypeInput === 'paste_urls' ? (
            <label className="block text-sm text-[#1E293B]">
              <div className="mb-1 font-medium">Profile URLs</div>
              <textarea
                value={importUrlsText}
                onChange={(event) => setImportUrlsText(event.target.value)}
                className="min-h-[140px] w-full rounded-lg border border-[#CBD5E1] px-3 py-2 text-sm text-[#1E293B] focus:border-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20"
              />
            </label>
          ) : null}
          {importTypeInput &&
          importTypeInput !== 'linkedin_people_search' &&
          importTypeInput !== 'paste_urls' ? (
            <div className="grid gap-3 md:grid-cols-2">
              <label className="text-sm text-[#1E293B] md:col-span-2">
                <div className="mb-1 font-medium">Source URL</div>
                <input
                  value={importSourceUrlInput}
                  onChange={(event) => setImportSourceUrlInput(event.target.value)}
                  className="w-full rounded-lg border border-[#CBD5E1] px-3 py-2 text-sm text-[#1E293B] focus:border-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20"
                />
              </label>
              <label className="text-sm text-[#1E293B]">
                <div className="mb-1 font-medium">Max leads</div>
                <input
                  value={importMaxLeadsInput}
                  onChange={(event) => setImportMaxLeadsInput(event.target.value)}
                  inputMode="numeric"
                  className="w-full rounded-lg border border-[#CBD5E1] px-3 py-2 text-sm text-[#1E293B] focus:border-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20"
                />
              </label>
            </div>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={saveImportStructuredEdit}
              disabled={isEditing}
              className="rounded-lg bg-[#FF6B35] px-3 py-2 text-sm font-medium text-white disabled:bg-[#CBD5E1]"
            >
              {isEditing ? 'Saving...' : 'Save changes'}
            </button>
            <button
              type="button"
              onClick={() => setIsStructuredEditorOpen(false)}
              className="rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-sm font-medium text-[#1E293B]"
            >
              Cancel
            </button>
          </div>
          {editError ? <div className="text-sm text-[#B91C1C]">{editError}</div> : null}
        </div>
      ) : null}

      {isStructuredEditorOpen && supportsReplyStructuredEditor ? (
        <div className="mt-3 space-y-3 rounded-lg border border-[#D8B4FE] bg-white p-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-[#7C3AED]">
            Edit Reply
          </div>
          <label className="block text-sm text-[#1E293B]">
            <div className="mb-1 font-medium">Subject</div>
            <input
              value={replySubjectInput}
              onChange={(event) => setReplySubjectInput(event.target.value)}
              className="w-full rounded-lg border border-[#CBD5E1] px-3 py-2 text-sm text-[#1E293B] focus:border-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20"
            />
          </label>
          <label className="block text-sm text-[#1E293B]">
            <div className="mb-1 font-medium">Body</div>
            <textarea
              value={replyBodyInput}
              onChange={(event) => setReplyBodyInput(event.target.value)}
              className="min-h-[180px] w-full rounded-lg border border-[#CBD5E1] px-3 py-2 text-sm text-[#1E293B] focus:border-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={saveReplyStructuredEdit}
              disabled={isEditing}
              className="rounded-lg bg-[#FF6B35] px-3 py-2 text-sm font-medium text-white disabled:bg-[#CBD5E1]"
            >
              {isEditing ? 'Saving...' : 'Save changes'}
            </button>
            <button
              type="button"
              onClick={() => setIsStructuredEditorOpen(false)}
              className="rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-sm font-medium text-[#1E293B]"
            >
              Cancel
            </button>
          </div>
          {editError ? <div className="text-sm text-[#B91C1C]">{editError}</div> : null}
        </div>
      ) : null}

      {isStructuredEditorOpen && supportsSettingsStructuredEditor ? (
        <div className="mt-3 space-y-3 rounded-lg border border-[#BBF7D0] bg-white p-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-[#15803D]">
            Edit Delivery Settings
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="flex items-center gap-2 rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm text-[#1E293B]">
              <input
                type="checkbox"
                checked={deliverySettingsDraft.dailySummaryEnabled}
                onChange={(event) =>
                  setDeliverySettingsDraft((current) => ({
                    ...current,
                    dailySummaryEnabled: event.target.checked,
                  }))
                }
                className="rounded border-[#CBD5E1] text-[#FF6B35] focus:ring-[#FF6B35]"
              />
              Daily summary enabled
            </label>
            <label className="text-sm text-[#1E293B]">
              <div className="mb-1 font-medium">Delivery channel</div>
              <select
                value={deliverySettingsDraft.deliveryChannel}
                onChange={(event) =>
                  setDeliverySettingsDraft((current) => ({
                    ...current,
                    deliveryChannel: event.target.value,
                  }))
                }
                className="w-full rounded-lg border border-[#CBD5E1] px-3 py-2 text-sm text-[#1E293B] focus:border-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20"
              >
                <option value="dashboard">Dashboard</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="both">Both</option>
              </select>
            </label>
            <label className="text-sm text-[#1E293B]">
              <div className="mb-1 font-medium">Daily summary time</div>
              <input
                value={deliverySettingsDraft.dailySummaryTime}
                onChange={(event) =>
                  setDeliverySettingsDraft((current) => ({
                    ...current,
                    dailySummaryTime: event.target.value,
                  }))
                }
                className="w-full rounded-lg border border-[#CBD5E1] px-3 py-2 text-sm text-[#1E293B] focus:border-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20"
              />
            </label>
            <label className="text-sm text-[#1E293B]">
              <div className="mb-1 font-medium">Timezone</div>
              <input
                value={deliverySettingsDraft.timezone}
                onChange={(event) =>
                  setDeliverySettingsDraft((current) => ({
                    ...current,
                    timezone: event.target.value,
                  }))
                }
                className="w-full rounded-lg border border-[#CBD5E1] px-3 py-2 text-sm text-[#1E293B] focus:border-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20"
              />
            </label>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={saveSettingsStructuredEdit}
              disabled={isEditing}
              className="rounded-lg bg-[#FF6B35] px-3 py-2 text-sm font-medium text-white disabled:bg-[#CBD5E1]"
            >
              {isEditing ? 'Saving...' : 'Save changes'}
            </button>
            <button
              type="button"
              onClick={() => setIsStructuredEditorOpen(false)}
              className="rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-sm font-medium text-[#1E293B]"
            >
              Cancel
            </button>
          </div>
          {editError ? <div className="text-sm text-[#B91C1C]">{editError}</div> : null}
        </div>
      ) : null}

      {isStructuredEditorOpen && supportsWorkspaceContextStructuredEditor ? (
        <div className="mt-3 space-y-3 rounded-lg border border-[#CBD5E1] bg-white p-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-[#334155]">
            Edit Workspace Context
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {workspaceContextFields.map((field) => (
              <label key={field} className="block text-sm text-[#1E293B]">
                <div className="mb-1 font-medium">{formatFieldLabel(field)}</div>
                {field === 'business_blurb' ||
                field === 'icp' ||
                field === 'outreach_intent' ||
                field === 'value_proposition' ||
                field === 'reply_guardrails' ||
                field === 'forbidden_claims' ? (
                  <textarea
                    value={workspaceContextDraft[field] || ''}
                    onChange={(event) =>
                      setWorkspaceContextDraft((current) => ({
                        ...current,
                        [field]: event.target.value,
                      }))
                    }
                    className="min-h-[110px] w-full rounded-lg border border-[#CBD5E1] px-3 py-2 text-sm text-[#1E293B] focus:border-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20"
                  />
                ) : (
                  <input
                    value={workspaceContextDraft[field] || ''}
                    onChange={(event) =>
                      setWorkspaceContextDraft((current) => ({
                        ...current,
                        [field]: event.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-[#CBD5E1] px-3 py-2 text-sm text-[#1E293B] focus:border-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20"
                  />
                )}
              </label>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={saveWorkspaceContextStructuredEdit}
              disabled={isEditing}
              className="rounded-lg bg-[#FF6B35] px-3 py-2 text-sm font-medium text-white disabled:bg-[#CBD5E1]"
            >
              {isEditing ? 'Saving...' : 'Save changes'}
            </button>
            <button
              type="button"
              onClick={() => setIsStructuredEditorOpen(false)}
              className="rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-sm font-medium text-[#1E293B]"
            >
              Cancel
            </button>
          </div>
          {editError ? <div className="text-sm text-[#B91C1C]">{editError}</div> : null}
        </div>
      ) : null}

      {isStructuredEditorOpen && supportsListStructuredEditor ? (
        <div className="mt-3 space-y-3 rounded-lg border border-[#BFDBFE] bg-white p-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-[#1D4ED8]">
            Edit List Details
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="text-sm text-[#1E293B]">
              <div className="mb-1 font-medium">List name</div>
              <input
                value={listNameInput}
                onChange={(event) => setListNameInput(event.target.value)}
                className="w-full rounded-lg border border-[#CBD5E1] px-3 py-2 text-sm text-[#1E293B] focus:border-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20"
              />
            </label>
            {action.action_type === 'create_lead_list' ? (
              <label className="text-sm text-[#1E293B]">
                <div className="mb-1 font-medium">Source</div>
                <input
                  value={listSourceInput}
                  onChange={(event) => setListSourceInput(event.target.value)}
                  className="w-full rounded-lg border border-[#CBD5E1] px-3 py-2 text-sm text-[#1E293B] focus:border-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20"
                />
              </label>
            ) : null}
            {action.action_type === 'create_marketing_list' ||
            action.action_type === 'rename_marketing_list' ? (
              <label className="block text-sm text-[#1E293B] md:col-span-2">
                <div className="mb-1 font-medium">Description</div>
                <textarea
                  value={listDescriptionInput}
                  onChange={(event) => setListDescriptionInput(event.target.value)}
                  className="min-h-[120px] w-full rounded-lg border border-[#CBD5E1] px-3 py-2 text-sm text-[#1E293B] focus:border-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20"
                />
              </label>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={saveListStructuredEdit}
              disabled={isEditing}
              className="rounded-lg bg-[#FF6B35] px-3 py-2 text-sm font-medium text-white disabled:bg-[#CBD5E1]"
            >
              {isEditing ? 'Saving...' : 'Save changes'}
            </button>
            <button
              type="button"
              onClick={() => setIsStructuredEditorOpen(false)}
              className="rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-sm font-medium text-[#1E293B]"
            >
              Cancel
            </button>
          </div>
          {editError ? <div className="text-sm text-[#B91C1C]">{editError}</div> : null}
        </div>
      ) : null}

      {isStructuredEditorOpen && supportsConversationStructuredEditor ? (
        <div className="mt-3 space-y-3 rounded-lg border border-[#D8B4FE] bg-white p-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-[#7C3AED]">
            Edit Conversation Action
          </div>
          <label className="block text-sm text-[#1E293B]">
            <div className="mb-1 font-medium">Snooze until</div>
            <input
              value={snoozeUntilInput}
              onChange={(event) => setSnoozeUntilInput(event.target.value)}
              className="w-full rounded-lg border border-[#CBD5E1] px-3 py-2 text-sm text-[#1E293B] focus:border-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={saveConversationStructuredEdit}
              disabled={isEditing}
              className="rounded-lg bg-[#FF6B35] px-3 py-2 text-sm font-medium text-white disabled:bg-[#CBD5E1]"
            >
              {isEditing ? 'Saving...' : 'Save changes'}
            </button>
            <button
              type="button"
              onClick={() => setIsStructuredEditorOpen(false)}
              className="rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-sm font-medium text-[#1E293B]"
            >
              Cancel
            </button>
          </div>
          {editError ? <div className="text-sm text-[#B91C1C]">{editError}</div> : null}
        </div>
      ) : null}

      {isJsonEditorOpen ? (
        <div className="mt-3 space-y-3 rounded-lg border border-[#E2E8F0] bg-white p-3">
          <textarea
            value={jsonEditValue}
            onChange={(event) => setJsonEditValue(event.target.value)}
            className="min-h-[140px] w-full rounded-lg border border-[#CBD5E1] px-3 py-2 text-sm text-[#1E293B] focus:border-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20"
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                try {
                  const nextPayload = JSON.parse(jsonEditValue) as Record<string, unknown>;
                  setEditError(null);
                  onEdit?.(action.id, nextPayload, 'Action updated from review card.');
                  setIsJsonEditorOpen(false);
                } catch {
                  setEditError('Payload must be valid JSON before it can be saved.');
                }
              }}
              disabled={isEditing}
              className="rounded-lg bg-[#FF6B35] px-3 py-2 text-sm font-medium text-white disabled:bg-[#CBD5E1]"
            >
              {isEditing ? 'Saving...' : 'Save edits'}
            </button>
            <button
              type="button"
              onClick={() => setIsJsonEditorOpen(false)}
              className="rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-sm font-medium text-[#1E293B]"
            >
              Cancel
            </button>
          </div>
          {editError ? <div className="text-sm text-[#B91C1C]">{editError}</div> : null}
        </div>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-2">
        {isPendingTargetSelection ? null : canReview ? (
          <button
            type="button"
            onClick={() => onApprove?.(action.id)}
            disabled={!onApprove || isApproving}
            className="rounded-lg bg-[#1E293B] px-3 py-2 text-sm font-medium text-white disabled:bg-[#CBD5E1]"
          >
            {isApproving ? 'Approving...' : 'Approve'}
          </button>
        ) : null}
        {canExecute && !isScopeStale ? (
          <button
            type="button"
            onClick={() => onExecute?.(action.id)}
            disabled={!onExecute || isExecuting}
            className="rounded-lg bg-[#FF6B35] px-3 py-2 text-sm font-medium text-white disabled:bg-[#CBD5E1]"
          >
            {isExecuting ? 'Executing...' : 'Execute'}
          </button>
        ) : null}
        {action.status !== 'executed' &&
        action.status !== 'rejected' &&
        !isPendingTargetSelection ? (
          <button
            type="button"
            onClick={openPrimaryEditor}
            disabled={!onEdit || isEditing}
            className="rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-sm font-medium text-[#1E293B] disabled:bg-[#F1F5F9]"
          >
            {editButtonLabel}
          </button>
        ) : null}
        {action.status !== 'executed' &&
        action.status !== 'rejected' &&
        !isPendingTargetSelection ? (
          <button
            type="button"
            onClick={() => onReject?.(action.id)}
            disabled={!onReject || isRejecting}
            className="rounded-lg border border-[#FCA5A5] bg-white px-3 py-2 text-sm font-medium text-[#B91C1C] disabled:bg-[#F1F5F9]"
          >
            {isRejecting ? 'Rejecting...' : 'Reject'}
          </button>
        ) : null}
      </div>
    </div>
  );
}
