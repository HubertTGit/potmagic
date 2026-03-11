# Scene Cast Position Persistence

**Date:** 2026-03-11
**Status:** Approved

## Overview

Persist each character's last known position (`x`, `y`, `rotation`, `scaleX`) in the `scene_cast` table so that when an actor re-enters a scene, their character resumes where it was last left.

## Schema Change

Add four nullable `real` columns to `scene_cast`:

| Column     | Type   | Notes                              |
|------------|--------|------------------------------------|
| `pos_x`    | `real` | Canvas X position                  |
| `pos_y`    | `real` | Canvas Y position                  |
| `rotation` | `real` | Degrees                            |
| `scale_x`  | `real` | `1` = normal, `-1` = mirrored      |

Nullable so existing rows without saved state are unaffected. A new Drizzle migration is required.

## Data Flow

### Loading (scene enter)

- `getSceneStage` returns the 4 position columns alongside existing cast data.
- `StageComponent` passes them as `initialX`, `initialY`, `initialRotation`, `initialScaleX` props to `DraggableCharacter`.
- If `pos_x`/`pos_y` are null (never saved), fall back to defaults: `x: 100 + index * 200`, `y: 100`, `rotation: 0`, `scaleX: 1`.

### Saving (scene leave)

- `DraggableCharacter` receives a `sceneCastId` prop (the `scene_cast` row id, added to `getSceneStage` query).
- A new `saveSceneCastPosition` server function in `scenes.fns.ts` accepts `{ sceneCastId, x, y, rotation, scaleX }` and runs `db.update(sceneCast).set(...)`.
- In `DraggableCharacter`, a `useEffect` with an empty dependency array runs cleanup on unmount — reads current node values from `imageRef.current` and calls the server function.
- Guarded by `canDrag` so only the assigned actor saves their character.

## Error Handling & Edge Cases

- **Save failure on unmount** — fire-and-forget. Cannot `await` or show toasts during unmount. Worst case: position resets to defaults on next load. Acceptable.
- **Background characters** — `pos_x`/`pos_y` are stored but irrelevant on load; backgrounds are snapped to `stageHeight - image.height/2` by the existing Konva effect. No change needed.
- **First-time load (null position)** — falls back to `100 + index * 200, y: 100`, `rotation: 0`, `scaleX: 1` (same as today).
- **Director on stage** — director has no assigned character, so no `DraggableCharacter` belongs to them; no save fires.
- **Multiple tabs** — last tab to close wins. Acceptable.

## Files Changed

| File | Change |
|------|--------|
| `src/db/schema.ts` | Add `posX`, `posY`, `rotation`, `scaleX` nullable real columns to `sceneCast` |
| `src/db/migrations/` | New Drizzle migration |
| `src/lib/scenes.fns.ts` | Add `saveSceneCastPosition` server function; update `getSceneStage` to return position columns and `sceneCastId` |
| `src/components/stage.component.tsx` | Pass `sceneCastId` + position props to `DraggableCharacter` |
| `src/components/draggable-character.component.tsx` | Accept new props; add `useEffect` cleanup to save on unmount |
