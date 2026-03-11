# Scene Navigator Design

**Date:** 2026-03-11
**Status:** Approved

## Context

The stage page (`/stage/$sceneId`) is a full-screen Konva canvas for performing scenes. Currently, there is no way to navigate between scenes from the stage — users must leave the stage to go to a story detail page and re-enter. This spec adds a scene navigator overlay so actors and directors can move between scenes without leaving the stage.

## Requirements

- Show a fixed top-center overlay with Prev / Next buttons and the current scene name
- Prev is disabled on the first scene; Next is disabled on the last scene
- Clicking Prev/Next navigates to `/stage/$sceneId` for the adjacent scene
- Visual style matches the existing `CastPreview` component (bg-base-200, border, rounded-xl, shadow-lg)

## Architecture

### New Server Function: `getSceneNavigation`

**File:** `src/lib/scenes.fns.ts`

Accepts `{ sceneId: string }` via `.inputValidator((input: unknown) => input as { sceneId: string })`.

Calls `getSessionOrThrow()` first (consistent with all other server functions in the file).

Returns `{ current, prev, next }` where each is `{ id: string, title: string } | null` (prev/next are null at boundaries).

Implementation:

1. Query scene by id to get `storyId` and `order`
2. Query all scenes for that `storyId` ordered by `ORDER BY order ASC, id ASC` (tiebreaker on id in case two scenes share the same order value)
3. Find current index in the list; derive prev (index - 1) and next (index + 1)

Loading/error behavior: render `null` while loading; render `null` if the query errors or the sceneId is not found.

### New Component: `SceneNavigator`

**File:** `src/components/scene-navigator.component.tsx`

Props: `{ sceneId: string }`

- Calls `getSceneNavigation` via TanStack Query (`queryKey: ['scene-navigation', sceneId]`)
- Renders `null` while `isLoading` or if `data` is undefined
- Fixed position: `fixed top-4 left-1/2 -translate-x-1/2 z-50`
- Styled: `bg-base-200 border border-base-300 rounded-xl px-3 py-2 shadow-lg flex items-center gap-3`
- Scene name: `max-w-[12rem] truncate` to prevent overflow on long titles
- Prev button: disabled + `opacity-40 pointer-events-none` when `prev === null`
- Next button: disabled + `opacity-40 pointer-events-none` when `next === null`
- Navigation uses `useRouter()` → `router.navigate({ to: '/stage/$sceneId', params: { sceneId: next.id } })` (consistent with codebase pattern)

Note: on narrow viewports, the navigator (top-center) and CastPreview (top-right) may overlap. This is acceptable for the current scope.

### Stage Page Update

**File:** `src/routes/_app/stage/$sceneId.tsx`

Add `<SceneNavigator sceneId={sceneId} />` as the first element in the returned JSX (renders above `CastPreview` and `StageComponent`).

## Data Flow

```text
SceneNavigator
  → getSceneNavigation({ sceneId }) [server fn]
    → getSessionOrThrow()
    → db: SELECT scene WHERE id = sceneId → { storyId, order }
    → db: SELECT scenes WHERE storyId ORDER BY order ASC, id ASC → [scene list]
    → return { current, prev, next }
  ← { current: { id, title }, prev: { id, title } | null, next: { id, title } | null }
  → render buttons + scene name
  → on click → router.navigate({ to: '/stage/$sceneId', params: { sceneId } })
```

## Files Modified

| File | Change |
| ---- | ------ |
| `src/lib/scenes.fns.ts` | Add `getSceneNavigation` server function |
| `src/components/scene-navigator.component.tsx` | New component |
| `src/routes/_app/stage/$sceneId.tsx` | Render `<SceneNavigator>` |

## Verification

1. Run `pnpm dev`
2. Navigate to `/stage/$sceneId` for a middle scene — both Prev and Next buttons should be enabled
3. Navigate to the first scene — Prev button should be dimmed and non-interactive
4. Navigate to the last scene — Next button should be dimmed and non-interactive
5. Click Prev/Next — URL changes to the adjacent scene, canvas reloads with new cast
6. Scene name displayed matches the scene's title from the database
7. Navigate to `/stage/nonexistent-id` — navigator renders nothing gracefully, no crash
