import { prisma } from '@/lib/prisma';
import type { NotificationType } from '@prisma/client';

export async function notify(userId: string, type: NotificationType, message: string, link?: string) {
  if (!userId) return;
  await prisma.notification.create({ data: { userId, type, message, link } });
}

export async function getUnreadCount(userId: string) {
  return prisma.notification.count({ where: { userId, read: false } });
}

export async function getRecentNotifications(userId: string, limit = 10) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

export async function markAllRead(userId: string) {
  await prisma.notification.updateMany({ where: { userId, read: false }, data: { read: true } });
}
