import type { Role } from '@prisma/client';

export type ActorContext = { id: string; role: Role };

export class PermissionError extends Error {
  constructor(message = 'You do not have permission to do that.') {
    super(message);
    this.name = 'PermissionError';
  }
}

function requireManager(actor: ActorContext) {
  if (actor.role !== 'MANAGER') throw new PermissionError();
}

export const permissions = {
  canCreateProject: (actor: ActorContext) => actor.role === 'MANAGER',
  canArchiveProject: (actor: ActorContext) => actor.role === 'MANAGER',
  canCreateTask: (actor: ActorContext) => actor.role === 'MANAGER',
  canAssignTask: (actor: ActorContext) => actor.role === 'MANAGER',
  canChangePriority: (actor: ActorContext) => actor.role === 'MANAGER',
  canEditKpis: (actor: ActorContext) => actor.role === 'MANAGER',
  canManageRoles: (actor: ActorContext) => actor.role === 'MANAGER',
  canUpdateOwnTaskStatus: (actor: ActorContext, task: { ownerId: string }) =>
    actor.role === 'MANAGER' || actor.id === task.ownerId,
  canUploadDeliverable: (actor: ActorContext, task: { ownerId: string }) =>
    actor.role === 'MANAGER' || actor.id === task.ownerId,
  canComment: () => true,
  canReview: (actor: ActorContext, task: { reviewerId: string }) => actor.id === task.reviewerId,
  isSelfReview: (actor: ActorContext, task: { ownerId: string }) => actor.id === task.ownerId,

  assertCreateProject: (actor: ActorContext) => requireManager(actor),
  assertArchiveProject: (actor: ActorContext) => requireManager(actor),
  assertCreateTask: (actor: ActorContext) => requireManager(actor),
  assertAssignTask: (actor: ActorContext) => requireManager(actor),
  assertChangePriority: (actor: ActorContext) => requireManager(actor),
  assertEditKpis: (actor: ActorContext) => requireManager(actor),
  assertManageRoles: (actor: ActorContext) => requireManager(actor),

  assertCanUpdateTask: (actor: ActorContext, task: { ownerId: string }) => {
    if (actor.role !== 'MANAGER' && actor.id !== task.ownerId) throw new PermissionError();
  },
  assertCanReview: (actor: ActorContext, task: { reviewerId: string; ownerId: string }) => {
    if (actor.id !== task.reviewerId) {
      throw new PermissionError('Only the assigned reviewer can take review actions on this task.');
    }
    if (actor.id === task.ownerId) {
      throw new PermissionError('You cannot approve your own work.');
    }
  },
};
