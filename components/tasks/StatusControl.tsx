'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateTaskStatusAction, markReadyForReviewAction } from '@/app/(app)/tasks/actions';
import { Button } from '@/components/ui/Button';
import { STATUS_LABELS } from '@/lib/utils';
import type { TaskStatus } from '@prisma/client';

const SETTABLE: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'BLOCKED'];

export function StatusControl({
  taskId,
  status,
  deliverableCount,
}: {
  taskId: string;
  status: TaskStatus;
  deliverableCount: number;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const locked = status === 'APPROVED';
  const canRequestReview = !locked && status !== 'READY_FOR_REVIEW';

  return (
    <div className="space-y-2">
      {!locked && (
        <div className="flex flex-wrap items-center gap-1.5">
          {SETTABLE.map((s) => (
            <Button
              key={s}
              variant={status === s ? 'primary' : 'secondary'}
              className="px-2.5 py-1.5 text-xs"
              disabled={pending || status === 'READY_FOR_REVIEW'}
              onClick={() =>
                startTransition(async () => {
                  setError(null);
                  try {
                    await updateTaskStatusAction(taskId, s);
                    router.refresh();
                  } catch (e) {
                    setError(e instanceof Error ? e.message : 'Failed to update status.');
                  }
                })
              }
            >
              {STATUS_LABELS[s]}
            </Button>
          ))}
        </div>
      )}

      {canRequestReview && (
        <Button
          className="text-xs"
          disabled={pending || deliverableCount === 0}
          title={deliverableCount === 0 ? 'Attach a deliverable first' : undefined}
          onClick={() =>
            startTransition(async () => {
              setError(null);
              try {
                await markReadyForReviewAction(taskId);
                router.refresh();
              } catch (e) {
                setError(e instanceof Error ? e.message : 'Failed to request review.');
              }
            })
          }
        >
          Ready for Review
        </Button>
      )}

      {locked && <p className="text-xs font-medium text-emerald-600">✓ Approved and locked</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
