'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { reviewTaskAction } from '@/app/(app)/tasks/actions';
import { Button } from '@/components/ui/Button';
import type { ReviewActionType } from '@prisma/client';

export function ReviewPanel({ taskId }: { taskId: string }) {
  const [comment, setComment] = useState('');
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const act = (action: ReviewActionType) => {
    if (action !== 'APPROVE' && !comment.trim()) {
      setError('A comment is required when rejecting or requesting changes.');
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        await reviewTaskAction(taskId, action, comment);
        setComment('');
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to submit review.');
      }
    });
  };

  return (
    <div className="rounded-card border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-900/10">
      <p className="mb-2 text-sm font-medium text-amber-800 dark:text-amber-300">This task is ready for your review.</p>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Review comment (required for reject / request changes)"
        rows={2}
        className="input bg-white dark:bg-gray-900"
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      <div className="mt-2 flex gap-2">
        <Button className="text-xs" disabled={pending} onClick={() => act('APPROVE')}>
          Approve
        </Button>
        <Button variant="secondary" className="text-xs" disabled={pending} onClick={() => act('REQUEST_CHANGES')}>
          Request Changes
        </Button>
        <Button variant="danger" className="text-xs" disabled={pending} onClick={() => act('REJECT')}>
          Reject
        </Button>
      </div>
    </div>
  );
}
