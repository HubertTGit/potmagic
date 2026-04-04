// src/lib/character-animal-builder.fns.ts
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { eq, and, asc, isNotNull, sql } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import {
  charactersAnimal,
  characterAnimalParts,
  props,
} from "@/db/schema";

async function getSessionOrThrow() {
  const session = await auth.api.getSession({ headers: getRequest().headers });
  if (!session) throw new Error("Unauthorized");
  return session;
}

export const listAnimals = createServerFn({ method: "GET" })
  .handler(async () => {
    const session = await getSessionOrThrow();

    return await db
      .select()
      .from(charactersAnimal)
      .where(eq(charactersAnimal.createdBy, session.user.id))
      .orderBy(asc(charactersAnimal.createdAt));
  });

export const getAnimal = createServerFn({ method: "GET" })
  .inputValidator((input) => z.object({ characterId: z.string() }).parse(input))
  .handler(async ({ data }) => {
    const session = await getSessionOrThrow();

    const [char] = await db
      .select()
      .from(charactersAnimal)
      .where(eq(charactersAnimal.id, data.characterId));

    if (!char) throw new Error("Animal character not found");
    if (char.createdBy !== session.user.id) throw new Error("Forbidden");

    const parts = await db
      .select({
        id: characterAnimalParts.id,
        characterId: characterAnimalParts.characterId,
        partRole: characterAnimalParts.partRole,
        propId: characterAnimalParts.propId,
        pivotX: characterAnimalParts.pivotX,
        pivotY: characterAnimalParts.pivotY,
        x: characterAnimalParts.x,
        y: characterAnimalParts.y,
        zIndex: characterAnimalParts.zIndex,
        rotation: characterAnimalParts.rotation,
        imageUrl: characterAnimalParts.imageUrl,
        altImageUrl: characterAnimalParts.altImageUrl,
        altImageUrl2: characterAnimalParts.altImageUrl2,
      })
      .from(characterAnimalParts)
      .where(eq(characterAnimalParts.characterId, data.characterId))
      .orderBy(asc(characterAnimalParts.zIndex));

    return { ...char, parts };
  });

export const getAnimalByProp = createServerFn({ method: "GET" })
  .inputValidator((input) => z.object({ propId: z.string() }).parse(input))
  .handler(async ({ data }) => {
    const [char] = await db
      .select()
      .from(charactersAnimal)
      .where(eq(charactersAnimal.compositePropId, data.propId));

    if (!char) throw new Error("Animal character not found");

    const parts = await db
      .select({
        id: characterAnimalParts.id,
        characterId: characterAnimalParts.characterId,
        partRole: characterAnimalParts.partRole,
        propId: characterAnimalParts.propId,
        pivotX: characterAnimalParts.pivotX,
        pivotY: characterAnimalParts.pivotY,
        x: characterAnimalParts.x,
        y: characterAnimalParts.y,
        zIndex: characterAnimalParts.zIndex,
        rotation: characterAnimalParts.rotation,
        imageUrl: characterAnimalParts.imageUrl,
        altImageUrl: characterAnimalParts.altImageUrl,
        altImageUrl2: characterAnimalParts.altImageUrl2,
      })
      .from(characterAnimalParts)
      .where(eq(characterAnimalParts.characterId, char.id))
      .orderBy(asc(characterAnimalParts.zIndex));

    return { ...char, parts };
  });

export const createAnimal = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({ name: z.string().min(1) }).parse(input),
  )
  .handler(async ({ data }) => {
    const session = await getSessionOrThrow();

    const id = crypto.randomUUID();
    const [char] = await db
      .insert(charactersAnimal)
      .values({
        id,
        createdBy: session.user.id,
        name: data.name,
      })
      .returning();

    return char;
  });

export const upsertAnimalPart = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        characterId: z.string(),
        partRole: z.enum([
          "body", "head", "mouth", "eye-left", "eye-right", "pupil-left", "pupil-right",
          "eye-brow-left", "eye-brow-right",
          "arm-upper-left", "arm-forearm-left", "arm-hand-left",
          "arm-upper-right", "arm-forearm-right", "arm-hand-right",
          "torso", "neck", "tail", "leg-upper-left", "leg-lower-left", "foot-left",
          "leg-upper-right", "leg-lower-right", "foot-right"
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
      .select({ createdBy: charactersAnimal.createdBy, compositePropId: charactersAnimal.compositePropId })
      .from(charactersAnimal)
      .where(eq(charactersAnimal.id, data.characterId));
    if (!char) throw new Error("Animal character not found");
    if (char.createdBy !== session.user.id) throw new Error("Forbidden");

    const { characterId, partRole, propId, imageUrl, altImageUrl, altImageUrl2, ...values } = data;

    const payload: any = {
      ...values,
      propId: data.propId,
    };

    // Update imageUrl if provided or derived from propId
    if (data.imageUrl !== undefined || data.propId !== undefined) {
      let finalImageUrl = data.imageUrl ?? null;
      if (data.propId && data.imageUrl === undefined) {
        const [prop] = await db.select({ url: props.imageUrl }).from(props).where(eq(props.id, data.propId));
        finalImageUrl = prop?.url ?? null;
      }
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

    const id = crypto.randomUUID();
    await db
      .insert(characterAnimalParts)
      .values({
        id,
        characterId,
        partRole,
        ...payload,
      })
      .onConflictDoUpdate({
        target: [characterAnimalParts.characterId, characterAnimalParts.partRole],
        set: {
          ...payload,
        },
      });

    // Cleanup: If image URLs changed, delete the old blobs
    // (Only if they weren't linked via propId)
    // For now we'll do basic cleanup if needed, but animal fns were mostly prop-based.
    // Let's keep it simple as animal builder usage is less frequent.

    if (partRole === "head") {
      await db
        .update(charactersAnimal)
        .set({ imageUrl: payload.imageUrl ?? null })
        .where(eq(charactersAnimal.id, characterId));

      if (char.compositePropId) {
        await db
          .update(props)
          .set({ imageUrl: payload.imageUrl ?? null })
          .where(eq(props.id, char.compositePropId));
      }
    }
  });

export const updateAnimal = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({ characterId: z.string(), name: z.string().min(1) }).parse(input),
  )
  .handler(async ({ data }) => {
    const session = await getSessionOrThrow();

    const [char] = await db
      .select()
      .from(charactersAnimal)
      .where(eq(charactersAnimal.id, data.characterId));
    if (!char) throw new Error("Animal character not found");
    if (char.createdBy !== session.user.id) throw new Error("Forbidden");

    await db
      .update(charactersAnimal)
      .set({ name: data.name })
      .where(eq(charactersAnimal.id, data.characterId));

    if (char.compositePropId) {
      await db
        .update(props)
        .set({ name: data.name })
        .where(eq(props.id, char.compositePropId));
    }

    return { success: true };
  });

export const removeAnimalPart = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({ characterId: z.string(), partRole: z.string() }).parse(input),
  )
  .handler(async ({ data }) => {
    const session = await getSessionOrThrow();

    const [char] = await db
      .select({ createdBy: charactersAnimal.createdBy, compositePropId: charactersAnimal.compositePropId })
      .from(charactersAnimal)
      .where(eq(charactersAnimal.id, data.characterId));
    if (!char) throw new Error("Animal character not found");
    if (char.createdBy !== session.user.id) throw new Error("Forbidden");

    await db
      .delete(characterAnimalParts)
      .where(
        and(
          eq(characterAnimalParts.characterId, data.characterId),
          eq(characterAnimalParts.partRole, data.partRole as any),
        ),
      );

    if (data.partRole === "head") {
      await db
        .update(charactersAnimal)
        .set({ imageUrl: null })
        .where(eq(charactersAnimal.id, data.characterId));
    }
  });

export const publishAnimal = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ characterId: z.string() }).parse(input))
  .handler(async ({ data }) => {
    const session = await getSessionOrThrow();

    const [char] = await db
      .select()
      .from(charactersAnimal)
      .where(eq(charactersAnimal.id, data.characterId));
    if (!char) throw new Error("Animal character not found");
    if (char.createdBy !== session.user.id) throw new Error("Forbidden");

    const parts = await db
      .select({ imageUrl: characterAnimalParts.imageUrl, partRole: characterAnimalParts.partRole })
      .from(characterAnimalParts)
      .where(eq(characterAnimalParts.characterId, data.characterId));

    const bodyPart = parts.find(p => p.partRole === 'body');
    const headPart = parts.find(p => p.partRole === 'head');
    const thumbnail = bodyPart?.imageUrl ?? headPart?.imageUrl ?? parts[0]?.imageUrl ?? null;

    let propId = char.compositePropId;

    if (!propId) {
      propId = crypto.randomUUID();
      await db.insert(props).values({
        id: propId,
        createdBy: session.user.id,
        name: char.name,
        type: "composite-animal",
        imageUrl: thumbnail,
      });

      await db
        .update(charactersAnimal)
        .set({ compositePropId: propId })
        .where(eq(charactersAnimal.id, data.characterId));
    } else {
      await db
        .update(props)
        .set({ name: char.name, imageUrl: thumbnail })
        .where(eq(props.id, propId));
    }

    return { propId };
  });

export const deleteAnimal = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ characterId: z.string() }).parse(input))
  .handler(async ({ data }) => {
    const session = await getSessionOrThrow();

    const [char] = await db
      .select()
      .from(charactersAnimal)
      .where(eq(charactersAnimal.id, data.characterId));
    if (!char) throw new Error("Animal character not found");
    if (char.createdBy !== session.user.id) throw new Error("Forbidden");

    if (char.compositePropId) {
      const [prop] = await db.select().from(props).where(eq(props.id, char.compositePropId));
      if (prop) {
        await db.delete(props).where(eq(props.id, char.compositePropId));
        if (prop.imageUrl) {
          const { del } = await import("@vercel/blob");
          await del(prop.imageUrl).catch(() => {});
        }
      }
    }

    // Clean up character parts and their associated blobs
    const charParts = await db
      .select()
      .from(characterAnimalParts)
      .where(eq(characterAnimalParts.characterId, data.characterId));

    const { del } = await import("@vercel/blob");
    for (const part of charParts) {
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

    await db.delete(characterAnimalParts).where(eq(characterAnimalParts.characterId, data.characterId));
    await db.delete(charactersAnimal).where(eq(charactersAnimal.id, data.characterId));
  });

export const countMyPublishedAnimals = createServerFn({ method: "GET" })
  .handler(async () => {
    const session = await getSessionOrThrow();

    const [row] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(charactersAnimal)
      .where(
        and(
          eq(charactersAnimal.createdBy, session.user.id),
          isNotNull(charactersAnimal.compositePropId),
        ),
      );

    return row?.count ?? 0;
  });
