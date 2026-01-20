import { createFileRoute } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import { useState, useMemo } from 'react';
import {
  useConversations,
  useConversation,
  useSendReply,
  useMarkAsRead,
  useLinkedInAccounts,
  useEmailAccounts,
  useCampaigns,
} from '@/lib/hooks/queries';
import type { Conversation, Message, Channel } from '@/lib/types';

export const Route = createFileRoute('/dashboard/inbox')({
  component: InboxPage,
});

// Helper function to format relative timestamps
function formatRelativeTime(dateString: string | null): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function InboxPage() {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'linkedin' | 'email' | 'unread'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [replyText, setReplyText] = useState('');
  const [selectedSenderId, setSelectedSenderId] = useState<string>('');
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('');

  // Fetch accounts and campaigns for filter dropdowns
  const { data: linkedInAccounts = [] } = useLinkedInAccounts();
  const { data: emailAccounts = [] } = useEmailAccounts();
  const { data: campaigns = [] } = useCampaigns();

  // Combined sender options (LinkedIn + Email accounts)
  const senderOptions = useMemo(() => {
    const options: { id: string; name: string; type: 'linkedin' | 'email' }[] = [];
    linkedInAccounts.forEach((acc) => {
      // Extract username from profile_url as fallback (e.g., "john-doe" from linkedin.com/in/john-doe)
      let displayName = acc.name;
      if (!displayName && acc.profile_url) {
        const match = acc.profile_url.match(/linkedin\.com\/in\/([^/?]+)/);
        if (match) {
          // Format the username: "john-doe" -> "john doe"
          displayName = match[1].replace(/-/g, ' ');
        } else {
          displayName = acc.profile_url;
        }
      }
      options.push({
        id: acc.id,
        name: displayName || 'LinkedIn Account',
        type: 'linkedin',
      });
    });
    emailAccounts.forEach((acc) => {
      options.push({
        id: acc.id,
        name: acc.email_address || 'Email Account',
        type: 'email',
      });
    });
    return options;
  }, [linkedInAccounts, emailAccounts]);

  // Fetch conversation list with API filters
  const {
    data: conversationsData,
    isLoading,
    error,
    refetch,
  } = useConversations({
    channel_filter: filter !== 'all' && filter !== 'unread' ? (filter as Channel) : undefined,
    sender_id: selectedSenderId || undefined,
    campaign_id: selectedCampaignId || undefined,
    is_read: filter === 'unread' ? false : undefined,
  });

  // Fetch selected conversation with messages
  const { data: selectedConversation, isLoading: isLoadingConversation } = useConversation(
    selectedConversationId || ''
  );

  // Mutations
  const sendReply = useSendReply(selectedConversationId || '');
  const markAsReadMutation = useMarkAsRead(selectedConversationId || '');

  // Filter and process conversations
  const conversations = conversationsData?.conversations || [];
  const filteredConversations = conversations.filter((c) => {
    // Client-side search filter only (unread filter now uses API)
    if (searchQuery) {
      const leadName = c.lead_name || '';
      if (!leadName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    }
    return true;
  });

  const unreadCount = conversations.filter((c) => c.unread_count > 0).length;

  // Handle selecting a conversation
  const handleSelectConversation = (conversationId: string) => {
    setSelectedConversationId(conversationId);
    const conversation = conversations.find((c) => c.id === conversationId);
    if (conversation && conversation.unread_count > 0) {
      markAsReadMutation.mutate();
    }
  };

  // Handle sending a reply
  const handleSendReply = async () => {
    if (!selectedConversationId || !replyText.trim()) return;
    try {
      await sendReply.mutateAsync({ content: replyText });
      setReplyText('');
    } catch {
      // Error is handled by mutation
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-7rem)] items-center justify-center rounded-xl border border-[#E2E8F0] bg-white">
        <div className="flex flex-col items-center gap-3">
          <LoadingSpinner />
          <p className="text-[#64748B]">Loading conversations...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex h-[calc(100vh-7rem)] items-center justify-center rounded-xl border border-[#E2E8F0] bg-white">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#FEF2F2]">
            <AlertIcon className="h-8 w-8 text-[#EF4444]" />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-[#1E293B]">Failed to load inbox</h3>
          <p className="mb-4 text-[#64748B]">{error.message}</p>
          <button
            onClick={() => refetch()}
            className="rounded-lg bg-[#FF6B35] px-4 py-2 font-medium text-white transition-colors hover:bg-[#E85A2A]"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Get the last message content for preview
  const getMessagePreview = (conversation: Conversation): string => {
    return conversation.last_message_preview || 'No messages yet';
  };

  return (
    <div className="flex h-[calc(100vh-7rem)] overflow-hidden rounded-xl border border-[#E2E8F0] bg-white">
      {/* Conversation List */}
      <div
        className={`flex w-full flex-col border-r border-[#E2E8F0] md:w-96 ${selectedConversationId ? 'hidden md:flex' : 'flex'}`}
      >
        {/* Header */}
        <div className="border-b border-[#E2E8F0] p-4">
          <div className="mb-4 flex items-center justify-between">
            <h1 className="text-lg font-bold text-[#1E293B]">Inbox</h1>
            {unreadCount > 0 && (
              <span className="rounded-full bg-[#FF6B35] px-2 py-0.5 text-xs font-medium text-white">
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
              placeholder="Search conversations..."
              className="w-full rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] py-2 pl-10 pr-4 text-sm focus:border-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto border-b border-[#E2E8F0] px-4 py-2">
          {(['all', 'unread', 'linkedin', 'email'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                filter === f
                  ? 'bg-[#FF6B35] text-white'
                  : 'bg-[#F8FAFC] text-[#64748B] hover:bg-[#E2E8F0]'
              }`}
            >
              {f === 'all'
                ? 'All'
                : f === 'unread'
                  ? 'Unread'
                  : f === 'linkedin'
                    ? 'LinkedIn'
                    : 'Email'}
            </button>
          ))}
        </div>

        {/* Advanced Filters - Sender & Campaign */}
        <div className="flex gap-2 border-b border-[#E2E8F0] px-4 py-2">
          {/* Sender Filter */}
          <div className="relative flex-1">
            <select
              value={selectedSenderId}
              onChange={(e) => setSelectedSenderId(e.target.value)}
              className="w-full appearance-none rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] py-1.5 pl-3 pr-8 text-xs text-[#64748B] focus:border-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20"
            >
              <option value="">All Senders</option>
              {senderOptions.map((sender) => (
                <option key={sender.id} value={sender.id}>
                  {sender.type === 'linkedin' ? '🔗 ' : '📧 '}
                  {sender.name}
                </option>
              ))}
            </select>
            <ChevronDownIcon className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
          </div>

          {/* Campaign Filter */}
          <div className="relative flex-1">
            <select
              value={selectedCampaignId}
              onChange={(e) => setSelectedCampaignId(e.target.value)}
              className="w-full appearance-none rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] py-1.5 pl-3 pr-8 text-xs text-[#64748B] focus:border-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20"
            >
              <option value="">All Campaigns</option>
              {campaigns.map((campaign) => (
                <option key={campaign.id} value={campaign.id}>
                  {campaign.name}
                </option>
              ))}
            </select>
            <ChevronDownIcon className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
          </div>

          {/* Clear Filters Button */}
          {(selectedSenderId || selectedCampaignId) && (
            <button
              onClick={() => {
                setSelectedSenderId('');
                setSelectedCampaignId('');
              }}
              className="flex items-center gap-1 whitespace-nowrap rounded-lg px-2 py-1.5 text-xs font-medium text-[#64748B] hover:bg-[#FEF2F2] hover:text-[#EF4444]"
            >
              <ClearIcon className="h-3 w-3" />
              Clear
            </button>
          )}
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="p-8 text-center">
              <InboxEmptyIcon className="mx-auto mb-3 h-12 w-12 text-[#E2E8F0]" />
              <p className="text-[#64748B]">No conversations</p>
            </div>
          ) : (
            filteredConversations.map((conversation) => {
              const isSelected = selectedConversationId === conversation.id;
              const isRead = conversation.unread_count === 0;

              return (
                <button
                  key={conversation.id}
                  onClick={() => handleSelectConversation(conversation.id)}
                  className={`w-full border-b border-[#E2E8F0] p-4 text-left transition-colors ${
                    isSelected
                      ? 'bg-[#FFF7ED]'
                      : isRead
                        ? 'hover:bg-[#F8FAFC]'
                        : 'bg-[#FFFBEB] hover:bg-[#FFF7ED]'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="relative flex-shrink-0">
                      {conversation.lead_avatar_url ? (
                        <img
                          src={conversation.lead_avatar_url}
                          alt={conversation.lead_name || 'Contact'}
                          className="h-12 w-12 rounded-full object-cover"
                          onError={(e) => {
                            // Fallback to initials if image fails to load
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            target.nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                      ) : null}
                      <div
                        className={`flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#0A66C2] to-[#004182] font-semibold text-white ${conversation.lead_avatar_url ? 'hidden' : ''}`}
                      >
                        {(conversation.lead_name || 'U')
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>
                      <div
                        className={`absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white ${
                          conversation.channel === 'linkedin' ? 'bg-[#0A66C2]' : 'bg-[#14B8A6]'
                        }`}
                      >
                        {conversation.channel === 'linkedin' ? (
                          <LinkedInIcon className="h-2.5 w-2.5 text-white" />
                        ) : (
                          <EmailIcon className="h-2.5 w-2.5 text-white" />
                        )}
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-0.5 flex items-center justify-between">
                        <span
                          className={`truncate font-semibold ${!isRead ? 'text-[#1E293B]' : 'text-[#64748B]'}`}
                        >
                          {conversation.lead_name || 'Unknown'}
                        </span>
                        <span className="ml-2 flex-shrink-0 text-xs text-[#94A3B8]">
                          {formatRelativeTime(conversation.last_message_at)}
                        </span>
                      </div>
                      <p
                        className={`truncate text-sm ${!isRead ? 'text-[#1E293B]' : 'text-[#94A3B8]'}`}
                      >
                        {getMessagePreview(conversation)}
                      </p>
                      {conversation.tags && conversation.tags.length > 0 && (
                        <span className="mt-1.5 inline-block rounded bg-[#F8FAFC] px-2 py-0.5 text-xs text-[#64748B]">
                          {conversation.tags[0]}
                        </span>
                      )}
                    </div>
                    {!isRead && (
                      <div className="mt-1.5 h-2.5 w-2.5 flex-shrink-0 rounded-full bg-[#FF6B35]" />
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Conversation Detail */}
      {selectedConversationId ? (
        <div
          className={`flex flex-1 flex-col ${selectedConversationId ? 'flex' : 'hidden md:flex'}`}
        >
          {isLoadingConversation ? (
            <div className="flex flex-1 items-center justify-center">
              <LoadingSpinner />
            </div>
          ) : selectedConversation ? (
            <>
              {/* Lead Header */}
              <div className="flex items-center justify-between border-b border-[#E2E8F0] p-4">
                <div className="flex items-center gap-3 md:gap-4">
                  {/* Mobile Back Button */}
                  <button
                    onClick={() => setSelectedConversationId(null)}
                    className="-ml-2 rounded-lg p-2 text-[#64748B] hover:bg-[#F8FAFC] md:hidden"
                  >
                    <BackIcon />
                  </button>
                  {selectedConversation.lead_avatar_url ? (
                    <img
                      src={selectedConversation.lead_avatar_url}
                      alt={selectedConversation.lead_name || 'Contact'}
                      className="h-10 w-10 rounded-full object-cover md:h-12 md:w-12"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#FF6B35] to-[#14B8A6] text-sm font-medium text-white md:h-12 md:w-12 md:text-base">
                      {(selectedConversation.lead_name || 'U')
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .slice(0, 2)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="truncate font-semibold text-[#1E293B]">
                        {selectedConversation.lead_name || 'Unknown'}
                      </h2>
                      <span
                        className={`flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                          selectedConversation.channel === 'linkedin'
                            ? 'bg-[#EFF6FF] text-[#0A66C2]'
                            : 'bg-[#F0FDFA] text-[#14B8A6]'
                        }`}
                      >
                        {selectedConversation.channel === 'linkedin' ? 'LinkedIn' : 'Email'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-shrink-0 items-center gap-1 md:gap-2">
                  <button
                    className="rounded-lg p-2 text-[#64748B] hover:bg-[#F8FAFC]"
                    title="View Profile"
                  >
                    <UserIcon />
                  </button>
                  <button
                    className="hidden rounded-lg p-2 text-[#64748B] hover:bg-[#F8FAFC] sm:block"
                    title="Archive"
                  >
                    <ArchiveIcon />
                  </button>
                  <button
                    className="hidden rounded-lg p-2 text-[#64748B] hover:bg-[#FEF2F2] hover:text-[#EF4444] sm:block"
                    title="Report Spam"
                  >
                    <SpamIcon />
                  </button>
                </div>
              </div>

              {/* Thread */}
              <div className="flex-1 space-y-6 overflow-y-auto p-6">
                {selectedConversation.messages && selectedConversation.messages.length > 0 ? (
                  selectedConversation.messages.map((msg: Message, index: number) => {
                    const isOutbound = msg.direction === 'outbound';
                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`flex ${isOutbound ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[70%] ${isOutbound ? 'order-2' : ''}`}>
                          <div
                            className={`rounded-2xl px-4 py-3 ${
                              isOutbound
                                ? 'rounded-br-md bg-[#FF6B35] text-white'
                                : 'rounded-bl-md bg-[#F8FAFC] text-[#1E293B]'
                            }`}
                          >
                            <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                          </div>
                          <div
                            className={`mt-1 flex items-center gap-2 ${isOutbound ? 'justify-end' : ''}`}
                          >
                            <span className="text-xs text-[#94A3B8]">
                              {formatRelativeTime(msg.sent_at || msg.created_at)}
                            </span>
                            {msg.channel === 'linkedin' ? (
                              <LinkedInIcon className="h-3 w-3 text-[#0A66C2]" />
                            ) : (
                              <EmailIcon className="h-3 w-3 text-[#14B8A6]" />
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                ) : (
                  <div className="py-8 text-center text-[#64748B]">
                    No messages in this conversation
                  </div>
                )}
              </div>

              {/* Reply Input */}
              <div className="border-t border-[#E2E8F0] p-4">
                <div className="mb-3 flex items-center gap-2">
                  <span className="text-sm text-[#64748B]">Reply via:</span>
                  <button
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1 text-sm font-medium ${
                      selectedConversation.channel === 'linkedin'
                        ? 'bg-[#0A66C2] text-white'
                        : 'bg-[#F8FAFC] text-[#64748B] hover:bg-[#EFF6FF]'
                    }`}
                  >
                    <LinkedInIcon className="h-3.5 w-3.5" />
                    LinkedIn
                  </button>
                  <button
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1 text-sm font-medium ${
                      selectedConversation.channel === 'email'
                        ? 'bg-[#14B8A6] text-white'
                        : 'bg-[#F8FAFC] text-[#64748B] hover:bg-[#F0FDFA]'
                    }`}
                  >
                    <EmailIcon className="h-3.5 w-3.5" />
                    Email
                  </button>
                </div>
                <div className="flex gap-3">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type your reply..."
                    rows={3}
                    className="flex-1 resize-none rounded-xl border border-[#E2E8F0] px-4 py-3 focus:border-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20"
                  />
                  <button
                    onClick={handleSendReply}
                    disabled={!replyText.trim() || sendReply.isPending}
                    className="self-end rounded-xl bg-[#FF6B35] px-4 py-2 font-medium text-white hover:bg-[#E85A2A] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {sendReply.isPending ? <LoadingSpinner className="h-5 w-5" /> : <SendIcon />}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center text-[#64748B]">
              Failed to load conversation
            </div>
          )}
        </div>
      ) : (
        <div className="flex hidden flex-1 items-center justify-center p-8 text-center md:flex">
          <div>
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-[#F8FAFC]">
              <InboxEmptyIcon className="h-10 w-10 text-[#E2E8F0]" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-[#1E293B]">Select a conversation</h3>
            <p className="max-w-sm text-[#64748B]">
              Choose a message from the list to view the full conversation and reply.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// Icons
function SearchIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      className={`h-4 w-4 ${className}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
  );
}

function LinkedInIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path d="M16.338 16.338H13.67V12.16c0-.995-.017-2.277-1.387-2.277-1.39 0-1.601 1.086-1.601 2.207v4.248H8.014v-8.59h2.559v1.174h.037c.356-.675 1.227-1.387 2.526-1.387 2.703 0 3.203 1.778 3.203 4.092v4.711zM5.005 6.575a1.548 1.548 0 11-.003-3.096 1.548 1.548 0 01.003 3.096zm-1.337 9.763H6.34v-8.59H3.667v8.59zM17.668 1H2.328C1.595 1 1 1.581 1 2.298v15.403C1 18.418 1.595 19 2.328 19h15.34c.734 0 1.332-.582 1.332-1.299V2.298C19 1.581 18.402 1 17.668 1z" />
    </svg>
  );
}

function EmailIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
      />
    </svg>
  );
}

function InboxEmptyIcon({ className = 'w-8 h-8' }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859m-19.5.338V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 00-2.15-1.588H6.911a2.25 2.25 0 00-2.15 1.588L2.35 13.177a2.25 2.25 0 00-.1.661z"
      />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
      />
    </svg>
  );
}

function ArchiveIcon() {
  return (
    <svg
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
      />
    </svg>
  );
}

function SpamIcon() {
  return (
    <svg
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
      />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
      />
    </svg>
  );
}

function BackIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
    </svg>
  );
}

function LoadingSpinner({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

function AlertIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function ChevronDownIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function ClearIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}
