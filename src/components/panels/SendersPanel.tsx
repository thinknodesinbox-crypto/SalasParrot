import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'

interface Sender {
  id: string
  name: string
  avatar: string
  status: 'active' | 'warming' | 'paused'
  emailsSent: number
  connections: number
  replyRate: number
}

const initialSenders: Sender[] = [
  { id: '1', name: 'Alex Morgan', avatar: '/images/avatars/alex-morgan.png', status: 'active', emailsSent: 147, connections: 89, replyRate: 24 },
  { id: '2', name: 'Jordan Lee', avatar: '/images/avatars/jordan-lee.png', status: 'active', emailsSent: 203, connections: 156, replyRate: 31 },
  { id: '3', name: 'Taylor Kim', avatar: '/images/avatars/taylor-kim.png', status: 'active', emailsSent: 98, connections: 67, replyRate: 28 },
]

interface SendersPanelProps {
  onSenderHover?: (senderId: string | null) => void
  variant?: 'hero' | 'feature'
}

export function SendersPanel({ onSenderHover, variant = 'hero' }: SendersPanelProps) {
  const isHero = variant === 'hero'
  const [senders, setSenders] = useState(initialSenders)
  const [activeSenderId, setActiveSenderId] = useState<string | null>(null)
  const [sendingId, setSendingId] = useState<string | null>(null)

  // Simulate live activity - increment stats periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const randomSenderIndex = Math.floor(Math.random() * senders.length)
      const randomSender = senders[randomSenderIndex]

      setSendingId(randomSender.id)

      setTimeout(() => {
        setSenders(prev => prev.map((s, i) =>
          i === randomSenderIndex
            ? { ...s, emailsSent: s.emailsSent + 1 }
            : s
        ))
        setSendingId(null)
      }, 800)
    }, 3000)

    return () => clearInterval(interval)
  }, [senders.length])

  const handleSenderClick = (senderId: string) => {
    setActiveSenderId(activeSenderId === senderId ? null : senderId)
  }

  return (
    <motion.div
      style={{
        width: 260,
        background: isHero
          ? 'linear-gradient(145deg, rgba(30, 41, 59, 0.98) 0%, rgba(30, 41, 59, 0.95) 50%, rgba(25, 35, 50, 0.98) 100%)'
          : 'linear-gradient(145deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.88) 50%, rgba(248, 250, 252, 0.92) 100%)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        border: isHero ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(226, 232, 240, 0.5)',
        borderRadius: 16,
        boxShadow: isHero
          ? '0 12px 40px rgba(0, 0, 0, 0.5), 0 4px 12px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.08)'
          : '0 8px 30px rgba(30, 41, 59, 0.08)',
        overflow: 'hidden',
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      {/* Header */}
      <div style={{ padding: '20px 20px 12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 style={{
          fontSize: 16,
          fontWeight: 600,
          color: isHero ? 'white' : '#1E293B',
          margin: 0,
        }}>
          Your Accounts
        </h3>
        <motion.div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '4px 8px',
            background: 'rgba(34, 197, 94, 0.15)',
            borderRadius: 6,
          }}
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <motion.div
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: '#22C55E',
            }}
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <span style={{ fontSize: 10, fontWeight: 600, color: '#4ADE80' }}>
            All Active
          </span>
        </motion.div>
      </div>

      {/* Sender List */}
      <div style={{ padding: '0 12px 16px 12px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {senders.map((sender, index) => (
            <motion.div
              key={sender.id}
              style={{
                padding: 12,
                borderRadius: 12,
                background: activeSenderId === sender.id
                  ? (isHero ? 'rgba(20, 184, 166, 0.15)' : 'rgba(20, 184, 166, 0.1)')
                  : (isHero ? 'rgba(51, 65, 85, 0.4)' : 'rgba(248, 250, 252, 1)'),
                border: activeSenderId === sender.id
                  ? '1px solid rgba(20, 184, 166, 0.3)'
                  : '1px solid transparent',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden',
              }}
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1, duration: 0.4 }}
              whileHover={{
                scale: 1.02,
                background: isHero ? 'rgba(51, 65, 85, 0.6)' : 'rgba(241, 245, 249, 1)',
              }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleSenderClick(sender.id)}
              onMouseEnter={() => onSenderHover?.(sender.id)}
              onMouseLeave={() => onSenderHover?.(null)}
            >
              {/* Sending indicator shimmer */}
              <AnimatePresence>
                {sendingId === sender.id && (
                  <motion.div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: 'linear-gradient(90deg, transparent, rgba(20, 184, 166, 0.2), transparent)',
                      zIndex: 0,
                    }}
                    initial={{ x: '-100%' }}
                    animate={{ x: '100%' }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8, ease: 'easeInOut' }}
                  />
                )}
              </AnimatePresence>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative', zIndex: 1 }}>
                {/* Avatar */}
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <motion.img
                    src={sender.avatar}
                    alt={sender.name}
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: activeSenderId === sender.id
                        ? '2px solid rgba(20, 184, 166, 0.5)'
                        : '2px solid rgba(255, 255, 255, 0.2)',
                    }}
                    whileHover={{ scale: 1.05 }}
                  />
                  {/* Active indicator with pulse */}
                  <motion.span
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      right: 0,
                      width: 12,
                      height: 12,
                      background: '#22C55E',
                      borderRadius: '50%',
                      border: isHero ? '2px solid #1E293B' : '2px solid white',
                    }}
                    animate={{
                      boxShadow: [
                        '0 0 0 0 rgba(34, 197, 94, 0.4)',
                        '0 0 0 6px rgba(34, 197, 94, 0)',
                      ],
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  {/* Sending icon */}
                  <AnimatePresence>
                    {sendingId === sender.id && (
                      <motion.div
                        style={{
                          position: 'absolute',
                          top: -4,
                          right: -4,
                          width: 18,
                          height: 18,
                          background: '#14B8A6',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                      >
                        <motion.svg
                          width="10"
                          height="10"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="white"
                          strokeWidth="3"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                        >
                          <path d="M12 2v4m0 12v4m-6-10H2m20 0h-4" strokeLinecap="round" />
                        </motion.svg>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Name and Stats */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: isHero ? 'white' : '#1E293B',
                    }}>
                      {sender.name}
                    </span>
                  </div>

                  {/* Live stats row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <motion.div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 3,
                      }}
                      key={sender.emailsSent}
                      initial={{ scale: 1 }}
                      animate={{ scale: sendingId === sender.id ? [1, 1.1, 1] : 1 }}
                    >
                      <svg width="10" height="10" viewBox="0 0 20 20" fill="#14B8A6">
                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                      </svg>
                      <span style={{ fontSize: 11, color: isHero ? '#94A3B8' : '#64748B', fontWeight: 500 }}>
                        {sender.emailsSent}
                      </span>
                    </motion.div>
                    <div style={{ width: 1, height: 10, background: isHero ? 'rgba(148, 163, 184, 0.3)' : 'rgba(100, 116, 139, 0.2)' }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                      <svg width="10" height="10" viewBox="0 0 20 20" fill="#0A66C2">
                        <path d="M16.338 16.338H13.67V12.16c0-.995-.017-2.277-1.387-2.277-1.39 0-1.601 1.086-1.601 2.207v4.248H8.014v-8.59h2.559v1.174h.037c.356-.675 1.227-1.387 2.526-1.387 2.703 0 3.203 1.778 3.203 4.092v4.711zM5.005 6.575a1.548 1.548 0 11-.003-3.096 1.548 1.548 0 01.003 3.096zm-1.337 9.763H6.34v-8.59H3.667v8.59zM17.668 1H2.328C1.595 1 1 1.581 1 2.298v15.403C1 18.418 1.595 19 2.328 19h15.34c.734 0 1.332-.582 1.332-1.299V2.298C19 1.581 18.402 1 17.668 1z" />
                      </svg>
                      <span style={{ fontSize: 11, color: isHero ? '#94A3B8' : '#64748B', fontWeight: 500 }}>
                        {sender.connections}
                      </span>
                    </div>
                    <div style={{ width: 1, height: 10, background: isHero ? 'rgba(148, 163, 184, 0.3)' : 'rgba(100, 116, 139, 0.2)' }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                      <span style={{ fontSize: 11, color: '#22C55E', fontWeight: 600 }}>
                        {sender.replyRate}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Expanded details */}
              <AnimatePresence>
                {activeSenderId === sender.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    style={{ overflow: 'hidden', position: 'relative', zIndex: 1 }}
                  >
                    <div style={{
                      marginTop: 12,
                      paddingTop: 12,
                      borderTop: isHero ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(226, 232, 240, 0.5)',
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: 8,
                    }}>
                      <motion.button
                        style={{
                          padding: '8px 12px',
                          background: 'rgba(20, 184, 166, 0.2)',
                          border: '1px solid rgba(20, 184, 166, 0.3)',
                          borderRadius: 8,
                          color: '#14B8A6',
                          fontSize: 11,
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 4,
                        }}
                        whileHover={{ scale: 1.02, background: 'rgba(20, 184, 166, 0.3)' }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        View Stats
                      </motion.button>
                      <motion.button
                        style={{
                          padding: '8px 12px',
                          background: isHero ? 'rgba(51, 65, 85, 0.8)' : 'rgba(241, 245, 249, 1)',
                          border: isHero ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(226, 232, 240, 0.5)',
                          borderRadius: 8,
                          color: isHero ? '#CBD5E1' : '#64748B',
                          fontSize: 11,
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 4,
                        }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Settings
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Add Account Button */}
      <div style={{ padding: '0 12px 16px 12px' }}>
        <motion.button
          style={{
            width: '100%',
            padding: '10px 16px',
            background: 'transparent',
            border: isHero ? '1px dashed rgba(255, 255, 255, 0.2)' : '1px dashed rgba(226, 232, 240, 0.8)',
            borderRadius: 10,
            color: isHero ? '#64748B' : '#94A3B8',
            fontSize: 12,
            fontWeight: 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}
          whileHover={{
            background: isHero ? 'rgba(255, 255, 255, 0.05)' : 'rgba(248, 250, 252, 1)',
            borderColor: isHero ? 'rgba(255, 255, 255, 0.3)' : 'rgba(203, 213, 225, 1)',
            color: isHero ? '#94A3B8' : '#64748B',
          }}
          whileTap={{ scale: 0.98 }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 4v16m8-8H4" strokeLinecap="round" />
          </svg>
          Add Account
        </motion.button>
      </div>
    </motion.div>
  )
}
