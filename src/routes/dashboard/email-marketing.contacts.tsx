import { createFileRoute } from '@tanstack/react-router';
import { useRef, useState } from 'react';

import { useImportMarketingContactsCSV, useMarketingLists } from '@/lib/hooks/queries';
import { showErrorToast, showSuccessToast } from '@/lib/toast';
import { useCurrentWorkspace } from '@/lib/workspace';

export const Route = createFileRoute('/dashboard/email-marketing/contacts')({
  component: EmailMarketingContactsPage,
});

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

  const canSubmitImport =
    workspaceId &&
    csvFile &&
    ((importListId && !newListNameForImport.trim()) ||
      (!importListId && newListNameForImport.trim().length > 0));

  const parseCsvPreview = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = String(event.target?.result || '');
      const lines = text
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);
      if (lines.length === 0) {
        setCsvPreviewHeaders([]);
        setCsvPreviewRows([]);
        return;
      }
      const headers = lines[0].split(',').map((cell) => cell.trim());
      const rows = lines.slice(1, 6).map((line) => line.split(',').map((cell) => cell.trim()));
      setCsvPreviewHeaders(headers);
      setCsvPreviewRows(rows);
      setColumnMapping(
        Object.fromEntries(
          headers.map((header) => {
            const normalized = header.toLowerCase().replace(/\s+/g, '_');
            const defaultTarget =
              normalized === 'email' || normalized === 'email_address'
                ? 'email'
                : normalized === 'first_name' || normalized === 'firstname'
                  ? 'first_name'
                  : normalized === 'last_name' || normalized === 'lastname'
                    ? 'last_name'
                    : normalized === 'timezone' || normalized === 'time_zone'
                      ? 'timezone'
                      : header;
            return [header, defaultTarget];
          })
        )
      );
    };
    reader.readAsText(file);
  };

  const applySelectedCsvFile = (file: File | null) => {
    setCsvFile(file);
    setLastImportErrors([]);
    setLastImportIssues([]);
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
    const lines = text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    if (lines.length === 0) return file;
    const sourceHeaders = lines[0].split(',').map((cell) => cell.trim());
    const mappedHeaders = sourceHeaders.map((header) => mapping[header] || header);
    const remapped = [mappedHeaders.join(','), ...lines.slice(1)].join('\n');
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
            accept=".csv"
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
            disabled={!canSubmitImport || importCsvMutation.isPending}
            className="rounded-lg bg-[#0F766E] px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {importCsvMutation.isPending ? 'Importing...' : 'Import CSV'}
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
                  <select
                    value={columnMapping[header] || header}
                    onChange={(e) =>
                      setColumnMapping((current) => ({ ...current, [header]: e.target.value }))
                    }
                    className="mt-2 w-full rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm focus:border-[#FF6B35] focus:outline-none"
                  >
                    <option value="email">Email</option>
                    <option value="first_name">First name</option>
                    <option value="last_name">Last name</option>
                    <option value="timezone">Timezone</option>
                    <option value={header}>Keep original field</option>
                  </select>
                </div>
              ))}
            </div>
            <div className="mt-3 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[#E2E8F0] text-[#64748B]">
                    {csvPreviewHeaders.map((header) => (
                      <th key={header} className="px-2 py-2 font-medium">
                        {columnMapping[header] || header}
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
