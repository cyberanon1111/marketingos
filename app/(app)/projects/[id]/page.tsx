import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/session';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { ProjectStageControl } from '@/components/projects/ProjectStageControl';
import { NotesEditor } from '@/components/projects/NotesEditor';
import { projectProgress } from '@/lib/kpi';
import { formatDate, STAGE_LABELS, STATUS_LABELS, PRIORITY_LABELS } from '@/lib/utils';

export default async function ProjectDetailPage({ params }: { params: { id: string } }) {
  const session = await requireSession();

  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: {
      owner: true,
      campaign: true,
      tasks: { include: { owner: true, reviewer: true }, orderBy: { createdAt: 'asc' } },
    },
  });

  if (!project) notFound();

  const progress = projectProgress(project.tasks);
  const isManager = session.user.role === 'MANAGER';

  return (
    <div className="space-y-6">
      <div>
        <Link href="/projects" className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
          ← Projects
        </Link>
        <div className="mt-1 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold">{project.name}</h1>
              <Badge value={project.stage} kind="stage" label={STAGE_LABELS[project.stage]} />
              <Badge value={project.priority} kind="priority" label={PRIORITY_LABELS[project.priority]} />
            </div>
            {project.description && <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{project.description}</p>}
          </div>
          {isManager && <ProjectStageControl projectId={project.id} stage={project.stage} />}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Progress</p>
          <p className="mt-2 text-2xl font-semibold">{progress}%</p>
          <ProgressBar value={progress} className="mt-3" />
          <p className="mt-2 text-xs text-gray-400">{project.tasks.length} tasks total</p>
        </Card>
        <Card>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Owner &amp; Timeline</p>
          <p className="mt-2 text-sm">{project.owner.name ?? project.owner.email}</p>
          <p className="mt-1 text-xs text-gray-400">
            {formatDate(project.startDate)} → {formatDate(project.deadline)}
          </p>
        </Card>
        <Card>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Business Goal</p>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{project.businessGoal ?? '—'}</p>
          {project.campaign && (
            <p className="mt-2 text-xs text-gray-400">
              Campaign: <Link href="/campaigns" className="text-brand-600 hover:underline">{project.campaign.name}</Link>
            </p>
          )}
        </Card>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-200">Tasks</h2>
        {project.tasks.length === 0 ? (
          <EmptyState title="No tasks yet" description="Tasks for this project will appear here once created." />
        ) : (
          <div className="overflow-hidden rounded-card border border-gray-200 dark:border-gray-800">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase text-gray-400 dark:bg-gray-900">
                <tr>
                  <th className="px-4 py-2 font-medium">Task</th>
                  <th className="px-4 py-2 font-medium">Owner</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 font-medium">Due</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {project.tasks.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-900">
                    <td className="px-4 py-2.5">
                      <Link href={`/tasks/${t.id}`} className="font-medium hover:text-brand-600">
                        {t.title}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5 text-gray-500 dark:text-gray-400">{t.owner.name ?? t.owner.email}</td>
                    <td className="px-4 py-2.5">
                      <Badge value={t.status} label={STATUS_LABELS[t.status]} />
                    </td>
                    <td className="px-4 py-2.5 text-gray-500 dark:text-gray-400">{formatDate(t.dueDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-200">Notes</h2>
        <Card>
          <NotesEditor projectId={project.id} initialNotes={project.notes ?? ''} />
        </Card>
      </div>
    </div>
  );
}
