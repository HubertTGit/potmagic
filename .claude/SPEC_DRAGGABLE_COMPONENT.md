# Draggable Prop Spec

Documents the architecture of `src/components/draggable-character.component.tsx` — the PixiJS class that manages one character or background on the theater stage.

---

## Scene Graph Node

```
Container  ← pixiCharacter.container (position, rotation live here)
  ├── Graphics  ← glowGraphics (purple speaking border, drawn/cleared on demand)
  └── Sprite    ← the image (anchor at 0.5 = center pivot, scaleX flip for mirror)
```

Rotation and position are set on the `Container`; `scaleX` flip is set on the `Sprite` so it mirrors around its own center.

---

## Lifecycle

| Phase | What happens |
|-------|-------------|
| `constructor` | Builds the Container→Graphics+Sprite tree, registers the LiveKit `DataReceived` listener, kicks off `loadTexture()` |
| `loadTexture()` (async) | Calls `Assets.load(src)`, assigns texture, sets initial rotation/scaleX, pins background to canvas bottom, then calls `setupInteraction()` and `onReady()` |
| `setupInteraction()` | Sets `eventMode`/`cursor` on the sprite, attaches pointer listeners. Only runs if `canDrag = true` |
| `destroy()` | Removes the LiveKit listener, destroys the Container and all children |

---

## Interaction Model

Three pointer event handlers on the `Sprite`:

- **`pointerdown`** — records pointer ID + position in `activePointers` Map; if it's the first finger, starts drag and records offset; second finger cancels drag and begins gesture mode
- **`globalpointermove`** — fires for any pointer movement on the whole stage:
  - 1 pointer + `isDragging` → translate container, clamped to stage bounds
  - 2 pointers → computes angle delta (→ rotation) and midpoint delta (→ pan) against the *previous* position of just the moved pointer vs the stationary other pointer
- **`pointerup/pointerupoutside`** → removes pointer from Map; when all fingers lift, calls `persistPosition()`

Double-tap/click flips `sprite.scale.x *= -1` to mirror horizontally.

---

## Bounds Clamping

| Type | X clamp | Y clamp |
|------|---------|---------|
| `character` | `[0, stageWidth]` | `[0, stageHeight]` |
| `background` | `[stageWidth − halfW, halfW]` (horizontal pan only) | Locked to `stageHeight − sprite.height/2` (bottom) |

---

## Network Sync

`publishMove()` sends a `prop:move` JSON message via LiveKit unreliable data channel, throttled to max once per 30 ms (bypassed with `immediate = true` for discrete events like mirror).

Rotation is stored as **degrees on the wire**, converted to/from PixiJS **radians** at the boundary.

The `onDataReceived` handler listens for incoming `prop:move` messages from other participants and applies them imperatively to the container — no React state involved.

### Wire format (`PropMoveMessage`)

```ts
interface PropMoveMessage {
  type: 'prop:move';
  castId: string;
  x: number;
  y: number;
  rotation: number;  // degrees
  scaleX: number;
  indexZ: number;    // reserved, always 0
}
```

---

## Public API

Called by `StageComponent` (`src/components/stage.component.tsx`).

| Member | Type | Purpose |
|--------|------|---------|
| `container` | `Container` | PixiJS node added to `app.stage` |
| `updateSpeaking(bool)` | method | Show/hide purple glow border; no-ops if state unchanged |
| `applyRemoteMove(msg)` | method | Apply a remote position update directly |
| `saveCurrentPosition()` | method | Persist current x/y/rotation/scaleX to DB |
| `destroy()` | method | Clean up LiveKit listener + PixiJS objects |

---

## Key Implementation Notes

- **Not a React component** — plain TypeScript class; no hooks, no JSX
- `canDrag` is resolved by `StageComponent` (checks `session.user.id === userId || role === 'director'`) and passed in at construction time
- Backgrounds (`type === 'background'`) skip rotation, Y-movement, mirror, and glow — they only pan horizontally
- `bringToTop()` sets `container.zIndex = stage.children.length + 1` and calls `stage.sortChildren()` on mousedown/touchstart
- `glowGraphics` uses `Math.abs(w)` for width to handle negative `scaleX` (mirrored state)
