# Background Panning Animation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add director-controlled continuous background panning animation (left/right, 1x/2x/3x speed) that propagates to all LiveKit participants as smooth, locally-driven PixiJS ticker animation via a dedicated `bg:animate` data message, with drag blocked while animating.

**Architecture:** A new Jotai atom (`bgPanningAtom`) holds animation intent; a second atom (`bgProgressAtom`) holds display-only position progress. The director writes to `bgPanningAtom` via `BgPanningTool` and simultaneously publishes a `bg:animate` LiveKit message. Non-directors receive that message in `StageComponent` and write to the same atom. All clients run the ticker locally for smooth animation. `PixiBackground` gains a `setAnimation()` method and an `onPositionChange` callback. Drag is disabled while `speed > 0`.

**Tech Stack:** `jotai` (^2.19.0 — already installed), PixiJS `app.ticker`, LiveKit `room.localParticipant.publishData`, React hooks (`useAtom`, `useAtomValue`, `useSetAtom`)

**Spec:** `docs/superpowers/specs/2026-03-24-bg-panning-animation-design.md`

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/lib/bg-panning.atoms.ts` | **Create** | Jotai atoms for animation state and progress |
| `src/lib/livekit-messages.ts` | **Create** | Shared LiveKit message types (`PropMoveMessage`, `BgAnimateMessage`) |
| `src/components/draggable-background.component.tsx` | **Modify** | `setAnimation()` method, ticker logic, `onPositionChange` callback, drag guard |
| `src/components/draggable-character.component.tsx` | **Modify** | Import `PropMoveMessage` from shared `livekit-messages.ts` (remove local definition) |
| `src/components/stage.component.tsx` | **Modify** | Read atom, dispatch to PixiBackground, handle `bg:animate` messages, write progress atom |
| `src/components/bg-panning-tool.component.tsx` | **Modify** | Replace local state with atoms, add `room` prop, publish `bg:animate`, read progress atom |
| `src/routes/_app/stage/$sceneId.tsx` | **Modify** | Pass `room` to `BgPanningTool`, remove stale props |

---

## Chunk 1: Foundation — Shared Types + Atoms

### Task 1: Create shared LiveKit message types file

**Files:**
- Create: `src/lib/livekit-messages.ts`
- Modify: `src/components/draggable-character.component.tsx` (import from shared file)
- Modify: `src/components/draggable-background.component.tsx` (import from shared file)

- [ ] **Step 1: Create `src/lib/livekit-messages.ts`**

```ts
export interface PropMoveMessage {
  type: 'prop:move';
  castId: string;
  x: number;
  y: number;
  rotation: number;
  scaleX: number;
  indexZ: number;
}

export type BgDirection = 'left' | 'right' | null;
export type BgSpeed = 0 | 1 | 2 | 3;

export interface BgAnimateMessage {
  type: 'bg:animate';
  direction: BgDirection;
  speed: BgSpeed;
}

export type LiveKitMessage = PropMoveMessage | BgAnimateMessage;
```

- [ ] **Step 2: Update `draggable-character.component.tsx` to import from shared file**

Remove the `PropMoveMessage` interface definition from `draggable-character.component.tsx` and replace its definition with an import:

```ts
import type { PropMoveMessage } from '@/lib/livekit-messages';
```

Keep the `export type { PropMoveMessage }` re-export so existing imports from `draggable-character.component.tsx` continue to work without churn.

- [ ] **Step 3: Update `draggable-background.component.tsx` to import from shared file**

Replace:
```ts
import type { PixiCharacterProps, PropMoveMessage } from '@/components/draggable-character.component';
```
With:
```ts
import type { PropMoveMessage } from '@/lib/livekit-messages';
import type { PixiCharacterProps } from '@/components/draggable-character.component';
```

- [ ] **Step 4: Verify TypeScript compiles cleanly**

```bash
pnpm build
```

Expected: no type errors related to `PropMoveMessage`. Zero net change in runtime behaviour.

- [ ] **Step 5: Commit**

```bash
git add src/lib/livekit-messages.ts src/components/draggable-character.component.tsx src/components/draggable-background.component.tsx
git commit -m "refactor: extract LiveKit message types to shared livekit-messages.ts"
```

---

### Task 2: Create Jotai atoms

**Files:**
- Create: `src/lib/bg-panning.atoms.ts`

- [ ] **Step 1: Create `src/lib/bg-panning.atoms.ts`**

```ts
import { atom } from 'jotai';
import type { BgDirection, BgSpeed } from '@/lib/livekit-messages';

export const bgPanningAtom = atom<{ direction: BgDirection; speed: BgSpeed }>({
  direction: null,
  speed: 0,
});

export const bgProgressAtom = atom({ leftProgress: 0, rightProgress: 0 });
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
pnpm build
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/bg-panning.atoms.ts
git commit -m "feat: add bgPanningAtom and bgProgressAtom for animation state"
```

---

## Chunk 2: PixiBackground Animation Engine

### Task 3: Add `setAnimation()` and ticker logic to `PixiBackground`

**Files:**
- Modify: `src/components/draggable-background.component.tsx`

This task adds the animation capability to `PixiBackground`. No React changes yet — just the PixiJS class.

- [ ] **Step 1: Add new imports and types to `draggable-background.component.tsx`**

Add to the top of the file (after existing imports):

```ts
import type { Ticker } from 'pixi.js';
import type { BgDirection, BgSpeed } from '@/lib/livekit-messages';
```

Also add `onPositionChange` to `PixiCharacterProps` by extending the props interface. Since `PixiCharacterProps` is defined in `draggable-character.component.tsx`, add the prop there:

In `draggable-character.component.tsx`, add to `PixiCharacterProps`:
```ts
onPositionChange?: (x: number, bounds: { minX: number; maxX: number }) => void;
```

- [ ] **Step 2: Add private fields to `PixiBackground`**

Inside the `PixiBackground` class, add these private fields after `private lastSendTime = 0;`:

```ts
private animationSpeed: BgSpeed = 0;
private animationDirection: BgDirection = null;
private animationTicker: ((ticker: Ticker) => void) | null = null;
private lastProgressTime = 0;
```

- [ ] **Step 3: Add `setAnimation()` method**

Add the following method to `PixiBackground` (before `updateSpeaking`):

```ts
setAnimation(direction: BgDirection, speed: BgSpeed) {
  // Always remove existing ticker first to prevent duplicate adds
  if (this.animationTicker) {
    this.props.app.ticker.remove(this.animationTicker);
    this.animationTicker = null;
  }

  this.animationSpeed = speed;
  this.animationDirection = direction;

  if (speed === 0 || direction === null) {
    // Re-enable drag
    this.sprite.eventMode = this.props.canDrag ? 'static' : 'none';
    this.sprite.cursor = this.props.canDrag ? 'pointer' : 'default';
    return;
  }

  // Disable drag while animating
  this.sprite.eventMode = 'none';
  this.sprite.cursor = 'default';

  const pxPerFrame = speed === 1 ? 2 : speed === 2 ? 4 : 8;
  const delta = direction === 'left' ? -pxPerFrame : pxPerFrame;

  this.animationTicker = (ticker: Ticker) => {
    const rawX = this.container.x + delta * ticker.deltaTime;
    this.container.x = this.clampX(rawX);

    // Publish position to remote participants (director/canDrag only, throttled)
    this.publishMove();

    // Update progress for all clients (throttled independently)
    const now = Date.now();
    if (now - this.lastProgressTime >= 30) {
      this.lastProgressTime = now;
      const { stageWidth = 1280 } = this.props;
      const halfW = this.sprite.width / 2;
      const minX = stageWidth - halfW;
      const maxX = halfW;
      this.props.onPositionChange?.(this.container.x, { minX, maxX });
    }
  };

  this.props.app.ticker.add(this.animationTicker);
}
```

- [ ] **Step 4: Add drag guard to `onPointerDown` and `onStagePointerMove`**

In `onPointerDown`, add at the very start of the method body:

```ts
if (this.animationSpeed > 0) return;
```

In `onStagePointerMove`, the existing first guard is `if (!this.props.canDrag) return;`. Add after it:

```ts
if (this.animationSpeed > 0) return;
```

- [ ] **Step 5: Update `destroy()` to clean up ticker**

In the `destroy()` method, add before `this.container.destroy(...)`:

```ts
if (this.animationTicker) {
  this.props.app.ticker.remove(this.animationTicker);
  this.animationTicker = null;
}
```

- [ ] **Step 6: Verify TypeScript compiles**

```bash
pnpm build
```

Expected: no errors. The method exists but nothing calls it yet.

- [ ] **Step 7: Commit**

```bash
git add src/components/draggable-background.component.tsx src/components/draggable-character.component.tsx
git commit -m "feat: add setAnimation() ticker logic and drag guard to PixiBackground"
```

---

## Chunk 3: StageComponent — Atom wiring + LiveKit handler

### Task 4: Wire `bgPanningAtom` to `PixiBackground` in `StageComponent`

**Files:**
- Modify: `src/components/stage.component.tsx`

- [ ] **Step 1: Add Jotai imports to `stage.component.tsx`**

```ts
import { useAtomValue, useSetAtom } from 'jotai';
import { bgPanningAtom, bgProgressAtom } from '@/lib/bg-panning.atoms';
```

Also add the new message type import:

```ts
import type { LiveKitMessage } from '@/lib/livekit-messages';
```

- [ ] **Step 2: Add atom hooks at the top of `StageComponent`**

Inside `StageComponent` function body, after the existing `useState` for `allLoaded`, add:

```ts
const bgPanning = useAtomValue(bgPanningAtom);
const setBgPanning = useSetAtom(bgPanningAtom);
const setBgProgress = useSetAtom(bgProgressAtom);
```

- [ ] **Step 3: Add effect to drive `setAnimation()` when atom changes**

Add this `useEffect` after the speaking-glow effect:

```ts
useEffect(() => {
  for (const prop of propsRef.current.values()) {
    if (prop instanceof PixiBackground) {
      prop.setAnimation(bgPanning.direction, bgPanning.speed);
      break; // one background per scene
    }
  }
}, [bgPanning]);
```

- [ ] **Step 4: Add `onPositionChange` callback when constructing `PixiBackground`**

In the existing cast-sync `useEffect`, find where `PixiBackground` is constructed:

```ts
const prop = new PropClass({
  ...
  onReady: () => { ... },
});
```

Add `onPositionChange` to the `PixiBackground` construction (wrap the `new PropClass(...)` call to conditionally add it when `cast.type === 'background'`):

```ts
const prop = new PropClass({
  sceneCastId: cast.sceneCastId,
  castId: cast.castId,
  src: cast.path,
  userId: cast.userId,
  type: cast.type,
  initialX: cast.posX ?? 100 + i * 200,
  initialY: cast.posY ?? 100,
  initialRotation: cast.rotation ?? 0,
  initialScaleX: cast.scaleX ?? 1,
  room,
  canDrag,
  stageWidth,
  stageHeight,
  app,
  onReady: () => {
    remaining -= 1;
    if (remaining === 0) setAllLoaded(true);
  },
  ...(cast.type === 'background' && {
    onPositionChange: (x: number, bounds: { minX: number; maxX: number }) => {
      const range = bounds.maxX - bounds.minX;
      if (range <= 0) return;
      const rightProgress = Math.round(((x - bounds.minX) / range) * 100);
      setBgProgress({ leftProgress: 100 - rightProgress, rightProgress });
    },
  }),
});
```

- [ ] **Step 5: Reset atoms on scene switch and on unmount**

The casts sync `useEffect` fires on any dependency change including `stageWidth`/`stageHeight` (window resize). Resetting inside it would abort animation on resize. Instead, use a separate `useEffect` that tracks the cast identity set:

Add a ref to track the previous cast id set (above the existing `useEffect` hooks):

```ts
const prevCastIdsRef = useRef<string>('');
```

Add a dedicated reset `useEffect` (after the `bgPanning` effect added in Step 3):

```ts
useEffect(() => {
  const castKey = casts.map((c) => c.sceneCastId).sort().join(',');
  if (castKey !== prevCastIdsRef.current) {
    prevCastIdsRef.current = castKey;
    setBgPanning({ direction: null, speed: 0 });
    setBgProgress({ leftProgress: 0, rightProgress: 0 });
  }
}, [casts, setBgPanning, setBgProgress]);
```

Add a cleanup `useEffect` for full unmount:

```ts
useEffect(() => {
  return () => {
    setBgPanning({ direction: null, speed: 0 });
    setBgProgress({ leftProgress: 0, rightProgress: 0 });
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);
```

- [ ] **Step 6: Extend `DataReceived` handler for `bg:animate` messages**

In the existing `DataReceived` `useEffect`, update the handler to dispatch `bg:animate`:

```ts
const onDataReceived = (payload: Uint8Array) => {
  let msg: LiveKitMessage;
  try {
    msg = JSON.parse(decoder.decode(payload)) as LiveKitMessage;
  } catch {
    return;
  }
  if (msg.type === 'prop:move') {
    castIdMapRef.current.get(msg.castId)?.applyRemoteMove(msg);
  } else if (msg.type === 'bg:animate') {
    setBgPanning({ direction: msg.direction, speed: msg.speed });
  }
};
```

Note: `setBgPanning` is captured at the component top level (Step 2) and is stable across renders — safe to use inside the closure.

- [ ] **Step 7: Verify TypeScript compiles**

```bash
pnpm build
```

Expected: no errors.

- [ ] **Step 8: Commit**

```bash
git add src/components/stage.component.tsx
git commit -m "feat: wire bgPanningAtom to PixiBackground setAnimation in StageComponent"
```

---

## Chunk 4: BgPanningTool — Atom-backed state + LiveKit publish

### Task 5: Refactor `BgPanningTool` to use atoms and publish `bg:animate`

**Files:**
- Modify: `src/components/bg-panning-tool.component.tsx`

- [ ] **Step 1: Update imports in `bg-panning-tool.component.tsx`**

Replace the existing import block with:

```ts
import { useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  MoveHorizontal,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { useAtom, useAtomValue } from "jotai";
import type { Room } from "livekit-client";
import { cn } from "@/lib/cn";
import { bgPanningAtom, bgProgressAtom } from "@/lib/bg-panning.atoms";
import type { BgDirection, BgSpeed } from "@/lib/livekit-messages";
```

Note: `useState` is removed — state now lives in atoms.

- [ ] **Step 2: Update the component props interface**

Replace the `BgPanningToolProps` interface:

```ts
interface BgPanningToolProps {
  isDirector: boolean;
  room?: Room | null;
}
```

(Remove `leftProgress`, `rightProgress`, `activeDirection` — these now come from atoms.)

- [ ] **Step 3: Update the component function signature and body**

Replace the component function:

```ts
const encoder = new TextEncoder();

export function BgPanningTool({ isDirector, room }: BgPanningToolProps) {
  const [{ direction, speed }, setBgPanning] = useAtom(bgPanningAtom);
  const { leftProgress, rightProgress } = useAtomValue(bgProgressAtom);

  const publishAnimate = useCallback(
    (nextDirection: BgDirection, nextSpeed: BgSpeed) => {
      if (!room) return;
      room.localParticipant.publishData(
        encoder.encode(
          JSON.stringify({ type: 'bg:animate', direction: nextDirection, speed: nextSpeed }),
        ),
        { reliable: true },
      );
    },
    [room],
  );

  const handleClick = useCallback(
    (btn: "left" | "right") => {
      let nextDirection: BgDirection;
      let nextSpeed: BgSpeed;

      if (direction === btn) {
        const next = ((speed + 1) % 4) as BgSpeed;
        nextSpeed = next;
        nextDirection = next === 0 ? null : btn;
      } else if (direction !== null) {
        const next = (speed - 1) as BgSpeed;
        nextSpeed = next;
        nextDirection = next === 0 ? null : direction;
      } else {
        nextDirection = btn;
        nextSpeed = 1;
      }

      setBgPanning({ direction: nextDirection, speed: nextSpeed });
      publishAnimate(nextDirection, nextSpeed);
    },
    [direction, speed, setBgPanning, publishAnimate],
  );

  const handleStop = useCallback(() => {
    setBgPanning({ direction: null, speed: 0 });
    publishAnimate(null, 0);
  }, [setBgPanning, publishAnimate]);
```

- [ ] **Step 4: Update the JSX**

The existing JSX uses `direction` and `speed` local state — these now come from the atom. Replace the `return (...)` block:

```tsx
  return (
    <div className="flex flex-col gap-1">
      {isDirector && (
        <div className="border-base-300 bg-base-200 flex items-center overflow-hidden rounded-xl border shadow-lg">
          <button
            type="button"
            onClick={() => handleClick("left")}
            className={cn(
              "btn btn-sm btn-ghost border-base-300 gap-1 rounded-none border-r",
              direction === "left" && "text-primary",
            )}
          >
            {direction === "left" && speed > 0 ? (
              <>
                <ChevronsLeft className="size-4 animate-pulse" />
                {`${speed}x`}
              </>
            ) : (
              <ChevronLeft className="size-4" />
            )}
          </button>
          <button
            type="button"
            onClick={handleStop}
            className={cn(
              "hover:text-base-content flex min-w-13 items-center justify-center gap-1 px-3 py-1.5 text-center text-xs font-semibold tabular-nums transition-colors",
              direction && "cursor-pointer",
              direction ? "text-primary" : "text-base-content/60",
            )}
          >
            {direction === "left" ? (
              <div className="animate-wiggle">... animating left</div>
            ) : direction === "right" ? (
              <div className="animate-wiggle">animating right ...</div>
            ) : (
              <>
                background <MoveHorizontal className="size-3" />
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => handleClick("right")}
            className={cn(
              "btn btn-sm btn-ghost border-base-300 gap-1 rounded-none border-l",
              direction === "right" && "text-primary",
            )}
          >
            {direction === "right" && speed > 0 ? (
              <>
                {`${speed}x`}
                <ChevronsRight className="size-4 animate-pulse" />
              </>
            ) : (
              <ChevronRight className="size-4" />
            )}
          </button>
        </div>
      )}

      {/* Intentional: show the indicator only when actively animating.
          The always-visible static label from the original is replaced by
          atom-driven direction state, so showing it only when direction is
          set is the correct new behaviour for non-directors. */}
      {!isDirector && direction && (
        <div className="flex w-28 items-center justify-center gap-1 text-xs">
          background <MoveHorizontal className="size-2" />{" "}
        </div>
      )}

      <progress
        className={cn(
          "progress progress-primary min-w-1.5xl w-full transition-all",
          direction === "left" && "scale-x-[-1]",
        )}
        value={
          direction === "left"
            ? leftProgress
            : direction === "right"
              ? rightProgress
              : 0
        }
        max={100}
      />
    </div>
  );
}
```

Note: The `encoder` constant is moved to module scope (outside the function) — add it above the function definition:

```ts
const encoder = new TextEncoder();
```

- [ ] **Step 5: Verify TypeScript compiles**

```bash
pnpm build
```

Expected: no errors. The component no longer accepts `leftProgress`, `rightProgress`, or `activeDirection` props.

- [ ] **Step 6: Commit**

```bash
git add src/components/bg-panning-tool.component.tsx
git commit -m "feat: refactor BgPanningTool to use jotai atoms and publish bg:animate to LiveKit"
```

---

## Chunk 5: Stage Route — Pass `room` prop, clean up stale props

### Task 6: Update `$sceneId.tsx` to pass `room` and remove stale props

**Files:**
- Modify: `src/routes/_app/stage/$sceneId.tsx`

- [ ] **Step 1: Update the `BgPanningTool` usage in `StageShell`**

In `StageShell` (around line 265), find:

```tsx
<BgPanningTool
  leftProgress={0}
  rightProgress={0}
  isDirector={isDirector}
/>
```

Replace with:

```tsx
<BgPanningTool
  isDirector={isDirector}
  room={room}
/>
```

- [ ] **Step 2: Verify TypeScript compiles cleanly**

```bash
pnpm build
```

Expected: zero errors. No stale props, all required props satisfied.

- [ ] **Step 3: Commit**

```bash
git add src/routes/_app/stage/$sceneId.tsx
git commit -m "feat: pass room to BgPanningTool and remove stale progress props"
```

---

## Chunk 6: Manual Verification

### Task 7: End-to-end verification on the dev server

- [ ] **Step 1: Start dev server**

```bash
pnpm dev
```

- [ ] **Step 2: Open two browser tabs as different participants**

Tab A: log in as director, navigate to a scene with a background.
Tab B: log in as an actor (or open in incognito), join the same scene.

- [ ] **Step 3: Verify director controls appear only for director**

In Tab A (director): the three-button panning control bar is visible below the stage.
In Tab B (non-director): the control bar is hidden.

- [ ] **Step 4: Verify animation starts and propagates**

In Tab A: click the right arrow once. Expected:
- Button shows `1x` with animated chevrons
- Background begins panning right in Tab A
- Background begins panning right in Tab B at the same time (smooth, not jerky)
- Progress bar fills from left to right

- [ ] **Step 5: Verify speed cycling**

In Tab A: click the right arrow again. Expected: `2x`. Click again → `3x`. Click again → stops (back to 0). Verify both tabs reflect each change immediately.

- [ ] **Step 6: Verify drag is blocked during animation**

In Tab A: start animation at 1x. Try to drag the background — it should not respond. Stop animation. Drag should work again.

- [ ] **Step 7: Verify stop button**

Click the center stop button while animating — background stops, both tabs update, progress bar resets to 0.

- [ ] **Step 8: Verify scene switch resets animation**

Start animation in scene A. Switch to scene B via the scene navigator. Expected: animation does not carry over; progress bar resets to 0.

- [ ] **Step 9: Final commit if any minor fixes were applied during verification**

```bash
git add -p
git commit -m "fix: [describe any issues found during manual verification]"
```

---

## Summary

| Chunk | Tasks | Key deliverable |
|-------|-------|----------------|
| 1 | 1–2 | Shared types file + Jotai atoms |
| 2 | 3 | PixiBackground animation engine |
| 3 | 4 | StageComponent atom wiring + LiveKit handler |
| 4 | 5 | BgPanningTool atom-backed + publishes |
| 5 | 6 | Stage route prop cleanup |
| 6 | 7 | End-to-end manual verification |
