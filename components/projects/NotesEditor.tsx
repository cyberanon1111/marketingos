'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateProjectNotesAction } from '@/app/(app)/projects/actions';
import { Button } from '@/components/ui/Button';

export function NotesEditor({ projectId, initialNotes }: { projectId: string; initialNotes: string }) {
  const [notes, setNotes] = useState(initialNotes);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const router = useRouter();

  return (
    <div>
      <textarea
        value={notes}
        onChange={(e) => {
          setNotes(e.target.value);
          setSaved(false);
        }}
        rows={4}
        placeholder="Notes, context, links…"
        className="input"
      />
      <div className="mt-2 flex items-center gap-2">
        <Button
          variant="secondary"
          className="text-xs"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await updateProjectNotesAction(projectId, notes);
              setSaved(true);
              router.refresh();
            })
          }
        >
          {pending ? 'Saving…' : 'Save Notes'}
        </Button>
        {saved && <span className="text-xs text-emerald-600">Saved</span>}
      </div>
    </div>
  );
}
