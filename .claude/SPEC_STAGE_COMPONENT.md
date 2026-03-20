# Stage Component Spec

Documents the architecture of `src/components/stage.component.tsx` — the React wrapper that owns the PixiJS canvas and manages all characters on the theater stage.

---

## Responsibility

`StageComponent` is the bridge between React (data, session, LiveKit room) and PixiJS (imperative canvas rendering). It:

- Owns and initialises the PixiJS `Application`
- Creates/destroys `PixiCharacter` instances as the scene cast changes
- Resolves per-character drag permission from the current session
- Keeps speaking glows in sync with LiveKit audio state
- Shows a loading spinner until all character textures are ready

---

## Exports

| Export | Purpose |
|--------|---------|
| `StageComponent` | The React component (forwardRef → `HTMLDivElement`) |
| `StageCast` | Interface describing one row from `getSceneStage` |

### `StageCast` shape

```ts
interface StageCast {
  sceneCastId: string;   // PK of sceneCast row
  castId: string;        // PK of cast row (used as LiveKit message key)
  userId: string;        // owner — matched against session to grant drag
  path: string | null;   // Vercel Blob URL for the image asset
  type: PropType | null; // 'character' | 'background' | 'animation' | 'sound'
  posX: number | null;   // last persisted X
  posY: number | null;   // last persisted Y
  rotation: number | null;
  scaleX: number | null;
}
```

---

## Props

| Prop | Type | Default | Notes |
|------|------|---------|-------|
| `casts` | `StageCast[]` | required | Scene cast from server |
| `room` | `Room \| null` | `undefined` | LiveKit room for data sync |
| `speakingIds` | `Set<string>` | `new Set()` | Set of `userId`s currently speaking |
| `stageWidth` | `number` | `1280` | Canvas width in px |
| `stageHeight` | `number` | `720` | Canvas height in px |

Ref type: `HTMLDivElement` (the outer wrapper div — used by the stage route for `querySelector('canvas')` to capture the broadcast stream).

---

## Internal Refs

| Ref | Type | Purpose |
|-----|------|---------|
| `containerRef` | `HTMLDivElement` | PixiJS appends `app.canvas` here after init |
| `appRef` | `Application \| null` | PixiJS Application instance |
| `charactersRef` | `Map<string, PixiCharacter>` | Active characters keyed by `sceneCastId` |
| `appReadyRef` | `boolean` | Guards cast sync until canvas is appended |

---

## Effects

### 1 — ForwardRef sync (no deps, runs every render)
Writes `containerRef.current` into the forwarded ref (supports both callback and object ref forms).

### 2 — PixiJS init (runs once on mount)

```
new Application() → app.init({ width, height, backgroundAlpha: 0, antialias, preference: 'webgl' })
  → app.stage.sortableChildren = true
  → app.stage.eventMode = 'static'
  → app.stage.hitArea = app.screen   ← full canvas receives pointer events
  → container.appendChild(app.canvas)
  → appReadyRef.current = true
```

**Unmount-race guard** — two closure flags (`unmounted`, `initDone`) prevent calling `app.destroy()` before `init()` completes (which would throw `_cancelResize is not a function` from the ResizePlugin):

- If unmount races init → `unmounted = true`; the `.then()` callback checks the flag and destroys safely once init finishes.
- If unmount happens after init → `initDone = true`; cleanup destroys immediately.

### 3 — Cast sync (deps: `casts`, `room`, `session`, `stageWidth`, `stageHeight`)

Runs a `sync()` function that retries via `requestAnimationFrame` until `appReadyRef` is true, then:

1. **Remove** stale characters (sceneCastId no longer in `casts`) — saves position, destroys, removes from stage.
2. **Diff** — skips sceneCastIds already in `charactersRef`.
3. **Create** new `PixiCharacter` for each new cast member with:
   - `canDrag = session.user.id === userId || role === 'director'`
   - Fallback initial position: `x = 100 + index * 200`, `y = 100`
   - `onReady` callback that decrements a counter and sets `allLoaded = true` when all textures finish loading
4. Adds each new character's `container` to `app.stage`.

### 4 — Speaking glow (deps: `speakingIds`, `casts`)

Iterates `charactersRef` and calls `char.updateSpeaking(bool)` for each — matches character to cast via `char.container.label` (= `sceneCastId`). Runs separately from cast sync so glows update without recreating sprites.

### 5 — Persist on unmount (no deps)

Captures `charactersRef.current` at effect setup time and calls `char.saveCurrentPosition()` for all characters on unmount.

---

## Render

```tsx
<div className="relative w-7xl h-180 overflow-hidden">
  {/* Loading spinner — shown until all textures resolve */}
  {!allLoaded && (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-base-200">
      <span className="loading loading-spinner loading-lg text-primary" />
    </div>
  )}
  {/* PixiJS appends <canvas> here */}
  <div ref={containerRef} className="w-full h-full" />
</div>
```

The `<canvas>` is a direct DOM child of `containerRef` — not rendered by React. The outer div dimensions (`1280 × 720`) act as the clip region.

---

## Drag Permission Logic

Resolved in the cast sync effect, not in `PixiCharacter`:

```ts
const canDrag = session?.user?.id === cast.userId   // actor owns this character
             || session?.user?.role === 'director';  // director can move anything
```

Passed to `PixiCharacter` at construction time and baked into the sprite's `eventMode`.

---

## Canvas Stream Capture (stage route)

The stage route (`src/routes/_app/stage/$sceneId.tsx`) captures the canvas for LiveKit broadcast using:

```ts
const canvas = stageWrapperRef.current?.querySelector('canvas');
canvas.captureStream(30);
```

This works because PixiJS appends a real `<canvas>` DOM element inside `containerRef`. The stage route wraps `StageComponent` in its own `stageWrapperRef` div — no ref forwarding needed for this.

---

## Related Files

| File | Role |
|------|------|
| `src/components/draggable-character.component.tsx` | `PixiCharacter` class — see `.claude/SPEC_DRAGGABLE_COMPONENT.md` |
| `src/routes/_app/stage/$sceneId.tsx` | Consumer — passes `casts`, `room`, `speakingIds`; captures canvas stream |
| `src/lib/scenes.fns.ts` | `getSceneStage` returns `StageCast[]`; `saveSceneCastPosition` persists positions |
