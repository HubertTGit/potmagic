import { createServerFn } from '@tanstack/react-start';
import { getRequest } from '@tanstack/react-start/server';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { cast, stories } from '@/db/schema';

async function getSessionOrThrow() {
  const session = await auth.api.getSession({ headers: getRequest().headers });
  if (!session) throw new Error('Unauthorized');
  return session;
}

export const getLiveKitToken = createServerFn({ method: 'GET' })
  .inputValidator((input) => z.object({ storyId: z.string() }).parse(input))
  .handler(async ({ data }) => {
    const session = await getSessionOrThrow();
    const userId = session.user.id;

    const [story] = await db
      .select({ directorId: stories.directorId, status: stories.status })
      .from(stories)
      .where(eq(stories.id, data.storyId));

    if (!story) throw new Error('Story not found');
    if (story.status === 'ended') throw new Error('Story has ended');

    const isDirector = story.directorId === userId;

    if (!isDirector) {
      const [castRecord] = await db
        .select({ id: cast.id })
        .from(cast)
        .where(and(eq(cast.storyId, data.storyId), eq(cast.userId, userId)));

      if (!castRecord)
        throw new Error('You are not in the cast for this story');
    }

    const { AccessToken } = await import('livekit-server-sdk');

    const at = new AccessToken(
      process.env.LIVEKIT_API_KEY!,
      process.env.LIVEKIT_API_SECRET!,
      {
        identity: userId,
        name: session.user.name ?? undefined,
        ttl: 43200, // 12 hours in seconds
      },
    );

    at.addGrant({
      room: data.storyId,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    return {
      token: await at.toJwt(),
      serverUrl: process.env.LIVEKIT_URL!,
    };
  });
