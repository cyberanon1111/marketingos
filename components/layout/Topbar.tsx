'use client';

import { signOut } from 'next-auth/react';
import { useState } from 'react';
import { ThemeToggle } from './ThemeToggle';
import { NotificationsBell } from './NotificationsBell';
import { initials } from '@/lib/utils';

type Notif = { id: string; message: string; link: string | null; read: boolean; createdAt: string };

export function Topbar({
  user,
  notifications,
  unreadCount,
}: {
  user: { name: string | null; email: string; image: string | null; role: string };
  notifications: Notif[];
  unreadCount: number;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 dark:border-gray-800 dark:bg-gray-900">
      <button
        onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
        className="hidden items-center gap-2 rounded-card border border-gray-200 px-3 py-1.5 text-xs text-gray-400 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800 sm:flex"
      >
        <span>🔍 Search…</span>
        <kbd className="rounded bg-gray-100 px-1.5 py-0.5 font-sans text-[10px] dark:bg-gray-700">⌘K</kbd>
      </button>

      <div className="ml-auto flex items-center gap-1.5">
        <ThemeToggle />
        <NotificationsBell notifications={notifications} unreadCount={unreadCount} />
        <div className="relative ml-1">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700 dark:bg-brand-900/40 dark:text-brand-300"
          >
            {initials(user.name ?? user.email)}
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 z-50 mt-2 w-52 rounded-card border border-gray-200 bg-white p-1 shadow-xl dark:border-gray-800 dark:bg-gray-900">
                <div className="px-3 py-2">
                  <p className="truncate text-sm font-medium">{user.name ?? user.email}</p>
                  <p className="truncate text-xs text-gray-400">{user.role === 'MANAGER' ? 'Marketing Manager' : 'Team Member'}</p>
                </div>
                <button
                  onClick={() => signOut({ callbackUrl: '/signin' })}
                  className="block w-full rounded-card px-3 py-2 text-left text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
