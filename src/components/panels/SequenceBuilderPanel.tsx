import { motion } from 'framer-motion'
import { useState } from 'react'

interface SequenceBuilderPanelProps {
  onEmailNodeHover?: (isHovered: boolean) => void
  variant?: 'hero' | 'feature'
}

export function SequenceBuilderPanel({ onEmailNodeHover, variant = 'hero' }: SequenceBuilderPanelProps) {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)

  const handleNodeHover = (nodeId: string | null) => {
    setHoveredNode(nodeId)
    if (nodeId === 'email') {
      onEmailNodeHover?.(true)
    } else if (nodeId === null) {
      onEmailNodeHover?.(false)
    }
  }

  const panelWidth = variant === 'hero' ? 380 : 420

  return (
    <motion.div
      className="glass-panel relative"
      style={{ width: panelWidth }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      {/* Header */}
      <div className="px-6 pt-5 pb-4 border-b border-white/[0.06]">
        <div className="flex items-center justify-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal-500/25 to-teal-600/15 flex items-center justify-center shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
            <svg className="w-4.5 h-4.5 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h3 className="text-white font-semibold text-[15px] tracking-tight">Smart Outreach Sequence</h3>
        </div>
      </div>

      {/* Flow Chart with SVG connectors */}
      <div className="px-6 py-5 relative">
        {/* SVG Flow Lines */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ left: 0, top: 0 }}
          viewBox="0 0 380 320"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <linearGradient id="flowGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(20, 184, 166, 0.8)" />
              <stop offset="100%" stopColor="rgba(20, 184, 166, 0.2)" />
            </linearGradient>
            <linearGradient id="flowGradientGreen" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(16, 185, 129, 0.7)" />
              <stop offset="100%" stopColor="rgba(16, 185, 129, 0.3)" />
            </linearGradient>
            <linearGradient id="flowGradientOrange" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(251, 146, 60, 0.7)" />
              <stop offset="100%" stopColor="rgba(251, 146, 60, 0.3)" />
            </linearGradient>
            {/* Glow filter */}
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Main vertical line: Start -> LinkedIn -> Diamond */}
          <motion.path
            d="M 190 45 L 190 75"
            stroke="url(#flowGradient)"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            filter="url(#glow)"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          />
          <motion.path
            d="M 190 105 L 190 135"
            stroke="url(#flowGradient)"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            filter="url(#glow)"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          />

          {/* Branch lines from diamond */}
          {/* Left branch (Accepted) */}
          <motion.path
            d="M 160 185 Q 120 195 110 220"
            stroke="url(#flowGradientGreen)"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            filter="url(#glow)"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          />
          <motion.path
            d="M 110 250 L 110 270"
            stroke="url(#flowGradientGreen)"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            filter="url(#glow)"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.4, delay: 0.8 }}
          />

          {/* Right branch (Not Accepted) */}
          <motion.path
            d="M 220 185 Q 260 195 270 220"
            stroke="url(#flowGradientOrange)"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            filter="url(#glow)"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          />
          <motion.path
            d="M 270 250 L 270 270"
            stroke="url(#flowGradientOrange)"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            filter="url(#glow)"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.4, delay: 0.8 }}
          />

          {/* Animated flow dots */}
          <motion.circle
            r="3"
            fill="#14B8A6"
            filter="url(#glow)"
            initial={{ opacity: 0 }}
            animate={{
              opacity: [0, 1, 1, 0],
              cx: [190, 190, 190, 190],
              cy: [45, 75, 105, 135],
            }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear', delay: 1 }}
          />
        </svg>

        {/* Flow Chart Nodes */}
        <div className="flex flex-col items-center relative z-10">
          {/* Campaign Start */}
          <FlowNode
            icon={<RocketIcon />}
            label="Campaign Start"
            isHovered={hoveredNode === 'start'}
            onHover={() => handleNodeHover('start')}
            onLeave={() => handleNodeHover(null)}
          />

          <div className="h-8" />

          {/* Connection Request */}
          <FlowNode
            icon={<LinkedInIcon />}
            label="Connection Request"
            isHovered={hoveredNode === 'connection'}
            onHover={() => handleNodeHover('connection')}
            onLeave={() => handleNodeHover(null)}
          />

          <div className="h-6" />

          {/* Decision Diamond */}
          <motion.div
            className="relative my-2"
            whileHover={{ scale: 1.02 }}
          >
            <div className="w-[100px] h-[100px] flex items-center justify-center">
              {/* Diamond shape */}
              <div
                className="absolute w-[72px] h-[72px] rounded-xl border-2 border-teal-500/40"
                style={{
                  transform: 'rotate(45deg)',
                  background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(30, 41, 59, 0.7) 100%)',
                  boxShadow: '0 0 30px rgba(20, 184, 166, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                }}
              />
              {/* Inner glow */}
              <div
                className="absolute w-[60px] h-[60px] rounded-lg opacity-50"
                style={{
                  transform: 'rotate(45deg)',
                  background: 'radial-gradient(circle, rgba(20, 184, 166, 0.2) 0%, transparent 70%)',
                }}
              />
              <span className="relative z-10 text-white text-[11px] font-semibold whitespace-nowrap">
                If Connected?
              </span>
            </div>
          </motion.div>

          <div className="h-3" />

          {/* Branching Paths */}
          <div className="flex items-start justify-center gap-16 w-full">
            {/* Left: Accepted */}
            <div className="flex flex-col items-center">
              <motion.div
                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-3"
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
                <span className="text-emerald-400 text-[10px] font-semibold tracking-wide">Accepted</span>
              </motion.div>

              <FlowNode
                icon={<ClockIcon />}
                label="Wait 1 Day"
                isHovered={hoveredNode === 'wait1'}
                onHover={() => handleNodeHover('wait1')}
                onLeave={() => handleNodeHover(null)}
                small
                variant="success"
              />
              <div className="h-5" />
              <FlowNode
                icon={<MessageIcon />}
                label="Send Message"
                isHovered={hoveredNode === 'message'}
                onHover={() => handleNodeHover('message')}
                onLeave={() => handleNodeHover(null)}
                small
                variant="success"
              />
            </div>

            {/* Right: Not Accepted */}
            <div className="flex flex-col items-center">
              <motion.div
                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 mb-3"
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <div className="w-2 h-2 rounded-full bg-orange-400 shadow-[0_0_6px_rgba(251,146,60,0.6)]" />
                <span className="text-orange-400 text-[10px] font-semibold tracking-wide">Not Accepted</span>
              </motion.div>

              <FlowNode
                icon={<ClockIcon />}
                label="Wait 3 Days"
                isHovered={hoveredNode === 'wait3'}
                onHover={() => handleNodeHover('wait3')}
                onLeave={() => handleNodeHover(null)}
                small
                variant="warning"
              />
              <div className="h-5" />
              <FlowNode
                icon={<EmailIcon />}
                label="Send Email"
                isHovered={hoveredNode === 'email'}
                onHover={() => handleNodeHover('email')}
                onLeave={() => handleNodeHover(null)}
                small
                variant="warning"
                highlight
              />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// Premium Flow Node Component
function FlowNode({
  icon,
  label,
  isHovered,
  onHover,
  onLeave,
  small = false,
  variant = 'default',
  highlight = false,
}: {
  icon: React.ReactNode
  label: string
  isHovered: boolean
  onHover: () => void
  onLeave: () => void
  small?: boolean
  variant?: 'default' | 'success' | 'warning'
  highlight?: boolean
}) {
  const baseClasses = small ? 'px-4 py-2.5' : 'px-5 py-3'

  const variantClasses = {
    default: isHovered
      ? 'bg-white/[0.12] border-teal-500/50 shadow-[0_0_20px_rgba(20,184,166,0.2)]'
      : 'bg-white/[0.06] border-white/[0.08] hover:bg-white/[0.08]',
    success: isHovered
      ? 'bg-emerald-500/15 border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
      : 'bg-white/[0.04] border-emerald-500/20 hover:bg-emerald-500/10',
    warning: isHovered
      ? 'bg-orange-500/15 border-orange-500/40 shadow-[0_0_20px_rgba(251,146,60,0.2)]'
      : highlight
        ? 'bg-orange-500/10 border-orange-500/30'
        : 'bg-white/[0.04] border-orange-500/20 hover:bg-orange-500/10',
  }

  return (
    <motion.div
      className={`flex items-center gap-2.5 cursor-pointer rounded-2xl border backdrop-blur-sm transition-all duration-300 ${baseClasses} ${variantClasses[variant]}`}
      style={{
        boxShadow: isHovered ? undefined : 'inset 0 1px 0 rgba(255, 255, 255, 0.05)',
      }}
      whileHover={{ scale: 1.03, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <span className={`${small ? 'text-base' : 'text-lg'}`}>{icon}</span>
      <span className={`text-white font-medium ${small ? 'text-[11px]' : 'text-[13px]'}`}>{label}</span>
    </motion.div>
  )
}

// LinkedIn Icon
function LinkedInIcon() {
  return (
    <svg className="w-[18px] h-[18px] text-[#0A66C2]" fill="currentColor" viewBox="0 0 20 20">
      <path d="M16.338 16.338H13.67V12.16c0-.995-.017-2.277-1.387-2.277-1.39 0-1.601 1.086-1.601 2.207v4.248H8.014v-8.59h2.559v1.174h.037c.356-.675 1.227-1.387 2.526-1.387 2.703 0 3.203 1.778 3.203 4.092v4.711zM5.005 6.575a1.548 1.548 0 11-.003-3.096 1.548 1.548 0 01.003 3.096zm-1.337 9.763H6.34v-8.59H3.667v8.59zM17.668 1H2.328C1.595 1 1 1.581 1 2.298v15.403C1 18.418 1.595 19 2.328 19h15.34c.734 0 1.332-.582 1.332-1.299V2.298C19 1.581 18.402 1 17.668 1z" />
    </svg>
  )
}

// Email Icon
function EmailIcon() {
  return (
    <svg className="w-[18px] h-[18px] text-orange-400" fill="currentColor" viewBox="0 0 20 20">
      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
    </svg>
  )
}

// Rocket Icon
function RocketIcon() {
  return (
    <svg className="w-[18px] h-[18px] text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
    </svg>
  )
}

// Clock Icon
function ClockIcon() {
  return (
    <svg className="w-[18px] h-[18px] text-current" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

// Message Icon
function MessageIcon() {
  return (
    <svg className="w-[18px] h-[18px] text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  )
}
