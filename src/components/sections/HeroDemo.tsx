import { motion } from 'framer-motion'
import { useState } from 'react'
import { SendersPanel } from '../panels/SendersPanel'
import { SequenceBuilderPanel } from '../panels/SequenceBuilderPanel'
import { UnifiedInboxPanel } from '../panels/UnifiedInboxPanel'

export function HeroDemo() {
  const [highlightEmails, setHighlightEmails] = useState(false)
  const [, setActiveSender] = useState<string | null>(null)
  const [hoveredPanel, setHoveredPanel] = useState<string | null>(null)

  return (
    <div
      className="relative w-full rounded-[24px] md:rounded-[32px] overflow-hidden"
      style={{
        backgroundImage: 'url(/images/hero-mesh-bg.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        boxShadow: '0 50px 100px -20px rgba(30, 41, 59, 0.12), 0 30px 60px -30px rgba(30, 41, 59, 0.15)',
      }}
    >
      {/* Desktop Layout */}
      <div
        className="hidden lg:block relative w-full"
        style={{ height: '700px' }}
      >
        {/* Panel 1: SENDERS PANEL - Top Left */}
        <motion.div
          className="absolute"
          style={{
            top: 32,
            left: 40,
            zIndex: 30,
          }}
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          onMouseEnter={() => setHoveredPanel('senders')}
          onMouseLeave={() => setHoveredPanel(null)}
        >
          <motion.div
            animate={{
              y: hoveredPanel === 'senders' ? -6 : 0,
              scale: hoveredPanel === 'senders' ? 1.02 : 1,
            }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            style={{
              filter: hoveredPanel === 'senders'
                ? 'drop-shadow(0 30px 60px rgba(0, 0, 0, 0.6))'
                : 'drop-shadow(0 20px 40px rgba(0, 0, 0, 0.4))',
            }}
          >
            <SendersPanel onSenderHover={setActiveSender} variant="hero" />
          </motion.div>
        </motion.div>

        {/* Panel 2: SEQUENCE BUILDER - Center */}
        <motion.div
          className="absolute"
          style={{
            top: 50,
            left: 280,
            zIndex: 20,
          }}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          onMouseEnter={() => setHoveredPanel('sequence')}
          onMouseLeave={() => setHoveredPanel(null)}
        >
          <motion.div
            animate={{
              y: hoveredPanel === 'sequence' ? -5 : 0,
              scale: hoveredPanel === 'sequence' ? 1.01 : 1,
            }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            style={{
              filter: hoveredPanel === 'sequence'
                ? 'drop-shadow(0 35px 70px rgba(0, 0, 0, 0.5))'
                : 'drop-shadow(0 25px 50px rgba(0, 0, 0, 0.35))',
            }}
          >
            <SequenceBuilderPanel onEmailNodeHover={setHighlightEmails} variant="hero" />
          </motion.div>
        </motion.div>

        {/* Panel 3: UNIFIED INBOX - Right side */}
        <motion.div
          className="absolute"
          style={{
            top: 120,
            right: 40,
            zIndex: 25,
          }}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          onMouseEnter={() => setHoveredPanel('inbox')}
          onMouseLeave={() => setHoveredPanel(null)}
        >
          <motion.div
            animate={{
              y: hoveredPanel === 'inbox' ? -6 : 0,
              scale: hoveredPanel === 'inbox' ? 1.02 : 1,
            }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            style={{
              filter: hoveredPanel === 'inbox'
                ? 'drop-shadow(0 30px 60px rgba(0, 0, 0, 0.6))'
                : 'drop-shadow(0 20px 40px rgba(0, 0, 0, 0.4))',
            }}
          >
            <UnifiedInboxPanel highlightEmails={highlightEmails} variant="hero" />
          </motion.div>
        </motion.div>
      </div>

      {/* Tablet Layout */}
      <div
        className="hidden md:flex lg:hidden flex-col items-center justify-center py-10 px-6"
        style={{ minHeight: '580px' }}
      >
        <div className="text-[10px] text-slate-400/80 tracking-[0.15em] uppercase font-semibold mb-3">
          Sequence Builder
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          style={{ filter: 'drop-shadow(0 20px 40px rgba(0, 0, 0, 0.4))' }}
        >
          <SequenceBuilderPanel onEmailNodeHover={setHighlightEmails} variant="hero" />
        </motion.div>

        <motion.div
          className="flex items-center justify-center gap-4 mt-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/80 rounded-full">
            <div className="w-5 h-5 rounded-lg bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857" />
              </svg>
            </div>
            <span className="text-white text-[11px] font-medium">Multiple Senders</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/80 rounded-full">
            <div className="w-5 h-5 rounded-lg bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7" />
              </svg>
            </div>
            <span className="text-white text-[11px] font-medium">Unified Inbox</span>
          </div>
        </motion.div>
      </div>

      {/* Mobile Layout */}
      <div
        className="flex md:hidden flex-col items-center justify-center py-8 px-4"
        style={{ minHeight: '540px' }}
      >
        <div className="text-[9px] text-slate-400/80 tracking-[0.15em] uppercase font-semibold mb-3">
          Smart Sequence
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="w-full overflow-x-auto flex justify-center"
          style={{ filter: 'drop-shadow(0 16px 32px rgba(0, 0, 0, 0.35))' }}
        >
          <SequenceBuilderPanel onEmailNodeHover={setHighlightEmails} variant="hero" />
        </motion.div>

        <motion.div
          className="flex flex-wrap items-center justify-center gap-2 mt-5"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800/80 rounded-full">
            <div className="w-4 h-4 rounded-md bg-gradient-to-br from-teal-500 to-teal-600" />
            <span className="text-white text-[10px] font-medium">Senders</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800/80 rounded-full">
            <div className="w-4 h-4 rounded-md bg-gradient-to-br from-teal-500 to-teal-600" />
            <span className="text-white text-[10px] font-medium">Inbox</span>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
