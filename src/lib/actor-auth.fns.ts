import { createServerFn } from '@tanstack/react-start'
import { getRequest, setCookie } from '@tanstack/react-start/server'
import { eq, and } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { db } from '@/db'
import { users, sessions, invitedActors } from '@/db/schema'

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

/**
 * Replicates better-auth/better-call's signed cookie value: `${value}.${HMAC-SHA256-base64}`.
 * h3's setCookie will URL-encode this before writing the Set-Cookie header, which is what
 * better-call's parseCookies then URL-decodes when reading back the session.
 */
async function makeSignedCookieValue(value: string, secret: string): Promise<string> {
  const secretBuf = new TextEncoder().encode(secret)
  const key = await crypto.subtle.importKey(
    'raw',
    secretBuf,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value))
  const base64Sig = btoa(String.fromCharCode(...new Uint8Array(sig)))
  // Return raw (unencoded) — h3's serialize will encodeURIComponent it
  return `${value}.${base64Sig}`
}

export const actorSignIn = createServerFn({ method: 'POST' })
  .inputValidator((input: unknown) => input as { email: string })
  .handler(async ({ data }) => {
    const email = data.email.trim().toLowerCase()

    const [invited] = await db
      .select()
      .from(invitedActors)
      .where(eq(invitedActors.email, email))
      .limit(1)

    if (!invited) throw new Error('Email not on the invited list')

    // Find or create the user
    let [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1)

    if (!user) {
      const userId = crypto.randomUUID()
      await db.insert(users).values({
        id: userId,
        email,
        name: email.split('@')[0],
        role: 'actor',
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      user = { id: userId }
    }

    // Mark as accepted on first login
    if (!invited.userId) {
      await db
        .update(invitedActors)
        .set({ userId: user.id })
        .where(eq(invitedActors.email, email))
    }

    // Create session
    const token = crypto.randomUUID()
    const sessionId = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

    await db.insert(sessions).values({
      id: sessionId,
      token,
      userId: user.id,
      expiresAt,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    // better-auth reads a signed cookie: encodeURIComponent(`${token}.${HMAC-SHA256-base64}`)
    const secret = process.env.BETTER_AUTH_SECRET!
    const signedValue = await makeSignedCookieValue(token, secret)

    setCookie('better-auth.session_token', signedValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    })

    return { success: true }
  })

export const listInvitedActors = createServerFn({ method: 'GET' })
  .handler(async () => {
    const session = await requireDirector()

    const rows = await db
      .select({
        id: invitedActors.id,
        email: invitedActors.email,
        userId: invitedActors.userId,
        createdAt: invitedActors.createdAt,
      })
      .from(invitedActors)
      .where(eq(invitedActors.addedBy, session.user.id))
      .orderBy(invitedActors.createdAt)

    return rows.map((r) => ({
      ...r,
      accepted: r.userId !== null,
    }))
  })

export const addInvitedActor = createServerFn({ method: 'POST' })
  .inputValidator((input: unknown) => input as { email: string })
  .handler(async ({ data }) => {
    const session = await requireDirector()
    const email = data.email.trim().toLowerCase()

    const [existing] = await db
      .select({ id: invitedActors.id })
      .from(invitedActors)
      .where(eq(invitedActors.email, email))
      .limit(1)

    if (existing) throw new Error('Actor already invited')

    const [row] = await db
      .insert(invitedActors)
      .values({
        id: crypto.randomUUID(),
        email,
        addedBy: session.user.id,
        createdAt: new Date(),
      })
      .returning()

    return row
  })

export const removeInvitedActor = createServerFn({ method: 'POST' })
  .inputValidator((input: unknown) => input as { id: string })
  .handler(async ({ data }) => {
    const session = await requireDirector()
    await db.delete(invitedActors).where(and(eq(invitedActors.id, data.id), eq(invitedActors.addedBy, session.user.id)))
  })
