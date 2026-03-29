'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
}

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;

  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return 'just now';

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  return new Date(dateStr).toLocaleDateString();
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch {
      // Silently fail - notifications are non-critical
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    // Poll every 30 seconds for new notifications
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = async (ids: string[]) => {
    if (ids.length === 0) return;
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
      setNotifications((prev) =>
        prev.map((n) => (ids.includes(n.id) ? { ...n, read: true } : n))
      );
    } catch {
      // Silently fail
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead([notification.id]);
    }
  };

  const handleMarkAllRead = () => {
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
    markAsRead(unreadIds);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="relative text-slate-500 hover:text-slate-700 transition-colors"
        aria-label="Notifications"
      >
        <span className="material-symbols-outlined text-[22px]">notifications</span>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-500 rounded-full leading-none">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 z-50 w-80 bg-white rounded-xl border border-slate-200/60 shadow-lg overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-800">Notifications</h3>
            {unreadCount > 0 && (
              <span className="text-xs text-slate-400">{unreadCount} unread</span>
            )}
          </div>

          {/* Notification list */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-slate-400">
                No notifications yet
              </div>
            ) : (
              notifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`w-full text-left px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition-colors ${
                    !notification.read ? 'bg-blue-50/50' : ''
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {!notification.read && (
                      <span className="mt-1.5 flex-shrink-0 w-2 h-2 rounded-full bg-blue-500" />
                    )}
                    <div className={`flex-1 ${notification.read ? 'pl-4' : ''}`}>
                      <p className={`text-sm leading-tight ${!notification.read ? 'font-semibold text-slate-800' : 'font-medium text-slate-600'}`}>
                        {notification.title}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        {relativeTime(notification.createdAt)}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && unreadCount > 0 && (
            <div className="px-4 py-2.5 border-t border-slate-100">
              <button
                onClick={handleMarkAllRead}
                className="w-full text-center text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
              >
                Mark all as read
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
