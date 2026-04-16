import { createFileRoute } from '@tanstack/react-router';
import { useRef, useState } from 'react';

import { useImportMarketingContactsCSV, useMarketingLists } from '@/lib/hooks/queries';
import { showErrorToast, showSuccessToast } from '@/lib/toast';
import { useCurrentWorkspace } from '@/lib/workspace';

export const Route = createFileRoute('/dashboard/email-marketing/contacts')({
  component: EmailMarketingContactsPage,
});

type CoreField = 'email' | 'first_name' | 'last_name' | 'timezone';
type MappingTarget = CoreField | '__keep__' | '__ignore__';

type MappingSuggestion = {
  target: MappingTarget;
  confidence: 'high' | 'medium' | 'low';
  score: number;
  reason: string;
};

const FIELD_SYNONYMS: Record<CoreField, string[]> = {
  email: [
    'email',
    'email address',
    'email id',
    'mail',
    'work mail',
    'work email',
    'business email',
    'biz email',
    'professional email',
    'office email',
    'contact email',
    'primary email',
  ],
  first_name: ['first name', 'firstname', 'given name', 'forename', 'fname'],
  last_name: ['last name', 'lastname', 'surname', 'family name', 'lname'],
  timezone: ['timezone', 'time zone', 'tz', 'local timezone'],
};

function normalizeHeader(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function tokenize(value: string): string[] {
  return normalizeHeader(value)
    .split(' ')
    .map((token) => token.trim())
    .filter(Boolean);
}

function scoreHeaderAgainstSynonym(header: string, synonym: string): number {
  const normalizedHeader = normalizeHeader(header);
  const normalizedSynonym = normalizeHeader(synonym);
  if (!normalizedHeader || !normalizedSynonym) return 0;
  if (normalizedHeader === normalizedSynonym) return 1;
  if (
    normalizedHeader.includes(normalizedSynonym) ||
    normalizedSynonym.includes(normalizedHeader)
  ) {
    return 0.92;
  }

  const headerTokens = new Set(tokenize(header));
  const synonymTokens = tokenize(synonym);
  const overlap = synonymTokens.filter((token) => headerTokens.has(token)).length;
  if (overlap === 0) return 0;

  const tokenScore = overlap / synonymTokens.length;
  const coverageBoost = overlap / Math.max(headerTokens.size, 1);
  return Math.min(0.88, tokenScore * 0.7 + coverageBoost * 0.18);
}

function getSmartColumnSuggestion(header: string): MappingSuggestion {
  const normalizedHeader = normalizeHeader(header);
  let bestField: CoreField | null = null;
  let bestScore = 0;
  let bestReason = 'Will keep as a custom attribute.';

  (Object.entries(FIELD_SYNONYMS) as Array<[CoreField, string[]]>).forEach(([field, synonyms]) => {
    synonyms.forEach((synonym) => {
      const score = scoreHeaderAgainstSynonym(header, synonym);
      if (score > bestScore) {
        bestScore = score;
        bestField = field;
        bestReason =
          score >= 0.92
            ? `Strong match for ${field.replace('_', ' ')}`
            : `Likely ${field.replace('_', ' ')} based on similar wording`;
      }
    });
  });

  if (
    normalizedHeader.includes('mail') &&
    !normalizedHeader.includes('first') &&
    !normalizedHeader.includes('last')
  ) {
    if (bestScore < 0.9) {
      bestField = 'email';
      bestScore = 0.9;
      bestReason = 'Detected email-style wording.';
    }
  }

  if (!bestField || bestScore < 0.45) {
    return {
      target: '__keep__',
      confidence: 'low',
      score: bestScore,
      reason: 'No strong core-field match found, so this will stay as a custom attribute.',
    };
  }

  return {
    target: bestField,
    confidence: bestScore >= 0.9 ? 'high' : bestScore >= 0.7 ? 'medium' : 'low',
    score: bestScore,
    reason: bestReason,
  };
}

function detectDelimiter(text: string): ',' | ';' | '\t' {
  const firstLine = text.split(/\r?\n/).find((line) => line.trim()) || '';
  const candidates: Array<',' | ';' | '\t'> = [',', ';', '\t'];
  return candidates.reduce((best, candidate) => {
    const bestCount = firstLine.split(best).length;
    const candidateCount = firstLine.split(candidate).length;
    return candidateCount > bestCount ? candidate : best;
  }, ',');
}

function parseDelimitedLine(line: string, delimiter: string): string[] {
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

function escapeCsvCell(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function EmailMarketingContactsPage() {
  const { currentWorkspace } = useCurrentWorkspace();
  const workspaceId = currentWorkspace?.id || '';
  const { data: lists = [] } = useMarketingLists(workspaceId || undefined);
  const importCsvMutation = useImportMarketingContactsCSV();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvPreviewHeaders, setCsvPreviewHeaders] = useState<string[]>([]);
  const [csvPreviewRows, setCsvPreviewRows] = useState<string[][]>([]);
  const [csvDragActive, setCsvDragActive] = useState(false);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [importListId, setImportListId] = useState('');
  const [newListNameForImport, setNewListNameForImport] = useState('');
  const [lastImportErrors, setLastImportErrors] = useState<string[]>([]);
  const [lastImportIssues, setLastImportIssues] = useState<
    Array<{ row: number; email?: string | null; code: string; message: string }>
  >([]);
  const [duplicatePolicy, setDuplicatePolicy] = useState<'skip' | 'update_merge'>('update_merge');
  const [replaceAttributes, setReplaceAttributes] = useState(false);
  const [mappingSuggestions, setMappingSuggestions] = useState<Record<string, MappingSuggestion>>(
    {}
  );
  const [mappingConfirmed, setMappingConfirmed] = useState(false);

  const canSubmitImport =
    workspaceId &&
    csvFile &&
    ((importListId && !newListNameForImport.trim()) ||
      (!importListId && newListNameForImport.trim().length > 0));

  const parseCsvPreview = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = String(event.target?.result || '');
      const delimiter = detectDelimiter(text);
      const lines = text
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);
      if (lines.length === 0) {
        setCsvPreviewHeaders([]);
        setCsvPreviewRows([]);
        return;
      }
      const headers = parseDelimitedLine(lines[0], delimiter);
      const rows = lines.slice(1, 6).map((line) => parseDelimitedLine(line, delimiter));
      setCsvPreviewHeaders(headers);
      setCsvPreviewRows(rows);
      const suggestions = Object.fromEntries(
        headers.map((header) => [header, getSmartColumnSuggestion(header)])
      );
      setMappingSuggestions(suggestions);
      setColumnMapping(
        Object.fromEntries(headers.map((header) => [header, suggestions[header].target]))
      );
      setMappingConfirmed(false);
    };
    reader.readAsText(file);
  };

  const applySelectedCsvFile = (file: File | null) => {
    setCsvFile(file);
    setLastImportErrors([]);
    setLastImportIssues([]);
    setMappingSuggestions({});
    setMappingConfirmed(false);
    if (file) {
      parseCsvPreview(file);
      return;
    }
    setCsvPreviewHeaders([]);
    setCsvPreviewRows([]);
  };

  const handleImportCSV = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmitImport || !csvFile) return;
    try {
      const mappedFile = await buildMappedCsvFile(csvFile, columnMapping);
      const result = await importCsvMutation.mutateAsync({
        workspace_id: workspaceId,
        file: mappedFile,
        list_id: importListId || undefined,
        list_name: newListNameForImport.trim() || undefined,
        duplicate_policy: duplicatePolicy,
        replace_attributes: replaceAttributes,
      });
      setCsvFile(null);
      setCsvPreviewHeaders([]);
      setCsvPreviewRows([]);
      setNewListNameForImport('');
      setImportListId(result.list_id);
      setLastImportErrors(result.errors || []);
      setLastImportIssues(result.issues || []);
      setMappingConfirmed(false);
      showSuccessToast(
        'Contacts imported',
        `${result.created_contacts} new, ${result.updated_contacts} updated, ${result.skipped} skipped.`
      );
    } catch (error) {
      showErrorToast('CSV import failed', error instanceof Error ? error.message : undefined);
    }
  };

  const downloadWarnings = () => {
    if (lastImportErrors.length === 0 && lastImportIssues.length === 0) return;
    const rows = [['row', 'email', 'code', 'message']];
    if (lastImportIssues.length > 0) {
      lastImportIssues.forEach((issue) => {
        rows.push([String(issue.row), issue.email || '', issue.code, issue.message]);
      });
    } else {
      lastImportErrors.forEach((error, index) => {
        rows.push([String(index + 1), '', 'warning', error]);
      });
    }
    const csv = rows
      .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'email-marketing-import-report.csv';
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const buildMappedCsvFile = async (file: File, mapping: Record<string, string>) => {
    const text = await file.text();
    const delimiter = detectDelimiter(text);
    const lines = text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    if (lines.length === 0) return file;
    const sourceHeaders = parseDelimitedLine(lines[0], delimiter);
    const keptIndices = sourceHeaders
      .map((header, index) => ({ header, index, target: mapping[header] || '__keep__' }))
      .filter((item) => item.target !== '__ignore__');
    const mappedHeaders = keptIndices.map((item) =>
      item.target === '__keep__' ? item.header : item.target
    );
    const remappedRows = lines.slice(1).map((line) => {
      const cells = parseDelimitedLine(line, delimiter);
      return keptIndices.map((item) => escapeCsvCell(cells[item.index] || '')).join(',');
    });
    const remapped = [mappedHeaders.map(escapeCsvCell).join(','), ...remappedRows].join('\n');
    return new File([remapped], file.name, { type: 'text/csv' });
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-[#E2E8F0] bg-white p-5">
        <h2 className="text-lg font-semibold text-[#1E293B]">Import Contacts (CSV)</h2>
        <form className="mt-4 space-y-3" onSubmit={handleImportCSV}>
          <select
            value={importListId}
            onChange={(e) => {
              setImportListId(e.target.value);
              if (e.target.value) setNewListNameForImport('');
            }}
            className="w-full rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm focus:border-[#FF6B35] focus:outline-none"
          >
            <option value="">Select existing list</option>
            {lists.map((list) => (
              <option key={list.id} value={list.id}>
                {list.name}
              </option>
            ))}
          </select>
          <input
            value={newListNameForImport}
            onChange={(e) => {
              setNewListNameForImport(e.target.value);
              if (e.target.value.trim()) setImportListId('');
            }}
            placeholder="Or create list by name"
            className="w-full rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm focus:border-[#FF6B35] focus:outline-none"
          />

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.tsv,.txt"
            onChange={(e) => applySelectedCsvFile(e.target.files?.[0] || null)}
            className="hidden"
          />
          <div
            onDragEnter={(e) => {
              e.preventDefault();
              setCsvDragActive(true);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setCsvDragActive(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              setCsvDragActive(false);
            }}
            onDrop={(e) => {
              e.preventDefault();
              setCsvDragActive(false);
              const file = e.dataTransfer.files?.[0] || null;
              if (file && file.name.toLowerCase().endsWith('.csv')) {
                applySelectedCsvFile(file);
              } else {
                showErrorToast('Invalid file', 'Please drop a CSV file.');
              }
            }}
            className={`rounded-xl border-2 border-dashed p-6 text-center transition-colors ${
              csvDragActive ? 'border-[#FF6B35] bg-[#FFF7ED]' : 'border-[#CBD5E1] bg-[#F8FAFC]'
            }`}
          >
            <p className="text-sm font-medium text-[#1E293B]">Drop CSV here</p>
            <p className="mt-1 text-xs text-[#64748B]">
              or click to choose a file from your computer
            </p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mt-3 rounded-lg border border-[#FF6B35] px-4 py-2 text-sm font-medium text-[#FF6B35] hover:bg-[#FFF7ED]"
            >
              Select CSV File
            </button>
            {csvFile ? (
              <p className="mt-2 text-xs text-[#0F766E]">
                Selected: {csvFile.name} ({Math.ceil(csvFile.size / 1024)} KB)
              </p>
            ) : null}
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="space-y-2 text-sm text-[#334155]">
              <span className="font-medium">Duplicate policy</span>
              <select
                value={duplicatePolicy}
                onChange={(e) => setDuplicatePolicy(e.target.value as 'skip' | 'update_merge')}
                className="w-full rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm focus:border-[#FF6B35] focus:outline-none"
              >
                <option value="update_merge">Update and merge existing contacts</option>
                <option value="skip">Skip existing contacts</option>
              </select>
            </label>
            <label className="inline-flex items-center gap-2 self-end rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm text-[#334155]">
              <input
                type="checkbox"
                checked={replaceAttributes}
                onChange={(e) => setReplaceAttributes(e.target.checked)}
              />
              Replace existing custom attributes instead of merging
            </label>
          </div>

          <button
            type="submit"
            disabled={!canSubmitImport || importCsvMutation.isPending || !mappingConfirmed}
            className="rounded-lg bg-[#0F766E] px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {importCsvMutation.isPending
              ? 'Importing...'
              : mappingConfirmed
                ? 'Import CSV'
                : 'Confirm mapping to import'}
          </button>
        </form>
      </div>

      <div className="rounded-xl border border-[#E2E8F0] bg-white p-5">
        <h2 className="text-lg font-semibold text-[#1E293B]">CSV Preview</h2>
        {csvPreviewHeaders.length === 0 ? (
          <p className="mt-3 text-sm text-[#64748B]">
            Upload a CSV to preview headers and sample rows before import.
          </p>
        ) : (
          <>
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
                      {mappingSuggestions[header]?.reason || 'Custom attribute by default'}
                    </span>
                  </div>
                  <select
                    value={columnMapping[header] || '__keep__'}
                    onChange={(e) => {
                      const nextValue = e.target.value as MappingTarget;
                      setColumnMapping((current) => ({ ...current, [header]: nextValue }));
                      setMappingConfirmed(false);
                    }}
                    className="mt-2 w-full rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm focus:border-[#FF6B35] focus:outline-none"
                  >
                    <option value="email">Email</option>
                    <option value="first_name">First name</option>
                    <option value="last_name">Last name</option>
                    <option value="timezone">Timezone</option>
                    <option value="__keep__">Keep as custom attribute</option>
                    <option value="__ignore__">Ignore this column</option>
                  </select>
                </div>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3">
              <div>
                <div className="text-sm font-medium text-[#1E293B]">Review auto-mapping</div>
                <div className="mt-1 text-xs text-[#64748B]">
                  Most columns should already be correct. Confirm once you’re satisfied.
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMappingConfirmed(true)}
                className="rounded-lg border border-[#FF6B35] px-4 py-2 text-sm font-medium text-[#FF6B35] hover:bg-[#FFF7ED]"
              >
                Confirm mapping
              </button>
            </div>
            <div className="mt-3 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[#E2E8F0] text-[#64748B]">
                    {csvPreviewHeaders.map((header) => (
                      <th key={header} className="px-2 py-2 font-medium">
                        {columnMapping[header] === '__keep__'
                          ? header
                          : columnMapping[header] === '__ignore__'
                            ? `${header} (ignored)`
                            : columnMapping[header] || header}
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
          </>
        )}
        {lastImportErrors.length > 0 || lastImportIssues.length > 0 ? (
          <div className="mt-4 rounded-lg border border-[#FECACA] bg-[#FEF2F2] p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-medium text-[#991B1B]">Import warnings</div>
              <button
                type="button"
                onClick={downloadWarnings}
                className="rounded-md border border-[#FCA5A5] px-3 py-1 text-xs text-[#B91C1C]"
              >
                Download warnings
              </button>
            </div>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-[#B91C1C]">
              {lastImportIssues.length > 0
                ? lastImportIssues.slice(0, 10).map((issue) => (
                    <li key={`${issue.row}-${issue.code}-${issue.email || ''}`}>
                      Row {issue.row}
                      {issue.email ? ` (${issue.email})` : ''}: {issue.message}
                    </li>
                  ))
                : lastImportErrors.slice(0, 10).map((error) => <li key={error}>{error}</li>)}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
}
