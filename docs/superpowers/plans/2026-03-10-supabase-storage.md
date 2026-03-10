# Supabase Storage Integration Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire the director Library tab to Supabase Storage so prop images (characters + backgrounds) are uploaded to a Supabase bucket and persisted in the database.

**Architecture:** Directors upload images via a two-step signed-URL flow — the browser fetches a signed PUT URL from a server function, then uploads directly to Supabase without routing file bytes through the app server. Prop metadata (name, type, imageUrl) is saved to the `props` PostgreSQL table via a separate server function call.

**Tech Stack:** `@supabase/supabase-js`, TanStack Start `createServerFn`, Drizzle ORM (PostgreSQL), React 19, TanStack Query

---

## Chunk 1: Supabase client + schema migration

### Task 1: Install Supabase SDK

**Files:**
- Modify: `package.json` (via pnpm)

- [ ] **Step 1: Install the package**

```bash
pnpm add @supabase/supabase-js
```

Expected: package added, `pnpm-lock.yaml` updated.

- [ ] **Step 2: Verify installation**

```bash
pnpm ls @supabase/supabase-js
```

Expected: version printed (e.g. `@supabase/supabase-js 2.x.x`).

- [ ] **Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: add @supabase/supabase-js"
```

---

### Task 2: Add environment variables

**Files:**
- Modify: `.env.local`

> **Before editing**, check `.env.local` for existing Supabase keys to avoid duplicates.

- [ ] **Step 1: Add variables to `.env.local`**

Add these two lines (replace with real values from your Supabase project → Settings → API):

```
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

The service role key has full storage access and must never be sent to the browser.

- [ ] **Step 2: Verify the keys are present**

```bash
grep SUPABASE .env.local
```

Expected: both lines printed.

> No commit — `.env.local` is gitignored.

---

### Task 3: Create Supabase server client

**Files:**
- Create: `src/lib/supabase.server.ts`

This module exports a single server-side Supabase client. Import it only from server functions (files ending in `.fns.ts` or `.server.ts`).

- [ ] **Step 1: Create the file**

```ts
// src/lib/supabase.server.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars')
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey)
```

- [ ] **Step 2: TypeScript check**

```bash
pnpm build 2>&1 | head -30
```

Expected: no errors related to `supabase.server.ts`.

- [ ] **Step 3: Commit**

```bash
git add src/lib/supabase.server.ts
git commit -m "feat: add server-side Supabase client"
```

---

### Task 4: Make props.storyId nullable in schema

**Files:**
- Modify: `src/db/schema.ts`

The `props` table currently requires `storyId` (NOT NULL). Global library props have no story association yet, so this must become nullable.

- [ ] **Step 1: Update the props table definition in `src/db/schema.ts`**

Find this block:

```ts
export const props = pgTable(
  'props',
  {
    id: text('id').primaryKey(),
    storyId: text('story_id')
      .notNull()
      .references(() => stories.id, { onDelete: 'cascade' }),
```

Replace with:

```ts
export const props = pgTable(
  'props',
  {
    id: text('id').primaryKey(),
    storyId: text('story_id')
      .references(() => stories.id, { onDelete: 'set null' }),
```

- [ ] **Step 2: Generate and run a migration**

```bash
pnpm db:generate
pnpm db:migrate
```

`db:generate` creates a new SQL migration file in the `drizzle/` directory that drops the NOT NULL constraint. `db:migrate` applies it. Expected: migration file created, applied successfully with no errors.

- [ ] **Step 3: TypeScript check**

```bash
pnpm build 2>&1 | head -30
```

Expected: no type errors. (The `getSceneDetail` query in `scenes.fns.ts` filters props by `storyId` — this still works correctly since it uses `eq(props.storyId, storyId)`, which only returns rows where storyId matches.)

- [ ] **Step 4: Commit**

```bash
git add src/db/schema.ts
git commit -m "feat: make props.storyId nullable for global library"
```

---

## Chunk 2: Props server functions

### Task 5: Create props.fns.ts

**Files:**
- Create: `src/lib/props.fns.ts`

Four server functions, all director-only. Follow the same pattern as `stories.fns.ts` — use `getSessionOrThrow()` and role check.

**Supabase bucket setup (one-time manual step before testing):**
1. Go to your Supabase project dashboard → Storage
2. Create a new bucket named exactly `props`
3. Set it to **Public** (images need to be accessible via URL without auth)

- [ ] **Step 1: Create the file**

```ts
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

    // NOTE: The `cast` table has propId → props.id with onDelete: 'cascade'.
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
        await supabase.storage.from(BUCKET).remove([storagePath])
      }
    }
  })
```

- [ ] **Step 2: TypeScript check**

```bash
pnpm build 2>&1 | head -40
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/props.fns.ts
git commit -m "feat: add props server functions with Supabase Storage upload"
```

---

## Chunk 3: Wire director dashboard to real data

### Task 6: Update DirectorPage to use real props data

**Files:**
- Modify: `src/routes/_app/director.tsx`

Replace the `useState`-backed local state for characters/backgrounds with TanStack Query. Update `LibrarySection` to accept async add/remove callbacks and show upload progress.

**Key changes:**
1. Remove `useState` for `characters` and `backgrounds` in `DirectorPage`
2. Add two `useQuery` calls (one per type) using `listProps`
3. Pass `items`, `isLoading`, async `onAdd`, and `onRemove` to `LibrarySection`
4. `LibrarySection.handleConfirm` becomes async: signed URL → PUT → createProp
5. `LibrarySection.onRemove` calls `deleteProp`
6. Add `uploading` boolean state to `LibrarySection` for UI feedback

> **Preserve untouched:** The `SessionControls` function at the bottom of `director.tsx` is not modified — keep it exactly as-is.

- [ ] **Step 1: Replace the full `DirectorPage` and `LibrarySection` implementations**

Replace the `DirectorPage` function (lines ~22–148) with:

```tsx
function DirectorPage() {
  const [tab, setTab] = useState<Tab>('dashboard')

  const queryClient = useQueryClient()
  const { data: stories = [], isLoading } = useQuery({
    queryKey: ['stories'],
    queryFn: () => listStories(),
  })

  const statusMutation = useMutation({
    mutationFn: ({ storyId, status }: { storyId: string; status: 'draft' | 'active' | 'ended' }) =>
      updateStoryStatus({ data: { storyId, status } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['stories'] }),
  })

  const { data: characters = [], isLoading: loadingChars } = useQuery({
    queryKey: ['props', 'character'],
    queryFn: () => listProps({ data: { type: 'character' } }),
    enabled: tab === 'library',
  })

  const { data: backgrounds = [], isLoading: loadingBgs } = useQuery({
    queryKey: ['props', 'background'],
    queryFn: () => listProps({ data: { type: 'background' } }),
    enabled: tab === 'library',
  })

  const active = stories.filter((s) => s.status === 'active')
  const draft = stories.filter((s) => s.status === 'draft')
  const ended = stories.filter((s) => s.status === 'ended')

  const handleAddProp = async (type: 'character' | 'background', file: File, name: string) => {
    const { signedUrl, publicUrl } = await getSignedUploadUrl({
      data: { filename: file.name, contentType: file.type },
    })

    await fetch(signedUrl, {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': file.type },
    })

    await createProp({ data: { name, type, imageUrl: publicUrl } })
    queryClient.invalidateQueries({ queryKey: ['props', type] })
  }

  const handleRemoveProp = async (type: 'character' | 'background', id: string) => {
    await deleteProp({ data: { id } })
    queryClient.invalidateQueries({ queryKey: ['props', type] })
  }

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-2xl font-semibold mb-2">Director</h1>
      <p className="text-sm text-base-content/40 mb-6">Manage sessions and story status.</p>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-base-300 mb-8">
        {(['dashboard', 'library'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'px-4 py-2 text-sm font-medium capitalize tracking-wide border-b-2 -mb-px transition-colors',
              tab === t
                ? 'border-gold text-base-content'
                : 'border-transparent text-base-content/40 hover:text-base-content/70',
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'dashboard' && (
        <>
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-4 mb-10">
            {[
              { label: 'Active', count: active.length, color: 'text-success' },
              { label: 'Draft', count: draft.length, color: 'text-base-content/60' },
              { label: 'Ended', count: ended.length, color: 'text-base-content/30' },
            ].map(({ label, count, color }) => (
              <div key={label} className="bg-base-200 border border-base-300 rounded-xl px-5 py-4">
                <p className={cn('text-3xl font-bold font-display', color)}>{count}</p>
                <p className="text-xs text-base-content/40 uppercase tracking-widest mt-1">{label}</p>
              </div>
            ))}
          </div>

          {/* Stories table */}
          {isLoading ? (
            <p className="text-sm text-base-content/40">Loading…</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="table table-sm w-full">
                <thead>
                  <tr className="text-base-content/50 text-xs uppercase tracking-wider">
                    <th>Story</th>
                    <th>Cast</th>
                    <th>Status</th>
                    <th>Session</th>
                  </tr>
                </thead>
                <tbody>
                  {stories.map((story) => (
                    <tr key={story.id} className="hover:bg-base-200 transition-colors">
                      <td>
                        <Link
                          to="/stories/$storyId"
                          params={{ storyId: story.id }}
                          className="font-medium hover:text-gold transition-colors"
                        >
                          {story.title}
                        </Link>
                      </td>
                      <td className="text-base-content/50">{story.castCount}</td>
                      <td>
                        <StatusBadge status={story.status} />
                      </td>
                      <td>
                        <SessionControls
                          story={story}
                          onSetStatus={(id, status) => statusMutation.mutate({ storyId: id, status })}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {tab === 'library' && (
        <>
          <p className="text-sm text-base-content/40 mb-6">
            Upload characters and backgrounds available across stories.
          </p>
          <div className="flex flex-col gap-8">
            <LibrarySection
              label="Characters"
              type="character"
              items={characters}
              isLoading={loadingChars}
              onAdd={(file, name) => handleAddProp('character', file, name)}
              onRemove={(id) => handleRemoveProp('character', id)}
            />
            <LibrarySection
              label="Backgrounds"
              type="background"
              items={backgrounds}
              isLoading={loadingBgs}
              onAdd={(file, name) => handleAddProp('background', file, name)}
              onRemove={(id) => handleRemoveProp('background', id)}
            />
          </div>
        </>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Replace the `LibrarySection` component and its props interface**

Replace the `LibraryItem` interface and `LibrarySection` function:

```tsx
interface LibraryItem {
  id: string
  name: string
  imageUrl: string | null
}

function LibrarySection({
  label,
  type,
  items,
  isLoading,
  onAdd,
  onRemove,
}: {
  label: string
  type: 'character' | 'background'
  items: LibraryItem[]
  isLoading: boolean
  onAdd: (file: File, name: string) => Promise<void>
  onRemove: (id: string) => Promise<void>
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [pending, setPending] = useState<{ preview: string; file: File; name: string } | null>(null)
  const [uploading, setUploading] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const preview = URL.createObjectURL(file)
    const defaultName = file.name.replace(/\.[^.]+$/, '')
    setPending({ preview, file, name: defaultName })
    e.target.value = ''
  }

  const handleConfirm = async () => {
    if (!pending || !pending.name.trim() || uploading) return
    setUploading(true)
    try {
      await onAdd(pending.file, pending.name.trim())
      URL.revokeObjectURL(pending.preview)
      setPending(null)
    } finally {
      setUploading(false)
    }
  }

  const handleCancel = () => {
    if (pending) URL.revokeObjectURL(pending.preview)
    setPending(null)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-base-content/40">
          {label} <span className="text-base-content/25">({items.length})</span>
        </h3>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="btn btn-xs btn-gold font-display tracking-wide"
        >
          + Upload
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* Pending upload — name confirmation */}
      {pending && (
        <div className="flex items-center gap-3 bg-base-200 border border-gold/30 rounded-xl p-3 mb-4">
          <img
            src={pending.preview}
            alt=""
            className="size-14 rounded-lg object-cover shrink-0 bg-base-300"
          />
          <input
            autoFocus
            type="text"
            value={pending.name}
            onChange={(e) => setPending((p) => p && { ...p, name: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleConfirm()
              if (e.key === 'Escape') handleCancel()
            }}
            placeholder="Name…"
            className="input input-sm flex-1 bg-base-300 border-base-300 text-sm focus:border-gold/60"
            disabled={uploading}
          />
          <button
            onClick={handleConfirm}
            disabled={uploading}
            className="btn btn-sm btn-gold font-display"
          >
            {uploading ? 'Uploading…' : 'Add'}
          </button>
          <button
            onClick={handleCancel}
            disabled={uploading}
            className="btn btn-sm btn-ghost text-base-content/40"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <p className="text-sm text-base-content/40 py-4">Loading…</p>
      )}

      {/* Grid */}
      {!isLoading && items.length === 0 && !pending ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="flex flex-col items-center justify-center gap-2 border border-dashed border-base-300 rounded-xl py-8 text-base-content/25 cursor-pointer hover:border-gold/30 hover:text-base-content/40 transition-colors"
        >
          <PhotoIcon className="size-7" />
          <span className="text-xs">Upload your first {label.toLowerCase().slice(0, -1)}</span>
        </div>
      ) : !isLoading ? (
        <div className="grid grid-cols-4 gap-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="group relative rounded-xl overflow-hidden bg-base-200 border border-base-300 aspect-square"
            >
              {item.imageUrl && (
                <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
              )}
              <div className="absolute inset-0 bg-base-100/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 p-2">
                <span className="text-xs font-medium text-center leading-tight line-clamp-2">
                  {item.name}
                </span>
                <button
                  onClick={() => onRemove(item.id)}
                  className="text-error/70 hover:text-error transition-colors"
                >
                  <XMarkIcon className="size-4" />
                </button>
              </div>
              <p className="absolute bottom-0 inset-x-0 text-xs text-center bg-base-300/80 px-1 py-0.5 truncate group-hover:opacity-0 transition-opacity">
                {item.name}
              </p>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}
```

- [ ] **Step 3: Ensure the full import block at the top of `director.tsx` is exactly:**

```tsx
import { createFileRoute, Link } from '@tanstack/react-router'
import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { listStories } from '@/lib/stories.fns'
import { updateStoryStatus } from '@/lib/story-detail.fns'
import { getSignedUploadUrl, createProp, listProps, deleteProp } from '@/lib/props.fns'
import { StatusBadge } from '@/components/status-badge.component'
import { cn } from '@/lib/cn'
import { PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline'
```

- [ ] **Step 4: TypeScript check**

```bash
pnpm build 2>&1 | head -50
```

Expected: no type errors. Fix any TS issues before committing.

- [ ] **Step 5: Commit**

```bash
git add src/routes/_app/director.tsx
git commit -m "feat: wire director library tab to Supabase Storage and database"
```

---

## Chunk 4: Verification

### Task 7: Manual end-to-end verification

**Pre-requisites:**
- Supabase bucket `props` created and set to Public
- `.env.local` has `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`

- [ ] **Step 1: Start dev server**

```bash
pnpm dev
```

- [ ] **Step 2: Log in as a director and navigate to `/director` → Library tab**

Expected: Characters and Backgrounds sections load (empty if no props yet).

- [ ] **Step 3: Upload a character image**

Click `+ Upload`, select an image file, confirm the name, click `Add`.

Expected:
- "Uploading…" shown on button while in progress
- Image appears in the grid after upload completes

- [ ] **Step 4: Verify persistence**

Refresh the page and navigate back to Library tab.

Expected: the uploaded image still appears in the grid (loaded from DB).

- [ ] **Step 5: Verify Supabase bucket**

Check the Supabase dashboard → Storage → props bucket.

Expected: the uploaded file is visible.

- [ ] **Step 6: Delete a prop**

Hover over a grid item and click the X button.

Expected: item removed from grid; file deleted from Supabase bucket.

- [ ] **Step 7: Verify the scene detail still works**

Navigate to any story scene (e.g. `/stories/{id}/scenes/{sceneId}`).

Expected: no errors — `getSceneDetail` still loads props by storyId correctly.

- [ ] **Step 8: Final TypeScript build check**

```bash
pnpm build
```

Expected: build succeeds with no errors.

- [ ] **Step 9: Commit if any final fixes were made during verification**

```bash
git add -p
git commit -m "fix: address issues found during manual verification"
```
