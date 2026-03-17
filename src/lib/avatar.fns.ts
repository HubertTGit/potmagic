import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { eq } from 'drizzle-orm'
import { put } from '@vercel/blob'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { db } from '@/db'
import { users } from '@/db/schema'

export const uploadAvatar = createServerFn({ method: 'POST' })
  .inputValidator((input) =>
    z
      .object({
        base64: z.string(),
        mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
        fileName: z.string(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const session = await auth.api.getSession({ headers: getRequest().headers })
    if (!session) throw new Error('Unauthorized')

    const buffer = Buffer.from(data.base64, 'base64')

    const blob = await put(`avatars/${session.user.id}/${data.fileName}`, buffer, {
      access: 'public',
      contentType: data.mimeType,
      allowOverwrite: true,
    })

    await db
      .update(users)
      .set({ image: blob.url })
      .where(eq(users.id, session.user.id))

    return { url: blob.url }
  })
