import { Assets, Container, Sprite, TilingSprite } from "pixi.js";
import type { FederatedPointerEvent, Texture, Ticker } from "pixi.js";
import { MotionBlurFilter } from "pixi-filters";
import { saveSceneCastPosition } from "@/lib/scenes.fns";
import type {
  PropMoveMessage,
  BgDirection,
  BgSpeed,
} from "@/lib/livekit-messages";
import type { PixiCharacterProps } from "@/components/draggable-character.component";

const encoder = new TextEncoder();

const enum ANIMATION_SPEED {
  slow = 1,
  medium = 3,
  fast = 6,
}

const BG_PAN_PX_PER_FRAME: Record<1 | 2 | 3, ANIMATION_SPEED> = {
  1: ANIMATION_SPEED.slow,
  2: ANIMATION_SPEED.medium,
  3: ANIMATION_SPEED.fast,
};

const BG_BLUR_STRENGTH: Record<1 | 2 | 3, number> = {
  1: 0,
  2: 6,
  3: 12,
};

const DRAG_BLUR_STRENGTH = 10;

function getMidpoint(a: { x: number; y: number }, b: { x: number; y: number }) {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

export class PixiBackground {
  readonly container: Container;
  private sprite: Sprite | null = null;
  private tilingSprite: TilingSprite | null = null;
  private readonly props: PixiCharacterProps;

  private isDragging = false;
  private dragOffset = { x: 0, y: 0 };
  private lastDragX = 0;
  private activePointers = new Map<number, { x: number; y: number }>();
  private lastSendTime = 0;
  private animationSpeed: BgSpeed = 0;
  private animationTicker: ((ticker: Ticker) => void) | null = null;
  private lastProgressTime = 0;
  private blurFilter!: MotionBlurFilter;

  constructor(props: PixiCharacterProps) {
    this.props = props;

    this.container = new Container();
    this.container.label = props.sceneCastId;
    this.container.zIndex = 0;
    this.container.x = props.initialX ?? 100;
    this.container.y = props.initialY ?? 100;

    this.loadTexture();
  }

  private get activeSprite(): Sprite | TilingSprite | null {
    return this.tilingSprite ?? this.sprite;
  }

  private async loadTexture() {
    const { src, initialScaleX = 1, stageHeight = 720, stageWidth = 1280, app } = this.props;
    let texture: Texture;
    try {
      texture = await Assets.load(src);
    } catch {
      this.props.onReady?.();
      return;
    }

    // Guard: destroy() may have been called while the asset was loading
    if (this.container.destroyed) return;

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
      // initialX stores the persisted tilePosition.x offset (saved via backgroundPosX).
      // Note: if a scene is toggled back to non-repeat mode, the persisted value is a
      // tile offset, not a stage-space X — it will be overwritten on the next drag/stop.
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

  get canDrag() {
    return this.props.canDrag;
  }

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

  private onPointerUp(e: FederatedPointerEvent) {
    this.activePointers.delete(e.pointerId);

    if (this.activePointers.size === 0) {
      this.isDragging = false;
      if (this.blurFilter) this.blurFilter.velocity = { x: 0, y: 0 };
      this.persistPosition();
    }
  }

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

  private clampX(x: number): number {
    const { stageWidth = 1280 } = this.props;
    if (!this.sprite) return x;
    const halfW = this.sprite.width / 2;
    const minX = stageWidth - halfW;
    const maxX = halfW;
    return maxX > minX ? Math.min(Math.max(x, minX), maxX) : x;
  }

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
      this.persistPosition();
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

  // No-op — backgrounds do not have a speaking glow
  updateSpeaking(_isSpeaking: boolean) {}

  applyRemoteMove(msg: PropMoveMessage) {
    if (this.props.backgroundRepeat && this.tilingSprite) {
      this.tilingSprite.tilePosition.x = msg.x;
    } else {
      this.container.x = msg.x;
    }
  }

  saveCurrentPosition() {
    if (!this.props.canDrag) return;
    this.persistPosition();
  }

  destroy() {
    if (this.animationTicker) {
      this.props.app.ticker.remove(this.animationTicker);
      this.animationTicker = null;
    }
    this.container.destroy({ children: true });
  }
}
