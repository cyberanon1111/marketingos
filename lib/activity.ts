import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

export async function writeActivity(
  entityType: string,
  entityId: string,
  actorId: string,
  action: string,
  meta?: Record<string, unknown>
) {
  await prisma.activityLog.create({
    data: { entityType, entityId, actorId, action, meta: (meta as Prisma.InputJsonValue) ?? undefined },
  });
}

export async function getRecentActivity(limit = 20) {
  return prisma.activityLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: { actor: true },
  });
}
