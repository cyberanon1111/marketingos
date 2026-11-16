'use server';

import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/session';
import { permissions, PermissionError } from '@/lib/permissions';
import { writeActivity } from '@/lib/activity';
import { revalidatePath } from 'next/cache';
import type { Priority, ProjectStage } from '@prisma/client';

export async function createProjectAction(formData: FormData) {
  const session = await requireSession();
  permissions.assertCreateProject(session.user);

  const name = String(formData.get('name') ?? '').trim();
  if (!name) throw new Error('Project name is required.');

  const project = await prisma.project.create({
    data: {
      name,
      description: String(formData.get('description') ?? '') || null,
      businessGoal: String(formData.get('businessGoal') ?? '') || null,
      campaignType: String(formData.get('campaignType') ?? '') || null,
      priority: (String(formData.get('priority') ?? 'MEDIUM') as Priority),
      ownerId: String(formData.get('ownerId') ?? session.user.id),
      campaignId: String(formData.get('campaignId') ?? '') || null,
      startDate: formData.get('startDate') ? new Date(String(formData.get('startDate'))) : null,
      deadline: formData.get('deadline') ? new Date(String(formData.get('deadline'))) : null,
    },
  });

  await writeActivity('Project', project.id, session.user.id, 'created', { name: project.name });
  revalidatePath('/projects');
  revalidatePath('/dashboard');
  return project;
}

export async function updateProjectStageAction(projectId: string, stage: ProjectStage) {
  const session = await requireSession();
  permissions.assertChangePriority(session.user); // manager-only gate, reused

  const project = await prisma.project.update({ where: { id: projectId }, data: { stage } });
  await writeActivity('Project', project.id, session.user.id, 'stage_changed', { stage });
  revalidatePath(`/projects/${projectId}`);
  revalidatePath('/projects');
  revalidatePath('/ceo-dashboard');
  return project;
}

export async function archiveProjectAction(projectId: string) {
  const session = await requireSession();
  permissions.assertArchiveProject(session.user);

  await prisma.project.update({ where: { id: projectId }, data: { archived: true, stage: 'CANCELLED' } });
  await writeActivity('Project', projectId, session.user.id, 'archived');
  revalidatePath('/projects');
  revalidatePath('/dashboard');
}

export async function updateProjectNotesAction(projectId: string, notes: string) {
  const session = await requireSession();
  const project = await prisma.project.findUniqueOrThrow({ where: { id: projectId } });
  if (session.user.role !== 'MANAGER' && session.user.id !== project.ownerId) {
    throw new PermissionError();
  }
  await prisma.project.update({ where: { id: projectId }, data: { notes } });
  revalidatePath(`/projects/${projectId}`);
}
