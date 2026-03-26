# Background Repeat Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a per-scene `backgroundRepeat` toggle that, when enabled, replaces the normal clamped-scroll `Sprite` with a `TilingSprite` so background panning loops indefinitely.

**Architecture:** DB column → server function → scene-detail toggle UI → stage prop chain → PixiBackground switches between `Sprite` (clamped, stops at boundary) and `TilingSprite` (tiles, runs until stop button). The toggle lives in `SceneBackgroundSection`; the tiling logic lives entirely in `PixiBackground`.

**Tech Stack:** Drizzle ORM, TanStack Start server functions, React 19, PixiJS `TilingSprite`, DaisyUI v5, react-i18next

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/db/schema.ts` | Modify | Add `backgroundRepeat` column to `scenes` |
| `src/db/migrations/0025_background_repeat.sql` | Create | Migration SQL |
| `src/lib/scenes.fns.ts` | Modify | Add `setSceneBackgroundRepeat`; add field to `getSceneDetail` + `getSceneStage` |
| `src/i18n/en.json` | Modify | Add `scene.repeat` key |
| `src/i18n/de.json` | Modify | Add `scene.repeat` key |
| `src/components/draggable-character.component.tsx` | Modify | Add `backgroundRepeat?` to `PixiCharacterProps` |
| `src/components/draggable-background.component.tsx` | Modify | TilingSprite support when `backgroundRepeat` is true |
| `src/components/scene-background-section.tsx` | Modify | Add repeat toggle UI |
| `src/routes/($lang)/_app/stories/$storyId/scenes/$sceneId.tsx` | Modify | Add `backgroundRepeatMutation`; pass new props |
| `src/routes/($lang)/_app/stage/$sceneId.tsx` | Modify | Thread `backgroundRepeat` through prop chain |
| `src/components/stage.component.tsx` | Modify | Accept + pass `backgroundRepeat` to `PixiBackground` |

---

## Task 1: DB Schema + Migration

**Files:**
- Modify: `src/db/schema.ts`
- Create: `src/db/migrations/0025_background_repeat.sql`

- [ ] **Step 1: Add column to schema**

In `src/db/schema.ts`, inside the `scenes` table object (after `soundAutoplay`):

```ts
soundAutoplay: boolean("sound_autoplay").default(true).notNull(),
backgroundRepeat: boolean("background_repeat").default(false).notNull(),
```

- [ ] **Step 2: Generate migration**

```bash
pnpm drizzle-kit generate
```

Expected: creates `src/db/migrations/0025_*.sql` containing:
```sql
ALTER TABLE "scenes" ADD COLUMN "background_repeat" boolean DEFAULT false NOT NULL;
```

If the auto-name is ugly, rename the file to `0025_background_repeat.sql` — Drizzle reads the `0025_` prefix, not the suffix.

- [ ] **Step 3: Apply migration**

```bash
pnpm drizzle-kit migrate
```

Expected: `✓ done` with no errors.

- [ ] **Step 4: Commit**

```bash
git add src/db/schema.ts src/db/migrations/
git commit -m "feat: add background_repeat column to scenes"
```

---

## Task 2: Server Functions

**Files:**
- Modify: `src/lib/scenes.fns.ts`

- [ ] **Step 1: Add `setSceneBackgroundRepeat` (after `setSceneSoundAutoplay`)**

```ts
export const setSceneBackgroundRepeat = createServerFn({ method: 'POST' })
  .inputValidator((input) =>
    z.object({ sceneId: z.string(), repeat: z.boolean() }).parse(input),
  )
  .handler(async ({ data }) => {
    await requireSceneOwner(data.sceneId);
    await db
      .update(scenes)
      .set({ backgroundRepeat: data.repeat })
      .where(eq(scenes.id, data.sceneId));
  });
```

- [ ] **Step 2: Expose `backgroundRepeat` in `getSceneDetail`**

In the `getSceneDetail` scene select (around line 80), add `backgroundRepeat` to the selected fields:

```ts
const [scene] = await db
  .select({
    id: scenes.id,
    title: scenes.title,
    order: scenes.order,
    storyId: scenes.storyId,
    backgroundId: scenes.backgroundId,
    soundId: scenes.soundId,
    soundAutoplay: scenes.soundAutoplay,
    backgroundRepeat: scenes.backgroundRepeat,
  })
  .from(scenes)
  .where(eq(scenes.id, data.sceneId));
```

Also add `backgroundRepeat` to the return value at the bottom of the handler:

```ts
return {
  scene,
  story: storyRow ? { ...storyRow, directorOnStage } : null,
  props: storyProps,
  assignedCast,
  availableActors,
  background: backgroundProp ?? null,
  sound: soundProp ?? null,
  soundAutoplay: scene.soundAutoplay,
  backgroundRepeat: scene.backgroundRepeat,
};
```

- [ ] **Step 3: Expose `backgroundRepeat` in `getSceneStage`**

In the `sceneWithBg` select (around line 360), add `backgroundRepeat`:

```ts
const [sceneWithBg] = await db
  .select({
    backgroundId: scenes.backgroundId,
    backgroundPosX: scenes.backgroundPosX,
    backgroundPosY: scenes.backgroundPosY,
    backgroundRotation: scenes.backgroundRotation,
    backgroundScaleX: scenes.backgroundScaleX,
    soundId: scenes.soundId,
    soundAutoplay: scenes.soundAutoplay,
    backgroundRepeat: scenes.backgroundRepeat,
  })
  .from(scenes)
  .where(eq(scenes.id, data.sceneId));
```

In the return statement at the bottom, add:

```ts
return {
  storyId: sceneRow.storyId,
  directorId: storyRow.directorId,
  directorName: storyRow.directorName ?? 'Director',
  status: storyRow.status,
  casts: allCasts,
  soundUrl: soundProp?.imageUrl ?? null,
  soundName: soundProp?.name ?? null,
  soundAutoplay: sceneWithBg?.soundAutoplay ?? false,
  backgroundRepeat: sceneWithBg?.backgroundRepeat ?? false,
};
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/scenes.fns.ts
git commit -m "feat: add setSceneBackgroundRepeat server fn; expose backgroundRepeat in stage/detail"
```

---

## Task 3: i18n Keys

**Files:**
- Modify: `src/i18n/en.json`
- Modify: `src/i18n/de.json`

- [ ] **Step 1: Add key to en.json**

After the `"scene.autoplay": "Autoplay"` line, add:

```json
"scene.repeat": "Repeat",
```

- [ ] **Step 2: Add key to de.json**

Find the equivalent location in `de.json` (after `"scene.autoplay"`) and add:

```json
"scene.repeat": "Wiederholen",
```

- [ ] **Step 3: Commit**

```bash
git add src/i18n/en.json src/i18n/de.json
git commit -m "feat: add scene.repeat i18n key"
```

---

## Task 4: PixiCharacterProps + PixiBackground TilingSprite

**Files:**
- Modify: `src/components/draggable-character.component.tsx`
- Modify: `src/components/draggable-background.component.tsx`

- [ ] **Step 1: Add `backgroundRepeat` to `PixiCharacterProps`**

In `src/components/draggable-character.component.tsx`, in the `PixiCharacterProps` interface, add after `onAnimationComplete?`:

```ts
backgroundRepeat?: boolean;
```

- [ ] **Step 2: Update `PixiBackground` — imports, fields, and constructor**

At the top of `src/components/draggable-background.component.tsx`, update the pixi.js import to include `TilingSprite`:

```ts
import { Assets, Container, Sprite, TilingSprite } from "pixi.js";
```

In the `PixiBackground` class, replace `private sprite: Sprite;` with:

```ts
private sprite: Sprite | null = null;
private tilingSprite: TilingSprite | null = null;
```

Update the constructor — remove the three lines that create and add the sprite (since `loadTexture` now handles sprite creation conditionally):

```ts
constructor(props: PixiCharacterProps) {
  this.props = props;

  this.container = new Container();
  this.container.label = props.sceneCastId;
  this.container.zIndex = 0;
  this.container.x = props.initialX ?? 100;
  this.container.y = props.initialY ?? 100;

  this.loadTexture();
}
```

- [ ] **Step 3: Update `loadTexture` — branch on `backgroundRepeat`**

Replace the existing `loadTexture` method:

```ts
private async loadTexture() {
  const { src, initialScaleX = 1, stageHeight = 720, stageWidth = 1280, app } = this.props;
  let texture: Texture;
  try {
    texture = await Assets.load(src);
  } catch {
    this.props.onReady?.();
    return;
  }

  this.blurFilter = new MotionBlurFilter({
    velocity: { x: 0, y: 0 },
    kernelSize: 9,
  });

  if (this.props.backgroundRepeat) {
    // --- Tiling mode ---
    this.tilingSprite = new TilingSprite({
      texture,
      width: stageWidth,
      height: texture.height,
    });
    this.tilingSprite.tilePosition.x = this.props.initialX ?? 0;
    this.tilingSprite.filters = [this.blurFilter];
    this.container.addChild(this.tilingSprite);
    this.container.x = 0;
    this.container.y = stageHeight - texture.height;
    this.container.zIndex = 0;
  } else {
    // --- Normal (clamped sprite) mode ---
    this.sprite = new Sprite();
    this.sprite.texture = texture;
    this.sprite.anchor.set(0.5);
    this.sprite.scale.x = initialScaleX;
    this.sprite.filters = [this.blurFilter];
    this.container.addChild(this.sprite);
    this.container.zIndex = 0;
    this.container.y = stageHeight - texture.height / 2;

    // Report initial position for progress bar
    const halfW = this.sprite.width / 2;
    const minX = stageWidth - halfW;
    const maxX = halfW;
    this.props.onPositionChange?.(this.container.x, { minX, maxX });
  }

  this.setupInteraction();
  this.props.onReady?.();

  if (app.stage.sortableChildren) app.stage.sortChildren();
}
```

- [ ] **Step 4: Update `setupInteraction` — attach events to whichever sprite exists**

The existing `setupInteraction` references `this.sprite` directly. Update it to use a helper:

```ts
private get activeSprite(): Sprite | TilingSprite | null {
  return this.sprite ?? this.tilingSprite;
}

private setupInteraction() {
  const { canDrag } = this.props;
  const s = this.activeSprite;
  if (!s) return;

  s.eventMode = canDrag ? "static" : "none";
  s.cursor = canDrag ? "pointer" : "default";

  if (!canDrag) return;

  s.on("pointerdown", this.onPointerDown.bind(this));
  s.on("pointerup", this.onPointerUp.bind(this));
  s.on("pointerupoutside", this.onPointerUp.bind(this));
  s.on("globalpointermove", this.onStagePointerMove.bind(this));
}
```

- [ ] **Step 5: Update `onPointerDown` — tiling mode doesn't need dragOffset**

```ts
private onPointerDown(e: FederatedPointerEvent) {
  if (this.animationSpeed > 0) return;
  this.activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

  if (this.activePointers.size === 1) {
    this.isDragging = true;
    this.lastDragX = e.global.x;
    if (!this.props.backgroundRepeat) {
      this.dragOffset = {
        x: this.container.x - e.global.x,
        y: this.container.y - e.global.y,
      };
    }
  } else {
    this.isDragging = false;
  }
}
```

- [ ] **Step 6: Update `onStagePointerMove` — tiling mode uses `tilePosition.x`**

Replace the existing `onStagePointerMove` method:

```ts
private onStagePointerMove(e: FederatedPointerEvent) {
  if (!this.props.canDrag) return;
  if (this.animationSpeed > 0) return;
  if (!this.activePointers.has(e.pointerId)) return;

  const prevStateMap = new Map(this.activePointers);
  this.activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

  if (this.activePointers.size === 2) {
    const currPointers = Array.from(this.activePointers.values());
    const prevPointers = Array.from(prevStateMap.values());
    if (prevPointers.length < 2) return;
    const newMid = getMidpoint(currPointers[0], currPointers[1]);
    const oldMid = getMidpoint(prevPointers[0], prevPointers[1]);
    const panDelta = newMid.x - oldMid.x;

    if (this.props.backgroundRepeat && this.tilingSprite) {
      this.tilingSprite.tilePosition.x += panDelta;
    } else {
      this.container.x += panDelta;
    }
    this.publishMove();
  } else if (this.isDragging && this.activePointers.size <= 1) {
    const dx = e.global.x - this.lastDragX;
    this.lastDragX = e.global.x;

    if (this.props.backgroundRepeat && this.tilingSprite) {
      this.tilingSprite.tilePosition.x += dx;
    } else {
      const rawX = e.global.x + this.dragOffset.x;
      this.container.x = this.clampX(rawX);
    }

    if (this.blurFilter && Math.abs(dx) > 0.5) {
      this.blurFilter.velocity = {
        x: Math.sign(dx) * DRAG_BLUR_STRENGTH,
        y: 0,
      };
    }
    this.publishMove();
  }
}
```

- [ ] **Step 7: Update `publishMove` — use `tilePosition.x` in repeat mode**

```ts
private publishMove(immediate = false, now = Date.now()) {
  const { room, canDrag, castId } = this.props;
  if (!room || !canDrag) return;
  if (!immediate && now - this.lastSendTime < 30) return;
  this.lastSendTime = now;

  const x = this.props.backgroundRepeat && this.tilingSprite
    ? this.tilingSprite.tilePosition.x
    : this.container.x;

  const msg: PropMoveMessage = {
    type: "prop:move",
    castId,
    x,
    y: this.container.y,
    rotation: 0,
    scaleX: 1,
    indexZ: 0,
  };
  this.props.room?.localParticipant.publishData(
    encoder.encode(JSON.stringify(msg)),
    { reliable: false },
  );
}
```

- [ ] **Step 8: Update `persistPosition` — use `tilePosition.x` in repeat mode**

```ts
private persistPosition() {
  if (!this.props.canDrag) return;
  const x = this.props.backgroundRepeat && this.tilingSprite
    ? this.tilingSprite.tilePosition.x
    : this.container.x;
  saveSceneCastPosition({
    data: {
      sceneCastId: this.props.sceneCastId,
      x,
      y: this.container.y,
      rotation: 0,
      scaleX: 1,
    },
  });
}
```

- [ ] **Step 9: Update `setAnimation` — tiling mode loops, no boundary stop**

Replace the `setAnimation` method:

```ts
setAnimation(direction: BgDirection, speed: BgSpeed) {
  if (this.animationTicker) {
    this.props.app.ticker.remove(this.animationTicker);
    this.animationTicker = null;
  }

  this.animationSpeed = speed;

  if (speed === 0 || direction === null) {
    if (this.blurFilter) this.blurFilter.velocity = { x: 0, y: 0 };
    const s = this.activeSprite;
    if (s) {
      s.eventMode = this.props.canDrag ? "static" : "none";
      s.cursor = this.props.canDrag ? "pointer" : "default";
    }
    return;
  }

  const s = this.activeSprite;
  if (s) {
    s.eventMode = "none";
    s.cursor = "default";
  }

  const pxPerFrame = BG_PAN_PX_PER_FRAME[speed as 1 | 2 | 3];
  const delta = direction === "left" ? -pxPerFrame : pxPerFrame;
  const blurStrength = BG_BLUR_STRENGTH[speed as 1 | 2 | 3];

  if (this.blurFilter) {
    this.blurFilter.velocity = {
      x: direction === "left" ? -blurStrength : blurStrength,
      y: 0,
    };
  }

  if (this.props.backgroundRepeat && this.tilingSprite) {
    // Repeat mode: tile position scrolls indefinitely, never stops at boundary
    this.animationTicker = (ticker: Ticker) => {
      this.tilingSprite!.tilePosition.x += delta * ticker.deltaTime;
      const now = Date.now();
      this.publishMove(false, now);
    };
  } else {
    // Normal mode: clamp to bounds, stop and notify when boundary reached
    this.animationTicker = (ticker: Ticker) => {
      const rawX = this.container.x + delta * ticker.deltaTime;
      const clampedX = this.clampX(rawX);
      this.container.x = clampedX;

      if (Math.abs(rawX - clampedX) > 1e-6) {
        this.props.app.ticker.remove(this.animationTicker!);
        this.animationTicker = null;
        this.animationSpeed = 0;
        if (this.blurFilter) this.blurFilter.velocity = { x: 0, y: 0 };
        if (this.sprite) {
          this.sprite.eventMode = this.props.canDrag ? "static" : "none";
          this.sprite.cursor = this.props.canDrag ? "pointer" : "default";
        }
        this.props.onAnimationComplete?.();
        return;
      }

      const now = Date.now();
      this.publishMove(false, now);

      if (now - this.lastProgressTime >= 60) {
        this.lastProgressTime = now;
        const { stageWidth = 1280 } = this.props;
        const halfW = this.sprite!.width / 2;
        const minX = stageWidth - halfW;
        const maxX = halfW;
        this.props.onPositionChange?.(this.container.x, { minX, maxX });
      }
    };
  }

  this.props.app.ticker.add(this.animationTicker);
}
```

- [ ] **Step 10: Update `applyRemoteMove` — tiling mode sets `tilePosition.x`**

```ts
applyRemoteMove(msg: PropMoveMessage) {
  if (this.props.backgroundRepeat && this.tilingSprite) {
    this.tilingSprite.tilePosition.x = msg.x;
  } else {
    this.container.x = msg.x;
  }
}
```

- [ ] **Step 11: Update `destroy` — also destroy tilingSprite**

The existing `destroy` calls `this.container.destroy({ children: true })` which destroys all children including `tilingSprite`. Just ensure `animationTicker` cleanup still works (it does — the pattern is unchanged):

```ts
destroy() {
  if (this.animationTicker) {
    this.props.app.ticker.remove(this.animationTicker);
    this.animationTicker = null;
  }
  this.container.destroy({ children: true });
}
```

No change needed here — `container.destroy({ children: true })` handles `tilingSprite` as a child.

- [ ] **Step 12: Commit**

```bash
git add src/components/draggable-character.component.tsx src/components/draggable-background.component.tsx
git commit -m "feat: PixiBackground TilingSprite support for backgroundRepeat mode"
```

---

## Task 5: Scene Background Section Toggle UI

**Files:**
- Modify: `src/components/scene-background-section.tsx`

- [ ] **Step 1: Add new props to the interface and component**

Replace the entire file with:

```tsx
import { PropPicker } from "@/components/prop-picker";
import { Trash2 } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

export type BackgroundProp = {
  id: string;
  name: string;
  imageUrl: string | null;
  type: "background";
};

interface SceneBackgroundSectionProps {
  isDirector: boolean;
  background: BackgroundProp | null;
  availableBackgrounds: BackgroundProp[];
  onAssignBackground: (bg: BackgroundProp | null) => void;
  isAssigning?: boolean;
  backgroundRepeat: boolean;
  onToggleRepeat: (repeat: boolean) => void;
}

export function SceneBackgroundSection({
  isDirector,
  background,
  availableBackgrounds,
  onAssignBackground,
  isAssigning,
  backgroundRepeat,
  onToggleRepeat,
}: SceneBackgroundSectionProps) {
  const { t } = useLanguage();
  const picker =
    (isDirector && availableBackgrounds.length > 0) || background ? (
      <PropPicker
        isLoading={isAssigning}
        propId={background?.id ?? null}
        propName={background?.name ?? null}
        propImageUrl={background?.imageUrl ?? null}
        propType={background ? "background" : null}
        availableProps={availableBackgrounds}
        placeholder={background ? t('scene.changeBackground') : t('scene.assignBackground')}
        readOnly={!isDirector}
        onAssign={(propId) => {
          const bg = propId
            ? (availableBackgrounds.find((b) => b.id === propId) ?? null)
            : null;
          onAssignBackground(bg);
        }}
      />
    ) : null;

  return (
    <div className="mb-8">
      <h2 className="text-base-content/40 mb-3 text-xs font-semibold tracking-widest uppercase">
        {t('scene.background')}
      </h2>

      <div className="bg-base-200 border-base-300 flex items-center justify-between rounded-lg border px-4 py-3">
        {picker ?? (
          <span className="text-base-content/40 text-sm">
            {t('scene.noBackgroundInLibrary')}
          </span>
        )}

        {isDirector && background && (
          <div className="flex shrink-0 items-center gap-3">
            <label className="flex cursor-pointer items-center gap-2 select-none">
              <span className="text-base-content/50 text-xs">{t('scene.repeat')}</span>
              <input
                type="checkbox"
                className="toggle toggle-sm toggle-success"
                checked={backgroundRepeat}
                onChange={(e) => onToggleRepeat(e.target.checked)}
              />
            </label>
            <button
              onClick={() => onAssignBackground(null)}
              className="text-error/60 hover:text-error hover:bg-error/10 flex items-center gap-1 rounded-lg p-2 text-xs transition-colors"
              title={t('aria.removeBackground')}
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/scene-background-section.tsx
git commit -m "feat: add repeat toggle to SceneBackgroundSection"
```

---

## Task 6: Scene Detail Page Wiring

**Files:**
- Modify: `src/routes/($lang)/_app/stories/$storyId/scenes/$sceneId.tsx`

- [ ] **Step 1: Import `setSceneBackgroundRepeat`**

Add to the existing import block for `@/lib/scenes.fns`:

```ts
import {
  getSceneDetail,
  updateSceneTitle,
  removeSceneCast,
  getSceneNavigation,
  assignSceneBackground,
  assignSceneSound,
  setSceneSoundAutoplay,
  setSceneBackgroundRepeat,
  addActorToScene,
  assignSceneProp,
} from '@/lib/scenes.fns';
```

- [ ] **Step 2: Add `backgroundRepeatMutation`**

After the `autoplayMutation` declaration (around line 196), add:

```ts
const backgroundRepeatMutation = useMutation({
  mutationFn: (repeat: boolean) =>
    setSceneBackgroundRepeat({ data: { sceneId, repeat } }),
  onSuccess: invalidate,
});
```

- [ ] **Step 3: Pass new props to `SceneBackgroundSection`**

Update the `<SceneBackgroundSection>` JSX (around line 305):

```tsx
<SceneBackgroundSection
  isDirector={isDirector}
  background={background}
  availableBackgrounds={availableBackgrounds}
  onAssignBackground={handleAssignBackground}
  isAssigning={assignBgMutation.isPending}
  backgroundRepeat={data?.backgroundRepeat ?? false}
  onToggleRepeat={(repeat) => backgroundRepeatMutation.mutate(repeat)}
/>
```

- [ ] **Step 4: Commit**

```bash
git add src/routes/\(\$lang\)/_app/stories/\$storyId/scenes/\$sceneId.tsx
git commit -m "feat: wire backgroundRepeat mutation in scene detail page"
```

---

## Task 7: Stage Route + StageComponent

**Files:**
- Modify: `src/routes/($lang)/_app/stage/$sceneId.tsx`
- Modify: `src/components/stage.component.tsx`

- [ ] **Step 1: Add `backgroundRepeat` to `StageComponentProps`**

In `src/components/stage.component.tsx`, update the `StageComponentProps` interface:

```ts
interface StageComponentProps {
  casts: StageCast[];
  room?: Room | null;
  speakingIds?: Set<string>;
  stageWidth?: number;
  stageHeight?: number;
  backgroundRepeat?: boolean;
}
```

And update the destructure in the component function:

```ts
function StageComponent(
  {
    casts,
    room,
    speakingIds = new Set(),
    stageWidth = STAGE_WIDTH,
    stageHeight = STAGE_HEIGHT,
    backgroundRepeat = false,
  },
  ref,
```

- [ ] **Step 2: Pass `backgroundRepeat` to `PixiBackground` in the cast loop**

In the `new PropClass({...})` call where `cast.type === 'background'` spreads extra props, add `backgroundRepeat`:

```ts
...(cast.type === 'background' && {
  backgroundRepeat,
  onPositionChange: (x: number, bounds: { minX: number; maxX: number }) => {
    const range = bounds.maxX - bounds.minX;
    if (range <= 0) return;
    const rightProgress = Math.round(((x - bounds.minX) / range) * 100);
    setBgProgress({ leftProgress: 100 - rightProgress, rightProgress });
  },
  onAnimationComplete: () => {
    setBgPanning({ direction: null, speed: 0 });
    if (room && canDrag) {
      room.localParticipant.publishData(
        encoder.encode(JSON.stringify({ type: 'bg:animate', direction: null, speed: 0 })),
        { reliable: true },
      );
    }
  },
}),
```

- [ ] **Step 3: Thread `backgroundRepeat` through the stage route**

In `src/routes/($lang)/_app/stage/$sceneId.tsx`:

**a) Add to `StageContentProps` interface (around line 57):**

```ts
interface StageContentProps {
  sceneId: string;
  casts: StageCast[];
  directorId: string;
  directorName: string;
  storyId: string;
  status: StoryStatus;
  isSwitching: boolean;
  soundUrl: string | null;
  soundName: string | null;
  soundAutoplay: boolean;
  backgroundRepeat: boolean;
}
```

**b) Add to `StageShellProps` (extends `StageContentProps` — no extra change needed).**

**c) Destructure in `LiveStageContent`, `OfflineStageContent`, and `StageShell`:**

Add `backgroundRepeat` to the destructure parameter in each function and pass it down:

In `LiveStageContent` (line ~71), add `backgroundRepeat` to destructure and pass to `StageShell`:
```ts
function LiveStageContent({ ..., backgroundRepeat }: StageContentProps) {
  ...
  return (
    <>
      <RoomAudioRenderer />
      <StageShell
        ...
        backgroundRepeat={backgroundRepeat}
      />
    </>
  );
}
```

In `OfflineStageContent` (line ~130), same pattern:
```ts
function OfflineStageContent({ ..., backgroundRepeat }: StageContentProps) {
  return (
    <StageShell
      ...
      backgroundRepeat={backgroundRepeat}
    />
  );
}
```

In `StageShell` (line ~174), add `backgroundRepeat` to destructure and pass to `StageComponent`:
```ts
function StageShell({ ..., backgroundRepeat }: StageShellProps) {
  ...
  <StageComponent casts={casts} room={room} speakingIds={speakingIds} backgroundRepeat={backgroundRepeat} />
  ...
}
```

**d) Extract `backgroundRepeat` from query data in `SceneStagePage`:**

After the `soundAutoplay` line (~354):
```ts
const backgroundRepeat = data?.backgroundRepeat ?? false;
```

Pass it to `LiveStageContent` and `OfflineStageContent`:
```tsx
<LiveStageContent
  ...
  soundAutoplay={soundAutoplay}
  backgroundRepeat={backgroundRepeat}
/>
```
```tsx
<OfflineStageContent
  ...
  soundAutoplay={soundAutoplay}
  backgroundRepeat={backgroundRepeat}
/>
```

- [ ] **Step 4: Commit**

```bash
git add src/components/stage.component.tsx src/routes/\(\$lang\)/_app/stage/\$sceneId.tsx
git commit -m "feat: pass backgroundRepeat through stage route and StageComponent to PixiBackground"
```

---

## Verification

- [ ] Start dev server: `pnpm dev`
- [ ] Create (or open) a scene, assign a background — the "Repeat" toggle appears next to the trash button
- [ ] Toggle "Repeat" on — DB updates (no error toast)
- [ ] Enter stage — the background should fill the full stage width (TilingSprite)
- [ ] Pan left or right — texture tiles seamlessly with no visible hard edge; panning runs indefinitely
- [ ] Click the stop button in the center of `BgPanningTool` — animation halts
- [ ] Toggle "Repeat" off, re-enter stage — normal Sprite; panning clamps and auto-stops at boundary
- [ ] Confirm actor client (non-drag) receives and applies remote `prop:move` messages correctly (position syncs visually)
- [ ] Check TS: `pnpm build` — no type errors
