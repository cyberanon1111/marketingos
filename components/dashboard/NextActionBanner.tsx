import Link from 'next/link';

type TaskRef = { id: string; title: string };

export function NextActionBanner({
  pendingReviews,
  myOverdue,
  topPriority,
}: {
  pendingReviews: TaskRef[];
  myOverdue: TaskRef[];
  topPriority: TaskRef | null;
}) {
  if (pendingReviews.length > 0) {
    return (
      <Banner
        tone="amber"
        title={
          pendingReviews.length === 1
            ? '1 task is waiting for your review'
            : `${pendingReviews.length} tasks are waiting for your review`
        }
        cta="Review now"
        href={`/tasks/${pendingReviews[0].id}`}
      />
    );
  }

  if (myOverdue.length > 0) {
    return (
      <Banner
        tone="red"
        title={myOverdue.length === 1 ? '1 of your tasks is overdue' : `${myOverdue.length} of your tasks are overdue`}
        cta="Open it"
        href={`/tasks/${myOverdue[0].id}`}
      />
    );
  }

  if (topPriority) {
    return <Banner tone="brand" title={`Next up: ${topPriority.title}`} cta="Open task" href={`/tasks/${topPriority.id}`} />;
  }

  return <Banner tone="green" title="You're all caught up — nothing urgent right now." />;
}

const TONE_STYLES = {
  amber: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/50 dark:bg-amber-900/10 dark:text-amber-300',
  red: 'border-red-200 bg-red-50 text-red-800 dark:border-red-900/50 dark:bg-red-900/10 dark:text-red-300',
  brand: 'border-brand-200 bg-brand-50 text-brand-800 dark:border-brand-900/50 dark:bg-brand-900/10 dark:text-brand-300',
  green: 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-900/10 dark:text-emerald-300',
};

function Banner({ tone, title, cta, href }: { tone: keyof typeof TONE_STYLES; title: string; cta?: string; href?: string }) {
  return (
    <div className={`flex items-center justify-between rounded-card border px-5 py-4 ${TONE_STYLES[tone]}`}>
      <p className="text-sm font-medium">{title}</p>
      {cta && href && (
        <Link
          href={href}
          className="shrink-0 rounded-card bg-white px-3 py-1.5 text-xs font-semibold shadow-sm hover:shadow dark:bg-gray-900"
        >
          {cta} →
        </Link>
      )}
    </div>
  );
}
