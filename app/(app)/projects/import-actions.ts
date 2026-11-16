'use server';

import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/session';
import { permissions } from '@/lib/permissions';
import { writeActivity } from '@/lib/activity';
import { notify } from '@/lib/notifications';
import { parseImportWorkbook } from '@/lib/excelImport';
import { revalidatePath } from 'next/cache';

export type ImportSummary = {
  success: boolean;
  error?: string;
  projectsCreated?: number;
  projectsReused?: number;
  tasksCreated?: number;
  skipped?: { row: number; reason: string }[];
};

export async function importProjectsAction(formData: FormData): Promise<ImportSummary> {
  const session = await requireSession();
  permissions.assertCreateProject(session.user);

  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) {
    return { success: false, error: 'Please choose a file to upload.' };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const result = await parseImportWorkbook(buffer);
  if (!result.ok) {
    return { success: false, error: result.hardError };
  }

  let projectsCreated = 0;
  let projectsReused = 0;
  let tasksCreated = 0;
  const skipped: { row: number; reason: string }[] = [];
  const toNotify: { ownerId: string; taskTitle: string; taskId: string }[] = [];

  await prisma.$transaction(async (tx) => {
    for (const group of result.groups) {
      if (group.skipReason) {
        for (const t of group.tasks) skipped.push({ row: t.rowNumber, reason: group.skipReason! });
        continue;
      }

      let projectId = group.existingProjectId;
      if (projectId) {
        projectsReused++;
      } else {
        const project = await tx.project.create({
          data: {
            name: group.projectName,
            ownerId: group.ownerId!,
            deadline: group.deadline,
            priority: group.priority,
          },
        });
        projectId = project.id;
        projectsCreated++;
      }

      for (const t of group.tasks) {
        if (t.skipReason) {
          skipped.push({ row: t.rowNumber, reason: t.skipReason });
          continue;
        }
        const task = await tx.task.create({
          data: {
            title: t.title,
            projectId: projectId!,
            ownerId: t.ownerId!,
            reviewerId: t.reviewerId!,
            dueDate: t.dueDate,
            priority: t.priority,
          },
        });
        tasksCreated++;
        toNotify.push({ ownerId: t.ownerId!, taskTitle: t.title, taskId: task.id });
      }
    }
  });

  for (const n of toNotify) {
    await notify(n.ownerId, 'TASK_ASSIGNED', `You were assigned "${n.taskTitle}"`, `/tasks/${n.taskId}`);
  }

  await writeActivity('Project', 'import', session.user.id, 'imported', {
    projectsCreated,
    projectsReused,
    tasksCreated,
    skippedCount: skipped.length,
  });

  revalidatePath('/projects');
  revalidatePath('/tasks');
  revalidatePath('/dashboard');

  return { success: true, projectsCreated, projectsReused, tasksCreated, skipped };
}
