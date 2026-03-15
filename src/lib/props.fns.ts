// src/lib/props.fns.ts
import { createServerFn } from '@tanstack/react-start';
import { getRequest } from '@tanstack/react-start/server';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { props, users, cast, sceneCast, type PropType } from '@/db/schema';
import { supabase } from '@/lib/supabase.server';

const BUCKET = 'props';

// TEMPORARY: Debug storage — remove after fixing
export const debugStorage = createServerFn({ method: 'GET' })
  .handler(async () => {
    const { data: buckets } = await supabase.storage.listBuckets();
    const propsBucket = buckets?.find(b => b.name === BUCKET);

    const { data: files, error: listErr } = await supabase.storage
      .from(BUCKET)
      .list('', { limit: 10 });

    let deleteTest = null;
    if (files && files.length > 0) {
      const testFile = files[0];
      const { data: removeData, error: removeErr } = await supabase.storage
        .from(BUCKET)
        .remove([testFile.name]);

      const { data: filesAfter } = await supabase.storage
        .from(BUCKET)
        .list('', { limit: 10 });

      const stillExists = filesAfter?.find(f => f.name === testFile.name);

      deleteTest = {
        deletedFile: testFile.name,
        removeData,
        removeErr,
        stillExistsAfterDelete: !!stillExists,
      };
    }

    return {
      bucket: propsBucket,
      files: files?.map(f => f.name),
      listErr,
      deleteTest,
    };
  });

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
        // Use direct REST API — the JS client's remove() silently swallows errors
        const supabaseUrl = process.env.SUPABASE_URL!;
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
        const deleteUrl = `${supabaseUrl}/storage/v1/object/${BUCKET}`;

        const res = await fetch(deleteUrl, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${serviceKey}`,
            'Content-Type': 'application/json',
            apikey: serviceKey,
          },
          body: JSON.stringify({ prefixes: [storagePath] }),
        });

        const resBody = await res.text();
        console.log('[deleteProp] Storage DELETE status:', res.status, resBody);

        if (!res.ok) {
          throw new Error(
            `Failed to delete file from storage (${res.status}): ${resBody}`,
          );
        }
      } else {
        console.warn('[deleteProp] Could not extract storage path from URL:', row.imageUrl);
      }
    }
  });
