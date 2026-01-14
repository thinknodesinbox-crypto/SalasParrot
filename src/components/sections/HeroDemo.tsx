import { motion } from 'framer-motion'
import { useState } from 'react'
import { SendersPanel } from '../panels/SendersPanel'
import { SequenceBuilderPanel } from '../panels/SequenceBuilderPanel'
import { UnifiedInboxPanel } from '../panels/UnifiedInboxPanel'

export function HeroDemo() {
  const [highlightEmails, setHighlightEmails] = useState(false)
  const [, setActiveSender] = useState<string | null>(null)

  return (
    <div
      className="relative w-full rounded-[32px] overflow-hidden"
      style={{
        background: `
          linear-gradient(135deg,
            rgba(248, 250, 252, 0.95) 0%,
            rgba(241, 245, 249, 0.9) 25%,
            rgba(236, 240, 244, 0.85) 50%,
            rgba(241, 245, 249, 0.9) 75%,
            rgba(248, 250, 252, 0.95) 100%
          )
        `,
        minHeight: '600px',
        boxShadow: `
          0 50px 100px -20px rgba(30, 41, 59, 0.15),
          0 30px 60px -30px rgba(30, 41, 59, 0.2),
          inset 0 1px 0 rgba(255, 255, 255, 0.8),
          inset 0 -1px 0 rgba(0, 0, 0, 0.05)
        `,
      }}
    >
      {/* Mesh gradient overlay */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 100% 100% at 0% 0%, rgba(20, 184, 166, 0.12) 0%, transparent 50%),
            radial-gradient(ellipse 80% 80% at 100% 0%, rgba(167, 139, 250, 0.1) 0%, transparent 40%),
            radial-gradient(ellipse 60% 60% at 100% 100%, rgba(251, 146, 60, 0.08) 0%, transparent 40%),
            radial-gradient(ellipse 80% 80% at 0% 100%, rgba(20, 184, 166, 0.06) 0%, transparent 40%)
          `,
        }}
      />

      {/* Subtle noise texture */}
      <div
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Content container */}
      <div className="relative w-full h-full" style={{ minHeight: '600px' }}>

        {/* === SEQUENCE BUILDER - Center focal point === */}
        <motion.div
          className="absolute z-20"
          style={{
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.div
            whileHover={{ y: -4 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          >
            <span className="block text-[11px] text-slate-400/80 tracking-[0.15em] uppercase font-semibold mb-3 text-center">
              Sequence Builder
            </span>
            <SequenceBuilderPanel onEmailNodeHover={setHighlightEmails} variant="hero" />
          </motion.div>
        </motion.div>

        {/* === SENDERS PANEL - Top left, overlapping sequence === */}
        <motion.div
          className="absolute z-30"
          style={{ top: '60px', left: '60px' }}
          initial={{ opacity: 0, x: -40, y: -20 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.div
            whileHover={{ y: -4, x: 2 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          >
            <span className="block text-[11px] text-slate-400/80 tracking-[0.15em] uppercase font-semibold mb-3">
              Senders
            </span>
            <SendersPanel onSenderHover={setActiveSender} variant="hero" />
          </motion.div>
        </motion.div>

        {/* === UNIFIED INBOX - Bottom right, overlapping sequence === */}
        <motion.div
          className="absolute z-30"
          style={{ bottom: '60px', right: '60px' }}
          initial={{ opacity: 0, x: 40, y: 20 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.div
            whileHover={{ y: -4, x: -2 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          >
            <span className="block text-[11px] text-slate-400/80 tracking-[0.15em] uppercase font-semibold mb-3">
              Unified Inbox
            </span>
            <UnifiedInboxPanel highlightEmails={highlightEmails} variant="hero" />
          </motion.div>
        </motion.div>

        {/* Decorative connection lines (SVG) */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" style={{ minHeight: '600px' }}>
          <defs>
            <linearGradient id="lineGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(20, 184, 166, 0.3)" />
              <stop offset="100%" stopColor="rgba(20, 184, 166, 0.05)" />
            </linearGradient>
            <linearGradient id="lineGradient2" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(251, 146, 60, 0.3)" />
              <stop offset="100%" stopColor="rgba(251, 146, 60, 0.05)" />
            </linearGradient>
          </defs>
          {/* Subtle connecting curves */}
          <motion.path
            d="M 280 220 Q 350 280 420 300"
            stroke="url(#lineGradient1)"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ delay: 0.8, duration: 1.2, ease: 'easeOut' }}
          />
          <motion.path
            d="M 720 380 Q 650 320 580 300"
            stroke="url(#lineGradient2)"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ delay: 1, duration: 1.2, ease: 'easeOut' }}
          />
        </svg>

        {/* Floating accent dots */}
        <motion.div
          className="absolute w-2 h-2 rounded-full bg-teal-400/40"
          style={{ top: '25%', left: '35%' }}
          animate={{ y: [0, -6, 0], opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute w-1.5 h-1.5 rounded-full bg-orange-400/30"
          style={{ bottom: '30%', right: '35%' }}
          animate={{ y: [0, 5, 0], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        />
        <motion.div
          className="absolute w-2.5 h-2.5 rounded-full bg-purple-400/25"
          style={{ top: '60%', left: '20%' }}
          animate={{ y: [0, -4, 0], opacity: [0.25, 0.4, 0.25] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
        />
      </div>
    </div>
  )
}
