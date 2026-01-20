import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { GoogleLogin } from '@react-oauth/google';
import logoImage from '@/assets/images/logo.png';
import { useAuthStore } from '@/lib/auth';

export const Route = createFileRoute('/signup')({
  component: SignupPage,
});

function SignupPage() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signup = useAuthStore((state) => state.signup);
  const googleLogin = useAuthStore((state) => state.googleLogin);
  const navigate = useNavigate();

  const handleGoogleSuccess = async (credentialResponse: { credential?: string }) => {
    if (!credentialResponse.credential) {
      setError('Google sign-up failed. Please try again.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await googleLogin(credentialResponse.credential);
      navigate({ to: '/dashboard' });
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
      await signup({
        name: formData.fullName,
        email: formData.email,
        password: formData.password,
      });
      navigate({ to: '/dashboard' });
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
      {/* Left side - Visual */}
      <div className="relative hidden overflow-hidden lg:flex lg:w-[45%]">
        {/* Cream/warm background matching brand */}
        <div className="absolute inset-0 bg-[#FFFBEB]" />

        {/* Gradient mesh overlay */}
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 70% 50% at 30% 30%, rgba(20, 184, 166, 0.15) 0%, transparent 50%),
              radial-gradient(ellipse 60% 50% at 70% 70%, rgba(255, 107, 53, 0.12) 0%, transparent 50%),
              radial-gradient(ellipse 40% 30% at 20% 80%, rgba(20, 184, 166, 0.08) 0%, transparent 40%)
            `,
          }}
        />

        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `
              linear-gradient(#1E293B 1px, transparent 1px),
              linear-gradient(90deg, #1E293B 1px, transparent 1px)
            `,
            backgroundSize: '48px 48px',
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
              className="mb-8 inline-flex items-center gap-2 rounded-full border border-[#E2E8F0] bg-white px-4 py-2 shadow-sm"
            >
              <span className="h-2 w-2 animate-pulse rounded-full bg-[#22C55E]" />
              <span className="text-sm font-medium text-[#1E293B]">
                3,500+ teams scaling their outreach
              </span>
            </motion.div>

            <h2 className="mb-4 text-[32px] font-bold leading-tight tracking-[-0.02em] text-[#1E293B]">
              Start your
              <br />
              <span className="text-[#14B8A6]">7-day trial</span> for $1
            </h2>

            <p className="mb-10 text-[15px] leading-relaxed text-[#64748B]">
              Full access to everything. Cancel anytime.
              <br />
              No hidden fees, no surprises.
            </p>

            {/* Benefits list */}
            <div className="space-y-5">
              <BenefitItem
                icon="check"
                title="Unlimited LinkedIn actions"
                description="Connection requests, messages, profile views"
              />
              <BenefitItem
                icon="check"
                title="Unlimited email sending"
                description="Connect Gmail, Outlook, or SMTP"
              />
              <BenefitItem
                icon="check"
                title="Unlimited enrichment"
                description="Auto-find verified business emails"
              />
            </div>
          </motion.div>

          {/* Decorative elements */}
          <motion.div
            className="absolute left-16 top-24 h-3 w-3 rounded-full bg-[#14B8A6]"
            animate={{ scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 3, repeat: Infinity }}
          />
          <motion.div
            className="absolute bottom-28 right-20 h-2 w-2 rounded-full bg-[#FF6B35]"
            animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 4, repeat: Infinity, delay: 1 }}
          />
          <motion.div
            className="absolute right-16 top-1/3 h-20 w-20 rounded-2xl border border-[#E2E8F0] bg-white/50"
            animate={{ y: [0, -8, 0], rotate: [0, -2, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute bottom-32 left-20 h-14 w-14 rounded-xl border border-[#E2E8F0] bg-white/50"
            animate={{ y: [0, 6, 0], rotate: [0, 2, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          />
        </div>
      </div>

      {/* Right side - Form */}
      <div className="relative flex flex-1 flex-col justify-center bg-white px-6 py-8 sm:px-12 sm:py-0 lg:px-20">
        {/* Subtle background pattern */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `radial-gradient(#1E293B 1px, transparent 1px)`,
            backgroundSize: '24px 24px',
          }}
        />

        <div className="relative z-10 mx-auto w-full max-w-[400px]">
          {/* Logo */}
          <Link to="/" className="group mb-6 inline-flex items-center gap-2 sm:mb-10 sm:gap-2.5">
            <img
              src={logoImage}
              alt="SalesParrot"
              className="h-8 w-8 object-contain sm:h-10 sm:w-10"
            />
            <span className="text-lg font-bold text-[#1E293B] transition-colors group-hover:text-[#FF6B35] sm:text-xl">
              SalesParrot
            </span>
          </Link>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="mb-2 text-[26px] font-bold tracking-[-0.02em] text-[#1E293B] sm:text-[32px]">
              Create your account
            </h1>
            <p className="text-sm text-[#64748B] sm:text-[15px]">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-semibold text-[#FF6B35] transition-colors hover:text-[#E85A2A]"
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
            className="mt-6 space-y-4 sm:mt-8 sm:space-y-5"
          >
            {/* Full name */}
            <div>
              <label htmlFor="fullName" className="mb-2 block text-sm font-semibold text-[#1E293B]">
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
                className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3.5 text-[#1E293B] placeholder-[#94A3B8] transition-all duration-200 focus:border-[#FF6B35] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20"
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-semibold text-[#1E293B]">
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
                className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3.5 text-[#1E293B] placeholder-[#94A3B8] transition-all duration-200 focus:border-[#FF6B35] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-semibold text-[#1E293B]">
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
                  className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3.5 pr-12 text-[#1E293B] placeholder-[#94A3B8] transition-all duration-200 focus:border-[#FF6B35] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20"
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
                  className="mt-3"
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
                      className="min-w-[60px] text-right text-xs font-medium"
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
                className="mt-0.5 h-4 w-4 cursor-pointer rounded border-[#E2E8F0] text-[#FF6B35] focus:ring-[#FF6B35]"
                required
              />
              <label
                htmlFor="terms"
                className="cursor-pointer text-sm leading-relaxed text-[#64748B]"
              >
                I agree to the{' '}
                <Link to="/" className="font-medium text-[#FF6B35] hover:underline">
                  Terms
                </Link>{' '}
                and{' '}
                <Link to="/" className="font-medium text-[#FF6B35] hover:underline">
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
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#FF6B35] px-6 py-4 font-semibold text-white shadow-[0_4px_14px_rgba(255,107,53,0.25)] transition-all duration-200 hover:bg-[#E85A2A] hover:shadow-[0_6px_20px_rgba(255,107,53,0.35)] focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isLoading ? (
                <>
                  <LoadingSpinner />
                  Creating account...
                </>
              ) : (
                'Start $1 trial'
              )}
            </motion.button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#E2E8F0]" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-4 text-[#94A3B8]">or continue with</span>
              </div>
            </div>

            {/* Google Sign Up */}
            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError('Google sign-up failed. Please try again.')}
                theme="outline"
                size="large"
                width="100%"
                text="signup_with"
                shape="rectangular"
              />
            </div>

            {/* Trial info */}
            <p className="text-center text-xs text-[#94A3B8]">7-day full access. Cancel anytime.</p>
          </motion.form>
        </div>
      </div>
    </div>
  );
}

function BenefitItem({
  title,
  description,
}: {
  icon?: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#14B8A6]/10">
        <svg
          className="h-3.5 w-3.5 text-[#14B8A6]"
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
        <p className="mt-0.5 text-sm text-[#64748B]">{description}</p>
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
