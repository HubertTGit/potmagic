// src/lib/character-builder.fns.ts
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { eq, and, asc, isNotNull, sql } from "drizzle-orm";
import { z } from "zod";
import { put, del } from "@vercel/blob";
import { ALLOWED_MIME_TYPES } from "@/lib/props.fns";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { charactersHuman, characterHumanParts, props } from "@/db/schema";

async function getSessionOrThrow() {
  const session = await auth.api.getSession({ headers: getRequest().headers });
  if (!session) throw new Error("Unauthorized");
  if (
    session.user.subscription !== "pro" &&
    session.user.subscription !== "affiliate"
  ) {
    throw new Error("Forbidden: Subscription required");
  }
  return session;
}

export const listCharacters = createServerFn({ method: "GET" }).handler(
  async () => {
    const session = await getSessionOrThrow();

    return await db
      .select()
      .from(charactersHuman)
      .where(eq(charactersHuman.createdBy, session.user.id))
      .orderBy(asc(charactersHuman.createdAt));
  },
);

export const getCharacter = createServerFn({ method: "GET" })
  .inputValidator((input) => z.object({ characterId: z.string() }).parse(input))
  .handler(async ({ data }) => {
    const session = await getSessionOrThrow();

    const [char] = await db
      .select()
      .from(charactersHuman)
      .where(eq(charactersHuman.id, data.characterId));

    if (!char) throw new Error("Character not found");
    if (char.createdBy !== session.user.id) throw new Error("Forbidden");

    const parts = await db
      .select({
        id: characterHumanParts.id,
        characterId: characterHumanParts.characterId,
        partRole: characterHumanParts.partRole,
        propId: characterHumanParts.propId,
        pivotX: characterHumanParts.pivotX,
        pivotY: characterHumanParts.pivotY,
        x: characterHumanParts.x,
        y: characterHumanParts.y,
        zIndex: characterHumanParts.zIndex,
        rotation: characterHumanParts.rotation,
        imageUrl: characterHumanParts.imageUrl,
        altImageUrl: characterHumanParts.altImageUrl,
        altImageUrl2: characterHumanParts.altImageUrl2,
      })
      .from(characterHumanParts)
      .where(eq(characterHumanParts.characterId, data.characterId))
      .orderBy(asc(characterHumanParts.zIndex));

    return {
      ...char,
      ikLeftDirection: char.ikLeftDirection as "cw" | "ccw",
      ikRightDirection: char.ikRightDirection as "cw" | "ccw",
      parts,
    };
  });

export const getCharacterByParts = createServerFn({ method: "GET" })
  .inputValidator((input) => z.object({ propId: z.string() }).parse(input))
  .handler(async ({ data }) => {
    const [char] = await db
      .select()
      .from(charactersHuman)
      .where(eq(charactersHuman.compositePropId, data.propId));

    if (!char) throw new Error("Character not found");

    const parts = await db
      .select({
        id: characterHumanParts.id,
        characterId: characterHumanParts.characterId,
        partRole: characterHumanParts.partRole,
        propId: characterHumanParts.propId,
        pivotX: characterHumanParts.pivotX,
        pivotY: characterHumanParts.pivotY,
        x: characterHumanParts.x,
        y: characterHumanParts.y,
        zIndex: characterHumanParts.zIndex,
        rotation: characterHumanParts.rotation,
        imageUrl: characterHumanParts.imageUrl,
        altImageUrl: characterHumanParts.altImageUrl,
        altImageUrl2: characterHumanParts.altImageUrl2,
      })
      .from(characterHumanParts)
      .where(eq(characterHumanParts.characterId, char.id))
      .orderBy(asc(characterHumanParts.zIndex));

    return {
      ...char,
      ikLeftDirection: char.ikLeftDirection as "cw" | "ccw",
      ikRightDirection: char.ikRightDirection as "cw" | "ccw",
      parts,
    };
  });

export const createCharacter = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ name: z.string().min(1) }).parse(input))
  .handler(async ({ data }) => {
    const session = await getSessionOrThrow();

    const id = crypto.randomUUID();
    const [char] = await db
      .insert(charactersHuman)
      .values({
        id,
        createdBy: session.user.id,
        name: data.name,
      })
      .returning();

    return char;
  });

export const upsertCharacterPart = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        characterId: z.string(),
        partRole: z.enum([
          "body",
          "head",
          "mouth",
          "eye-left",
          "eye-right",
          "pupil-left",
          "pupil-right",
          "eye-brow-left",
          "eye-brow-right",
          "arm-upper-left",
          "arm-forearm-left",
          "arm-hand-left",
          "arm-upper-right",
          "arm-forearm-right",
          "arm-hand-right",
          "torso",
        ]),
        propId: z.string().optional().nullable(),
        imageUrl: z.string().optional().nullable(),
        altImageUrl: z.string().optional().nullable(),
        altImageUrl2: z.string().optional().nullable(),
        pivotX: z.number().optional(),
        pivotY: z.number().optional(),
        x: z.number().optional(),
        y: z.number().optional(),
        zIndex: z.number().optional(),
        rotation: z.number().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const session = await getSessionOrThrow();

    const [char] = await db
      .select({
        createdBy: charactersHuman.createdBy,
        compositePropId: charactersHuman.compositePropId,
      })
      .from(charactersHuman)
      .where(eq(charactersHuman.id, data.characterId));
    if (!char) throw new Error("Character not found");
    if (char.createdBy !== session.user.id) throw new Error("Forbidden");

    // Fetch existing part to check for old images to clean up
    const [existingPart] = await db
      .select({
        imageUrl: characterHumanParts.imageUrl,
        altImageUrl: characterHumanParts.altImageUrl,
        altImageUrl2: characterHumanParts.altImageUrl2,
        propId: characterHumanParts.propId,
      })
      .from(characterHumanParts)
      .where(
        and(
          eq(characterHumanParts.characterId, data.characterId),
          eq(characterHumanParts.partRole, data.partRole),
        ),
      );

    const id = crypto.randomUUID();
    const {
      characterId,
      partRole,
      propId,
      imageUrl,
      altImageUrl,
      altImageUrl2,
      ...values
    } = data;

    const payload: any = {
      ...values,
      propId: data.propId,
    };

    // Only update imageUrl if provided in input OR if a propId was sent (requiring derivation)
    if (data.imageUrl !== undefined || data.propId !== undefined) {
      let finalImageUrl = data.imageUrl ?? null;
      if (data.propId && data.imageUrl === undefined) {
        const [prop] = await db
          .select({ url: props.imageUrl })
          .from(props)
          .where(eq(props.id, data.propId));
        finalImageUrl = prop?.url ?? null;
      }
      // If we have a concrete value (including null), add it to payload
      if (data.imageUrl !== undefined || (data.propId && finalImageUrl !== null)) {
        payload.imageUrl = finalImageUrl;
      }
    }

    // Update altImageUrl / altImageUrl2 if provided
    if (data.altImageUrl !== undefined) {
      payload.altImageUrl = data.altImageUrl;
    }
    if (data.altImageUrl2 !== undefined) {
      payload.altImageUrl2 = data.altImageUrl2;
    }

    await db
      .insert(characterHumanParts)
      .values({
        id,
        characterId,
        partRole,
        ...payload,
      })
      .onConflictDoUpdate({
        target: [characterHumanParts.characterId, characterHumanParts.partRole],
        set: {
          ...payload,
        },
      });

    // Storage Cleanup: If image URLs changed, delete the old blobs
    // We only delete blobs if they were direct uploads (no propId)
    // because library props might be shared.
    if (existingPart) {
      if (
        payload.imageUrl !== undefined &&
        existingPart.imageUrl &&
        existingPart.imageUrl !== payload.imageUrl &&
        !existingPart.propId
      ) {
        await del(existingPart.imageUrl).catch(() => {});
      }
      if (
        payload.altImageUrl !== undefined &&
        existingPart.altImageUrl &&
        existingPart.altImageUrl !== payload.altImageUrl
      ) {
        await del(existingPart.altImageUrl).catch(() => {});
      }
      if (
        payload.altImageUrl2 !== undefined &&
        existingPart.altImageUrl2 &&
        existingPart.altImageUrl2 !== payload.altImageUrl2
      ) {
        await del(existingPart.altImageUrl2).catch(() => {});
      }
    }

    // Always update character updatedAt
    await db
      .update(charactersHuman)
      .set({ updatedAt: new Date() })
      .where(eq(charactersHuman.id, characterId));

    if (partRole === "head" && payload.imageUrl !== undefined) {
      await db
        .update(charactersHuman)
        .set({ imageUrl: payload.imageUrl })
        .where(eq(charactersHuman.id, characterId));

      if (char.compositePropId) {
        await db
          .update(props)
          .set({ imageUrl: payload.imageUrl })
          .where(eq(props.id, char.compositePropId));
      }
    }
  });

export const updateCharacter = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({ characterId: z.string(), name: z.string().min(1) }).parse(input),
  )
  .handler(async ({ data }) => {
    const session = await getSessionOrThrow();

    const [char] = await db
      .select()
      .from(charactersHuman)
      .where(eq(charactersHuman.id, data.characterId));
    if (!char) throw new Error("Character not found");
    if (char.createdBy !== session.user.id) throw new Error("Forbidden");

    await db
      .update(charactersHuman)
      .set({ name: data.name })
      .where(eq(charactersHuman.id, data.characterId));

    if (char.compositePropId) {
      await db
        .update(props)
        .set({ name: data.name })
        .where(eq(props.id, char.compositePropId));
    }

    return { success: true };
  });

export const removeCharacterPart = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({ characterId: z.string(), partRole: z.string() }).parse(input),
  )
  .handler(async ({ data }) => {
    const session = await getSessionOrThrow();

    const [char] = await db
      .select({
        createdBy: charactersHuman.createdBy,
        compositePropId: charactersHuman.compositePropId,
      })
      .from(charactersHuman)
      .where(eq(charactersHuman.id, data.characterId));
    if (!char) throw new Error("Character not found");
    if (char.createdBy !== session.user.id) throw new Error("Forbidden");

    const [part] = await db
      .select({
        propId: characterHumanParts.propId,
        imageUrl: characterHumanParts.imageUrl,
        altImageUrl: characterHumanParts.altImageUrl,
        altImageUrl2: characterHumanParts.altImageUrl2,
      })
      .from(characterHumanParts)
      .where(
        and(
          eq(characterHumanParts.characterId, data.characterId),
          eq(characterHumanParts.partRole, data.partRole as any),
        ),
      );

    if (part) {
      // 1. Clean up library props if present
      if (part.propId) {
        const [prop] = await db
          .select()
          .from(props)
          .where(eq(props.id, part.propId));
        if (prop) {
          await db.delete(props).where(eq(props.id, part.propId));
          if (prop.imageUrl) await del(prop.imageUrl).catch(() => {});
        }
      }
      // 2. Clean up direct blobs if present
      if (part.imageUrl && !part.propId) {
        await del(part.imageUrl).catch(() => {});
      }
      if (part.altImageUrl) {
        await del(part.altImageUrl).catch(() => {});
      }
      if (part.altImageUrl2) {
        await del(part.altImageUrl2).catch(() => {});
      }
    }

    await db
      .delete(characterHumanParts)
      .where(
        and(
          eq(characterHumanParts.characterId, data.characterId),
          eq(characterHumanParts.partRole, data.partRole as any),
        ),
      );

    if (data.partRole === "head") {
      await db
        .update(charactersHuman)
        .set({ imageUrl: null })
        .where(eq(charactersHuman.id, data.characterId));
    }
  });

export const publishCharacter = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ characterId: z.string() }).parse(input))
  .handler(async ({ data }) => {
    const session = await getSessionOrThrow();

    const [char] = await db
      .select()
      .from(charactersHuman)
      .where(eq(charactersHuman.id, data.characterId));
    if (!char) throw new Error("Character not found");
    if (char.createdBy !== session.user.id) throw new Error("Forbidden");

    const parts = await db
      .select({
        imageUrl: characterHumanParts.imageUrl,
        partRole: characterHumanParts.partRole,
      })
      .from(characterHumanParts)
      .where(eq(characterHumanParts.characterId, data.characterId));

    const bodyPart = parts.find((p) => p.partRole === "body");
    const headPart = parts.find((p) => p.partRole === "head");
    const thumbnail =
      bodyPart?.imageUrl ?? headPart?.imageUrl ?? parts[0]?.imageUrl ?? null;

    let propId = char.compositePropId;

    if (!propId) {
      propId = crypto.randomUUID();
      await db.insert(props).values({
        id: propId,
        createdBy: session.user.id,
        name: char.name,
        type: "composite-human",
        imageUrl: thumbnail,
      });

      await db
        .update(charactersHuman)
        .set({ compositePropId: propId })
        .where(eq(charactersHuman.id, data.characterId));
    }

    return { propId };
  });

export const updateCharacterIKDirections = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        characterId: z.string(),
        side: z.enum(["left", "right"]),
        direction: z.enum(["cw", "ccw"]),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const session = await getSessionOrThrow();

    const [char] = await db
      .select({ createdBy: charactersHuman.createdBy })
      .from(charactersHuman)
      .where(eq(charactersHuman.id, data.characterId));

    if (!char) throw new Error("Character not found");
    if (char.createdBy !== session.user.id) throw new Error("Forbidden");

    const column =
      data.side === "left" ? "ikLeftDirection" : "ikRightDirection";

    await db
      .update(charactersHuman)
      .set({ [column]: data.direction })
      .where(eq(charactersHuman.id, data.characterId));

    return { success: true };
  });

export const unpublishCharacter = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ characterId: z.string() }).parse(input))
  .handler(async ({ data }) => {
    const session = await getSessionOrThrow();

    const [char] = await db
      .select({
        createdBy: charactersHuman.createdBy,
        compositePropId: charactersHuman.compositePropId,
      })
      .from(charactersHuman)
      .where(eq(charactersHuman.id, data.characterId));

    if (!char) throw new Error("Character not found");
    if (char.createdBy !== session.user.id) throw new Error("Forbidden");

    if (char.compositePropId) {
      await db.delete(props).where(eq(props.id, char.compositePropId));

      await db
        .update(charactersHuman)
        .set({ compositePropId: null })
        .where(eq(charactersHuman.id, data.characterId));
    }

    return { success: true };
  });

export const deleteCharacter = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ characterId: z.string() }).parse(input))
  .handler(async ({ data }) => {
    const session = await getSessionOrThrow();

    const [char] = await db
      .select()
      .from(charactersHuman)
      .where(eq(charactersHuman.id, data.characterId));
    if (!char) throw new Error("Character not found");
    if (char.createdBy !== session.user.id) throw new Error("Forbidden");

    if (char.compositePropId) {
      const [prop] = await db
        .select()
        .from(props)
        .where(eq(props.id, char.compositePropId));
      if (prop) {
        await db.delete(props).where(eq(props.id, char.compositePropId));
        if (prop.imageUrl) await del(prop.imageUrl).catch(() => {});
      }
    }

    // Clean up all character parts and their associated blobs/props
    const charParts = await db
      .select()
      .from(characterHumanParts)
      .where(eq(characterHumanParts.characterId, data.characterId));

    for (const part of charParts) {
      // Clean up direct blobs
      if (part.imageUrl && !part.propId) {
        await del(part.imageUrl).catch(() => {});
      }
      if (part.altImageUrl) {
        await del(part.altImageUrl).catch(() => {});
      }
      if (part.altImageUrl2) {
        await del(part.altImageUrl2).catch(() => {});
      }
    }

    await db
      .delete(characterHumanParts)
      .where(eq(characterHumanParts.characterId, data.characterId));

    await db
      .delete(charactersHuman)
      .where(eq(charactersHuman.id, data.characterId));
  });

export const countMyPublishedCharacters = createServerFn({
  method: "GET",
}).handler(async () => {
  const session = await getSessionOrThrow();

  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(charactersHuman)
    .where(
      and(
        eq(charactersHuman.createdBy, session.user.id),
        isNotNull(charactersHuman.compositePropId),
      ),
    );

  return row?.count ?? 0;
});

// Upload a file to Vercel Blob and return only the URL (for one-off parts)
export const uploadHumanPartFile = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        fileName: z.string().min(1).max(255),
        contentType: z
          .string()
          .refine(
            (ct) =>
              ALLOWED_MIME_TYPES.includes(
                ct as (typeof ALLOWED_MIME_TYPES)[number],
              ),
            { message: "File type not allowed" },
          ),
        base64: z.string(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    await getSessionOrThrow();

    const ext = data.fileName.split(".").pop() ?? "bin";
    const path = `human-parts/${crypto.randomUUID()}.${ext}`;

    const buffer = Buffer.from(data.base64, "base64");

    const blob = await put(path, buffer, {
      access: "public",
      contentType: data.contentType,
      allowOverwrite: false,
    });

    return { url: blob.url };
  });
