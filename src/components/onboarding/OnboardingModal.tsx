import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { motion, AnimatePresence } from 'framer-motion';
import {
  useEmailAccounts,
  useLinkedInAccounts,
  usePreviewWebsiteContext,
  useUpdateWorkspaceContext,
  useUpdateWorkspaceOnboarding,
  useWorkspaceOnboarding,
} from '@/lib/hooks/queries';
import type { OnboardingStep, Workspace } from '@/lib/types';

const STEP_ORDER: OnboardingStep[] = [
  'business_context',
  'channel_selection',
  'channel_connection',
];

export function OnboardingModal({ workspace }: { workspace: Workspace }) {
  const { data: onboarding } = useWorkspaceOnboarding(workspace.id);
  const showModal = onboarding?.show_onboarding_modal && onboarding?.can_manage_setup;

  if (!showModal) {
    return null;
  }

  return <OnboardingModalContent workspace={workspace} onboarding={onboarding} />;
}

function OnboardingModalContent({
  workspace,
  onboarding,
}: {
  workspace: Workspace;
  onboarding: NonNullable<ReturnType<typeof useWorkspaceOnboarding>['data']>;
}) {
  const navigate = useNavigate();
  const previewWebsiteContext = usePreviewWebsiteContext(workspace.id);
  const updateContext = useUpdateWorkspaceContext(workspace.id);
  const updateOnboarding = useUpdateWorkspaceOnboarding(workspace.id);
  const { data: linkedinAccounts = [] } = useLinkedInAccounts({ workspace_id: workspace.id });
  const { data: emailAccounts = [] } = useEmailAccounts({ workspace_id: workspace.id });

  const [step, setStep] = useState<OnboardingStep>('business_context');
  const [websiteUrl, setWebsiteUrl] = useState(workspace.website_url || '');
  const [businessBlurb, setBusinessBlurb] = useState(workspace.business_blurb || '');
  const [icp, setIcp] = useState(workspace.icp || '');
  const [outreachIntent, setOutreachIntent] = useState(workspace.outreach_intent || '');
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [analysisMessage, setAnalysisMessage] = useState<string | null>(null);

  useEffect(() => {
    setStep(
      onboarding.current_step === 'complete' ? 'channel_connection' : onboarding.current_step
    );
    setSelectedChannels(onboarding.selected_channels || []);
  }, [onboarding]);

  const stepIndex = useMemo(() => STEP_ORDER.indexOf(step), [step]);
  const connectedLinkedInCount = linkedinAccounts.filter(
    (account) => account.status === 'connected'
  ).length;
  const connectedEmailCount = emailAccounts.filter(
    (account) => account.status === 'connected'
  ).length;

  const closeModal = async () => {
    await updateOnboarding.mutateAsync({ dismiss: true });
  };

  const analyzeWebsite = async () => {
    const normalizedUrl = websiteUrl.trim();
    if (!normalizedUrl) {
      setError('Enter a website URL first.');
      return;
    }

    setError(null);
    setAnalysisMessage(null);

    try {
      const preview = await previewWebsiteContext.mutateAsync({ website_url: normalizedUrl });
      if (preview.business_blurb) {
        setBusinessBlurb(preview.business_blurb);
      }
      if (preview.icp) {
        setIcp(preview.icp);
      }
      if (preview.outreach_intent) {
        setOutreachIntent(preview.outreach_intent);
      }
      setAnalysisMessage('Website analysis complete. Review the suggested fields before saving.');
    } catch (analysisError) {
      setError(analysisError instanceof Error ? analysisError.message : 'Website analysis failed.');
    }
  };

  const saveBusinessContext = async () => {
    setError(null);
    setAnalysisMessage(null);
    await updateContext.mutateAsync({
      website_url: websiteUrl.trim() || null,
      business_blurb: businessBlurb.trim() || null,
      icp: icp.trim() || null,
      outreach_intent: outreachIntent.trim() || null,
    });
    await updateOnboarding.mutateAsync({ current_step: 'channel_selection' });
    setStep('channel_selection');
  };

  const skipBusinessContext = async () => {
    setError(null);
    setAnalysisMessage(null);
    await updateOnboarding.mutateAsync({ mark_business_context_skipped: true });
    setStep('channel_selection');
  };

  const continueChannels = async () => {
    setError(null);
    if (selectedChannels.length === 0) {
      setError('Choose at least one channel or skip this step.');
      return;
    }
    await updateOnboarding.mutateAsync({
      selected_channels: selectedChannels,
      current_step: 'channel_connection',
    });
    setStep('channel_connection');
  };

  const skipChannels = async () => {
    setError(null);
    await updateOnboarding.mutateAsync({
      selected_channels: [],
      mark_channel_selection_skipped: true,
    });
    setSelectedChannels([]);
    setStep('channel_connection');
  };

  const finishOnboarding = async () => {
    setError(null);
    await updateOnboarding.mutateAsync({ complete: true });
  };

  const skipConnections = async () => {
    setError(null);
    await updateOnboarding.mutateAsync({
      mark_channel_connection_skipped: true,
      complete: true,
    });
  };

  const toggleChannel = (channel: string) => {
    setSelectedChannels((prev) =>
      prev.includes(channel) ? prev.filter((item) => item !== channel) : [...prev, channel]
    );
  };

  const selectStep = (nextStep: OnboardingStep) => {
    setError(null);
    setStep(nextStep);
  };

  const goToAccounts = async () => {
    setError(null);
    await updateOnboarding.mutateAsync({ dismiss: true, current_step: 'channel_connection' });
    navigate({ to: '/dashboard/accounts' } as never);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          className="w-full max-w-2xl rounded-2xl bg-white shadow-xl"
        >
          <div className="flex items-center justify-between border-b border-[#E2E8F0] px-6 py-5">
            <div>
              <p className="text-sm font-medium text-[#FF6B35]">Workspace setup</p>
              <h2 className="mt-1 text-xl font-bold text-[#1E293B]">
                Get Parrot ready for {workspace.name}
              </h2>
            </div>
            <button
              onClick={closeModal}
              className="rounded-lg px-3 py-2 text-sm font-medium text-[#64748B] transition-colors hover:bg-[#F8FAFC]"
            >
              Skip for now
            </button>
          </div>

          <div className="px-6 pb-3 pt-4">
            <div className="flex items-center gap-3">
              {STEP_ORDER.map((item, index) => {
                const active = index <= stepIndex;
                return (
                  <div key={item} className="flex flex-1 items-center gap-3">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                        active ? 'bg-[#FF6B35] text-white' : 'bg-[#E2E8F0] text-[#64748B]'
                      }`}
                    >
                      {index + 1}
                    </div>
                    {index < STEP_ORDER.length - 1 && (
                      <div
                        className={`h-1 flex-1 rounded-full ${active ? 'bg-[#FF6B35]' : 'bg-[#E2E8F0]'}`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-6 px-6 py-5">
            {step === 'business_context' && (
              <>
                <div>
                  <h3 className="text-lg font-semibold text-[#1E293B]">Business context</h3>
                  <p className="mt-1 text-sm text-[#64748B]">
                    Give Parrot the core context it needs to generate better outreach and reply
                    guidance.
                  </p>
                </div>

                <div className="grid gap-4">
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-[#1E293B]">
                      Website URL
                    </span>
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <input
                        type="url"
                        value={websiteUrl}
                        onChange={(event) => setWebsiteUrl(event.target.value)}
                        placeholder="https://yourcompany.com"
                        className="flex-1 rounded-xl border border-[#E2E8F0] px-4 py-3 focus:border-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20"
                      />
                      <button
                        type="button"
                        onClick={analyzeWebsite}
                        disabled={previewWebsiteContext.isPending}
                        className="rounded-xl border border-[#E2E8F0] px-4 py-3 font-semibold text-[#1E293B] transition-colors hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {previewWebsiteContext.isPending ? 'Analyzing...' : 'Analyze website'}
                      </button>
                    </div>
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-[#1E293B]">
                      Short business blurb
                    </span>
                    <textarea
                      value={businessBlurb}
                      onChange={(event) => setBusinessBlurb(event.target.value)}
                      rows={3}
                      placeholder="What do you sell and why does it matter?"
                      className="w-full rounded-xl border border-[#E2E8F0] px-4 py-3 focus:border-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-[#1E293B]">
                      Ideal customer profile
                    </span>
                    <textarea
                      value={icp}
                      onChange={(event) => setIcp(event.target.value)}
                      rows={3}
                      placeholder="Who should Parrot target?"
                      className="w-full rounded-xl border border-[#E2E8F0] px-4 py-3 focus:border-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-[#1E293B]">
                      Outreach intent
                    </span>
                    <textarea
                      value={outreachIntent}
                      onChange={(event) => setOutreachIntent(event.target.value)}
                      rows={3}
                      placeholder="What outcome should outreach drive?"
                      className="w-full rounded-xl border border-[#E2E8F0] px-4 py-3 focus:border-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20"
                    />
                  </label>
                </div>

                <div className="space-y-3">
                  {analysisMessage && <p className="text-sm text-[#0F766E]">{analysisMessage}</p>}
                </div>

                <div className="flex items-center justify-between">
                  <button
                    onClick={skipBusinessContext}
                    className="text-sm font-medium text-[#64748B] transition-colors hover:text-[#1E293B]"
                  >
                    Skip
                  </button>
                  <button
                    onClick={saveBusinessContext}
                    disabled={updateContext.isPending || updateOnboarding.isPending}
                    className="rounded-xl bg-[#FF6B35] px-5 py-3 font-semibold text-white transition-colors hover:bg-[#E85A2A] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Continue
                  </button>
                </div>
              </>
            )}

            {step === 'channel_selection' && (
              <>
                <div>
                  <h3 className="text-lg font-semibold text-[#1E293B]">Channel selection</h3>
                  <p className="mt-1 text-sm text-[#64748B]">
                    Choose where you want to start. You can change this later.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    { id: 'email', label: 'Email' },
                    { id: 'linkedin', label: 'LinkedIn' },
                    { id: 'both', label: 'Both' },
                  ].map((channel) => {
                    const selected =
                      channel.id === 'both'
                        ? selectedChannels.includes('email') &&
                          selectedChannels.includes('linkedin')
                        : selectedChannels.includes(channel.id);
                    return (
                      <button
                        key={channel.id}
                        type="button"
                        onClick={() => {
                          if (channel.id === 'both') {
                            setSelectedChannels(['email', 'linkedin']);
                            return;
                          }
                          toggleChannel(channel.id);
                        }}
                        className={`rounded-2xl border px-4 py-6 text-left transition-colors ${
                          selected
                            ? 'border-[#FF6B35] bg-[#FFF7ED]'
                            : 'border-[#E2E8F0] bg-white hover:border-[#FF6B35]/40'
                        }`}
                      >
                        <div className="text-base font-semibold text-[#1E293B]">
                          {channel.label}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between">
                  <button
                    onClick={skipChannels}
                    className="text-sm font-medium text-[#64748B] transition-colors hover:text-[#1E293B]"
                  >
                    Skip
                  </button>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => selectStep('business_context')}
                      className="rounded-xl border border-[#E2E8F0] px-5 py-3 font-semibold text-[#64748B] transition-colors hover:bg-[#F8FAFC]"
                    >
                      Back
                    </button>
                    <button
                      onClick={continueChannels}
                      disabled={updateOnboarding.isPending}
                      className="rounded-xl bg-[#FF6B35] px-5 py-3 font-semibold text-white transition-colors hover:bg-[#E85A2A] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Continue
                    </button>
                  </div>
                </div>
              </>
            )}

            {step === 'channel_connection' && (
              <>
                <div>
                  <h3 className="text-lg font-semibold text-[#1E293B]">Connect your channels</h3>
                  <p className="mt-1 text-sm text-[#64748B]">
                    Based on your selection, connect the relevant accounts now or skip and handle it
                    later.
                  </p>
                </div>

                <div className="grid gap-4">
                  {(selectedChannels.length === 0 || selectedChannels.includes('linkedin')) && (
                    <div className="rounded-2xl border border-[#E2E8F0] p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h4 className="font-semibold text-[#1E293B]">LinkedIn</h4>
                          <p className="mt-1 text-sm text-[#64748B]">
                            Connected accounts: {connectedLinkedInCount}
                          </p>
                        </div>
                        <button
                          onClick={() => void goToAccounts()}
                          disabled={updateOnboarding.isPending}
                          className="rounded-lg border border-[#E2E8F0] px-4 py-2 text-sm font-medium text-[#64748B] transition-colors hover:bg-[#F8FAFC]"
                        >
                          Connect LinkedIn
                        </button>
                      </div>
                    </div>
                  )}

                  {(selectedChannels.length === 0 || selectedChannels.includes('email')) && (
                    <div className="rounded-2xl border border-[#E2E8F0] p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h4 className="font-semibold text-[#1E293B]">Email</h4>
                          <p className="mt-1 text-sm text-[#64748B]">
                            Connected inboxes: {connectedEmailCount}
                          </p>
                        </div>
                        <button
                          onClick={() => void goToAccounts()}
                          disabled={updateOnboarding.isPending}
                          className="rounded-lg border border-[#E2E8F0] px-4 py-2 text-sm font-medium text-[#64748B] transition-colors hover:bg-[#F8FAFC]"
                        >
                          Connect email
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <button
                    onClick={skipConnections}
                    className="text-sm font-medium text-[#64748B] transition-colors hover:text-[#1E293B]"
                  >
                    Skip
                  </button>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => selectStep('channel_selection')}
                      className="rounded-xl border border-[#E2E8F0] px-5 py-3 font-semibold text-[#64748B] transition-colors hover:bg-[#F8FAFC]"
                    >
                      Back
                    </button>
                    <button
                      onClick={finishOnboarding}
                      disabled={updateOnboarding.isPending}
                      className="rounded-xl bg-[#FF6B35] px-5 py-3 font-semibold text-white transition-colors hover:bg-[#E85A2A] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Finish
                    </button>
                  </div>
                </div>
              </>
            )}

            {error && <p className="text-sm text-[#EF4444]">{error}</p>}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
