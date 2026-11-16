'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';

type SeededUser = { id: string; name: string | null; email: string; role: string };

export default function SignInPanel({
  googleEnabled,
  seededUsers,
}: {
  googleEnabled: boolean;
  seededUsers: SeededUser[];
}) {
  const [loading, setLoading] = useState<string | null>(null);

  return (
    <div className="card space-y-4">
      {googleEnabled && (
        <button
          type="button"
          onClick={() => {
            setLoading('google');
            signIn('google', { callbackUrl: '/dashboard' });
          }}
          disabled={loading !== null}
          className="flex w-full items-center justify-center gap-2 rounded-card border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
        >
          {loading === 'google' ? 'Redirecting…' : 'Continue with Google'}
        </button>
      )}

      {!googleEnabled && seededUsers.length === 0 && (
        <p className="text-center text-sm text-gray-500 dark:text-gray-400">
          No sign-in method is configured yet. Add Google OAuth credentials or enable dev login in .env.
        </p>
      )}

      {seededUsers.length > 0 && (
        <div>
          {googleEnabled && (
            <div className="my-3 flex items-center gap-3 text-xs text-gray-400">
              <div className="h-px flex-1 bg-gray-200 dark:bg-gray-800" />
              dev login
              <div className="h-px flex-1 bg-gray-200 dark:bg-gray-800" />
            </div>
          )}
          <div className="space-y-2">
            {seededUsers.map((u) => (
              <button
                key={u.id}
                type="button"
                disabled={loading !== null}
                onClick={() => {
                  setLoading(u.id);
                  signIn('dev-login', { email: u.email, callbackUrl: '/dashboard' });
                }}
                className="flex w-full items-center justify-between rounded-card border border-gray-200 px-4 py-2.5 text-left text-sm hover:bg-gray-50 disabled:opacity-60 dark:border-gray-800 dark:hover:bg-gray-800"
              >
                <span>
                  <span className="font-medium">{u.name ?? u.email}</span>
                  <span className="ml-2 text-xs text-gray-400">{u.role}</span>
                </span>
                {loading === u.id && <span className="text-xs text-gray-400">Signing in…</span>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
