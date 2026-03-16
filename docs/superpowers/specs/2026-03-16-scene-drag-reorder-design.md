# Scene Drag-and-Drop Reordering — Design Spec

**Date:** 2026-03-16
**Status:** Approved

---

## Overview

Directors can reorder scenes within a story using drag-and-drop. Each scene row exposes a dedicated drag handle (grip icon). Dropping a scene persists the new order to the database. Actors see the updated order but cannot drag.

---

## Dependencies

Install three packages from the `@dnd-kit` family:

```
@dnd-kit/core
@dnd-kit/sortable
@dnd-kit/utilities
```

No schema changes are required — the `scenes` table already has an `order: integer` column, and `getStoryDetail` already queries scenes ordered by it.

---

## Server Function

**File:** `src/lib/story-detail.fns.ts`

Add `reorderScenes`:

```ts
export const reorderScenes = createServerFn({ method: 'POST' })
  .inputValidator((input: unknown) => input as { scenes: { id: string; order: number }[] })
  .handler(async ({ data }) => {
    await requireDirector()
    for (const { id, order } of data.scenes) {
      await db.update(scenes).set({ order }).where(eq(scenes.id, id))
    }
  })
```

- Requires director role (uses existing `requireDirector()` helper).
- Sequential updates — list is typically short (< 20 scenes), so no bulk-update complexity needed.

---

## Component: `StoryScenesTab`

**File:** `src/components/story-scenes-tab.tsx`

### New prop

```ts
onReorderScenes: (scenes: { id: string; order: number }[]) => void
```

### Local state

```ts
const [localScenes, setLocalScenes] = useState(scenes)
useEffect(() => setLocalScenes(scenes), [scenes])
```

Optimistic: the UI reflects the drop immediately; the server call happens in the background.

### DnD wiring

- Wrap the list in `<DndContext onDragEnd={handleDragEnd}>` + `<SortableContext items={localScenes.map(s => s.id)} strategy={verticalListSortingStrategy}>`.
- Each scene row is a `SortableSceneRow` component (defined in the same file, not exported).

### `SortableSceneRow`

Uses `useSortable({ id: scene.id })`. Applies `transform` and `transition` to the row element via inline `style` — this is the **only permitted exception** to the no-inline-styles rule in this codebase. `@dnd-kit`'s `CSS.Transform.toString()` produces a dynamic `translate3d(...)` value that cannot be expressed as a Tailwind class. The wrapper `<li>` receives `style={{ transform: CSS.Transform.toString(transform), transition }}` and nothing else. All visual styling remains in Tailwind/DaisyUI classes on child elements. Passes `attributes`, `listeners` to the drag handle only.

### Drag handle

```tsx
{isDirector && (
  <button
    className="cursor-grab active:cursor-grabbing text-base-content/20 hover:text-base-content/50 transition-colors p-2"
    {...listeners}
    {...attributes}
    aria-label="Drag to reorder"
  >
    <Bars3Icon className="size-4" />
  </button>
)}
```

Uses `Bars3Icon` from `@heroicons/react/24/outline` (three-line reorder affordance — closest available heroicon to a drag-handle grip).

### `handleDragEnd`

```ts
function handleDragEnd(event: DragEndEvent) {
  const { active, over } = event
  if (!over || active.id === over.id) return
  const oldIndex = localScenes.findIndex(s => s.id === active.id)
  const newIndex = localScenes.findIndex(s => s.id === over.id)
  const reordered = arrayMove(localScenes, oldIndex, newIndex)
  setLocalScenes(reordered)
  onReorderScenes(reordered.map((s, i) => ({ id: s.id, order: i + 1 })))
}
```

### Order display

The order number shown (`1.`, `2.`…) is derived from the array index of `localScenes`, not the `scene.order` field, so it updates instantly on drop.

---

## Parent Page: `stories/$storyId/index.tsx`

**File:** `src/routes/_app/stories/$storyId/index.tsx`

### New mutation

```ts
const reorderScenesMutation = useMutation({
  mutationFn: (reordered: { id: string; order: number }[]) =>
    reorderScenes({ data: { scenes: reordered } }),
  onSuccess: invalidate,
  onError: invalidate,  // restores correct order from server if the mutation fails
})
```

### Updated import

Add `reorderScenes` to the existing named import:

```ts
import {
  getStoryDetail,
  updateStoryTitle,
  addCast,
  removeCast,
  assignProp,
  addScene,
  removeScene,
  reorderScenes,
} from '@/lib/story-detail.fns';
```

### Pass down

```tsx
<StoryScenesTab
  ...
  onReorderScenes={(reordered) => reorderScenesMutation.mutate(reordered)}
/>
```

No pending/error UI is added for the reorder mutation — it's a background operation. If it fails, `onError: invalidate` triggers a refetch so the server's authoritative order is restored.

**Authorization note:** `reorderScenes` currently trusts that submitted scene IDs belong to the story, consistent with other server functions in this file. Adding a `storyId` ownership check is left as future hardening.

---

## Files Changed

| File | Change |
|---|---|
| `src/lib/story-detail.fns.ts` | Add `reorderScenes` server function |
| `src/components/story-scenes-tab.tsx` | Add DnD, local state, `SortableSceneRow`, drag handle |
| `src/routes/_app/stories/$storyId/index.tsx` | Add `reorderScenesMutation`, pass `onReorderScenes` |

---

## Behaviour Notes

- Drag handle only renders for directors; actors see a static list.
- Row click-to-navigate still works — the handle is a separate button element that stops propagation.
- Keyboard accessibility: `@dnd-kit` provides keyboard drag support via the `attributes` spread on the handle button.
- No visual drag overlay is added — the native ghost image is sufficient for this list.
