# Scene Drag-and-Drop Reordering Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow directors to drag-and-drop scenes into a custom order, persisting the order to the database.

**Architecture:** Install `@dnd-kit` for sortable DnD. Add a `reorderScenes` server function that bulk-updates the `order` column. Update `StoryScenesTab` to wrap rows in `DndContext`/`SortableContext` with a per-row grip handle; optimistic local state updates immediately on drop, server sync happens in the background.

**Tech Stack:** `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`, TanStack Start server functions (`createServerFn`), Drizzle ORM, TanStack Query `useMutation`, DaisyUI + Tailwind CSS, `@heroicons/react`

**Spec:** `docs/superpowers/specs/2026-03-16-scene-drag-reorder-design.md`

---

## Chunk 1: Dependencies + Server Function

### Task 1: Install @dnd-kit packages

**Files:**
- Modify: `package.json` (via pnpm)

- [ ] **Step 1: Install the three @dnd-kit packages**

```bash
pnpm add @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

Expected: packages added to `dependencies` in `package.json`, lockfile updated.

- [ ] **Step 2: Verify install succeeded**

```bash
pnpm ls @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

Expected: all three listed with version numbers.

---

### Task 2: Add `reorderScenes` server function

**Files:**
- Modify: `src/lib/story-detail.fns.ts`

The `scenes` table already has an `order: integer` column. No migration needed.

- [ ] **Step 1: Add `reorderScenes` export to `src/lib/story-detail.fns.ts`**

Open `src/lib/story-detail.fns.ts`. After the `removeScene` export at the bottom of the file, add:

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

No new imports needed — `createServerFn`, `requireDirector`, `db`, `scenes`, `eq` are all already imported at the top of this file.

- [ ] **Step 2: Verify TypeScript compiles**

```bash
pnpm build 2>&1 | head -30
```

Expected: no TypeScript errors related to `reorderScenes`.

- [ ] **Step 3: Commit**

```bash
git add src/lib/story-detail.fns.ts
git commit -m "feat: add reorderScenes server function"
```

---

## Chunk 2: StoryScenesTab DnD

### Task 3: Rewrite `StoryScenesTab` with drag-and-drop

**Files:**
- Modify: `src/components/story-scenes-tab.tsx`

This task replaces the static scene list with a sortable DnD list. The add-scene form and delete behaviour are unchanged.

- [ ] **Step 1: Replace the contents of `src/components/story-scenes-tab.tsx`**

```tsx
import { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { TrashIcon, Bars3Icon } from '@heroicons/react/24/outline';
import {
  DndContext,
  DragEndEvent,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/cn';
import { DataList, DataListItem } from './data-list';

interface Scene {
  id: string;
  order: number;
  title: string;
}

interface StoryScenesTabProps {
  scenes: Scene[];
  storyId: string;
  isDirector: boolean;
  onAddScene: (title: string) => void;
  onRemoveScene: (sceneId: string, title: string) => void;
  onReorderScenes: (scenes: { id: string; order: number }[]) => void;
  isAddingScene: boolean;
  isRemovingScene: boolean;
}

interface SortableSceneRowProps {
  scene: Scene;
  index: number;
  storyId: string;
  isDirector: boolean;
  isRemovingScene: boolean;
  onRemoveScene: (id: string, title: string) => void;
}

function SortableSceneRow({
  scene,
  index,
  storyId,
  isDirector,
  isRemovingScene,
  onRemoveScene,
}: SortableSceneRowProps) {
  const navigate = useNavigate();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: scene.id });

  // Inline style is the sole exception to the no-inline-styles rule:
  // @dnd-kit's CSS.Transform produces a dynamic translate3d value that
  // cannot be expressed as a Tailwind class.
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn(
        'list-row group flex items-center gap-2 cursor-pointer',
        'hover:bg-base-200/50 transition-colors',
        'first:rounded-t-box last:rounded-b-box',
        isDragging && 'opacity-50',
      )}
      onClick={() =>
        navigate({
          to: '/stories/$storyId/scenes/$sceneId',
          params: { storyId, sceneId: scene.id },
        })
      }
    >
      {isDirector && (
        <button
          className="cursor-grab active:cursor-grabbing text-base-content/20 hover:text-base-content/50 transition-colors p-2 shrink-0"
          aria-label="Drag to reorder"
          onClick={(e) => e.stopPropagation()}
          {...attributes}
          {...listeners}
        >
          <Bars3Icon className="size-4" />
        </button>
      )}
      <div className="text-base-content/40 text-sm tabular-nums font-medium w-6 shrink-0">
        {index + 1}.
      </div>
      <div className="list-col-grow text-sm font-medium">
        {scene.title}
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xs text-base-content/20 group-hover:text-base-content/40 transition-colors mr-1">
          Click to view details →
        </span>
        {isDirector && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemoveScene(scene.id, scene.title);
            }}
            disabled={isRemovingScene}
            className="text-xs text-error/60 hover:text-error transition-colors p-2 hover:bg-error/10 rounded-lg"
            title="Remove scene"
          >
            <TrashIcon className="size-4" />
          </button>
        )}
      </div>
    </li>
  );
}

export function StoryScenesTab({
  scenes,
  storyId,
  isDirector,
  onAddScene,
  onRemoveScene,
  onReorderScenes,
  isAddingScene,
  isRemovingScene,
}: StoryScenesTabProps) {
  const [newSceneTitle, setNewSceneTitle] = useState('');
  const [localScenes, setLocalScenes] = useState(scenes);

  useEffect(() => {
    setLocalScenes(scenes);
  }, [scenes]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleAddScene = () => {
    if (!newSceneTitle.trim()) return;
    onAddScene(newSceneTitle.trim());
    setNewSceneTitle('');
  };

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = localScenes.findIndex((s) => s.id === active.id);
    const newIndex = localScenes.findIndex((s) => s.id === over.id);
    const reordered = arrayMove(localScenes, oldIndex, newIndex);
    setLocalScenes(reordered);
    onReorderScenes(reordered.map((s, i) => ({ id: s.id, order: i + 1 })));
  }

  return (
    <div>
      {localScenes.length === 0 ? (
        <DataList>
          <DataListItem className="p-4 text-base-content/40 text-sm">
            No scenes yet.
          </DataListItem>
        </DataList>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={localScenes.map((s) => s.id)}
            strategy={verticalListSortingStrategy}
          >
            <ul className="list bg-base-100 rounded-box shadow-sm mb-4 border border-base-300 overflow-visible">
              {localScenes.map((scene, index) => (
                <SortableSceneRow
                  key={scene.id}
                  scene={scene}
                  index={index}
                  storyId={storyId}
                  isDirector={isDirector}
                  isRemovingScene={isRemovingScene}
                  onRemoveScene={onRemoveScene}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}

      {isDirector && (
        <div className="flex gap-2 items-center">
          <input
            type="text"
            value={newSceneTitle}
            onChange={(e) => setNewSceneTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddScene();
            }}
            placeholder="Scene title…"
            className="input input-sm bg-base-200 border-base-300 text-sm focus:border-gold/60 focus:ring-2 focus:ring-gold/10 w-56"
          />
          <button
            onClick={handleAddScene}
            disabled={isAddingScene || !newSceneTitle.trim()}
            className={cn(
              'btn btn-sm btn-primary font-display',
              (isAddingScene || !newSceneTitle.trim()) &&
                'opacity-40 cursor-not-allowed',
            )}
          >
            + Add Scene
          </button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify no TypeScript errors in the component**

```bash
pnpm build 2>&1 | grep "story-scenes-tab"
```

Expected: no output (no errors).

- [ ] **Step 3: Commit**

> **Note:** This commit will leave a TypeScript error in the parent page (`onReorderScenes` prop missing) until Chunk 3 is applied. Complete Chunk 3 before running `pnpm build`.

```bash
git add src/components/story-scenes-tab.tsx
git commit -m "feat: add drag-and-drop reordering to StoryScenesTab"
```

---

## Chunk 3: Parent Page Wiring

### Task 4: Wire `reorderScenes` mutation in the story detail page

**Files:**
- Modify: `src/routes/_app/stories/$storyId/index.tsx`

- [ ] **Step 1: Add `reorderScenes` to the import from `@/lib/story-detail.fns`**

Find the existing import block (lines 4–12):

```ts
import {
  getStoryDetail,
  updateStoryTitle,
  addCast,
  removeCast,
  assignProp,
  addScene,
  removeScene,
} from '@/lib/story-detail.fns';
```

Replace it with:

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

- [ ] **Step 2: Add `reorderScenesMutation` after `removeSceneMutation`**

Find this block (around line 90–96):

```ts
  const removeSceneMutation = useMutation({
    mutationFn: (sceneId: string) => removeScene({ data: { sceneId } }),
    onSuccess: () => {
      invalidate();
      setSceneToDelete(null);
    },
  });
```

Add after it:

```ts
  const reorderScenesMutation = useMutation({
    mutationFn: (reordered: { id: string; order: number }[]) =>
      reorderScenes({ data: { scenes: reordered } }),
    onSuccess: invalidate,
    onError: invalidate,
  });
```

- [ ] **Step 3: Pass `onReorderScenes` to `StoryScenesTab`**

Find the `<StoryScenesTab>` JSX block (around line 208–218):

```tsx
      {activeTab === 'scenes' && (
        <StoryScenesTab
          scenes={scenes}
          storyId={storyId}
          isDirector={isDirector}
          onAddScene={(title) => addSceneMutation.mutate(title)}
          onRemoveScene={(id, title) => setSceneToDelete({ id, title })}
          isAddingScene={addSceneMutation.isPending}
          isRemovingScene={removeSceneMutation.isPending}
        />
      )}
```

Replace with:

```tsx
      {activeTab === 'scenes' && (
        <StoryScenesTab
          scenes={scenes}
          storyId={storyId}
          isDirector={isDirector}
          onAddScene={(title) => addSceneMutation.mutate(title)}
          onRemoveScene={(id, title) => setSceneToDelete({ id, title })}
          onReorderScenes={(reordered) => reorderScenesMutation.mutate(reordered)}
          isAddingScene={addSceneMutation.isPending}
          isRemovingScene={removeSceneMutation.isPending}
        />
      )}
```

- [ ] **Step 4: Verify full build passes**

```bash
pnpm build 2>&1 | tail -20
```

Expected: `✓ built in` with no errors.

- [ ] **Step 5: Commit**

```bash
git add src/routes/_app/stories/$storyId/index.tsx
git commit -m "feat: wire reorderScenes mutation in story detail page"
```

---

## Manual Verification Checklist

After all tasks are complete:

- [ ] `pnpm dev` — dev server starts without errors
- [ ] Visit `/stories/:id` as a director → Scenes tab shows grip handles on each row
- [ ] Drag a scene row to a new position → order updates immediately in the UI
- [ ] Refresh the page → reordered scenes persist (server round-trip confirmed)
- [ ] Visit `/stories/:id` as an actor → no grip handles visible, list is static
- [ ] Add a new scene → it appears at the bottom with the next order number
- [ ] Delete a scene → remaining scenes still show correct 1-based numbering
