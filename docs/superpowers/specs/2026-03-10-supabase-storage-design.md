# Supabase Storage Integration — Design Spec

**Date:** 2026-03-10
**Status:** Approved

## Overview

Add Supabase Storage to potmagic so directors can upload character and background images via the Library tab in the director dashboard. Images are stored in a Supabase bucket; public URLs are persisted in the `props` database table.

## Scope

- Directors only can upload images
- Upload target: the existing Library tab (`/director` route, "library" tab)
- Two asset types: characters and backgrounds
- Upload strategy: signed URL (Option A) — browser uploads directly to Supabase; file bytes never pass through the app server

## Upload Flow

1. Director picks a file in `LibrarySection`
2. Frontend calls `getSignedUploadUrl` server function with `{ filename, contentType }`
3. Server generates a signed PUT URL (60s TTL) via Supabase service client; returns `{ signedUrl, publicUrl }`
4. Frontend PUTs file directly to Supabase using the signed URL
5. Frontend calls `createProp({ name, type, imageUrl: publicUrl })` server function
6. DB row inserted; TanStack Query cache invalidated; grid updates

## Schema Change

`props.storyId` is currently `NOT NULL`. It must become nullable so props exist as a global director library, independent of any story.

```ts
// Before
storyId: text('story_id').notNull().references(() => stories.id, { onDelete: 'cascade' })

// After
storyId: text('story_id').references(() => stories.id, { onDelete: 'set null' })
```

A Drizzle migration is required.

## New Files

### `src/lib/supabase.server.ts`
Server-only Supabase client using service role key. Never imported from client code.

```ts
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
```

### `src/lib/props.fns.ts`
Four director-only server functions:

| Function | Input | Output |
|---|---|---|
| `getSignedUploadUrl` | `{ filename: string, contentType: string }` | `{ signedUrl: string, publicUrl: string }` |
| `createProp` | `{ name: string, type: 'character' \| 'background', imageUrl: string }` | prop row |
| `listProps` | `{ type: 'character' \| 'background' }` | prop row[] |
| `deleteProp` | `{ id: string }` | void |

`deleteProp` removes the DB row AND the file from Supabase Storage.

## Modified Files

### `src/db/schema.ts`
Make `props.storyId` nullable (see schema change above).

### `src/routes/_app/director.tsx`
- Remove `useState` for `characters` and `backgrounds`
- Add TanStack Query for each type: `queryKey: ['props', 'character']` / `['props', 'background']`
- `handleConfirm` becomes async: signed URL → PUT → createProp → invalidate query
- `onRemove` calls `deleteProp` → invalidates query
- Add uploading state for UI feedback during the two-step upload

## Supabase Bucket Setup (one-time, manual)

- Bucket name: `props`
- Visibility: **public** (images served via public URL, no auth required to read)
- File path: `{uuid}-{sanitized-filename}` (flat, no subfolders)

## Environment Variables

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Add to `.env.local`. The service role key must never be exposed to the browser.

## Out of Scope

- File size / type validation beyond `accept="image/*"` (can be added later)
- Image resizing or optimization
- Assigning props to specific stories (separate feature)
- Multiple images per prop
