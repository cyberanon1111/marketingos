import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/session';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Disclosure } from '@/components/ui/Disclosure';
import { StatusControl } from '@/components/tasks/StatusControl';
import { DeliverableForm } from '@/components/tasks/DeliverableForm';
import { ReviewPanel } from '@/components/tasks/ReviewPanel';
import { CommentsThread } from '@/components/tasks/CommentsThread';
import { formatDate, formatDateTime, STATUS_LABELS, PRIORITY_LABELS } from '@/lib/utils';
import { isOverdue } from '@/lib/kpi';

export default async function TaskDetailPage({ params }: { params: { id: string } }) {
  const session = await requireSession();

  const task = await prisma.task.findUnique({
    where: { id: params.id },
    include: {
      project: true,
      owner: true,
      reviewer: true,
      deliverables: { include: { submittedBy: true }, orderBy: { submittedAt: 'desc' } },
      reviewActions: { include: { reviewer: true }, orderBy: { createdAt: 'desc' } },
      comments: { include: { author: true }, orderBy: { createdAt: 'asc' } },
    },
  });

  if (!task) notFound();

  const isOwnerOrManager = session.user.role === 'MANAGER' || session.user.id === task.ownerId;
  const isReviewer = session.user.id === task.reviewerId;
  const overdue = isOverdue(task);

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/projects/${task.projectId}`} className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
          ← {task.project.name}
        </Link>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-semibold">{task.title}</h1>
          <Badge value={task.status} label={STATUS_LABELS[task.status]} />
          <Badge value={task.priority} kind="priority" label={PRIORITY_LABELS[task.priority]} />
          {overdue && <span className="text-xs font-medium text-red-600">Overdue</span>}
        </div>
        {task.description && <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{task.description}</p>}
      </div>

      <Card>
        <div className="flex flex-wrap gap-x-6 gap-y-1.5 text-sm">
          <span>
            <span className="text-gray-400">Owner </span>
            {task.owner.name ?? task.owner.email}
          </span>
          <span>
            <span className="text-gray-400">Reviewer </span>
            {task.reviewer.name ?? task.reviewer.email}
          </span>
          <span>
            <span className="text-gray-400">Due </span>
            {formatDate(task.dueDate)}
          </span>
          {(task.estimatedHours != null || task.actualHours != null) && (
            <span>
              <span className="text-gray-400">Hours </span>
              {task.estimatedHours ?? '—'}h est · {task.actualHours ?? '—'}h actual
            </span>
          )}
        </div>
      </Card>

      {(task.acceptanceCriteria || task.definitionOfDone) && (
        <Disclosure label="Show acceptance criteria & definition of done" openLabel="Hide">
          <div className="space-y-4 pt-1">
            {task.acceptanceCriteria && (
              <Card>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Acceptance Criteria</p>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{task.acceptanceCriteria}</p>
              </Card>
            )}
            {task.definitionOfDone && (
              <Card>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Definition of Done</p>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{task.definitionOfDone}</p>
              </Card>
            )}
          </div>
        </Disclosure>
      )}

      {isReviewer && task.status === 'READY_FOR_REVIEW' && <ReviewPanel taskId={task.id} />}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div>
          <h2 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-200">Status</h2>
          <Card>
            {isOwnerOrManager ? (
              <StatusControl taskId={task.id} status={task.status} deliverableCount={task.deliverables.length} />
            ) : (
              <p className="text-sm text-gray-500">Only the owner or a manager can update status.</p>
            )}
          </Card>
        </div>
        <div>
          <h2 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-200">Deliverables</h2>
          <Card className="space-y-3">
            {task.deliverables.length === 0 && <p className="text-sm text-gray-400">No deliverables attached yet.</p>}
            {task.deliverables.map((d) => (
              <a
                key={d.id}
                href={d.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between rounded-card border border-gray-100 px-3 py-2 text-sm hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800"
              >
                <span className="truncate">
                  <span className="mr-2 text-xs text-gray-400">v{d.version}</span>
                  {d.type.replaceAll('_', ' ')}
                </span>
                <span className="text-xs text-gray-400">{d.submittedBy.name ?? d.submittedBy.email}</span>
              </a>
            ))}
            {isOwnerOrManager && task.status !== 'APPROVED' && <DeliverableForm taskId={task.id} />}
          </Card>
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-200">Review History</h2>
        {task.reviewActions.length === 0 ? (
          <p className="text-sm text-gray-400">No review actions yet.</p>
        ) : (
          <div className="space-y-2">
            {task.reviewActions.map((r) => (
              <Card key={r.id} className="py-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {r.reviewer.name ?? r.reviewer.email} — {r.action.replaceAll('_', ' ')}
                  </span>
                  <span className="text-xs text-gray-400">{formatDateTime(r.createdAt)}</span>
                </div>
                {r.comment && <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{r.comment}</p>}
              </Card>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-200">Comments</h2>
        <Card>
          <CommentsThread
            taskId={task.id}
            comments={task.comments.map((c) => ({
              id: c.id,
              body: c.body,
              createdAt: c.createdAt.toISOString(),
              author: { name: c.author.name, email: c.author.email },
            }))}
          />
        </Card>
      </div>
    </div>
  );
}
