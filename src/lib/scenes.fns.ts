import { createServerFn } from '@tanstack/react-start';
import { getRequest } from '@tanstack/react-start/server';
import { and, asc, eq, sql, or, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { scenes, stories, props, cast, users, sceneCast, invitedActors } from '@/db/schema';
import { isDirectorOnStage } from '@/lib/livekit.fns';

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
  return session;
}

/** Verifies the caller is a director AND owns the story the given scene belongs to. */
async function requireSceneOwner(sceneId: string) {
  const session = await requireDirector();
  const [row] = await db
    .select({ directorId: stories.directorId })
    .from(scenes)
    .innerJoin(stories, eq(scenes.storyId, stories.id))
    .where(eq(scenes.id, sceneId));
  if (!row) throw new Error('Scene not found');
  if (row.directorId !== session.user.id) throw new Error('Forbidden');
  return session;
}

/** Verifies the caller is a director AND owns the story the given sceneCast belongs to. */
async function requireSceneCastOwner(sceneCastId: string) {
  const session = await requireDirector();
  const [row] = await db
    .select({ directorId: stories.directorId })
    .from(sceneCast)
    .innerJoin(scenes, eq(sceneCast.sceneId, scenes.id))
    .innerJoin(stories, eq(scenes.storyId, stories.id))
    .where(eq(sceneCast.id, sceneCastId));
  if (!row) throw new Error('Scene cast not found');
  if (row.directorId !== session.user.id) throw new Error('Forbidden');
  return session;
}

export const getSceneDetail = createServerFn({ method: 'GET' })
  .inputValidator((input) =>
    z.object({ storyId: z.string(), sceneId: z.string() }).parse(input),
  )
  .handler(async ({ data }) => {
    const session = await getSessionOrThrow();

    const [story] = await db
      .select({ directorId: stories.directorId })
      .from(stories)
      .where(eq(stories.id, data.storyId));
    if (!story) throw new Error('Story not found');

    const isDirector = story.directorId === session.user.id;
    if (!isDirector) {
      // Allow cast members of this story to view scene detail (read-only)
      const [castRecord] = await db
        .select({ id: cast.id })
        .from(cast)
        .where(and(eq(cast.storyId, data.storyId), eq(cast.userId, session.user.id)));
      if (!castRecord) throw new Error('Forbidden');
    }

    const [scene] = await db
      .select({
        id: scenes.id,
        title: scenes.title,
        order: scenes.order,
        storyId: scenes.storyId,
        backgroundId: scenes.backgroundId,
        soundId: scenes.soundId,
        soundAutoplay: scenes.soundAutoplay,
        backgroundRepeat: scenes.backgroundRepeat,
      })
      .from(scenes)
      .where(eq(scenes.id, data.sceneId));

    if (!scene) throw new Error('Scene not found');

    const [storyRow] = await db
      .select({
        id: stories.id,
        title: stories.title,
        selectedSceneId: stories.selectedSceneId,
        directorId: stories.directorId,
        livekitRoomName: stories.livekitRoomName,
        status: stories.status,
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

    // Cast members assigned to this scene, with their scene-level prop
    const assignedCast = await db
      .select({
        sceneCastId: sceneCast.id,
        id: cast.id,
        userId: cast.userId,
        userName: users.name,
        userImage: users.image,
        propId: sceneCast.propId,
        propName: props.name,
        propImageUrl: props.imageUrl,
        propType: props.type,
      })
      .from(sceneCast)
      .innerJoin(cast, eq(sceneCast.castId, cast.id))
      .innerJoin(users, eq(cast.userId, users.id))
      .leftJoin(props, eq(sceneCast.propId, props.id))
      .where(eq(sceneCast.sceneId, data.sceneId));

    // Invited actors (have a user account) not already in this scene
    const availableActors = await db
      .select({ id: users.id, name: users.name, email: users.email })
      .from(users)
      .innerJoin(invitedActors, eq(invitedActors.email, users.email))
      .where(
        sql`${users.id} not in (
          select ${cast.userId} from ${sceneCast}
          inner join ${cast} on ${sceneCast.castId} = ${cast.id}
          where ${sceneCast.sceneId} = ${data.sceneId}
        )`
      );

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

    const [soundProp] = scene.soundId
      ? await db
          .select({
            id: props.id,
            name: props.name,
            imageUrl: props.imageUrl,
            type: props.type,
          })
          .from(props)
          .where(eq(props.id, scene.soundId))
      : [null];

    const directorOnStage = storyRow
      ? storyRow.status === 'draft' || storyRow.status === 'active'
        ? await isDirectorOnStage(storyRow.id, storyRow.directorId)
        : false
      : false;

    return {
      scene,
      story: storyRow ? { ...storyRow, directorOnStage } : null,
      props: storyProps,
      assignedCast,
      availableActors,
      background: backgroundProp ?? null,
      sound: soundProp ?? null,
      soundAutoplay: scene.soundAutoplay,
      backgroundRepeat: scene.backgroundRepeat,
    };
  });

export const assignSceneSound = createServerFn({ method: 'POST' })
  .inputValidator((input) =>
    z.object({ sceneId: z.string(), soundId: z.string().nullable() }).parse(input),
  )
  .handler(async ({ data }) => {
    await requireSceneOwner(data.sceneId);
    await db
      .update(scenes)
      .set({ soundId: data.soundId })
      .where(eq(scenes.id, data.sceneId));
  });

export const setSceneSoundAutoplay = createServerFn({ method: 'POST' })
  .inputValidator((input) =>
    z.object({ sceneId: z.string(), autoplay: z.boolean() }).parse(input),
  )
  .handler(async ({ data }) => {
    await requireSceneOwner(data.sceneId);
    await db
      .update(scenes)
      .set({ soundAutoplay: data.autoplay })
      .where(eq(scenes.id, data.sceneId));
  });

export const setSceneBackgroundRepeat = createServerFn({ method: 'POST' })
  .inputValidator((input) =>
    z.object({ sceneId: z.string(), repeat: z.boolean() }).parse(input),
  )
  .handler(async ({ data }) => {
    await requireSceneOwner(data.sceneId);
    await db
      .update(scenes)
      .set({ backgroundRepeat: data.repeat })
      .where(eq(scenes.id, data.sceneId));
  });

export const assignSceneBackground = createServerFn({ method: 'POST' })
  .inputValidator((input) =>
    z.object({ sceneId: z.string(), backgroundId: z.string().nullable() }).parse(input),
  )
  .handler(async ({ data }) => {
    await requireSceneOwner(data.sceneId);
    await db
      .update(scenes)
      .set({ backgroundId: data.backgroundId })
      .where(eq(scenes.id, data.sceneId));
  });

export const addActorToScene = createServerFn({ method: 'POST' })
  .inputValidator((input) =>
    z.object({ sceneId: z.string(), userId: z.string() }).parse(input),
  )
  .handler(async ({ data }) => {
    await requireSceneOwner(data.sceneId);

    // Get storyId from scene
    const [scene] = await db
      .select({ storyId: scenes.storyId })
      .from(scenes)
      .where(eq(scenes.id, data.sceneId));

    if (!scene) throw new Error('Scene not found');

    // Upsert story cast
    const [existing] = await db
      .select({ id: cast.id })
      .from(cast)
      .where(and(eq(cast.storyId, scene.storyId), eq(cast.userId, data.userId)));

    let castId = existing?.id;
    if (!castId) {
      const [user] = await db
        .select({ name: users.name })
        .from(users)
        .where(eq(users.id, data.userId));

      castId = crypto.randomUUID();
      await db.insert(cast).values({
        id: castId,
        storyId: scene.storyId,
        userId: data.userId,
        name: user?.name ?? 'Actor',
      });
    }

    await db.insert(sceneCast).values({
      id: crypto.randomUUID(),
      sceneId: data.sceneId,
      castId,
    });
  });

export const assignSceneProp = createServerFn({ method: 'POST' })
  .inputValidator((input) =>
    z.object({ sceneCastId: z.string(), propId: z.string().nullable() }).parse(input),
  )
  .handler(async ({ data }) => {
    await requireSceneCastOwner(data.sceneCastId);
    if (data.propId) {
      const [prop] = await db.select({ type: props.type }).from(props).where(eq(props.id, data.propId));
      if (!prop || (prop.type !== 'character' && prop.type !== 'rive' && prop.type !== 'composite')) {
        throw new Error('Only characters, composite characters and rive animations can be assigned to actors');
      }
    }
    await db
      .update(sceneCast)
      .set({ propId: data.propId })
      .where(eq(sceneCast.id, data.sceneCastId));
  });

export const addSceneCast = createServerFn({ method: 'POST' })
  .inputValidator((input) =>
    z.object({ sceneId: z.string(), castId: z.string() }).parse(input),
  )
  .handler(async ({ data }) => {
    await requireSceneOwner(data.sceneId);
    await db.insert(sceneCast).values({
      id: crypto.randomUUID(),
      sceneId: data.sceneId,
      castId: data.castId,
    });
  });

export const removeSceneCast = createServerFn({ method: 'POST' })
  .inputValidator((input) =>
    z.object({ sceneId: z.string(), castId: z.string() }).parse(input),
  )
  .handler(async ({ data }) => {
    await requireSceneOwner(data.sceneId);
    await db
      .delete(sceneCast)
      .where(and(eq(sceneCast.sceneId, data.sceneId), eq(sceneCast.castId, data.castId)));
  });

export const getSceneStage = createServerFn({ method: 'GET' })
  .inputValidator((input) => z.object({ sceneId: z.string() }).parse(input))
  .handler(async ({ data }) => {
    const session = await getSessionOrThrow();

    const rows = await db
      .select({
        sceneCastId: sceneCast.id,
        castId: cast.id,
        userId: cast.userId,
        imageUrl: props.imageUrl,
        propId: props.id,
        type: props.type,
        propName: props.name,
        posX: sceneCast.posX,
        posY: sceneCast.posY,
        rotation: sceneCast.rotation,
        scaleX: sceneCast.scaleX,
      })
      .from(sceneCast)
      .innerJoin(cast, eq(sceneCast.castId, cast.id))
      .leftJoin(props, eq(sceneCast.propId, props.id))
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

    // Verify caller is the director OR a cast member of this story
    const isDirector = storyRow.directorId === session.user.id;
    if (!isDirector) {
      const [castRecord] = await db
        .select({ id: cast.id })
        .from(cast)
        .where(and(eq(cast.storyId, sceneRow.storyId), eq(cast.userId, session.user.id)));
      if (!castRecord) throw new Error('Forbidden');
    }

    const [sceneWithBg] = await db
      .select({
        backgroundId: scenes.backgroundId,
        backgroundPosX: scenes.backgroundPosX,
        backgroundPosY: scenes.backgroundPosY,
        backgroundRotation: scenes.backgroundRotation,
        backgroundScaleX: scenes.backgroundScaleX,
        soundId: scenes.soundId,
        soundAutoplay: scenes.soundAutoplay,
        backgroundRepeat: scenes.backgroundRepeat,
      })
      .from(scenes)
      .where(eq(scenes.id, data.sceneId));

    let backgroundCast = null;
    if (sceneWithBg?.backgroundId) {
      const [bgProp] = await db
        .select({
          imageUrl: props.imageUrl,
          id: props.id,
          type: props.type,
          name: props.name,
        })
        .from(props)
        .where(eq(props.id, sceneWithBg.backgroundId));

      if (bgProp) {
        backgroundCast = {
          sceneCastId: `bg-${data.sceneId}`,
          castId: 'background',
          userId: storyRow.directorId,
          path: bgProp.type === 'composite' ? bgProp.id : bgProp.imageUrl,
          type: bgProp.type,
          propName: bgProp.name,
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
      path: r.type === 'composite' ? r.propId : r.imageUrl,
      type: r.type,
      propName: r.propName,
      posX: r.posX,
      posY: r.posY,
      rotation: r.rotation,
      scaleX: r.scaleX,
    }));

    if (backgroundCast) {
      allCasts.unshift(backgroundCast as (typeof allCasts)[0]);
    }

    const [soundProp] = sceneWithBg?.soundId
      ? await db
          .select({ imageUrl: props.imageUrl, name: props.name })
          .from(props)
          .where(eq(props.id, sceneWithBg.soundId))
      : [null];

    return {
      storyId: sceneRow.storyId,
      directorId: storyRow.directorId,
      directorName: storyRow.directorName ?? 'Director',
      status: storyRow.status,
      casts: allCasts,
      soundUrl: soundProp?.imageUrl ?? null,
      soundName: soundProp?.name ?? null,
      soundAutoplay: sceneWithBg?.soundAutoplay ?? false,
      backgroundRepeat: sceneWithBg?.backgroundRepeat ?? false,
    };
  });

export const updateSceneTitle = createServerFn({ method: 'POST' })
  .inputValidator((input) =>
    z.object({ sceneId: z.string(), title: z.string().min(1).max(200) }).parse(input),
  )
  .handler(async ({ data }) => {
    await requireSceneOwner(data.sceneId);
    await db
      .update(scenes)
      .set({ title: data.title })
      .where(eq(scenes.id, data.sceneId));
  });

export const getSceneNavigation = createServerFn({ method: 'GET' })
  .inputValidator((input) => z.object({ sceneId: z.string() }).parse(input))
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
  .inputValidator((input) =>
    z.object({
      sceneCastId: z.string(),
      x: z.number(),
      y: z.number(),
      rotation: z.number(),
      scaleX: z.number(),
    }).parse(input),
  )
  .handler(async ({ data }) => {
    const session = await getSessionOrThrow();

    if (data.sceneCastId.startsWith('bg-')) {
      const sceneId = data.sceneCastId.replace('bg-', '');

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

    // Verify caller is the cast owner OR the story director (ownership-based, not just role)
    const [row] = await db
      .select({ userId: cast.userId, storyDirectorId: stories.directorId })
      .from(sceneCast)
      .innerJoin(cast, eq(sceneCast.castId, cast.id))
      .innerJoin(scenes, eq(sceneCast.sceneId, scenes.id))
      .innerJoin(stories, eq(scenes.storyId, stories.id))
      .where(eq(sceneCast.id, data.sceneCastId));

    const isOwner = row?.userId === session.user.id;
    const isStoryDirector = row?.storyDirectorId === session.user.id;

    if (!row || (!isOwner && !isStoryDirector)) {
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
