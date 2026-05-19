import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { GoogleLogin } from '@react-oauth/google';
import logoImage from '@/assets/images/logo.png';
import { useAuthStore } from '@/lib/auth';

export const Route = createFileRoute('/login')({
  validateSearch: (search: Record<string, unknown>) => ({
    next: typeof search.next === 'string' ? search.next : undefined,
  }),
  component: LoginPage,
});

function LoginPage() {
  const { next } = Route.useSearch();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const login = useAuthStore((state) => state.login);
  const googleLogin = useAuthStore((state) => state.googleLogin);
  const navigate = useNavigate();

  const handleGoogleSuccess = async (credentialResponse: { credential?: string }) => {
    if (!credentialResponse.credential) {
      setError('Google sign-in failed. Please try again.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await googleLogin(credentialResponse.credential);
      if (next) {
        window.location.href = next;
      } else {
        navigate({ to: '/dashboard' } as never);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign-in failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await login({ email, password });
      if (next) {
        window.location.href = next;
      } else {
        navigate({ to: '/dashboard' } as never);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left side - Form */}
      <div className="relative flex flex-1 flex-col justify-center bg-white px-6 py-8 sm:px-12 sm:py-0 lg:px-20">
        {/* Subtle background dot pattern */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `radial-gradient(#1E293B 1px, transparent 1px)`,
            backgroundSize: '24px 24px',
          }}
        />

        <div className="relative z-10 mx-auto w-full max-w-[380px]">
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
              Welcome back
            </h1>
            <p className="text-xs font-medium text-[#64748B] sm:text-sm">
              Don't have an account?{' '}
              <Link
                to="/signup"
                className="font-semibold text-[#EA580C] transition-colors hover:text-[#C2410C]"
              >
                Sign up
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
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[#64748B]"
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-2.5 text-sm text-[#1E293B] placeholder-[#94A3B8] transition-all duration-200 focus:border-[#EA580C] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#EA580C]/20"
              />
            </div>

            {/* Password */}
            <div>
              <div className="mb-1 flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block text-[11px] font-bold uppercase tracking-wider text-[#64748B]"
                >
                  Password
                </label>
                <Link
                  to="/"
                  className="text-[11px] font-bold uppercase tracking-wider text-[#EA580C] transition-colors hover:text-[#C2410C]"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
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
            </div>

            {/* Remember me */}
            <div className="flex items-center gap-3">
              <input
                id="remember"
                type="checkbox"
                className="h-4 w-4 cursor-pointer rounded border-[#E2E8F0] text-[#EA580C] focus:ring-[#EA580C]"
              />
              <label
                htmlFor="remember"
                className="cursor-pointer text-sm font-medium text-[#64748B]"
              >
                Keep me signed in
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
              disabled={isLoading}
              whileHover={{ scale: 1.01, y: -1 }}
              whileTap={{ scale: 0.99 }}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-[#EA580C] px-6 py-3 text-sm font-semibold text-white shadow-[0_4px_12px_rgba(234,88,12,0.15)] transition-all duration-200 hover:bg-[#C2410C] hover:shadow-[0_6px_20px_rgba(234,88,12,0.25)] focus:outline-none focus:ring-2 focus:ring-[#EA580C] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isLoading ? (
                <>
                  <LoadingSpinner />
                  Signing in...
                </>
              ) : (
                'Sign in'
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

            {/* Google Sign In */}
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
                  Sign in with Google
                </span>
              </button>

              {/* Invisible Google Button Overlay */}
              <div className="absolute inset-0 cursor-pointer opacity-0 [&>div]:!h-full [&>div]:!w-full [&_iframe]:!h-full [&_iframe]:!w-full">
                {isMounted && (
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={() => setError('Google sign-in failed. Please try again.')}
                    theme="outline"
                    size="large"
                    width="380"
                    text="signin_with"
                    shape="pill"
                  />
                )}
              </div>
            </div>
          </motion.form>

          {/* Footer note */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-8 text-center text-xs font-medium text-[#94A3B8]"
          >
            Protected by enterprise-grade security
          </motion.p>
        </div>
      </div>

      {/* Right side - Visual Backdrop matching Canvas Dotted Grid Theme */}
      <div className="relative hidden overflow-hidden border-l border-slate-100 bg-[#F8FAFC] lg:flex lg:w-[45%]">
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
            className="max-w-md text-center"
          >
            {/* Icon badge */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mb-8 inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-200/60 bg-white shadow-[0_8px_30px_rgba(30,41,59,0.04)]"
            >
              <svg
                className="h-8 w-8 text-[#EA580C]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
                />
              </svg>
            </motion.div>

            <h2 className="mb-4 text-[28px] font-bold leading-tight tracking-[-0.02em] text-[#1E293B]">
              Your outreach,
              <br />
              <span className="text-[#EA580C]">supercharged.</span>
            </h2>

            <p className="mb-10 text-[15px] font-medium leading-relaxed text-[#64748B]">
              LinkedIn + Email + Enrichment in one platform.
              <br />
              Stop juggling tools. Start booking meetings.
            </p>

            {/* Feature pills */}
            <div className="flex flex-wrap justify-center gap-3">
              <FeaturePill icon="linkedin" text="LinkedIn automation" />
              <FeaturePill icon="email" text="Email sequences" />
              <FeaturePill icon="search" text="Auto enrichment" />
            </div>
          </motion.div>

          {/* Decorative elements */}
          <motion.div
            className="absolute right-16 top-20 h-3 w-3 rounded-full bg-[#EA580C]"
            animate={{ scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 3, repeat: Infinity }}
          />
          <motion.div
            className="absolute bottom-32 left-16 h-2 w-2 rounded-full bg-[#EA580C]"
            animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 4, repeat: Infinity, delay: 1 }}
          />
          <motion.div
            className="absolute left-20 top-1/3 h-20 w-20 rounded-2xl border border-slate-200/60 bg-white/90 shadow-sm"
            animate={{ y: [0, -8, 0], rotate: [0, 2, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute bottom-24 right-20 h-16 w-16 rounded-xl border border-slate-200/60 bg-white/90 shadow-sm"
            animate={{ y: [0, 6, 0], rotate: [0, -2, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          />
        </div>
      </div>
    </div>
  );
}

function FeaturePill({ icon, text }: { icon: string; text: string }) {
  const icons = {
    linkedin: (
      <svg className="h-4 w-4 text-[#0A66C2]" fill="currentColor" viewBox="0 0 20 20">
        <path d="M16.338 16.338H13.67V12.16c0-.995-.017-2.277-1.387-2.277-1.39 0-1.601 1.086-1.601 2.207v4.248H8.014v-8.59h2.559v1.174h.037c.356-.675 1.227-1.387 2.526-1.387 2.703 0 3.203 1.778 3.203 4.092v4.711zM5.005 6.575a1.548 1.548 0 11-.003-3.096 1.548 1.548 0 01.003 3.096zm-1.337 9.763H6.34v-8.59H3.667v8.59zM17.668 1H2.328C1.595 1 1 1.581 1 2.298v15.403C1 18.418 1.595 19 2.328 19h15.34c.734 0 1.332-.582 1.332-1.299V2.298C19 1.581 18.402 1 17.668 1z" />
      </svg>
    ),
    email: (
      <svg
        className="h-4 w-4 text-[#EA580C]"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
        />
      </svg>
    ),
    search: (
      <svg
        className="h-4 w-4 text-slate-400"
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
    ),
  };

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 shadow-sm">
      {icons[icon as keyof typeof icons]}
      <span className="text-sm font-semibold text-[#1E293B]">{text}</span>
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
