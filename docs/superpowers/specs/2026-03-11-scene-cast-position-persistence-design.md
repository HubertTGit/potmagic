# Scene Cast Position Persistence

**Date:** 2026-03-11
**Status:** Approved

## Overview

Persist each character's last known position (`x`, `y`, `rotation`, `scaleX`) in the `scene_cast` table so that when an actor re-enters a scene, their character resumes where it was last left.

## Schema Change

Add four nullable `real` columns to `scene_cast` (32-bit precision is sufficient for canvas coordinates):

| Column     | Type   | Notes                              |
|------------|--------|------------------------------------|
| `pos_x`    | `real` | Canvas X position                  |
| `pos_y`    | `real` | Canvas Y position                  |
| `rotation` | `real` | Degrees                            |
| `scale_x`  | `real` | `1` = normal, `-1` = mirrored      |

Nullable so existing rows without saved state are unaffected. A new Drizzle migration is required.

## Data Flow

### Loading (scene enter)

- `getSceneStage` returns the 4 position columns and `sceneCastId` (i.e. `sceneCast.id` — a net-new selected column added alongside the existing `castId: cast.id`; `castId` is not renamed and must remain to preserve `StageComponent` key and `DraggableCharacter` userId wiring).
- `StageComponent` passes them as `initialX`, `initialY`, `initialRotation`, `initialScaleX` props to `DraggableCharacter`.
- If `pos_x`/`pos_y` are null (never saved), fall back to defaults: `x: 100 + index * 200`, `y: 100`, `rotation: 0`, `scaleX: 1`.
- `initialX`/`initialY` remain as JSX props on `<Image>` (no change from today's pattern). `initialRotation` and `initialScaleX` are applied **imperatively inside the existing image-load `useEffect`** (after `offsetX`/`offsetY` are set via `node.rotation()` and `node.scaleX()`), not as JSX props, to avoid conflicts with the existing imperative Konva setup. This asymmetry is intentional — `x`/`y` as props carry no conflict risk, while `rotation`/`scaleX` are not currently set as JSX props at all.

### Saving (scene leave)

- `DraggableCharacter` receives a `sceneCastId` prop (the `scene_cast` row id).
- A new `saveSceneCastPosition` server function in `scenes.fns.ts` accepts `{ sceneCastId, x, y, rotation, scaleX }` and runs `db.update(sceneCast).set(...)`. Auth: calls `getSessionOrThrow()`, then verifies the calling user's session `userId` matches the `cast.userId` for the given `sceneCast` row (join `sceneCast → cast`). Prevents any authenticated user from overwriting another actor's position.
- In `DraggableCharacter`, a `useEffect` with an empty dependency array runs cleanup on unmount — reads current node values from `imageRef.current` and calls the server function.
- `canDrag` must be tracked via a `useRef` (mirroring the existing `lastAngle`/`lastMidpoint` pattern) to avoid a stale closure in the empty-dep `useEffect`. The auth session resolves asynchronously after mount, so reading `canDrag` directly from the closure would silently skip saves for authorized actors.
- Save is guarded by `canDragRef.current` so only the assigned actor saves their character.
- This save fires on any React unmount of `DraggableCharacter` — including scene navigation via `SceneNavigator`, route change, and browser/tab close (best-effort on the latter).

## Error Handling & Edge Cases

- **Save failure on unmount** — fire-and-forget. Cannot `await` or show toasts during unmount. Worst case: position resets to defaults on next load. Acceptable.
- **Background characters** — `pos_x`/`pos_y` are stored but irrelevant on load; backgrounds are snapped to `stageHeight - image.height/2` by the existing Konva effect. No change needed.
- **First-time load (null position)** — falls back to `100 + index * 200, y: 100`, `rotation: 0`, `scaleX: 1` (same as today).
- **Director on stage** — director has no assigned character, so no `DraggableCharacter` belongs to them; no save fires.
- **Multiple tabs** — last tab to close wins. Acceptable.
- **`sceneCast` row deleted and re-added** — when a director removes an actor from a scene and re-adds them, a new row is inserted with a new `id` and all position columns as `NULL`. Saved position is lost; character starts at default coordinates. This is accepted behavior.

## Files Changed

| File | Change |
|------|--------|
| `src/db/schema.ts` | Add `posX`, `posY`, `rotation`, `scaleX` nullable real columns to `sceneCast` |
| `src/db/migrations/` | New Drizzle migration |
| `src/lib/scenes.fns.ts` | Add `saveSceneCastPosition` server function; update `getSceneStage` to return `sceneCastId` and position columns |
| `src/components/stage.component.tsx` | Update `StageCast` interface to add `sceneCastId`, `posX`, `posY`, `rotation`, `scaleX` fields; pass them as props to `DraggableCharacter` |
| `src/components/draggable-character.component.tsx` | Accept new props; track `canDrag` via `useRef`; apply `initialRotation`/`initialScaleX` in image-load `useEffect`; add unmount cleanup to save position |
| `src/components/cast-preview.component.tsx` | No changes required — receives `StageCast` but ignores position fields |
