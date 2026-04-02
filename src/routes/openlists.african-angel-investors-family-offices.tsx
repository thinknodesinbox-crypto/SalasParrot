import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useMemo, useState } from 'react';
import { Container } from '@/components/ui';

type OpenListLead = {
  name: string;
  base_location: string;
  base_country: string;
  base_classification: string;
  location_precision: string;
  investment_focus: string;
  stage_focus: string;
  geographic_investment_focus: string;
  linkedin_profile_url: string;
  public_contact_email: string;
  primary_focus_source_url: string;
  current_company_or_firm: string;
  company_website: string;
  company_source: string;
  notes: string;
  public_contact_email_source_url: string;
  website_type: string;
};

const DATASET_URL = '/openlists/african-angel-investors-family-offices.csv';
const DATASET_JSON_URL = '/openlists/african-angel-investors-family-offices.json';
const PAGE_SIZE = 25;

const FIELD_ORDER: Array<keyof OpenListLead> = [
  'name',
  'base_location',
  'base_country',
  'base_classification',
  'location_precision',
  'investment_focus',
  'stage_focus',
  'geographic_investment_focus',
  'linkedin_profile_url',
  'public_contact_email',
  'public_contact_email_source_url',
  'primary_focus_source_url',
  'current_company_or_firm',
  'company_website',
  'company_source',
  'website_type',
  'notes',
];

function serializeCsvValue(value: string): string {
  const normalized = value ?? '';
  if (normalized.includes('"') || normalized.includes(',') || normalized.includes('\n')) {
    return `"${normalized.replace(/"/g, '""')}"`;
  }
  return normalized;
}

function toCsv(rows: OpenListLead[]): string {
  const header = FIELD_ORDER.join(',');
  const body = rows.map((row) =>
    FIELD_ORDER.map((field) => serializeCsvValue(row[field] ?? '')).join(',')
  );
  return [header, ...body].join('\n');
}

type ClassificationBucket = 'africa' | 'diaspora' | 'unresolved';

function getClassificationBucket(classification: string): ClassificationBucket {
  const normalized = (classification || '').trim().toLowerCase();
  if (normalized === 'africa-based' || normalized.includes('africa-based')) {
    return 'africa';
  }
  if (normalized.includes('diaspora') || normalized.includes('outside africa')) {
    return 'diaspora';
  }
  return 'unresolved';
}

function getClassificationMeta(classification: string): {
  label: string;
  description: string;
  tone: string;
} {
  const bucket = getClassificationBucket(classification);
  if (bucket === 'africa') {
    return {
      label: 'Africa-based',
      description: 'Primary base location is in an African country.',
      tone: 'bg-[#DCFCE7] text-[#166534] border-[#86EFAC]',
    };
  }
  if (bucket === 'diaspora') {
    return {
      label: 'Global / diaspora (Africa-focused)',
      description: 'Based outside Africa, but actively invests in African markets or founders.',
      tone: 'bg-[#FEF3C7] text-[#92400E] border-[#FCD34D]',
    };
  }
  return {
    label: 'Base not publicly verified',
    description: 'Reliable public base location could not be confirmed yet.',
    tone: 'bg-[#F1F5F9] text-[#475569] border-[#CBD5E1]',
  };
}

function getEstimatedCheckSize(stageFocus: string): string {
  const stage = stageFocus.toLowerCase();
  const hasPreSeed = stage.includes('pre-seed') || stage.includes('pre seed');
  const hasSeed = stage.includes('seed');
  const hasSeriesA = stage.includes('series a');
  const hasSeriesB = stage.includes('series b');
  const hasGrowth = stage.includes('growth');
  const hasLate = stage.includes('late');

  if (hasPreSeed && hasSeed) {
    return '$25k-$1M';
  }
  if (hasPreSeed) {
    return '$25k-$250k';
  }
  if (hasSeed) {
    return '$100k-$1M';
  }
  if (hasSeriesA) {
    return '$500k-$3M';
  }
  if (hasSeriesB || hasGrowth || hasLate) {
    return '$1M-$10M+';
  }
  return 'Not disclosed';
}

export const Route = createFileRoute('/openlists/african-angel-investors-family-offices')({
  component: OpenListsPage,
});

function OpenListsPage() {
  const [rows, setRows] = useState<OpenListLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [classification, setClassification] = useState<
    'all' | 'africa' | 'diaspora' | 'unresolved'
  >('all');
  const [countryFilter, setCountryFilter] = useState('all');
  const [contactFilter, setContactFilter] = useState<'all' | 'linkedin' | 'email' | 'both'>('all');
  const [stageFilter, setStageFilter] = useState('all');
  const [focusFilter, setFocusFilter] = useState('all');
  const [regionFilters, setRegionFilters] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<
    'name_asc' | 'name_desc' | 'country_asc' | 'newest_contact' | 'email_first'
  >('email_first');
  const [currentPage, setCurrentPage] = useState(1);
  const [copiedEmail, setCopiedEmail] = useState('');
  const [mobileView, setMobileView] = useState<'cards' | 'list'>('list');
  const [selectedOpenList, setSelectedOpenList] = useState(
    'african_angel_investors_family_offices'
  );
  const [isRegionFilterExpanded, setIsRegionFilterExpanded] = useState(false);

  useEffect(() => {
    const load = async () => {
      const response = await fetch(DATASET_JSON_URL);
      const jsonRows = (await response.json()) as Array<Record<string, string>>;
      const normalizedRows: OpenListLead[] = jsonRows.map((record) => ({
        name: record.name ?? '',
        base_location: record.base_location ?? '',
        base_country: record.base_country ?? '',
        base_classification: record.base_classification ?? '',
        location_precision: record.location_precision ?? '',
        investment_focus: record.investment_focus ?? '',
        stage_focus: record.stage_focus ?? '',
        geographic_investment_focus: record.geographic_investment_focus ?? '',
        linkedin_profile_url: record.linkedin_profile_url ?? '',
        public_contact_email: record.public_contact_email ?? '',
        primary_focus_source_url: record.primary_focus_source_url ?? '',
        current_company_or_firm: record.current_company_or_firm ?? '',
        company_website: record.company_website ?? '',
        company_source: record.company_source ?? '',
        notes: record.notes ?? '',
        public_contact_email_source_url: record.public_contact_email_source_url ?? '',
        website_type: record.website_type ?? '',
      }));
      setRows(normalizedRows);
      setLoading(false);
    };

    load().catch(() => setLoading(false));
  }, []);

  const countryOptions = useMemo(() => {
    return Array.from(new Set(rows.map((row) => row.base_country).filter(Boolean))).sort((a, b) =>
      a.localeCompare(b)
    );
  }, [rows]);

  const stageOptions = useMemo(() => {
    const stages = rows.flatMap((row) =>
      (row.stage_focus || '')
        .split(',')
        .map((stage) => stage.trim())
        .filter(Boolean)
    );
    return Array.from(new Set(stages)).sort((a, b) => a.localeCompare(b));
  }, [rows]);

  const focusOptions = useMemo(() => {
    const focusTags = rows.flatMap((row) =>
      (row.investment_focus || '')
        .split(',')
        .map((focus) => focus.trim())
        .filter(Boolean)
    );
    return Array.from(new Set(focusTags)).sort((a, b) => a.localeCompare(b));
  }, [rows]);

  const regionOptions = useMemo(() => {
    const regions = rows.flatMap((row) =>
      (row.geographic_investment_focus || '')
        .split(',')
        .map((region) => region.trim())
        .filter(Boolean)
    );
    return Array.from(new Set(regions)).sort((a, b) => a.localeCompare(b));
  }, [rows]);

  const filteredRows = useMemo(() => {
    const searchValue = search.trim().toLowerCase();
    const base = rows.filter((row) => {
      const matchesSearch =
        searchValue.length === 0 ||
        row.name.toLowerCase().includes(searchValue) ||
        row.base_location.toLowerCase().includes(searchValue) ||
        row.base_country.toLowerCase().includes(searchValue) ||
        row.investment_focus.toLowerCase().includes(searchValue) ||
        row.geographic_investment_focus.toLowerCase().includes(searchValue) ||
        row.stage_focus.toLowerCase().includes(searchValue) ||
        row.current_company_or_firm.toLowerCase().includes(searchValue);

      if (!matchesSearch) {
        return false;
      }

      if (
        classification !== 'all' &&
        getClassificationBucket(row.base_classification) !== classification
      ) {
        return false;
      }

      if (countryFilter !== 'all' && row.base_country !== countryFilter) {
        return false;
      }

      const hasLinkedIn = Boolean(
        row.linkedin_profile_url && row.linkedin_profile_url.trim() !== ''
      );
      const hasEmail = Boolean(row.public_contact_email && row.public_contact_email.trim() !== '');

      if (contactFilter === 'linkedin' && !hasLinkedIn) {
        return false;
      }
      if (contactFilter === 'email' && !hasEmail) {
        return false;
      }
      if (contactFilter === 'both' && !(hasLinkedIn && hasEmail)) {
        return false;
      }

      if (
        stageFilter !== 'all' &&
        !row.stage_focus.toLowerCase().includes(stageFilter.toLowerCase())
      ) {
        return false;
      }

      if (
        focusFilter !== 'all' &&
        !row.investment_focus.toLowerCase().includes(focusFilter.toLowerCase())
      ) {
        return false;
      }

      if (regionFilters.length > 0) {
        const rowRegions = (row.geographic_investment_focus || '')
          .split(',')
          .map((region) => region.trim())
          .filter(Boolean);
        const hasMatchingRegion = regionFilters.some((selectedRegion) =>
          rowRegions.includes(selectedRegion)
        );
        if (!hasMatchingRegion) {
          return false;
        }
      }

      return true;
    });

    return [...base].sort((a, b) => {
      if (sortBy === 'name_desc') {
        return b.name.localeCompare(a.name);
      }
      if (sortBy === 'country_asc') {
        return (a.base_country || 'ZZZ').localeCompare(b.base_country || 'ZZZ');
      }
      if (sortBy === 'email_first') {
        const aHasEmail = a.public_contact_email ? 1 : 0;
        const bHasEmail = b.public_contact_email ? 1 : 0;
        if (aHasEmail !== bHasEmail) {
          return bHasEmail - aHasEmail;
        }
        return a.name.localeCompare(b.name);
      }
      if (sortBy === 'newest_contact') {
        const aScore = (a.linkedin_profile_url ? 1 : 0) + (a.public_contact_email ? 1 : 0);
        const bScore = (b.linkedin_profile_url ? 1 : 0) + (b.public_contact_email ? 1 : 0);
        if (aScore !== bScore) {
          return bScore - aScore;
        }
        return a.name.localeCompare(b.name);
      }
      return a.name.localeCompare(b.name);
    });
  }, [
    classification,
    contactFilter,
    countryFilter,
    focusFilter,
    regionFilters,
    rows,
    search,
    sortBy,
    stageFilter,
  ]);

  const pageCount = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, pageCount);
  const pagedRows = filteredRows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    search,
    classification,
    countryFilter,
    contactFilter,
    stageFilter,
    focusFilter,
    regionFilters,
    sortBy,
  ]);

  const hasLinkedInCount = useMemo(
    () =>
      rows.filter((row) => row.linkedin_profile_url && row.linkedin_profile_url.trim() !== '')
        .length,
    [rows]
  );

  const exportFilteredCsv = () => {
    const csvContent = toCsv(filteredRows);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'salesparrot-openlist-african-investors-filtered.csv';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  const copyEmail = async (email: string) => {
    try {
      await navigator.clipboard.writeText(email);
      setCopiedEmail(email);
      setTimeout(() => setCopiedEmail(''), 1800);
    } catch {
      setCopiedEmail('');
    }
  };

  const resetFilters = () => {
    setSearch('');
    setClassification('all');
    setCountryFilter('all');
    setContactFilter('all');
    setStageFilter('all');
    setFocusFilter('all');
    setRegionFilters([]);
    setSortBy('email_first');
  };

  const toggleRegionFilter = (region: string) => {
    setRegionFilters((current) =>
      current.includes(region)
        ? current.filter((selectedRegion) => selectedRegion !== region)
        : [...current, region]
    );
  };

  return (
    <section className="bg-[#F8FAFC] py-6 sm:py-8">
      <Container>
        <div className="relative mb-4 overflow-hidden rounded-2xl border border-[#DDE5EE] bg-[linear-gradient(180deg,#FFFFFF_0%,#F7FBFF_100%)] p-4 shadow-[0_14px_40px_rgba(15,23,42,0.09)] sm:p-6">
          <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[#F97316]/15 blur-3xl" />
          <div className="bg-[#0EA5E9]/14 pointer-events-none absolute -left-24 bottom-0 h-52 w-52 rounded-full blur-3xl" />

          <div className="relative z-10">
            <div className="mx-auto max-w-4xl text-center">
              <p className="inline-flex items-center rounded-full border border-[#99E9FF] bg-[#ECFEFF] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.11em] text-[#0E7490]">
                SalesParrot Open Lists
              </p>
              <h1 className="mt-3 text-[32px] font-semibold leading-[1.05] tracking-[-0.03em] text-[#0F172A] sm:text-[46px]">
                Welcome to Open Lists by SalesParrot
              </h1>
              <p className="mx-auto mt-3 max-w-3xl text-sm leading-relaxed text-[#475569] sm:text-base">
                Open Lists is a{' '}
                <span
                  className="inline whitespace-nowrap rounded-full px-2.5 py-0.5 font-semibold"
                  style={{ backgroundColor: 'rgba(20, 184, 166, 0.15)', color: '#0D9488' }}
                >
                  free library
                </span>{' '}
                of{' '}
                <span
                  className="inline whitespace-nowrap rounded-full px-2.5 py-0.5 font-semibold"
                  style={{ backgroundColor: 'rgba(14, 165, 233, 0.14)', color: '#0369A1' }}
                >
                  highly researched niche lists
                </span>{' '}
                built to be{' '}
                <span
                  className="inline whitespace-nowrap rounded-full px-2.5 py-0.5 font-semibold"
                  style={{ backgroundColor: 'rgba(255, 107, 53, 0.15)', color: '#EA580C' }}
                >
                  instantly accessible
                </span>{' '}
                and{' '}
                <span
                  className="inline whitespace-nowrap rounded-full px-2.5 py-0.5 font-semibold"
                  style={{ backgroundColor: 'rgba(251, 146, 60, 0.14)', color: '#C2410C' }}
                >
                  free to download
                </span>
                .
              </p>

              <div className="mx-auto mt-4 w-full max-w-[620px]">
                <label
                  htmlFor="open-list-selector"
                  className="mb-1.5 block text-center text-[11px] font-semibold uppercase tracking-[0.09em] text-[#64748B]"
                >
                  Select open list
                </label>
                <select
                  id="open-list-selector"
                  value={selectedOpenList}
                  onChange={(event) => setSelectedOpenList(event.target.value)}
                  className="w-full rounded-xl border border-[#CBD5E1] bg-white px-3.5 py-3 text-base font-semibold text-[#0F172A] outline-none focus:border-[#14B8A6]"
                >
                  <option value="african_angel_investors_family_offices">
                    African and Africa-Focused Angel Investors and Family Offices (Global)
                  </option>
                  <option value="more_open_lists_coming" disabled>
                    More open-lists to be added
                  </option>
                </select>
                <p className="mt-2 text-center text-sm leading-relaxed text-[#475569]">
                  Includes Africa-based investors and diaspora investors who back startups in the
                  US, Europe, Africa, and other global markets.
                </p>
              </div>

              <div className="mx-auto mt-3 max-w-2xl rounded-xl border border-[#E6EEF7] bg-white/80 px-4 py-3">
                <p className="text-center text-sm italic leading-relaxed text-[#334155]">
                  "The right angel investors during a crucial building time can be a lot more
                  beneficial than going through the arduous process of diligence with VCs in the
                  same amount of time. You can close angels in a few days. VCs can take months"
                </p>
                <p className="mt-1 text-center text-xs font-semibold uppercase tracking-[0.08em] text-[#64748B]">
                  ENI MAJ
                </p>
              </div>
            </div>
          </div>

          <div className="relative z-10 mt-4 grid gap-2 sm:grid-cols-2">
            <div className="rounded-xl border border-[#E2E8F0] bg-white p-3.5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#64748B]">
                Total leads
              </p>
              <p className="mt-0.5 text-[30px] font-bold leading-none text-[#0F172A]">
                {rows.length}
              </p>
            </div>
            <div className="rounded-xl border border-[#E2E8F0] bg-white p-3.5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#64748B]">
                LinkedIn available
              </p>
              <p className="mt-0.5 text-[30px] font-bold leading-none text-[#0F172A]">
                {hasLinkedInCount}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[#E2E8F0] bg-white shadow-[0_10px_34px_rgba(15,23,42,0.06)]">
          <div className="border-b border-[#E2E8F0] p-4 sm:p-5">
            <div className="flex flex-col gap-3">
              <div className="flex w-full flex-col gap-3 sm:flex-row">
                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by name, location, focus, or company"
                  className="w-full rounded-lg border border-[#CBD5E1] px-3 py-2 text-sm text-[#0F172A] outline-none ring-0 placeholder:text-[#94A3B8] focus:border-[#14B8A6]"
                />
                <select
                  value={sortBy}
                  onChange={(event) =>
                    setSortBy(
                      event.target.value as
                        | 'name_asc'
                        | 'name_desc'
                        | 'country_asc'
                        | 'newest_contact'
                        | 'email_first'
                    )
                  }
                  className="w-full rounded-lg border border-[#CBD5E1] px-3 py-2 text-sm text-[#0F172A] outline-none sm:w-[220px]"
                >
                  <option value="email_first">Sort: Email first</option>
                  <option value="name_asc">Sort: Name A-Z</option>
                  <option value="name_desc">Sort: Name Z-A</option>
                  <option value="country_asc">Sort: Country A-Z</option>
                  <option value="newest_contact">Sort: Most contact channels</option>
                </select>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
                <select
                  value={classification}
                  onChange={(event) =>
                    setClassification(
                      event.target.value as 'all' | 'africa' | 'diaspora' | 'unresolved'
                    )
                  }
                  className="w-full rounded-lg border border-[#CBD5E1] px-3 py-2 text-sm text-[#0F172A] outline-none"
                >
                  <option value="all">All base categories</option>
                  <option value="africa">Africa-based</option>
                  <option value="diaspora">Global / diaspora (Africa-focused)</option>
                  <option value="unresolved">Base not publicly verified</option>
                </select>

                <select
                  value={countryFilter}
                  onChange={(event) => setCountryFilter(event.target.value)}
                  className="w-full rounded-lg border border-[#CBD5E1] px-3 py-2 text-sm text-[#0F172A] outline-none"
                >
                  <option value="all">All countries</option>
                  {countryOptions.map((country) => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))}
                </select>

                <select
                  value={contactFilter}
                  onChange={(event) =>
                    setContactFilter(event.target.value as 'all' | 'linkedin' | 'email' | 'both')
                  }
                  className="w-full rounded-lg border border-[#CBD5E1] px-3 py-2 text-sm text-[#0F172A] outline-none"
                >
                  <option value="all">All contacts</option>
                  <option value="linkedin">Has LinkedIn</option>
                  <option value="email">Has email</option>
                  <option value="both">Has both</option>
                </select>

                <select
                  value={stageFilter}
                  onChange={(event) => setStageFilter(event.target.value)}
                  className="w-full rounded-lg border border-[#CBD5E1] px-3 py-2 text-sm text-[#0F172A] outline-none"
                >
                  <option value="all">All stages</option>
                  {stageOptions.map((stage) => (
                    <option key={stage} value={stage}>
                      {stage}
                    </option>
                  ))}
                </select>

                <select
                  value={focusFilter}
                  onChange={(event) => setFocusFilter(event.target.value)}
                  className="w-full rounded-lg border border-[#CBD5E1] px-3 py-2 text-sm text-[#0F172A] outline-none"
                >
                  <option value="all">All focus tags</option>
                  {focusOptions.map((focus) => (
                    <option key={focus} value={focus}>
                      {focus}
                    </option>
                  ))}
                </select>

              </div>

              <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#64748B]">
                  Base category definitions
                </p>
                <div className="mt-2 grid gap-2 sm:grid-cols-3">
                  {[
                    getClassificationMeta('Africa-based'),
                    getClassificationMeta('Diaspora / outside Africa'),
                    getClassificationMeta('Unresolved'),
                  ].map((item) => (
                    <div key={item.label} className="rounded-lg border border-[#E2E8F0] bg-white p-2.5">
                      <span
                        className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ${item.tone}`}
                      >
                        {item.label}
                      </span>
                      <p className="mt-1.5 text-xs leading-relaxed text-[#475569]">
                        {item.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#64748B]">
                    Region tags (multi-select)
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsRegionFilterExpanded((current) => !current)}
                      className="rounded-md border border-[#CBD5E1] bg-white px-2 py-1 text-xs font-semibold text-[#334155] transition-colors hover:bg-[#F1F5F9]"
                    >
                      {isRegionFilterExpanded ? 'Collapse' : 'Choose regions'}
                    </button>
                    {regionFilters.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setRegionFilters([])}
                        className="rounded-md border border-[#CBD5E1] bg-white px-2 py-1 text-xs font-semibold text-[#334155] transition-colors hover:bg-[#F1F5F9]"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                {!isRegionFilterExpanded && regionFilters.length === 0 && (
                  <p className="mt-2 text-xs text-[#64748B]">
                    No region selected. Click "Choose regions" to filter by one or more regions.
                  </p>
                )}

                {regionFilters.length > 0 && (
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <span className="text-xs font-medium text-[#64748B]">Selected:</span>
                    {regionFilters.map((region) => (
                      <button
                        key={`selected-${region}`}
                        type="button"
                        onClick={() => toggleRegionFilter(region)}
                        className="rounded-full border border-[#BAE6FD] bg-[#EFF6FF] px-2 py-0.5 text-xs font-semibold text-[#0369A1]"
                      >
                        {region} ×
                      </button>
                    ))}
                  </div>
                )}

                {isRegionFilterExpanded && (
                  <div className="mt-2 flex max-h-40 flex-wrap gap-2 overflow-auto pr-1">
                    {regionOptions.map((region) => {
                      const selected = regionFilters.includes(region);
                      return (
                        <button
                          type="button"
                          key={region}
                          onClick={() => toggleRegionFilter(region)}
                          className={`rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors ${
                            selected
                              ? 'border-[#0EA5E9] bg-[#E0F2FE] text-[#0C4A6E]'
                              : 'border-[#CBD5E1] bg-white text-[#334155] hover:bg-[#F1F5F9]'
                          }`}
                        >
                          {region}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm font-medium text-[#64748B]">
                  Showing {filteredRows.length} record{filteredRows.length === 1 ? '' : 's'}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="inline-flex rounded-md border border-[#CBD5E1] bg-white p-0.5 md:hidden">
                    <button
                      onClick={() => setMobileView('list')}
                      className={`rounded px-2.5 py-1 text-xs font-semibold transition-colors ${
                        mobileView === 'list' ? 'bg-[#0F172A] text-white' : 'text-[#334155]'
                      }`}
                    >
                      List
                    </button>
                    <button
                      onClick={() => setMobileView('cards')}
                      className={`rounded px-2.5 py-1 text-xs font-semibold transition-colors ${
                        mobileView === 'cards' ? 'bg-[#0F172A] text-white' : 'text-[#334155]'
                      }`}
                    >
                      Cards
                    </button>
                  </div>
                  <button
                    onClick={resetFilters}
                    className="inline-flex w-fit rounded-md border border-[#CBD5E1] px-3 py-1.5 text-sm font-semibold text-[#334155] transition-colors hover:bg-[#F8FAFC]"
                  >
                    Reset filters
                  </button>
                </div>
              </div>

              <div className="mt-1 border-t border-[#E2E8F0] pt-3">
                <div className="flex flex-wrap gap-2.5">
                  <Link
                    to="/openlists/pricing"
                    className="w-full rounded-xl bg-[#FF6B35] px-4 py-2.5 text-center text-sm font-semibold text-white shadow-[0_8px_24px_rgba(255,107,53,0.3)] transition-colors hover:bg-[#E85A2A] sm:w-auto"
                  >
                    Launch outreach using SalesParrot
                  </Link>
                  <button
                    onClick={exportFilteredCsv}
                    className="w-full rounded-xl border border-[#CBD5E1] bg-white px-4 py-2.5 text-sm font-semibold text-[#1E293B] transition-colors hover:border-[#94A3B8] hover:bg-[#F8FAFC] sm:w-auto"
                  >
                    Export filtered CSV
                  </button>
                  <a
                    href={DATASET_URL}
                    download
                    className="w-full rounded-xl border border-[#CBD5E1] bg-white px-4 py-2.5 text-center text-sm font-semibold text-[#1E293B] transition-colors hover:border-[#94A3B8] hover:bg-[#F8FAFC] sm:w-auto"
                  >
                    Download full CSV
                  </a>
                </div>
                <p className="mt-2 text-sm font-medium leading-relaxed text-[#F97316]">
                  SalesParrot finds non-public investor emails, personalizes outreach in your voice,
                  and auto-follows up to book meetings with these investors.
                </p>
              </div>
            </div>
          </div>

          <div className="hidden overflow-auto md:block">
            <table className="w-full min-w-[1120px]">
              <thead className="bg-[#F8FAFC]">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-[#64748B]">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-[#64748B]">
                    Base
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-[#64748B]">
                    Base category
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-[#64748B]">
                    Focus
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-[#64748B]">
                    Stage
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-[#64748B]">
                    Check Size
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-[#64748B]">
                    Contact
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-sm text-[#64748B]">
                      Loading open list...
                    </td>
                  </tr>
                )}

                {!loading && pagedRows.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-sm text-[#64748B]">
                      No records match your filters.
                    </td>
                  </tr>
                )}

                {!loading &&
                  pagedRows.map((lead, index) => (
                    <tr
                      key={`${lead.name}-${lead.linkedin_profile_url}-${index}`}
                      className="border-t border-[#F1F5F9]"
                    >
                      <td className="px-4 py-3 align-top">
                        <p className="font-semibold text-[#0F172A]">{lead.name || 'Unknown'}</p>
                        {lead.current_company_or_firm && (
                          <p className="mt-1 text-xs text-[#64748B]">
                            {lead.current_company_or_firm}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 align-top text-sm text-[#334155]">
                        {lead.base_location || lead.base_country || 'Not specified'}
                      </td>
                      <td className="px-4 py-3 align-top">
                        {(() => {
                          const classificationMeta = getClassificationMeta(lead.base_classification);
                          return (
                            <span
                              className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${classificationMeta.tone}`}
                              title={classificationMeta.description}
                            >
                              {classificationMeta.label}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="px-4 py-3 align-top text-sm text-[#334155]">
                        <div className="flex flex-col gap-1.5">
                          <span>{lead.investment_focus || 'Not specified'}</span>
                          <span className="text-xs text-[#64748B]">
                            Region: {lead.geographic_investment_focus || 'Not specified'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top text-sm text-[#334155]">
                        {lead.stage_focus || 'Not specified'}
                      </td>
                      <td className="px-4 py-3 align-top text-sm text-[#334155]">
                        <div className="flex flex-col gap-1.5">
                          <span className="inline-flex w-fit rounded-full border border-[#FED7AA] bg-[#FFF7ED] px-2 py-0.5 text-xs font-semibold text-[#C2410C]">
                            Est. check: {getEstimatedCheckSize(lead.stage_focus || '')}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top text-sm">
                        <ContactBlock
                          lead={lead}
                          copiedEmail={copiedEmail}
                          onCopyEmail={copyEmail}
                          compact
                        />
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-3 p-3 md:hidden">
            {loading && (
              <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 text-sm text-[#64748B]">
                Loading open list...
              </div>
            )}
            {!loading && pagedRows.length === 0 && (
              <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 text-sm text-[#64748B]">
                No records match your filters.
              </div>
            )}
            {!loading &&
              mobileView === 'cards' &&
              pagedRows.map((lead, index) => (
                <article
                  key={`${lead.name}-${lead.linkedin_profile_url}-${index}-mobile`}
                  className="rounded-xl border border-[#E2E8F0] bg-white p-4"
                >
                  <p className="text-base font-semibold text-[#0F172A]">{lead.name || 'Unknown'}</p>
                  {lead.current_company_or_firm && (
                    <p className="mt-1 text-xs text-[#64748B]">{lead.current_company_or_firm}</p>
                  )}
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {(() => {
                      const classificationMeta = getClassificationMeta(lead.base_classification);
                      return (
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${classificationMeta.tone}`}
                          title={classificationMeta.description}
                        >
                          {classificationMeta.label}
                        </span>
                      );
                    })()}
                    <span className="text-xs text-[#64748B]">
                      {lead.base_location || lead.base_country || 'Not specified'}
                    </span>
                  </div>
                  <p className="mt-3 text-xs font-semibold uppercase tracking-[0.08em] text-[#64748B]">
                    Investment Focus
                  </p>
                  <p className="mt-1 text-sm text-[#334155]">
                    {lead.investment_focus || 'Not specified'}
                  </p>
                  <p className="mt-2 text-xs font-semibold uppercase tracking-[0.08em] text-[#64748B]">
                    Region Focus
                  </p>
                  <p className="mt-1 text-sm text-[#334155]">
                    {lead.geographic_investment_focus || 'Not specified'}
                  </p>
                  <p className="mt-3 text-xs font-semibold uppercase tracking-[0.08em] text-[#64748B]">
                    Stage
                  </p>
                  <p className="mt-1 text-sm text-[#334155]">
                    {lead.stage_focus || 'Not specified'}
                  </p>
                  <p className="mt-3 text-xs font-semibold uppercase tracking-[0.08em] text-[#64748B]">
                    Check Size
                  </p>
                  <div className="mt-1">
                    <span className="inline-flex rounded-full border border-[#FED7AA] bg-[#FFF7ED] px-2 py-0.5 text-xs font-semibold text-[#C2410C]">
                      Est. check: {getEstimatedCheckSize(lead.stage_focus || '')}
                    </span>
                  </div>
                  <div className="mt-4 border-t border-[#F1F5F9] pt-3">
                    <ContactBlock lead={lead} copiedEmail={copiedEmail} onCopyEmail={copyEmail} />
                  </div>
                </article>
              ))}
            {!loading && mobileView === 'list' && (
              <MobileListRows leads={pagedRows} copiedEmail={copiedEmail} onCopyEmail={copyEmail} />
            )}
          </div>

          <div className="flex items-center justify-between border-t border-[#E2E8F0] px-4 py-3 sm:px-5">
            <p className="text-sm text-[#64748B]">
              Page {safePage} of {pageCount}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={safePage <= 1}
                className="rounded-md border border-[#CBD5E1] px-3 py-1.5 text-sm font-semibold text-[#334155] transition-colors hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage((page) => Math.min(pageCount, page + 1))}
                disabled={safePage >= pageCount}
                className="rounded-md border border-[#CBD5E1] px-3 py-1.5 text-sm font-semibold text-[#334155] transition-colors hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

function MobileListRows({
  leads,
  copiedEmail,
  onCopyEmail,
}: {
  leads: OpenListLead[];
  copiedEmail: string;
  onCopyEmail: (email: string) => void;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-[#E2E8F0] bg-white">
      <div className="border-b border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2 text-[11px] font-semibold text-[#475569]">
        Tip: switch to <span className="text-[#0F172A]">Cards</span> to see full investor details.
      </div>
      <div className="grid grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)_auto] gap-2 border-b border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#64748B]">
        <span>Name</span>
        <span>Email</span>
        <span>LinkedIn</span>
      </div>
      {leads.map((lead, index) => (
        <div
          key={`${lead.name}-${lead.linkedin_profile_url}-${index}-mobile-list`}
          className="grid grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)_auto] items-start gap-2 border-b border-[#F1F5F9] px-3 py-2.5 last:border-b-0"
        >
          <div className="min-w-0">
            <p className="break-words text-sm font-semibold text-[#0F172A]">
              {lead.name || 'Unknown'}
            </p>
            {lead.current_company_or_firm && (
              <p className="mt-0.5 break-words text-[11px] text-[#64748B]">
                {lead.current_company_or_firm}
              </p>
            )}
            <p className="mt-0.5 text-[11px] text-[#64748B]">{lead.base_country || 'N/A'}</p>
            <p className="mt-0.5 text-[11px] text-[#64748B]">
              Check (est.): {getEstimatedCheckSize(lead.stage_focus || '')}
            </p>
          </div>
          <div className="min-w-0">
            {lead.public_contact_email ? (
              <>
                <p className="select-all break-all text-[11px] font-medium text-[#0F766E]">
                  {lead.public_contact_email}
                </p>
                <button
                  onClick={() => onCopyEmail(lead.public_contact_email)}
                  className="mt-1 rounded border border-[#CBD5E1] px-1.5 py-0.5 text-[10px] font-semibold text-[#334155]"
                >
                  {copiedEmail === lead.public_contact_email ? 'Copied' : 'Copy'}
                </button>
              </>
            ) : (
              <span className="text-[11px] text-[#94A3B8]">None</span>
            )}
          </div>
          <div className="pt-0.5">
            {lead.linkedin_profile_url ? (
              <a
                href={lead.linkedin_profile_url}
                target="_blank"
                rel="noreferrer"
                aria-label={`Open ${lead.name} LinkedIn profile`}
                className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-[#BFDBFE] bg-[#EFF6FF] text-[#0A66C2]"
              >
                <LinkedInIcon />
              </a>
            ) : (
              <span className="text-[11px] text-[#94A3B8]">None</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function ContactBlock({
  lead,
  copiedEmail,
  onCopyEmail,
  compact = false,
}: {
  lead: OpenListLead;
  copiedEmail: string;
  onCopyEmail: (email: string) => void;
  compact?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2.5">
      {lead.linkedin_profile_url ? (
        <a
          href={lead.linkedin_profile_url}
          target="_blank"
          rel="noreferrer"
          aria-label={`Open ${lead.name} LinkedIn profile`}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#BFDBFE] bg-[#EFF6FF] text-[#0A66C2] transition-colors hover:bg-[#DBEAFE]"
        >
          <LinkedInIcon />
        </a>
      ) : (
        <span className="text-[#94A3B8]">No LinkedIn</span>
      )}
      {lead.public_contact_email ? (
        <div className={`flex ${compact ? `flex-col items-start` : `items-center`} gap-2`}>
          <span className="select-all break-all rounded-md bg-[#F8FAFC] px-2 py-1 font-mono text-xs text-[#0F766E]">
            {lead.public_contact_email}
          </span>
          <button
            onClick={() => onCopyEmail(lead.public_contact_email)}
            className="rounded-md border border-[#CBD5E1] px-2 py-1 text-xs font-semibold text-[#334155] transition-colors hover:bg-[#F8FAFC]"
          >
            {copiedEmail === lead.public_contact_email ? 'Copied' : 'Copy'}
          </button>
        </div>
      ) : (
        <span className="text-[#94A3B8]">No public email</span>
      )}
    </div>
  );
}

function LinkedInIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
      <path d="M4.98 3.5A2.49 2.49 0 1 0 5 8.48 2.49 2.49 0 0 0 4.98 3.5zM3 9h4v12H3zM9 9h3.83v1.71h.05c.53-1 1.83-2.06 3.77-2.06 4.03 0 4.77 2.65 4.77 6.09V21h-4v-5.54c0-1.32-.02-3.01-1.84-3.01-1.85 0-2.13 1.44-2.13 2.92V21H9z" />
    </svg>
  );
}
