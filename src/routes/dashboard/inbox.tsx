import { createFileRoute } from '@tanstack/react-router'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'

export const Route = createFileRoute('/dashboard/inbox')({
  component: InboxPage,
})

interface Message {
  id: string
  leadId: string
  leadName: string
  leadCompany: string
  leadTitle: string
  leadAvatar?: string
  channel: 'linkedin' | 'email'
  campaignName: string
  subject?: string
  preview: string
  content: string
  timestamp: string
  isRead: boolean
  thread: ThreadMessage[]
}

interface ThreadMessage {
  id: string
  content: string
  timestamp: string
  isOutbound: boolean
  channel: 'linkedin' | 'email'
}

function InboxPage() {
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null)
  const [filter, setFilter] = useState<'all' | 'linkedin' | 'email' | 'unread'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [replyText, setReplyText] = useState('')

  const [messages, setMessages] = useState<Message[]>([
    // Sample messages
    {
      id: '1',
      leadId: 'lead1',
      leadName: 'Sarah Johnson',
      leadCompany: 'TechCorp',
      leadTitle: 'VP of Sales',
      channel: 'linkedin',
      campaignName: 'Q1 Tech Leaders',
      preview: "Hi! Thanks for reaching out. I'd love to learn more about what you're building...",
      content: "Hi! Thanks for reaching out. I'd love to learn more about what you're building. Can we schedule a quick call next week?",
      timestamp: '2 hours ago',
      isRead: false,
      thread: [
        {
          id: 't1',
          content: "Hi Sarah, I noticed you're leading sales at TechCorp. We help teams like yours automate LinkedIn outreach while keeping it personal. Would you be open to a quick chat?",
          timestamp: 'Yesterday at 2:30 PM',
          isOutbound: true,
          channel: 'linkedin'
        },
        {
          id: 't2',
          content: "Hi! Thanks for reaching out. I'd love to learn more about what you're building. Can we schedule a quick call next week?",
          timestamp: '2 hours ago',
          isOutbound: false,
          channel: 'linkedin'
        }
      ]
    },
    {
      id: '2',
      leadId: 'lead2',
      leadName: 'Michael Chen',
      leadCompany: 'StartupXYZ',
      leadTitle: 'Founder & CEO',
      channel: 'email',
      campaignName: 'Series A Founders',
      subject: 'Re: Quick question about outreach',
      preview: "This sounds interesting. What kind of results are your customers seeing?",
      content: "This sounds interesting. What kind of results are your customers seeing? We've been struggling with response rates lately.",
      timestamp: '5 hours ago',
      isRead: false,
      thread: [
        {
          id: 't1',
          content: "Hi Michael, I came across StartupXYZ and was impressed by your growth. Are you currently using any tools for sales outreach?",
          timestamp: 'Yesterday at 10:00 AM',
          isOutbound: true,
          channel: 'email'
        },
        {
          id: 't2',
          content: "This sounds interesting. What kind of results are your customers seeing? We've been struggling with response rates lately.",
          timestamp: '5 hours ago',
          isOutbound: false,
          channel: 'email'
        }
      ]
    },
    {
      id: '3',
      leadId: 'lead3',
      leadName: 'Emily Davis',
      leadCompany: 'GrowthCo',
      leadTitle: 'Head of BD',
      channel: 'linkedin',
      campaignName: 'Agency Partners',
      preview: "Thanks for connecting! I see you work with agencies...",
      content: "Thanks for connecting! I see you work with agencies. We're actually looking for new tools to help scale our outreach. Can you tell me more?",
      timestamp: 'Yesterday',
      isRead: true,
      thread: [
        {
          id: 't1',
          content: "Hi Emily, great to connect! I noticed GrowthCo helps startups scale. We have several agencies using SalesParrot to manage outreach for their clients. Happy to share how it works.",
          timestamp: '2 days ago',
          isOutbound: true,
          channel: 'linkedin'
        },
        {
          id: 't2',
          content: "Thanks for connecting! I see you work with agencies. We're actually looking for new tools to help scale our outreach. Can you tell me more?",
          timestamp: 'Yesterday',
          isOutbound: false,
          channel: 'linkedin'
        }
      ]
    },
  ])

  const filteredMessages = messages.filter(m => {
    if (filter === 'linkedin' && m.channel !== 'linkedin') return false
    if (filter === 'email' && m.channel !== 'email') return false
    if (filter === 'unread' && m.isRead) return false
    if (searchQuery && !m.leadName.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  const unreadCount = messages.filter(m => !m.isRead).length

  const handleSendReply = () => {
    if (!selectedMessage || !replyText.trim()) return

    const updatedMessages = messages.map(m => {
      if (m.id === selectedMessage.id) {
        return {
          ...m,
          isRead: true,
          thread: [
            ...m.thread,
            {
              id: Date.now().toString(),
              content: replyText,
              timestamp: 'Just now',
              isOutbound: true,
              channel: m.channel
            }
          ]
        }
      }
      return m
    })

    setMessages(updatedMessages)
    setSelectedMessage({
      ...selectedMessage,
      thread: [
        ...selectedMessage.thread,
        {
          id: Date.now().toString(),
          content: replyText,
          timestamp: 'Just now',
          isOutbound: true,
          channel: selectedMessage.channel
        }
      ]
    })
    setReplyText('')
  }

  const markAsRead = (messageId: string) => {
    setMessages(messages.map(m =>
      m.id === messageId ? { ...m, isRead: true } : m
    ))
  }

  return (
    <div className="h-[calc(100vh-7rem)] flex bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
      {/* Message List */}
      <div className={`w-full md:w-96 border-r border-[#E2E8F0] flex flex-col ${selectedMessage ? 'hidden md:flex' : 'flex'}`}>
        {/* Header */}
        <div className="p-4 border-b border-[#E2E8F0]">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-lg font-bold text-[#1E293B]">Inbox</h1>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 bg-[#FF6B35] text-white text-xs font-medium rounded-full">
                {unreadCount} new
              </span>
            )}
          </div>
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search messages..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35]"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="px-4 py-2 border-b border-[#E2E8F0] flex gap-2 overflow-x-auto">
          {(['all', 'unread', 'linkedin', 'email'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                filter === f
                  ? 'bg-[#FF6B35] text-white'
                  : 'bg-[#F8FAFC] text-[#64748B] hover:bg-[#E2E8F0]'
              }`}
            >
              {f === 'all' ? 'All' : f === 'unread' ? 'Unread' : f === 'linkedin' ? 'LinkedIn' : 'Email'}
            </button>
          ))}
        </div>

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto">
          {filteredMessages.length === 0 ? (
            <div className="p-8 text-center">
              <InboxEmptyIcon className="w-12 h-12 text-[#E2E8F0] mx-auto mb-3" />
              <p className="text-[#64748B]">No messages</p>
            </div>
          ) : (
            filteredMessages.map((message) => (
              <button
                key={message.id}
                onClick={() => {
                  setSelectedMessage(message)
                  markAsRead(message.id)
                }}
                className={`w-full p-4 text-left border-b border-[#E2E8F0] transition-colors ${
                  selectedMessage?.id === message.id
                    ? 'bg-[#FFF7ED]'
                    : message.isRead
                    ? 'hover:bg-[#F8FAFC]'
                    : 'bg-[#FFFBEB] hover:bg-[#FFF7ED]'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF6B35] to-[#14B8A6] flex items-center justify-center text-white text-sm font-medium">
                      {message.leadName.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center ${
                      message.channel === 'linkedin' ? 'bg-[#0A66C2]' : 'bg-[#14B8A6]'
                    }`}>
                      {message.channel === 'linkedin' ? (
                        <LinkedInIcon className="w-3 h-3 text-white" />
                      ) : (
                        <EmailIcon className="w-3 h-3 text-white" />
                      )}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-sm font-medium truncate ${!message.isRead ? 'text-[#1E293B]' : 'text-[#64748B]'}`}>
                        {message.leadName}
                      </span>
                      <span className="text-xs text-[#94A3B8] flex-shrink-0 ml-2">
                        {message.timestamp}
                      </span>
                    </div>
                    <p className="text-xs text-[#64748B] truncate mb-1">{message.leadCompany}</p>
                    <p className={`text-sm truncate ${!message.isRead ? 'text-[#1E293B]' : 'text-[#94A3B8]'}`}>
                      {message.preview}
                    </p>
                    <span className="inline-block mt-2 px-2 py-0.5 bg-[#F8FAFC] rounded text-xs text-[#64748B]">
                      {message.campaignName}
                    </span>
                  </div>
                  {!message.isRead && (
                    <div className="w-2 h-2 rounded-full bg-[#FF6B35] flex-shrink-0 mt-2" />
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Message Detail */}
      {selectedMessage ? (
        <div className={`flex-1 flex flex-col ${selectedMessage ? 'flex' : 'hidden md:flex'}`}>
          {/* Lead Header */}
          <div className="p-4 border-b border-[#E2E8F0] flex items-center justify-between">
            <div className="flex items-center gap-3 md:gap-4">
              {/* Mobile Back Button */}
              <button
                onClick={() => setSelectedMessage(null)}
                className="md:hidden p-2 -ml-2 rounded-lg hover:bg-[#F8FAFC] text-[#64748B]"
              >
                <BackIcon />
              </button>
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-[#FF6B35] to-[#14B8A6] flex items-center justify-center text-white font-medium text-sm md:text-base">
                {selectedMessage.leadName.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold text-[#1E293B] truncate">{selectedMessage.leadName}</h2>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${
                    selectedMessage.channel === 'linkedin'
                      ? 'bg-[#EFF6FF] text-[#0A66C2]'
                      : 'bg-[#F0FDFA] text-[#14B8A6]'
                  }`}>
                    {selectedMessage.channel === 'linkedin' ? 'LinkedIn' : 'Email'}
                  </span>
                </div>
                <p className="text-sm text-[#64748B] truncate">
                  {selectedMessage.leadTitle} at {selectedMessage.leadCompany}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
              <button className="p-2 rounded-lg hover:bg-[#F8FAFC] text-[#64748B]" title="View Profile">
                <UserIcon />
              </button>
              <button className="hidden sm:block p-2 rounded-lg hover:bg-[#F8FAFC] text-[#64748B]" title="Archive">
                <ArchiveIcon />
              </button>
              <button className="hidden sm:block p-2 rounded-lg hover:bg-[#FEF2F2] text-[#64748B] hover:text-[#EF4444]" title="Report Spam">
                <SpamIcon />
              </button>
            </div>
          </div>

          {/* Thread */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {selectedMessage.thread.map((msg, index) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`flex ${msg.isOutbound ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[70%] ${msg.isOutbound ? 'order-2' : ''}`}>
                  <div className={`rounded-2xl px-4 py-3 ${
                    msg.isOutbound
                      ? 'bg-[#FF6B35] text-white rounded-br-md'
                      : 'bg-[#F8FAFC] text-[#1E293B] rounded-bl-md'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  </div>
                  <div className={`flex items-center gap-2 mt-1 ${msg.isOutbound ? 'justify-end' : ''}`}>
                    <span className="text-xs text-[#94A3B8]">{msg.timestamp}</span>
                    {msg.channel === 'linkedin' ? (
                      <LinkedInIcon className="w-3 h-3 text-[#0A66C2]" />
                    ) : (
                      <EmailIcon className="w-3 h-3 text-[#14B8A6]" />
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Reply Input */}
          <div className="p-4 border-t border-[#E2E8F0]">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm text-[#64748B]">Reply via:</span>
              <button className={`px-3 py-1 rounded-lg text-sm font-medium flex items-center gap-1.5 ${
                selectedMessage.channel === 'linkedin'
                  ? 'bg-[#0A66C2] text-white'
                  : 'bg-[#F8FAFC] text-[#64748B] hover:bg-[#EFF6FF]'
              }`}>
                <LinkedInIcon className="w-3.5 h-3.5" />
                LinkedIn
              </button>
              <button className={`px-3 py-1 rounded-lg text-sm font-medium flex items-center gap-1.5 ${
                selectedMessage.channel === 'email'
                  ? 'bg-[#14B8A6] text-white'
                  : 'bg-[#F8FAFC] text-[#64748B] hover:bg-[#F0FDFA]'
              }`}>
                <EmailIcon className="w-3.5 h-3.5" />
                Email
              </button>
            </div>
            <div className="flex gap-3">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Type your reply..."
                rows={3}
                className="flex-1 px-4 py-3 rounded-xl border border-[#E2E8F0] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35] resize-none"
              />
              <button
                onClick={handleSendReply}
                disabled={!replyText.trim()}
                className="px-4 py-2 bg-[#FF6B35] text-white font-medium rounded-xl hover:bg-[#E85A2A] disabled:opacity-50 disabled:cursor-not-allowed self-end"
              >
                <SendIcon />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-center p-8">
          <div>
            <div className="w-20 h-20 mx-auto mb-4 bg-[#F8FAFC] rounded-full flex items-center justify-center">
              <InboxEmptyIcon className="w-10 h-10 text-[#E2E8F0]" />
            </div>
            <h3 className="text-lg font-semibold text-[#1E293B] mb-2">Select a conversation</h3>
            <p className="text-[#64748B] max-w-sm">
              Choose a message from the list to view the full conversation and reply.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

// Icons
function SearchIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={`w-4 h-4 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  )
}

function LinkedInIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path d="M16.338 16.338H13.67V12.16c0-.995-.017-2.277-1.387-2.277-1.39 0-1.601 1.086-1.601 2.207v4.248H8.014v-8.59h2.559v1.174h.037c.356-.675 1.227-1.387 2.526-1.387 2.703 0 3.203 1.778 3.203 4.092v4.711zM5.005 6.575a1.548 1.548 0 11-.003-3.096 1.548 1.548 0 01.003 3.096zm-1.337 9.763H6.34v-8.59H3.667v8.59zM17.668 1H2.328C1.595 1 1 1.581 1 2.298v15.403C1 18.418 1.595 19 2.328 19h15.34c.734 0 1.332-.582 1.332-1.299V2.298C19 1.581 18.402 1 17.668 1z" />
    </svg>
  )
}

function EmailIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  )
}

function InboxEmptyIcon({ className = 'w-8 h-8' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859m-19.5.338V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 00-2.15-1.588H6.911a2.25 2.25 0 00-2.15 1.588L2.35 13.177a2.25 2.25 0 00-.1.661z" />
    </svg>
  )
}

function UserIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
  )
}

function ArchiveIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
    </svg>
  )
}

function SpamIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>
  )
}

function SendIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
    </svg>
  )
}

function BackIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
    </svg>
  )
}
