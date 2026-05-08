export type LeadCoreField =
  | 'linkedin_url'
  | 'email'
  | 'first_name'
  | 'last_name'
  | 'company'
  | 'title'
  | 'headline'
  | 'location';

export type LeadMappingTarget = LeadCoreField | '__split_full_name__' | '__keep__' | '__ignore__';

export type LeadMappingSuggestion = {
  target: LeadMappingTarget;
  confidence: 'high' | 'medium' | 'low';
  score: number;
  reason: string;
};

export const LEAD_MAPPING_OPTIONS: Array<{ value: LeadMappingTarget; label: string }> = [
  { value: 'linkedin_url', label: 'LinkedIn URL' },
  { value: 'email', label: 'Email' },
  { value: 'first_name', label: 'First name' },
  { value: 'last_name', label: 'Last name' },
  { value: '__split_full_name__', label: 'Split into first + last name' },
  { value: 'company', label: 'Company' },
  { value: 'title', label: 'Title' },
  { value: 'headline', label: 'Headline' },
  { value: 'location', label: 'Location' },
  { value: '__keep__', label: 'Add to context field' },
  { value: '__ignore__', label: 'Ignore this column' },
];

export const LEAD_FIELD_SYNONYMS: Record<LeadCoreField, string[]> = {
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
  return parts.every((part) => /^[\p{L}'`.-]{2,}$/u.test(part));
}

function looksLikeSingleNamePartValue(value: string) {
  return /^[\p{L}'`.-]{2,}$/u.test(value.trim());
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
  if (parts.length >= 2 && parts.every((part) => /^[\p{L}.' -]{2,}$/u.test(part))) {
    return true;
  }
  const words = normalized.split(/\s+/).filter(Boolean);
  return words.length <= 4 && words.every((word) => /^[\p{L}.'-]{2,}$/u.test(word));
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

    if (linkedInRatio >= 0.6 && bestScore < 0.95) {
      bestField = 'linkedin_url';
      bestScore = 0.95;
      bestReason = 'Sample values look like LinkedIn profile URLs.';
    }
    if (emailRatio >= 0.6 && bestScore < 0.95) {
      bestField = 'email';
      bestScore = 0.95;
      bestReason = 'Sample values look like email addresses.';
    }
    if (fullNameRatio >= 0.6) {
      splitNameScore = 0.9;
      splitNameReason = 'Sample values look like full names and can be split automatically.';
    }
    if (
      (normalizedHeader.includes('first') || normalizedHeader === 'fname') &&
      singleNameRatio >= 0.6 &&
      bestScore < 0.92
    ) {
      bestField = 'first_name';
      bestScore = 0.92;
      bestReason = 'Header and sample values look like first names.';
    }
    if (
      (normalizedHeader.includes('last') ||
        normalizedHeader.includes('surname') ||
        normalizedHeader === 'lname') &&
      singleNameRatio >= 0.6 &&
      bestScore < 0.92
    ) {
      bestField = 'last_name';
      bestScore = 0.92;
      bestReason = 'Header and sample values look like last names.';
    }
    if (titleRatio >= 0.5 && bestScore < 0.84) {
      bestField = 'title';
      bestScore = 0.84;
      bestReason = 'Sample values look like job titles.';
    }
    if (headlineRatio >= 0.5 && bestScore < 0.82) {
      bestField = 'headline';
      bestScore = 0.82;
      bestReason = 'Sample values look like profile headlines.';
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
  }

  if (splitNameScore > bestScore && splitNameScore >= 0.82) {
    return {
      target: '__split_full_name__',
      score: splitNameScore,
      confidence: 'high',
      reason: splitNameReason,
    };
  }

  if (!bestField || bestScore < 0.45) {
    return {
      target: '__keep__',
      score: bestScore,
      confidence: 'low',
      reason: bestReason,
    };
  }

  return {
    target: bestField,
    score: bestScore,
    confidence: bestScore >= 0.9 ? 'high' : bestScore >= 0.7 ? 'medium' : 'low',
    reason: bestReason,
  };
}

export function autoMapLeadColumns(headers: string[], rows: string[][]) {
  const suggestions = Object.fromEntries(
    headers.map((header, columnIndex) => {
      const sampleValues = rows.map((row) => row[columnIndex] || '');
      return [header, getLeadColumnSuggestion(header, sampleValues)];
    })
  ) as Record<string, LeadMappingSuggestion>;

  const assigned = new Set<LeadMappingTarget>();

  headers.forEach((header) => {
    const suggestion = suggestions[header];
    if (!suggestion || suggestion.target === '__keep__' || suggestion.target === '__ignore__')
      return;

    if (assigned.has(suggestion.target)) {
      suggestions[header] = {
        target: '__keep__',
        score: suggestion.score * 0.5,
        confidence: 'low',
        reason: `${suggestion.reason} Another column already maps there.`,
      };
      return;
    }

    assigned.add(suggestion.target);
  });

  return suggestions;
}

export function splitFullName(value: string) {
  const normalized = value.trim().replace(/\s+/g, ' ');
  if (!normalized) {
    return { firstName: '', lastName: '' };
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

export function detectLeadDelimiter(text: string): ',' | ';' | '\t' {
  const firstLine = text.split(/\r?\n/, 1)[0] || '';
  const commaCount = (firstLine.match(/,/g) || []).length;
  const semicolonCount = (firstLine.match(/;/g) || []).length;
  const tabCount = (firstLine.match(/\t/g) || []).length;
  if (tabCount > commaCount && tabCount > semicolonCount) return '\t';
  if (semicolonCount > commaCount) return ';';
  return ',';
}

export function parseLeadDelimitedLine(line: string, delimiter: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"') {
      if (inQuotes && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (char === delimiter && !inQuotes) {
      values.push(current.trim());
      current = '';
      continue;
    }
    current += char;
  }

  values.push(current.trim());
  return values.map((value) => value.replace(/^"(.*)"$/, '$1').trim());
}

export function escapeLeadCsvCell(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function buildMappedLeadCsvFile(
  file: File,
  mapping: Record<string, LeadMappingTarget>
) {
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
}

export function getLeadMappingPreviewLabel(header: string, target?: LeadMappingTarget) {
  if (target === '__split_full_name__') return 'first_name + last_name';
  if (target === '__keep__' || !target) return header;
  if (target === '__ignore__') return `${header} (ignored)`;
  return target;
}
