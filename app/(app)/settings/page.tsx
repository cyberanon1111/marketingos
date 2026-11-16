import { prisma } from '@/lib/prisma';
import { requireManager } from '@/lib/session';
import { Card } from '@/components/ui/Card';
import { RoleControl } from '@/components/settings/RoleControl';
import { initials } from '@/lib/utils';

export default async function SettingsPage() {
  const session = await requireManager();
  const users = await prisma.user.findMany({ orderBy: { name: 'asc' } });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Settings</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Manager-only: roles and KPI configuration.</p>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-200">Team &amp; Roles</h2>
        <Card className="space-y-1">
          {users.map((u) => (
            <div key={u.id} className="flex items-center justify-between rounded-card px-2 py-2">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
                  {initials(u.name ?? u.email)}
                </div>
                <div>
                  <p className="text-sm font-medium">{u.name ?? u.email}</p>
                  <p className="text-xs text-gray-400">{u.email}</p>
                </div>
              </div>
              <RoleControl userId={u.id} role={u.role} isSelf={u.id === session.user.id} />
            </div>
          ))}
        </Card>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-200">KPI Configuration</h2>
        <Card>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Team capacity threshold is currently fixed at <span className="font-medium text-gray-700 dark:text-gray-200">5 active tasks</span> per
            person (used on the CEO Dashboard and Team page). Editable KPI thresholds, health-score weighting, and custom
            metric definitions are planned for Phase 2.
          </p>
        </Card>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-200">Access Model</h2>
        <Card>
          <ul className="space-y-1.5 text-sm text-gray-600 dark:text-gray-300">
            <li><span className="font-medium">Marketing Managers</span> can create/archive projects, create and assign tasks, change priorities, approve or reject deliverables, manage roles, and configure KPIs.</li>
            <li><span className="font-medium">Team Members</span> can update their own task status, upload deliverables, comment, and request review — but cannot delete projects/tasks, edit KPIs, or approve their own work.</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
