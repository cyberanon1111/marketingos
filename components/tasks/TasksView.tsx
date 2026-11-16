'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import { STATUS_LABELS, PRIORITY_LABELS, formatDate } from '@/lib/utils';
import type { TaskStatus } from '@prisma/client';

export type TaskRow = {
  id: string;
  title: string;
  status: TaskStatus;
  priority: string;
  dueDate: string | null;
  project: { id: string; name: string };
  owner: { id: string; name: string | null; email: string };
  reviewer: { id: string; name: string | null; email: string };
  overdue: boolean;
};

const COLUMNS: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'BLOCKED', 'READY_FOR_REVIEW', 'CHANGES_REQUESTED', 'APPROVED'];

export function TasksView({ tasks }: { tasks: TaskRow[] }) {
  const [view, setView] = useState<'list' | 'kanban'>('list');

  const grouped = useMemo(() => {
    const map = new Map<TaskStatus, TaskRow[]>();
    for (const s of COLUMNS) map.set(s, []);
    for (const t of tasks) map.get(t.status)?.push(t);
    return map;
  }, [tasks]);

  return (
    <div>
      <div className="mb-3 flex justify-end">
        <div className="inline-flex rounded-card border border-gray-200 p-0.5 text-xs dark:border-gray-800">
          <button
            onClick={() => setView('list')}
            className={`rounded-[8px] px-3 py-1.5 font-medium ${view === 'list' ? 'bg-brand-600 text-white' : 'text-gray-500'}`}
          >
            List
          </button>
          <button
            onClick={() => setView('kanban')}
            className={`rounded-[8px] px-3 py-1.5 font-medium ${view === 'kanban' ? 'bg-brand-600 text-white' : 'text-gray-500'}`}
          >
            Kanban
          </button>
        </div>
      </div>

      {view === 'list' ? (
        <div className="overflow-hidden rounded-card border border-gray-200 dark:border-gray-800">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-400 dark:bg-gray-900">
              <tr>
                <th className="px-4 py-2 font-medium">Task</th>
                <th className="px-4 py-2 font-medium">Project</th>
                <th className="px-4 py-2 font-medium">Owner</th>
                <th className="px-4 py-2 font-medium">Priority</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Due</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {tasks.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-900">
                  <td className="px-4 py-2.5">
                    <Link href={`/tasks/${t.id}`} className="font-medium hover:text-brand-600">
                      {t.title}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 text-gray-500 dark:text-gray-400">{t.project.name}</td>
                  <td className="px-4 py-2.5 text-gray-500 dark:text-gray-400">{t.owner.name ?? t.owner.email}</td>
                  <td className="px-4 py-2.5">
                    <Badge value={t.priority} kind="priority" label={PRIORITY_LABELS[t.priority]} />
                  </td>
                  <td className="px-4 py-2.5">
                    <Badge value={t.status} label={STATUS_LABELS[t.status]} />
                  </td>
                  <td className={`px-4 py-2.5 ${t.overdue ? 'font-medium text-red-600' : 'text-gray-500 dark:text-gray-400'}`}>
                    {formatDate(t.dueDate ? new Date(t.dueDate) : null)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 overflow-x-auto md:grid-cols-3 xl:grid-cols-6">
          {COLUMNS.map((status) => (
            <div key={status} className="min-w-[220px] rounded-card bg-gray-100/60 p-2 dark:bg-gray-900/60">
              <div className="mb-2 flex items-center justify-between px-1">
                <span className="text-xs font-semibold text-gray-500">{STATUS_LABELS[status]}</span>
                <span className="text-xs text-gray-400">{grouped.get(status)?.length ?? 0}</span>
              </div>
              <div className="space-y-2">
                {grouped.get(status)?.map((t) => (
                  <Link
                    key={t.id}
                    href={`/tasks/${t.id}`}
                    className="block rounded-card border border-gray-200 bg-white p-2.5 text-xs shadow-card hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
                  >
                    <p className="font-medium text-gray-800 dark:text-gray-100">{t.title}</p>
                    <p className="mt-1 text-gray-400">{t.project.name}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <Badge value={t.priority} kind="priority" label={PRIORITY_LABELS[t.priority]} />
                      {t.overdue && <span className="font-medium text-red-600">Overdue</span>}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
