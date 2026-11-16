'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { importProjectsAction, type ImportSummary } from '@/app/(app)/projects/import-actions';

export function ImportProjectsModal() {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<ImportSummary | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const close = () => {
    setOpen(false);
    setResult(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const upload = () => {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.set('file', file);
    startTransition(async () => {
      const summary = await importProjectsAction(formData);
      setResult(summary);
      if (summary.success) router.refresh();
    });
  };

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Import from Excel
      </Button>
      <Modal open={open} onClose={close} title="Import Projects & Tasks">
        {!result && (
          <div className="space-y-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Upload a spreadsheet in our template format to bulk-create projects and their tasks. Existing projects
              with a matching name get new tasks appended instead of duplicated.
            </p>
            <a
              href="/api/templates/projects-import"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:underline"
            >
              ⬇ Download template
            </a>
            <div>
              <label className="text-xs font-medium text-gray-500">Spreadsheet (.xlsx)</label>
              <input ref={fileRef} type="file" accept=".xlsx" className="input" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={close}>
                Cancel
              </Button>
              <Button type="button" disabled={pending} onClick={upload}>
                {pending ? 'Importing…' : 'Upload & Import'}
              </Button>
            </div>
          </div>
        )}

        {result && !result.success && (
          <div className="space-y-4">
            <p className="text-sm text-red-600">{result.error}</p>
            <div className="flex justify-end">
              <Button variant="secondary" onClick={() => setResult(null)}>
                Try again
              </Button>
            </div>
          </div>
        )}

        {result && result.success && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-card bg-emerald-50 p-3 dark:bg-emerald-900/20">
                <p className="text-lg font-semibold text-emerald-700 dark:text-emerald-300">{result.projectsCreated}</p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400">Projects created</p>
              </div>
              <div className="rounded-card bg-blue-50 p-3 dark:bg-blue-900/20">
                <p className="text-lg font-semibold text-blue-700 dark:text-blue-300">{result.projectsReused}</p>
                <p className="text-xs text-blue-600 dark:text-blue-400">Projects reused</p>
              </div>
              <div className="rounded-card bg-emerald-50 p-3 dark:bg-emerald-900/20">
                <p className="text-lg font-semibold text-emerald-700 dark:text-emerald-300">{result.tasksCreated}</p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400">Tasks created</p>
              </div>
            </div>

            {result.skipped && result.skipped.length > 0 && (
              <div>
                <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-amber-600">
                  {result.skipped.length} row{result.skipped.length === 1 ? '' : 's'} skipped
                </p>
                <div className="max-h-40 space-y-1 overflow-y-auto rounded-card border border-amber-200 bg-amber-50 p-2 dark:border-amber-900/50 dark:bg-amber-900/10">
                  {result.skipped.map((s, i) => (
                    <p key={i} className="text-xs text-amber-800 dark:text-amber-300">
                      Row {s.row}: {s.reason}
                    </p>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <Button onClick={close}>Done</Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
