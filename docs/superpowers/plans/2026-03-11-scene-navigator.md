# Scene Navigator Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a fixed top-center scene navigator overlay to the stage page so actors and directors can move between scenes without leaving the stage.

**Architecture:** A new `getSceneNavigation` server function fetches the current, previous, and next scenes by looking up siblings in the DB. A new `SceneNavigator` component renders a styled overlay with Prev/Next buttons and the scene name, using TanStack Router for navigation. The stage page mounts this component above the existing overlays.

**Tech Stack:** TanStack Start (`createServerFn`), TanStack Query (`useQuery`), TanStack Router (`useRouter`), Drizzle ORM (`asc`, `eq`), React 19, Tailwind CSS + DaisyUI

---

## Chunk 1: Server Function

### Task 1: Add `getSceneNavigation` to `scenes.fns.ts`

**Files:**

- Modify: `src/lib/scenes.fns.ts`

- [ ] **Step 1: Add `asc` to the drizzle-orm import**

  In `src/lib/scenes.fns.ts`, line 3, change:

  ```ts
  import { and, eq, sql } from 'drizzle-orm';
  ```

  to:

  ```ts
  import { and, asc, eq, sql } from 'drizzle-orm';
  ```

- [ ] **Step 2: Append `getSceneNavigation` at the end of `src/lib/scenes.fns.ts`**

  ```ts
  export const getSceneNavigation = createServerFn({ method: 'GET' })
    .inputValidator((input: unknown) => input as { sceneId: string })
    .handler(async ({ data }) => {
      await getSessionOrThrow();

      const [current] = await db
        .select({ id: scenes.id, title: scenes.title, order: scenes.order, storyId: scenes.storyId })
        .from(scenes)
        .where(eq(scenes.id, data.sceneId));

      if (!current) return null;

      const allScenes = await db
        .select({ id: scenes.id, title: scenes.title })
        .from(scenes)
        .where(eq(scenes.storyId, current.storyId))
        .orderBy(asc(scenes.order), asc(scenes.id));

      const idx = allScenes.findIndex((s) => s.id === data.sceneId);

      return {
        current: { id: current.id, title: current.title },
        prev: idx > 0 ? allScenes[idx - 1] : null,
        next: idx < allScenes.length - 1 ? allScenes[idx + 1] : null,
      };
    });
  ```

- [ ] **Step 3: Verify TypeScript compiles**

  ```bash
  pnpm build
  ```

  Expected: no TypeScript errors related to `scenes.fns.ts`.

- [ ] **Step 4: Commit**

  ```bash
  git add src/lib/scenes.fns.ts
  git commit -m "feat: add getSceneNavigation server function"
  ```

---

## Chunk 2: Component + Page Integration

### Task 2: Create `SceneNavigator` component

**Files:**

- Create: `src/components/scene-navigator.component.tsx`

- [ ] **Step 1: Create the component file**

  ```tsx
  import { useQuery } from '@tanstack/react-query'
  import { useRouter } from '@tanstack/react-router'
  import { getSceneNavigation } from '@/lib/scenes.fns'
  import { cn } from '@/lib/cn'

  interface SceneNavigatorProps {
    sceneId: string
  }

  export function SceneNavigator({ sceneId }: SceneNavigatorProps) {
    const router = useRouter()
    const { data, isLoading, isError } = useQuery({
      queryKey: ['scene-navigation', sceneId],
      queryFn: () => getSceneNavigation({ data: { sceneId } }),
    })

    if (isLoading || isError || !data) return null

    return (
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-base-200 border border-base-300 rounded-xl px-3 py-2 shadow-lg">
        <button
          onClick={() =>
            data.prev &&
            router.navigate({ to: '/stage/$sceneId', params: { sceneId: data.prev.id } })
          }
          disabled={!data.prev}
          className={cn(
            'text-sm px-2 py-1 rounded-lg bg-base-300 border border-base-300 text-base-content transition-opacity',
            !data.prev && 'opacity-40 pointer-events-none',
          )}
        >
          ◀ Prev
        </button>
        <span className="max-w-[12rem] truncate text-sm font-semibold text-base-content">
          {data.current.title}
        </span>
        <button
          onClick={() =>
            data.next &&
            router.navigate({ to: '/stage/$sceneId', params: { sceneId: data.next.id } })
          }
          disabled={!data.next}
          className={cn(
            'text-sm px-2 py-1 rounded-lg bg-base-300 border border-base-300 text-base-content transition-opacity',
            !data.next && 'opacity-40 pointer-events-none',
          )}
        >
          Next ▶
        </button>
      </div>
    )
  }
  ```

### Task 3: Mount `SceneNavigator` in the stage page

**Files:**

- Modify: `src/routes/_app/stage/$sceneId.tsx`

- [ ] **Step 1: Import `SceneNavigator`**

  Add to existing imports at the top of `src/routes/_app/stage/$sceneId.tsx`:

  ```ts
  import { SceneNavigator } from '@/components/scene-navigator.component'
  ```

- [ ] **Step 2: Render `<SceneNavigator>` in `SceneStagePage`**

  Change the return block from:

  ```tsx
  return (
    <>
      <CastPreview casts={casts} />
      <StageComponent casts={casts} />
    </>
  )
  ```

  to:

  ```tsx
  return (
    <>
      <SceneNavigator sceneId={sceneId} />
      <CastPreview casts={casts} />
      <StageComponent casts={casts} />
    </>
  )
  ```

- [ ] **Step 3: Verify TypeScript compiles**

  ```bash
  pnpm build
  ```

  Expected: no errors.

- [ ] **Step 4: Commit**

  ```bash
  git add src/components/scene-navigator.component.tsx src/routes/_app/stage/$sceneId.tsx
  git commit -m "feat: add SceneNavigator overlay to stage page"
  ```

---

## Verification

- [ ] Run `pnpm dev`
- [ ] Navigate to `/stage/$sceneId` for a **middle** scene — both Prev and Next buttons visible and clickable
- [ ] Navigate to the **first** scene — Prev button is dimmed and does nothing on click
- [ ] Navigate to the **last** scene — Next button is dimmed and does nothing on click
- [ ] Click Prev/Next — URL changes to adjacent scene, canvas reloads with correct cast
- [ ] Scene name displayed matches the scene title from the DB
- [ ] Navigate to `/stage/nonexistent-id` — navigator renders nothing, no crash
