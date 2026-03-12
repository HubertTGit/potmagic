import { createServerFn } from '@tanstack/react-start';
import { getRequest } from '@tanstack/react-start/server';
import { and, asc, eq, sql } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { scenes, stories, props, cast, users, sceneCast } from '@/db/schema';

export type StageContext = {
  storyId: string
  directorId: string
  directorName: string
}

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

export const getSceneStage = createServerFn({ method: 'GET' })
  .inputValidator((input: unknown) => input as { sceneId: string })
  .handler(async ({ data }) => {
    await getSessionOrThrow();

    const rows = await db
      .select({
        sceneCastId: sceneCast.id,
        castId: cast.id,
        userId: cast.userId,
        path: props.imageUrl,
        type: props.type,
        posX: sceneCast.posX,
        posY: sceneCast.posY,
        rotation: sceneCast.rotation,
        scaleX: sceneCast.scaleX,
      })
      .from(sceneCast)
      .innerJoin(cast, eq(sceneCast.castId, cast.id))
      .leftJoin(props, eq(cast.propId, props.id))
      .where(eq(sceneCast.sceneId, data.sceneId));

    const [sceneRow] = await db
      .select({ storyId: scenes.storyId })
      .from(scenes)
      .where(eq(scenes.id, data.sceneId))

    const [storyRow] = await db
      .select({ directorId: stories.directorId, directorName: users.name, status: stories.status })
      .from(stories)
      .innerJoin(users, eq(stories.directorId, users.id))
      .where(eq(stories.id, sceneRow.storyId))

    return {
      storyId: sceneRow.storyId,
      directorId: storyRow.directorId,
      directorName: storyRow.directorName ?? 'Director',
      status: storyRow.status,
      casts: rows.map((r) => ({
        sceneCastId: r.sceneCastId,
        castId: r.castId,
        userId: r.userId,
        path: r.path,
        type: r.type,
        posX: r.posX,
        posY: r.posY,
        rotation: r.rotation,
        scaleX: r.scaleX,
      })),
    }
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

export const getSceneNavigation = createServerFn({ method: 'GET' })
  .inputValidator((input: unknown) => input as { sceneId: string })
  .handler(async ({ data }) => {
    await getSessionOrThrow();

    const [current] = await db
      .select({ id: scenes.id, title: scenes.title, storyId: scenes.storyId })
      .from(scenes)
      .where(eq(scenes.id, data.sceneId));

    if (!current) return null;

    const allScenes = await db
      .select({ id: scenes.id, title: scenes.title })
      .from(scenes)
      .where(eq(scenes.storyId, current.storyId))
      .orderBy(asc(scenes.order), asc(scenes.id));

    const idx = allScenes.findIndex((s) => s.id === data.sceneId);

    if (idx === -1) return { current: { id: current.id, title: current.title }, prev: null, next: null };

    return {
      current: { id: current.id, title: current.title },
      prev: idx > 0 ? allScenes[idx - 1] : null,
      next: idx < allScenes.length - 1 ? allScenes[idx + 1] : null,
    };
  });

export const saveSceneCastPosition = createServerFn({ method: 'POST' })
  .inputValidator(
    (input: unknown) =>
      input as {
        sceneCastId: string
        x: number
        y: number
        rotation: number
        scaleX: number
      },
  )
  .handler(async ({ data }) => {
    const session = await getSessionOrThrow();

    // Verify caller owns this sceneCast row
    const [row] = await db
      .select({ userId: cast.userId })
      .from(sceneCast)
      .innerJoin(cast, eq(sceneCast.castId, cast.id))
      .where(eq(sceneCast.id, data.sceneCastId));

    if (!row || row.userId !== session.user.id) {
      throw new Error('Forbidden');
    }

    await db
      .update(sceneCast)
      .set({
        posX: data.x,
        posY: data.y,
        rotation: data.rotation,
        scaleX: data.scaleX,
      })
      .where(eq(sceneCast.id, data.sceneCastId));
  });
