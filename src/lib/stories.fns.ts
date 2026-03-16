import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { eq, sql, inArray, asc, and } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { db } from '@/db'
import { stories, users, scenes } from '@/db/schema'

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

  return rows.map((r) => ({ ...r, scenes: scenesByStory[r.id] ?? [] }))
})

export const createStory = createServerFn({ method: 'POST' })
  .inputValidator((input: unknown) => input as { title: string })
  .handler(async ({ data }) => {
    const session = await requireDirector()

    const id = crypto.randomUUID()
    const [row] = await db
      .insert(stories)
      .values({ id, title: data.title, directorId: session.user.id, status: 'draft' })
      .returning({ id: stories.id, title: stories.title, directorId: stories.directorId, status: stories.status, createdAt: stories.createdAt })

    return { ...row, castCount: 0, sceneCount: 0 }
  })

export const deleteStory = createServerFn({ method: 'POST' })
  .inputValidator((input: unknown) => input as { id: string })
  .handler(async ({ data }) => {
    const session = await requireDirector()
    await db.delete(stories).where(and(eq(stories.id, data.id), eq(stories.directorId, session.user.id)))
  })

export const listPublicStories = createServerFn({ method: 'GET' }).handler(async () => {
  return await db
    .select({ id: stories.id, title: stories.title, status: stories.status })
    .from(stories)
    .orderBy(stories.createdAt)
})
