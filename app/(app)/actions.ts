'use server';

import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/session';
import { markAllRead } from '@/lib/notifications';
import { revalidatePath } from 'next/cache';

export async function markNotificationsReadAction() {
  const session = await requireSession();
  await markAllRead(session.user.id);
  revalidatePath('/', 'layout');
}

export async function globalSearchAction(query: string) {
  await requireSession();
  const q = query.trim();
  if (q.length < 2) return { projects: [], tasks: [] };

  const [projects, tasks] = await Promise.all([
    prisma.project.findMany({
      where: { name: { contains: q, mode: 'insensitive' }, archived: false },
      select: { id: true, name: true, stage: true },
      take: 5,
    }),
    prisma.task.findMany({
      where: { title: { contains: q, mode: 'insensitive' } },
      select: { id: true, title: true, status: true },
      take: 5,
    }),
  ]);

  return { projects, tasks };
}
