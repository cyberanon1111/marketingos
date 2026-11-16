import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { Card, StatCard } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  healthScore,
  workloadByUser,
  isOverdue,
  projectProgress,
  projectAtRisk,
  completionRate,
  approvalRate,
  missedDeadlines,
} from '@/lib/kpi';
import { formatDate, formatDateTime, STAGE_LABELS } from '@/lib/utils';

const CAPACITY_THRESHOLD = 5;

export default async function CeoDashboardPage() {
  const [tasks, projects, campaigns, reviewActions, users] = await Promise.all([
    prisma.task.findMany({ include: { owner: true, project: true } }),
    prisma.project.findMany({ where: { archived: false }, include: { tasks: { select: { status: true } } } }),
    prisma.campaign.findMany({ include: { tasks: { select: { status: true } } } }),
    prisma.reviewAction.findMany({ include: { task: true } }),
    prisma.user.findMany(),
  ]);

  const workload = workloadByUser(tasks);
  const score = healthScore({ tasks, reviewActions, workload });

  const overdueTasks = tasks.filter((t) => isOverdue(t));
  const projectsAtRisk = projects.filter((p) => projectAtRisk(p, projectProgress(p.tasks)));

  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const weeklyWins = reviewActions.filter((r) => r.action === 'APPROVE' && r.createdAt.getTime() >= weekAgo);

  const upcomingLaunches = campaigns.filter(
    (c) => c.launchDate && c.launchDate.getTime() >= Date.now() && c.launchDate.getTime() <= Date.now() + 30 * 24 * 60 * 60 * 1000
  );

  const overCapacity = users.filter((u) => (workload.get(u.id) ?? 0) > CAPACITY_THRESHOLD);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">CEO Dashboard</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">The full marketing picture, at a glance.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card className="md:col-span-1">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Marketing Health Score</p>
          <p className="mt-2 text-4xl font-semibold text-brand-600">{score}</p>
          <ProgressBar value={score} className="mt-3" />
        </Card>
        <StatCard label="Completion Rate" value={`${Math.round(completionRate(tasks) * 100)}%`} />
        <StatCard label="Approval Rate" value={`${Math.round(approvalRate(reviewActions) * 100)}%`} />
        <StatCard label="Missed Deadlines" value={missedDeadlines(tasks)} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div>
          <h2 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-200">Campaign Progress</h2>
          {campaigns.length === 0 ? (
            <EmptyState title="No campaigns yet" />
          ) : (
            <Card className="space-y-3">
              {campaigns.map((c) => (
                <div key={c.id}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span>{c.name}</span>
                    <Badge value={c.status} />
                  </div>
                  <ProgressBar value={projectProgress(c.tasks)} />
                </div>
              ))}
            </Card>
          )}
        </div>

        <div>
          <h2 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-200">Upcoming Launches</h2>
          {upcomingLaunches.length === 0 ? (
            <EmptyState title="Nothing launching in the next 30 days" />
          ) : (
            <Card className="space-y-2">
              {upcomingLaunches.map((c) => (
                <div key={c.id} className="flex items-center justify-between text-sm">
                  <span>{c.name}</span>
                  <span className="text-xs text-gray-400">{formatDate(c.launchDate)}</span>
                </div>
              ))}
            </Card>
          )}
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-200">Current Risks</h2>
        {overdueTasks.length === 0 && projectsAtRisk.length === 0 && overCapacity.length === 0 ? (
          <EmptyState title="No active risks" description="Nothing is overdue, near-deadline and behind, or over capacity." />
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <Card>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Overdue Tasks</p>
              <p className="mt-1 text-2xl font-semibold text-red-500">{overdueTasks.length}</p>
              <ul className="mt-2 space-y-1">
                {overdueTasks.slice(0, 3).map((t) => (
                  <li key={t.id}>
                    <Link href={`/tasks/${t.id}`} className="text-xs text-gray-500 hover:text-brand-600 dark:text-gray-400">
                      {t.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
            <Card>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Projects at Risk</p>
              <p className="mt-1 text-2xl font-semibold text-amber-500">{projectsAtRisk.length}</p>
              <ul className="mt-2 space-y-1">
                {projectsAtRisk.slice(0, 3).map((p) => (
                  <li key={p.id}>
                    <Link href={`/projects/${p.id}`} className="text-xs text-gray-500 hover:text-brand-600 dark:text-gray-400">
                      {p.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
            <Card>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Team Over Capacity</p>
              <p className="mt-1 text-2xl font-semibold text-amber-500">{overCapacity.length}</p>
              <ul className="mt-2 space-y-1">
                {overCapacity.slice(0, 3).map((u) => (
                  <li key={u.id} className="text-xs text-gray-500 dark:text-gray-400">
                    {u.name ?? u.email} ({workload.get(u.id)} active)
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-200">Weekly Wins &amp; Recent Achievements</h2>
        {weeklyWins.length === 0 ? (
          <EmptyState title="No approvals yet this week" />
        ) : (
          <Card className="space-y-2">
            {weeklyWins.map((r) => (
              <Link
                key={r.id}
                href={`/tasks/${r.taskId}`}
                className="flex items-center justify-between rounded-card px-1 py-1 text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <span>{r.task.title}</span>
                <span className="text-xs text-gray-400">{formatDateTime(r.createdAt)}</span>
              </Link>
            ))}
          </Card>
        )}
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-200">Team Capacity</h2>
        <Card className="space-y-2.5">
          {users.map((u) => {
            const count = workload.get(u.id) ?? 0;
            return (
              <div key={u.id} className="flex items-center gap-3">
                <span className="w-32 truncate text-sm">{u.name ?? u.email}</span>
                <ProgressBar value={Math.min(100, (count / CAPACITY_THRESHOLD) * 100)} className="flex-1" />
                <span className="w-10 text-right text-xs text-gray-400">{count}/{CAPACITY_THRESHOLD}</span>
              </div>
            );
          })}
        </Card>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-200">Projects</h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {projects.map((p) => (
            <Link key={p.id} href={`/projects/${p.id}`}>
              <Card className="hover:shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{p.name}</span>
                  <Badge value={p.stage} kind="stage" label={STAGE_LABELS[p.stage]} />
                </div>
                <ProgressBar value={projectProgress(p.tasks)} className="mt-3" />
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
