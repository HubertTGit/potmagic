import { Assets, Container, Sprite } from 'pixi.js';
import type { FederatedPointerEvent, Texture } from 'pixi.js';
import { saveSceneCastPosition } from '@/lib/scenes.fns';
import type { PixiCharacterProps, PropMoveMessage } from '@/components/draggable-character.component';

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
    if (this.activePointers.size === 0 && !this.isDragging) return;

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

  private publishMove(immediate = false) {
    const { room, canDrag, castId } = this.props;
    if (!room || !canDrag) return;
    const now = Date.now();
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
    this.container.destroy({ children: true });
  }
}
