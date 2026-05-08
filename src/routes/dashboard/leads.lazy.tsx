import { Link, createLazyFileRoute, useSearch } from '@tanstack/react-router';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';
import {
  useLeads,
  useLeadLists,
  useImportLeadsFromCSV,
  useStartImport,
  useImportJobStatus,
  useCancelImport,
  useLinkedInAccounts,
  useUpdateLeadList,
  useDeleteLeadList,
  useDeleteLeads,
  useRemoveLeadsFromList,
  usePreviewMergeLeadLists,
  useMergeLeadLists,
  useEnrichLeads,
  useEnrichmentJobWithPolling,
  useEnrichmentUsage,
} from '../../lib/hooks/queries';
import type {
  Lead,
  LeadList,
  LeadListMergePreviewResponse,
  LeadListResponse,
  LinkedInAccount,
  ImportType,
} from '../../lib/types';
import { api } from '../../lib/api';
import { getLeadMappingPreviewLabel, LEAD_MAPPING_OPTIONS } from '../../lib/leadImportMapping';
import { validateImportURL, validateProfileURLsBatch } from '../../lib/linkedinValidation';
import { showErrorToast, showSuccessToast } from '../../lib/toast';
import { useWorkspaceStore } from '../../lib/workspace';

export const Route = createLazyFileRoute('/dashboard/leads')({
  component: LeadsPage,
});

type ImportMethod =
  | 'linkedin_search'
  | 'sales_nav_leads'
  | 'sales_nav_accounts'
  | 'linkedin_recruiter'
  | 'linkedin_events'
  | 'linkedin_post_reactors'
  | 'csv'
  | 'linkedin_companies'
  | 'linkedin_people_search'
  | 'paste_urls';

type LeadCoreField =
  | 'linkedin_url'
  | 'email'
  | 'first_name'
  | 'last_name'
  | 'company'
  | 'title'
  | 'headline'
  | 'location';

type LeadMappingTarget = LeadCoreField | '__split_full_name__' | '__keep__' | '__ignore__';

type LeadMappingSuggestion = {
  target: LeadMappingTarget;
  confidence: 'high' | 'medium' | 'low';
  score: number;
  reason: string;
};

type LinkedInSearchParameterOption = {
  id: string;
  title: string;
  picture_url?: string | null;
  additional_data?: Record<string, string | number | boolean> | null;
};

type LinkedInSearchParametersLookupResponse = {
  items: LinkedInSearchParameterOption[];
  service: 'CLASSIC' | 'SALES_NAVIGATOR' | 'RECRUITER';
  parameter_type: 'LOCATION' | 'REGION';
};

const LEAD_FIELD_SYNONYMS: Record<LeadCoreField, string[]> = {
  linkedin_url: [
    'linkedin url',
    'linkedin profile',
    'profile url',
    'linkedin_profile',
    'person linkedin url',
    'li url',
  ],
  email: [
    'email',
    'email address',
    'email id',
    'business email',
    'biz email',
    'work email',
    'work mail',
    'contact email',
  ],
  first_name: ['first name', 'firstname', 'given name', 'forename', 'fname'],
  last_name: ['last name', 'lastname', 'surname', 'family name', 'lname'],
  company: ['company', 'company name', 'organization', 'employer', 'current company'],
  title: ['title', 'job title', 'role', 'position'],
  headline: ['headline', 'linkedin headline', 'profile headline'],
  location: ['location', 'person location', 'city', 'region'],
};

function normalizeLeadHeader(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function tokenizeLeadHeader(value: string): string[] {
  return normalizeLeadHeader(value)
    .split(' ')
    .map((token) => token.trim())
    .filter(Boolean);
}

function scoreLeadHeaderAgainstSynonym(header: string, synonym: string): number {
  const normalizedHeader = normalizeLeadHeader(header);
  const normalizedSynonym = normalizeLeadHeader(synonym);
  if (!normalizedHeader || !normalizedSynonym) return 0;
  if (normalizedHeader === normalizedSynonym) return 1;
  if (
    normalizedHeader.includes(normalizedSynonym) ||
    normalizedSynonym.includes(normalizedHeader)
  ) {
    return 0.92;
  }
  const headerTokens = new Set(tokenizeLeadHeader(header));
  const synonymTokens = tokenizeLeadHeader(synonym);
  const overlap = synonymTokens.filter((token) => headerTokens.has(token)).length;
  if (overlap === 0) return 0;
  const tokenScore = overlap / synonymTokens.length;
  const coverageBoost = overlap / Math.max(headerTokens.size, 1);
  return Math.min(0.88, tokenScore * 0.7 + coverageBoost * 0.18);
}

function looksLikeEmailValue(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function looksLikeLinkedInUrlValue(value: string) {
  return /linkedin\.com\/(in|pub|sales\/lead|recruiter)/i.test(value.trim());
}

function looksLikeFullNameValue(value: string) {
  const normalized = value.trim().replace(/\s+/g, ' ');
  if (!normalized || looksLikeEmailValue(normalized) || /^https?:\/\//i.test(normalized)) {
    return false;
  }
  const parts = normalized
    .split(' ')
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length < 2 || parts.length > 4) return false;
  return parts.every((part) => /^[A-Za-zÀ-ÿ'`.-]{2,}$/.test(part));
}

function looksLikeSingleNamePartValue(value: string) {
  const normalized = value.trim();
  return /^[A-Za-zÀ-ÿ'`.-]{2,}$/.test(normalized);
}

function looksLikeJobTitleValue(value: string) {
  const normalized = value.trim().toLowerCase();
  if (!normalized || normalized.length > 90) return false;
  return [
    'ceo',
    'cto',
    'cfo',
    'coo',
    'founder',
    'owner',
    'president',
    'vp',
    'vice president',
    'head',
    'director',
    'manager',
    'lead',
    'engineer',
    'developer',
    'consultant',
    'marketing',
    'sales',
    'revenue',
    'operations',
    'finance',
  ].some((keyword) => normalized.includes(keyword));
}

function looksLikeHeadlineValue(value: string) {
  const normalized = value.trim().toLowerCase();
  if (!normalized || normalized.length < 18) return false;
  return normalized.includes(' at ') || normalized.includes(' | ') || looksLikeJobTitleValue(value);
}

function looksLikeLocationValue(value: string) {
  const normalized = value.trim();
  if (!normalized || looksLikeEmailValue(normalized) || /^https?:\/\//i.test(normalized)) {
    return false;
  }
  const parts = normalized
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length >= 2 && parts.every((part) => /^[A-Za-zÀ-ÿ.' -]{2,}$/.test(part))) {
    return true;
  }
  const words = normalized.split(/\s+/).filter(Boolean);
  return words.length <= 4 && words.every((word) => /^[A-Za-zÀ-ÿ.'-]{2,}$/.test(word));
}

function looksLikeCompanyValue(value: string) {
  const normalized = value.trim().toLowerCase();
  if (!normalized || looksLikeEmailValue(normalized) || /^https?:\/\//i.test(normalized)) {
    return false;
  }
  return (
    ['inc', 'llc', 'ltd', 'limited', 'corp', 'company', 'gmbh', 'plc', 'group'].some((keyword) =>
      normalized.includes(keyword)
    ) ||
    (!looksLikeJobTitleValue(value) && normalized.split(/\s+/).length <= 6)
  );
}

function ratioOf(values: string[], predicate: (value: string) => boolean) {
  if (!values.length) return 0;
  return values.filter(predicate).length / values.length;
}

function getLeadColumnSuggestion(
  header: string,
  sampleValues: string[] = []
): LeadMappingSuggestion {
  const normalizedHeader = normalizeLeadHeader(header);
  let bestField: LeadCoreField | null = null;
  let bestScore = 0;
  let bestReason = 'Will be added to the lead context field.';
  let splitNameScore = 0;
  let splitNameReason = '';

  (Object.entries(LEAD_FIELD_SYNONYMS) as Array<[LeadCoreField, string[]]>).forEach(
    ([field, synonyms]) => {
      synonyms.forEach((synonym) => {
        const score = scoreLeadHeaderAgainstSynonym(header, synonym);
        if (score > bestScore) {
          bestScore = score;
          bestField = field;
          bestReason =
            score >= 0.92
              ? `Strong match for ${field.replace('_', ' ')}`
              : `Likely ${field.replace('_', ' ')} based on similar wording`;
        }
      });
    }
  );

  const populatedSampleValues = sampleValues
    .map((value) => value.trim())
    .filter(Boolean)
    .slice(0, 8);
  if (populatedSampleValues.length > 0) {
    const emailRatio = ratioOf(populatedSampleValues, looksLikeEmailValue);
    const linkedInRatio = ratioOf(populatedSampleValues, looksLikeLinkedInUrlValue);
    const fullNameRatio = ratioOf(populatedSampleValues, looksLikeFullNameValue);
    const singleNameRatio = ratioOf(populatedSampleValues, looksLikeSingleNamePartValue);
    const titleRatio = ratioOf(populatedSampleValues, looksLikeJobTitleValue);
    const headlineRatio = ratioOf(populatedSampleValues, looksLikeHeadlineValue);
    const locationRatio = ratioOf(populatedSampleValues, looksLikeLocationValue);
    const companyRatio = ratioOf(populatedSampleValues, looksLikeCompanyValue);

    if (emailRatio >= 0.6 && bestScore < 0.97) {
      bestField = 'email';
      bestScore = 0.97;
      bestReason = 'Sample values look like email addresses.';
    }
    if (linkedInRatio >= 0.6 && bestScore < 0.97) {
      bestField = 'linkedin_url';
      bestScore = 0.97;
      bestReason = 'Sample values look like LinkedIn profile URLs.';
    }
    if (fullNameRatio >= 0.6) {
      splitNameScore = normalizedHeader.includes('name') ? 0.98 : 0.9;
      splitNameReason = 'Sample values look like full names that can be split automatically.';
    }
    if (titleRatio >= 0.5 && bestScore < 0.86) {
      bestField = 'title';
      bestScore = 0.86;
      bestReason = 'Sample values look like job titles.';
    }
    if (headlineRatio >= 0.5 && bestScore < 0.82) {
      bestField = 'headline';
      bestScore = 0.82;
      bestReason = 'Sample values look like LinkedIn headlines.';
    }
    if (locationRatio >= 0.5 && bestScore < 0.78) {
      bestField = 'location';
      bestScore = 0.78;
      bestReason = 'Sample values look like locations.';
    }
    if (companyRatio >= 0.5 && bestScore < 0.76) {
      bestField = 'company';
      bestScore = 0.76;
      bestReason = 'Sample values look like company names.';
    }
    if (singleNameRatio >= 0.7 && normalizedHeader.includes('first') && bestScore < 0.9) {
      bestField = 'first_name';
      bestScore = 0.9;
      bestReason = 'Sample values look like first names.';
    }
    if (singleNameRatio >= 0.7 && normalizedHeader.includes('last') && bestScore < 0.9) {
      bestField = 'last_name';
      bestScore = 0.9;
      bestReason = 'Sample values look like last names.';
    }
  }

  if (normalizedHeader.includes('mail') && bestScore < 0.9) {
    bestField = 'email';
    bestScore = 0.9;
    bestReason = 'Detected email-style wording.';
  }
  if (
    normalizedHeader.includes('linkedin') &&
    normalizedHeader.includes('profile') &&
    bestScore < 0.9
  ) {
    bestField = 'linkedin_url';
    bestScore = 0.9;
    bestReason = 'Detected LinkedIn profile-style wording.';
  }

  if (splitNameScore >= bestScore && splitNameScore >= 0.75) {
    return {
      target: '__split_full_name__',
      confidence: splitNameScore >= 0.92 ? 'high' : splitNameScore >= 0.75 ? 'medium' : 'low',
      score: splitNameScore,
      reason: splitNameReason,
    };
  }

  if (!bestField || bestScore < 0.45) {
    return {
      target: '__keep__',
      confidence: 'low',
      score: bestScore,
      reason: 'No strong core-field match found, so this column will be kept as-is.',
    };
  }

  return {
    target: bestField,
    confidence: bestScore >= 0.9 ? 'high' : bestScore >= 0.7 ? 'medium' : 'low',
    score: bestScore,
    reason: bestReason,
  };
}

function autoMapLeadColumns(headers: string[], rows: string[][]) {
  const suggestions = Object.fromEntries(
    headers.map((header, index) => {
      const sampleValues = rows.map((row) => row[index] || '');
      return [header, getLeadColumnSuggestion(header, sampleValues)];
    })
  ) as Record<string, LeadMappingSuggestion>;

  const assigned = new Set<LeadMappingTarget>();
  const headersByStrength = [...headers].sort(
    (left, right) => suggestions[right].score - suggestions[left].score
  );

  headersByStrength.forEach((header) => {
    const suggestion = suggestions[header];
    const target = suggestion.target;
    if (target === '__keep__' || target === '__ignore__') return;
    if (
      target === '__split_full_name__' &&
      (assigned.has('first_name') || assigned.has('last_name'))
    ) {
      suggestions[header] = {
        target: '__keep__',
        confidence: 'low',
        score: suggestion.score,
        reason: 'Separate first and last name columns matched more strongly.',
      };
      return;
    }
    if (assigned.has(target)) {
      suggestions[header] = {
        target: '__keep__',
        confidence: 'low',
        score: suggestion.score,
        reason: `Another column matched ${String(target).replace(/_/g, ' ')} more strongly.`,
      };
      return;
    }
    assigned.add(target);
  });

  return suggestions;
}

function splitFullName(value: string) {
  const normalized = value.trim().replace(/\s+/g, ' ');
  if (!normalized) return { firstName: '', lastName: '' };
  if (normalized.includes(',')) {
    const [lastName, firstName] = normalized.split(',').map((part) => part.trim());
    return { firstName: firstName || '', lastName: lastName || '' };
  }
  const parts = normalized.split(' ');
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: '' };
  }
  return {
    firstName: parts.slice(0, -1).join(' '),
    lastName: parts.slice(-1).join(' '),
  };
}

function detectLeadDelimiter(text: string): ',' | ';' | '\t' {
  const firstLine = text.split(/\r?\n/).find((line) => line.trim()) || '';
  const candidates: Array<',' | ';' | '\t'> = [',', ';', '\t'];
  return candidates.reduce((best, candidate) => {
    const bestCount = firstLine.split(best).length;
    const candidateCount = firstLine.split(candidate).length;
    return candidateCount > bestCount ? candidate : best;
  }, ',');
}

function parseLeadDelimitedLine(line: string, delimiter: string): string[] {
  const cells: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];
    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (char === delimiter && !inQuotes) {
      cells.push(current.trim());
      current = '';
      continue;
    }
    current += char;
  }
  cells.push(current.trim());
  return cells;
}

function escapeLeadCsvCell(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

const IMPORT_METHODS: {
  id: ImportMethod;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  category: 'linkedin' | 'import';
  comingSoon?: boolean;
  enabled?: boolean;
}[] = [
  {
    id: 'linkedin_people_search',
    title: 'People Search',
    description: 'Search for people directly from the app using keywords and filters',
    icon: <PeopleSearchIcon />,
    color: '#0A66C2',
    category: 'linkedin',
    enabled: true,
  },
  {
    id: 'linkedin_search',
    title: 'LinkedIn Search URL',
    description: 'Import leads by pasting a LinkedIn search URL from your browser',
    icon: <LinkedInSearchIcon />,
    color: '#0A66C2',
    category: 'linkedin',
    enabled: true,
  },
  {
    id: 'sales_nav_leads',
    title: 'Sales Navigator (Leads)',
    description: 'Export leads from your Sales Navigator saved searches',
    icon: <SalesNavIcon />,
    color: '#0A66C2',
    category: 'linkedin',
    enabled: true,
  },
  {
    id: 'sales_nav_accounts',
    title: 'Sales Navigator (Accounts)',
    description: 'Export accounts/companies from Sales Navigator',
    icon: <SalesNavAccountsIcon />,
    color: '#0A66C2',
    category: 'linkedin',
    enabled: true,
  },
  {
    id: 'linkedin_recruiter',
    title: 'LinkedIn Recruiter',
    description: 'Import candidates from LinkedIn Recruiter searches',
    icon: <RecruiterIcon />,
    color: '#0A66C2',
    category: 'linkedin',
    enabled: true,
  },
  {
    id: 'linkedin_events',
    title: 'LinkedIn Events',
    description: 'Import attendees from LinkedIn event pages',
    icon: <EventIcon />,
    color: '#0A66C2',
    category: 'linkedin',
    enabled: false,
    comingSoon: true,
  },
  {
    id: 'linkedin_post_reactors',
    title: 'LinkedIn Post Reactors',
    description: 'Import people who reacted to specific LinkedIn posts',
    icon: <ReactorsIcon />,
    color: '#0A66C2',
    category: 'linkedin',
    enabled: true,
  },
  {
    id: 'linkedin_companies',
    title: 'LinkedIn Companies',
    description: 'Search and import employees from company pages',
    icon: <CompaniesIcon />,
    color: '#0A66C2',
    category: 'linkedin',
    enabled: true,
  },
  {
    id: 'csv',
    title: 'Import from CSV',
    description: 'Upload a CSV file with LinkedIn URLs or contact info',
    icon: <CSVIcon />,
    color: '#22C55E',
    category: 'import',
    enabled: true,
  },
  {
    id: 'paste_urls',
    title: 'Paste LinkedIn URLs',
    description: 'Paste LinkedIn profile URLs directly',
    icon: <PasteIcon />,
    color: '#8B5CF6',
    category: 'import',
    enabled: true,
  },
];

const LEADS_PER_PAGE = 50;

type EmailFilter =
  | 'all'
  | 'has_email'
  | 'missing_email'
  | 'needs_enrichment'
  | 'pending'
  | 'no_email_found'
  | 'failed';
type CampaignFilter = 'all' | 'in_campaign' | 'not_in_campaign';
type StatusFilter =
  | 'all'
  | 'new'
  | 'contacted'
  | 'accepted'
  | 'replied'
  | 'qualified'
  | 'not_interested';

type EnrichmentFailureInfo = { label: string; sublabel: string };

function getUserFacingEnrichmentFailure(error: string | null | undefined): EnrichmentFailureInfo {
  const message = (error || '').trim();
  if (message.includes('monthly limit')) {
    return { label: 'Limit reached', sublabel: 'Monthly enrichment limit hit' };
  }
  if (
    message.startsWith('API error:') ||
    message.includes('Server disconnected') ||
    message.includes('Cloudflare') ||
    message.includes('Access denied')
  ) {
    return { label: 'Needs retry', sublabel: 'Service error — retry later' };
  }
  if (
    message.includes('No email found') ||
    message.includes('No valid company') ||
    message.includes('No company') ||
    message.includes('No name available')
  ) {
    return { label: 'No email found', sublabel: 'Could not find an email for this lead' };
  }
  return { label: 'Needs retry', sublabel: 'Enrichment failed — retry later' };
}

function LeadsPage() {
  const routeSearch = useSearch({ from: '/dashboard/leads' });
  const currentWorkspaceId = useWorkspaceStore((s) => s.currentWorkspaceId);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  // Lead list search (for overview page)
  const [listSearchQuery, setListSearchQuery] = useState('');
  // Lead search and filters (for detail page)
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [emailFilter, setEmailFilter] = useState<EmailFilter>('all');
  const [campaignFilter, setCampaignFilter] = useState<CampaignFilter>('all');
  const [importedOnly, setImportedOnly] = useState(false);
  const [discoveryOnly, setDiscoveryOnly] = useState(false);
  const [editingList, setEditingList] = useState<LeadList | null>(null);
  const [deletingList, setDeletingList] = useState<LeadList | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setSelectedListId(routeSearch.listId ?? null);
    setSearchQuery(routeSearch.search ?? '');
    setDebouncedSearch(routeSearch.search ?? '');
    setStatusFilter((routeSearch.status as StatusFilter | undefined) ?? 'all');
    setEmailFilter(
      routeSearch.email === 'no_email' ? 'missing_email' : (routeSearch.email ?? 'all')
    );
    setCampaignFilter(routeSearch.campaign ?? 'all');
    setImportedOnly(Boolean(routeSearch.importedOnly));
    setDiscoveryOnly(Boolean(routeSearch.discoveryOnly));
    setCurrentPage(1);
    setListSearchQuery('');
  }, [
    routeSearch.campaign,
    routeSearch.discoveryOnly,
    routeSearch.email,
    routeSearch.importedOnly,
    routeSearch.listId,
    routeSearch.search,
    routeSearch.status,
  ]);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1); // Reset to first page on search
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch lead lists from API
  const {
    data: listsResponse,
    isLoading: listsLoading,
    error: listsError,
    refetch: refetchLists,
  } = useLeadLists();
  const allLists = listsResponse?.lists || [];

  // Filter lists by search query (client-side)
  const lists = listSearchQuery
    ? allLists.filter((list) => list.name.toLowerCase().includes(listSearchQuery.toLowerCase()))
    : allLists;

  const isLeadResultsView =
    Boolean(selectedListId) ||
    Boolean(debouncedSearch) ||
    statusFilter !== 'all' ||
    emailFilter !== 'all' ||
    campaignFilter !== 'all' ||
    importedOnly ||
    discoveryOnly;

  // Build filters for useLeads
  const leadFilters = isLeadResultsView
    ? {
        workspace_id: currentWorkspaceId || undefined,
        list_id: selectedListId || undefined,
        search: debouncedSearch || undefined,
        status:
          statusFilter !== 'all'
            ? (statusFilter as
                | 'new'
                | 'contacted'
                | 'accepted'
                | 'replied'
                | 'qualified'
                | 'not_interested')
            : undefined,
        has_email:
          emailFilter === 'has_email' ? true : emailFilter === 'missing_email' ? false : undefined,
        enrichment_status:
          emailFilter === 'needs_enrichment'
            ? ('not_enriched' as const)
            : emailFilter === 'pending'
              ? ('pending' as const)
              : emailFilter === 'no_email_found'
                ? ('no_email_found' as const)
                : emailFilter === 'failed'
                  ? ('failed' as const)
                  : undefined,
        in_campaign: campaignFilter === 'all' ? undefined : campaignFilter === 'in_campaign',
        imported_only: importedOnly || undefined,
        discovery_only: discoveryOnly || undefined,
        sort_by: selectedListId ? ('email_actionability' as const) : undefined,
        limit: LEADS_PER_PAGE,
        offset: (currentPage - 1) * LEADS_PER_PAGE,
      }
    : undefined;

  // Fetch leads filtered by selected list with pagination
  const { data: leadsResponse, isLoading: leadsLoading } = useLeads(leadFilters);
  const leads = leadsResponse?.leads || [];
  const totalLeads = leadsResponse?.total || 0;
  const totalPages = Math.ceil(totalLeads / LEADS_PER_PAGE);

  const clearLeadResultsView = () => {
    setSelectedListId(null);
    setCurrentPage(1);
    setDebouncedSearch('');
    setSearchQuery('');
    setStatusFilter('all');
    setEmailFilter('all');
    setCampaignFilter('all');
    setImportedOnly(false);
    setDiscoveryOnly(false);
  };

  const openLeadList = (id: string) => {
    setSelectedListId(id);
    setCurrentPage(1);
    setDebouncedSearch('');
    setSearchQuery('');
    setStatusFilter('all');
    setEmailFilter('all');
    setCampaignFilter('all');
    setImportedOnly(false);
    setDiscoveryOnly(false);
  };

  const isLoading = listsLoading;
  const error = listsError;
  const refetch = refetchLists;

  // Get the selected list object
  const selectedList = selectedListId ? lists.find((l) => l.id === selectedListId) : null;

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <LoadingSpinner />
          <p className="text-[#64748B]">Loading leads...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#FEF2F2]">
            <AlertIcon className="h-8 w-8 text-[#EF4444]" />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-[#1E293B]">Failed to load leads</h3>
          <p className="mb-4 text-[#64748B]">{error.message}</p>
          <button
            onClick={() => refetch()}
            className="rounded-lg bg-[#FF6B35] px-4 py-2 font-medium text-white transition-colors hover:bg-[#E85A2A]"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-bold text-[#1E293B] md:text-2xl">Leads</h1>
          <p className="mt-1 text-sm text-[#64748B] md:text-base">
            Import and organize your prospects
          </p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <button
            onClick={() => setShowImportModal(true)}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#FF6B35] px-4 py-2.5 font-medium text-white shadow-[0_2px_8px_rgba(255,107,53,0.25)] transition-colors hover:bg-[#E85A2A] sm:w-auto"
          >
            <PlusIcon />
            Add Leads
          </button>
          {allLists.length > 1 ? (
            <button
              onClick={() => setShowMergeModal(true)}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#E2E8F0] bg-white px-4 py-2.5 font-medium text-[#1E293B] transition-colors hover:bg-[#F8FAFC] sm:w-auto"
            >
              <MergeIcon />
              Merge Lists
            </button>
          ) : null}
        </div>
      </div>
      {/* Search and Filters */}
      {isLeadResultsView ? (
        // Filters for lead detail view
        <div className="flex flex-col items-stretch gap-3 md:flex-row md:items-center md:gap-4">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, company, or email..."
              className="w-full rounded-lg border border-[#E2E8F0] bg-white py-2.5 pl-10 pr-4 transition-all focus:border-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto md:gap-3">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as StatusFilter);
                setCurrentPage(1);
              }}
              className="min-w-[120px] rounded-lg border border-[#E2E8F0] bg-white px-3 py-2.5 text-sm focus:border-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20"
            >
              <option value="all">All Status</option>
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="accepted">Accepted</option>
              <option value="replied">Replied</option>
              <option value="qualified">Qualified</option>
              <option value="not_interested">Not Interested</option>
            </select>
            <select
              value={emailFilter}
              onChange={(e) => {
                setEmailFilter(e.target.value as EmailFilter);
                setCurrentPage(1);
              }}
              className="min-w-[110px] rounded-lg border border-[#E2E8F0] bg-white px-3 py-2.5 text-sm focus:border-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20"
            >
              <option value="all">All Emails</option>
              <option value="has_email">Found Email</option>
              <option value="needs_enrichment">Needs Enrichment</option>
              <option value="pending">Enrichment Pending</option>
              <option value="no_email_found">No Email Found</option>
              <option value="failed">Enrichment Failed</option>
              <option value="missing_email">Missing Email</option>
            </select>
            <select
              value={campaignFilter}
              onChange={(e) => {
                setCampaignFilter(e.target.value as CampaignFilter);
                setCurrentPage(1);
              }}
              className="min-w-[130px] rounded-lg border border-[#E2E8F0] bg-white px-3 py-2.5 text-sm focus:border-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20"
            >
              <option value="all">All Campaigns</option>
              <option value="in_campaign">In Campaign</option>
              <option value="not_in_campaign">Not in Campaign</option>
            </select>
            <button
              onClick={() => {
                setDiscoveryOnly((current) => !current);
                setCurrentPage(1);
              }}
              className={`min-w-[110px] rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
                discoveryOnly
                  ? 'border-[#BFDBFE] bg-[#EFF6FF] text-[#1D4ED8]'
                  : 'border-[#E2E8F0] bg-white text-[#64748B] hover:bg-[#F8FAFC]'
              }`}
            >
              Discovery
            </button>
            {importedOnly ? (
              <div className="inline-flex items-center rounded-lg border border-[#BFDBFE] bg-[#EFF6FF] px-3 py-2.5 text-sm font-medium text-[#1D4ED8]">
                Imported Only
              </div>
            ) : null}
          </div>
        </div>
      ) : allLists.length > 0 ? (
        // Search for lists overview
        <div className="flex flex-col items-stretch gap-3 md:flex-row md:items-center md:gap-4">
          <div className="relative max-w-md flex-1">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
            <input
              type="text"
              value={listSearchQuery}
              onChange={(e) => setListSearchQuery(e.target.value)}
              placeholder="Search lists..."
              className="w-full rounded-lg border border-[#E2E8F0] bg-white py-2.5 pl-10 pr-4 transition-all focus:border-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20"
            />
          </div>
          <div className="text-sm text-[#64748B]">
            {lists.length} {lists.length === 1 ? 'list' : 'lists'}
            {listSearchQuery &&
              lists.length !== allLists.length &&
              ` (filtered from ${allLists.length})`}
          </div>
        </div>
      ) : null}
      {/* Content */}
      {allLists.length === 0 && !isLeadResultsView ? (
        <EmptyState onImport={() => setShowImportModal(true)} />
      ) : isLeadResultsView ? (
        <LeadListDetail
          list={selectedList ?? null}
          leads={leads}
          isLoading={leadsLoading}
          onBack={clearLeadResultsView}
          onLeadsDeleted={() => refetchLists()}
          totalLeads={totalLeads}
          totalPages={totalPages}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          filterMeta={{
            search: debouncedSearch || undefined,
            status: statusFilter !== 'all' ? statusFilter : undefined,
            hasEmail:
              emailFilter === 'has_email'
                ? true
                : emailFilter === 'missing_email'
                  ? false
                  : undefined,
            enrichmentStatus:
              emailFilter === 'needs_enrichment'
                ? ('not_enriched' as const)
                : emailFilter === 'pending'
                  ? ('pending' as const)
                  : emailFilter === 'no_email_found'
                    ? ('no_email_found' as const)
                    : emailFilter === 'failed'
                      ? ('failed' as const)
                      : undefined,
            inCampaign: campaignFilter === 'all' ? undefined : campaignFilter === 'in_campaign',
            importedOnly,
            discoveryOnly,
          }}
        />
      ) : lists.length === 0 && listSearchQuery ? (
        // No lists match search
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-12 text-center">
          <div className="mx-auto max-w-md">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#F1F5F9]">
              <SearchIcon className="h-8 w-8 text-[#94A3B8]" />
            </div>
            <h2 className="mb-2 text-xl font-bold text-[#1E293B]">No lists found</h2>
            <p className="mb-4 text-[#64748B]">
              No lists match "{listSearchQuery}". Try a different search term.
            </p>
            <button
              onClick={() => setListSearchQuery('')}
              className="font-medium text-[#FF6B35] hover:underline"
            >
              Clear search
            </button>
          </div>
        </div>
      ) : (
        <LeadListsGrid
          lists={lists}
          onSelectList={openLeadList}
          onEditList={setEditingList}
          onDeleteList={setDeletingList}
          canMerge={allLists.length > 1}
          onMergeList={(list) => {
            setSelectedListId(list.id);
            setShowMergeModal(true);
          }}
        />
      )}
      {/* Edit List Modal */}
      {editingList && <EditListModal list={editingList} onClose={() => setEditingList(null)} />}
      {/* Delete Confirmation Modal */}
      {deletingList && (
        <DeleteListModal
          list={deletingList}
          onClose={() => setDeletingList(null)}
          onDeleted={() => {
            setDeletingList(null);
            if (selectedListId === deletingList.id) {
              clearLeadResultsView();
            }
          }}
        />
      )}
      {/* Import Modal */}
      <AnimatePresence>
        {showImportModal && (
          <ImportLeadsModal
            availableLists={allLists}
            onClose={() => setShowImportModal(false)}
            onSuccess={(listId) => {
              refetchLists();
              setShowImportModal(false);
              if (listId) {
                openLeadList(listId);
              }
            }}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showMergeModal && (
          <MergeLeadListsModal
            lists={allLists}
            initialTargetListId={selectedListId}
            onClose={() => setShowMergeModal(false)}
            onMerged={(targetListId) => {
              refetchLists();
              setShowMergeModal(false);
              openLeadList(targetListId);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function EmptyState({ onImport }: { onImport: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-[#E2E8F0] bg-white p-8 md:p-12"
    >
      <div className="mx-auto max-w-lg text-center">
        {/* Illustration */}
        <div className="relative mx-auto mb-8 h-40 w-40">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#FFF7ED] to-[#FFEDD5]" />
          <div className="absolute inset-6 rounded-full bg-white shadow-inner" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[#E2E8F0] bg-white shadow-lg">
              <ListIcon className="h-8 w-8 text-[#FF6B35]" />
            </div>
          </div>
          <motion.div
            animate={{ y: [0, 5, 0] }}
            transition={{ duration: 2.5, repeat: Infinity }}
            className="absolute -right-2 top-4 flex h-8 w-8 items-center justify-center rounded-lg bg-[#0A66C2] shadow-lg"
          >
            <LinkedInSmallIcon className="h-4 w-4 text-white" />
          </motion.div>
        </div>

        <h2 className="mb-3 text-2xl font-bold text-[#1E293B]">No lead lists yet</h2>
        <p className="mb-8 text-lg text-[#64748B]">
          Import prospects from LinkedIn, Sales Navigator, CSV, or paste URLs directly.
        </p>

        <button
          onClick={onImport}
          className="inline-flex items-center gap-2 rounded-xl bg-[#FF6B35] px-8 py-4 font-semibold text-white shadow-[0_4px_14px_rgba(255,107,53,0.35)] transition-all hover:-translate-y-0.5 hover:bg-[#E85A2A] hover:shadow-[0_6px_20px_rgba(255,107,53,0.4)]"
        >
          <PlusIcon className="h-5 w-5" />
          Import Your First Leads
        </button>

        {/* Import options preview */}
        <div className="mt-10 grid grid-cols-3 gap-3">
          {[
            {
              icon: <LinkedInSmallIcon className="h-4 w-4 text-[#0A66C2]" />,
              label: 'LinkedIn',
              bg: '#EFF6FF',
            },
            {
              icon: <SalesNavIcon className="h-4 w-4 text-[#0A66C2]" />,
              label: 'Sales Nav',
              bg: '#EFF6FF',
            },
            {
              icon: <CSVIcon className="h-4 w-4 text-[#22C55E]" />,
              label: 'CSV Upload',
              bg: '#F0FDF4',
            },
          ].map((item, i) => (
            <div key={i} className="rounded-lg p-3" style={{ backgroundColor: item.bg }}>
              <div className="mb-2 flex justify-center">{item.icon}</div>
              <p className="text-xs font-medium text-[#1E293B]">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function LeadListsGrid({
  lists,
  onSelectList,
  onEditList,
  onDeleteList,
  canMerge,
  onMergeList,
}: {
  lists: LeadList[];
  onSelectList: (id: string) => void;
  onEditList: (list: LeadList) => void;
  onDeleteList: (list: LeadList) => void;
  canMerge: boolean;
  onMergeList: (list: LeadList) => void;
}) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatDate = (dateStr: string) => {
    // Ensure UTC parsing by adding Z suffix if not present
    const normalizedDateStr = dateStr.endsWith('Z') ? dateStr : dateStr + 'Z';
    const date = new Date(normalizedDateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {lists.map((list, index) => (
        <motion.div
          key={list.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className="group relative rounded-xl border border-[#E2E8F0] bg-white p-5 text-left transition-all hover:border-[#FF6B35]/30 hover:shadow-md"
        >
          <div className="mb-4 flex items-start justify-between">
            <button
              onClick={() => onSelectList(list.id)}
              className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#FFF7ED]"
            >
              <ListIcon className="h-5 w-5 text-[#FF6B35]" />
            </button>
            <div className="relative" ref={openMenuId === list.id ? menuRef : undefined}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenMenuId(openMenuId === list.id ? null : list.id);
                }}
                className="rounded-lg p-1.5 opacity-0 transition-colors hover:bg-[#F1F5F9] group-hover:opacity-100"
              >
                <MoreIcon className="h-4 w-4 text-[#64748B]" />
              </button>
              {openMenuId === list.id && (
                <div className="absolute right-0 top-8 z-10 w-36 rounded-lg border border-[#E2E8F0] bg-white py-1 shadow-lg">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuId(null);
                      onEditList(list);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[#1E293B] hover:bg-[#F8FAFC]"
                  >
                    <EditIcon className="h-4 w-4 text-[#64748B]" />
                    Rename
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuId(null);
                      onDeleteList(list);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[#EF4444] hover:bg-[#FEF2F2]"
                  >
                    <TrashIcon className="h-4 w-4" />
                    Delete
                  </button>
                  {canMerge ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId(null);
                        onMergeList(list);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[#1E293B] hover:bg-[#F8FAFC]"
                    >
                      <MergeIcon className="h-4 w-4 text-[#64748B]" />
                      Merge
                    </button>
                  ) : null}
                </div>
              )}
            </div>
          </div>
          <button onClick={() => onSelectList(list.id)} className="w-full text-left">
            <h3 className="mb-1 font-semibold text-[#1E293B] transition-colors group-hover:text-[#FF6B35]">
              {list.name}
            </h3>
            <div className="flex items-center gap-4 text-sm text-[#64748B]">
              <span>{list.lead_count} leads</span>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {list.source && (
                  <span className="rounded bg-[#F8FAFC] px-2 py-0.5 text-xs text-[#94A3B8]">
                    {list.source}
                  </span>
                )}
                {list.source === 'discovery' ? (
                  <span className="rounded bg-[#F0FDF4] px-2 py-0.5 text-xs font-medium text-[#15803D]">
                    Discovery
                  </span>
                ) : null}
              </div>
              <span className="text-xs text-[#94A3B8]">{formatDate(list.created_at)}</span>
            </div>
          </button>
        </motion.div>
      ))}
    </div>
  );
}

function LeadListDetail({
  list,
  leads,
  isLoading,
  onBack,
  onLeadsDeleted,
  totalLeads,
  totalPages,
  currentPage,
  onPageChange,
  filterMeta,
}: {
  list: LeadList | null;
  leads: Lead[];
  isLoading: boolean;
  onBack: () => void;
  onLeadsDeleted?: () => void;
  totalLeads: number;
  totalPages: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  filterMeta?: {
    search?: string;
    status?: StatusFilter;
    hasEmail?: boolean;
    enrichmentStatus?: 'not_enriched' | 'pending' | 'no_email_found' | 'failed';
    inCampaign?: boolean;
    importedOnly?: boolean;
    discoveryOnly?: boolean;
  };
}) {
  const currentWorkspaceId = useWorkspaceStore((s) => s.currentWorkspaceId);
  const workspaceId = list?.workspace_id || currentWorkspaceId || undefined;
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [activeEnrichmentJobId, setActiveEnrichmentJobId] = useState<string | null>(null);
  const deleteLeadsMutation = useDeleteLeads();
  const removeFromListMutation = useRemoveLeadsFromList();
  const enrichLeadsMutation = useEnrichLeads();
  const { data: enrichmentUsage } = useEnrichmentUsage(workspaceId);
  const { data: enrichmentJob } = useEnrichmentJobWithPolling(activeEnrichmentJobId);

  useEffect(() => {
    if (!enrichmentJob || !activeEnrichmentJobId) return;
    if (enrichmentJob.status === 'completed') {
      showSuccessToast(
        'Email enrichment finished',
        `${enrichmentJob.enriched_count} emails found, ${enrichmentJob.no_email_count} not found`
      );
      setActiveEnrichmentJobId(null);
    } else if (enrichmentJob.status === 'failed') {
      showErrorToast('Email enrichment failed', 'The enrichment job did not complete.');
      setActiveEnrichmentJobId(null);
    }
  }, [activeEnrichmentJobId, enrichmentJob]);

  const buildLeadQueryParams = (limit: number, offset: number) => {
    const params = new URLSearchParams();
    if (workspaceId) params.append('workspace_id', workspaceId);
    if (list?.id) params.append('list_id', list.id);
    if (filterMeta?.search) params.append('search', filterMeta.search);
    if (filterMeta?.status) params.append('status', filterMeta.status);
    if (filterMeta?.hasEmail !== undefined)
      params.append('has_email', filterMeta.hasEmail.toString());
    if (filterMeta?.enrichmentStatus)
      params.append('enrichment_status', filterMeta.enrichmentStatus);
    if (filterMeta?.inCampaign !== undefined)
      params.append('in_campaign', filterMeta.inCampaign.toString());
    if (filterMeta?.importedOnly !== undefined && filterMeta.importedOnly)
      params.append('imported_only', 'true');
    if (filterMeta?.discoveryOnly !== undefined && filterMeta.discoveryOnly)
      params.append('discovery_only', 'true');
    if (list?.id) params.append('sort_by', 'email_actionability');
    params.append('limit', limit.toString());
    params.append('offset', offset.toString());
    return params;
  };

  const fetchAllMatchingLeads = async () => {
    const allLeads: Lead[] = [];
    const batchSize = 500;
    let offset = 0;

    while (offset < totalLeads) {
      const params = buildLeadQueryParams(batchSize, offset);
      const response = await api.get<LeadListResponse>(`/leads?${params}`);
      allLeads.push(...response.data.leads);
      offset += batchSize;
    }

    return allLeads;
  };

  const handleDeleteSelected = async () => {
    try {
      await deleteLeadsMutation.mutateAsync(selectedLeads);
      setSelectedLeads([]);
      setShowDeleteModal(false);
      onLeadsDeleted?.();
    } catch {
      // Error is handled by mutation
    }
  };

  const handleRemoveSelectedFromList = async () => {
    try {
      await removeFromListMutation.mutateAsync(selectedLeads);
      setSelectedLeads([]);
      onLeadsDeleted?.();
      showSuccessToast('Removed from list', 'Selected leads were removed from this list.');
    } catch (error) {
      showErrorToast('Unable to remove leads', error instanceof Error ? error.message : undefined);
    }
  };

  const handleExcludeNoEmailFound = async () => {
    try {
      const allMatchingLeads = await fetchAllMatchingLeads();
      const noEmailLeadIds = allMatchingLeads
        .filter((lead) => lead.enrichment_status === 'no_email_found')
        .map((lead) => lead.id);
      if (noEmailLeadIds.length === 0) {
        showSuccessToast('Nothing to exclude', 'There are no no-email leads in this view.');
        return;
      }
      await removeFromListMutation.mutateAsync(noEmailLeadIds);
      onLeadsDeleted?.();
      showSuccessToast(
        'Excluded no-email leads',
        `${noEmailLeadIds.length} leads were removed from this list.`
      );
    } catch (error) {
      showErrorToast(
        'Unable to exclude no-email leads',
        error instanceof Error ? error.message : undefined
      );
    }
  };

  const handleEnrichSelected = async () => {
    if (!workspaceId || selectedLeads.length === 0) return;
    try {
      const result = await enrichLeadsMutation.mutateAsync({
        lead_ids: selectedLeads,
        workspace_id: workspaceId,
        list_id: list?.id || undefined,
      });
      setActiveEnrichmentJobId(result.job_id);
      setSelectedLeads([]);
      showSuccessToast(
        'Email enrichment started',
        `${result.lead_count} leads queued. ${result.usage.credits_remaining} credits remaining this month.`
      );
    } catch (error) {
      showErrorToast(
        'Unable to start enrichment',
        error instanceof Error ? error.message : undefined
      );
    }
  };

  const handleEnrichCurrentView = async () => {
    if (!workspaceId) return;
    try {
      const allMatchingLeads = await fetchAllMatchingLeads();
      const candidateLeadIds = allMatchingLeads
        .filter((lead) => !lead.email && lead.enrichment_status !== 'pending')
        .map((lead) => lead.id);
      if (candidateLeadIds.length === 0) {
        showSuccessToast('Nothing to enrich', 'All leads in this view already have email results.');
        return;
      }
      const result = await enrichLeadsMutation.mutateAsync({
        lead_ids: candidateLeadIds,
        workspace_id: workspaceId,
        list_id: list?.id || undefined,
      });
      setActiveEnrichmentJobId(result.job_id);
      showSuccessToast(
        'Email enrichment started',
        `${result.lead_count} leads queued. ${result.usage.credits_remaining} credits remaining this month.`
      );
    } catch (error) {
      showErrorToast(
        'Unable to start enrichment',
        error instanceof Error ? error.message : undefined
      );
    }
  };

  const [isExporting, setIsExporting] = useState(false);

  const handleExportCSV = async () => {
    if (totalLeads === 0) return;
    setIsExporting(true);

    try {
      const allLeads = await fetchAllMatchingLeads();

      // Define CSV headers
      const headers = [
        'First Name',
        'Last Name',
        'Email',
        'LinkedIn URL',
        'Company',
        'Title',
        'Headline',
        'Location',
        'Avatar URL',
        'Status',
        'Tags',
        'Created At',
      ];

      // Convert leads to CSV rows
      const rows = allLeads.map((lead) => [
        lead.first_name || '',
        lead.last_name || '',
        lead.email || '',
        lead.linkedin_url || '',
        lead.company || '',
        lead.title || '',
        lead.headline || '',
        lead.location || '',
        lead.avatar_url || '',
        lead.status || '',
        (lead.tags || []).join('; '),
        lead.created_at ? new Date(lead.created_at).toLocaleDateString() : '',
      ]);

      // Escape CSV values (handle commas, quotes, newlines)
      const escapeCSV = (value: string) => {
        if (value.includes(',') || value.includes('"') || value.includes('\n')) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      };

      // Build CSV content
      const csvContent = [
        headers.map(escapeCSV).join(','),
        ...rows.map((row) => row.map(escapeCSV).join(',')),
      ].join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${(list?.name || 'filtered_leads').replace(/[^a-z0-9]/gi, '_')}_leads.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <DeleteLeadsModal
          count={selectedLeads.length}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDeleteSelected}
          isDeleting={deleteLeadsMutation.isPending}
        />
      )}
      <div className="space-y-4">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm">
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-[#64748B] transition-colors hover:text-[#1E293B]"
          >
            <BackIcon className="h-4 w-4" />
            {list ? 'All Lists' : 'All Leads'}
          </button>
          <ChevronRightIcon className="h-4 w-4 text-[#94A3B8]" />
          <span className="font-medium text-[#1E293B]">{list?.name || 'Filtered Leads'}</span>
        </div>

        {/* List Header */}
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-6">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#FFF7ED]">
                <ListIcon className="h-6 w-6 text-[#FF6B35]" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#1E293B]">
                  {list?.name || 'Filtered Leads'}
                </h2>
                <div className="mt-1 flex items-center gap-4 text-sm text-[#64748B]">
                  <span>{list ? `${list.lead_count} leads` : `${totalLeads} matching leads`}</span>
                </div>
                {enrichmentUsage ? (
                  <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-[#F8FAFC] px-3 py-1 text-xs text-[#64748B]">
                    <span>
                      {enrichmentUsage.credits_used} / {enrichmentUsage.monthly_limit} enrichments
                      used this month
                    </span>
                    <span className="text-[#94A3B8]">•</span>
                    <span>{enrichmentUsage.credits_remaining} remaining</span>
                  </div>
                ) : null}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {list ? (
                <button
                  onClick={handleEnrichCurrentView}
                  disabled={
                    totalLeads === 0 ||
                    enrichLeadsMutation.isPending ||
                    !workspaceId ||
                    enrichmentUsage?.credits_remaining === 0
                  }
                  className="flex items-center gap-2 rounded-lg border border-[#E2E8F0] px-4 py-2 text-sm font-medium text-[#1E293B] transition-colors hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {enrichLeadsMutation.isPending ? (
                    <LoadingSpinner className="h-4 w-4" />
                  ) : (
                    <SparkleIcon className="h-4 w-4" />
                  )}
                  Enrich Emails
                </button>
              ) : null}
              {list ? (
                <button
                  onClick={handleExcludeNoEmailFound}
                  disabled={removeFromListMutation.isPending || totalLeads === 0}
                  className="flex items-center gap-2 rounded-lg border border-[#E2E8F0] px-4 py-2 text-sm font-medium text-[#64748B] transition-colors hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <TrashIcon className="h-4 w-4" />
                  Exclude No-Email Leads
                </button>
              ) : null}
              <button
                onClick={handleExportCSV}
                disabled={totalLeads === 0 || isExporting}
                className="flex items-center gap-2 rounded-lg border border-[#E2E8F0] px-4 py-2 text-sm font-medium text-[#64748B] transition-colors hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isExporting ? (
                  <LoadingSpinner className="h-4 w-4" />
                ) : (
                  <ExportIcon className="h-4 w-4" />
                )}
                {isExporting ? 'Exporting...' : 'Export'}
              </button>
              {list ? (
                <Link
                  to="/dashboard/campaigns"
                  search={{ createWithList: list.id }}
                  className="flex items-center gap-2 rounded-lg bg-[#FF6B35] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#E85A2A]"
                >
                  <CampaignIcon className="h-4 w-4" />
                  Add to Campaign
                </Link>
              ) : null}
            </div>
          </div>
          {enrichmentJob && activeEnrichmentJobId ? (
            <div className="mt-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-[#1E293B]">Email enrichment running</p>
                  <p className="text-xs text-[#64748B]">
                    {enrichmentJob.enriched_count} found, {enrichmentJob.no_email_count} not found,
                    {enrichmentJob.failed_count} failed
                  </p>
                </div>
                <div className="min-w-[180px]">
                  <div className="mb-2 h-2 overflow-hidden rounded-full bg-[#E2E8F0]">
                    <div
                      className="h-full rounded-full bg-[#FF6B35] transition-all"
                      style={{ width: `${Math.max(enrichmentJob.progress, 4)}%` }}
                    />
                  </div>
                  <div className="text-right text-xs text-[#64748B]">
                    {Math.round(enrichmentJob.progress)}%
                  </div>
                </div>
              </div>
              <p className="mt-2 text-xs text-[#94A3B8]">
                Only successful email finds count against the monthly workspace cap.
              </p>
            </div>
          ) : null}
          {!list && filterMeta ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {filterMeta.status ? (
                <span className="rounded-full bg-[#F8FAFC] px-3 py-1 text-xs font-medium text-[#475569]">
                  Status: {filterMeta.status}
                </span>
              ) : null}
              {filterMeta.hasEmail === true ? (
                <span className="rounded-full bg-[#F8FAFC] px-3 py-1 text-xs font-medium text-[#475569]">
                  Has email
                </span>
              ) : null}
              {filterMeta.hasEmail === false ? (
                <span className="rounded-full bg-[#F8FAFC] px-3 py-1 text-xs font-medium text-[#475569]">
                  Missing email
                </span>
              ) : null}
              {filterMeta.enrichmentStatus === 'not_enriched' ? (
                <span className="rounded-full bg-[#F8FAFC] px-3 py-1 text-xs font-medium text-[#475569]">
                  Needs enrichment
                </span>
              ) : null}
              {filterMeta.enrichmentStatus === 'pending' ? (
                <span className="rounded-full bg-[#F8FAFC] px-3 py-1 text-xs font-medium text-[#475569]">
                  Enrichment pending
                </span>
              ) : null}
              {filterMeta.enrichmentStatus === 'no_email_found' ? (
                <span className="rounded-full bg-[#F8FAFC] px-3 py-1 text-xs font-medium text-[#475569]">
                  No email found
                </span>
              ) : null}
              {filterMeta.enrichmentStatus === 'failed' ? (
                <span className="rounded-full bg-[#F8FAFC] px-3 py-1 text-xs font-medium text-[#475569]">
                  Enrichment failed
                </span>
              ) : null}
              {filterMeta.inCampaign === true ? (
                <span className="rounded-full bg-[#F8FAFC] px-3 py-1 text-xs font-medium text-[#475569]">
                  In campaign
                </span>
              ) : null}
              {filterMeta.inCampaign === false ? (
                <span className="rounded-full bg-[#F8FAFC] px-3 py-1 text-xs font-medium text-[#475569]">
                  Not in campaign
                </span>
              ) : null}
              {filterMeta.importedOnly ? (
                <span className="rounded-full bg-[#EFF6FF] px-3 py-1 text-xs font-medium text-[#1D4ED8]">
                  Imported only
                </span>
              ) : null}
              {filterMeta.discoveryOnly ? (
                <span className="rounded-full bg-[#F0FDF4] px-3 py-1 text-xs font-medium text-[#15803D]">
                  Discovery
                </span>
              ) : null}
              {filterMeta.search ? (
                <span className="rounded-full bg-[#F8FAFC] px-3 py-1 text-xs font-medium text-[#475569]">
                  Search: {filterMeta.search}
                </span>
              ) : null}
            </div>
          ) : null}
        </div>

        {/* Bulk Actions Bar */}
        {selectedLeads.length > 0 && (
          <div className="flex items-center justify-between rounded-xl border border-[#FF6B35]/20 bg-[#FFF7ED] px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-[#1E293B]">
                {selectedLeads.length} lead{selectedLeads.length !== 1 ? 's' : ''} selected
              </span>
              <button
                onClick={() => setSelectedLeads([])}
                className="text-sm text-[#64748B] hover:text-[#1E293B]"
              >
                Clear selection
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleEnrichSelected}
                disabled={
                  enrichLeadsMutation.isPending ||
                  !workspaceId ||
                  enrichmentUsage?.credits_remaining === 0
                }
                className="flex items-center gap-2 rounded-lg border border-[#E2E8F0] bg-white px-3 py-1.5 text-sm font-medium text-[#1E293B] transition-colors hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {enrichLeadsMutation.isPending ? (
                  <LoadingSpinner className="h-4 w-4" />
                ) : (
                  <SparkleIcon className="h-4 w-4" />
                )}
                Enrich selected
              </button>
              {list ? (
                <button
                  onClick={handleRemoveSelectedFromList}
                  disabled={removeFromListMutation.isPending}
                  className="flex items-center gap-2 rounded-lg border border-[#E2E8F0] bg-white px-3 py-1.5 text-sm font-medium text-[#64748B] transition-colors hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ListIcon className="h-4 w-4" />
                  Remove from list
                </button>
              ) : null}
              <button
                onClick={() => setShowDeleteModal(true)}
                className="flex items-center gap-2 rounded-lg border border-[#EF4444]/20 bg-white px-3 py-1.5 text-sm font-medium text-[#EF4444] transition-colors hover:bg-[#FEF2F2]"
              >
                <TrashIcon className="h-4 w-4" />
                Delete
              </button>
            </div>
          </div>
        )}

        {/* Leads Table */}
        <div className="overflow-hidden rounded-xl border border-[#E2E8F0] bg-white">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedLeads.length === leads.length && leads.length > 0}
                      onChange={(e) =>
                        setSelectedLeads(e.target.checked ? leads.map((l) => l.id) : [])
                      }
                      className="rounded border-[#E2E8F0] text-[#FF6B35] focus:ring-[#FF6B35]"
                    />
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#64748B]">
                    #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#64748B]">
                    Lead
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#64748B]">
                    Company
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#64748B]">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#64748B]">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#64748B]">
                    Profile
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#64748B]">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[#64748B]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {isLoading ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-[#64748B]">
                      <div className="flex items-center justify-center gap-2">
                        <LoadingSpinner />
                        <span>Loading leads...</span>
                      </div>
                    </td>
                  </tr>
                ) : leads.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-[#64748B]">
                      No leads in this list yet
                    </td>
                  </tr>
                ) : (
                  leads.map((lead, index) => (
                    <LeadRow
                      key={lead.id}
                      lead={lead}
                      rowNumber={(currentPage - 1) * LEADS_PER_PAGE + index + 1}
                      selected={selectedLeads.includes(lead.id)}
                      onSelect={(selected) => {
                        if (selected) {
                          setSelectedLeads([...selectedLeads, lead.id]);
                        } else {
                          setSelectedLeads(selectedLeads.filter((id) => id !== lead.id));
                        }
                      }}
                      onDelete={(leadId) => {
                        setSelectedLeads([leadId]);
                        setShowDeleteModal(true);
                      }}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-[#E2E8F0] px-6 py-4">
              <div className="text-sm text-[#64748B]">
                Showing {(currentPage - 1) * LEADS_PER_PAGE + 1} to{' '}
                {Math.min(currentPage * LEADS_PER_PAGE, totalLeads)} of {totalLeads} leads
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onPageChange(1)}
                  disabled={currentPage === 1}
                  className="rounded-lg border border-[#E2E8F0] px-3 py-1.5 text-sm text-[#64748B] transition-colors hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  First
                </button>
                <button
                  onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="rounded-lg border border-[#E2E8F0] px-3 py-1.5 text-sm text-[#64748B] transition-colors hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Previous
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => onPageChange(pageNum)}
                        className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
                          currentPage === pageNum
                            ? 'bg-[#FF6B35] text-white'
                            : 'border border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC]'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="rounded-lg border border-[#E2E8F0] px-3 py-1.5 text-sm text-[#64748B] transition-colors hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                </button>
                <button
                  onClick={() => onPageChange(totalPages)}
                  disabled={currentPage === totalPages}
                  className="rounded-lg border border-[#E2E8F0] px-3 py-1.5 text-sm text-[#64748B] transition-colors hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Last
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// Delete Leads Confirmation Modal
function DeleteLeadsModal({
  count,
  onClose,
  onConfirm,
  isDeleting,
}: {
  count: number;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
}) {
  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-md rounded-xl bg-white shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#FEF2F2]">
              <TrashIcon className="h-6 w-6 text-[#EF4444]" />
            </div>
            <h2 className="mb-2 text-center text-xl font-bold text-[#1E293B]">Delete Leads</h2>
            <p className="mb-6 text-center text-[#64748B]">
              Are you sure you want to delete{' '}
              <span className="font-semibold text-[#1E293B]">
                {count} lead{count !== 1 ? 's' : ''}
              </span>
              ? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isDeleting}
                className="flex-1 rounded-lg border border-[#E2E8F0] px-4 py-2.5 font-medium text-[#1E293B] transition-colors hover:bg-[#F8FAFC] disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={isDeleting}
                className="flex-1 rounded-lg bg-[#EF4444] px-4 py-2.5 font-medium text-white transition-colors hover:bg-[#DC2626] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}

function LeadRow({
  lead,
  rowNumber,
  selected,
  onSelect,
  onDelete,
}: {
  lead: Lead;
  rowNumber: number;
  selected: boolean;
  onSelect: (selected: boolean) => void;
  onDelete: (leadId: string) => void;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const [showContextField, setShowContextField] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

  const statusColors: Record<string, { bg: string; text: string; label: string }> = {
    new: { bg: 'bg-[#F8FAFC]', text: 'text-[#64748B]', label: 'New' },
    contacted: { bg: 'bg-[#FFF7ED]', text: 'text-[#FF6B35]', label: 'Contacted' },
    accepted: { bg: 'bg-[#EFF6FF]', text: 'text-[#3B82F6]', label: 'Accepted' },
    replied: { bg: 'bg-[#F0FDF4]', text: 'text-[#22C55E]', label: 'Replied' },
    qualified: { bg: 'bg-[#F0FDFA]', text: 'text-[#14B8A6]', label: 'Qualified' },
    not_interested: { bg: 'bg-[#FEF2F2]', text: 'text-[#EF4444]', label: 'Not Interested' },
  };

  const status = statusColors[lead.status] || statusColors.new;
  const emailState = (() => {
    if (lead.email) {
      return {
        dot: 'bg-[#22C55E]',
        label: lead.email,
        sublabel: 'Email found',
        text: 'text-[#1E293B]',
      };
    }
    if (lead.enrichment_status === 'pending') {
      return {
        dot: 'bg-[#F59E0B]',
        label: 'Pending',
        sublabel: 'Enrichment running',
        text: 'text-[#92400E]',
      };
    }
    if (lead.enrichment_status === 'no_email_found') {
      return {
        dot: 'bg-[#94A3B8]',
        label: 'Not found',
        sublabel: 'No email available',
        text: 'text-[#475569]',
      };
    }
    if (lead.enrichment_status === 'failed') {
      const { label, sublabel } = getUserFacingEnrichmentFailure(lead.enrichment_error);
      return {
        dot: 'bg-[#EF4444]',
        label,
        sublabel,
        text: 'text-[#B91C1C]',
      };
    }
    return {
      dot: 'bg-[#CBD5E1]',
      label: 'Not enriched',
      sublabel: 'Ready for lookup',
      text: 'text-[#64748B]',
    };
  })();

  return (
    <>
      <tr className="transition-colors hover:bg-[#F8FAFC]">
        <td className="px-6 py-4">
          <input
            type="checkbox"
            checked={selected}
            onChange={(e) => onSelect(e.target.checked)}
            className="rounded border-[#E2E8F0] text-[#FF6B35] focus:ring-[#FF6B35]"
          />
        </td>
        <td className="px-3 py-4 text-sm text-[#64748B]">{rowNumber}</td>
        <td className="px-6 py-4">
          <div className="flex items-center gap-3">
            {lead.avatar_url ? (
              <img src={lead.avatar_url} alt="" className="h-9 w-9 rounded-full object-cover" />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#FF6B35] to-[#14B8A6] text-sm font-medium text-white">
                {[lead.first_name, lead.last_name]
                  .filter(Boolean)
                  .map((n) => n?.[0] || '')
                  .join('') || '?'}
              </div>
            )}
            <div>
              <p className="font-medium text-[#1E293B]">
                {[lead.first_name, lead.last_name].filter(Boolean).join(' ') || 'Unknown'}
              </p>
              <p
                className="max-w-[200px] truncate text-sm text-[#64748B]"
                title={lead.headline || lead.title || undefined}
              >
                {lead.headline || lead.title}
              </p>
              {lead.tags?.includes('Discovery') ? (
                <span className="mt-1 inline-flex rounded-full bg-[#F0FDF4] px-2 py-0.5 text-[11px] font-medium text-[#15803D]">
                  Discovery
                </span>
              ) : null}
            </div>
          </div>
        </td>
        <td className="px-6 py-4 text-[#1E293B]">{lead.company || '-'}</td>
        <td className="px-6 py-4 text-[#64748B]">{lead.location || '-'}</td>
        <td className="px-6 py-4">
          <div className="min-w-[180px]">
            <div className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${emailState.dot}`} />
              <span className={`text-sm font-medium ${emailState.text}`}>{emailState.label}</span>
            </div>
            <p className="mt-1 text-xs text-[#94A3B8]" title={emailState.sublabel}>
              {emailState.sublabel}
            </p>
          </div>
        </td>
        <td className="px-6 py-4">
          <div className="flex min-w-[110px] flex-col items-start gap-2">
            {lead.linkedin_url ? (
              <a
                href={lead.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-[#0A66C2] hover:text-[#004182] hover:underline"
              >
                <LinkedInSmallIcon className="h-4 w-4" />
                <span>View</span>
              </a>
            ) : (
              <span className="text-sm text-[#94A3B8]">-</span>
            )}
            {lead.context_field ? (
              <button
                type="button"
                onClick={() => setShowContextField(true)}
                className="text-xs font-medium text-[#FF6B35] transition-colors hover:text-[#E85A2A]"
              >
                View context
              </button>
            ) : null}
          </div>
        </td>
        <td className="px-6 py-4">
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${status.bg} ${status.text}`}
          >
            {status.label}
          </span>
        </td>
        <td className="px-6 py-4 text-right">
          <div className="flex items-center justify-end gap-2">
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="rounded-lg p-2 text-[#64748B] transition-colors hover:bg-[#F8FAFC]"
              >
                <MoreIcon />
              </button>
              {showMenu && (
                <div className="absolute right-0 top-full z-10 mt-1 w-36 rounded-lg border border-[#E2E8F0] bg-white py-1 shadow-lg">
                  <button
                    onClick={() => {
                      onDelete(lead.id);
                      setShowMenu(false);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[#EF4444] hover:bg-[#FEF2F2]"
                  >
                    <TrashIcon className="h-4 w-4" />
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        </td>
      </tr>
      <ContextFieldModal
        open={showContextField}
        leadName={[lead.first_name, lead.last_name].filter(Boolean).join(' ') || 'Lead'}
        contextField={lead.context_field}
        onClose={() => setShowContextField(false)}
      />
    </>
  );
}

function ContextFieldModal({
  open,
  leadName,
  contextField,
  onClose,
}: {
  open: boolean;
  leadName: string;
  contextField: string | null;
  onClose: () => void;
}) {
  if (!open) return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[80] flex items-center justify-center bg-[#0F172A]/45 px-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.18 }}
          onClick={(event) => event.stopPropagation()}
          className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-[#0F172A]">Lead context</h3>
              <p className="mt-1 text-sm text-[#64748B]">{leadName}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-[#64748B] transition-colors hover:bg-[#F8FAFC]"
            >
              <span className="block h-4 w-4">
                <CloseIcon />
              </span>
            </button>
          </div>
          <div className="mt-4 max-h-[60vh] overflow-y-auto rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
            <pre className="whitespace-pre-wrap font-sans text-sm leading-6 text-[#1E293B]">
              {contextField || 'No context available for this lead.'}
            </pre>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}

// Main Import Modal with all methods
export function ImportLeadsModal({
  availableLists = [],
  onClose,
  onSuccess,
}: {
  availableLists?: LeadList[];
  onClose: () => void;
  onSuccess: (listId?: string) => void;
}) {
  const [selectedMethod, setSelectedMethod] = useState<ImportMethod | null>(null);
  const [step, setStep] = useState<'method' | 'configure' | 'processing' | 'complete'>('method');
  const [listDestinationMode, setListDestinationMode] = useState<'new' | 'existing'>('new');
  const [listName, setListName] = useState('');
  const [targetListId, setTargetListId] = useState<string | null>(availableLists[0]?.id ?? null);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<{
    created: number;
    skipped: number;
    errors: string[];
  } | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [maxLeads, setMaxLeads] = useState<number | null>(null); // null = all
  const [createdListId, setCreatedListId] = useState<string | null>(null);

  // Hooks
  const importCSVMutation = useImportLeadsFromCSV();
  const startImportMutation = useStartImport();
  const cancelImportMutation = useCancelImport();
  const { data: linkedInAccounts, isLoading: accountsLoading } = useLinkedInAccounts();

  // Poll for import job status
  const { data: jobStatus } = useImportJobStatus(
    currentJobId || '',
    !!currentJobId && step === 'processing',
    2000 // Poll every 2 seconds
  );
  const isSearchFlow =
    selectedMethod !== null &&
    selectedMethod !== 'csv' &&
    step === 'processing' &&
    Boolean(currentJobId || selectedMethod === 'linkedin_people_search');
  const searchStatusLabel =
    (jobStatus?.processed_count || 0) > 0 || (jobStatus?.progress || 0) > 10
      ? 'Fetching results...'
      : 'Searching...';

  // Handle job completion
  useEffect(() => {
    if (jobStatus && currentJobId) {
      if (jobStatus.status === 'completed') {
        setImportResult({
          created: jobStatus.created_count,
          skipped: jobStatus.skipped_count,
          errors: [],
        });
        setStep('complete');
        setCurrentJobId(null);
      } else if (jobStatus.status === 'failed') {
        setImportError(jobStatus.error_message || 'Import failed');
        setStep('configure');
        setCurrentJobId(null);
      } else if (jobStatus.status === 'cancelled') {
        setImportError('Import was cancelled');
        setStep('configure');
        setCurrentJobId(null);
      }
    }
  }, [jobStatus, currentJobId]);

  // Set default account when accounts load
  useEffect(() => {
    if (linkedInAccounts && linkedInAccounts.length > 0 && !selectedAccountId) {
      const connectedAccount = linkedInAccounts.find((a) => a.status === 'connected');
      if (connectedAccount) {
        setSelectedAccountId(connectedAccount.id);
      }
    }
  }, [linkedInAccounts, selectedAccountId]);

  useEffect(() => {
    if (availableLists.length === 0) {
      setListDestinationMode('new');
      setTargetListId(null);
      return;
    }
    if (listDestinationMode === 'existing' && !targetListId) {
      setTargetListId(availableLists[0].id);
    }
  }, [availableLists, listDestinationMode, targetListId]);

  const handleBack = () => {
    if (step === 'configure') {
      setSelectedMethod(null);
      setStep('method');
    }
  };

  const handleCSVImport = async (file: File) => {
    if (listDestinationMode === 'new' && !listName.trim()) {
      setImportError('Please enter a list name');
      return;
    }
    if (listDestinationMode === 'existing' && !targetListId) {
      setImportError('Please select a destination list');
      return;
    }

    setStep('processing');
    setImportError(null);

    try {
      const result = await importCSVMutation.mutateAsync({
        file,
        list_name: listDestinationMode === 'new' ? listName.trim() : undefined,
        list_id: listDestinationMode === 'existing' ? targetListId || undefined : undefined,
      });
      setImportResult(result);
      setCreatedListId(result.list_id || targetListId);
      setStep('complete');
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'Import failed');
      setStep('configure');
    }
  };

  // For LinkedIn-based imports (starts background job)
  const handleLinkedInImport = async (sourceUrl: string, sourceData?: string[]) => {
    if (listDestinationMode === 'new' && !listName.trim()) {
      setImportError('Please enter a list name');
      return;
    }

    if (listDestinationMode === 'existing' && !targetListId) {
      setImportError('Please select a destination list');
      return;
    }

    if (!sourceUrl?.trim() && (!sourceData || sourceData.length === 0)) {
      setImportError('Please enter a URL or data');
      return;
    }

    if (!selectedAccountId) {
      setImportError('Please select a LinkedIn account');
      return;
    }

    // Validate URLs before sending to API
    if (selectedMethod === 'paste_urls' && sourceData && sourceData.length > 0) {
      // Validate all profile URLs in the batch
      const { errors } = validateProfileURLsBatch(sourceData);
      if (errors.length > 0) {
        const errorSummary =
          errors.length <= 3
            ? errors.join('\n')
            : `${errors.slice(0, 3).join('\n')}\n... and ${errors.length - 3} more invalid URLs`;
        setImportError(`Invalid profile URLs:\n${errorSummary}`);
        return;
      }
    } else if (sourceUrl?.trim() && selectedMethod) {
      // Validate the source URL based on import type
      const validation = validateImportURL(sourceUrl.trim(), selectedMethod);
      if (!validation.valid) {
        setImportError(validation.error || 'Invalid URL format');
        return;
      }
    }

    setStep('processing');
    setImportError(null);

    try {
      const result = await startImportMutation.mutateAsync({
        list_name: listDestinationMode === 'new' ? listName.trim() : undefined,
        target_list_id: listDestinationMode === 'existing' ? targetListId || undefined : undefined,
        import_type: selectedMethod as ImportType,
        linkedin_account_id: selectedAccountId,
        source_url: sourceUrl || undefined,
        source_data: sourceData,
        max_leads: maxLeads,
      });
      setCurrentJobId(result.job_id);
      setCreatedListId(result.list_id || targetListId);
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'Failed to start import');
      setStep('configure');
    }
  };

  // For People Search imports (starts background job with search params)
  const handlePeopleSearchImport = async (searchParams: Record<string, unknown>) => {
    if (listDestinationMode === 'new' && !listName.trim()) {
      setImportError('Please enter a list name');
      return;
    }

    if (listDestinationMode === 'existing' && !targetListId) {
      setImportError('Please select a destination list');
      return;
    }

    if (!selectedAccountId) {
      setImportError('Please select a LinkedIn account');
      return;
    }

    setStep('processing');
    setImportError(null);

    try {
      const result = await startImportMutation.mutateAsync({
        list_name: listDestinationMode === 'new' ? listName.trim() : undefined,
        target_list_id: listDestinationMode === 'existing' ? targetListId || undefined : undefined,
        import_type: 'linkedin_people_search',
        linkedin_account_id: selectedAccountId,
        search_params: searchParams,
        max_leads: maxLeads,
      });
      setCurrentJobId(result.job_id);
      setCreatedListId(result.list_id || targetListId);
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'Failed to start import');
      setStep('configure');
    }
  };

  const handleCancelImport = async () => {
    if (currentJobId) {
      try {
        await cancelImportMutation.mutateAsync(currentJobId);
      } catch {
        // Ignore errors
      }
    }
    setStep('configure');
    setCurrentJobId(null);
  };

  const handleFinish = () => {
    onSuccess(createdListId || undefined);
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
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className={`flex max-h-[90vh] w-full flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ${
          step === 'method' ? 'max-w-4xl' : 'max-w-2xl'
        }`}
      >
        {/* Header */}
        <div className="flex flex-shrink-0 items-center justify-between border-b border-[#E2E8F0] px-6 py-4">
          <div className="flex items-center gap-3">
            {step !== 'method' && step !== 'processing' && step !== 'complete' && (
              <button onClick={handleBack} className="-ml-2 rounded-lg p-2 hover:bg-[#F8FAFC]">
                <BackIcon className="h-5 w-5 text-[#64748B]" />
              </button>
            )}
            <div>
              <h2 className="text-lg font-bold text-[#1E293B]">
                {step === 'method'
                  ? 'Add Leads'
                  : step === 'configure'
                    ? IMPORT_METHODS.find((m) => m.id === selectedMethod)?.title
                    : step === 'processing'
                      ? isSearchFlow
                        ? searchStatusLabel
                        : 'Importing...'
                      : 'Import Complete'}
              </h2>
              {step === 'method' && (
                <p className="text-sm text-[#64748B]">Choose how you'd like to import leads</p>
              )}
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 hover:bg-[#F8FAFC]">
            <CloseIcon />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            {step === 'method' && (
              <motion.div
                key="method"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-6"
              >
                {/* Layout: Methods on left, Preview on right */}
                <div className="flex flex-col gap-6 lg:flex-row">
                  {/* Import Methods List */}
                  <div className="flex-shrink-0 lg:w-[360px]">
                    <p className="mb-3 px-1 text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">
                      Import Methods
                    </p>
                    <div className="space-y-2">
                      {IMPORT_METHODS.map((method) => {
                        const isDisabled = method.enabled === false || method.comingSoon;
                        return (
                          <button
                            key={method.id}
                            onClick={() => {
                              if (!isDisabled) {
                                setSelectedMethod(method.id);
                                setStep('configure');
                              }
                            }}
                            disabled={isDisabled}
                            className={`group relative flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all ${
                              isDisabled
                                ? 'cursor-not-allowed border-[#E2E8F0] bg-[#F8FAFC] opacity-50'
                                : selectedMethod === method.id
                                  ? 'border-[#FF6B35] bg-[#FFF7ED]'
                                  : 'border-[#E2E8F0] hover:border-[#FF6B35]/30 hover:bg-[#F8FAFC]'
                            }`}
                          >
                            <div
                              className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl transition-transform ${!isDisabled ? 'group-hover:scale-110' : ''}`}
                              style={{ backgroundColor: `${method.color}15` }}
                            >
                              <div style={{ color: method.color }}>{method.icon}</div>
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium text-[#1E293B]">{method.title}</p>
                                {method.comingSoon && (
                                  <span className="rounded bg-[#64748B] px-1.5 py-0.5 text-[10px] font-medium text-white">
                                    Coming Soon
                                  </span>
                                )}
                              </div>
                              <p className="truncate text-xs text-[#64748B]">
                                {method.description}
                              </p>
                            </div>
                            {!isDisabled && (
                              <ChevronRightIcon className="h-4 w-4 flex-shrink-0 text-[#94A3B8] group-hover:text-[#FF6B35]" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Preview/Info Panel */}
                  <div className="hidden flex-1 rounded-xl bg-[#F8FAFC] p-6 lg:block">
                    <div className="flex h-full flex-col items-center justify-center text-center">
                      <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl border border-[#E2E8F0] bg-white shadow-sm">
                        <ImportIcon className="h-10 w-10 text-[#FF6B35]" />
                      </div>
                      <h3 className="mb-2 text-lg font-semibold text-[#1E293B]">
                        Select an import method
                      </h3>
                      <p className="max-w-xs text-sm text-[#64748B]">
                        Choose from LinkedIn sources, upload a CSV file, or paste profile URLs
                        directly to import your leads.
                      </p>

                      {/* Features preview */}
                      <div className="mt-8 w-full max-w-xs">
                        <div className="flex items-center gap-3 rounded-lg border border-[#E2E8F0] bg-white p-3 text-left">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EFF6FF]">
                            <SparkleIcon className="h-4 w-4 text-[#3B82F6]" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-[#1E293B]">
                              Duplicate Detection
                            </p>
                            <p className="text-xs text-[#64748B]">We skip leads you already have</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 'configure' && selectedMethod && (
              <motion.div
                key="configure"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <ImportMethodConfig
                  method={selectedMethod}
                  availableLists={availableLists}
                  listDestinationMode={listDestinationMode}
                  setListDestinationMode={setListDestinationMode}
                  listName={listName}
                  setListName={setListName}
                  targetListId={targetListId}
                  setTargetListId={setTargetListId}
                  onCSVImport={handleCSVImport}
                  onLinkedInImport={handleLinkedInImport}
                  onPeopleSearchImport={handlePeopleSearchImport}
                  importError={importError}
                  linkedInAccounts={linkedInAccounts || []}
                  accountsLoading={accountsLoading}
                  selectedAccountId={selectedAccountId}
                  setSelectedAccountId={setSelectedAccountId}
                  maxLeads={maxLeads}
                  setMaxLeads={setMaxLeads}
                />
              </motion.div>
            )}

            {step === 'processing' && (
              <motion.div
                key="processing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-12 text-center"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  className="mx-auto mb-6 h-16 w-16 rounded-full border-4 border-[#E2E8F0] border-t-[#FF6B35]"
                />
                <motion.h3
                  animate={{ opacity: [0.55, 1, 0.55] }}
                  transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                  className="mb-2 text-lg font-semibold text-[#1E293B]"
                >
                  {isSearchFlow ? searchStatusLabel : 'Importing your leads...'}
                </motion.h3>
                <p className="mb-4 text-[#64748B]">
                  {isSearchFlow
                    ? (jobStatus?.processed_count || 0) > 0
                      ? 'Parrot is pulling matching profiles and preparing the results for your list.'
                      : 'Parrot is actively searching LinkedIn and gathering matching profiles.'
                    : 'This may take a moment depending on list size.'}
                </p>

                {/* Progress info */}
                {jobStatus && (
                  <div className="mx-auto max-w-xs">
                    {/* Progress bar */}
                    <div className="mb-3 h-2 overflow-hidden rounded-full bg-[#E2E8F0]">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-[#FF6B35] to-[#E85A2A]"
                        initial={{ width: 0 }}
                        animate={{ width: `${jobStatus.progress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                    <div className="flex justify-between text-sm text-[#64748B]">
                      <span>
                        {isSearchFlow
                          ? `${jobStatus.processed_count} results examined`
                          : `${jobStatus.processed_count} processed`}
                      </span>
                      <span>{Math.round(jobStatus.progress)}%</span>
                    </div>
                    <div className="mt-2 text-sm">
                      <span className="text-[#22C55E]">
                        {isSearchFlow
                          ? `${jobStatus.created_count} ready for import`
                          : `${jobStatus.created_count} created`}
                      </span>
                      {jobStatus.skipped_count > 0 && (
                        <span className="ml-3 text-[#94A3B8]">
                          {isSearchFlow
                            ? `${jobStatus.skipped_count} filtered out`
                            : `${jobStatus.skipped_count} skipped`}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Cancel button */}
                <button
                  onClick={handleCancelImport}
                  className="mt-6 px-4 py-2 text-sm text-[#64748B] transition-colors hover:text-[#EF4444]"
                >
                  Cancel Import
                </button>
              </motion.div>
            )}

            {step === 'complete' && (
              <motion.div
                key="complete"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-12 text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200 }}
                  className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#F0FDF4] to-[#DCFCE7]"
                >
                  <CheckCircleIcon className="h-10 w-10 text-[#22C55E]" />
                </motion.div>
                <h3 className="mb-2 text-xl font-bold text-[#1E293B]">Import Complete!</h3>
                <p className="mb-4 text-[#64748B]">
                  {importResult?.created || 0} leads imported successfully.
                  {importResult?.skipped ? ` ${importResult.skipped} duplicates skipped.` : ''}
                </p>
                {importResult?.errors && importResult.errors.length > 0 && (
                  <div className="mx-auto mb-6 max-w-md rounded-xl border border-[#F59E0B]/20 bg-[#FFFBEB] p-4 text-left">
                    <p className="mb-2 text-sm font-medium text-[#92400E]">
                      {importResult.errors.length} row{importResult.errors.length > 1 ? 's' : ''}{' '}
                      skipped due to errors:
                    </p>
                    <div className="max-h-40 overflow-y-auto text-xs text-[#92400E]">
                      {importResult.errors.slice(0, 20).map((error, i) => (
                        <p key={i} className="py-0.5">
                          {error}
                        </p>
                      ))}
                      {importResult.errors.length > 20 && (
                        <p className="pt-1 font-medium">
                          ...and {importResult.errors.length - 20} more
                        </p>
                      )}
                    </div>
                  </div>
                )}
                <button
                  onClick={handleFinish}
                  className="rounded-xl bg-[#FF6B35] px-8 py-3 font-semibold text-white transition-all hover:bg-[#E85A2A]"
                >
                  View Your Leads
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>,
    document.body
  );
}

// Import method configuration panels
function ImportDestinationFields({
  availableLists,
  listDestinationMode,
  setListDestinationMode,
  listName,
  setListName,
  targetListId,
  setTargetListId,
}: {
  availableLists: LeadList[];
  listDestinationMode: 'new' | 'existing';
  setListDestinationMode: (mode: 'new' | 'existing') => void;
  listName: string;
  setListName: (name: string) => void;
  targetListId: string | null;
  setTargetListId: (id: string | null) => void;
}) {
  return (
    <div className="space-y-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
      <div>
        <label className="mb-2 block text-sm font-medium text-[#1E293B]">Destination</label>
        <div className="grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setListDestinationMode('new')}
            className={`rounded-xl border px-4 py-3 text-left transition-all ${
              listDestinationMode === 'new'
                ? 'border-[#FF6B35] bg-[#FFF7ED]'
                : 'border-[#E2E8F0] bg-white hover:border-[#FF6B35]/30'
            }`}
          >
            <div className="text-sm font-medium text-[#1E293B]">Create new list</div>
            <div className="mt-1 text-xs text-[#64748B]">Import into a brand-new lead list</div>
          </button>
          <button
            type="button"
            onClick={() => {
              setListDestinationMode('existing');
              if (!targetListId && availableLists[0]) {
                setTargetListId(availableLists[0].id);
              }
            }}
            disabled={availableLists.length === 0}
            className={`rounded-xl border px-4 py-3 text-left transition-all ${
              listDestinationMode === 'existing'
                ? 'border-[#FF6B35] bg-[#FFF7ED]'
                : 'border-[#E2E8F0] bg-white hover:border-[#FF6B35]/30'
            } disabled:cursor-not-allowed disabled:opacity-50`}
          >
            <div className="text-sm font-medium text-[#1E293B]">Add to existing list</div>
            <div className="mt-1 text-xs text-[#64748B]">
              Append new leads and skip duplicates already in that list
            </div>
          </button>
        </div>
      </div>

      {listDestinationMode === 'new' ? (
        <div>
          <label className="mb-2 block text-sm font-medium text-[#1E293B]">List Name</label>
          <input
            type="text"
            value={listName}
            onChange={(e) => setListName(e.target.value)}
            placeholder="e.g., Q1 Tech Leaders"
            className="w-full rounded-xl border border-[#E2E8F0] bg-white px-4 py-3 focus:border-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20"
          />
        </div>
      ) : (
        <div>
          <label className="mb-2 block text-sm font-medium text-[#1E293B]">Select List</label>
          <select
            value={targetListId || ''}
            onChange={(e) => setTargetListId(e.target.value || null)}
            className="w-full rounded-xl border border-[#E2E8F0] bg-white px-4 py-3 text-sm focus:border-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20"
          >
            <option value="" disabled>
              Select a lead list
            </option>
            {availableLists.map((list) => (
              <option key={list.id} value={list.id}>
                {list.name} ({list.lead_count} leads)
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}

function ImportMethodConfig({
  method,
  availableLists,
  listDestinationMode,
  setListDestinationMode,
  listName,
  setListName,
  targetListId,
  setTargetListId,
  onCSVImport,
  onLinkedInImport,
  onPeopleSearchImport,
  importError,
  linkedInAccounts,
  accountsLoading,
  selectedAccountId,
  setSelectedAccountId,
  maxLeads,
  setMaxLeads,
}: {
  method: ImportMethod;
  availableLists: LeadList[];
  listDestinationMode: 'new' | 'existing';
  setListDestinationMode: (mode: 'new' | 'existing') => void;
  listName: string;
  setListName: (name: string) => void;
  targetListId: string | null;
  setTargetListId: (id: string | null) => void;
  onCSVImport: (file: File) => void;
  onLinkedInImport: (sourceUrl: string, sourceData?: string[]) => void;
  onPeopleSearchImport: (searchParams: Record<string, unknown>) => void;
  importError?: string | null;
  linkedInAccounts: LinkedInAccount[];
  accountsLoading: boolean;
  selectedAccountId: string | null;
  setSelectedAccountId: (id: string | null) => void;
  maxLeads: number | null;
  setMaxLeads: (value: number | null) => void;
}) {
  const [pastedUrls, setPastedUrls] = useState('');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvPreviewHeaders, setCsvPreviewHeaders] = useState<string[]>([]);
  const [csvPreviewRows, setCsvPreviewRows] = useState<string[][]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, LeadMappingTarget>>({});
  const [mappingSuggestions, setMappingSuggestions] = useState<
    Record<string, LeadMappingSuggestion>
  >({});
  const [mappingConfirmed, setMappingConfirmed] = useState(false);
  const [searchUrl, setSearchUrl] = useState('');
  const [keywords, setKeywords] = useState('');
  const [location, setLocation] = useState('');
  const [locationOptions, setLocationOptions] = useState<LinkedInSearchParameterOption[]>([]);
  const [selectedLocationOption, setSelectedLocationOption] =
    useState<LinkedInSearchParameterOption | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationLookupError, setLocationLookupError] = useState<string | null>(null);
  const [peopleSearchError, setPeopleSearchError] = useState<string | null>(null);
  const [networkDistance, setNetworkDistance] = useState<(number | string)[]>([2, 3]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const methodInfo = IMPORT_METHODS.find((m) => m.id === method)!;
  const connectedAccounts = linkedInAccounts.filter((a) => a.status === 'connected');
  const selectedAccount = linkedInAccounts.find((a) => a.id === selectedAccountId);
  const isAdvancedAccount =
    selectedAccount?.subscription_type === 'sales_nav' ||
    selectedAccount?.subscription_type === 'recruiter';

  // Determine API type based on selected account subscription
  const getApiType = () => {
    if (!selectedAccount) return 'classic';
    switch (selectedAccount.subscription_type) {
      case 'sales_nav':
        return 'sales_navigator';
      case 'recruiter':
        return 'recruiter';
      default:
        return 'classic';
    }
  };

  useEffect(() => {
    if (method !== 'linkedin_people_search') return;
    setLocation('');
    setLocationOptions([]);
    setSelectedLocationOption(null);
    setLocationLookupError(null);
    setPeopleSearchError(null);
  }, [selectedAccountId, method]);

  useEffect(() => {
    if (method !== 'linkedin_people_search') return;

    const trimmedLocation = location.trim();
    if (!selectedAccountId || trimmedLocation.length < 2) {
      setLocationOptions([]);
      setLocationLoading(false);
      setLocationLookupError(null);
      if (!trimmedLocation) {
        setSelectedLocationOption(null);
      }
      return;
    }

    let cancelled = false;
    const timeoutId = window.setTimeout(async () => {
      setLocationLoading(true);
      setLocationLookupError(null);

      try {
        const params = new URLSearchParams({
          linkedin_account_id: selectedAccountId,
          keywords: trimmedLocation,
        });
        const response = await api.get<LinkedInSearchParametersLookupResponse>(
          `/leads/linkedin/search-parameters?${params.toString()}`
        );

        if (cancelled) return;

        const items = response.data.items || [];
        setLocationOptions(items);

        const normalizedInput = trimmedLocation.toLowerCase();
        const exactMatch =
          items.find((item) => item.title.trim().toLowerCase() === normalizedInput) ||
          (items.length === 1 ? items[0] : null);

        setSelectedLocationOption(exactMatch);
      } catch (error) {
        if (cancelled) return;
        setLocationOptions([]);
        setSelectedLocationOption(null);
        setLocationLookupError(
          error instanceof Error ? error.message : 'Failed to look up locations'
        );
      } finally {
        if (!cancelled) {
          setLocationLoading(false);
        }
      }
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [location, selectedAccountId, method]);

  const parseCsvPreview = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = String(event.target?.result || '');
      const delimiter = detectLeadDelimiter(text);
      const lines = text
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);
      if (lines.length === 0) {
        setCsvPreviewHeaders([]);
        setCsvPreviewRows([]);
        setColumnMapping({});
        setMappingSuggestions({});
        setMappingConfirmed(false);
        return;
      }
      const headers = parseLeadDelimitedLine(lines[0], delimiter);
      const rows = lines.slice(1, 6).map((line) => parseLeadDelimitedLine(line, delimiter));
      const suggestions = autoMapLeadColumns(headers, rows);
      setCsvPreviewHeaders(headers);
      setCsvPreviewRows(rows);
      setMappingSuggestions(suggestions);
      setColumnMapping(
        Object.fromEntries(headers.map((header) => [header, suggestions[header].target]))
      );
      setMappingConfirmed(true);
    };
    reader.readAsText(file);
  };

  const buildMappedLeadCsvFile = async (file: File, mapping: Record<string, LeadMappingTarget>) => {
    const text = await file.text();
    const delimiter = detectLeadDelimiter(text);
    const lines = text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    if (lines.length === 0) return file;
    const sourceHeaders = parseLeadDelimitedLine(lines[0], delimiter);
    const keptIndices = sourceHeaders
      .map((header, index) => ({ header, index, target: mapping[header] || '__keep__' }))
      .filter((item) => item.target !== '__ignore__');
    const mappedHeaders = keptIndices.flatMap((item) => {
      if (item.target === '__split_full_name__') return ['first_name', 'last_name'];
      return [item.target === '__keep__' ? item.header : item.target];
    });
    const remappedRows = lines.slice(1).map((line) => {
      const cells = parseLeadDelimitedLine(line, delimiter);
      return keptIndices
        .flatMap((item) => {
          const value = cells[item.index] || '';
          if (item.target === '__split_full_name__') {
            const split = splitFullName(value);
            return [escapeLeadCsvCell(split.firstName), escapeLeadCsvCell(split.lastName)];
          }
          return [escapeLeadCsvCell(value)];
        })
        .join(',');
    });
    const remapped = [mappedHeaders.map(escapeLeadCsvCell).join(','), ...remappedRows].join('\n');
    return new File([remapped], file.name, { type: 'text/csv' });
  };

  // People Search
  if (method === 'linkedin_people_search') {
    const toggleNetworkDistance = (value: number | string) => {
      setNetworkDistance((prev) =>
        prev.includes(value) ? prev.filter((d) => d !== value) : [...prev, value]
      );
    };

    const handleSearch = () => {
      setPeopleSearchError(null);

      const searchParams: Record<string, unknown> = {
        api: getApiType(),
        category: 'people',
        network_distance: networkDistance.filter((d) => typeof d === 'number'),
      };
      if (keywords.trim()) {
        searchParams.keywords = keywords.trim();
      }
      if (location.trim()) {
        if (!selectedLocationOption) {
          setPeopleSearchError('Select a valid location from the suggestions before searching');
          return;
        }

        const apiType = getApiType();
        if (apiType === 'sales_navigator') {
          searchParams.location = { include: [selectedLocationOption.id] };
        } else if (apiType === 'recruiter') {
          searchParams.location = [
            { id: selectedLocationOption.id, priority: 'MUST_HAVE', scope: 'CURRENT' },
          ];
        } else {
          searchParams.location = [selectedLocationOption.id];
        }
      }
      // Include GROUP for advanced accounts if selected
      if (networkDistance.includes('GROUP')) {
        (searchParams.network_distance as (number | string)[]).push('GROUP');
      }
      onPeopleSearchImport(searchParams);
    };

    return (
      <div className="space-y-5 p-6">
        {/* Method header */}
        <div className="flex items-center gap-4 border-b border-[#E2E8F0] pb-4">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-xl"
            style={{ backgroundColor: `${methodInfo.color}15` }}
          >
            <div style={{ color: methodInfo.color }}>{methodInfo.icon}</div>
          </div>
          <div>
            <h3 className="font-semibold text-[#1E293B]">{methodInfo.title}</h3>
            <p className="text-sm text-[#64748B]">{methodInfo.description}</p>
          </div>
        </div>

        <ImportDestinationFields
          availableLists={availableLists}
          listDestinationMode={listDestinationMode}
          setListDestinationMode={setListDestinationMode}
          listName={listName}
          setListName={setListName}
          targetListId={targetListId}
          setTargetListId={setTargetListId}
        />

        {/* LinkedIn Account Selector */}
        <LinkedInAccountSelector
          accounts={connectedAccounts}
          loading={accountsLoading}
          selectedId={selectedAccountId}
          onSelect={setSelectedAccountId}
        />

        <div>
          <label className="mb-2 block text-sm font-medium text-[#1E293B]">
            Keywords <span className="text-[#64748B]">(optional)</span>
          </label>
          <input
            type="text"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder="e.g., VP of Sales SaaS"
            className="w-full rounded-xl border border-[#E2E8F0] px-4 py-3 focus:border-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20"
          />
          <p className="mt-1.5 text-xs text-[#64748B]">
            Search for people by job title, company, skills, or any keyword
          </p>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-[#1E293B]">Location</label>
          <input
            type="text"
            value={location}
            onChange={(e) => {
              setLocation(e.target.value);
              setSelectedLocationOption(null);
              setPeopleSearchError(null);
            }}
            placeholder="e.g., New York, Lagos, California, United Kingdom"
            className="w-full rounded-xl border border-[#E2E8F0] px-4 py-3 focus:border-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20"
          />
          <p className="mt-1.5 text-xs text-[#64748B]">
            Narrow the search to a city, region, or country using a valid LinkedIn location.
          </p>
          {locationLoading && (
            <p className="mt-2 text-xs text-[#64748B]">Finding matching locations...</p>
          )}
          {selectedLocationOption && location.trim() && (
            <p className="mt-2 text-xs font-medium text-[#0A66C2]">
              Using location: {selectedLocationOption.title}
            </p>
          )}
          {locationLookupError && (
            <p className="mt-2 text-xs text-[#EF4444]">{locationLookupError}</p>
          )}
          {!locationLoading &&
            location.trim().length >= 2 &&
            locationOptions.length > 0 &&
            (!selectedLocationOption ||
              selectedLocationOption.title.trim().toLowerCase() !==
                location.trim().toLowerCase()) && (
              <div className="mt-3 overflow-hidden rounded-xl border border-[#E2E8F0] bg-white">
                {locationOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => {
                      setLocation(option.title);
                      setSelectedLocationOption(option);
                      setPeopleSearchError(null);
                    }}
                    className="flex w-full items-center justify-between border-b border-[#E2E8F0] px-4 py-3 text-left text-sm text-[#1E293B] transition-colors last:border-b-0 hover:bg-[#F8FAFC]"
                  >
                    <span>{option.title}</span>
                    <span className="text-xs text-[#64748B]">{option.id}</span>
                  </button>
                ))}
              </div>
            )}
        </div>

        {/* Network Distance */}
        <div>
          <label className="mb-2 block text-sm font-medium text-[#1E293B]">Network Distance</label>
          <div className="flex flex-wrap items-center gap-2">
            {[
              { value: 1, label: '1st' },
              { value: 2, label: '2nd' },
              { value: 3, label: '3rd+' },
            ].map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => toggleNetworkDistance(value)}
                className={`rounded-lg border px-3.5 py-2 text-sm font-medium transition-all ${
                  networkDistance.includes(value)
                    ? 'border-[#0A66C2] bg-[#EFF6FF] text-[#0A66C2]'
                    : 'border-[#E2E8F0] text-[#64748B] hover:border-[#0A66C2]/30 hover:bg-[#F8FAFC]'
                }`}
              >
                {label}
              </button>
            ))}
            {isAdvancedAccount && (
              <button
                type="button"
                onClick={() => toggleNetworkDistance('GROUP')}
                className={`rounded-lg border px-3.5 py-2 text-sm font-medium transition-all ${
                  networkDistance.includes('GROUP')
                    ? 'border-[#0A66C2] bg-[#EFF6FF] text-[#0A66C2]'
                    : 'border-[#E2E8F0] text-[#64748B] hover:border-[#0A66C2]/30 hover:bg-[#F8FAFC]'
                }`}
              >
                Group Members
              </button>
            )}
          </div>
        </div>

        {/* Number of Leads selector */}
        <div>
          <label className="mb-2 block text-sm font-medium text-[#1E293B]">Number of Leads</label>
          <div className="flex items-center gap-2">
            {[25, 50, 100].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setMaxLeads(maxLeads === preset ? null : preset)}
                className={`rounded-lg border px-3.5 py-2 text-sm font-medium transition-all ${
                  maxLeads === preset
                    ? 'border-[#FF6B35] bg-[#FFF7ED] text-[#FF6B35]'
                    : 'border-[#E2E8F0] text-[#64748B] hover:border-[#FF6B35]/30 hover:bg-[#F8FAFC]'
                }`}
              >
                {preset}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setMaxLeads(null)}
              className={`rounded-lg border px-3.5 py-2 text-sm font-medium transition-all ${
                maxLeads === null
                  ? 'border-[#FF6B35] bg-[#FFF7ED] text-[#FF6B35]'
                  : 'border-[#E2E8F0] text-[#64748B] hover:border-[#FF6B35]/30 hover:bg-[#F8FAFC]'
              }`}
            >
              All
            </button>
            <div className="mx-1 h-5 w-px bg-[#E2E8F0]" />
            <input
              type="number"
              min={1}
              placeholder="Custom"
              value={maxLeads !== null && ![25, 50, 100].includes(maxLeads) ? maxLeads : ''}
              onChange={(e) => {
                const val = e.target.value ? parseInt(e.target.value, 10) : null;
                setMaxLeads(val && val > 0 ? val : null);
              }}
              className="w-20 rounded-lg border border-[#E2E8F0] px-3 py-2 text-center text-sm focus:border-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20"
            />
          </div>
        </div>

        {(peopleSearchError || importError) && (
          <div className="rounded-xl border border-[#EF4444]/20 bg-[#FEF2F2] p-3 text-sm text-[#EF4444]">
            <pre className="whitespace-pre-wrap font-sans">{peopleSearchError || importError}</pre>
          </div>
        )}

        <button
          onClick={handleSearch}
          disabled={
            (Boolean(location.trim()) && !selectedLocationOption) ||
            (listDestinationMode === 'new' ? !listName.trim() : !targetListId) ||
            !selectedAccountId
          }
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#FF6B35] py-3.5 font-semibold text-white hover:bg-[#E85A2A] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          Search Leads
        </button>
      </div>
    );
  }

  // CSV import
  if (method === 'csv') {
    return (
      <div className="space-y-5 p-6">
        <ImportDestinationFields
          availableLists={availableLists}
          listDestinationMode={listDestinationMode}
          setListDestinationMode={setListDestinationMode}
          listName={listName}
          setListName={setListName}
          targetListId={targetListId}
          setTargetListId={setTargetListId}
        />

        <div>
          <label className="mb-2 block text-sm font-medium text-[#1E293B]">CSV File</label>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={(e) => {
              const file = e.target.files?.[0] || null;
              setCsvFile(file);
              if (file) {
                parseCsvPreview(file);
              } else {
                setCsvPreviewHeaders([]);
                setCsvPreviewRows([]);
                setColumnMapping({});
                setMappingSuggestions({});
                setMappingConfirmed(false);
              }
            }}
            className="hidden"
          />
          {csvFile ? (
            <div className="flex items-center gap-3 rounded-xl border border-[#22C55E]/20 bg-[#F0FDF4] p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#22C55E]/10">
                <CSVIcon className="h-5 w-5 text-[#22C55E]" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-[#1E293B]">{csvFile.name}</p>
                <p className="text-sm text-[#64748B]">{Math.round(csvFile.size / 1024)} KB</p>
              </div>
              <button
                onClick={() => setCsvFile(null)}
                className="rounded-lg p-2 hover:bg-[#22C55E]/10"
              >
                <CloseIcon />
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full rounded-xl border-2 border-dashed border-[#E2E8F0] p-8 transition-colors hover:border-[#FF6B35]/50 hover:bg-[#FFF7ED]/50"
            >
              <UploadIcon className="mx-auto mb-3 h-10 w-10 text-[#94A3B8]" />
              <p className="font-medium text-[#1E293B]">Click to upload or drag and drop</p>
              <p className="mt-1 text-sm text-[#64748B]">CSV files up to 10MB</p>
            </button>
          )}
        </div>

        <div className="rounded-xl bg-[#F8FAFC] p-4">
          <p className="mb-2 text-sm font-medium text-[#1E293B]">Required (at least one):</p>
          <div className="flex flex-wrap gap-2">
            <span className="rounded border bg-white px-2 py-1 text-xs text-[#64748B]">
              linkedin_url
            </span>
            <span className="text-xs text-[#94A3B8]">or</span>
            <span className="rounded border bg-white px-2 py-1 text-xs text-[#64748B]">email</span>
            <span className="text-xs text-[#94A3B8]">or</span>
            <span className="rounded border bg-white px-2 py-1 text-xs text-[#64748B]">
              first_name
            </span>
            <span className="text-xs text-[#94A3B8]">+</span>
            <span className="rounded border bg-white px-2 py-1 text-xs text-[#64748B]">
              last_name
            </span>
          </div>
          <p className="mb-2 mt-3 text-sm font-medium text-[#1E293B]">Optional columns:</p>
          <div className="flex flex-wrap gap-2">
            {['company', 'title', 'headline', 'location'].map((col) => (
              <span key={col} className="rounded border bg-white px-2 py-1 text-xs text-[#94A3B8]">
                {col}
              </span>
            ))}
          </div>
        </div>

        {csvPreviewHeaders.length > 0 && (
          <div className="rounded-xl border border-[#E2E8F0] bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-[#1E293B]">Review smart field mapping</p>
                <p className="mt-1 text-xs text-[#64748B]">
                  We auto-detected the most likely Parrot fields. Change anything you want, or
                  import as-is.
                </p>
              </div>
              <span className="rounded-full border border-[#DCFCE7] bg-[#F0FDF4] px-3 py-1 text-xs font-semibold text-[#166534]">
                Auto-mapped
              </span>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {csvPreviewHeaders.map((header) => (
                <div key={header} className="rounded-lg border border-[#E2E8F0] p-3">
                  <div className="text-xs uppercase tracking-wide text-[#64748B]">CSV column</div>
                  <div className="mt-1 text-sm font-medium text-[#1E293B]">{header}</div>
                  <div className="mt-2 flex items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${
                        mappingSuggestions[header]?.confidence === 'high'
                          ? 'bg-[#DCFCE7] text-[#166534]'
                          : mappingSuggestions[header]?.confidence === 'medium'
                            ? 'bg-[#FEF3C7] text-[#92400E]'
                            : 'bg-[#E2E8F0] text-[#475569]'
                      }`}
                    >
                      {mappingSuggestions[header]?.confidence || 'low'} confidence
                    </span>
                    <span className="text-[11px] text-[#64748B]">
                      {mappingSuggestions[header]?.reason || 'Added to the lead context field'}
                    </span>
                  </div>
                  <select
                    value={columnMapping[header] || '__keep__'}
                    onChange={(e) => {
                      setColumnMapping((current) => ({
                        ...current,
                        [header]: e.target.value as LeadMappingTarget,
                      }));
                      setMappingConfirmed(true);
                    }}
                    className="mt-2 w-full rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm focus:border-[#FF6B35] focus:outline-none"
                  >
                    {LEAD_MAPPING_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[#E2E8F0] text-[#64748B]">
                    {csvPreviewHeaders.map((header) => (
                      <th key={header} className="px-2 py-2 font-medium">
                        {getLeadMappingPreviewLabel(header, columnMapping[header])}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {csvPreviewRows.map((row, rowIndex) => (
                    <tr key={rowIndex} className="border-b border-[#F1F5F9] text-[#1E293B]">
                      {csvPreviewHeaders.map((_, colIndex) => (
                        <td key={`${rowIndex}-${colIndex}`} className="px-2 py-2">
                          {row[colIndex] || '—'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {importError && (
          <div className="rounded-xl border border-[#EF4444]/20 bg-[#FEF2F2] p-3 text-sm text-[#EF4444]">
            <pre className="whitespace-pre-wrap font-sans">{importError}</pre>
          </div>
        )}

        <button
          onClick={async () => {
            if (!csvFile) return;
            const mappedFile = await buildMappedLeadCsvFile(csvFile, columnMapping);
            onCSVImport(mappedFile);
          }}
          disabled={!csvFile || (listDestinationMode === 'new' ? !listName.trim() : !targetListId)}
          className="w-full rounded-xl bg-[#FF6B35] py-3.5 font-semibold text-white hover:bg-[#E85A2A] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {mappingConfirmed ? 'Import Leads' : 'Loading mapping...'}
        </button>
      </div>
    );
  }

  // Paste URLs
  if (method === 'paste_urls') {
    const urlList = pastedUrls
      .split('\n')
      .map((u) => u.trim())
      .filter((u) => u);

    return (
      <div className="space-y-5 p-6">
        <ImportDestinationFields
          availableLists={availableLists}
          listDestinationMode={listDestinationMode}
          setListDestinationMode={setListDestinationMode}
          listName={listName}
          setListName={setListName}
          targetListId={targetListId}
          setTargetListId={setTargetListId}
        />

        {/* LinkedIn Account Selector */}
        <LinkedInAccountSelector
          accounts={connectedAccounts}
          loading={accountsLoading}
          selectedId={selectedAccountId}
          onSelect={setSelectedAccountId}
        />

        <div>
          <label className="mb-2 block text-sm font-medium text-[#1E293B]">
            LinkedIn Profile URLs
          </label>
          <textarea
            value={pastedUrls}
            onChange={(e) => setPastedUrls(e.target.value)}
            placeholder="https://linkedin.com/in/johndoe&#10;https://linkedin.com/in/janedoe&#10;..."
            rows={8}
            className="w-full resize-none rounded-xl border border-[#E2E8F0] px-4 py-3 font-mono text-sm focus:border-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20"
          />
          <p className="mt-2 text-xs text-[#64748B]">{urlList.length} URLs detected</p>
        </div>

        {importError && (
          <div className="rounded-xl border border-[#EF4444]/20 bg-[#FEF2F2] p-3 text-sm text-[#EF4444]">
            <pre className="whitespace-pre-wrap font-sans">{importError}</pre>
          </div>
        )}

        <button
          onClick={() => onLinkedInImport('', urlList)}
          disabled={
            urlList.length === 0 ||
            !selectedAccountId ||
            (listDestinationMode === 'new' ? !listName.trim() : !targetListId)
          }
          className="w-full rounded-xl bg-[#FF6B35] py-3.5 font-semibold text-white hover:bg-[#E85A2A] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Import Leads
        </button>
      </div>
    );
  }

  // LinkedIn/Sales Navigator based imports
  return (
    <div className="space-y-5 p-6">
      {/* Method header */}
      <div className="flex items-center gap-4 border-b border-[#E2E8F0] pb-4">
        <div
          className="flex h-12 w-12 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${methodInfo.color}15` }}
        >
          <div style={{ color: methodInfo.color }}>{methodInfo.icon}</div>
        </div>
        <div>
          <h3 className="font-semibold text-[#1E293B]">{methodInfo.title}</h3>
          <p className="text-sm text-[#64748B]">{methodInfo.description}</p>
        </div>
      </div>

      <ImportDestinationFields
        availableLists={availableLists}
        listDestinationMode={listDestinationMode}
        setListDestinationMode={setListDestinationMode}
        listName={listName}
        setListName={setListName}
        targetListId={targetListId}
        setTargetListId={setTargetListId}
      />

      {/* LinkedIn Account Selector */}
      <LinkedInAccountSelector
        accounts={connectedAccounts}
        loading={accountsLoading}
        selectedId={selectedAccountId}
        onSelect={setSelectedAccountId}
      />

      <div>
        <label className="mb-2 block text-sm font-medium text-[#1E293B]">
          {method === 'linkedin_search' && 'LinkedIn Search URL'}
          {method === 'sales_nav_leads' && 'Sales Navigator Lead Search URL'}
          {method === 'sales_nav_accounts' && 'Sales Navigator Account Search URL'}
          {method === 'linkedin_recruiter' && 'LinkedIn Recruiter Search URL'}
          {method === 'linkedin_events' && 'LinkedIn Event URL'}
          {method === 'linkedin_post_reactors' && 'LinkedIn Post URL'}
          {method === 'linkedin_companies' && 'LinkedIn Company Page URL'}
        </label>
        <input
          type="url"
          value={searchUrl}
          onChange={(e) => setSearchUrl(e.target.value)}
          placeholder={
            method === 'linkedin_search'
              ? 'https://linkedin.com/search/results/people/...'
              : method === 'sales_nav_leads'
                ? 'https://linkedin.com/sales/search/people/...'
                : method === 'sales_nav_accounts'
                  ? 'https://linkedin.com/sales/search/company/...'
                  : method === 'linkedin_recruiter'
                    ? 'https://linkedin.com/recruiter/...'
                    : method === 'linkedin_events'
                      ? 'https://linkedin.com/events/...'
                      : method === 'linkedin_post_reactors'
                        ? 'https://linkedin.com/posts/...'
                        : 'https://linkedin.com/company/...'
          }
          className="w-full rounded-xl border border-[#E2E8F0] px-4 py-3 focus:border-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20"
        />
      </div>

      {/* Number of Leads selector */}
      <div>
        <label className="mb-2 block text-sm font-medium text-[#1E293B]">Number of Leads</label>
        <div className="flex items-center gap-2">
          {[25, 50, 100].map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setMaxLeads(maxLeads === preset ? null : preset)}
              className={`rounded-lg border px-3.5 py-2 text-sm font-medium transition-all ${
                maxLeads === preset
                  ? 'border-[#FF6B35] bg-[#FFF7ED] text-[#FF6B35]'
                  : 'border-[#E2E8F0] text-[#64748B] hover:border-[#FF6B35]/30 hover:bg-[#F8FAFC]'
              }`}
            >
              {preset}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setMaxLeads(null)}
            className={`rounded-lg border px-3.5 py-2 text-sm font-medium transition-all ${
              maxLeads === null
                ? 'border-[#FF6B35] bg-[#FFF7ED] text-[#FF6B35]'
                : 'border-[#E2E8F0] text-[#64748B] hover:border-[#FF6B35]/30 hover:bg-[#F8FAFC]'
            }`}
          >
            All
          </button>
          <div className="mx-1 h-5 w-px bg-[#E2E8F0]" />
          <input
            type="number"
            min={1}
            placeholder="Custom"
            value={maxLeads !== null && ![25, 50, 100].includes(maxLeads) ? maxLeads : ''}
            onChange={(e) => {
              const val = e.target.value ? parseInt(e.target.value, 10) : null;
              setMaxLeads(val && val > 0 ? val : null);
            }}
            className="w-20 rounded-lg border border-[#E2E8F0] px-3 py-2 text-center text-sm focus:border-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20"
          />
        </div>
      </div>

      {/* How it works section */}
      <div className="rounded-xl bg-[#F8FAFC] p-4">
        <p className="mb-3 text-sm font-medium text-[#1E293B]">How it works:</p>
        <ol className="space-y-2 text-sm text-[#64748B]">
          <li className="flex items-start gap-2">
            <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[#FF6B35] text-xs text-white">
              1
            </span>
            <span>
              {method === 'linkedin_search' && 'Perform your search on LinkedIn and copy the URL'}
              {method === 'sales_nav_leads' && 'Create or open a lead search in Sales Navigator'}
              {method === 'sales_nav_accounts' &&
                'Create or open an account search in Sales Navigator'}
              {method === 'linkedin_recruiter' && 'Open your candidate search in Recruiter'}
              {method === 'linkedin_events' && 'Go to the LinkedIn event page and copy the URL'}
              {method === 'linkedin_post_reactors' && 'Find the post and copy its URL'}
              {method === 'linkedin_companies' && 'Go to the company page and copy the URL'}
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[#FF6B35] text-xs text-white">
              2
            </span>
            <span>Paste the URL above and give your list a name</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[#FF6B35] text-xs text-white">
              3
            </span>
            <span>We'll extract all profiles and import them to your list</span>
          </li>
        </ol>
      </div>

      {importError && (
        <div className="rounded-xl border border-[#EF4444]/20 bg-[#FEF2F2] p-3 text-sm text-[#EF4444]">
          <pre className="whitespace-pre-wrap font-sans">{importError}</pre>
        </div>
      )}

      <button
        onClick={() => onLinkedInImport(searchUrl)}
        disabled={
          !searchUrl ||
          !selectedAccountId ||
          (listDestinationMode === 'new' ? !listName.trim() : !targetListId)
        }
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#FF6B35] py-3.5 font-semibold text-white hover:bg-[#E85A2A] disabled:cursor-not-allowed disabled:opacity-50"
      >
        Import Leads
      </button>
    </div>
  );
}

// LinkedIn Account Selector Component
function LinkedInAccountSelector({
  accounts,
  loading,
  selectedId,
  onSelect,
}: {
  accounts: LinkedInAccount[];
  loading: boolean;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}) {
  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="mb-2 h-4 w-32 rounded bg-[#E2E8F0]" />
        <div className="h-12 rounded-xl bg-[#E2E8F0]" />
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className="rounded-xl border border-[#F59E0B]/20 bg-[#FEF3C7] p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[#F59E0B]/10">
            <AlertIcon className="h-4 w-4 text-[#F59E0B]" />
          </div>
          <div>
            <p className="font-medium text-[#92400E]">No LinkedIn accounts connected</p>
            <p className="mt-1 text-sm text-[#B45309]">
              Connect a LinkedIn account in Settings to import leads from LinkedIn.
            </p>
            <Link
              to="/dashboard/settings"
              className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-[#F59E0B] hover:text-[#D97706]"
            >
              Go to Settings
              <ChevronRightIcon className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const selectedAccount = accounts.find((a) => a.id === selectedId);
  const isClassicAccount =
    selectedAccount?.subscription_type === 'free' || !selectedAccount?.subscription_type;

  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-[#1E293B]">LinkedIn Account</label>
      <div className="space-y-2">
        {accounts.map((account) => (
          <button
            key={account.id}
            onClick={() => onSelect(account.id)}
            className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all ${
              selectedId === account.id
                ? 'border-[#0A66C2] bg-[#EFF6FF]'
                : 'border-[#E2E8F0] hover:border-[#0A66C2]/30'
            }`}
          >
            {account.avatar_url ? (
              <img
                src={account.avatar_url}
                alt=""
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0A66C2] font-medium text-white">
                {account.name?.[0] || 'L'}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-[#1E293B]">
                {account.name || 'LinkedIn Account'}
              </p>
              <p className="text-xs text-[#64748B]">
                {account.subscription_type === 'free'
                  ? 'LinkedIn Classic'
                  : account.subscription_type === 'premium'
                    ? 'LinkedIn Premium'
                    : account.subscription_type === 'sales_nav'
                      ? 'Sales Navigator'
                      : account.subscription_type === 'recruiter'
                        ? 'Recruiter'
                        : 'LinkedIn Classic'}
              </p>
            </div>
            {selectedId === account.id && (
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#0A66C2]">
                <CheckIcon className="h-3 w-3 text-white" />
              </div>
            )}
          </button>
        ))}
      </div>

      {isClassicAccount && (
        <div className="mt-3 rounded-xl border border-[#F59E0B]/20 bg-[#FFFBEB] p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#F59E0B]/10">
              <AlertIcon className="h-3.5 w-3.5 text-[#F59E0B]" />
            </div>
            <div>
              <p className="text-sm font-medium text-[#92400E]">LinkedIn Classic Limitations</p>
              <ul className="mt-2 space-y-1 text-xs text-[#B45309]">
                <li className="flex items-start gap-1.5">
                  <span className="mt-1 block h-1 w-1 flex-shrink-0 rounded-full bg-[#F59E0B]" />
                  <span>Privacy-restricted profiles will be skipped</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="mt-1 block h-1 w-1 flex-shrink-0 rounded-full bg-[#F59E0B]" />
                  <span>Company info/Emails may be missing for some profiles</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="mt-1 block h-1 w-1 flex-shrink-0 rounded-full bg-[#F59E0B]" />
                  <span>Upgrade to Premium or Sales Navigator for full data access</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MergeLeadListsModal({
  lists,
  initialTargetListId,
  onClose,
  onMerged,
}: {
  lists: LeadList[];
  initialTargetListId?: string | null;
  onClose: () => void;
  onMerged: (targetListId: string) => void;
}) {
  const previewMergeMutation = usePreviewMergeLeadLists();
  const mergeListsMutation = useMergeLeadLists();
  const [targetListId, setTargetListId] = useState<string>(
    initialTargetListId || lists[0]?.id || ''
  );
  const [sourceListIds, setSourceListIds] = useState<string[]>([]);
  const [deleteSourceLists, setDeleteSourceLists] = useState(true);
  const [preview, setPreview] = useState<LeadListMergePreviewResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!targetListId && lists[0]) {
      setTargetListId(lists[0].id);
    }
  }, [lists, targetListId]);

  useEffect(() => {
    setSourceListIds((current) => current.filter((id) => id !== targetListId));
    setPreview(null);
  }, [targetListId]);

  const toggleSourceList = (listId: string) => {
    setPreview(null);
    setSourceListIds((current) =>
      current.includes(listId) ? current.filter((id) => id !== listId) : [...current, listId]
    );
  };

  const handlePreview = async () => {
    setError(null);
    setPreview(null);
    if (!targetListId) {
      setError('Select a target list');
      return;
    }
    if (sourceListIds.length === 0) {
      setError('Select at least one source list to merge');
      return;
    }
    try {
      const result = await previewMergeMutation.mutateAsync({
        target_list_id: targetListId,
        source_list_ids: sourceListIds,
        delete_source_lists: deleteSourceLists,
      });
      setPreview(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to preview merge');
    }
  };

  const handleMerge = async () => {
    setError(null);
    if (!targetListId || sourceListIds.length === 0) return;
    try {
      await mergeListsMutation.mutateAsync({
        target_list_id: targetListId,
        source_list_ids: sourceListIds,
        delete_source_lists: deleteSourceLists,
      });
      onMerged(targetListId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to merge lists');
    }
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
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-[#E2E8F0] px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-[#1E293B]">Merge Lead Lists</h2>
            <p className="text-sm text-[#64748B]">
              Merge multiple source lists into one target list and skip duplicates already in the
              target.
            </p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 hover:bg-[#F8FAFC]">
            <CloseIcon />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-[#1E293B]">Target List</label>
                <select
                  value={targetListId}
                  onChange={(e) => setTargetListId(e.target.value)}
                  className="w-full rounded-xl border border-[#E2E8F0] bg-white px-4 py-3 text-sm focus:border-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20"
                >
                  {lists.map((list) => (
                    <option key={list.id} value={list.id}>
                      {list.name} ({list.lead_count} leads)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="block text-sm font-medium text-[#1E293B]">Source Lists</label>
                  <span className="text-xs text-[#64748B]">{sourceListIds.length} selected</span>
                </div>
                <div className="space-y-2">
                  {lists
                    .filter((list) => list.id !== targetListId)
                    .map((list) => (
                      <label
                        key={list.id}
                        className="flex items-start gap-3 rounded-xl border border-[#E2E8F0] px-4 py-3 transition-colors hover:bg-[#F8FAFC]"
                      >
                        <input
                          type="checkbox"
                          checked={sourceListIds.includes(list.id)}
                          onChange={() => toggleSourceList(list.id)}
                          className="mt-1 rounded border-[#E2E8F0] text-[#FF6B35] focus:ring-[#FF6B35]"
                        />
                        <div className="min-w-0">
                          <div className="font-medium text-[#1E293B]">{list.name}</div>
                          <div className="text-sm text-[#64748B]">{list.lead_count} leads</div>
                        </div>
                      </label>
                    ))}
                </div>
              </div>

              <label className="flex items-start gap-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3">
                <input
                  type="checkbox"
                  checked={deleteSourceLists}
                  onChange={(e) => {
                    setDeleteSourceLists(e.target.checked);
                    setPreview(null);
                  }}
                  className="mt-1 rounded border-[#E2E8F0] text-[#FF6B35] focus:ring-[#FF6B35]"
                />
                <div>
                  <div className="font-medium text-[#1E293B]">
                    Delete empty source lists after merge
                  </div>
                  <div className="text-sm text-[#64748B]">
                    Source lists with active import jobs will be retained automatically.
                  </div>
                </div>
              </label>
            </div>

            <div className="space-y-4 rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-5">
              <div>
                <div className="text-sm font-semibold text-[#1E293B]">Merge Preview</div>
                <div className="mt-1 text-sm text-[#64748B]">
                  Review how many rows will be added and how many duplicates will be skipped.
                </div>
              </div>

              {preview ? (
                <div className="space-y-3">
                  <div className="rounded-xl border border-[#E2E8F0] bg-white p-4">
                    <div className="text-xs uppercase tracking-wide text-[#94A3B8]">Target</div>
                    <div className="mt-1 font-medium text-[#1E293B]">
                      {preview.target_list_name}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-[#E2E8F0] bg-white p-4">
                      <div className="text-xs uppercase tracking-wide text-[#94A3B8]">
                        Source leads
                      </div>
                      <div className="mt-1 text-2xl font-bold text-[#1E293B]">
                        {preview.total_source_leads}
                      </div>
                    </div>
                    <div className="rounded-xl border border-[#E2E8F0] bg-white p-4">
                      <div className="text-xs uppercase tracking-wide text-[#94A3B8]">Will add</div>
                      <div className="mt-1 text-2xl font-bold text-[#22C55E]">
                        {preview.leads_to_add}
                      </div>
                    </div>
                    <div className="rounded-xl border border-[#E2E8F0] bg-white p-4">
                      <div className="text-xs uppercase tracking-wide text-[#94A3B8]">
                        Duplicates skipped
                      </div>
                      <div className="mt-1 text-2xl font-bold text-[#F59E0B]">
                        {preview.duplicates_skipped}
                      </div>
                    </div>
                    <div className="rounded-xl border border-[#E2E8F0] bg-white p-4">
                      <div className="text-xs uppercase tracking-wide text-[#94A3B8]">
                        Lists deletable
                      </div>
                      <div className="mt-1 text-2xl font-bold text-[#1E293B]">
                        {preview.source_lists_ready_for_deletion}
                      </div>
                    </div>
                  </div>
                  {preview.source_lists_blocked_from_deletion > 0 ? (
                    <div className="rounded-xl border border-[#F59E0B]/20 bg-[#FFFBEB] p-4 text-sm text-[#92400E]">
                      {preview.source_lists_blocked_from_deletion} source list
                      {preview.source_lists_blocked_from_deletion === 1 ? '' : 's'} will be retained
                      because they still have active import jobs.
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-[#CBD5E1] bg-white p-6 text-sm text-[#64748B]">
                  Select a target and source lists, then preview the merge.
                </div>
              )}

              {error ? (
                <div className="rounded-xl border border-[#EF4444]/20 bg-[#FEF2F2] p-3 text-sm text-[#EF4444]">
                  {error}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-[#E2E8F0] px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[#E2E8F0] px-4 py-2.5 font-medium text-[#1E293B] hover:bg-[#F8FAFC]"
          >
            Cancel
          </button>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handlePreview}
              disabled={previewMergeMutation.isPending || mergeListsMutation.isPending}
              className="rounded-lg border border-[#E2E8F0] bg-white px-4 py-2.5 font-medium text-[#1E293B] hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {previewMergeMutation.isPending ? 'Previewing...' : 'Preview Merge'}
            </button>
            <button
              type="button"
              onClick={handleMerge}
              disabled={!preview || mergeListsMutation.isPending}
              className="rounded-lg bg-[#FF6B35] px-4 py-2.5 font-medium text-white hover:bg-[#E85A2A] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {mergeListsMutation.isPending ? 'Merging...' : 'Merge Lists'}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>,
    document.body
  );
}

// Edit List Modal
function EditListModal({ list, onClose }: { list: LeadList; onClose: () => void }) {
  const [name, setName] = useState(list.name);
  const [error, setError] = useState('');
  const updateListMutation = useUpdateLeadList();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('List name is required');
      return;
    }

    try {
      await updateListMutation.mutateAsync({ listId: list.id, name: name.trim() });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update list');
    }
  };

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-md rounded-xl bg-white shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6">
            <h2 className="mb-4 text-xl font-bold text-[#1E293B]">Rename List</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="mb-1 block text-sm font-medium text-[#1E293B]">List Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-[#E2E8F0] px-3 py-2 focus:border-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20"
                  placeholder="Enter list name"
                  autoFocus
                />
                {error && <p className="mt-1 text-sm text-[#EF4444]">{error}</p>}
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 font-medium text-[#64748B] transition-colors hover:text-[#1E293B]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateListMutation.isPending}
                  className="rounded-lg bg-[#FF6B35] px-4 py-2 font-medium text-white transition-colors hover:bg-[#E85A2A] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {updateListMutation.isPending ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}

// Delete List Modal
function DeleteListModal({
  list,
  onClose,
  onDeleted,
}: {
  list: LeadList;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [error, setError] = useState('');
  const deleteListMutation = useDeleteLeadList();

  const handleDelete = async () => {
    setError('');
    try {
      await deleteListMutation.mutateAsync(list.id);
      onDeleted();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete list');
    }
  };

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-md rounded-xl bg-white shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#FEF2F2]">
              <TrashIcon className="h-6 w-6 text-[#EF4444]" />
            </div>
            <h2 className="mb-2 text-center text-xl font-bold text-[#1E293B]">Delete List</h2>
            <p className="mb-6 text-center text-[#64748B]">
              Are you sure you want to delete{' '}
              <span className="font-semibold text-[#1E293B]">"{list.name}"</span>? This will remove
              the list but keep all {list.lead_count} leads in the system.
            </p>
            {error && <p className="mb-4 text-center text-sm text-[#EF4444]">{error}</p>}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-lg border border-[#E2E8F0] px-4 py-2.5 font-medium text-[#1E293B] transition-colors hover:bg-[#F8FAFC]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteListMutation.isPending}
                className="flex-1 rounded-lg bg-[#EF4444] px-4 py-2.5 font-medium text-white transition-colors hover:bg-[#DC2626] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deleteListMutation.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}

// Icons
function PlusIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}

function SearchIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      className={`h-5 w-5 ${className}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
  );
}

function ListIcon({ className = 'w-5 h-5' }: { className?: string }) {
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
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  );
}

function MergeIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h7a4 4 0 014 4" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 4l3 3-3 3" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h-7a4 4 0 01-4-4" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-3-3 3-3" />
    </svg>
  );
}

function LinkedInSmallIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path d="M16.338 16.338H13.67V12.16c0-.995-.017-2.277-1.387-2.277-1.39 0-1.601 1.086-1.601 2.207v4.248H8.014v-8.59h2.559v1.174h.037c.356-.675 1.227-1.387 2.526-1.387 2.703 0 3.203 1.778 3.203 4.092v4.711zM5.005 6.575a1.548 1.548 0 11-.003-3.096 1.548 1.548 0 01.003 3.096zm-1.337 9.763H6.34v-8.59H3.667v8.59zM17.668 1H2.328C1.595 1 1 1.581 1 2.298v15.403C1 18.418 1.595 19 2.328 19h15.34c.734 0 1.332-.582 1.332-1.299V2.298C19 1.581 18.402 1 17.668 1z" />
    </svg>
  );
}

function PeopleSearchIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="11" cy="8" r="4" />
      <path d="M6 21v-2a4 4 0 014-4h2" />
      <circle cx="18" cy="18" r="3" />
      <path d="M20.2 20.2L22 22" />
    </svg>
  );
}

function LinkedInSearchIcon() {
  return (
    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
    </svg>
  );
}

function SalesNavIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.47 2H3.53A1.45 1.45 0 002 3.38v17.24A1.45 1.45 0 003.53 22h16.94a1.45 1.45 0 001.53-1.38V3.38A1.45 1.45 0 0020.47 2zM8.09 18.74h-3v-9h3v9zm-1.5-10.28a1.75 1.75 0 110-3.5 1.75 1.75 0 010 3.5zm12.32 10.28h-3v-4.83c0-1.21-.43-2-1.52-2A1.65 1.65 0 0012.85 13a2 2 0 00-.1.73v5h-3v-9h2.88v1.24a3 3 0 012.71-1.49c2 0 3.45 1.29 3.45 4.06v5.2z" />
      <circle cx="17" cy="7" r="3" fill="#0A66C2" />
    </svg>
  );
}

function SalesNavAccountsIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z" />
    </svg>
  );
}

function RecruiterIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="7" r="4" />
      <path d="M5 21v-2a4 4 0 014-4h6a4 4 0 014 4v2" />
      <path d="M16 3.13a4 4 0 010 7.75" />
      <path d="M21 21v-2a4 4 0 00-3-3.85" />
    </svg>
  );
}

function EventIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01" />
    </svg>
  );
}

function ReactorsIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3zM7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3" />
    </svg>
  );
}

function CompaniesIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M3 21h18" />
      <path d="M9 21V8a1 1 0 011-1h4a1 1 0 011 1v13" />
      <path d="M3 21V11a1 1 0 011-1h2a1 1 0 011 1v10" />
      <path d="M17 21V5a1 1 0 011-1h2a1 1 0 011 1v16" />
    </svg>
  );
}

function CSVIcon({ className = 'w-5 h-5' }: { className?: string }) {
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
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  );
}

function PasteIcon({ className = 'w-5 h-5' }: { className?: string }) {
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
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
      />
    </svg>
  );
}

function ImportIcon({ className = 'w-5 h-5' }: { className?: string }) {
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
        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
      />
    </svg>
  );
}

function SparkleIcon({ className = 'w-5 h-5' }: { className?: string }) {
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
        d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
      />
    </svg>
  );
}

function ChevronRightIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}

function CampaignIcon({ className = 'w-5 h-5' }: { className?: string }) {
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
        d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
      />
    </svg>
  );
}

function MoreIcon({ className = 'w-5 h-5' }: { className?: string }) {
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
        d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
      />
    </svg>
  );
}

function EditIcon({ className = 'w-5 h-5' }: { className?: string }) {
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
        d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
      />
    </svg>
  );
}

function TrashIcon({ className = 'w-5 h-5' }: { className?: string }) {
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
        d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      className="h-5 w-5 text-[#64748B]"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function BackIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  );
}

function UploadIcon({ className = 'w-5 h-5' }: { className?: string }) {
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
        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
      />
    </svg>
  );
}

function CheckCircleIcon({ className = 'w-5 h-5' }: { className?: string }) {
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
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function AlertIcon({ className = 'w-5 h-5' }: { className?: string }) {
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
        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function CheckIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function ExportIcon({ className = 'w-5 h-5' }: { className?: string }) {
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
        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
      />
    </svg>
  );
}

function LoadingSpinner({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={`${className} animate-spin`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}
