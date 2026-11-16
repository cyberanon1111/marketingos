'use server';

import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/session';
import { permissions } from '@/lib/permissions';
import { writeActivity } from '@/lib/activity';
import { revalidatePath } from 'next/cache';
import type { Role } from '@prisma/client';

export async function updateUserRoleAction(userId: string, role: Role) {
  const session = await requireSession();
  permissions.assertManageRoles(session.user);

  if (userId === session.user.id && role !== 'MANAGER') {
    throw new Error('You cannot demote yourself.');
  }

  const user = await prisma.user.update({ where: { id: userId }, data: { role } });
  await writeActivity('User', userId, session.user.id, 'role_changed', { role });
  revalidatePath('/settings');
  revalidatePath('/team');
  return user;
}
