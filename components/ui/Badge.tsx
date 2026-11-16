import { cn } from '@/lib/utils';

const STATUS_STYLES: Record<string, string> = {
  TODO: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  IN_PROGRESS: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  BLOCKED: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  READY_FOR_REVIEW: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  CHANGES_REQUESTED: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  APPROVED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
};

const PRIORITY_STYLES: Record<string, string> = {
  LOW: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  MEDIUM: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  HIGH: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  URGENT: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
};

const STAGE_STYLES: Record<string, string> = {
  PLANNING: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  EXECUTION: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  INTERNAL_REVIEW: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  CEO_REVIEW: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  APPROVED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  COMPLETED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  PAUSED: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
  CANCELLED: 'bg-gray-100 text-gray-400 line-through dark:bg-gray-800 dark:text-gray-500',
};

export function Badge({
  value,
  label,
  kind = 'status',
  className,
}: {
  value: string;
  label?: string;
  kind?: 'status' | 'priority' | 'stage';
  className?: string;
}) {
  const styles = kind === 'priority' ? PRIORITY_STYLES : kind === 'stage' ? STAGE_STYLES : STATUS_STYLES;
  return (
    <span
      className={cn(
        'inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium',
        styles[value] ?? 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
        className
      )}
    >
      {label ?? value.replaceAll('_', ' ')}
    </span>
  );
}
