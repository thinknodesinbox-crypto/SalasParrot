import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/lib/auth';
import { useCreateTrialCheckout, useCreateAgencyCheckout } from '@/lib/hooks/queries/useBilling';
import { api, getErrorMessage } from '@/lib/api';
import type { PartnerCodeValidation } from '@/lib/types';
import { Check, Gift, CreditCard, Sparkles } from 'lucide-react';

export const Route = createFileRoute('/onboarding')({
  component: OnboardingPage,
});

// Volume pricing tiers
const volumePricing = [
  { min: 1, max: 1, price: 79 },
  { min: 2, max: 4, price: 69 },
  { min: 5, max: 9, price: 62 },
  { min: 10, max: 50, price: 59 },
];

function getPricePerSender(senders: number): number {
  const tier = volumePricing.find((t) => senders >= t.min && senders <= t.max);
  return tier?.price ?? 59;
}

function OnboardingPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const fetchUser = useAuthStore((state) => state.fetchUser);
  const isLoading = useAuthStore((state) => state.isLoading);

  const [selectedPlan, setSelectedPlan] = useState<'growth' | 'agency'>('growth');
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');
  const [senderCount, setSenderCount] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Partner code state
  const [showPartnerCode, setShowPartnerCode] = useState(false);
  const [partnerCode, setPartnerCode] = useState('');
  const [isValidatingCode, setIsValidatingCode] = useState(false);
  const [codeValidation, setCodeValidation] = useState<PartnerCodeValidation | null>(null);
  const [isRedeemingCode, setIsRedeemingCode] = useState(false);

  const createTrialCheckout = useCreateTrialCheckout();
  const createAgencyCheckout = useCreateAgencyCheckout();

  // Redirect if admin or already has subscription
  useEffect(() => {
    if (!isLoading && user) {
      if (user.is_admin) {
        navigate({ to: '/dashboard' });
      }
      // If user already has a subscription or partner access, go to dashboard
      if (user.subscription_status === 'active' || user.partner_access?.is_active) {
        navigate({ to: '/dashboard' });
      }
    }
  }, [user, isLoading, navigate]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      navigate({ to: '/signup' });
    }
  }, [user, isLoading, navigate]);

  // Debounced partner code validation
  const validatePartnerCode = useCallback(
    async (code: string) => {
      if (!code || code.length < 3) {
        setCodeValidation(null);
        return;
      }

      setIsValidatingCode(true);
      try {
        const response = await api.post<PartnerCodeValidation>('/auth/validate-partner-code', {
          code,
          email: user?.email,
        });
        setCodeValidation(response.data);
      } catch (err) {
        setCodeValidation({
          valid: false,
          code: null,
          message: getErrorMessage(err),
          benefits: null,
        });
      } finally {
        setIsValidatingCode(false);
      }
    },
    [user?.email]
  );

  // Validate partner code when it changes (with debounce)
  useEffect(() => {
    if (!partnerCode) {
      setCodeValidation(null);
      return;
    }

    const timer = setTimeout(() => {
      validatePartnerCode(partnerCode);
    }, 500);

    return () => clearTimeout(timer);
  }, [partnerCode, validatePartnerCode]);

  const handleRedeemCode = async () => {
    if (!codeValidation?.valid || !partnerCode) return;

    setIsRedeemingCode(true);
    setError(null);

    try {
      await api.post('/auth/redeem-partner-code', { code: partnerCode });
      await fetchUser(); // Refresh user data
      navigate({ to: '/dashboard', search: { partner: 'activated' } });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsRedeemingCode(false);
    }
  };

  const handleStartTrial = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      let checkout_url: string;

      if (selectedPlan === 'agency') {
        // Agency plan - no trial, direct checkout with optional annual billing
        const result = await createAgencyCheckout.mutateAsync({
          annual: billingPeriod === 'annual',
          success_url: `${window.location.origin}/dashboard?plan=agency`,
          cancel_url: `${window.location.origin}/onboarding?checkout=cancelled`,
        });
        checkout_url = result.checkout_url;
      } else {
        // Growth plan - with $1 trial
        const result = await createTrialCheckout.mutateAsync({
          sender_count: senderCount,
          success_url: `${window.location.origin}/dashboard?trial=started`,
          cancel_url: `${window.location.origin}/onboarding?checkout=cancelled`,
        });
        checkout_url = result.checkout_url;
      }

      // Use replace to remove onboarding from history - back button skips to previous page
      window.location.replace(checkout_url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start checkout. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle checkout cancelled
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const checkout = params.get('checkout');
    if (checkout === 'cancelled') {
      setError('Checkout was cancelled. Please try again to start your trial.');
      window.history.replaceState({}, '', '/onboarding');
    }
  }, []);

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FFFBEB]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#FF6B35] border-t-transparent" />
      </div>
    );
  }

  const pricePerSender = getPricePerSender(senderCount);
  const totalPrice = pricePerSender * senderCount;

  return (
    <div className="min-h-screen bg-[#FFFBEB]">
      <div className="mx-auto max-w-5xl px-6 py-12">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 text-center"
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#14B8A6]/10 px-4 py-2">
            <Sparkles className="h-4 w-4 text-[#14B8A6]" />
            <span className="text-sm font-medium text-[#14B8A6]">Almost there!</span>
          </div>
          <h1 className="mb-3 text-3xl font-bold text-[#1E293B] sm:text-4xl">
            Choose how you want to get started
          </h1>
          <p className="text-lg text-[#64748B]">
            Start with a $1 trial or use a partner code for free access
          </p>
        </motion.div>

        {/* Error message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto mb-8 max-w-2xl rounded-xl border border-red-200 bg-red-50 p-4"
          >
            <p className="text-center text-sm text-red-600">{error}</p>
          </motion.div>
        )}

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Partner Code Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm sm:p-8"
          >
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#14B8A6]/10">
                <Gift className="h-6 w-6 text-[#14B8A6]" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#1E293B]">Have a Partner Code?</h2>
                <p className="text-sm text-[#64748B]">Get free access instantly</p>
              </div>
            </div>

            {!showPartnerCode ? (
              <button
                onClick={() => setShowPartnerCode(true)}
                className="w-full rounded-xl border-2 border-dashed border-[#E2E8F0] py-4 text-center text-sm font-medium text-[#64748B] transition-colors hover:border-[#14B8A6] hover:text-[#14B8A6]"
              >
                Enter partner code
              </button>
            ) : (
              <div className="space-y-4">
                <div className="relative">
                  <input
                    type="text"
                    value={partnerCode}
                    onChange={(e) => setPartnerCode(e.target.value.toUpperCase())}
                    placeholder="Enter code (e.g., PARTNER50)"
                    className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3.5 font-mono uppercase tracking-wider text-[#1E293B] placeholder-[#94A3B8] transition-all focus:border-[#14B8A6] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/20"
                  />
                  {isValidatingCode && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#14B8A6] border-t-transparent" />
                    </div>
                  )}
                </div>

                {/* Validation feedback */}
                <AnimatePresence mode="wait">
                  {codeValidation && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className={`rounded-xl p-4 ${
                        codeValidation.valid
                          ? 'border border-[#14B8A6]/20 bg-[#14B8A6]/5'
                          : 'border border-red-200 bg-red-50'
                      }`}
                    >
                      {codeValidation.valid ? (
                        <div>
                          <div className="mb-2 flex items-center gap-2">
                            <Check className="h-4 w-4 text-[#14B8A6]" />
                            <span className="text-sm font-medium text-[#14B8A6]">
                              {codeValidation.message}
                            </span>
                          </div>
                          {codeValidation.benefits && (
                            <ul className="space-y-1 text-sm text-[#64748B]">
                              <li>
                                Access type:{' '}
                                <span className="font-medium capitalize">
                                  {codeValidation.benefits.access_type}
                                </span>
                              </li>
                              {codeValidation.benefits.duration_days && (
                                <li>
                                  Duration:{' '}
                                  <span className="font-medium">
                                    {codeValidation.benefits.duration_days} days
                                  </span>
                                </li>
                              )}
                              {!codeValidation.benefits.duration_days && (
                                <li>
                                  Duration: <span className="font-medium">Lifetime</span>
                                </li>
                              )}
                            </ul>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-red-600">{codeValidation.message}</p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  onClick={handleRedeemCode}
                  disabled={!codeValidation?.valid || isRedeemingCode}
                  className="w-full rounded-xl bg-[#14B8A6] px-6 py-4 font-semibold text-white shadow-[0_4px_14px_rgba(20,184,166,0.25)] transition-all hover:bg-[#0D9488] hover:shadow-[0_6px_20px_rgba(20,184,166,0.35)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isRedeemingCode ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Activating...
                    </span>
                  ) : (
                    'Activate Partner Access'
                  )}
                </button>

                <button
                  onClick={() => {
                    setShowPartnerCode(false);
                    setPartnerCode('');
                    setCodeValidation(null);
                  }}
                  className="w-full text-center text-sm text-[#64748B] hover:text-[#1E293B]"
                >
                  Cancel
                </button>
              </div>
            )}
          </motion.div>

          {/* Plans Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm sm:p-8"
          >
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#FF6B35]/10">
                <CreditCard className="h-6 w-6 text-[#FF6B35]" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#1E293B]">Start Your $1 Trial</h2>
                <p className="text-sm text-[#64748B]">7 days full access, cancel anytime</p>
              </div>
            </div>

            {/* Plan Toggle */}
            <div className="mb-4 flex rounded-xl bg-[#F8FAFC] p-1">
              <button
                onClick={() => setSelectedPlan('growth')}
                className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
                  selectedPlan === 'growth'
                    ? 'bg-white text-[#1E293B] shadow-sm'
                    : 'text-[#64748B] hover:text-[#1E293B]'
                }`}
              >
                Growth
              </button>
              <button
                onClick={() => setSelectedPlan('agency')}
                className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
                  selectedPlan === 'agency'
                    ? 'bg-white text-[#1E293B] shadow-sm'
                    : 'text-[#64748B] hover:text-[#1E293B]'
                }`}
              >
                Agency
              </button>
            </div>

            {/* Billing Period Toggle - Only for Agency */}
            {selectedPlan === 'agency' && (
              <div className="mb-6 flex items-center justify-center gap-3">
                <span
                  className={`text-sm font-medium ${
                    billingPeriod === 'monthly' ? 'text-[#1E293B]' : 'text-[#94A3B8]'
                  }`}
                >
                  Monthly
                </span>
                <button
                  onClick={() =>
                    setBillingPeriod(billingPeriod === 'monthly' ? 'annual' : 'monthly')
                  }
                  className={`relative h-7 w-12 rounded-full transition-colors ${
                    billingPeriod === 'annual' ? 'bg-[#14B8A6]' : 'bg-[#E2E8F0]'
                  }`}
                >
                  <span
                    className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-all ${
                      billingPeriod === 'annual' ? 'left-6' : 'left-1'
                    }`}
                  />
                </button>
                <span
                  className={`text-sm font-medium ${
                    billingPeriod === 'annual' ? 'text-[#1E293B]' : 'text-[#94A3B8]'
                  }`}
                >
                  Annual
                </span>
                {billingPeriod === 'annual' && (
                  <span className="rounded-full bg-[#14B8A6]/10 px-2 py-0.5 text-xs font-medium text-[#14B8A6]">
                    Save 25%
                  </span>
                )}
              </div>
            )}

            <AnimatePresence mode="wait">
              {selectedPlan === 'growth' ? (
                <motion.div
                  key="growth"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="space-y-6"
                >
                  {/* Sender count */}
                  <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-sm font-medium text-[#1E293B]">Number of senders</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSenderCount(Math.max(1, senderCount - 1))}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E2E8F0] bg-white text-[#64748B] hover:border-[#14B8A6] hover:text-[#14B8A6]"
                        >
                          −
                        </button>
                        <span className="w-8 text-center font-bold text-[#1E293B]">
                          {senderCount}
                        </span>
                        <button
                          onClick={() => setSenderCount(Math.min(20, senderCount + 1))}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E2E8F0] bg-white text-[#64748B] hover:border-[#14B8A6] hover:text-[#14B8A6]"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="20"
                      value={senderCount}
                      onChange={(e) => setSenderCount(parseInt(e.target.value))}
                      className="h-2 w-full cursor-pointer appearance-none rounded-full bg-[#E2E8F0]"
                      style={{
                        background: `linear-gradient(to right, #14B8A6 0%, #14B8A6 ${((senderCount - 1) / 19) * 100}%, #E2E8F0 ${((senderCount - 1) / 19) * 100}%, #E2E8F0 100%)`,
                      }}
                    />
                  </div>

                  {/* Price */}
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="text-3xl font-bold text-[#1E293B]">${pricePerSender}</span>
                      <span className="text-[#64748B]">/mo per sender</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm text-[#64748B]">Total: </span>
                      <span className="text-xl font-bold text-[#1E293B]">${totalPrice}/mo</span>
                    </div>
                  </div>

                  {/* Features */}
                  <ul className="space-y-2 text-sm text-[#64748B]">
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-[#14B8A6]" />
                      Unlimited LinkedIn automation
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-[#14B8A6]" />
                      Unlimited email sequences
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-[#14B8A6]" />
                      Unlimited email enrichment
                    </li>
                  </ul>
                </motion.div>
              ) : (
                <motion.div
                  key="agency"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="space-y-6"
                >
                  {/* Price */}
                  <div>
                    {billingPeriod === 'annual' ? (
                      <>
                        <span className="text-3xl font-bold text-[#1E293B]">$749</span>
                        <span className="text-[#64748B]">/month</span>
                        <div className="mt-1 flex items-center gap-2">
                          <span className="text-sm text-[#94A3B8] line-through">$999/mo</span>
                          <span className="rounded-full bg-[#14B8A6]/10 px-2 py-0.5 text-xs font-medium text-[#14B8A6]">
                            Save $3,000/year
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-[#64748B]">Billed annually at $8,988</p>
                      </>
                    ) : (
                      <>
                        <span className="text-3xl font-bold text-[#1E293B]">$999</span>
                        <span className="text-[#64748B]">/month</span>
                        <p className="mt-1 text-sm text-[#94A3B8]">50 senders included</p>
                      </>
                    )}
                  </div>

                  {/* Features */}
                  <ul className="space-y-2 text-sm text-[#64748B]">
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-[#FF6B35]" />
                      Everything in Growth
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-[#FF6B35]" />
                      50 LinkedIn senders included
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-[#FF6B35]" />
                      Whitelabel & unlimited workspaces
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-[#FF6B35]" />
                      Dedicated success manager
                    </li>
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              onClick={handleStartTrial}
              disabled={isSubmitting}
              className="mt-6 w-full rounded-xl bg-[#FF6B35] px-6 py-4 font-semibold text-white shadow-[0_4px_14px_rgba(255,107,53,0.25)] transition-all hover:bg-[#E85A2A] hover:shadow-[0_6px_20px_rgba(255,107,53,0.35)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Starting checkout...
                </span>
              ) : selectedPlan === 'growth' ? (
                'Start $1 Trial'
              ) : (
                `Subscribe to Agency${billingPeriod === 'annual' ? ' (Annual)' : ''}`
              )}
            </button>
            <p className="mt-3 text-center text-xs text-[#94A3B8]">
              {selectedPlan === 'growth'
                ? `7-day trial for $1, then $${totalPrice}/month. Cancel anytime.`
                : billingPeriod === 'annual'
                  ? 'Billed annually at $8,988. Cancel anytime.'
                  : '$999/month. Cancel anytime.'}
            </p>
          </motion.div>
        </div>

        {/* Trust badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-[#94A3B8]"
        >
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            Secure checkout
          </div>
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Cancel anytime
          </div>
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
              />
            </svg>
            Powered by Stripe
          </div>
        </motion.div>
      </div>

      {/* Slider styles */}
      <style>{`
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: white;
          border: 3px solid #14B8A6;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
        }
        input[type="range"]::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: white;
          border: 3px solid #14B8A6;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
        }
      `}</style>
    </div>
  );
}
