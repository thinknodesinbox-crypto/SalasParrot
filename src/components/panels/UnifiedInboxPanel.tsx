import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

interface Message {
  id: string;
  name: string;
  avatar: string;
  platform: 'linkedin' | 'email';
  preview: string;
  fullMessage: string;
  time: string;
  isRead: boolean;
  isTyping?: boolean;
}

const initialMessages: Message[] = [
  {
    id: '1',
    name: 'Emily Zhang',
    avatar: '/images/avatars/emily-zhang.webp',
    platform: 'linkedin',
    preview: "Let's schedule a call. I'm a startup founder.",
    fullMessage:
      "Hi! I saw your outreach and I'm really interested. Let's schedule a call. I'm a startup founder looking for exactly this kind of solution. When are you free this week?",
    time: '2m ago',
    isRead: false,
  },
  {
    id: '2',
    name: 'Michael Torres',
    avatar: '/images/avatars/michael-torres.webp',
    platform: 'email',
    preview: 'Free Thursday for a quick chat?',
    fullMessage:
      "Thanks for reaching out! Your product looks promising. I'm free Thursday afternoon for a quick chat. Does 2pm PST work for you? Looking forward to learning more.",
    time: '5m ago',
    isRead: false,
  },
  {
    id: '3',
    name: 'Jessica Patel',
    avatar: '/images/avatars/jessica-patel.webp',
    platform: 'linkedin',
    preview: 'Interested! Send more info on pricing.',
    fullMessage:
      "This looks great! Interested! Could you send more info on pricing? We're a team of 15 and looking to scale our outreach efforts significantly.",
    time: '12m ago',
    isRead: false,
  },
  {
    id: '4',
    name: 'David Okonkwo',
    avatar: '/images/avatars/david-okonkwo.png',
    platform: 'email',
    preview: "Thanks for reaching out. Let's connect.",
    fullMessage:
      "Thanks for reaching out. Your timing is perfect - we're actively looking for an outreach solution. Let's connect this week to discuss how you can help us scale.",
    time: '1h ago',
    isRead: true,
  },
  {
    id: '5',
    name: 'Sophie Martin',
    avatar: '/images/avatars/sophie-martin.png',
    platform: 'linkedin',
    preview: 'Sounds promising. Do you have case studies?',
    fullMessage:
      'Sounds promising. Do you have case studies I could look at? Particularly interested in results from SaaS companies similar to ours. Thanks!',
    time: '2h ago',
    isRead: true,
  },
];

interface UnifiedInboxPanelProps {
  highlightEmails?: boolean;
  variant?: 'hero' | 'feature';
}

export function UnifiedInboxPanel({ variant = 'hero' }: UnifiedInboxPanelProps) {
  const isHero = variant === 'hero';
  const panelWidth = isHero ? 340 : 380;
  const [messages, setMessages] = useState(initialMessages);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replySent, setReplySent] = useState<string | null>(null);
  const [typingMessageId, setTypingMessageId] = useState<string | null>(null);

  // Simulate someone typing
  useEffect(() => {
    const interval = setInterval(() => {
      const unreadMessages = messages.filter((m) => !m.isRead);
      if (unreadMessages.length > 0) {
        const randomIndex = Math.floor(Math.random() * unreadMessages.length);
        setTypingMessageId(unreadMessages[randomIndex].id);
        setTimeout(() => setTypingMessageId(null), 2000);
      }
    }, 8000);

    return () => clearInterval(interval);
  }, [messages]);

  const unreadCount = messages.filter((m) => !m.isRead).length;

  const handleMessageClick = (messageId: string) => {
    setExpandedId(expandedId === messageId ? null : messageId);
    // Mark as read when expanded
    setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, isRead: true } : m)));
  };

  const handleReply = (messageId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setReplyingTo(messageId);
  };

  const handleSendReply = (messageId: string) => {
    setReplyingTo(null);
    setReplySent(messageId);
    setTimeout(() => setReplySent(null), 2000);
  };

  const panelStyle = isHero
    ? {
        width: panelWidth,
        background:
          'linear-gradient(145deg, rgba(30, 41, 59, 0.98) 0%, rgba(30, 41, 59, 0.95) 50%, rgba(25, 35, 50, 0.98) 100%)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '16px',
        boxShadow:
          '0 12px 40px rgba(0, 0, 0, 0.5), 0 4px 12px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
      }
    : {
        width: panelWidth,
      };

  return (
    <motion.div
      className={!isHero ? 'glass-panel' : ''}
      style={panelStyle}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      {/* Header */}
      <div
        style={{
          padding: '16px 20px 12px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <h3
            style={{
              fontWeight: 600,
              fontSize: 16,
              color: isHero ? 'white' : '#1E293B',
              margin: 0,
            }}
          >
            Unified Inbox
          </h3>
          <motion.div
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#14B8A6',
            }}
            animate={{
              scale: [1, 1.3, 1],
              opacity: [1, 0.7, 1],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </div>
        <motion.span
          style={{
            padding: '4px 10px',
            background: 'rgba(20, 184, 166, 0.2)',
            color: '#14B8A6',
            fontSize: 11,
            fontWeight: 600,
            borderRadius: 6,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
          animate={unreadCount > 0 ? { scale: [1, 1.05, 1] } : {}}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <motion.span key={unreadCount} initial={{ scale: 1.3 }} animate={{ scale: 1 }}>
            {unreadCount}
          </motion.span>
          new
        </motion.span>
      </div>

      {/* Filter tabs */}
      <div style={{ padding: '0 16px 8px 16px' }}>
        <div
          style={{
            display: 'flex',
            gap: 4,
            padding: 4,
            background: isHero ? 'rgba(51, 65, 85, 0.5)' : 'rgba(241, 245, 249, 1)',
            borderRadius: 8,
          }}
        >
          {['All', 'LinkedIn', 'Email'].map((tab, i) => (
            <motion.button
              key={tab}
              style={{
                flex: 1,
                padding: '6px 12px',
                fontSize: 11,
                fontWeight: 500,
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
                background:
                  i === 0 ? (isHero ? 'rgba(20, 184, 166, 0.3)' : 'white') : 'transparent',
                color: i === 0 ? '#14B8A6' : isHero ? '#94A3B8' : '#64748B',
                boxShadow: i === 0 ? '0 1px 3px rgba(0, 0, 0, 0.1)' : 'none',
              }}
              whileHover={{
                background: isHero ? 'rgba(51, 65, 85, 0.8)' : 'rgba(248, 250, 252, 1)',
              }}
              whileTap={{ scale: 0.98 }}
            >
              {tab}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Message List */}
      <div style={{ padding: '0 12px 16px 12px', maxHeight: 380, overflowY: 'auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {messages.map((message, index) => (
            <motion.div
              key={message.id}
              style={{
                borderRadius: 10,
                background:
                  expandedId === message.id
                    ? isHero
                      ? 'rgba(20, 184, 166, 0.1)'
                      : 'rgba(20, 184, 166, 0.05)'
                    : !message.isRead
                      ? isHero
                        ? 'rgba(51, 65, 85, 0.5)'
                        : 'rgba(248, 250, 252, 1)'
                      : isHero
                        ? 'rgba(51, 65, 85, 0.25)'
                        : 'rgba(248, 250, 252, 0.7)',
                border:
                  expandedId === message.id
                    ? '1px solid rgba(20, 184, 166, 0.3)'
                    : !message.isRead
                      ? '1px solid rgba(20, 184, 166, 0.15)'
                      : '1px solid transparent',
                cursor: 'pointer',
                overflow: 'hidden',
                position: 'relative',
              }}
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.06, duration: 0.4 }}
              whileHover={{
                background: isHero ? 'rgba(51, 65, 85, 0.6)' : 'rgba(241, 245, 249, 1)',
              }}
              onClick={() => handleMessageClick(message.id)}
              layout
            >
              {/* Unread indicator - enhanced visibility */}
              {!message.isRead && (
                <motion.div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: 4,
                    background: 'linear-gradient(180deg, #14B8A6 0%, #10B981 100%)',
                    borderRadius: '0 3px 3px 0',
                    boxShadow: '0 0 8px rgba(20, 184, 166, 0.5)',
                  }}
                  layoutId={`unread-${message.id}`}
                  animate={{
                    boxShadow: [
                      '0 0 8px rgba(20, 184, 166, 0.5)',
                      '0 0 12px rgba(20, 184, 166, 0.8)',
                      '0 0 8px rgba(20, 184, 166, 0.5)',
                    ],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}

              {/* Reply sent success indicator */}
              <AnimatePresence>
                {replySent === message.id && (
                  <motion.div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'rgba(20, 184, 166, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 10,
                    }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <motion.div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '8px 16px',
                        background: 'rgba(20, 184, 166, 0.9)',
                        borderRadius: 8,
                        color: 'white',
                        fontSize: 13,
                        fontWeight: 600,
                      }}
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      Reply Sent!
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div style={{ padding: 12 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  {/* Avatar */}
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <motion.img
                      src={message.avatar}
                      alt={message.name}
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: !message.isRead
                          ? '2px solid rgba(20, 184, 166, 0.5)'
                          : '2px solid rgba(255, 255, 255, 0.2)',
                      }}
                      whileHover={{ scale: 1.05 }}
                    />
                    {/* Platform badge */}
                    <div
                      style={{
                        position: 'absolute',
                        bottom: -2,
                        right: -2,
                        width: 18,
                        height: 18,
                        borderRadius: '50%',
                        background: isHero ? '#1E293B' : 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '2px solid ' + (isHero ? '#1E293B' : 'white'),
                      }}
                    >
                      {message.platform === 'linkedin' ? (
                        <svg width="10" height="10" viewBox="0 0 20 20" fill="#0A66C2">
                          <path d="M16.338 16.338H13.67V12.16c0-.995-.017-2.277-1.387-2.277-1.39 0-1.601 1.086-1.601 2.207v4.248H8.014v-8.59h2.559v1.174h.037c.356-.675 1.227-1.387 2.526-1.387 2.703 0 3.203 1.778 3.203 4.092v4.711zM5.005 6.575a1.548 1.548 0 11-.003-3.096 1.548 1.548 0 01.003 3.096zm-1.337 9.763H6.34v-8.59H3.667v8.59zM17.668 1H2.328C1.595 1 1 1.581 1 2.298v15.403C1 18.418 1.595 19 2.328 19h15.34c.734 0 1.332-.582 1.332-1.299V2.298C19 1.581 18.402 1 17.668 1z" />
                        </svg>
                      ) : (
                        <svg width="10" height="10" viewBox="0 0 20 20" fill="#14B8A6">
                          <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                          <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                        </svg>
                      )}
                    </div>
                    {/* Typing indicator */}
                    <AnimatePresence>
                      {typingMessageId === message.id && (
                        <motion.div
                          style={{
                            position: 'absolute',
                            top: -4,
                            right: -4,
                            padding: '2px 6px',
                            background: isHero ? '#334155' : 'white',
                            borderRadius: 8,
                            display: 'flex',
                            gap: 2,
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                          }}
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                        >
                          {[0, 1, 2].map((i) => (
                            <motion.div
                              key={i}
                              style={{
                                width: 4,
                                height: 4,
                                borderRadius: '50%',
                                background: '#14B8A6',
                              }}
                              animate={{ y: [0, -3, 0] }}
                              transition={{
                                duration: 0.6,
                                repeat: Infinity,
                                delay: i * 0.15,
                              }}
                            />
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: 4,
                      }}
                    >
                      <span
                        style={{
                          fontWeight: !message.isRead ? 700 : 500,
                          fontSize: 13,
                          color: isHero ? 'white' : '#1E293B',
                        }}
                      >
                        {message.name}
                      </span>
                      <span
                        style={{
                          fontSize: 10,
                          color: isHero ? '#64748B' : '#94A3B8',
                        }}
                      >
                        {message.time}
                      </span>
                    </div>
                    <p
                      style={{
                        fontSize: 12,
                        color: isHero ? '#94A3B8' : '#64748B',
                        margin: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: expandedId === message.id ? 'normal' : 'nowrap',
                        fontWeight: !message.isRead ? 500 : 400,
                      }}
                    >
                      {expandedId === message.id ? message.fullMessage : message.preview}
                    </p>

                    {/* Expanded actions */}
                    <AnimatePresence>
                      {expandedId === message.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          style={{ overflow: 'hidden' }}
                        >
                          {/* Reply input */}
                          <AnimatePresence>
                            {replyingTo === message.id ? (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                style={{ marginTop: 12 }}
                              >
                                <div
                                  style={{
                                    display: 'flex',
                                    gap: 8,
                                    padding: 8,
                                    background: isHero
                                      ? 'rgba(51, 65, 85, 0.5)'
                                      : 'rgba(241, 245, 249, 1)',
                                    borderRadius: 8,
                                  }}
                                >
                                  <input
                                    type="text"
                                    placeholder="Type your reply..."
                                    onClick={(e) => e.stopPropagation()}
                                    style={{
                                      flex: 1,
                                      padding: '8px 12px',
                                      fontSize: 12,
                                      border: 'none',
                                      borderRadius: 6,
                                      background: isHero ? 'rgba(30, 41, 59, 0.8)' : 'white',
                                      color: isHero ? 'white' : '#1E293B',
                                      outline: 'none',
                                    }}
                                    autoFocus
                                  />
                                  <motion.button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleSendReply(message.id);
                                    }}
                                    style={{
                                      padding: '8px 16px',
                                      background:
                                        'linear-gradient(135deg, #14B8A6 0%, #0D9488 100%)',
                                      border: 'none',
                                      borderRadius: 6,
                                      color: 'white',
                                      fontSize: 12,
                                      fontWeight: 600,
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 4,
                                    }}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                  >
                                    <svg
                                      width="12"
                                      height="12"
                                      viewBox="0 0 24 24"
                                      fill="currentColor"
                                    >
                                      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                                    </svg>
                                    Send
                                  </motion.button>
                                </div>
                              </motion.div>
                            ) : (
                              <motion.div
                                style={{
                                  display: 'flex',
                                  gap: 8,
                                  marginTop: 12,
                                }}
                                initial={{ y: -10, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                              >
                                <motion.button
                                  onClick={(e) => handleReply(message.id, e)}
                                  style={{
                                    flex: 1,
                                    padding: '8px 12px',
                                    background: 'linear-gradient(135deg, #14B8A6 0%, #0D9488 100%)',
                                    border: 'none',
                                    borderRadius: 6,
                                    color: 'white',
                                    fontSize: 11,
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 4,
                                  }}
                                  whileHover={{
                                    scale: 1.02,
                                    boxShadow: '0 4px 12px rgba(20, 184, 166, 0.4)',
                                  }}
                                  whileTap={{ scale: 0.98 }}
                                >
                                  <svg
                                    width="12"
                                    height="12"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                                    />
                                  </svg>
                                  Reply
                                </motion.button>
                                <motion.button
                                  onClick={(e) => e.stopPropagation()}
                                  style={{
                                    padding: '8px 12px',
                                    background: isHero
                                      ? 'rgba(51, 65, 85, 0.8)'
                                      : 'rgba(241, 245, 249, 1)',
                                    border: isHero
                                      ? '1px solid rgba(255, 255, 255, 0.1)'
                                      : '1px solid rgba(226, 232, 240, 0.5)',
                                    borderRadius: 6,
                                    color: isHero ? '#94A3B8' : '#64748B',
                                    fontSize: 11,
                                    fontWeight: 500,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 4,
                                  }}
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                >
                                  <svg
                                    width="12"
                                    height="12"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                                    />
                                  </svg>
                                  Save
                                </motion.button>
                                <motion.button
                                  onClick={(e) => e.stopPropagation()}
                                  style={{
                                    padding: '8px 12px',
                                    background: isHero
                                      ? 'rgba(51, 65, 85, 0.8)'
                                      : 'rgba(241, 245, 249, 1)',
                                    border: isHero
                                      ? '1px solid rgba(255, 255, 255, 0.1)'
                                      : '1px solid rgba(226, 232, 240, 0.5)',
                                    borderRadius: 6,
                                    color: isHero ? '#94A3B8' : '#64748B',
                                    fontSize: 11,
                                    fontWeight: 500,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 4,
                                  }}
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                >
                                  <svg
                                    width="12"
                                    height="12"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                                    />
                                  </svg>
                                </motion.button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Quick compose button */}
      <div style={{ padding: '0 12px 16px 12px' }}>
        <motion.button
          style={{
            width: '100%',
            padding: '12px 16px',
            background:
              'linear-gradient(135deg, rgba(20, 184, 166, 0.2) 0%, rgba(13, 148, 136, 0.2) 100%)',
            border: '1px dashed rgba(20, 184, 166, 0.4)',
            borderRadius: 10,
            color: '#14B8A6',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
          whileHover={{
            background:
              'linear-gradient(135deg, rgba(20, 184, 166, 0.3) 0%, rgba(13, 148, 136, 0.3) 100%)',
            borderColor: 'rgba(20, 184, 166, 0.6)',
          }}
          whileTap={{ scale: 0.98 }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
          Compose New Message
        </motion.button>
      </div>
    </motion.div>
  );
}
