// src/lib/props.fns.ts
import { createServerFn } from '@tanstack/react-start';
import { getRequest } from '@tanstack/react-start/server';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { props, users, cast, sceneCast, type PropType } from '@/db/schema';
import { supabase } from '@/lib/supabase.server';

const BUCKET = 'props';

async function getSessionOrThrow() {
  const session = await auth.api.getSession({ headers: getRequest().headers });
  if (!session) throw new Error('Unauthorized');
  return session;
}

async function requireDirector() {
  const session = await getSessionOrThrow();
  const [user] = await db.select({ role: users.role }).from(users).where(eq(users.id, session.user.id));
  if (!user || user.role !== 'director') throw new Error('Forbidden');
  return session;
}

// Returns a signed PUT URL + the future public URL for a file
export const getSignedUploadUrl = createServerFn({ method: 'POST' })
  .inputValidator(
    (input: unknown) => input as { filename: string; contentType: string },
  )
  .handler(async ({ data }) => {
    await requireDirector();

    const ext = data.filename.split('.').pop() ?? 'bin';
    const path = `${crypto.randomUUID()}.${ext}`;

    const { data: signed, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUploadUrl(path);

    if (error || !signed)
      throw new Error(error?.message ?? 'Failed to create signed URL');

    const {
      data: { publicUrl },
    } = supabase.storage.from(BUCKET).getPublicUrl(path);

    return { signedUrl: signed.signedUrl, publicUrl };
  });

export const createProp = createServerFn({ method: 'POST' })
  .inputValidator(
    (input: unknown) =>
      input as {
        name: string;
        type: PropType;
        imageUrl: string;
        size: number;
      },
  )
  .handler(async ({ data }) => {
    await requireDirector();

    const id = crypto.randomUUID();
    try {
      const [row] = await db
        .insert(props)
        .values({ id, name: data.name, type: data.type, imageUrl: data.imageUrl, size: data.size })
        .returning();

      return row;
    } catch (error: any) {
      if (error.message && error.message.includes('props_size_limit')) {
        throw new Error('File size is too big. It should not be larger than 1MB.');
      }
      throw error;
    }
  });

export const listProps = createServerFn({ method: 'GET' })
  .inputValidator(
    (input: unknown) => input as { type: PropType },
  )
  .handler(async ({ data }) => {
    await requireDirector();

    return await db
      .select()
      .from(props)
      .where(eq(props.type, data.type))
      .orderBy(props.createdAt);
  });

export const deleteProp = createServerFn({ method: 'POST' })
  .inputValidator((input: unknown) => input as { id: string })
  .handler(async ({ data }) => {
    await requireDirector();

    // Fetch the row to get the imageUrl for storage deletion
    const [row] = await db.select().from(props).where(eq(props.id, data.id));
    if (!row) return;

    // Remove actor from all scenes before nulling out their prop.
    // The FK onDelete: 'set null' only clears cast.propId — scene_cast entries must be
    // cleaned up explicitly so actors without a character don't linger in scenes.
    const affectedCasts = await db
      .select({ id: cast.id })
      .from(cast)
      .where(eq(cast.propId, data.id))

    for (const c of affectedCasts) {
      await db.delete(sceneCast).where(eq(sceneCast.castId, c.id))
    }

    await db.delete(props).where(eq(props.id, data.id));

    // Extract storage path from public URL and delete from bucket
    if (row.imageUrl) {
      const url = new URL(row.imageUrl);
      // Public URL format: .../storage/v1/object/public/{bucket}/{path}
      const pathSegments = url.pathname.split(`/object/public/${BUCKET}/`);
      const storagePath = pathSegments[1]
        ? decodeURIComponent(pathSegments[1])
        : undefined;

      if (storagePath) {
        const { error: storageError } = await supabase.storage
          .from(BUCKET)
          .remove([storagePath]);

        if (storageError) {
          throw new Error(
            `Failed to delete file from storage: ${storageError.message}`,
          );
        }
      }
    }
  });
