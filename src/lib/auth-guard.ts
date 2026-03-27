import { redirect } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { getRequest } from '@tanstack/react-start/server';
import { auth } from '@/lib/auth';

export const requireAuth = createServerFn().handler(async () => {
  const session = await auth.api.getSession({ headers: getRequest().headers });
  if (!session) throw redirect({ to: '/' as any });
  return session;
});

export const requireDirector = createServerFn().handler(async () => {
  const session = await auth.api.getSession({ headers: getRequest().headers });
  if (!session) throw redirect({ to: '/' as any });
  if (session.user.role !== 'director') throw redirect({ to: '/' as any });
  return session;
});
