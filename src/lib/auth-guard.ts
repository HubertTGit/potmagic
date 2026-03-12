import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { getRequest } from '@tanstack/react-start/server';
import { auth } from '@/lib/auth';

export const requireAuth = createServerFn().handler(async () => {
  const session = await auth.api.getSession({ headers: getRequest().headers });
  if (!session) throw redirect({ to: '/auth' });
});
