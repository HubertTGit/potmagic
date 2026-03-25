import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { eq, sql, inArray, asc, and } from 'drizzle-orm'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { db } from '@/db'
import { stories, users, scenes } from '@/db/schema'
import { isDirectorOnStage } from '@/lib/livekit.fns'

async function getSessionOrThrow() {
  const session = await auth.api.getSession({ headers: getRequest().headers })
  if (!session) throw new Error('Unauthorized')
  return session
}

async function requireDirector() {
  const session = await getSessionOrThrow()
  const [user] = await db.select({ role: users.role }).from(users).where(eq(users.id, session.user.id))
  if (!user || user.role !== 'director') throw new Error('Forbidden')
  return session
}

export const listStories = createServerFn({ method: 'GET' }).handler(async () => {
  const session = await getSessionOrThrow()
  const [userRow] = await db.select({ role: users.role }).from(users).where(eq(users.id, session.user.id))
  const isDirector = userRow?.role === 'director'

  const rows = await db
    .select({
      id: stories.id,
      title: stories.title,
      directorId: stories.directorId,
      status: stories.status,
      createdAt: stories.createdAt,
      castCount: sql<number>`(select count(*) from "cast" where "cast".story_id = stories.id)::int`,
      sceneCount: sql<number>`(select count(*) from "scenes" where "scenes".story_id = stories.id)::int`,
      selectedSceneId: stories.selectedSceneId,
      livekitRoomName: stories.livekitRoomName,
    })
    .from(stories)
    .where(
      isDirector
        ? eq(stories.directorId, session.user.id)
        : sql`stories.id in (select story_id from "cast" where user_id = ${session.user.id})`,
    )
    .orderBy(stories.createdAt)

  const storyIds = rows.map((r) => r.id)
  const sceneRows =
    storyIds.length > 0
      ? await db
          .select({ id: scenes.id, storyId: scenes.storyId, title: scenes.title, order: scenes.order })
          .from(scenes)
          .where(inArray(scenes.storyId, storyIds))
          .orderBy(asc(scenes.order))
      : []

  const scenesByStory = sceneRows.reduce<Record<string, typeof sceneRows>>((acc, s) => {
    if (!acc[s.storyId]) acc[s.storyId] = []
    acc[s.storyId].push(s)
    return acc
  }, {})

  const directorOnStageFlags = await Promise.all(
    rows.map((r) =>
      r.status === 'draft' || r.status === 'active'
        ? isDirectorOnStage(r.id, r.directorId)
        : Promise.resolve(false),
    ),
  )

  return rows.map((r, i) => ({ ...r, scenes: scenesByStory[r.id] ?? [], directorOnStage: directorOnStageFlags[i] }))
})

export const createStory = createServerFn({ method: 'POST' })
  .inputValidator((input) => z.object({ title: z.string().min(1).max(200) }).parse(input))
  .handler(async ({ data }) => {
    const session = await requireDirector()

    const id = crypto.randomUUID()
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    const accessPin = Array.from(crypto.getRandomValues(new Uint8Array(6)))
      .map((b) => chars[b % chars.length])
      .join('')
    const [row] = await db
      .insert(stories)
      .values({ id, title: data.title, directorId: session.user.id, status: 'draft', accessPin })
      .returning({ id: stories.id, title: stories.title, directorId: stories.directorId, status: stories.status, createdAt: stories.createdAt })

    return { ...row, castCount: 0, sceneCount: 0 }
  })

export const deleteStory = createServerFn({ method: 'POST' })
  .inputValidator((input) => z.object({ id: z.string() }).parse(input))
  .handler(async ({ data }) => {
    const session = await requireDirector()
    await db.delete(stories).where(and(eq(stories.id, data.id), eq(stories.directorId, session.user.id)))
  })

export const lookupStoryByPin = createServerFn({ method: 'POST' })
  .inputValidator((input) => z.object({ pin: z.string().length(6) }).parse(input))
  .handler(async ({ data }) => {
    const [story] = await db
      .select({ id: stories.id })
      .from(stories)
      .where(eq(stories.accessPin, data.pin.toUpperCase()))
      .limit(1)
    if (!story) throw new Error('PIN incorrect, can not find story')
    return { storyId: story.id }
  })

export const listPublicStories = createServerFn({ method: 'GET' }).handler(async () => {
  return await db
    .select({ id: stories.id, title: stories.title, status: stories.status })
    .from(stories)
    .orderBy(stories.createdAt)
})
