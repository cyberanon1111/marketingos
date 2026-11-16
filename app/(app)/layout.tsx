import { requireSession } from '@/lib/session';
import { getRecentNotifications, getUnreadCount } from '@/lib/notifications';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { CommandPalette } from '@/components/layout/CommandPalette';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  const [notifications, unreadCount] = await Promise.all([
    getRecentNotifications(session.user.id),
    getUnreadCount(session.user.id),
  ]);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          user={{ name: session.user.name ?? null, email: session.user.email ?? '', image: session.user.image ?? null, role: session.user.role }}
          notifications={notifications.map((n) => ({ ...n, createdAt: n.createdAt.toISOString() }))}
          unreadCount={unreadCount}
        />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
      <CommandPalette />
    </div>
  );
}
