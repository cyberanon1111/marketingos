'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { addDeliverableAction } from '@/app/(app)/tasks/actions';
import { Button } from '@/components/ui/Button';
import type { DeliverableType } from '@prisma/client';

const TYPES: DeliverableType[] = [
  'GOOGLE_DOC',
  'GOOGLE_SHEET',
  'CANVA',
  'FIGMA',
  'PDF',
  'LINK',
  'LINKEDIN_POST',
  'MAILCHIMP_CAMPAIGN',
  'FILE',
];

export function DeliverableForm({ taskId }: { taskId: string }) {
  const [type, setType] = useState<DeliverableType>('LINK');
  const [url, setUrl] = useState('');
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  return (
    <div className="flex flex-wrap items-end gap-2">
      <div>
        <label className="text-xs font-medium text-gray-500">Type</label>
        <select value={type} onChange={(e) => setType(e.target.value as DeliverableType)} className="input">
          {TYPES.map((t) => (
            <option key={t} value={t}>
              {t.replaceAll('_', ' ')}
            </option>
          ))}
        </select>
      </div>
      <div className="flex-1">
        <label className="text-xs font-medium text-gray-500">Link / file reference</label>
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://docs.google.com/…"
          className="input"
        />
      </div>
      <Button
        className="text-xs"
        disabled={pending || !url.trim()}
        onClick={() =>
          startTransition(async () => {
            setError(null);
            try {
              await addDeliverableAction(taskId, type, url);
              setUrl('');
              router.refresh();
            } catch (e) {
              setError(e instanceof Error ? e.message : 'Failed to attach deliverable.');
            }
          })
        }
      >
        Attach
      </Button>
      {error && <p className="w-full text-xs text-red-600">{error}</p>}
    </div>
  );
}
