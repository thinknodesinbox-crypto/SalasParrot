import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';

import { SuggestedDraftsPanel } from '@/components/ai/SuggestedDraftsPanel';
import { LazyRichTextEditor } from '@/components/ui/LazyRichTextEditor';
import {
  useCreateMarketingTemplate,
  useDeleteMarketingTemplate,
  useEmailAccounts,
  useMarketingTemplates,
  usePreviewMarketingTemplate,
  useSequenceStepSuggestions,
  useSendMarketingTemplateTest,
  useUpdateMarketingTemplate,
} from '@/lib/hooks/queries';
import type { SequenceStepSuggestionsResponse } from '@/lib/types';
import { showErrorToast, showSuccessToast } from '@/lib/toast';
import { useCurrentWorkspace } from '@/lib/workspace';

export const Route = createFileRoute('/dashboard/email-marketing/templates')({
  component: EmailMarketingTemplatesPage,
});

function EmailMarketingTemplatesPage() {
  const { currentWorkspace } = useCurrentWorkspace();
  const workspaceId = currentWorkspace?.id || '';
  const { data: templates = [] } = useMarketingTemplates(workspaceId || undefined);
  const { data: emailAccounts = [] } = useEmailAccounts(
    workspaceId ? { workspace_id: workspaceId } : undefined
  );
  const createTemplateMutation = useCreateMarketingTemplate();
  const updateTemplateMutation = useUpdateMarketingTemplate();
  const deleteTemplateMutation = useDeleteMarketingTemplate();
  const previewTemplateMutation = usePreviewMarketingTemplate();
  const testSendMutation = useSendMarketingTemplateTest();
  const lastTemplateSuggestionSignature = useRef<string | null>(null);
  const {
    mutate: requestTemplateSuggestionsMutation,
    data: templateSuggestionData,
    error: templateSuggestionErrorValue,
    isPending: isTemplateSuggestionsPending,
  } = useSequenceStepSuggestions();

  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [templateName, setTemplateName] = useState('');
  const [templateSubject, setTemplateSubject] = useState('');
  const [templateBody, setTemplateBody] = useState('');
  const [personalizationEnabled, setPersonalizationEnabled] = useState(false);
  const [personalizationMode, setPersonalizationMode] = useState<'first_line' | 'full_message'>(
    'first_line'
  );
  const [testSenderId, setTestSenderId] = useState('');
  const [testEmail, setTestEmail] = useState('');

  const selectedTemplate = templates.find((template) => template.id === selectedTemplateId) || null;

  useEffect(() => {
    if (!selectedTemplate && templates[0]) {
      setSelectedTemplateId(templates[0].id);
      return;
    }
    if (!selectedTemplate) {
      setTemplateName('');
      setTemplateSubject('');
      setTemplateBody('');
      setPersonalizationEnabled(false);
      setPersonalizationMode('first_line');
      return;
    }
    setTemplateName(selectedTemplate.name);
    setTemplateSubject(selectedTemplate.subject_template);
    setTemplateBody(selectedTemplate.body_template);
    setPersonalizationEnabled(selectedTemplate.personalization_enabled);
    setPersonalizationMode(
      selectedTemplate.personalization_mode === 'full_message' ? 'full_message' : 'first_line'
    );
  }, [selectedTemplate, templates]);

  const canSubmit =
    workspaceId && templateName.trim() && templateSubject.trim() && templateBody.trim();

  const handleCreateTemplate = async () => {
    if (!canSubmit) return;
    try {
      const created = await createTemplateMutation.mutateAsync({
        workspace_id: workspaceId,
        name: templateName.trim(),
        subject_template: templateSubject.trim(),
        body_template: templateBody,
        personalization_enabled: personalizationEnabled,
        personalization_mode: personalizationMode,
      });
      setSelectedTemplateId(created.id);
      showSuccessToast('Template created', `"${created.name}" is ready.`);
    } catch (error) {
      showErrorToast(
        'Failed to create template',
        error instanceof Error ? error.message : undefined
      );
    }
  };

  const handleUpdateTemplate = async () => {
    if (!selectedTemplate || !canSubmit) return;
    try {
      await updateTemplateMutation.mutateAsync({
        templateId: selectedTemplate.id,
        workspace_id: workspaceId,
        name: templateName.trim(),
        subject_template: templateSubject.trim(),
        body_template: templateBody,
        personalization_enabled: personalizationEnabled,
        personalization_mode: personalizationMode,
      });
      showSuccessToast('Template updated', `"${templateName.trim()}" saved.`);
    } catch (error) {
      showErrorToast(
        'Failed to update template',
        error instanceof Error ? error.message : undefined
      );
    }
  };

  const handleDeleteTemplate = async () => {
    if (!selectedTemplate) return;
    try {
      await deleteTemplateMutation.mutateAsync(selectedTemplate.id);
      setSelectedTemplateId('');
      showSuccessToast('Template deleted', 'Template removed.');
    } catch (error) {
      showErrorToast(
        'Failed to delete template',
        error instanceof Error ? error.message : undefined
      );
    }
  };

  const handlePreviewTemplate = async () => {
    if (!canSubmit) return;
    try {
      await previewTemplateMutation.mutateAsync({
        workspace_id: workspaceId,
        subject_template: templateSubject.trim(),
        body_template: templateBody,
        personalization_enabled: personalizationEnabled,
        personalization_mode: personalizationMode,
      });
    } catch (error) {
      showErrorToast(
        'Failed to preview template',
        error instanceof Error ? error.message : undefined
      );
    }
  };

  const handleTestSend = async () => {
    if (!selectedTemplate || !testSenderId || !testEmail.trim()) return;
    try {
      await testSendMutation.mutateAsync({
        workspace_id: workspaceId,
        template_id: selectedTemplate.id,
        sender_email_account_id: testSenderId,
        to_email: testEmail.trim(),
      });
      showSuccessToast('Test sent', 'Template test email queued.');
    } catch (error) {
      showErrorToast('Test send failed', error instanceof Error ? error.message : undefined);
    }
  };

  const requestTemplateSuggestions = (options?: { force?: boolean }) => {
    if (!workspaceId) return;
    const payload = {
      workspace_id: workspaceId,
      step_type: 'email',
      current_subject: templateSubject || undefined,
      current_message: templateBody || undefined,
    };
    const signature = JSON.stringify(payload);
    if (!options?.force && lastTemplateSuggestionSignature.current === signature) return;
    lastTemplateSuggestionSignature.current = signature;
    requestTemplateSuggestionsMutation(payload);
  };

  useEffect(() => {
    if (!workspaceId) {
      lastTemplateSuggestionSignature.current = null;
      return;
    }

    const timeoutId = window.setTimeout(() => {
      requestTemplateSuggestions();
    }, 500);

    return () => window.clearTimeout(timeoutId);
  }, [workspaceId, templateSubject, templateBody]);

  const preview = previewTemplateMutation.data;
  const templateSuggestionError =
    templateSuggestionErrorValue instanceof Error ? templateSuggestionErrorValue.message : null;

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-[#1E293B]">Templates</h2>
            <button
              type="button"
              onClick={() => {
                setSelectedTemplateId('');
                setTemplateName('');
                setTemplateSubject('');
                setTemplateBody('');
                setPersonalizationEnabled(false);
                setPersonalizationMode('first_line');
              }}
              className="rounded-md border border-[#E2E8F0] px-3 py-1 text-xs text-[#334155]"
            >
              New
            </button>
          </div>
          <div className="mt-4 space-y-2">
            {templates.length === 0 ? (
              <p className="text-sm text-[#64748B]">No templates yet.</p>
            ) : (
              templates.map((template) => {
                const isActive = template.id === selectedTemplateId;
                return (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => setSelectedTemplateId(template.id)}
                    className={`w-full rounded-lg border px-3 py-3 text-left transition-colors ${
                      isActive
                        ? 'border-[#FF6B35] bg-[#FFF7ED]'
                        : 'border-[#E2E8F0] bg-white hover:bg-[#F8FAFC]'
                    }`}
                  >
                    <div className="text-sm font-medium text-[#1E293B]">{template.name}</div>
                    <div className="mt-1 line-clamp-2 text-xs text-[#64748B]">
                      {template.subject_template}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-[#E2E8F0] bg-white p-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-[#1E293B]">
                  {selectedTemplate ? 'Edit Template' : 'Create Template'}
                </h2>
                <p className="mt-1 text-sm text-[#64748B]">
                  Build reusable marketing email content with personalization placeholders.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handlePreviewTemplate}
                  disabled={!canSubmit || previewTemplateMutation.isPending}
                  className="rounded-lg border border-[#E2E8F0] px-4 py-2 text-sm text-[#334155] disabled:opacity-50"
                >
                  Preview
                </button>
                {selectedTemplate ? (
                  <>
                    <button
                      type="button"
                      onClick={handleUpdateTemplate}
                      disabled={!canSubmit || updateTemplateMutation.isPending}
                      className="rounded-lg bg-[#FF6B35] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={handleDeleteTemplate}
                      disabled={deleteTemplateMutation.isPending}
                      className="rounded-lg border border-[#FCA5A5] px-4 py-2 text-sm text-[#B91C1C] disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={handleCreateTemplate}
                    disabled={!canSubmit || createTemplateMutation.isPending}
                    className="rounded-lg bg-[#FF6B35] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                  >
                    Create
                  </button>
                )}
              </div>
            </div>

            <div className="mt-4 grid gap-4">
              <input
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="Template name"
                className="w-full rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm focus:border-[#FF6B35] focus:outline-none"
              />
              <input
                value={templateSubject}
                onChange={(e) => setTemplateSubject(e.target.value)}
                placeholder="Subject, e.g. Quick question for {{first_name}}"
                className="w-full rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm focus:border-[#FF6B35] focus:outline-none"
              />
              <SuggestedDraftsPanel
                data={(templateSuggestionData as SequenceStepSuggestionsResponse | null) || null}
                isLoading={isTemplateSuggestionsPending}
                error={templateSuggestionError}
                onApply={(draft) => {
                  if (draft.subject) setTemplateSubject(draft.subject);
                  setTemplateBody(draft.message);
                }}
                onRegenerate={() => requestTemplateSuggestions({ force: true })}
                surface="email_template"
                suggestionType="email"
                feedbackContext={{
                  workspaceId,
                  leadId: templateSuggestionData?.sample_lead?.lead_id || null,
                }}
              />
              <LazyRichTextEditor
                content={templateBody}
                onChange={setTemplateBody}
                placeholder="Write the email body. Use placeholders like {{first_name}} or custom attributes."
                minHeight="260px"
                variables={[
                  '{{first_name}}',
                  '{{last_name}}',
                  '{{email}}',
                  '{{company}}',
                  '{{title}}',
                ]}
              />
              <div className="flex flex-wrap items-center gap-4">
                <label className="inline-flex items-center gap-2 text-sm text-[#334155]">
                  <input
                    type="checkbox"
                    checked={personalizationEnabled}
                    onChange={(e) => setPersonalizationEnabled(e.target.checked)}
                  />
                  Enable AI personalization
                </label>
                <select
                  value={personalizationMode}
                  onChange={(e) =>
                    setPersonalizationMode(e.target.value as 'first_line' | 'full_message')
                  }
                  disabled={!personalizationEnabled}
                  className="rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm focus:border-[#FF6B35] focus:outline-none disabled:opacity-50"
                >
                  <option value="first_line">Personalize first line</option>
                  <option value="full_message">Personalize full message</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-[#E2E8F0] bg-white p-5">
              <h2 className="text-lg font-semibold text-[#1E293B]">Rendered Preview</h2>
              {preview ? (
                <div className="mt-4 space-y-3 text-sm text-[#1E293B]">
                  <div>
                    <div className="text-xs uppercase tracking-wide text-[#64748B]">
                      Sample recipient
                    </div>
                    <div className="mt-1">
                      {preview.sample_email || 'No sample contact available'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wide text-[#64748B]">Subject</div>
                    <div className="mt-1 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2">
                      {preview.rendered_subject}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wide text-[#64748B]">Body</div>
                    <div
                      className="prose prose-sm mt-1 max-w-none rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-3"
                      dangerouslySetInnerHTML={{ __html: preview.rendered_body }}
                    />
                  </div>
                </div>
              ) : (
                <p className="mt-3 text-sm text-[#64748B]">
                  Run preview to see rendered content with a real sample contact.
                </p>
              )}
            </div>

            <div className="rounded-xl border border-[#E2E8F0] bg-white p-5">
              <h2 className="text-lg font-semibold text-[#1E293B]">Send Test</h2>
              <div className="mt-4 space-y-3">
                <select
                  value={testSenderId}
                  onChange={(e) => setTestSenderId(e.target.value)}
                  className="w-full rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm focus:border-[#FF6B35] focus:outline-none"
                >
                  <option value="">Test sender</option>
                  {emailAccounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.email_address}
                    </option>
                  ))}
                </select>
                <input
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="Send test to"
                  className="w-full rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm focus:border-[#FF6B35] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleTestSend}
                  disabled={
                    !selectedTemplate ||
                    !testSenderId ||
                    !testEmail.trim() ||
                    testSendMutation.isPending
                  }
                  className="rounded-lg border border-[#3B82F6] px-4 py-2 text-sm font-medium text-[#1D4ED8] disabled:opacity-50"
                >
                  {testSendMutation.isPending ? 'Sending...' : 'Send Test'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
