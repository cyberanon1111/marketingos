import { type NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import type { Role } from '@prisma/client';

const managerEmails = (process.env.MANAGER_EMAILS ?? '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

const devLoginEnabled =
  process.env.ENABLE_DEV_LOGIN === 'true' && process.env.NODE_ENV !== 'production';

const providers: NextAuthOptions['providers'] = [];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  );
}

if (devLoginEnabled) {
  providers.push(
    CredentialsProvider({
      id: 'dev-login',
      name: 'Dev login (seeded user)',
      credentials: {
        email: { label: 'Seeded user email', type: 'text' },
      },
      async authorize(credentials) {
        const email = credentials?.email?.trim().toLowerCase();
        if (!email) return null;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return null;
        return { id: user.id, email: user.email, name: user.name, image: user.image };
      },
    })
  );
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers,
  session: { strategy: 'jwt' },
  pages: { signIn: '/signin' },
  callbacks: {
    async jwt({ token, user }) {
      const email = (user?.email ?? token.email)?.toLowerCase();
      if (email) {
        const desiredRole: Role = managerEmails.includes(email) ? 'MANAGER' : 'MEMBER';
        const dbUser = await prisma.user.upsert({
          where: { email },
          update: managerEmails.includes(email) ? { role: 'MANAGER' } : {},
          create: { email, name: user?.name ?? email, image: user?.image, role: desiredRole },
        });
        token.userId = dbUser.id;
        token.role = dbUser.role;
        token.name = dbUser.name;
        token.picture = dbUser.image;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId as string;
        session.user.role = token.role as Role;
      }
      return session;
    },
  },
};
