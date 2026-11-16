import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/session';
import { EmptyState } from '@/components/ui/EmptyState';
import { NewTaskModal } from '@/components/tasks/NewTaskModal';
import { TasksView, type TaskRow } from '@/components/tasks/TasksView';
import { isOverdue } from '@/lib/kpi';

export default async function TasksPage() {
  const session = await requireSession();

  const [tasks, projects, users] = await Promise.all([
    prisma.task.findMany({
      include: { owner: true, reviewer: true, project: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.project.findMany({ where: { archived: false }, orderBy: { name: 'asc' } }),
    prisma.user.findMany({ orderBy: { name: 'asc' } }),
  ]);

  const rows: TaskRow[] = tasks.map((t) => ({
    id: t.id,
    title: t.title,
    status: t.status,
    priority: t.priority,
    dueDate: t.dueDate ? t.dueDate.toISOString() : null,
    project: { id: t.project.id, name: t.project.name },
    owner: { id: t.owner.id, name: t.owner.name, email: t.owner.email },
    reviewer: { id: t.reviewer.id, name: t.reviewer.name, email: t.reviewer.email },
    overdue: isOverdue(t),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Tasks</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Everything in flight, across every project.</p>
        </div>
        {session.user.role === 'MANAGER' && (
          <NewTaskModal
            projects={projects.map((p) => ({ id: p.id, name: p.name }))}
            users={users.map((u) => ({ id: u.id, name: u.name ?? u.email }))}
          />
        )}
      </div>

      {rows.length === 0 ? (
        <EmptyState title="No tasks yet" description="Tasks created by a manager will show up here." />
      ) : (
        <TasksView tasks={rows} />
      )}
    </div>
  );
}
