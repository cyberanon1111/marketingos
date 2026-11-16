'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { addCommentAction } from '@/app/(app)/tasks/actions';
import { Button } from '@/components/ui/Button';
import { initials, formatDateTime } from '@/lib/utils';

type CommentRow = { id: string; body: string; createdAt: string; author: { name: string | null; email: string } };

export function CommentsThread({ taskId, comments }: { taskId: string; comments: CommentRow[] }) {
  const [body, setBody] = useState('');
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <div className="space-y-3">
      {comments.map((c) => (
        <div key={c.id} className="flex gap-2.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-200 text-[10px] font-semibold text-gray-600 dark:bg-gray-700 dark:text-gray-300">
            {initials(c.author.name ?? c.author.email)}
          </div>
          <div className="flex-1 rounded-card bg-gray-50 px-3 py-2 dark:bg-gray-800/60">
            <div className="flex items-baseline justify-between">
              <span className="text-xs font-medium">{c.author.name ?? c.author.email}</span>
              <span className="text-[10px] text-gray-400">{formatDateTime(c.createdAt)}</span>
            </div>
            <p className="mt-0.5 text-sm text-gray-700 dark:text-gray-200">{c.body}</p>
          </div>
        </div>
      ))}
      {comments.length === 0 && <p className="text-sm text-gray-400">No comments yet.</p>}

      <div className="flex items-end gap-2 pt-2">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={2}
          placeholder="Add a comment…"
          className="input"
        />
        <Button
          className="text-xs"
          disabled={pending || !body.trim()}
          onClick={() =>
            startTransition(async () => {
              await addCommentAction(taskId, body);
              setBody('');
              router.refresh();
            })
          }
        >
          Post
        </Button>
      </div>
    </div>
  );
}
