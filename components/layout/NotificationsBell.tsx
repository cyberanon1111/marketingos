'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { markNotificationsReadAction } from '@/app/(app)/actions';
import { cn, formatDateTime } from '@/lib/utils';

type Notif = { id: string; message: string; link: string | null; read: boolean; createdAt: string };

export function NotificationsBell({ notifications, unreadCount }: { notifications: Notif[]; unreadCount: number }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative flex h-8 w-8 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
        aria-label="Notifications"
      >
        🔔
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-80 rounded-card border border-gray-200 bg-white shadow-xl dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-2.5 dark:border-gray-800">
              <span className="text-sm font-semibold">Notifications</span>
              {unreadCount > 0 && (
                <button
                  disabled={pending}
                  onClick={() => startTransition(() => markNotificationsReadAction())}
                  className="text-xs font-medium text-brand-600 hover:underline disabled:opacity-50"
                >
                  Mark all read
                </button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 && (
                <p className="px-4 py-6 text-center text-sm text-gray-400">You&apos;re all caught up.</p>
              )}
              {notifications.map((n) => (
                <Link
                  key={n.id}
                  href={n.link ?? '#'}
                  onClick={() => setOpen(false)}
                  className={cn(
                    'block border-b border-gray-50 px-4 py-2.5 text-sm last:border-0 hover:bg-gray-50 dark:border-gray-800/60 dark:hover:bg-gray-800',
                    !n.read && 'bg-brand-50/60 dark:bg-brand-900/10'
                  )}
                >
                  <p className={cn('text-gray-700 dark:text-gray-200', !n.read && 'font-medium')}>{n.message}</p>
                  <p className="mt-0.5 text-xs text-gray-400">{formatDateTime(n.createdAt)}</p>
                </Link>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
