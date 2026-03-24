import { Assets, Container, Sprite } from 'pixi.js';
import type { FederatedPointerEvent, Texture, Ticker } from 'pixi.js';
import { saveSceneCastPosition } from '@/lib/scenes.fns';
import type { PropMoveMessage, BgDirection, BgSpeed } from '@/lib/livekit-messages';
import type { PixiCharacterProps } from '@/components/draggable-character.component';

const encoder = new TextEncoder();

function getMidpoint(a: { x: number; y: number }, b: { x: number; y: number }) {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

export class PixiBackground {
  readonly container: Container;
  private sprite: Sprite;
  private readonly props: PixiCharacterProps;

  private isDragging = false;
  private dragOffset = { x: 0, y: 0 };
  private activePointers = new Map<number, { x: number; y: number }>();
  private lastSendTime = 0;
  private animationSpeed: BgSpeed = 0;
  private animationTicker: ((ticker: Ticker) => void) | null = null;
  private lastProgressTime = 0;

  constructor(props: PixiCharacterProps) {
    this.props = props;

    this.container = new Container();
    this.container.label = props.sceneCastId;
    this.container.zIndex = 0;
    this.container.x = props.initialX ?? 100;
    this.container.y = props.initialY ?? 100;

    this.sprite = new Sprite();
    this.sprite.anchor.set(0.5);

    this.container.addChild(this.sprite);

    this.loadTexture();
  }

  private async loadTexture() {
    const { src, initialScaleX = 1, stageHeight = 720, app } = this.props;
    let texture: Texture;
    try {
      texture = await Assets.load(src);
    } catch {
      this.props.onReady?.();
      return;
    }

    this.sprite.texture = texture;
    this.sprite.anchor.set(0.5);
    this.sprite.scale.x = initialScaleX;
    this.container.zIndex = 0;
    this.container.y = stageHeight - texture.height / 2;

    this.setupInteraction();
    this.props.onReady?.();

    // Report initial position so progress atom (and button disabled state) is correct on entry
    const { stageWidth = 1280 } = this.props;
    const halfW = this.sprite.width / 2;
    const minX = stageWidth - halfW;
    const maxX = halfW;
    this.props.onPositionChange?.(this.container.x, { minX, maxX });

    if (app.stage.sortableChildren) app.stage.sortChildren();
  }

  private setupInteraction() {
    const { canDrag } = this.props;

    this.sprite.eventMode = canDrag ? 'static' : 'none';
    this.sprite.cursor = canDrag ? 'pointer' : 'default';

    if (!canDrag) return;

    this.sprite.on('pointerdown', this.onPointerDown.bind(this));
    this.sprite.on('pointerup', this.onPointerUp.bind(this));
    this.sprite.on('pointerupoutside', this.onPointerUp.bind(this));
    this.sprite.on('globalpointermove', this.onStagePointerMove.bind(this));
    // No double-click / tap handlers — backgrounds cannot be mirrored
  }

  private onPointerDown(e: FederatedPointerEvent) {
    if (this.animationSpeed > 0) return;
    this.activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (this.activePointers.size === 1) {
      this.isDragging = true;
      this.dragOffset = {
        x: this.container.x - e.global.x,
        y: this.container.y - e.global.y,
      };
      // Backgrounds never change z-index — always stay at bottom
    } else {
      this.isDragging = false;
    }
  }

  private onPointerUp(e: FederatedPointerEvent) {
    this.activePointers.delete(e.pointerId);

    if (this.activePointers.size === 0) {
      this.isDragging = false;
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

      // X-only pan — backgrounds do not rotate and y is locked
      this.container.x += newMid.x - oldMid.x;
      this.publishMove();
    } else if (this.isDragging && this.activePointers.size <= 1) {
      const rawX = e.global.x + this.dragOffset.x;
      this.container.x = this.clampX(rawX);
      // y stays locked to bottom (set in loadTexture, never overridden)
      this.publishMove();
    }
  }

  private clampX(x: number): number {
    const { stageWidth = 1280 } = this.props;
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

    const msg: PropMoveMessage = {
      type: 'prop:move',
      castId,
      x: this.container.x,
      y: this.container.y,
      rotation: 0,
      scaleX: this.sprite.scale.x,
      indexZ: 0,
    };
    this.props.room?.localParticipant.publishData(
      encoder.encode(JSON.stringify(msg)),
      { reliable: false },
    );
  }

  private persistPosition() {
    if (!this.props.canDrag) return;
    saveSceneCastPosition({
      data: {
        sceneCastId: this.props.sceneCastId,
        x: this.container.x,
        y: this.container.y,
        rotation: 0,
        scaleX: this.sprite.scale.x,
      },
    });
  }

  setAnimation(direction: BgDirection, speed: BgSpeed) {
    // Always remove existing ticker first to prevent duplicate adds
    if (this.animationTicker) {
      this.props.app.ticker.remove(this.animationTicker);
      this.animationTicker = null;
    }

    this.animationSpeed = speed;

    if (speed === 0 || direction === null) {
      // Re-enable drag
      this.sprite.eventMode = this.props.canDrag ? 'static' : 'none';
      this.sprite.cursor = this.props.canDrag ? 'pointer' : 'default';
      return;
    }

    // Disable drag while animating
    this.sprite.eventMode = 'none';
    this.sprite.cursor = 'default';

    const pxPerFrame = speed === 1 ? 4 : speed === 2 ? 8 : 16;
    const delta = direction === 'left' ? -pxPerFrame : pxPerFrame;

    this.animationTicker = (ticker: Ticker) => {
      const rawX = this.container.x + delta * ticker.deltaTime;
      const clampedX = this.clampX(rawX);
      this.container.x = clampedX;

      // Boundary reached — self-stop and notify
      if (Math.abs(rawX - clampedX) > 1e-6) {
        this.props.app.ticker.remove(this.animationTicker!);
        this.animationTicker = null;
        this.animationSpeed = 0;
        this.sprite.eventMode = this.props.canDrag ? 'static' : 'none';
        this.sprite.cursor = this.props.canDrag ? 'pointer' : 'default';
        this.props.onAnimationComplete?.();
        return;
      }

      // Share a single timestamp for both throttle checks
      const now = Date.now();

      // Publish position to remote participants (director/canDrag only, throttled)
      this.publishMove(false, now);

      // Update progress for all clients (throttled independently at 60ms)
      if (now - this.lastProgressTime >= 60) {
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

  // No-op — backgrounds do not have a speaking glow
  updateSpeaking(_isSpeaking: boolean) {}

  applyRemoteMove(msg: PropMoveMessage) {
    this.container.x = msg.x;
    // y is locked to bottom — intentionally not applied
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
