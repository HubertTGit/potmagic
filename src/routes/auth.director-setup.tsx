import { createFileRoute, redirect } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { getRequest } from '@tanstack/react-start/server';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { users } from '@/db/schema';

const promoteToDirector = createServerFn().handler(async () => {
  const session = await auth.api.getSession({ headers: getRequest().headers });
  if (!session) throw redirect({ to: '/auth' });
  await db.update(users).set({ role: 'director' }).where(eq(users.id, session.user.id));
  throw redirect({ to: '/stories' });
});

export const Route = createFileRoute('/auth/director-setup')({
  beforeLoad: () => promoteToDirector(),
  component: () => null,
});
