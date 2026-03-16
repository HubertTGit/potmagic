import { createServerFn } from '@tanstack/react-start';
import { and, asc, eq } from 'drizzle-orm';
import { db } from '@/db';
import { cast, props, scenes, sceneCast, stories } from '@/db/schema';

export const getPublicStory = createServerFn({ method: 'GET' })
  .inputValidator((input: unknown) => input as { storyId: string })
  .handler(async ({ data }) => {
    const [story] = await db
      .select({ id: stories.id, title: stories.title, status: stories.status })
      .from(stories)
      .where(eq(stories.id, data.storyId));

    if (!story) return null;

    const [firstScene] = await db
      .select({ id: scenes.id })
      .from(scenes)
      .where(eq(scenes.storyId, data.storyId))
      .orderBy(asc(scenes.order), asc(scenes.id))
      .limit(1);

    return { ...story, firstSceneId: firstScene?.id ?? null };
  });

export const getPublicSceneStage = createServerFn({ method: 'GET' })
  .inputValidator((input: unknown) => input as { sceneId: string })
  .handler(async ({ data }) => {
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
      .leftJoin(props, eq(sceneCast.propId, props.id))
      .where(eq(sceneCast.sceneId, data.sceneId));

    const [sceneWithBg] = await db
      .select({
        backgroundId: scenes.backgroundId,
        backgroundPosX: scenes.backgroundPosX,
        backgroundPosY: scenes.backgroundPosY,
        backgroundRotation: scenes.backgroundRotation,
        backgroundScaleX: scenes.backgroundScaleX,
        storyId: scenes.storyId,
      })
      .from(scenes)
      .where(eq(scenes.id, data.sceneId));

    if (!sceneWithBg) return [];

    let backgroundCast = null;
    if (sceneWithBg.backgroundId) {
      const [bgProp] = await db
        .select({ imageUrl: props.imageUrl, type: props.type })
        .from(props)
        .where(eq(props.id, sceneWithBg.backgroundId));

      if (bgProp) {
        const [storyRow] = await db
          .select({ directorId: stories.directorId })
          .from(stories)
          .where(eq(stories.id, sceneWithBg.storyId));

        backgroundCast = {
          sceneCastId: `bg-${data.sceneId}`,
          castId: 'background',
          userId: storyRow?.directorId ?? '',
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
      allCasts.unshift(backgroundCast as (typeof allCasts)[0]);
    }

    return allCasts;
  });

export const getViewerToken = createServerFn({ method: 'GET' })
  .inputValidator((input: unknown) => input as { storyId: string })
  .handler(async ({ data }) => {
    const [story] = await db
      .select({ status: stories.status })
      .from(stories)
      .where(and(eq(stories.id, data.storyId)));

    if (!story) throw new Error('Story not found');
    if (story.status !== 'active') throw new Error('Story is not live');

    const { AccessToken } = await import('livekit-server-sdk');

    const at = new AccessToken(
      process.env.LIVEKIT_API_KEY!,
      process.env.LIVEKIT_API_SECRET!,
      {
        identity: `viewer-${crypto.randomUUID()}`,
        name: 'Viewer',
        ttl: 10800, // 3 hours
      },
    );

    at.addGrant({
      room: data.storyId,
      roomJoin: true,
      canPublish: true, // needed for microphone audio
      canSubscribe: true,
      canPublishData: false, // viewers cannot send data channel messages
    });

    return {
      token: await at.toJwt(),
      serverUrl: process.env.LIVEKIT_URL!,
    };
  });
