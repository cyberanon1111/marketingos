'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateProjectStageAction, archiveProjectAction } from '@/app/(app)/projects/actions';
import { Button } from '@/components/ui/Button';
import { STAGE_LABELS } from '@/lib/utils';
import type { ProjectStage } from '@prisma/client';

const STAGES: ProjectStage[] = [
  'PLANNING',
  'EXECUTION',
  'INTERNAL_REVIEW',
  'CEO_REVIEW',
  'APPROVED',
  'COMPLETED',
  'PAUSED',
  'CANCELLED',
];

export function ProjectStageControl({ projectId, stage }: { projectId: string; stage: ProjectStage }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <div className="flex items-center gap-2">
      <select
        defaultValue={stage}
        disabled={pending}
        onChange={(e) => startTransition(async () => {
          await updateProjectStageAction(projectId, e.target.value as ProjectStage);
          router.refresh();
        })}
        className="rounded-card border border-gray-300 bg-transparent px-2.5 py-1.5 text-xs font-medium dark:border-gray-700"
      >
        {STAGES.map((s) => (
          <option key={s} value={s}>
            {STAGE_LABELS[s]}
          </option>
        ))}
      </select>
      <Button
        variant="danger"
        className="px-2.5 py-1.5 text-xs"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            if (!confirm('Archive this project? It will be hidden from the active list.')) return;
            await archiveProjectAction(projectId);
            router.push('/projects');
            router.refresh();
          })
        }
      >
        Archive
      </Button>
    </div>
  );
}
