'use server';

import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/session';
import { permissions, PermissionError } from '@/lib/permissions';
import { writeActivity } from '@/lib/activity';
import { notify } from '@/lib/notifications';
import { revalidatePath } from 'next/cache';
import type { Priority, TaskStatus, DeliverableType, ReviewActionType } from '@prisma/client';

const DIRECTLY_SETTABLE_STATUSES: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'BLOCKED'];

function paths(taskId: string, projectId?: string) {
  revalidatePath('/tasks');
  revalidatePath(`/tasks/${taskId}`);
  revalidatePath('/dashboard');
  revalidatePath('/team');
  revalidatePath('/ceo-dashboard');
  if (projectId) revalidatePath(`/projects/${projectId}`);
}

export async function createTaskAction(formData: FormData) {
  const session = await requireSession();
  permissions.assertCreateTask(session.user);

  const title = String(formData.get('title') ?? '').trim();
  const projectId = String(formData.get('projectId') ?? '');
  const ownerId = String(formData.get('ownerId') ?? '');
  const reviewerId = String(formData.get('reviewerId') ?? '');
  if (!title) throw new Error('Task title is required.');
  if (!projectId) throw new Error('A project is required.');
  if (!ownerId || !reviewerId) throw new Error('Both an owner and a reviewer are required.');
  if (ownerId === reviewerId) throw new Error('The reviewer cannot be the same person as the owner.');

  const task = await prisma.task.create({
    data: {
      title,
      description: String(formData.get('description') ?? '') || null,
      projectId,
      campaignId: String(formData.get('campaignId') ?? '') || null,
      ownerId,
      reviewerId,
      priority: (String(formData.get('priority') ?? 'MEDIUM') as Priority),
      estimatedHours: formData.get('estimatedHours') ? Number(formData.get('estimatedHours')) : null,
      dueDate: formData.get('dueDate') ? new Date(String(formData.get('dueDate'))) : null,
      acceptanceCriteria: String(formData.get('acceptanceCriteria') ?? '') || null,
      definitionOfDone: String(formData.get('definitionOfDone') ?? '') || null,
    },
  });

  await writeActivity('Task', task.id, session.user.id, 'created', { title: task.title });
  await notify(ownerId, 'TASK_ASSIGNED', `You were assigned "${task.title}"`, `/tasks/${task.id}`);
  paths(task.id, projectId);
  return task;
}

async function loadTaskOrThrow(taskId: string) {
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) throw new Error('Task not found.');
  return task;
}

export async function updateTaskStatusAction(taskId: string, status: TaskStatus) {
  const session = await requireSession();
  const task = await loadTaskOrThrow(taskId);
  permissions.assertCanUpdateTask(session.user, task);

  if (task.status === 'APPROVED') throw new PermissionError('This task is approved and locked.');
  if (!DIRECTLY_SETTABLE_STATUSES.includes(status)) {
    throw new PermissionError('That status can only be reached through the review workflow.');
  }

  const updated = await prisma.task.update({ where: { id: taskId }, data: { status } });
  await writeActivity('Task', taskId, session.user.id, 'status_changed', { status });
  paths(taskId, task.projectId);
  return updated;
}

export async function addDeliverableAction(taskId: string, type: DeliverableType, url: string) {
  const session = await requireSession();
  const task = await loadTaskOrThrow(taskId);
  permissions.assertCanUpdateTask(session.user, task);
  if (task.status === 'APPROVED') throw new PermissionError('This task is approved and locked.');
  if (!url.trim()) throw new Error('A link or file reference is required.');

  const lastVersion = await prisma.deliverable.count({ where: { taskId } });
  const deliverable = await prisma.deliverable.create({
    data: { taskId, type, url: url.trim(), submittedById: session.user.id, version: lastVersion + 1 },
  });

  await writeActivity('Task', taskId, session.user.id, 'deliverable_added', { type, url });
  paths(taskId, task.projectId);
  return deliverable;
}

export async function markReadyForReviewAction(taskId: string) {
  const session = await requireSession();
  const task = await loadTaskOrThrow(taskId);
  permissions.assertCanUpdateTask(session.user, task);
  if (task.status === 'APPROVED') throw new PermissionError('This task is approved and locked.');

  const deliverableCount = await prisma.deliverable.count({ where: { taskId } });
  if (deliverableCount === 0) {
    throw new Error('Attach at least one deliverable before requesting review.');
  }

  const updated = await prisma.task.update({ where: { id: taskId }, data: { status: 'READY_FOR_REVIEW' } });
  await writeActivity('Task', taskId, session.user.id, 'ready_for_review');
  await notify(task.reviewerId, 'REVIEW_REQUESTED', `Review requested on "${task.title}"`, `/tasks/${taskId}`);
  paths(taskId, task.projectId);
  return updated;
}

export async function reviewTaskAction(taskId: string, action: ReviewActionType, comment: string) {
  const session = await requireSession();
  const task = await loadTaskOrThrow(taskId);
  permissions.assertCanReview(session.user, task);
  if (task.status === 'APPROVED') throw new PermissionError('This task is already approved.');
  if (task.status !== 'READY_FOR_REVIEW') {
    throw new Error('This task is not currently awaiting review.');
  }

  await prisma.reviewAction.create({
    data: { taskId, reviewerId: session.user.id, action, comment: comment.trim() || null },
  });

  const nextStatus: TaskStatus = action === 'APPROVE' ? 'APPROVED' : 'CHANGES_REQUESTED';
  const updated = await prisma.task.update({ where: { id: taskId }, data: { status: nextStatus } });

  await writeActivity('Task', taskId, session.user.id, `review_${action.toLowerCase()}`, { comment });

  if (action === 'APPROVE') {
    await notify(task.ownerId, 'REVIEW_APPROVED', `"${task.title}" was approved`, `/tasks/${taskId}`);
  } else if (action === 'REJECT') {
    await notify(task.ownerId, 'REVIEW_REJECTED', `"${task.title}" was rejected: ${comment}`, `/tasks/${taskId}`);
  } else {
    await notify(task.ownerId, 'CHANGES_REQUESTED', `Changes requested on "${task.title}": ${comment}`, `/tasks/${taskId}`);
  }

  paths(taskId, task.projectId);
  return updated;
}

export async function addCommentAction(taskId: string, body: string) {
  const session = await requireSession();
  const task = await loadTaskOrThrow(taskId);
  if (!body.trim()) throw new Error('Comment cannot be empty.');

  const comment = await prisma.comment.create({
    data: { taskId, authorId: session.user.id, body: body.trim() },
  });

  await writeActivity('Task', taskId, session.user.id, 'commented');

  const recipients = new Set([task.ownerId, task.reviewerId]);
  recipients.delete(session.user.id);
  for (const userId of recipients) {
    await notify(userId, 'COMMENT_ADDED', `New comment on "${task.title}"`, `/tasks/${taskId}`);
  }

  paths(taskId, task.projectId);
  return comment;
}
