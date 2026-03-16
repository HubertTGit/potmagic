import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { eq, sql, inArray, and } from 'drizzle-orm'
import { z } from 'zod'
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

/** Verifies the caller is a director AND owns the given story. */
async function requireStoryOwner(storyId: string) {
  const session = await requireDirector()
  const [story] = await db
    .select({ directorId: stories.directorId })
    .from(stories)
    .where(eq(stories.id, storyId))
  if (!story) throw new Error('Story not found')
  if (story.directorId !== session.user.id) throw new Error('Forbidden')
  return session
}

/** Verifies the caller is a director AND owns the story the given cast member belongs to. */
async function requireCastOwner(castId: string) {
  const session = await requireDirector()
  const [row] = await db
    .select({ directorId: stories.directorId })
    .from(cast)
    .innerJoin(stories, eq(cast.storyId, stories.id))
    .where(eq(cast.id, castId))
  if (!row) throw new Error('Cast not found')
  if (row.directorId !== session.user.id) throw new Error('Forbidden')
  return session
}

/** Verifies the caller is a director AND owns the story the given scene belongs to. */
async function requireSceneOwnerViaStory(sceneId: string) {
  const session = await requireDirector()
  const [row] = await db
    .select({ directorId: stories.directorId })
    .from(scenes)
    .innerJoin(stories, eq(scenes.storyId, stories.id))
    .where(eq(scenes.id, sceneId))
  if (!row) throw new Error('Scene not found')
  if (row.directorId !== session.user.id) throw new Error('Forbidden')
  return session
}

export const getStoryDetail = createServerFn({ method: 'GET' })
  .inputValidator((input) => z.object({ storyId: z.string() }).parse(input))
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
  .inputValidator((input) =>
    z.object({ storyId: z.string(), status: z.enum(['draft', 'active', 'ended']) }).parse(input),
  )
  .handler(async ({ data }) => {
    await requireStoryOwner(data.storyId)
    await db.update(stories).set({ status: data.status }).where(eq(stories.id, data.storyId))
  })

export const updateStoryTitle = createServerFn({ method: 'POST' })
  .inputValidator((input) =>
    z.object({ storyId: z.string(), title: z.string().min(1).max(200) }).parse(input),
  )
  .handler(async ({ data }) => {
    await requireStoryOwner(data.storyId)
    await db.update(stories).set({ title: data.title }).where(eq(stories.id, data.storyId))
  })

export const addCast = createServerFn({ method: 'POST' })
  .inputValidator((input) =>
    z.object({ storyId: z.string(), userId: z.string() }).parse(input),
  )
  .handler(async ({ data }) => {
    await requireStoryOwner(data.storyId)

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
  .inputValidator((input) => z.object({ castId: z.string() }).parse(input))
  .handler(async ({ data }) => {
    await requireCastOwner(data.castId)
    await db.delete(sceneCast).where(eq(sceneCast.castId, data.castId))
    await db.delete(cast).where(eq(cast.id, data.castId))
  })

export const addScene = createServerFn({ method: 'POST' })
  .inputValidator((input) =>
    z.object({ storyId: z.string(), title: z.string().min(1).max(200) }).parse(input),
  )
  .handler(async ({ data }) => {
    await requireStoryOwner(data.storyId)

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
  .inputValidator((input) => z.object({ sceneId: z.string() }).parse(input))
  .handler(async ({ data }) => {
    await requireSceneOwnerViaStory(data.sceneId)
    await db.delete(scenes).where(eq(scenes.id, data.sceneId))
  })

export const reorderScenes = createServerFn({ method: 'POST' })
  .inputValidator((input) =>
    z.object({
      scenes: z.array(z.object({ id: z.string(), order: z.number().int() })),
    }).parse(input),
  )
  .handler(async ({ data }) => {
    const session = await requireDirector()
    if (data.scenes.length === 0) return

    // Verify all scene IDs belong to stories owned by this director
    const sceneIds = data.scenes.map((s) => s.id)
    const ownedRows = await db
      .select({ id: scenes.id })
      .from(scenes)
      .innerJoin(
        stories,
        and(eq(scenes.storyId, stories.id), eq(stories.directorId, session.user.id)),
      )
      .where(inArray(scenes.id, sceneIds))

    if (ownedRows.length !== sceneIds.length) throw new Error('Forbidden')

    for (const { id, order } of data.scenes) {
      await db.update(scenes).set({ order }).where(eq(scenes.id, id))
    }
  })
