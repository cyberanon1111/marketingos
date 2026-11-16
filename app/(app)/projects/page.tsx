import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/session';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { NewProjectModal } from '@/components/projects/NewProjectModal';
import { ImportProjectsModal } from '@/components/projects/ImportProjectsModal';
import { projectProgress } from '@/lib/kpi';
import { formatDate, STAGE_LABELS } from '@/lib/utils';

export default async function ProjectsPage() {
  const session = await requireSession();

  const [projects, users, campaigns] = await Promise.all([
    prisma.project.findMany({
      where: { archived: false },
      include: { owner: true, tasks: { select: { status: true } } },
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.user.findMany({ orderBy: { name: 'asc' } }),
    prisma.campaign.findMany({ orderBy: { name: 'asc' } }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Projects</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Every initiative, its owner, and where it stands.</p>
        </div>
        {session.user.role === 'MANAGER' && (
          <div className="flex items-center gap-2">
            <ImportProjectsModal />
            <NewProjectModal
              owners={users.map((u) => ({ id: u.id, name: u.name ?? u.email }))}
              campaigns={campaigns.map((c) => ({ id: c.id, name: c.name }))}
            />
          </div>
        )}
      </div>

      {projects.length === 0 ? (
        <EmptyState
          title="No projects yet"
          description={session.user.role === 'MANAGER' ? 'Create your first project to get started.' : 'A manager needs to create a project first.'}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((p) => {
            const progress = projectProgress(p.tasks);
            return (
              <Link key={p.id} href={`/projects/${p.id}`}>
                <Card className="h-full transition-shadow hover:shadow-md">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-medium">{p.name}</h3>
                    <Badge value={p.stage} kind="stage" label={STAGE_LABELS[p.stage]} />
                  </div>
                  {p.description && <p className="mt-1.5 line-clamp-2 text-sm text-gray-500 dark:text-gray-400">{p.description}</p>}
                  <div className="mt-4">
                    <div className="mb-1 flex justify-between text-xs text-gray-400">
                      <span>{progress}% complete</span>
                      <span>{p.tasks.length} tasks</span>
                    </div>
                    <ProgressBar value={progress} />
                  </div>
                  <div className="mt-4 flex items-center justify-between text-xs text-gray-400">
                    <span>{p.owner.name ?? p.owner.email}</span>
                    <span>Due {formatDate(p.deadline)}</span>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
