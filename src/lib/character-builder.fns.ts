// src/lib/character-builder.fns.ts
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { eq, and, asc, isNotNull, sql } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import {
  characters,
  characterParts,
  props,
} from "@/db/schema";

async function getSessionOrThrow() {
  const session = await auth.api.getSession({ headers: getRequest().headers });
  if (!session) throw new Error("Unauthorized");
  return session;
}

export const listCharacters = createServerFn({ method: "GET" })
  .handler(async () => {
    const session = await getSessionOrThrow();

    return await db
      .select()
      .from(characters)
      .where(eq(characters.createdBy, session.user.id))
      .orderBy(asc(characters.createdAt));
  });

export const getCharacter = createServerFn({ method: "GET" })
  .inputValidator((input) => z.object({ characterId: z.string() }).parse(input))
  .handler(async ({ data }) => {
    const session = await getSessionOrThrow();

    const [char] = await db
      .select()
      .from(characters)
      .where(eq(characters.id, data.characterId));

    if (!char) throw new Error("Character not found");
    if (char.createdBy !== session.user.id) throw new Error("Forbidden");

    const parts = await db
      .select({
        id: characterParts.id,
        characterId: characterParts.characterId,
        partRole: characterParts.partRole,
        propId: characterParts.propId,
        altPropId: characterParts.altPropId,
        pivotX: characterParts.pivotX,
        pivotY: characterParts.pivotY,
        x: characterParts.x,
        y: characterParts.y,
        zIndex: characterParts.zIndex,
        rotation: characterParts.rotation,
        imageUrl: props.imageUrl,
      })
      .from(characterParts)
      .leftJoin(props, eq(characterParts.propId, props.id))
      .where(eq(characterParts.characterId, data.characterId))
      .orderBy(asc(characterParts.zIndex));

    // Fetch alt textures manually
    const partsWithAlt = await Promise.all(
      parts.map(async (p) => {
        if (!p.altPropId) return { ...p, altImageUrl: null };
        const [alt] = await db
          .select({ imageUrl: props.imageUrl })
          .from(props)
          .where(eq(props.id, p.altPropId));
        return { ...p, altImageUrl: alt?.imageUrl ?? null };
      }),
    );

    return { ...char, parts: partsWithAlt };
  });

export const getCharacterByProp = createServerFn({ method: "GET" })
  .inputValidator((input) => z.object({ propId: z.string() }).parse(input))
  .handler(async ({ data }) => {
    const [char] = await db
      .select()
      .from(characters)
      .where(eq(characters.compositePropId, data.propId));

    if (!char) throw new Error("Character not found");

    const parts = await db
      .select({
        id: characterParts.id,
        characterId: characterParts.characterId,
        partRole: characterParts.partRole,
        propId: characterParts.propId,
        altPropId: characterParts.altPropId,
        pivotX: characterParts.pivotX,
        pivotY: characterParts.pivotY,
        x: characterParts.x,
        y: characterParts.y,
        zIndex: characterParts.zIndex,
        rotation: characterParts.rotation,
        imageUrl: props.imageUrl,
      })
      .from(characterParts)
      .leftJoin(props, eq(characterParts.propId, props.id))
      .where(eq(characterParts.characterId, char.id))
      .orderBy(asc(characterParts.zIndex));

    // Fetch alt textures manually
    const partsWithAlt = await Promise.all(
      parts.map(async (p) => {
        if (!p.altPropId) return { ...p, altImageUrl: null };
        const [alt] = await db
          .select({ imageUrl: props.imageUrl })
          .from(props)
          .where(eq(props.id, p.altPropId));
        return { ...p, altImageUrl: alt?.imageUrl ?? null };
      }),
    );

    return { ...char, parts: partsWithAlt };
  });

export const createCharacter = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({ name: z.string().min(1) }).parse(input),
  )
  .handler(async ({ data }) => {
    const session = await getSessionOrThrow();

    const id = crypto.randomUUID();
    const [char] = await db
      .insert(characters)
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
          "body", "head", "mouth", "eye-left", "eye-right", "pupil-left", "pupil-right",
          "eye-brow-left", "eye-brow-right", "eye-closed-left", "eye-closed-right",
          "arm-upper-left", "arm-forearm-left", "arm-hand-left",
          "arm-upper-right", "arm-forearm-right", "arm-hand-right",
          "torso",
        ]),
        propId: z.string(),
        altPropId: z.string().optional().nullable(),
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
      .select({ createdBy: characters.createdBy })
      .from(characters)
      .where(eq(characters.id, data.characterId));
    if (!char) throw new Error("Character not found");
    if (char.createdBy !== session.user.id) throw new Error("Forbidden");

    const id = crypto.randomUUID();
    const { characterId, partRole, propId, altPropId, ...values } = data;

    // Fetch image URLs for denormalization
    const [prop] = await db.select({ url: props.imageUrl }).from(props).where(eq(props.id, propId));
    let altImageUrl: string | null = null;
    if (altPropId) {
      const [altProp] = await db.select({ url: props.imageUrl }).from(props).where(eq(props.id, altPropId));
      altImageUrl = altProp?.url ?? null;
    }

    const payload = {
      ...values,
      propId,
      altPropId,
      imageUrl: prop?.url ?? null,
      altImageUrl,
    };

    await db
      .insert(characterParts)
      .values({
        id,
        characterId,
        partRole,
        ...payload,
      })
      .onConflictDoUpdate({
        target: [characterParts.characterId, characterParts.partRole],
        set: {
          ...payload,
        },
      });

    if (partRole === "head") {
      await db
        .update(characters)
        .set({ imageUrl: prop?.url ?? null })
        .where(eq(characters.id, characterId));
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
      .from(characters)
      .where(eq(characters.id, data.characterId));
    if (!char) throw new Error("Character not found");
    if (char.createdBy !== session.user.id) throw new Error("Forbidden");

    await db
      .update(characters)
      .set({ name: data.name })
      .where(eq(characters.id, data.characterId));

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
      .select({ createdBy: characters.createdBy })
      .from(characters)
      .where(eq(characters.id, data.characterId));
    if (!char) throw new Error("Character not found");
    if (char.createdBy !== session.user.id) throw new Error("Forbidden");

    await db
      .delete(characterParts)
      .where(
        and(
          eq(characterParts.characterId, data.characterId),
          eq(characterParts.partRole, data.partRole as any),
        ),
      );

    if (data.partRole === "head") {
      await db
        .update(characters)
        .set({ imageUrl: null })
        .where(eq(characters.id, data.characterId));
    }
  });

export const publishCharacter = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ characterId: z.string() }).parse(input))
  .handler(async ({ data }) => {
    const session = await getSessionOrThrow();

    const [char] = await db
      .select()
      .from(characters)
      .where(eq(characters.id, data.characterId));
    if (!char) throw new Error("Character not found");
    if (char.createdBy !== session.user.id) throw new Error("Forbidden");

    const parts = await db
      .select({ imageUrl: characterParts.imageUrl, partRole: characterParts.partRole })
      .from(characterParts)
      .where(eq(characterParts.characterId, data.characterId));

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
        type: "composite",
        imageUrl: thumbnail,
      });

      await db
        .update(characters)
        .set({ compositePropId: propId })
        .where(eq(characters.id, data.characterId));
    } else {
      await db
        .update(props)
        .set({ name: char.name, imageUrl: thumbnail })
        .where(eq(props.id, propId));
    }

    return { propId };
  });

export const deleteCharacter = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ characterId: z.string() }).parse(input))
  .handler(async ({ data }) => {
    const session = await getSessionOrThrow();

    const [char] = await db
      .select()
      .from(characters)
      .where(eq(characters.id, data.characterId));
    if (!char) throw new Error("Character not found");
    if (char.createdBy !== session.user.id) throw new Error("Forbidden");

    if (char.compositePropId) {
      await db.delete(props).where(eq(props.id, char.compositePropId));
    }

    await db.delete(characters).where(eq(characters.id, data.characterId));
  });

export const countMyPublishedCharacters = createServerFn({ method: "GET" })
  .handler(async () => {
    const session = await getSessionOrThrow();

    const [row] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(characters)
      .where(
        and(
          eq(characters.createdBy, session.user.id),
          isNotNull(characters.compositePropId),
        ),
      );

    return row?.count ?? 0;
  });
