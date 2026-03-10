import { createServerFn } from '@tanstack/react-start';
import { getRequest } from '@tanstack/react-start/server';
import { and, eq, sql } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { scenes, stories, props, cast, users, sceneCast } from '@/db/schema';

async function getSessionOrThrow() {
  const session = await auth.api.getSession({ headers: getRequest().headers });
  if (!session) throw new Error('Unauthorized');
  return session;
}

async function requireDirector() {
  const session = await getSessionOrThrow();
  const [user] = await db.select({ role: users.role }).from(users).where(eq(users.id, session.user.id));
  if (!user || user.role !== 'director') throw new Error('Forbidden');
}

export const getSceneDetail = createServerFn({ method: 'GET' })
  .inputValidator(
    (input: unknown) => input as { storyId: string; sceneId: string },
  )
  .handler(async ({ data }) => {
    await getSessionOrThrow();

    const [scene] = await db
      .select({
        id: scenes.id,
        title: scenes.title,
        order: scenes.order,
        storyId: scenes.storyId,
      })
      .from(scenes)
      .where(eq(scenes.id, data.sceneId));

    if (!scene) return null;

    const [story] = await db
      .select({
        id: stories.id,
        title: stories.title,
        totalScenes: sql<number>`(select count(*) from "scenes" where "scenes".story_id = stories.id)::int`,
      })
      .from(stories)
      .where(eq(stories.id, data.storyId));

    const storyProps = await db
      .select({
        id: props.id,
        name: props.name,
        type: props.type,
        imageUrl: props.imageUrl,
      })
      .from(props)
      .where(eq(props.storyId, data.storyId));

    const storyCast = await db
      .select({
        id: cast.id,
        userId: cast.userId,
        userName: users.name,
        propId: cast.propId,
        propName: props.name,
        propImageUrl: props.imageUrl,
        propType: props.type,
      })
      .from(cast)
      .leftJoin(users, eq(cast.userId, users.id))
      .leftJoin(props, eq(cast.propId, props.id))
      .where(eq(cast.storyId, data.storyId));

    const sceneCastRows = await db
      .select({ castId: sceneCast.castId })
      .from(sceneCast)
      .where(eq(sceneCast.sceneId, data.sceneId));

    const sceneCastIds = new Set(sceneCastRows.map((r) => r.castId));

    return { scene, story: story ?? null, props: storyProps, storyCast, sceneCastIds: [...sceneCastIds] };
  });

export const addSceneCast = createServerFn({ method: 'POST' })
  .inputValidator((input: unknown) => input as { sceneId: string; castId: string })
  .handler(async ({ data }) => {
    await requireDirector();
    await db.insert(sceneCast).values({
      id: crypto.randomUUID(),
      sceneId: data.sceneId,
      castId: data.castId,
    });
  });

export const removeSceneCast = createServerFn({ method: 'POST' })
  .inputValidator((input: unknown) => input as { sceneId: string; castId: string })
  .handler(async ({ data }) => {
    await requireDirector();
    await db
      .delete(sceneCast)
      .where(and(eq(sceneCast.sceneId, data.sceneId), eq(sceneCast.castId, data.castId)));
  });

export const updateSceneTitle = createServerFn({ method: 'POST' })
  .inputValidator(
    (input: unknown) => input as { sceneId: string; title: string },
  )
  .handler(async ({ data }) => {
    await getSessionOrThrow();
    await db
      .update(scenes)
      .set({ title: data.title })
      .where(eq(scenes.id, data.sceneId));
  });
