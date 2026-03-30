// src/lib/character-builder.fns.ts
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { eq, and, asc } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import {
  characters,
  characterParts,
  props,
  stories,
  cast,
  users,
} from "@/db/schema";

async function getSessionOrThrow() {
  const session = await auth.api.getSession({ headers: getRequest().headers });
  if (!session) throw new Error("Unauthorized");
  return session;
}

async function requireStoryParticipant(storyId: string) {
  const session = await getSessionOrThrow();
  const [story] = await db
    .select({ directorId: stories.directorId })
    .from(stories)
    .where(eq(stories.id, storyId));

  if (!story) throw new Error("Story not found");

  if (story.directorId === session.user.id) return session;

  const [castRecord] = await db
    .select({ id: cast.id })
    .from(cast)
    .where(and(eq(cast.storyId, storyId), eq(cast.userId, session.user.id)));

  if (!castRecord) throw new Error("Forbidden");
  return session;
}

export const listCharacters = createServerFn({ method: "GET" })
  .inputValidator((input) => z.object({ storyId: z.string() }).parse(input))
  .handler(async ({ data }) => {
    await requireStoryParticipant(data.storyId);

    return await db
      .select()
      .from(characters)
      .where(eq(characters.storyId, data.storyId))
      .orderBy(asc(characters.createdAt));
  });

export const getCharacter = createServerFn({ method: "GET" })
  .inputValidator((input) => z.object({ characterId: z.string() }).parse(input))
  .handler(async ({ data }) => {
    const [char] = await db
      .select()
      .from(characters)
      .where(eq(characters.id, data.characterId));

    if (!char) throw new Error("Character not found");
    await requireStoryParticipant(char.storyId);

    const parts = await db
      .select({
        id: characterParts.id,
        characterId: characterParts.characterId,
        partRole: characterParts.partRole,
        propId: characterParts.propId,
        altPropId: characterParts.altPropId,
        anchorX: characterParts.anchorX,
        anchorY: characterParts.anchorY,
        offsetX: characterParts.offsetX,
        offsetY: characterParts.offsetY,
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
        anchorX: characterParts.anchorX,
        anchorY: characterParts.anchorY,
        offsetX: characterParts.offsetX,
        offsetY: characterParts.offsetY,
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
    z.object({ storyId: z.string(), name: z.string().min(1) }).parse(input),
  )
  .handler(async ({ data }) => {
    const session = await requireStoryParticipant(data.storyId);

    const id = crypto.randomUUID();
    const [char] = await db
      .insert(characters)
      .values({
        id,
        storyId: data.storyId,
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
          "body", "head", "jaw", "eye-left", "eye-right", "pupil-left", "pupil-right",
          "arm-upper-left", "arm-forearm-left", "arm-hand-left",
          "arm-upper-right", "arm-forearm-right", "arm-hand-right",
          "leg-upper-left", "leg-lower-left", "leg-foot-left",
          "leg-upper-right", "leg-lower-right", "leg-foot-right",
        ]),
        propId: z.string(),
        altPropId: z.string().optional().nullable(),
        anchorX: z.number().optional(),
        anchorY: z.number().optional(),
        offsetX: z.number().optional(),
        offsetY: z.number().optional(),
        zIndex: z.number().optional(),
        rotation: z.number().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const [char] = await db
      .select({ storyId: characters.storyId })
      .from(characters)
      .where(eq(characters.id, data.characterId));
    if (!char) throw new Error("Character not found");
    await requireStoryParticipant(char.storyId);

    const id = crypto.randomUUID();
    const { characterId, partRole, propId, altPropId, ...values } = data;

    // Fetch image URLs for denormalization (user visibility request)
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
  });

export const updateCharacter = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({ characterId: z.string(), name: z.string().min(1) }).parse(input),
  )
  .handler(async ({ data }) => {
    const [char] = await db
      .select()
      .from(characters)
      .where(eq(characters.id, data.characterId));
    if (!char) throw new Error("Character not found");
    await requireStoryParticipant(char.storyId);

    // Update character name
    await db
      .update(characters)
      .set({ name: data.name })
      .where(eq(characters.id, data.characterId));

    // If it has a composite prop, update that name too
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
    const [char] = await db
      .select({ storyId: characters.storyId })
      .from(characters)
      .where(eq(characters.id, data.characterId));
    if (!char) throw new Error("Character not found");
    await requireStoryParticipant(char.storyId);

    await db
      .delete(characterParts)
      .where(
        and(
          eq(characterParts.characterId, data.characterId),
          eq(characterParts.partRole, data.partRole as any),
        ),
      );
  });

export const publishCharacter = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ characterId: z.string() }).parse(input))
  .handler(async ({ data }) => {
    const [char] = await db
      .select()
      .from(characters)
      .where(eq(characters.id, data.characterId));
    if (!char) throw new Error("Character not found");
    const session = await requireStoryParticipant(char.storyId);

    // If already published, update name if needed, but we keep the same propId
    let propId = char.compositePropId;

    if (!propId) {
      propId = crypto.randomUUID();
      await db.insert(props).values({
        id: propId,
        storyId: char.storyId,
        createdBy: session.user.id,
        name: char.name,
        type: "composite",
      });

      await db
        .update(characters)
        .set({ compositePropId: propId })
        .where(eq(characters.id, data.characterId));
    } else {
      await db
        .update(props)
        .set({ name: char.name })
        .where(eq(props.id, propId));
    }

    return { propId };
  });

export const deleteCharacter = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ characterId: z.string() }).parse(input))
  .handler(async ({ data }) => {
    const [char] = await db
      .select()
      .from(characters)
      .where(eq(characters.id, data.characterId));
    if (!char) throw new Error("Character not found");
    await requireStoryParticipant(char.storyId);

    // If it has a composite prop, delete that too
    if (char.compositePropId) {
      await db.delete(props).where(eq(props.id, char.compositePropId));
    }

    await db.delete(characters).where(eq(characters.id, data.characterId));
  });
