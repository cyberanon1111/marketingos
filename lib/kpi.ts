import type { Task, TaskStatus, ReviewAction, Project } from '@prisma/client';

const ACTIVE_STATUSES: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'BLOCKED', 'READY_FOR_REVIEW', 'CHANGES_REQUESTED'];

export function isOverdue(task: Pick<Task, 'dueDate' | 'status'>): boolean {
  if (!task.dueDate || task.status === 'APPROVED') return false;
  return task.dueDate.getTime() < Date.now();
}

export function isDueWithin(task: Pick<Task, 'dueDate' | 'status'>, days: number): boolean {
  if (!task.dueDate || task.status === 'APPROVED') return false;
  const diffMs = task.dueDate.getTime() - Date.now();
  return diffMs >= 0 && diffMs <= days * 24 * 60 * 60 * 1000;
}

export function isActive(task: Pick<Task, 'status'>): boolean {
  return ACTIVE_STATUSES.includes(task.status);
}

export function projectProgress(tasks: Pick<Task, 'status'>[]): number {
  if (tasks.length === 0) return 0;
  const approved = tasks.filter((t) => t.status === 'APPROVED').length;
  return Math.round((approved / tasks.length) * 100);
}

export function completionRate(tasks: Pick<Task, 'status'>[]): number {
  if (tasks.length === 0) return 0;
  const approved = tasks.filter((t) => t.status === 'APPROVED').length;
  return approved / tasks.length;
}

export function approvalRate(actions: Pick<ReviewAction, 'action'>[]): number {
  if (actions.length === 0) return 1;
  const approved = actions.filter((a) => a.action === 'APPROVE').length;
  return approved / actions.length;
}

export function revisionRate(actions: Pick<ReviewAction, 'action'>[]): number {
  if (actions.length === 0) return 0;
  const revisions = actions.filter((a) => a.action !== 'APPROVE').length;
  return revisions / actions.length;
}

export function avgCompletionHours(tasks: Pick<Task, 'status' | 'actualHours'>[]): number | null {
  const done = tasks.filter((t) => t.status === 'APPROVED' && t.actualHours != null);
  if (done.length === 0) return null;
  const total = done.reduce((sum, t) => sum + (t.actualHours ?? 0), 0);
  return Math.round((total / done.length) * 10) / 10;
}

export function missedDeadlines(tasks: Pick<Task, 'dueDate' | 'status'>[]): number {
  return tasks.filter((t) => isOverdue(t)).length;
}

export function workloadByUser<T extends { ownerId: string; status: TaskStatus }>(tasks: T[]) {
  const map = new Map<string, number>();
  for (const t of tasks) {
    if (!isActive(t)) continue;
    map.set(t.ownerId, (map.get(t.ownerId) ?? 0) + 1);
  }
  return map;
}

/** 0-100 blended score: on-time completion, approval rate, and workload balance. */
export function healthScore(input: {
  tasks: Pick<Task, 'status' | 'dueDate'>[];
  reviewActions: Pick<ReviewAction, 'action'>[];
  workload: Map<string, number>;
}): number {
  const { tasks, reviewActions, workload } = input;
  const onTimeRate =
    tasks.length === 0
      ? 1
      : 1 - missedDeadlines(tasks) / Math.max(tasks.filter((t) => isActive(t) || t.status === 'APPROVED').length, 1);
  const approval = approvalRate(reviewActions);

  const loads = Array.from(workload.values());
  const balance =
    loads.length <= 1
      ? 1
      : Math.max(0, 1 - (Math.max(...loads) - Math.min(...loads)) / Math.max(Math.max(...loads), 1));

  const score = onTimeRate * 0.45 + approval * 0.35 + balance * 0.2;
  return Math.round(score * 100);
}

/** Buckets a list of dates into `weeks` weekly counts, oldest first, most recent last. */
export function weeklyBuckets(dates: Date[], weeks = 8): number[] {
  const now = Date.now();
  const buckets = new Array(weeks).fill(0);
  for (const d of dates) {
    const diffWeeks = Math.floor((now - d.getTime()) / (7 * 24 * 60 * 60 * 1000));
    if (diffWeeks >= 0 && diffWeeks < weeks) {
      buckets[weeks - 1 - diffWeeks]++;
    }
  }
  return buckets;
}

export function projectAtRisk(project: Pick<Project, 'deadline' | 'stage'>, progress: number): boolean {
  if (!project.deadline) return false;
  if (project.stage === 'COMPLETED' || project.stage === 'CANCELLED') return false;
  const daysLeft = (project.deadline.getTime() - Date.now()) / (24 * 60 * 60 * 1000);
  return daysLeft < 3 && progress < 80;
}
