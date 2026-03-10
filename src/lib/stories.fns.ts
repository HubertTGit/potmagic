import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { eq, sql } from 'drizzle-orm'
import { auth } from './auth'
import { db } from '../db'
import { stories } from '../db/schema'

async function getSessionOrThrow() {
  const session = await auth.api.getSession({ headers: getRequest().headers })
  if (!session) throw new Error('Unauthorized')
  return session
}

export const listStories = createServerFn({ method: 'GET' }).handler(async () => {
  const session = await getSessionOrThrow()
  const isDirector = session.user.role === 'director'

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
        ? undefined
        : sql`stories.id in (select story_id from "cast" where user_id = ${session.user.id})`,
    )
    .orderBy(stories.createdAt)

  return rows
})

export const createStory = createServerFn({ method: 'POST' })
  .inputValidator((input: unknown) => input as { title: string })
  .handler(async ({ data }) => {
    const session = await getSessionOrThrow()
    if (session.user.role !== 'director') throw new Error('Forbidden')

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
    const session = await getSessionOrThrow()
    if (session.user.role !== 'director') throw new Error('Forbidden')

    await db.delete(stories).where(eq(stories.id, data.id))
  })
