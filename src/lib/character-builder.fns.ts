// src/lib/character-builder.fns.ts
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { eq, and, asc, isNotNull, sql } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { charactersHuman, characterHumanParts, props } from "@/db/schema";

async function getSessionOrThrow() {
  const session = await auth.api.getSession({ headers: getRequest().headers });
  if (!session) throw new Error("Unauthorized");
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
        altPropId: characterHumanParts.altPropId,
        pivotX: characterHumanParts.pivotX,
        pivotY: characterHumanParts.pivotY,
        x: characterHumanParts.x,
        y: characterHumanParts.y,
        zIndex: characterHumanParts.zIndex,
        rotation: characterHumanParts.rotation,
        imageUrl: characterHumanParts.imageUrl,
        altImageUrl: characterHumanParts.altImageUrl,
      })
      .from(characterHumanParts)
      .where(eq(characterHumanParts.characterId, data.characterId))
      .orderBy(asc(characterHumanParts.zIndex));

    return { ...char, parts };
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
        altPropId: characterHumanParts.altPropId,
        pivotX: characterHumanParts.pivotX,
        pivotY: characterHumanParts.pivotY,
        x: characterHumanParts.x,
        y: characterHumanParts.y,
        zIndex: characterHumanParts.zIndex,
        rotation: characterHumanParts.rotation,
        imageUrl: characterHumanParts.imageUrl,
        altImageUrl: characterHumanParts.altImageUrl,
      })
      .from(characterHumanParts)
      .where(eq(characterHumanParts.characterId, char.id))
      .orderBy(asc(characterHumanParts.zIndex));

    return { ...char, parts };
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
        altPropId: z.string().optional().nullable(),
        imageUrl: z.string().optional().nullable(),
        altImageUrl: z.string().optional().nullable(),
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

    const id = crypto.randomUUID();
    const {
      characterId,
      partRole,
      propId,
      altPropId,
      imageUrl,
      altImageUrl,
      ...values
    } = data;

    // Fetch image URLs for denormalization if IDs are provided
    let finalImageUrl = imageUrl ?? null;
    if (propId && !finalImageUrl) {
      const [prop] = await db
        .select({ url: props.imageUrl })
        .from(props)
        .where(eq(props.id, propId));
      finalImageUrl = prop?.url ?? null;
    }

    let finalAltImageUrl = altImageUrl ?? null;
    if (altPropId && !finalAltImageUrl) {
      const [altProp] = await db
        .select({ url: props.imageUrl })
        .from(props)
        .where(eq(props.id, altPropId));
      finalAltImageUrl = altProp?.url ?? null;
    }

    const payload = {
      ...values,
      propId,
      altPropId,
      imageUrl: finalImageUrl,
      altImageUrl: finalAltImageUrl,
    };

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

    // Always update character updatedAt
    await db
      .update(charactersHuman)
      .set({ updatedAt: new Date() })
      .where(eq(charactersHuman.id, characterId));

    if (partRole === "head") {
      await db
        .update(charactersHuman)
        .set({ imageUrl: finalImageUrl })
        .where(eq(charactersHuman.id, characterId));

      if (char.compositePropId) {
        await db
          .update(props)
          .set({ imageUrl: finalImageUrl })
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
      .from(charactersHuman)
      .where(eq(charactersHuman.id, data.characterId));
    if (!char) throw new Error("Character not found");
    if (char.createdBy !== session.user.id) throw new Error("Forbidden");

    if (char.compositePropId) {
      await db.delete(props).where(eq(props.id, char.compositePropId));
    }

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
