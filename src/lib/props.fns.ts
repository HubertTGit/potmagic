// src/lib/props.fns.ts
import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { eq } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { db } from '@/db'
import { props } from '@/db/schema'
import { supabase } from '@/lib/supabase.server'

const BUCKET = 'props'

async function getSessionOrThrow() {
  const session = await auth.api.getSession({ headers: getRequest().headers })
  if (!session) throw new Error('Unauthorized')
  return session
}

async function requireDirector() {
  const session = await getSessionOrThrow()
  if (session.user.role !== 'director') throw new Error('Forbidden')
  return session
}

// Returns a signed PUT URL + the future public URL for a file
export const getSignedUploadUrl = createServerFn({ method: 'POST' })
  .inputValidator((input: unknown) => input as { filename: string; contentType: string })
  .handler(async ({ data }) => {
    await requireDirector()

    const ext = data.filename.split('.').pop() ?? 'bin'
    const path = `${crypto.randomUUID()}.${ext}`

    const { data: signed, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUploadUrl(path)

    if (error || !signed) throw new Error(error?.message ?? 'Failed to create signed URL')

    const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(path)

    return { signedUrl: signed.signedUrl, publicUrl }
  })

export const createProp = createServerFn({ method: 'POST' })
  .inputValidator(
    (input: unknown) =>
      input as { name: string; type: 'character' | 'background'; imageUrl: string },
  )
  .handler(async ({ data }) => {
    await requireDirector()

    const id = crypto.randomUUID()
    const [row] = await db
      .insert(props)
      .values({ id, name: data.name, type: data.type, imageUrl: data.imageUrl })
      .returning()

    return row
  })

export const listProps = createServerFn({ method: 'GET' })
  .inputValidator((input: unknown) => input as { type: 'character' | 'background' })
  .handler(async ({ data }) => {
    await requireDirector()

    return db
      .select()
      .from(props)
      .where(eq(props.type, data.type))
      .orderBy(props.createdAt)
  })

export const deleteProp = createServerFn({ method: 'POST' })
  .inputValidator((input: unknown) => input as { id: string })
  .handler(async ({ data }) => {
    await requireDirector()

    // Fetch the row to get the imageUrl for storage deletion
    const [row] = await db.select().from(props).where(eq(props.id, data.id))
    if (!row) return

    // NOTE: The cast table has propId → props.id with onDelete: 'cascade'.
    // Deleting a prop will also delete any cast assignment referencing it.
    // This is intentional: removing a prop from the library removes it from all stories.
    await db.delete(props).where(eq(props.id, data.id))

    // Extract storage path from public URL and delete from bucket
    if (row.imageUrl) {
      const url = new URL(row.imageUrl)
      // Public URL format: .../storage/v1/object/public/{bucket}/{path}
      const pathSegments = url.pathname.split(`/object/public/${BUCKET}/`)
      const storagePath = pathSegments[1]
      if (storagePath) {
        const { error: storageError } = await supabase.storage.from(BUCKET).remove([storagePath])
        if (storageError) {
          throw new Error(`Failed to delete file from storage: ${storageError.message}`)
        }
      }
    }
  })
