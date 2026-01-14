import { motion } from 'framer-motion'
import { useState } from 'react'

interface Message {
  id: string
  name: string
  avatar: string
  platform: 'linkedin' | 'email'
  preview: string
  time: string
  unread: boolean
}

const messages: Message[] = [
  {
    id: '1',
    name: 'Emily Zhang',
    avatar: 'https://i.pravatar.cc/150?u=emilyzhang',
    platform: 'linkedin',
    preview: "Let's schedule a call this week.",
    time: '2m',
    unread: true,
  },
  {
    id: '2',
    name: 'Michael Torres',
    avatar: 'https://i.pravatar.cc/150?u=michaeltorres',
    platform: 'email',
    preview: 'Free Thursday at 3pm?',
    time: '15m',
    unread: true,
  },
  {
    id: '3',
    name: 'Jessica Patel',
    avatar: 'https://i.pravatar.cc/150?u=jessicapatel',
    platform: 'linkedin',
    preview: 'Interested! Send more info.',
    time: '1h',
    unread: true,
  },
  {
    id: '4',
    name: 'David Kim',
    avatar: 'https://i.pravatar.cc/150?u=davidokonkwo',
    platform: 'email',
    preview: "Thanks! Let's connect.",
    time: '2h',
    unread: false,
  },
]

interface UnifiedInboxPanelProps {
  highlightEmails?: boolean
  variant?: 'hero' | 'feature'
}

export function UnifiedInboxPanel({ highlightEmails = false, variant = 'hero' }: UnifiedInboxPanelProps) {
  const [hoveredMessage, setHoveredMessage] = useState<string | null>(null)

  const unreadCount = messages.filter((m) => m.unread).length
  const panelWidth = variant === 'hero' ? 280 : 380

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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-500/25 to-orange-600/15 flex items-center justify-center shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
              <svg className="w-4 h-4 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <div>
              <h3 className="text-white font-semibold text-[14px] tracking-tight">Unified Inbox</h3>
              <p className="text-white/40 text-[10px] mt-0.5">All replies in one place</p>
            </div>
          </div>
          <motion.div
            className="flex items-center gap-1.5 px-2.5 py-1 bg-orange-500/10 rounded-full border border-orange-500/20"
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <motion.span
              className="w-2 h-2 bg-orange-400 rounded-full"
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            <span className="text-orange-400 text-[10px] font-semibold">{unreadCount}</span>
          </motion.div>
        </div>
      </div>

      {/* Message List */}
      <div className="p-3">
        <div className="space-y-0.5">
          {messages.map((message, index) => (
            <motion.div
              key={message.id}
              className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all duration-300 ${
                hoveredMessage === message.id
                  ? 'bg-white/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'
                  : 'bg-transparent hover:bg-white/[0.04]'
              } ${highlightEmails && message.platform === 'email' ? 'ring-1 ring-orange-500/30 bg-orange-500/[0.03]' : ''}`}
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.08, duration: 0.4 }}
              onMouseEnter={() => setHoveredMessage(message.id)}
              onMouseLeave={() => setHoveredMessage(null)}
              whileHover={{ x: -2 }}
            >
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <img
                  src={message.avatar}
                  alt={message.name}
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-white/[0.08]"
                />
                {message.unread && (
                  <motion.span
                    className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-orange-500 rounded-full border-[2px] border-slate-800"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className={`font-medium text-[11px] truncate ${message.unread ? 'text-white' : 'text-white/50'}`}>
                    {message.name}
                  </span>

                  {/* Platform Icon */}
                  {message.platform === 'linkedin' ? (
                    <svg className="w-3 h-3 text-[#0A66C2] flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M16.338 16.338H13.67V12.16c0-.995-.017-2.277-1.387-2.277-1.39 0-1.601 1.086-1.601 2.207v4.248H8.014v-8.59h2.559v1.174h.037c.356-.675 1.227-1.387 2.526-1.387 2.703 0 3.203 1.778 3.203 4.092v4.711zM5.005 6.575a1.548 1.548 0 11-.003-3.096 1.548 1.548 0 01.003 3.096zm-1.337 9.763H6.34v-8.59H3.667v8.59zM17.668 1H2.328C1.595 1 1 1.581 1 2.298v15.403C1 18.418 1.595 19 2.328 19h15.34c.734 0 1.332-.582 1.332-1.299V2.298C19 1.581 18.402 1 17.668 1z" />
                    </svg>
                  ) : (
                    <svg className="w-3 h-3 text-orange-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                  )}

                  <span className="text-white/25 text-[9px] ml-auto flex-shrink-0">{message.time}</span>
                </div>
                <p className={`text-[10px] truncate mt-0.5 ${message.unread ? 'text-white/40' : 'text-white/30'}`}>
                  {message.preview}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
