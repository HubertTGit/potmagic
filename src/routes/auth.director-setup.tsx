import { createFileRoute, redirect } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { getRequest } from '@tanstack/react-start/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { users } from '@/db/schema';

const promoteToDirector = createServerFn({ method: 'POST' })
  .inputValidator((input) => z.object({ token: z.string() }).parse(input))
  .handler(async ({ data }) => {
    const session = await auth.api.getSession({ headers: getRequest().headers });
    if (!session) throw redirect({ to: '/auth', search: { token: undefined } });

    // Require a valid invite token stored in the environment to prevent self-promotion
    const validToken = process.env.DIRECTOR_INVITE_TOKEN;
    if (!validToken || data.token !== validToken) {
      throw redirect({ to: '/stories' });
    }

    await db.update(users).set({ role: 'director' }).where(eq(users.id, session.user.id));
    throw redirect({ to: '/stories' });
  });

export const Route = createFileRoute('/auth/director-setup')({
  validateSearch: (search: Record<string, unknown>) => ({
    token: typeof search.token === 'string' ? search.token : '',
  }),
  beforeLoad: ({ search }) => promoteToDirector({ data: { token: search.token } }),
  component: () => null,
});
