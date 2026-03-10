import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { eq, sql } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { db } from '@/db'
import { stories, scenes, cast, props, users } from '@/db/schema'

async function getSessionOrThrow() {
  const session = await auth.api.getSession({ headers: getRequest().headers })
  if (!session) throw new Error('Unauthorized')
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

    const castRows = await db
      .select({
        id: cast.id,
        userId: cast.userId,
        propId: cast.propId,
        name: cast.name,
        userName: users.name,
        userEmail: users.email,
        propName: props.name,
      })
      .from(cast)
      .leftJoin(users, eq(cast.userId, users.id))
      .leftJoin(props, eq(cast.propId, props.id))
      .where(eq(cast.storyId, data.storyId))

    const sceneRows = await db
      .select({ id: scenes.id, title: scenes.title, order: scenes.order })
      .from(scenes)
      .where(eq(scenes.storyId, data.storyId))
      .orderBy(scenes.order)

    const propRows = await db
      .select({ id: props.id, name: props.name, type: props.type })
      .from(props)
      .where(eq(props.storyId, data.storyId))

    // Actors not yet assigned to any story
    const availableActors = await db
      .select({ id: users.id, name: users.name, email: users.email })
      .from(users)
      .where(sql`${users.role} = 'actor' and ${users.id} not in (select user_id from "cast")`)

    return { story, cast: castRows, scenes: sceneRows, props: propRows, availableActors }
  })

export const updateStoryStatus = createServerFn({ method: 'POST' })
  .inputValidator((input: unknown) => input as { storyId: string; status: 'draft' | 'active' | 'ended' })
  .handler(async ({ data }) => {
    const session = await getSessionOrThrow()
    if (session.user.role !== 'director') throw new Error('Forbidden')
    await db.update(stories).set({ status: data.status }).where(eq(stories.id, data.storyId))
  })

export const updateStoryTitle = createServerFn({ method: 'POST' })
  .inputValidator((input: unknown) => input as { storyId: string; title: string })
  .handler(async ({ data }) => {
    const session = await getSessionOrThrow()
    if (session.user.role !== 'director') throw new Error('Forbidden')
    await db.update(stories).set({ title: data.title }).where(eq(stories.id, data.storyId))
  })

export const addCast = createServerFn({ method: 'POST' })
  .inputValidator((input: unknown) => input as { storyId: string; userId: string })
  .handler(async ({ data }) => {
    const session = await getSessionOrThrow()
    if (session.user.role !== 'director') throw new Error('Forbidden')

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
    const session = await getSessionOrThrow()
    if (session.user.role !== 'director') throw new Error('Forbidden')
    await db.delete(cast).where(eq(cast.id, data.castId))
  })

export const addScene = createServerFn({ method: 'POST' })
  .inputValidator((input: unknown) => input as { storyId: string; title: string })
  .handler(async ({ data }) => {
    const session = await getSessionOrThrow()
    if (session.user.role !== 'director') throw new Error('Forbidden')

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
    const session = await getSessionOrThrow()
    if (session.user.role !== 'director') throw new Error('Forbidden')
    await db.delete(scenes).where(eq(scenes.id, data.sceneId))
  })
