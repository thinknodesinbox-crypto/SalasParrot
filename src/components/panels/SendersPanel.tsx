import { motion } from 'framer-motion'
import { useState } from 'react'

interface Sender {
  id: string
  name: string
  avatar: string
  status: 'active' | 'warming' | 'paused'
  messages: number
}

const senders: Sender[] = [
  { id: '1', name: 'Alex Morgan', avatar: 'https://i.pravatar.cc/150?u=alexmorgan', status: 'active', messages: 847 },
  { id: '2', name: 'Jordan Lee', avatar: 'https://i.pravatar.cc/150?u=jordanlee', status: 'active', messages: 623 },
  { id: '3', name: 'Taylor Kim', avatar: 'https://i.pravatar.cc/150?u=taylorkim', status: 'active', messages: 412 },
]

interface SendersPanelProps {
  onSenderHover?: (senderId: string | null) => void
  variant?: 'hero' | 'feature'
}

export function SendersPanel({ onSenderHover, variant = 'hero' }: SendersPanelProps) {
  const [hoveredSender, setHoveredSender] = useState<string | null>(null)

  const handleSenderHover = (id: string | null) => {
    setHoveredSender(id)
    onSenderHover?.(id)
  }

  const panelWidth = variant === 'hero' ? 240 : 300

  return (
    <motion.div
      className="glass-panel"
      style={{ width: panelWidth }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal-500/25 to-teal-600/15 flex items-center justify-center shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
            <svg className="w-4 h-4 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-white font-semibold text-[14px] tracking-tight">Your Accounts</h3>
            <p className="text-white/40 text-[10px] mt-0.5">{senders.length} connected</p>
          </div>
        </div>
      </div>

      {/* Sender List */}
      <div className="p-3">
        <div className="space-y-1">
          {senders.map((sender, index) => (
            <motion.div
              key={sender.id}
              className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all duration-300 ${
                hoveredSender === sender.id
                  ? 'bg-white/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_0_20px_rgba(20,184,166,0.1)]'
                  : 'bg-transparent hover:bg-white/[0.04]'
              }`}
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1, duration: 0.4 }}
              onMouseEnter={() => handleSenderHover(sender.id)}
              onMouseLeave={() => handleSenderHover(null)}
              whileHover={{ x: 2 }}
            >
              {/* Avatar with Status Ring */}
              <motion.div className="relative flex-shrink-0" whileHover={{ scale: 1.05 }}>
                <img
                  src={sender.avatar}
                  alt={sender.name}
                  className="w-9 h-9 rounded-full object-cover ring-2 ring-white/[0.08]"
                />
                {/* Animated active status */}
                <motion.span
                  className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-[2px] border-slate-800"
                  animate={{
                    boxShadow: ['0 0 0 0 rgba(16, 185, 129, 0.4)', '0 0 0 4px rgba(16, 185, 129, 0)', '0 0 0 0 rgba(16, 185, 129, 0.4)'],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </motion.div>

              {/* Name and Status */}
              <div className="flex-1 min-w-0">
                <p className="text-white text-[12px] font-medium truncate">{sender.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-emerald-400 text-[10px] font-medium flex items-center gap-1">
                    <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Active
                  </span>
                  <span className="text-white/30 text-[10px]">•</span>
                  <span className="text-white/40 text-[10px]">{sender.messages} sent</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Add Account Button - only show in feature variant */}
      {variant === 'feature' && (
        <div className="px-3 pb-4">
          <motion.button
            className="w-full py-2.5 rounded-xl border border-dashed border-white/10 text-white/40 text-[11px] font-medium hover:border-teal-500/30 hover:text-teal-400 hover:bg-teal-500/5 transition-all duration-300"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            + Add Account
          </motion.button>
        </div>
      )}
    </motion.div>
  )
}
