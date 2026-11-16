import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import SignInPanel from '@/components/layout/SignInPanel';

export default async function SignInPage() {
  const session = await getServerSession(authOptions);
  if (session) redirect('/dashboard');

  const devLoginEnabled = process.env.ENABLE_DEV_LOGIN === 'true' && process.env.NODE_ENV !== 'production';
  const googleEnabled = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

  const seededUsers = devLoginEnabled
    ? await prisma.user.findMany({ orderBy: { createdAt: 'asc' }, select: { id: true, name: true, email: true, role: true } })
    : [];

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-950">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-card bg-brand-600 text-lg font-bold text-white">
            M
          </div>
          <h1 className="text-xl font-semibold">MarketingOS</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            The operating system for the marketing department
          </p>
        </div>
        <SignInPanel googleEnabled={googleEnabled} seededUsers={seededUsers} />
      </div>
    </div>
  );
}
