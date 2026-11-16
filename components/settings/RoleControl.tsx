'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateUserRoleAction } from '@/app/(app)/settings/actions';
import type { Role } from '@prisma/client';

export function RoleControl({ userId, role, isSelf }: { userId: string; role: Role; isSelf: boolean }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <select
      defaultValue={role}
      disabled={pending || isSelf}
      title={isSelf ? 'You cannot change your own role' : undefined}
      onChange={(e) =>
        startTransition(async () => {
          await updateUserRoleAction(userId, e.target.value as Role);
          router.refresh();
        })
      }
      className="rounded-card border border-gray-300 bg-transparent px-2 py-1 text-xs dark:border-gray-700"
    >
      <option value="MEMBER">Team Member</option>
      <option value="MANAGER">Marketing Manager</option>
    </select>
  );
}
