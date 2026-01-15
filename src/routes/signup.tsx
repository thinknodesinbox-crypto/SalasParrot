import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { motion } from 'framer-motion'
import logoImage from '@/assets/images/logo.png'

export const Route = createFileRoute('/signup')({
  component: SignupPage,
})

function SignupPage() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!agreedToTerms) return
    setIsLoading(true)
    setTimeout(() => setIsLoading(false), 1500)
  }

  const getPasswordStrength = (password: string) => {
    if (password.length === 0) return { strength: 0, label: '', color: '' }
    if (password.length < 6) return { strength: 1, label: 'Too short', color: '#EF4444' }
    if (password.length < 8) return { strength: 2, label: 'Weak', color: '#F59E0B' }
    if (!/[A-Z]/.test(password) || !/[0-9]/.test(password)) return { strength: 3, label: 'Good', color: '#14B8A6' }
    return { strength: 4, label: 'Strong', color: '#22C55E' }
  }

  const passwordStrength = getPasswordStrength(formData.password)

  return (
    <div className="min-h-screen flex">
      {/* Left side - Visual */}
      <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden">
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
        <div className="relative z-10 flex flex-col justify-center items-center w-full px-12">
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
              className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-[#E2E8F0] shadow-sm mb-8"
            >
              <span className="w-2 h-2 bg-[#22C55E] rounded-full animate-pulse" />
              <span className="text-[#1E293B] text-sm font-medium">3,500+ teams scaling their outreach</span>
            </motion.div>

            <h2 className="text-[32px] font-bold text-[#1E293B] mb-4 leading-tight tracking-[-0.02em]">
              Start your
              <br />
              <span className="text-[#14B8A6]">7-day trial</span> for $1
            </h2>

            <p className="text-[#64748B] text-[15px] leading-relaxed mb-10">
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
            className="absolute top-24 left-16 w-3 h-3 rounded-full bg-[#14B8A6]"
            animate={{ scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 3, repeat: Infinity }}
          />
          <motion.div
            className="absolute bottom-28 right-20 w-2 h-2 rounded-full bg-[#FF6B35]"
            animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 4, repeat: Infinity, delay: 1 }}
          />
          <motion.div
            className="absolute top-1/3 right-16 w-20 h-20 rounded-2xl border border-[#E2E8F0] bg-white/50"
            animate={{ y: [0, -8, 0], rotate: [0, -2, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute bottom-32 left-20 w-14 h-14 rounded-xl border border-[#E2E8F0] bg-white/50"
            animate={{ y: [0, 6, 0], rotate: [0, 2, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          />
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-20 py-8 sm:py-0 bg-white relative">
        {/* Subtle background pattern */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `radial-gradient(#1E293B 1px, transparent 1px)`,
            backgroundSize: '24px 24px',
          }}
        />

        <div className="w-full max-w-[400px] mx-auto relative z-10">
          {/* Logo */}
          <Link to="/" className="inline-flex items-center gap-2 sm:gap-2.5 mb-6 sm:mb-10 group">
            <img src={logoImage} alt="SalesParrot" className="w-8 h-8 sm:w-10 sm:h-10 object-contain" />
            <span className="font-bold text-lg sm:text-xl text-[#1E293B] group-hover:text-[#FF6B35] transition-colors">
              SalesParrot
            </span>
          </Link>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-[26px] sm:text-[32px] font-bold text-[#1E293B] mb-2 tracking-[-0.02em]">
              Create your account
            </h1>
            <p className="text-[#64748B] text-sm sm:text-[15px]">
              Already have an account?{' '}
              <Link to="/login" className="text-[#FF6B35] font-semibold hover:text-[#E85A2A] transition-colors">
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
            className="mt-6 sm:mt-8 space-y-4 sm:space-y-5"
          >
            {/* Full name */}
            <div>
              <label htmlFor="fullName" className="block text-sm font-semibold text-[#1E293B] mb-2">
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
                className="w-full px-4 py-3.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35] focus:bg-white transition-all duration-200"
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-[#1E293B] mb-2">
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
                className="w-full px-4 py-3.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35] focus:bg-white transition-all duration-200"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-[#1E293B] mb-2">
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
                  className="w-full px-4 py-3.5 pr-12 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35] focus:bg-white transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#64748B] transition-colors"
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
                    <div className="flex gap-1 flex-1">
                      {[1, 2, 3, 4].map((level) => (
                        <div
                          key={level}
                          className="h-1.5 flex-1 rounded-full transition-all duration-300"
                          style={{
                            backgroundColor: level <= passwordStrength.strength ? passwordStrength.color : '#E2E8F0',
                          }}
                        />
                      ))}
                    </div>
                    <span className="text-xs font-medium min-w-[60px] text-right" style={{ color: passwordStrength.color }}>
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
                className="w-4 h-4 mt-0.5 rounded border-[#E2E8F0] text-[#FF6B35] focus:ring-[#FF6B35] cursor-pointer"
                required
              />
              <label htmlFor="terms" className="text-sm text-[#64748B] cursor-pointer leading-relaxed">
                I agree to the{' '}
                <Link to="/" className="text-[#FF6B35] font-medium hover:underline">Terms</Link>
                {' '}and{' '}
                <Link to="/" className="text-[#FF6B35] font-medium hover:underline">Privacy Policy</Link>
              </label>
            </div>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={isLoading || !agreedToTerms}
              whileHover={{ scale: 1.01, y: -1 }}
              whileTap={{ scale: 0.99 }}
              className="w-full py-4 px-6 bg-[#FF6B35] text-white font-semibold rounded-xl hover:bg-[#E85A2A] focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:ring-offset-2 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-[0_4px_14px_rgba(255,107,53,0.25)] hover:shadow-[0_6px_20px_rgba(255,107,53,0.35)]"
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

            {/* Trial info */}
            <p className="text-center text-[#94A3B8] text-xs">
              7-day full access. Cancel anytime.
            </p>
          </motion.form>
        </div>
      </div>
    </div>
  )
}

function BenefitItem({ title, description }: { icon?: string; title: string; description: string }) {
  return (
    <div className="flex items-start gap-4">
      <div className="w-6 h-6 rounded-full bg-[#14B8A6]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
        <svg className="w-3.5 h-3.5 text-[#14B8A6]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <div>
        <h3 className="text-[#1E293B] font-semibold text-[15px]">{title}</h3>
        <p className="text-[#64748B] text-sm mt-0.5">{description}</p>
      </div>
    </div>
  )
}

function EyeIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

function EyeOffIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
    </svg>
  )
}

function LoadingSpinner() {
  return (
    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  )
}
