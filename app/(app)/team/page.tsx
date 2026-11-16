import { prisma } from '@/lib/prisma';
import { Card } from '@/components/ui/Card';
import { Sparkline } from '@/components/team/Sparkline';
import {
  avgCompletionHours,
  approvalRate,
  isOverdue,
  weeklyBuckets,
  workloadByUser,
} from '@/lib/kpi';
import { initials } from '@/lib/utils';

export default async function TeamPage() {
  const [users, tasks, reviewActions] = await Promise.all([
    prisma.user.findMany({ orderBy: { name: 'asc' } }),
    prisma.task.findMany(),
    prisma.reviewAction.findMany({ include: { task: true } }),
  ]);

  const workload = workloadByUser(tasks);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Team</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Workload and performance, computed automatically — no manual entry.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {users.map((u) => {
          const ownedTasks = tasks.filter((t) => t.ownerId === u.id);
          const completed = ownedTasks.filter((t) => t.status === 'APPROVED');
          const overdue = ownedTasks.filter((t) => isOverdue(t));
          const pendingReviews = tasks.filter((t) => t.reviewerId === u.id && t.status === 'READY_FOR_REVIEW');
          const theirReviewActions = reviewActions.filter((r) => r.task.ownerId === u.id);
          const approvals = reviewActions.filter((r) => r.task.ownerId === u.id && r.action === 'APPROVE').map((r) => r.createdAt);
          const trend = weeklyBuckets(approvals, 8);
          const weeklyScore = trend[trend.length - 1];
          const monthlyScore = trend.slice(-4).reduce((a, b) => a + b, 0);

          return (
            <Card key={u.id}>
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
                  {initials(u.name ?? u.email)}
                </div>
                <div>
                  <p className="text-sm font-medium">{u.name ?? u.email}</p>
                  <p className="text-xs text-gray-400">{u.role === 'MANAGER' ? 'Marketing Manager' : 'Team Member'}</p>
                </div>
                <div className="ml-auto text-brand-500">
                  <Sparkline values={trend} />
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-lg font-semibold">{ownedTasks.length}</p>
                  <p className="text-xs text-gray-400">Assigned</p>
                </div>
                <div>
                  <p className="text-lg font-semibold">{completed.length}</p>
                  <p className="text-xs text-gray-400">Completed</p>
                </div>
                <div>
                  <p className="text-lg font-semibold">{workload.get(u.id) ?? 0}</p>
                  <p className="text-xs text-gray-400">Active</p>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3 border-t border-gray-100 pt-3 text-xs text-gray-500 dark:border-gray-800 dark:text-gray-400">
                <p>Pending reviews: <span className="font-medium text-gray-700 dark:text-gray-200">{pendingReviews.length}</span></p>
                <p>Overdue: <span className="font-medium text-red-500">{overdue.length}</span></p>
                <p>Approval rate: <span className="font-medium text-gray-700 dark:text-gray-200">{Math.round(approvalRate(theirReviewActions) * 100)}%</span></p>
                <p>Avg completion: <span className="font-medium text-gray-700 dark:text-gray-200">{avgCompletionHours(ownedTasks) ?? '—'}h</span></p>
                <p>Weekly score: <span className="font-medium text-gray-700 dark:text-gray-200">{weeklyScore}</span></p>
                <p>Monthly score: <span className="font-medium text-gray-700 dark:text-gray-200">{monthlyScore}</span></p>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
