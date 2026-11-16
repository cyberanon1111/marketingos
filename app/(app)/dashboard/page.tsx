import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/session';
import { Card, StatCard } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { Disclosure } from '@/components/ui/Disclosure';
import { NextActionBanner } from '@/components/dashboard/NextActionBanner';
import {
  isOverdue,
  isDueWithin,
  completionRate,
  approvalRate,
  avgCompletionHours,
  missedDeadlines,
  projectProgress,
  projectAtRisk,
  workloadByUser,
} from '@/lib/kpi';
import { formatDate, formatDateTime, STATUS_LABELS, PRIORITY_LABELS, STAGE_LABELS } from '@/lib/utils';

export default async function DashboardPage() {
  const session = await requireSession();

  const [tasks, projects, users, activity, reviewActions] = await Promise.all([
    prisma.task.findMany({ include: { owner: true, reviewer: true, project: true } }),
    prisma.project.findMany({ where: { archived: false }, include: { tasks: { select: { status: true } } } }),
    prisma.user.findMany(),
    prisma.activityLog.findMany({ orderBy: { createdAt: 'desc' }, take: 8, include: { actor: true } }),
    prisma.reviewAction.findMany(),
  ]);

  const myTasks = tasks.filter((t) => t.ownerId === session.user.id && t.status !== 'APPROVED');
  const dueToday = tasks.filter((t) => isDueWithin(t, 0));
  const overdue = tasks.filter((t) => isOverdue(t));
  const pendingReviews = tasks.filter((t) => t.reviewerId === session.user.id && t.status === 'READY_FOR_REVIEW');
  const blocked = tasks.filter((t) => t.status === 'BLOCKED');

  const projectsNearDeadline = projects.filter((p) => projectAtRisk(p, projectProgress(p.tasks)));

  const myPriorities = [...myTasks]
    .sort((a, b) => {
      const order = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 } as const;
      if (order[a.priority] !== order[b.priority]) return order[a.priority] - order[b.priority];
      return (a.dueDate?.getTime() ?? Infinity) - (b.dueDate?.getTime() ?? Infinity);
    })
    .slice(0, 5);

  const workload = workloadByUser(tasks);
  const myOverdue = overdue.filter((t) => t.ownerId === session.user.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Welcome back, {session.user.name?.split(' ')[0] ?? 'there'}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Here&apos;s what needs your attention today.</p>
      </div>

      <NextActionBanner
        pendingReviews={pendingReviews.map((t) => ({ id: t.id, title: t.title }))}
        myOverdue={myOverdue.map((t) => ({ id: t.id, title: t.title }))}
        topPriority={myPriorities[0] ? { id: myPriorities[0].id, title: myPriorities[0].title } : null}
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Due Today" value={dueToday.length} />
        <StatCard label="Overdue" value={overdue.length} />
        <StatCard label="Pending My Review" value={pendingReviews.length} />
        <StatCard label="Blocked" value={blocked.length} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div>
          <h2 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-200">Today&apos;s Priorities</h2>
          <Card className="space-y-2">
            {myPriorities.length === 0 && <p className="text-sm text-gray-400">Nothing on your plate right now.</p>}
            {myPriorities.map((t) => (
              <Link
                key={t.id}
                href={`/tasks/${t.id}`}
                className="flex items-center justify-between rounded-card px-2 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <span className="text-sm">{t.title}</span>
                <div className="flex items-center gap-1.5">
                  <Badge value={t.priority} kind="priority" label={PRIORITY_LABELS[t.priority]} />
                  <span className="text-xs text-gray-400">{formatDate(t.dueDate)}</span>
                </div>
              </Link>
            ))}
          </Card>
        </div>

        <div>
          <h2 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-200">Pending Reviews</h2>
          <Card className="space-y-2">
            {pendingReviews.length === 0 && <p className="text-sm text-gray-400">No reviews waiting on you.</p>}
            {pendingReviews.map((t) => (
              <Link
                key={t.id}
                href={`/tasks/${t.id}`}
                className="flex items-center justify-between rounded-card px-2 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <span className="text-sm">{t.title}</span>
                <span className="text-xs text-gray-400">{t.owner.name ?? t.owner.email}</span>
              </Link>
            ))}
          </Card>
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-200">Projects Near Deadline</h2>
        {projectsNearDeadline.length === 0 ? (
          <EmptyState title="Nothing at risk" description="No projects are close to deadline with low progress." />
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {projectsNearDeadline.map((p) => (
              <Link key={p.id} href={`/projects/${p.id}`}>
                <Card className="hover:shadow-md">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{p.name}</span>
                    <Badge value={p.stage} kind="stage" label={STAGE_LABELS[p.stage]} />
                  </div>
                  <ProgressBar value={projectProgress(p.tasks)} className="mt-3" />
                  <p className="mt-2 text-xs text-red-500">Due {formatDate(p.deadline)}</p>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      <Disclosure label="Show team workload, activity & KPIs" openLabel="Hide">
        <div className="space-y-6 pt-1">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div>
              <h2 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-200">Team Workload</h2>
              <Card className="space-y-2.5">
                {users.map((u) => {
                  const count = workload.get(u.id) ?? 0;
                  return (
                    <div key={u.id} className="flex items-center gap-3">
                      <span className="w-32 truncate text-sm">{u.name ?? u.email}</span>
                      <ProgressBar value={Math.min(100, count * 20)} className="flex-1" />
                      <span className="w-6 text-right text-xs text-gray-400">{count}</span>
                    </div>
                  );
                })}
              </Card>
            </div>

            <div>
              <h2 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-200">Recent Activity</h2>
              <Card className="space-y-2.5">
                {activity.length === 0 && <p className="text-sm text-gray-400">No activity yet.</p>}
                {activity.map((a) => (
                  <div key={a.id} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-300">
                      <span className="font-medium">{a.actor.name ?? a.actor.email}</span> {a.action.replaceAll('_', ' ')} a{' '}
                      {a.entityType.toLowerCase()}
                    </span>
                    <span className="text-xs text-gray-400">{formatDateTime(a.createdAt)}</span>
                  </div>
                ))}
              </Card>
            </div>
          </div>

          <div>
            <h2 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-200">Marketing KPIs</h2>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <StatCard label="Completion Rate" value={`${Math.round(completionRate(tasks) * 100)}%`} />
              <StatCard label="Approval Rate" value={`${Math.round(approvalRate(reviewActions) * 100)}%`} />
              <StatCard
                label="Avg. Completion Time"
                value={avgCompletionHours(tasks) != null ? `${avgCompletionHours(tasks)}h` : '—'}
              />
              <StatCard label="Missed Deadlines" value={missedDeadlines(tasks)} />
            </div>
          </div>
        </div>
      </Disclosure>
    </div>
  );
}
