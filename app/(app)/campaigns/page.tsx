import { prisma } from '@/lib/prisma';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatDate } from '@/lib/utils';

export default async function CampaignsPage() {
  const campaigns = await prisma.campaign.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      owner: true,
      _count: { select: { projects: true, tasks: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Campaigns</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Lightweight campaign tracker. Full planning, budget, and timeline tools land in Phase 2.
        </p>
      </div>

      {campaigns.length === 0 ? (
        <EmptyState title="No campaigns yet" description="Campaigns created by a manager will show up here." />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {campaigns.map((c) => (
            <Card key={c.id}>
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-medium">{c.name}</h3>
                <Badge value={c.status} />
              </div>
              {c.objective && <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">{c.objective}</p>}
              <div className="mt-4 flex flex-wrap gap-1.5">
                {c.channels.map((ch) => (
                  <span
                    key={ch}
                    className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                  >
                    {ch}
                  </span>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between text-xs text-gray-400">
                <span>{c._count.projects} projects · {c._count.tasks} tasks</span>
                <span>Launch {formatDate(c.launchDate)}</span>
              </div>
              <p className="mt-2 text-xs text-gray-400">Owner: {c.owner.name ?? c.owner.email}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
