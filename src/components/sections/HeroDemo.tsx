import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
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

      {/* Mobile Layout - Custom mobile-optimized sequence */}
      <div className="flex md:hidden flex-col items-center px-4 py-6">
        <MobileSequenceFlow />
      </div>
    </div>
  )
}

// Mobile-optimized sequence visualization
function MobileSequenceFlow() {
  const [activeNode, setActiveNode] = useState<string | null>(null)
  const [stats, setStats] = useState({
    campaign: 1247,
    connection: 1189,
  })

  // Simulate live updates
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(prev => ({
        campaign: prev.campaign + Math.floor(Math.random() * 3),
        connection: prev.connection + Math.floor(Math.random() * 2),
      }))
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  return (
    <motion.div
      className="w-full max-w-[340px]"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      style={{
        background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.98) 0%, rgba(25, 35, 50, 0.98) 100%)',
        borderRadius: 20,
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 25px 50px rgba(0, 0, 0, 0.4)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
        <h3 className="text-white font-semibold text-[15px]">Smart Outreach Sequence</h3>
        <motion.div
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md"
          style={{ background: 'rgba(20, 184, 166, 0.15)' }}
          animate={{ scale: [1, 1.03, 1] }}
          transition={{ duration: 2.5, repeat: Infinity }}
        >
          <motion.div
            className="w-1.5 h-1.5 rounded-full bg-teal-400"
            animate={{ opacity: [1, 0.4, 1] }}
            transition={{ duration: 1.2, repeat: Infinity }}
          />
          <span className="text-teal-400 text-[11px] font-semibold">Live</span>
        </motion.div>
      </div>

      {/* Flow Content */}
      <div className="px-4 py-5">
        {/* Campaign Start */}
        <MobileNode
          icon="▶"
          iconBg="bg-teal-500"
          label="Campaign Start"
          stat={stats.campaign}
          isActive={activeNode === 'campaign'}
          onTap={() => setActiveNode(activeNode === 'campaign' ? null : 'campaign')}
          delay={0}
        />

        <MobileArrow />

        {/* Connection Request */}
        <MobileNode
          icon={<LinkedInMiniIcon />}
          iconBg="bg-[#0A66C2]"
          label="Connection Request"
          stat={stats.connection}
          isActive={activeNode === 'connection'}
          onTap={() => setActiveNode(activeNode === 'connection' ? null : 'connection')}
          delay={0.1}
        />

        <MobileArrow />

        {/* Decision Node */}
        <motion.div
          className="flex items-center justify-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <motion.div
            className="flex items-center gap-2 px-4 py-2 rounded-full border-2 border-teal-500/50"
            style={{ background: 'rgba(45, 55, 72, 0.9)' }}
            whileTap={{ scale: 0.97 }}
          >
            <motion.span
              className="text-teal-400 text-sm"
              animate={{ rotate: [0, 180, 360] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
            >
              ◇
            </motion.span>
            <span className="text-white text-[13px] font-medium">If Connected?</span>
          </motion.div>
        </motion.div>

        {/* Branch Split */}
        <div className="flex justify-center my-3">
          <svg width="200" height="32" viewBox="0 0 200 32">
            <motion.path
              d="M100 0 L100 8 Q100 14 60 14 L40 14 L40 28"
              stroke="rgba(16, 185, 129, 0.6)"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            />
            <motion.path
              d="M100 0 L100 8 Q100 14 140 14 L160 14 L160 28"
              stroke="rgba(20, 184, 166, 0.6)"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            />
            <text x="20" y="12" fill="#10B981" fontSize="9" fontWeight="600">Yes</text>
            <text x="172" y="12" fill="#14B8A6" fontSize="9" fontWeight="600">No</text>
          </svg>
        </div>

        {/* Two Branches */}
        <div className="flex gap-3">
          {/* Left Branch - LinkedIn Message */}
          <motion.div
            className="flex-1 flex flex-col items-center gap-2"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div
              className="w-full py-2 px-2 rounded-lg text-center border border-emerald-500/40"
              style={{ background: 'rgba(16, 185, 129, 0.1)' }}
            >
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <span className="text-emerald-400 text-xs">✓</span>
                <span className="text-white/90 text-[11px] font-medium">Accepted</span>
              </div>
            </div>
            <svg width="2" height="12" className="opacity-50">
              <line x1="1" y1="0" x2="1" y2="12" stroke="#10B981" strokeWidth="2" />
            </svg>
            <motion.button
              className="w-full py-2.5 px-3 rounded-lg font-semibold text-[12px] text-white flex items-center justify-center gap-1.5"
              style={{
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)',
              }}
              whileTap={{ scale: 0.96 }}
              animate={activeNode === 'sendMsg' ? { scale: [1, 1.03, 1] } : {}}
              transition={{ duration: 1.5, repeat: activeNode === 'sendMsg' ? Infinity : 0 }}
              onTouchStart={() => setActiveNode('sendMsg')}
              onTouchEnd={() => setActiveNode(null)}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
              </svg>
              Send Message
            </motion.button>
            <span className="text-[10px] text-emerald-400/80 font-medium">LinkedIn DM</span>
          </motion.div>

          {/* Right Branch - Email */}
          <motion.div
            className="flex-1 flex flex-col items-center gap-2"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div
              className="w-full py-2 px-2 rounded-lg text-center border border-teal-500/40"
              style={{ background: 'rgba(20, 184, 166, 0.1)' }}
            >
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <span className="text-teal-400 text-xs">✗</span>
                <span className="text-white/90 text-[11px] font-medium">Not Accepted</span>
              </div>
            </div>
            <svg width="2" height="12" className="opacity-50">
              <line x1="1" y1="0" x2="1" y2="12" stroke="#14B8A6" strokeWidth="2" />
            </svg>
            <motion.button
              className="w-full py-2.5 px-3 rounded-lg font-semibold text-[12px] text-white flex items-center justify-center gap-1.5"
              style={{
                background: 'linear-gradient(135deg, #14B8A6 0%, #0D9488 100%)',
                boxShadow: '0 4px 15px rgba(20, 184, 166, 0.3)',
              }}
              whileTap={{ scale: 0.96 }}
              animate={activeNode === 'sendEmail' ? { scale: [1, 1.03, 1] } : {}}
              transition={{ duration: 1.5, repeat: activeNode === 'sendEmail' ? Infinity : 0 }}
              onTouchStart={() => setActiveNode('sendEmail')}
              onTouchEnd={() => setActiveNode(null)}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
                <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
              </svg>
              Send Email
            </motion.button>
            <span className="text-[10px] text-teal-400/80 font-medium">Email Follow-up</span>
          </motion.div>
        </div>
      </div>

      {/* Footer - Value Proposition */}
      <div className="px-4 py-3 border-t border-white/10 bg-white/[0.02]">
        <div className="flex items-center justify-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-[10px] text-slate-400">LinkedIn</span>
          </div>
          <div className="text-slate-600">+</div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-teal-500" />
            <span className="text-[10px] text-slate-400">Email</span>
          </div>
          <div className="text-slate-600">=</div>
          <span className="text-[10px] text-white font-medium">More Replies</span>
        </div>
      </div>
    </motion.div>
  )
}

// Mobile node component
function MobileNode({
  icon,
  iconBg,
  label,
  stat,
  isActive,
  onTap,
  delay,
}: {
  icon: React.ReactNode
  iconBg: string
  label: string
  stat: number
  isActive: boolean
  onTap: () => void
  delay: number
}) {
  return (
    <motion.div
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all ${
        isActive
          ? 'border-teal-500/60 bg-teal-500/10'
          : 'border-white/10 bg-white/[0.03]'
      }`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      whileTap={{ scale: 0.98 }}
      onTouchStart={onTap}
      onTouchEnd={onTap}
    >
      <div className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center text-white text-sm`}>
        {icon}
      </div>
      <span className="text-white text-[13px] font-medium flex-1">{label}</span>
      <motion.span
        className="px-2 py-0.5 rounded text-[11px] font-semibold text-teal-400"
        style={{ background: 'rgba(20, 184, 166, 0.15)' }}
        key={stat}
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 0.3 }}
      >
        {stat.toLocaleString()}
      </motion.span>
    </motion.div>
  )
}

// Mobile arrow
function MobileArrow() {
  return (
    <div className="flex justify-center py-1.5">
      <motion.div
        initial={{ opacity: 0, scaleY: 0 }}
        animate={{ opacity: 1, scaleY: 1 }}
        className="flex flex-col items-center"
      >
        <div className="w-0.5 h-3 bg-teal-500/50 rounded-full" />
        <svg width="8" height="6" viewBox="0 0 8 6" className="-mt-0.5">
          <path d="M4 6L0 0h8L4 6z" fill="rgba(20, 184, 166, 0.5)" />
        </svg>
      </motion.div>
    </div>
  )
}

// LinkedIn mini icon
function LinkedInMiniIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
      <path d="M19 3a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h14m-.5 15.5v-5.3a3.26 3.26 0 00-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 011.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 001.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 00-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
    </svg>
  )
}
