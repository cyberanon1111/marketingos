'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { globalSearchAction } from '@/app/(app)/actions';
import { STATUS_LABELS, STAGE_LABELS } from '@/lib/utils';

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ projects: { id: string; name: string; stage: string }[]; tasks: { id: string; title: string; status: string }[] }>({
    projects: [],
    tasks: [],
  });
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (!open) return;
    const handle = setTimeout(() => {
      startTransition(async () => {
        const res = await globalSearchAction(query);
        setResults(res);
      });
    }, 150);
    return () => clearTimeout(handle);
  }, [query, open]);

  if (!open) return null;

  const go = (href: string) => {
    setOpen(false);
    setQuery('');
    router.push(href);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-24" onClick={() => setOpen(false)}>
      <div
        className="w-full max-w-lg rounded-card border border-gray-200 bg-white shadow-xl dark:border-gray-800 dark:bg-gray-900"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search projects and tasks…"
          className="w-full border-b border-gray-100 bg-transparent px-4 py-3 text-sm outline-none dark:border-gray-800"
        />
        <div className="max-h-80 overflow-y-auto p-2">
          {query.trim().length < 2 && <p className="px-3 py-6 text-center text-sm text-gray-400">Type at least 2 characters…</p>}
          {query.trim().length >= 2 && !pending && results.projects.length === 0 && results.tasks.length === 0 && (
            <p className="px-3 py-6 text-center text-sm text-gray-400">No results.</p>
          )}
          {results.projects.length > 0 && (
            <div className="mb-1">
              <p className="px-3 pb-1 pt-2 text-xs font-semibold uppercase text-gray-400">Projects</p>
              {results.projects.map((p) => (
                <button
                  key={p.id}
                  onClick={() => go(`/projects/${p.id}`)}
                  className="flex w-full items-center justify-between rounded-card px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <span>{p.name}</span>
                  <span className="text-xs text-gray-400">{STAGE_LABELS[p.stage]}</span>
                </button>
              ))}
            </div>
          )}
          {results.tasks.length > 0 && (
            <div>
              <p className="px-3 pb-1 pt-2 text-xs font-semibold uppercase text-gray-400">Tasks</p>
              {results.tasks.map((t) => (
                <button
                  key={t.id}
                  onClick={() => go(`/tasks/${t.id}`)}
                  className="flex w-full items-center justify-between rounded-card px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <span>{t.title}</span>
                  <span className="text-xs text-gray-400">{STATUS_LABELS[t.status]}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
