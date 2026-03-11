# Scene Cast Position Persistence Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Persist each character's canvas position, rotation, and mirror state in the `scene_cast` table so actors resume from where they left off when re-entering a scene.

**Architecture:** Add four nullable `real` columns to `scene_cast`. `getSceneStage` returns them on load; `DraggableCharacter` reads its Konva node state on unmount and fires a `saveSceneCastPosition` server function. Only the assigned actor saves their character (guarded by a `canDragRef`). Fire-and-forget — no error UI on save failure.

**Tech Stack:** Drizzle ORM (PostgreSQL), TanStack Start server functions, React + Konva, TypeScript

---

## Chunk 1: Schema + Migration

### Task 1: Add position columns to `sceneCast` schema

**Files:**
- Modify: `src/db/schema.ts`

- [ ] **Step 1: Add four nullable `real` columns to `sceneCast` in `src/db/schema.ts`**

  Open `src/db/schema.ts`. Find the `sceneCast` table definition (currently ends at line 177). Add four columns after `castId`:

  ```ts
  // Before (existing columns shown for context):
  export const sceneCast = pgTable(
    'scene_cast',
    {
      id: text('id').primaryKey(),
      sceneId: text('scene_id')
        .notNull()
        .references(() => scenes.id, { onDelete: 'cascade' }),
      castId: text('cast_id')
        .notNull()
        .references(() => cast.id, { onDelete: 'cascade' }),
      createdAt: timestamp('created_at').defaultNow().notNull(),
    },
  ```

  Add these four columns after `castId` and before `createdAt`:

  ```ts
      posX: real('pos_x'),
      posY: real('pos_y'),
      rotation: real('rotation'),
      scaleX: real('scale_x'),
  ```

  You also need to import `real` — update the import at the top of `schema.ts`:

  ```ts
  // Change this line:
  import { pgTable, pgEnum, text, timestamp, boolean, integer, index, unique } from 'drizzle-orm/pg-core'
  // To:
  import { pgTable, pgEnum, text, timestamp, boolean, integer, real, index, unique } from 'drizzle-orm/pg-core'
  ```

- [ ] **Step 2: Verify TypeScript compiles**

  ```bash
  pnpm build
  ```

  Expected: no TypeScript errors related to `schema.ts`.

---

### Task 2: Generate and apply Drizzle migration

**Files:**
- Create: `src/db/migrations/0012_scene_cast_position.sql`

- [ ] **Step 1: Generate the migration**

  ```bash
  pnpm db:generate
  ```

  This creates a new file in `src/db/migrations/`. The next number after `0011_odd_black_crow.sql` is `0012`. The file will be named something like `0012_<hash>.sql`.

  Verify the generated SQL contains something like:

  ```sql
  ALTER TABLE "scene_cast" ADD COLUMN "pos_x" real;
  ALTER TABLE "scene_cast" ADD COLUMN "pos_y" real;
  ALTER TABLE "scene_cast" ADD COLUMN "rotation" real;
  ALTER TABLE "scene_cast" ADD COLUMN "scale_x" real;
  ```

- [ ] **Step 2: Apply the migration**

  ```bash
  pnpm db:migrate
  ```

  Expected: migration applies without error.

- [ ] **Step 3: Commit**

  ```bash
  git add src/db/schema.ts src/db/migrations/
  git commit -m "feat: add position columns to scene_cast table"
  ```

---

## Chunk 2: Server Functions

### Task 3: Update `getSceneStage` to return position + sceneCastId

**Files:**
- Modify: `src/lib/scenes.fns.ts` (lines 103–126)

- [ ] **Step 1: Update the `getSceneStage` query to select position columns and `sceneCastId`**

  Find the `getSceneStage` handler in `src/lib/scenes.fns.ts` (line 103). Update the `db.select` to also select `sceneCast.id` and the four position columns:

  ```ts
  export const getSceneStage = createServerFn({ method: 'GET' })
    .inputValidator((input: unknown) => input as { sceneId: string })
    .handler(async ({ data }) => {
      await getSessionOrThrow();

      const rows = await db
        .select({
          sceneCastId: sceneCast.id,   // ← new
          castId: cast.id,
          userId: cast.userId,
          path: props.imageUrl,
          type: props.type,
          posX: sceneCast.posX,        // ← new
          posY: sceneCast.posY,        // ← new
          rotation: sceneCast.rotation, // ← new
          scaleX: sceneCast.scaleX,    // ← new
        })
        .from(sceneCast)
        .innerJoin(cast, eq(sceneCast.castId, cast.id))
        .leftJoin(props, eq(cast.propId, props.id))
        .where(eq(sceneCast.sceneId, data.sceneId));

      return rows.map((r) => ({
        sceneCastId: r.sceneCastId,   // ← new
        castId: r.castId,
        userId: r.userId,
        path: r.path,
        type: r.type,
        posX: r.posX,                 // ← new
        posY: r.posY,                 // ← new
        rotation: r.rotation,         // ← new
        scaleX: r.scaleX,             // ← new
      }));
    });
  ```

- [ ] **Step 2: Verify TypeScript compiles**

  ```bash
  pnpm build
  ```

  Expected: no errors. (TypeScript will now flag `StageCast` interface mismatch in `stage.component.tsx` — that's expected and will be fixed in Chunk 3.)

---

### Task 4: Add `saveSceneCastPosition` server function

**Files:**
- Modify: `src/lib/scenes.fns.ts`

- [ ] **Step 1: Add the `saveSceneCastPosition` server function at the bottom of `src/lib/scenes.fns.ts`**

  ```ts
  export const saveSceneCastPosition = createServerFn({ method: 'POST' })
    .inputValidator(
      (input: unknown) =>
        input as {
          sceneCastId: string
          x: number
          y: number
          rotation: number
          scaleX: number
        },
    )
    .handler(async ({ data }) => {
      const session = await getSessionOrThrow();

      // Verify caller owns this sceneCast row
      const [row] = await db
        .select({ userId: cast.userId })
        .from(sceneCast)
        .innerJoin(cast, eq(sceneCast.castId, cast.id))
        .where(eq(sceneCast.id, data.sceneCastId));

      if (!row || row.userId !== session.user.id) {
        throw new Error('Forbidden');
      }

      await db
        .update(sceneCast)
        .set({
          posX: data.x,
          posY: data.y,
          rotation: data.rotation,
          scaleX: data.scaleX,
        })
        .where(eq(sceneCast.id, data.sceneCastId));
    });
  ```

- [ ] **Step 2: Verify TypeScript compiles**

  ```bash
  pnpm build
  ```

  Expected: no errors in `scenes.fns.ts`.

- [ ] **Step 3: Commit**

  ```bash
  git add src/lib/scenes.fns.ts
  git commit -m "feat: update getSceneStage and add saveSceneCastPosition"
  ```

---

## Chunk 3: Component Updates

### Task 5: Update `StageCast` interface and `StageComponent`

**Files:**
- Modify: `src/components/stage.component.tsx`

- [ ] **Step 1: Update the `StageCast` interface to include new fields**

  In `src/components/stage.component.tsx`, update the `StageCast` interface (currently lines 5–10):

  ```ts
  export interface StageCast {
    sceneCastId: string;
    castId: string;
    userId: string;
    path: string | null;
    type: 'character' | 'background' | null;
    posX: number | null;
    posY: number | null;
    rotation: number | null;
    scaleX: number | null;
  }
  ```

- [ ] **Step 2: Update `StageComponent` to pass the new props to `DraggableCharacter`**

  In the same file, update the render of `DraggableCharacter` inside the `.map()` (currently lines 35–46).

  The defaults when position data is null are: `x = 100 + i * 200`, `y = 100`, `rotation = 0`, `scaleX = 1`.

  ```tsx
  {casts.map((cast, i) => {
    if (!cast.path || !cast.type) return null;
    return (
      <DraggableCharacter
        key={cast.castId}
        sceneCastId={cast.sceneCastId}
        src={cast.path}
        userId={cast.userId}
        type={cast.type}
        initialX={cast.posX ?? 100 + i * 200}
        initialY={cast.posY ?? 100}
        initialRotation={cast.rotation ?? 0}
        initialScaleX={cast.scaleX ?? 1}
      />
    );
  })}
  ```

- [ ] **Step 3: Verify TypeScript compiles**

  ```bash
  pnpm build
  ```

  Expected: TypeScript will flag `DraggableCharacterProps` as missing the new props — that's expected and fixed in Task 6.

---

### Task 6: Update `DraggableCharacter` to load and save position

**Files:**
- Modify: `src/components/draggable-character.component.tsx`

- [ ] **Step 1: Update `DraggableCharacterProps` to include new props**

  In `src/components/draggable-character.component.tsx`, update the interface (currently lines 6–12):

  ```ts
  interface DraggableCharacterProps {
    sceneCastId: string
    src: string
    userId: string
    type: 'character' | 'background'
    initialX?: number
    initialY?: number
    initialRotation?: number
    initialScaleX?: number
  }
  ```

- [ ] **Step 2: Update the function signature to destructure new props**

  Update line 22:

  ```ts
  export function DraggableCharacter({
    sceneCastId,
    src,
    userId,
    type,
    initialX = 100,
    initialY = 100,
    initialRotation = 0,
    initialScaleX = 1,
  }: DraggableCharacterProps) {
  ```

- [ ] **Step 3: Add `canDragRef` to avoid stale closure in unmount effect**

  Below the existing `lastMidpoint` ref (line 28), add:

  ```ts
  const canDragRef = useRef(false)
  ```

  Then add a `useEffect` that keeps it in sync with `canDrag`:

  ```ts
  useEffect(() => {
    canDragRef.current = canDrag
  }, [canDrag])
  ```

  This placement before the image-load `useEffect` is a code organization preference — React runs all effects after mount in declaration order, so this does not affect execution relative to the unmount effect. What matters is that the sync effect runs whenever `canDrag` changes (when the session resolves asynchronously after mount), ensuring `canDragRef.current` is always up to date before any unmount.

- [ ] **Step 4: Add the import for `saveSceneCastPosition`**

  At the top of the file, add:

  ```ts
  import { saveSceneCastPosition } from '@/lib/scenes.fns'
  ```

- [ ] **Step 5: Apply `initialRotation` and `initialScaleX` in the image-load `useEffect`**

  The existing image-load `useEffect` (lines 38–49) sets `offsetX`, `offsetY`, and background position. Extend it to also set `initialRotation` and `initialScaleX` on the node:

  ```ts
  useEffect(() => {
    const node = imageRef.current
    if (!node || !image) return
    node.offsetX(image.width / 2)
    node.offsetY(image.height / 2)
    node.rotation(initialRotation)    // ← new
    node.scaleX(initialScaleX)        // ← new
    if (type === 'background') {
      const stageHeight = node.getStage()?.height() ?? 0
      node.y(stageHeight - image.height / 2)
      node.moveToBottom()
    }
    node.getLayer()?.batchDraw()
  }, [image, type])
  ```

  Notes:
  - `initialRotation` and `initialScaleX` are intentionally excluded from the dep array — they are snapshot values at mount time and must not re-apply if they somehow change.
  - The dep array is `[image, type]`. Do NOT add `src` to this dep array — the image object already re-creates when `src` changes (see the image-load effect on lines 30–36). Adding `src` here would cause `node.scaleX(initialScaleX)` to reset the user's mid-session mirror state back to the initial value.

- [ ] **Step 6: Add the unmount save effect**

  Add a new `useEffect` with an empty dep array. This fires its cleanup when the component unmounts:

  ```ts
  useEffect(() => {
    return () => {
      if (!canDragRef.current) return
      const node = imageRef.current
      if (!node) return
      saveSceneCastPosition({
        data: {
          sceneCastId,
          x: node.x(),
          y: node.y(),
          rotation: node.rotation(),
          scaleX: node.scaleX(),
        },
      })
    }
  }, [])
  ```

  Notes:
  - Fire-and-forget — no `await`, no error handling. If it fails silently, the character starts from defaults on next load.
  - `sceneCastId` is captured from props at mount time. This is safe because `DraggableCharacter` is keyed by `cast.castId` in `StageComponent`. A different `sceneCastId` always produces a different component instance (React unmounts the old one and mounts a new one when the key changes), so the captured value is always correct for this instance. **Do not change the `key` prop in `StageComponent` away from `cast.castId` without revisiting this assumption.**

- [ ] **Step 7: Verify TypeScript compiles**

  ```bash
  pnpm build
  ```

  Expected: clean build, no TypeScript errors.

- [ ] **Step 8: Commit**

  ```bash
  git add src/components/stage.component.tsx src/components/draggable-character.component.tsx
  git commit -m "feat: load and save character position per scene cast"
  ```

---

## Chunk 4: Manual Verification

### Task 7: Verify end-to-end behavior

- [ ] **Step 1: Start the dev server**

  ```bash
  pnpm dev
  ```

- [ ] **Step 2: Test position save on navigation**

  1. Log in as an actor assigned to a scene.
  2. Navigate to `/stage/<sceneId>`.
  3. Drag your character to a distinct position (e.g. far right), rotate it visibly (two-finger gesture or equivalent), and double-click to mirror (character should flip horizontally).
  4. Navigate away using `SceneNavigator` prev/next arrows.
  5. Navigate back to the same scene.
  6. Verify: character appears at the same position, at the same rotation angle, and in the mirrored state from step 3 — all three must be confirmed independently.

- [ ] **Step 3: Test default position for new/reset characters**

  1. As a director, remove an actor from a scene (`removeSceneCast`) and re-add them (`addSceneCast`).
  2. As the actor, navigate to the scene.
  3. Verify: character appears at the default position (`100 + index * 200, y: 100`), rotation `0`, not mirrored.

- [ ] **Step 4: Code review checkpoint — auth guard**

  Open `src/lib/scenes.fns.ts` and confirm `saveSceneCastPosition` contains:
  1. A call to `getSessionOrThrow()`
  2. A join from `sceneCast` to `cast` that selects `cast.userId`
  3. A check that `row.userId === session.user.id`, throwing `'Forbidden'` if not

  This is a code review step, not a runtime test. The guard prevents any authenticated user from overwriting another actor's position data.

- [ ] **Step 5: Verify background character behavior**

  1. Confirm background character still snaps to the bottom of the canvas on load, regardless of any stored `posY`.
  2. Note: `canDragRef.current` will be `false` for background characters when no user is the assigned actor of that background prop. This means the unmount save is silently skipped for backgrounds — which is correct behavior, since the background snap always overrides position on load anyway.
