# Background Panning Animation — Design Spec

**Date:** 2026-03-24
**Branch:** bg-panning-optimisation
**Status:** Approved

---

## Overview

Extend the existing `BgPanningTool` / `PixiBackground` system so the director can trigger a continuous auto-panning animation on the scene background. All room participants see smooth, locally-driven animation via a dedicated LiveKit broadcast message. Drag is blocked while animation is active.

---

## Scope

- Director selects direction (left/right) and speed (1x/2x/3x) in `BgPanningTool`
- PixiJS `app.ticker` drives the animation frame-by-frame on every client
- Animation state is shared room-wide via a new `bg:animate` LiveKit data message
- Jotai atoms bridge the React UI layer and the PixiJS rendering layer
- Drag interaction on the background is disabled while `speed > 0`
- Background position (as a progress %) flows back to `BgPanningTool`'s progress bar

Out of scope: late-joiners syncing animation state (noted limitation).

---

## Architecture

### 1. New file — `src/lib/bg-panning.atoms.ts`

Two module-level Jotai atoms:

```ts
export type BgDirection = 'left' | 'right' | null;
export type BgSpeed = 0 | 1 | 2 | 3;

export const bgPanningAtom = atom<{ direction: BgDirection; speed: BgSpeed }>({
  direction: null,
  speed: 0,
});

export const bgProgressAtom = atom({ leftProgress: 0, rightProgress: 0 });
```

`bgPanningAtom` — animation intent. Written by director (BgPanningTool) and by non-directors (StageComponent on receiving LiveKit message).
`bgProgressAtom` — display only. Written by StageComponent via PixiBackground callback. Read by BgPanningTool for the progress bar.

Both atoms reset to defaults in two places in StageComponent:
1. On `casts` change (the existing casts sync `useEffect`) — handles scene switching, since `StageComponent` is not unmounted between scene navigations; the `app` and `propsRef` persist while casts are replaced.
2. On component unmount — handles navigating away from the stage entirely.

---

### 2. New LiveKit message type — `BgAnimateMessage`

```ts
export interface BgAnimateMessage {
  type: 'bg:animate';
  direction: BgDirection;
  speed: BgSpeed;
}
```

Defined in a new shared types file: `src/lib/livekit-messages.ts`. This file also re-exports `PropMoveMessage` (currently in `draggable-character.component.tsx`) to consolidate all LiveKit message types. Both `draggable-character.component.tsx` and `draggable-background.component.tsx` import from this shared file going forward.

Director publishes this message (reliable = true) whenever direction/speed changes. Non-directors receive it in StageComponent's `RoomEvent.DataReceived` handler and write to `bgPanningAtom`.

---

### 3. `PixiBackground` changes

New private field to store the ticker callback reference:
```ts
private animationTicker: ((ticker: Ticker) => void) | null = null;
```

New method:
```ts
setAnimation(direction: BgDirection, speed: BgSpeed): void
```

- Always remove `animationTicker` from `app.ticker` first (if set) to prevent duplicate ticker adds when changing speed mid-animation
- If `speed === 0`: clear `animationTicker`, set `this.animationSpeed = 0`, re-enable drag
- If `speed > 0`: create new ticker callback, assign to `animationTicker`, add to `app.ticker`; the callback moves `container.x` by `±pixelsPerFrame * ticker.deltaTime` each tick (deltaTime-corrected for frame rate independence), then clamps via existing `clampX()`; disables drag

Speed → pixels-per-frame mapping (at 60fps):
| Speed | px/frame | px/sec |
|-------|----------|--------|
| 1x    | 2        | ~120   |
| 2x    | 4        | ~240   |
| 3x    | 8        | ~480   |

New constructor prop:
```ts
onPositionChange?: (x: number, bounds: { minX: number; maxX: number }) => void;
```

Called directly from the ticker callback (not via `publishMove`) so it fires on all clients regardless of `canDrag`. Throttled independently to at most once per 30ms using the same `lastSendTime` guard pattern — or a separate `lastProgressTime` field to avoid coupling progress reporting to the network send gate.

Drag guard: `onStagePointerMove` and `onPointerDown` skip processing when `this.animationSpeed > 0`.

---

### 4. `StageComponent` changes

- `useAtomValue(bgPanningAtom)` — watches animation state
- `useSetAtom(bgProgressAtom)` — updates progress from `onPositionChange` callback
- `useEffect` on `bgPanningAtom` value: finds the background in `propsRef` (type === 'background') and calls `bg.setAnimation(direction, speed)`
- Call `useSetAtom(bgPanningAtom)` at the component top level to get a stable setter (`setBgPanning`). Inside the `RoomEvent.DataReceived` handler closure, call `setBgPanning({ direction, speed })` when `msg.type === 'bg:animate'`. Do NOT call `useSetAtom` inside the handler — hooks must only be called at component top level.
- Pass `onPositionChange` callback when constructing `PixiBackground`:
  ```ts
  onPositionChange: (x, { minX, maxX }) => {
    const range = maxX - minX;
    if (range <= 0) return;
    const rightProgress = Math.round(((x - minX) / range) * 100);
    setBgProgress({ leftProgress: 100 - rightProgress, rightProgress });
  }
  ```
- `useEffect` cleanup (unmount): reset `bgPanningAtom` and `bgProgressAtom` to defaults

---

### 5. `BgPanningTool` changes

- Accept new prop: `room?: Room | null`
- Replace internal `direction`/`speed` useState with `useAtom(bgPanningAtom)`
- Read `bgProgressAtom` with `useAtomValue` — remove `leftProgress`/`rightProgress` props
- Remove `activeDirection` prop — non-directors read direction from atom directly
- On director click: update atom + publish `BgAnimateMessage` via `room.localParticipant.publishData(..., { reliable: true })`
- Non-directors: controls remain hidden (guarded by `isDirector`), but direction indicator and progress bar still show from atom

---

### 6. `$sceneId.tsx` (stage route) changes

- Pass `room` to `BgPanningTool`
- Remove `leftProgress`, `rightProgress`, `activeDirection` props from `BgPanningTool` usage

---

## Data Flow

```
Director clicks BgPanningTool
  → writes bgPanningAtom { direction, speed }
  → publishes bg:animate via LiveKit

Other participants' StageComponent receives bg:animate
  → writes bgPanningAtom { direction, speed }

All clients (including director):
  StageComponent useEffect on bgPanningAtom
    → bg.setAnimation(direction, speed)
    → app.ticker drives container.x each frame
      → publishMove() throttled at 30ms (director / canDrag clients only)
      → onPositionChange fires (all clients, throttled separately)
          → bgProgressAtom updated
          → BgPanningTool progress bar updates
```

---

## Constraints & Limitations

- **Late joiners**: A participant who joins mid-animation won't receive the `bg:animate` message and won't see the animation until the director changes state. Acceptable for v1.
- **Clamp stops animation**: When `container.x` hits the clamp boundary, the background stops moving visually but the ticker continues. The background simply stays at the edge.
- **One background per scene**: Enforced by the data model. `setAnimation` is called on the first (and only) background found in `propsRef`.
- **No inline styles**: All UI changes in `BgPanningTool` use Tailwind classes only.
