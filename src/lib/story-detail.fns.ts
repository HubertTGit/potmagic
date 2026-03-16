import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { eq, sql } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { db } from '@/db'
import { stories, scenes, cast, users, sceneCast } from '@/db/schema'

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

export const getStoryDetail = createServerFn({ method: 'GET' })
  .inputValidator((input: unknown) => input as { storyId: string })
  .handler(async ({ data }) => {
    await getSessionOrThrow()

    const [story] = await db
      .select({ id: stories.id, title: stories.title, status: stories.status })
      .from(stories)
      .where(eq(stories.id, data.storyId))

    if (!story) return null

    const sceneRows = await db
      .select({ id: scenes.id, title: scenes.title, order: scenes.order })
      .from(scenes)
      .where(eq(scenes.storyId, data.storyId))
      .orderBy(scenes.order)

    return { story, scenes: sceneRows }
  })

export const updateStoryStatus = createServerFn({ method: 'POST' })
  .inputValidator((input: unknown) => input as { storyId: string; status: 'draft' | 'active' | 'ended' })
  .handler(async ({ data }) => {
    await getSessionOrThrow()
    await db.update(stories).set({ status: data.status }).where(eq(stories.id, data.storyId))
  })

export const updateStoryTitle = createServerFn({ method: 'POST' })
  .inputValidator((input: unknown) => input as { storyId: string; title: string })
  .handler(async ({ data }) => {
    await requireDirector()
    await db.update(stories).set({ title: data.title }).where(eq(stories.id, data.storyId))
  })

export const addCast = createServerFn({ method: 'POST' })
  .inputValidator((input: unknown) => input as { storyId: string; userId: string })
  .handler(async ({ data }) => {
    await requireDirector()

    const [user] = await db
      .select({ name: users.name })
      .from(users)
      .where(eq(users.id, data.userId))

    await db.insert(cast).values({
      id: crypto.randomUUID(),
      storyId: data.storyId,
      userId: data.userId,
      name: user?.name ?? 'Actor',
    })
  })

export const removeCast = createServerFn({ method: 'POST' })
  .inputValidator((input: unknown) => input as { castId: string })
  .handler(async ({ data }) => {
    await requireDirector()
    await db.delete(sceneCast).where(eq(sceneCast.castId, data.castId))
    await db.delete(cast).where(eq(cast.id, data.castId))
  })

export const addScene = createServerFn({ method: 'POST' })
  .inputValidator((input: unknown) => input as { storyId: string; title: string })
  .handler(async ({ data }) => {
    await requireDirector()

    const [{ maxOrder }] = await db
      .select({ maxOrder: sql<number>`cast(coalesce(max("order"), 0) as integer)` })
      .from(scenes)
      .where(eq(scenes.storyId, data.storyId))

    await db.insert(scenes).values({
      id: crypto.randomUUID(),
      storyId: data.storyId,
      title: data.title,
      order: (maxOrder ?? 0) + 1,
    })
  })

export const removeScene = createServerFn({ method: 'POST' })
  .inputValidator((input: unknown) => input as { sceneId: string })
  .handler(async ({ data }) => {
    await requireDirector()
    await db.delete(scenes).where(eq(scenes.id, data.sceneId))
  })

export const reorderScenes = createServerFn({ method: 'POST' })
  .inputValidator((input: unknown) => input as { scenes: { id: string; order: number }[] })
  .handler(async ({ data }) => {
    await requireDirector()
    for (const { id, order } of data.scenes) {
      await db.update(scenes).set({ order }).where(eq(scenes.id, id))
    }
  })
