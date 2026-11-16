'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';

export function Disclosure({
  label,
  openLabel,
  children,
  defaultOpen = false,
}: {
  label: string;
  openLabel?: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-xs font-medium text-brand-600 hover:underline"
        >
          + {label}
        </button>
      )}
      {open && (
        <div>
          {children}
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="mt-2 text-xs font-medium text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            − {openLabel ?? 'Hide'}
          </button>
        </div>
      )}
    </div>
  );
}
