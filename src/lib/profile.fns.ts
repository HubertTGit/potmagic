import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { eq } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { db } from '@/db'
import { cast, stories } from '@/db/schema'

export const getIsActorInCast = createServerFn({ method: 'GET' }).handler(async () => {
  const session = await auth.api.getSession({ headers: getRequest().headers })
  if (!session) return false

  const [row] = await db
    .select({ id: cast.id })
    .from(cast)
    .where(eq(cast.userId, session.user.id))
    .limit(1)

  return !!row
})

export const getHasCreatedStories = createServerFn({ method: 'GET' }).handler(async () => {
  const session = await auth.api.getSession({ headers: getRequest().headers })
  if (!session) return false

  const [row] = await db
    .select({ id: stories.id })
    .from(stories)
    .where(eq(stories.directorId, session.user.id))
    .limit(1)

  return !!row
})
