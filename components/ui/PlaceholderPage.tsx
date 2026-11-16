export function PlaceholderPage({ title, description }: { title: string; description: string }) {
  return (
    <div className="mx-auto max-w-2xl py-16 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-card bg-brand-100 text-brand-600 dark:bg-brand-900/40 dark:text-brand-300">
        <span className="text-lg">🚧</span>
      </div>
      <h1 className="text-lg font-semibold">{title}</h1>
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{description}</p>
      <p className="mt-6 inline-block rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-500 dark:bg-gray-800 dark:text-gray-400">
        Coming in Phase 2
      </p>
    </div>
  );
}
