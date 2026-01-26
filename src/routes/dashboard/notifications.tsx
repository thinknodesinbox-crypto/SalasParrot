import { createFileRoute } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import { useState } from 'react';

import {
  useNotifications,
  useMarkNotificationsRead,
  useMarkAllNotificationsRead,
  useDeleteNotification,
} from '../../lib/hooks/queries/useNotifications';
import type { Notification, NotificationType } from '../../lib/types';

export const Route = createFileRoute('/dashboard/notifications')({
  component: NotificationsPage,
});

// Icon mapping for notification types
const getNotificationIcon = (type: NotificationType): string => {
  switch (type) {
    case 'new_reply':
    case 'multiple_replies':
      return 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z';
    case 'new_connection':
      return 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z';
    case 'campaign_started':
      return 'M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z';
    case 'campaign_completed':
      return 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z';
    case 'campaign_error':
    case 'account_error':
    case 'account_disconnected':
      return 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z';
    case 'payment_failed':
      return 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z';
    case 'daily_digest':
    case 'weekly_digest':
      return 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z';
    case 'system_alert':
      return 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15';
    default:
      return 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9';
  }
};

const getNotificationColor = (type: NotificationType): string => {
  switch (type) {
    case 'new_reply':
    case 'multiple_replies':
    case 'new_connection':
      return 'text-teal-500';
    case 'campaign_completed':
    case 'account_connected':
      return 'text-green-500';
    case 'campaign_started':
      return 'text-blue-500';
    case 'campaign_error':
    case 'account_error':
    case 'account_disconnected':
    case 'payment_failed':
      return 'text-red-500';
    case 'daily_digest':
      return 'text-teal-600';
    case 'weekly_digest':
      return 'text-purple-500';
    case 'system_alert':
      return 'text-blue-500';
    default:
      return 'text-gray-500';
  }
};

const formatTimeAgo = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

  return date.toLocaleDateString();
};

function NotificationsPage() {
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const { data: notificationsData, isLoading } = useNotifications({
    limit: 100,
    unread_only: filter === 'unread',
  });
  const markRead = useMarkNotificationsRead();
  const markAllRead = useMarkAllNotificationsRead();
  const deleteNotification = useDeleteNotification();

  const notifications = notificationsData?.notifications || [];
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleMarkAsRead = (notification: Notification) => {
    if (!notification.is_read) {
      markRead.mutate([notification.id]);
    }
  };

  const handleDelete = (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteNotification.mutate(notificationId);
  };

  const handleMarkAllRead = () => {
    markAllRead.mutate();
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#1E293B] sm:text-2xl">Notifications</h1>
          <p className="mt-1 text-sm text-[#64748B]">
            {unreadCount > 0
              ? `${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}`
              : 'All caught up!'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Filter Tabs */}
          <div className="flex rounded-lg border border-[#E2E8F0] bg-white p-1">
            <button
              onClick={() => setFilter('all')}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                filter === 'all' ? 'bg-[#FF6B35] text-white' : 'text-[#64748B] hover:text-[#1E293B]'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                filter === 'unread'
                  ? 'bg-[#FF6B35] text-white'
                  : 'text-[#64748B] hover:text-[#1E293B]'
              }`}
            >
              Unread
            </button>
          </div>
          {/* Mark All Read Button */}
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              disabled={markAllRead.isPending}
              className="rounded-lg border border-[#E2E8F0] bg-white px-3 py-1.5 text-sm font-medium text-[#64748B] transition-colors hover:border-[#FF6B35] hover:text-[#FF6B35] disabled:opacity-50"
            >
              Mark all as read
            </button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className="overflow-hidden rounded-xl border border-[#E2E8F0] bg-white">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#FF6B35] border-t-transparent" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#F8FAFC]">
              <svg
                className="h-8 w-8 text-[#94A3B8]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
            </div>
            <h3 className="text-sm font-medium text-[#1E293B]">
              {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
            </h3>
            <p className="mt-1 text-sm text-[#64748B]">
              {filter === 'unread'
                ? "You're all caught up!"
                : "We'll notify you when something important happens."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#E2E8F0]">
            {notifications.map((notification, index) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                onClick={() => handleMarkAsRead(notification)}
                className={`group relative cursor-pointer px-4 py-4 transition-colors hover:bg-[#F8FAFC] sm:px-6 ${
                  !notification.is_read ? 'bg-orange-50/50' : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={`flex-shrink-0 ${getNotificationColor(notification.type)}`}>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d={getNotificationIcon(notification.type)}
                      />
                    </svg>
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p
                        className={`text-sm ${
                          !notification.is_read
                            ? 'font-semibold text-[#1E293B]'
                            : 'font-medium text-[#475569]'
                        }`}
                      >
                        {notification.title}
                      </p>
                      <span className="flex-shrink-0 text-xs text-[#94A3B8]">
                        {formatTimeAgo(notification.created_at)}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-[#64748B]">{notification.message}</p>
                  </div>

                  {/* Unread indicator */}
                  {!notification.is_read && (
                    <div className="flex-shrink-0">
                      <div className="h-2.5 w-2.5 rounded-full bg-[#FF6B35]" />
                    </div>
                  )}

                  {/* Delete button */}
                  <button
                    onClick={(e) => handleDelete(notification.id, e)}
                    className="flex-shrink-0 rounded p-1 text-[#94A3B8] opacity-0 transition-all hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
                    title="Delete notification"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
