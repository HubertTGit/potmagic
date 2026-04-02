// src/lib/props.fns.ts
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { put, del } from "@vercel/blob";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { props, users, type PropType } from "@/db/schema";

const ALLOWED_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/ogg",
  "audio/aac",
  "application/octet-stream", // .riv Rive animations
  "", // Fallback for browsers that don't provide a mime type for .riv
] as const;

async function getSessionOrThrow() {
  const session = await auth.api.getSession({ headers: getRequest().headers });
  if (!session) throw new Error("Unauthorized");
  return session;
}

async function requireDirector() {
  const session = await getSessionOrThrow();
  const [user] = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, session.user.id));
  if (!user || user.role !== "director") throw new Error("Forbidden");
  return session;
}

// Upload a prop file to Vercel Blob and create the DB record in one step
export const uploadProp = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        name: z.string().min(1).max(200),
        type: z.enum([
          "character",
          "background",
          "animation",
          "sound",
          "rive",
          "composite-human",
          "composite-animal",
        ]),
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
        size: z.number().int().positive().max(5242880, {
          message: "File size is too big. It should not be larger than 5MB.",
        }),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const session = await requireDirector();

    const ext = data.fileName.split(".").pop() ?? "bin";
    const path = `props/${crypto.randomUUID()}.${ext}`;

    const buffer = Buffer.from(data.base64, "base64");

    const blob = await put(path, buffer, {
      access: "public",
      contentType: data.contentType,
      allowOverwrite: false,
    });

    const id = crypto.randomUUID();
    try {
      const [row] = await db
        .insert(props)
        .values({
          id,
          createdBy: session.user.id,
          name: data.name,
          type: data.type as PropType,
          imageUrl: blob.url,
          size: data.size,
        })
        .returning();

      return row;
    } catch (error: any) {
      console.log(error);

      // Best-effort blob cleanup if DB insert fails
      await del(blob.url).catch(() => {});
      const errStr = `${error.message ?? ""} ${error.cause?.message ?? ""}`;
      if (errStr.includes("props_size_limit")) {
        throw new Error(
          "File size is too big. It should not be larger than 5MB.",
        );
      }
      throw error;
    }
  });

export const listProps = createServerFn({ method: "GET" })
  .inputValidator((input) =>
    z
      .object({
        type: z.enum([
          "character",
          "background",
          "animation",
          "sound",
          "composite-human",
          "composite-animal",
        ]),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const session = await requireDirector();

    return await db
      .select()
      .from(props)
      .where(
        and(
          eq(props.type, data.type as PropType),
          eq(props.createdBy, session.user.id),
        ),
      )
      .orderBy(props.createdAt);
  });

export const listAllProps = createServerFn({ method: "GET" }).handler(
  async () => {
    const session = await requireDirector();

    const rows = await db
      .select()
      .from(props)
      .where(eq(props.createdBy, session.user.id))
      .orderBy(props.createdAt);

    return {
      character: rows.filter((r) => r.type === "character"),
      background: rows.filter((r) => r.type === "background"),
      sound: rows.filter((r) => r.type === "sound"),
      rive: rows.filter((r) => r.type === "rive"),
      "composite-human": rows.filter((r) => r.type === "composite-human"),
      "composite-animal": rows.filter((r) => r.type === "composite-animal"),
      animation: rows.filter((r) => r.type === "animation"),
    };
  },
);

export const deleteProp = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ id: z.string() }).parse(input))
  .handler(async ({ data }) => {
    const session = await getSessionOrThrow();

    const [row] = await db
      .select()
      .from(props)
      .where(and(eq(props.id, data.id), eq(props.createdBy, session.user.id)));
    if (!row) return;

    await db.delete(props).where(eq(props.id, data.id));

    // Delete the blob using the stored URL
    if (row.imageUrl) {
      await del(row.imageUrl).catch(() => {});
    }
  });
