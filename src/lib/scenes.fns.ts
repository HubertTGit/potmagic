import { createServerFn } from '@tanstack/react-start';
import { getRequest } from '@tanstack/react-start/server';
import { and, asc, eq, sql, or, isNull } from 'drizzle-orm';
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
        backgroundId: scenes.backgroundId,
      })
      .from(scenes)
      .where(eq(scenes.id, data.sceneId));

    if (!scene) throw new Error('Scene not found');

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
      .where(or(eq(props.storyId, data.storyId), isNull(props.storyId)));

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

    const [backgroundProp] = scene.backgroundId
      ? await db
          .select({
            id: props.id,
            name: props.name,
            imageUrl: props.imageUrl,
            type: props.type,
          })
          .from(props)
          .where(eq(props.id, scene.backgroundId))
      : [null];

    return {
      scene,
      story: story ?? null,
      props: storyProps,
      storyCast,
      sceneCastIds: [...sceneCastIds],
      background: backgroundProp ?? null,
    };
  });

export const assignSceneBackground = createServerFn({ method: 'POST' })
  .inputValidator(
    (input: unknown) => input as { sceneId: string; backgroundId: string | null },
  )
  .handler(async ({ data }) => {
    await requireDirector();
    await db
      .update(scenes)
      .set({ backgroundId: data.backgroundId })
      .where(eq(scenes.id, data.sceneId));
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
      .select({
        directorId: stories.directorId,
        directorName: users.name,
        status: stories.status,
      })
      .from(stories)
      .innerJoin(users, eq(stories.directorId, users.id))
      .where(eq(stories.id, sceneRow.storyId));

    const [sceneWithBg] = await db
      .select({
        backgroundId: scenes.backgroundId,
        backgroundPosX: scenes.backgroundPosX,
        backgroundPosY: scenes.backgroundPosY,
        backgroundRotation: scenes.backgroundRotation,
        backgroundScaleX: scenes.backgroundScaleX,
      })
      .from(scenes)
      .where(eq(scenes.id, data.sceneId));

    let backgroundCast = null;
    if (sceneWithBg?.backgroundId) {
      const [bgProp] = await db
        .select({
          imageUrl: props.imageUrl,
          type: props.type,
          name: props.name,
        })
        .from(props)
        .where(eq(props.id, sceneWithBg.backgroundId));

      if (bgProp) {
        backgroundCast = {
          sceneCastId: `bg-${data.sceneId}`, // Synthetic ID
          castId: 'background',
          userId: storyRow.directorId,
          path: bgProp.imageUrl,
          type: bgProp.type,
          posX: sceneWithBg.backgroundPosX ?? 0,
          posY: sceneWithBg.backgroundPosY ?? 0,
          rotation: sceneWithBg.backgroundRotation ?? 0,
          scaleX: sceneWithBg.backgroundScaleX ?? 1,
        };
      }
    }

    const allCasts = rows.map((r) => ({
      sceneCastId: r.sceneCastId,
      castId: r.castId,
      userId: r.userId,
      path: r.path,
      type: r.type,
      posX: r.posX,
      posY: r.posY,
      rotation: r.rotation,
      scaleX: r.scaleX,
    }));

    if (backgroundCast) {
      allCasts.unshift(backgroundCast as any);
    }

    return {
      storyId: sceneRow.storyId,
      directorId: storyRow.directorId,
      directorName: storyRow.directorName ?? 'Director',
      status: storyRow.status,
      casts: allCasts,
    };
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
      all: allScenes,
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

    if (data.sceneCastId.startsWith('bg-')) {
      const sceneId = data.sceneCastId.replace('bg-', '');

      // Verify director
      const [story] = await db
        .select({ directorId: stories.directorId })
        .from(stories)
        .innerJoin(scenes, eq(scenes.storyId, stories.id))
        .where(eq(scenes.id, sceneId));

      if (story?.directorId !== session.user.id) {
        throw new Error('Forbidden');
      }

      await db
        .update(scenes)
        .set({
          backgroundPosX: data.x,
          backgroundPosY: data.y,
          backgroundRotation: data.rotation,
          backgroundScaleX: data.scaleX,
        })
        .where(eq(scenes.id, sceneId));
      return;
    }

    // Verify caller owns this sceneCast row OR is a director
    const [row] = await db
      .select({ userId: cast.userId, userRole: users.role })
      .from(sceneCast)
      .innerJoin(cast, eq(sceneCast.castId, cast.id))
      .innerJoin(users, eq(users.id, session.user.id))
      .where(eq(sceneCast.id, data.sceneCastId));

    const isOwner = row?.userId === session.user.id;
    const isDirector = row?.userRole === 'director';

    if (!row || (!isOwner && !isDirector)) {
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
