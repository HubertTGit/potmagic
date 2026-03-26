# Background Repeat Feature — Design Spec

**Date:** 2026-03-26
**Status:** Approved

---

## Context

Scenes with a background image currently pan (scroll) horizontally. When the edge of the image is reached the animation stops, which breaks immersion for wide-establishing shots or looping scenery. Directors need a way to mark a background as "repeating" so panning continues indefinitely — the texture tiles and wraps seamlessly.

---

## What We're Building

Three changes, layered together:

1. **DB column** — `scenes.background_repeat boolean DEFAULT false NOT NULL`
2. **Toggle UI** — in the scene background section, show a "Repeat" toggle when a background is assigned (director only)
3. **PixiJS tiling** — when `backgroundRepeat` is true on the stage, replace the normal `Sprite` with a `TilingSprite` so the texture loops; panning runs indefinitely and stops only via the manual stop button

---

## Architecture

### 1. Database

Add column to `scenes`:

```sql
ALTER TABLE "scenes" ADD COLUMN "background_repeat" boolean DEFAULT false NOT NULL;
```

Schema file: `src/db/schema.ts` — add `backgroundRepeat: boolean("background_repeat").default(false).notNull()` to the `scenes` table.

### 2. Server Functions (`src/lib/scenes.fns.ts`)

Add one new server function, mirroring the existing `setSceneSoundAutoplay` pattern:

```ts
export const setSceneBackgroundRepeat = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ sceneId: z.string(), repeat: z.boolean() }).parse)
  .handler(async ({ data }) => {
    await requireSceneOwner(data.sceneId);
    await db.update(scenes).set({ backgroundRepeat: data.repeat }).where(eq(scenes.id, data.sceneId));
  });
```

Update `getSceneDetail` to return `scene.backgroundRepeat`.
Update `getSceneStage` to return `scene.backgroundRepeat` in the scene payload.

### 3. Scene Detail UI

**`SceneBackgroundSection`** — add props:
- `backgroundRepeat: boolean`
- `onToggleRepeat: (v: boolean) => void`
- `isTogglingRepeat?: boolean`

Render a toggle (same visual pattern as `soundAutoplay` in `SceneSoundSection`) below the picker, visible only when `isDirector && background != null`.

**`sceneId.tsx`** — add `backgroundRepeatMutation` (calls `setSceneBackgroundRepeat`), pass `backgroundRepeat` and `onToggleRepeat` to `SceneBackgroundSection`.

### 4. PixiCharacterProps interface (`src/components/draggable-character.component.tsx`)

Add optional field:
```ts
backgroundRepeat?: boolean;
```

### 5. Stage Component (`src/components/stage.component.tsx`)

When constructing `PixiBackground`, add to the conditional spread:
```ts
backgroundRepeat: scene.backgroundRepeat ?? false,
```

(Requires `getSceneStage` to include `backgroundRepeat` in the scene result.)

### 6. PixiBackground (`src/components/draggable-background.component.tsx`)

**Non-repeat mode (existing behaviour):** unchanged.

**Repeat mode (`backgroundRepeat: true`):**

- In `loadTexture`, create a `TilingSprite` (from `pixi.js`) instead of a `Sprite`.
  - `width = stageWidth`, `height = texture.height`
  - `anchor.set(0, 0)` — anchored top-left
  - Container `x = 0`, `y = stageHeight - texture.height`
- Store as `private tilingSprite: TilingSprite | null`; keep `private sprite: Sprite | null` (null in repeat mode).
- Panning (`setAnimation`): `tilePosition.x += delta * ticker.deltaTime` — no `clampX`, no boundary check, no `onAnimationComplete` call.
- Dragging: `tilePosition.x -= dx` (inverted — dragging right reveals left tile, matching natural feel).
- `publishMove` / `applyRemoteMove`: use `tilePosition.x` as the `x` coordinate in the `PropMoveMessage`.
- `onPositionChange` is **not called** in repeat mode (progress bar stays at 0; no boundary exists).
- `blurFilter` still applied to `tilingSprite` during panning for motion blur continuity.

---

## Data Flow

```
Director toggles repeat
  → setSceneBackgroundRepeat (server fn)
  → scenes.background_repeat updated in DB

Stage loads
  → getSceneStage returns backgroundRepeat
  → PixiBackground constructed with backgroundRepeat prop
  → TilingSprite used when true

Director pans
  → BgPanningTool publishes bg:animate message
  → setAnimation() runs ticker
  → tilePosition.x increments indefinitely
  → Stop button publishes direction:null, speed:0 → animation halts
```

---

## Files Modified

| File | Change |
|------|--------|
| `src/db/schema.ts` | Add `backgroundRepeat` column |
| `src/db/migrations/0025_*.sql` | Migration SQL |
| `src/lib/scenes.fns.ts` | Add `setSceneBackgroundRepeat`, update `getSceneDetail`, `getSceneStage` |
| `src/components/draggable-character.component.tsx` | Add `backgroundRepeat?` to `PixiCharacterProps` |
| `src/components/draggable-background.component.tsx` | TilingSprite support |
| `src/components/scene-background-section.tsx` | Repeat toggle UI |
| `src/routes/($lang)/_app/stories/$storyId/scenes/$sceneId.tsx` | `backgroundRepeatMutation`, pass props |
| `src/components/stage.component.tsx` | Pass `backgroundRepeat` to PixiBackground |

---

## Verification

1. Create a scene, assign a background
2. Toggle "Repeat" on — confirm DB updates via server response
3. Enter stage — confirm TilingSprite renders correctly (background fills stage width, no clipping)
4. Pan left or right — confirm texture tiles seamlessly with no visible boundary
5. Click stop — confirm animation halts
6. Toggle "Repeat" off — re-enter stage — confirm normal clamped panning resumes and auto-stops at boundary
7. Confirm actor clients (non-drag) see the panning applied via `applyRemoteMove`
