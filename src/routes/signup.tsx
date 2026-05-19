import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { GoogleLogin } from '@react-oauth/google';
import logoImage from '@/assets/images/logo.png';
import { useAuthStore } from '@/lib/auth';

export const Route = createFileRoute('/signup')({
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const signup = useAuthStore((state) => state.signup);
  const googleLogin = useAuthStore((state) => state.googleLogin);

  // Handle error message from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const errorMsg = params.get('error');
    if (errorMsg) {
      setError(decodeURIComponent(errorMsg));
      // Clean up URL
      window.history.replaceState({}, '', '/signup');
    }
  }, []);

  const handleGoogleSuccess = async (credentialResponse: { credential?: string }) => {
    if (!credentialResponse.credential) {
      setError('Google sign-up failed. Please try again.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await googleLogin(credentialResponse.credential);

      // Admins skip onboarding and go directly to dashboard
      if (result.skip_payment) {
        navigate({ to: '/dashboard' } as never);
        return;
      }

      // Regular users go to onboarding to choose plan or enter partner code
      navigate({ to: '/onboarding' } as never);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign-up failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreedToTerms) return;
    setIsLoading(true);
    setError(null);

    try {
      const result = await signup({
        name: formData.fullName,
        email: formData.email,
        password: formData.password,
      });

      // Admins skip onboarding and go directly to dashboard
      if (result.skip_payment) {
        navigate({ to: '/dashboard' } as never);
        return;
      }

      // Regular users go to onboarding to choose plan or enter partner code
      navigate({ to: '/onboarding' } as never);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getPasswordStrength = (password: string) => {
    if (password.length === 0) return { strength: 0, label: '', color: '' };
    if (password.length < 6) return { strength: 1, label: 'Too short', color: '#EF4444' };
    if (password.length < 8) return { strength: 2, label: 'Weak', color: '#F59E0B' };
    if (!/[A-Z]/.test(password) || !/[0-9]/.test(password))
      return { strength: 3, label: 'Good', color: '#14B8A6' };
    return { strength: 4, label: 'Strong', color: '#22C55E' };
  };

  const passwordStrength = getPasswordStrength(formData.password);

  return (
    <div className="flex min-h-screen">
      {/* Left side - Visual Backdrop matching Canvas Dotted Grid Theme */}
      <div className="relative hidden overflow-hidden border-r border-slate-100 bg-[#F8FAFC] lg:flex lg:w-[45%]">
        {/* Sleek Dotted Grid backdrop matching canvas visual theme */}
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(circle at top left, rgba(234, 88, 12, 0.045) 0%, transparent 60%),
              radial-gradient(#CBD5E1 1.2px, transparent 1.2px)
            `,
            backgroundSize: '100% 100%, 24px 24px',
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex w-full flex-col items-center justify-center px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="max-w-md"
          >
            {/* Trial badge */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mb-8 inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white px-4 py-2 shadow-sm"
            >
              <span className="h-2 w-2 animate-pulse rounded-full bg-[#EA580C]" />
              <span className="text-sm font-semibold text-[#1E293B]">
                3,500+ teams growing with SalesParrot
              </span>
            </motion.div>

            <h2 className="mb-4 text-[32px] font-bold leading-tight tracking-[-0.02em] text-[#1E293B]">
              Hire your
              <br />
              <span className="text-[#EA580C]">AI sales + marketing employee</span>
            </h2>

            <p className="mb-10 text-[15px] font-medium leading-relaxed text-[#64748B]">
              Launch campaigns, handle replies, and book meetings from one system.
              <br />
              Set the strategy once. SalesParrot runs the work every day.
            </p>

            {/* Benefits list (matching clean greyed out visual workflow panels) */}
            <div className="space-y-5">
              <BenefitItem
                title="Runs outreach across email and LinkedIn"
                description="Executes multichannel campaigns without leads falling through"
              />
              <BenefitItem
                title="Replies like your best rep"
                description="Adapts to each prospect, handles follow-ups, and keeps momentum"
              />
              <BenefitItem
                title="Turns interest into booked meetings"
                description="Finds contact data, qualifies leads, and fills your calendar"
              />
            </div>
          </motion.div>

          {/* Decorative floating minimal elements */}
          <motion.div
            className="absolute left-16 top-24 h-3 w-3 rounded-full bg-[#EA580C]"
            animate={{ scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 3, repeat: Infinity }}
          />
          <motion.div
            className="absolute bottom-28 right-20 h-2 w-2 rounded-full bg-[#EA580C]"
            animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 4, repeat: Infinity, delay: 1 }}
          />
          <motion.div
            className="absolute right-16 top-1/3 h-20 w-20 rounded-2xl border border-slate-200/60 bg-white/90 shadow-sm"
            animate={{ y: [0, -8, 0], rotate: [0, -2, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute bottom-32 left-20 h-14 w-14 rounded-xl border border-slate-200/60 bg-white/90 shadow-sm"
            animate={{ y: [0, 6, 0], rotate: [0, 2, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          />
        </div>
      </div>

      {/* Right side - Form */}
      <div className="relative flex flex-1 flex-col justify-center bg-white px-6 py-8 sm:px-12 sm:py-0 lg:px-20">
        {/* Subtle background dot pattern */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `radial-gradient(#1E293B 1px, transparent 1px)`,
            backgroundSize: '24px 24px',
          }}
        />

        <div className="relative z-10 mx-auto w-full max-w-[400px]">
          {/* Logo */}
          <Link to="/" className="group mb-4 inline-flex items-center gap-2 sm:mb-6 sm:gap-2">
            <img
              src={logoImage}
              alt="SalesParrot"
              className="h-7 w-7 object-contain sm:h-8 sm:w-8"
            />
            <span className="text-md font-bold text-[#1E293B] transition-colors group-hover:text-[#EA580C] sm:text-lg">
              SalesParrot
            </span>
          </Link>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="mb-1 text-[22px] font-bold tracking-[-0.02em] text-[#1E293B] sm:text-[26px]">
              Create your account
            </h1>
            <p className="text-xs font-medium text-[#64748B] sm:text-sm">
              Already have an account?{' '}
              <Link
                to="/login"
                search={{ next: undefined }}
                className="font-semibold text-[#EA580C] transition-colors hover:text-[#C2410C]"
              >
                Sign in
              </Link>
            </p>
          </motion.div>

          {/* Form */}
          <motion.form
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            onSubmit={handleSubmit}
            className="mt-4 space-y-3 sm:mt-5 sm:space-y-4"
          >
            {/* Full name */}
            <div>
              <label
                htmlFor="fullName"
                className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[#64748B]"
              >
                Full name
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="John Doe"
                required
                className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-2.5 text-sm text-[#1E293B] placeholder-[#94A3B8] transition-all duration-200 focus:border-[#EA580C] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#EA580C]/20"
              />
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[#64748B]"
              >
                Work email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@company.com"
                required
                className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-2.5 text-sm text-[#1E293B] placeholder-[#94A3B8] transition-all duration-200 focus:border-[#EA580C] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#EA580C]/20"
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[#64748B]"
              >
                Create password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="8+ characters"
                  required
                  minLength={8}
                  className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-2.5 pr-12 text-sm text-[#1E293B] placeholder-[#94A3B8] transition-all duration-200 focus:border-[#EA580C] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#EA580C]/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#94A3B8] transition-colors hover:text-[#64748B]"
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>

              {/* Password strength indicator */}
              {formData.password.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-1.5"
                >
                  <div className="flex items-center gap-2">
                    <div className="flex flex-1 gap-1">
                      {[1, 2, 3, 4].map((level) => (
                        <div
                          key={level}
                          className="h-1.5 flex-1 rounded-full transition-all duration-300"
                          style={{
                            backgroundColor:
                              level <= passwordStrength.strength
                                ? passwordStrength.color
                                : '#E2E8F0',
                          }}
                        />
                      ))}
                    </div>
                    <span
                      className="min-w-[60px] text-right text-xs font-semibold"
                      style={{ color: passwordStrength.color }}
                    >
                      {passwordStrength.label}
                    </span>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Terms checkbox */}
            <div className="flex items-start gap-3 pt-1">
              <input
                id="terms"
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-0.5 h-4 w-4 cursor-pointer rounded border-[#E2E8F0] text-[#EA580C] focus:ring-[#EA580C]"
                required
              />
              <label
                htmlFor="terms"
                className="cursor-pointer text-sm font-medium leading-relaxed text-[#64748B]"
              >
                I agree to the{' '}
                <Link to="/terms" className="font-semibold text-[#EA580C] hover:underline">
                  Terms
                </Link>{' '}
                and{' '}
                <Link to="/privacy" className="font-semibold text-[#EA580C] hover:underline">
                  Privacy Policy
                </Link>
              </label>
            </div>

            {/* Error message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg border border-red-200 bg-red-50 p-3"
              >
                <p className="text-sm text-red-600">{error}</p>
              </motion.div>
            )}

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={isLoading || !agreedToTerms}
              whileHover={{ scale: 1.01, y: -1 }}
              whileTap={{ scale: 0.99 }}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-[#EA580C] px-6 py-3 text-sm font-semibold text-white shadow-[0_4px_12px_rgba(234,88,12,0.15)] transition-all duration-200 hover:bg-[#C2410C] hover:shadow-[0_6px_20px_rgba(234,88,12,0.25)] focus:outline-none focus:ring-2 focus:ring-[#EA580C] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isLoading ? (
                <>
                  <LoadingSpinner />
                  Creating account...
                </>
              ) : (
                'Create account'
              )}
            </motion.button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#E2E8F0]" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-4 font-medium text-[#94A3B8]">or continue with</span>
              </div>
            </div>

            {/* Google Sign Up */}
            <div className="relative h-[46px] w-full">
              {/* Custom Styled Google Button */}
              <button
                type="button"
                className="absolute inset-0 flex w-full items-center justify-center gap-3 rounded-full border border-[#E2E8F0] bg-white px-6 py-2.5 text-sm font-semibold text-[#1E293B] shadow-sm transition-all duration-200 hover:bg-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#EA580C]/20"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1c-4.3 0-8.01 2.47-9.82 6.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span className="text-[14px] font-semibold text-[#1E293B]">
                  Sign up with Google
                </span>
              </button>

              {/* Invisible Google Button Overlay */}
              <div className="absolute inset-0 cursor-pointer opacity-0 [&>div]:!h-full [&>div]:!w-full [&_iframe]:!h-full [&_iframe]:!w-full">
                {isMounted && (
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={() => setError('Google sign-up failed. Please try again.')}
                    theme="outline"
                    size="large"
                    width="400"
                    text="signup_with"
                    shape="pill"
                  />
                )}
              </div>
            </div>

            {/* Trial info */}
            <p className="text-center text-xs font-medium text-[#94A3B8]">
              Cancel anytime. No long-term contracts.
            </p>
          </motion.form>
        </div>
      </div>
    </div>
  );
}

function BenefitItem({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex items-start gap-4">
      {/* Sleek monochrome greyed out icon wrapper matching modern visual canvas outcome blocks */}
      <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border border-slate-200/60 bg-slate-50 text-slate-400">
        <svg
          className="h-3 w-3 text-slate-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={3}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <div>
        <h3 className="text-[15px] font-semibold text-[#1E293B]">{title}</h3>
        <p className="mt-0.5 text-sm font-medium text-[#64748B]">{description}</p>
      </div>
    </div>
  );
}

function EyeIcon() {
  return (
    <svg
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
      />
    </svg>
  );
}

function LoadingSpinner() {
  return (
    <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}
