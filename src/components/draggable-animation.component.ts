import { Container, Sprite, Texture } from "pixi.js";
import type { FederatedPointerEvent } from "pixi.js";
import { GlowFilter } from "pixi-filters/glow";
import { Rive } from "@rive-app/webgl2";
import type { ViewModelProperty } from "@rive-app/webgl2/rive_advanced.mjs";
import { saveSceneCastPosition } from "@/lib/scenes.fns";
import type { PropMoveMessage } from "@/lib/livekit-messages";
import type { PixiCharacterProps } from "@/components/draggable-character.component";

// ---------------------------------------------------------------------------
// Internal types
// ---------------------------------------------------------------------------

enum DataType {
  boolean = "boolean",
  enumType = "enumType",
  trigger = "trigger",
}

interface VMProperty extends ViewModelProperty {
  enums?: string[];
}

// ---------------------------------------------------------------------------
// Public interface
// ---------------------------------------------------------------------------

export interface PixiAnimationProps extends PixiCharacterProps {
  onPropertiesReady?: (props: {
    enumValues: VMProperty[];
    boolValues: VMProperty[];
    triggerValues: VMProperty[];
  }) => void;
}

// ---------------------------------------------------------------------------
// Helpers (mirrored from draggable-character.component)
// ---------------------------------------------------------------------------

const encoder = new TextEncoder();

function getAngle(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.atan2(b.y - a.y, b.x - a.x) * (180 / Math.PI);
}

function getMidpoint(
  a: { x: number; y: number },
  b: { x: number; y: number },
) {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

// ---------------------------------------------------------------------------
// PixiAnimation
// ---------------------------------------------------------------------------

export class PixiAnimation {
  readonly container: Container;
  private sprite: Sprite;
  private glowFilter: GlowFilter;
  private readonly props: PixiAnimationProps;

  private riveInstance: Rive | null = null;
  private riveCanvas: HTMLCanvasElement | null = null;
  private tickerFn: (() => void) | null = null;
  private destroyed = false;

  // Rive ViewModel properties — populated after onLoad
  enumValues: VMProperty[] = [];
  boolValues: VMProperty[] = [];
  triggerValues: VMProperty[] = [];

  // Interaction state
  private isDragging = false;
  private dragOffset = { x: 0, y: 0 };
  private activePointers = new Map<number, { x: number; y: number }>();
  private lastSendTime = 0;
  private isSpeaking = false;

  // Double-tap detection
  private lastTapTime = 0;
  private suppressNextNTaps = 0;

  private onKeyDown: ((e: KeyboardEvent) => void) | null = null;

  constructor(props: PixiAnimationProps) {
    this.props = props;

    this.container = new Container();
    this.container.label = props.sceneCastId;
    this.container.zIndex = 1;
    this.container.x = props.initialX ?? 100;
    this.container.y = props.initialY ?? 100;
    this.container.rotation = (props.initialRotation ?? 0) * (Math.PI / 180);

    this.glowFilter = new GlowFilter({
      color: 0xa855f7,
      outerStrength: 4,
      innerStrength: 0,
      distance: 15,
      quality: 0.5,
    });
    this.glowFilter.enabled = false;

    this.sprite = new Sprite();
    this.sprite.anchor.set(0.5);
    this.sprite.scale.x = props.initialScaleX ?? 1;
    this.sprite.filters = [this.glowFilter];

    this.container.addChild(this.sprite);

    this.initRive();
  }

  // -------------------------------------------------------------------------
  // Rive initialisation
  // -------------------------------------------------------------------------

  private initRive() {
    const { src } = this.props;

    const riveCanvas = document.createElement("canvas");
    riveCanvas.style.position = "absolute";
    riveCanvas.style.visibility = "hidden";
    riveCanvas.style.pointerEvents = "none";
    document.body.appendChild(riveCanvas);
    this.riveCanvas = riveCanvas;

    this.riveInstance = new Rive({
      src,
      canvas: riveCanvas,
      autoplay: true,
      autoBind: true,
      stateMachines: "pmStateMachine",
      onLoad: () => this.onRiveLoad(),
    });
  }

  private onRiveLoad() {
    // Guard: destroy() may have been called while Rive was loading
    if (this.destroyed) return;

    const riveInstance = this.riveInstance!;
    const riveCanvas = this.riveCanvas!;

    // Size the offscreen canvas from Rive bounds
    if (riveInstance.bounds) {
      const { minX, maxX, minY, maxY } = riveInstance.bounds;
      const w = maxX - minX;
      const h = maxY - minY;
      riveCanvas.width = w;
      riveCanvas.height = h;
      riveCanvas.style.width = `${w}px`;
      riveCanvas.style.height = `${h}px`;
      riveInstance.resizeDrawingSurfaceToCanvas();
    }

    riveInstance.startRendering();

    // Discover ViewModel properties
    const vmi = riveInstance.viewModelInstance;
    if (vmi) {
      const props = (vmi.properties || []) as VMProperty[];

      const enumPropMeta = props.filter(
        (p) => (p.type as unknown as DataType) === DataType.enumType,
      );
      enumPropMeta.forEach((p) => {
        p.enums = vmi.enum(p.name)?.values;
      });

      this.enumValues = enumPropMeta;
      this.boolValues = props.filter(
        (p) => (p.type as unknown as DataType) === DataType.boolean,
      );
      this.triggerValues = props.filter(
        (p) => (p.type as unknown as DataType) === DataType.trigger,
      );

      this.props.onPropertiesReady?.({
        enumValues: this.enumValues,
        boolValues: this.boolValues,
        triggerValues: this.triggerValues,
      });
    }

    // Create PixiJS texture backed by the Rive canvas
    const texture = Texture.from(riveCanvas);
    this.sprite.texture = texture;

    // Stream Rive frames into PixiJS each tick
    this.tickerFn = () => {
      if (!this.destroyed && riveCanvas.width > 0 && riveCanvas.height > 0) {
        texture.source.update();
      }
    };
    this.props.app.ticker.add(this.tickerFn);

    this.drawGlow();
    this.setupInteraction();
    this.props.onReady?.();

    if (this.props.app.stage.sortableChildren) {
      this.props.app.stage.sortChildren();
    }
  }

  // -------------------------------------------------------------------------
  // Glow
  // -------------------------------------------------------------------------

  private drawGlow() {
    this.glowFilter.enabled = this.isSpeaking;
  }

  // -------------------------------------------------------------------------
  // Interaction setup
  // -------------------------------------------------------------------------

  private setupInteraction() {
    const { canDrag } = this.props;

    this.sprite.eventMode = canDrag ? "static" : "none";
    this.sprite.cursor = canDrag ? "pointer" : "default";

    if (!canDrag) return;

    this.sprite.on("pointerdown", this.onPointerDown.bind(this));
    this.sprite.on("pointerup", this.onPointerUp.bind(this));
    this.sprite.on("pointerupoutside", this.onPointerUp.bind(this));
    this.sprite.on("globalpointermove", this.onStagePointerMove.bind(this));

    this.onKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && this.activePointers.size > 0)
        this.handleHorizontalFlip();
    };
    window.addEventListener("keydown", this.onKeyDown);

    this.sprite.on("tap", () => {
      // Eat taps generated by fingers lifting after a multi-touch gesture
      if (this.suppressNextNTaps > 0) {
        this.suppressNextNTaps--;
        this.lastTapTime = 0;
        return;
      }
      const now = Date.now();
      if (now - this.lastTapTime < 300) this.handleHorizontalFlip();
      this.lastTapTime = now;
    });
  }

  // -------------------------------------------------------------------------
  // Pointer handlers
  // -------------------------------------------------------------------------

  private onPointerDown(e: FederatedPointerEvent) {
    this.activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (this.activePointers.size === 1) {
      this.isDragging = true;
      this.dragOffset = {
        x: this.container.x - e.global.x,
        y: this.container.y - e.global.y,
      };
      this.bringToTop();
    } else {
      this.isDragging = false;
    }
  }

  private onPointerUp(e: FederatedPointerEvent) {
    const prevSize = this.activePointers.size;
    this.activePointers.delete(e.pointerId);

    // Suppress spurious taps fired when fingers lift after a multi-touch gesture
    if (prevSize >= 2 && this.activePointers.size < 2) {
      this.suppressNextNTaps = prevSize;
    }

    if (this.activePointers.size === 0) {
      this.isDragging = false;
      this.persistPosition();
    }
  }

  private onStagePointerMove(e: FederatedPointerEvent) {
    if (!this.props.canDrag) return;
    if (!this.activePointers.has(e.pointerId)) return;

    const prevStateMap = new Map(this.activePointers);
    this.activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (this.activePointers.size === 2) {
      const currPointers = Array.from(this.activePointers.values());
      const prevPointers = Array.from(prevStateMap.values());

      if (prevPointers.length < 2) return;

      const newAngle = getAngle(currPointers[0], currPointers[1]);
      const newMid = getMidpoint(currPointers[0], currPointers[1]);
      const oldAngle = getAngle(prevPointers[0], prevPointers[1]);
      const oldMid = getMidpoint(prevPointers[0], prevPointers[1]);

      let angleDelta = newAngle - oldAngle;
      if (angleDelta > 180) angleDelta -= 360;
      if (angleDelta < -180) angleDelta += 360;
      this.container.rotation += angleDelta * (Math.PI / 180);

      this.container.x += newMid.x - oldMid.x;
      this.container.y += newMid.y - oldMid.y;

      this.publishMove();
    } else if (this.isDragging && this.activePointers.size <= 1) {
      const rawX = e.global.x + this.dragOffset.x;
      const rawY = e.global.y + this.dragOffset.y;
      this.container.x = this.clampX(rawX);
      this.container.y = this.clampY(rawY);
      this.publishMove();
    }
  }

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------

  private clampX(x: number): number {
    const { stageWidth = 1280 } = this.props;
    return Math.min(Math.max(x, 0), stageWidth);
  }

  private clampY(y: number): number {
    const { stageHeight = 720 } = this.props;
    return Math.min(Math.max(y, 0), stageHeight);
  }

  private handleHorizontalFlip() {
    if (!this.props.canDrag) return;
    this.sprite.scale.x *= -1;
    this.drawGlow();
    this.publishMove(true);
    this.persistPosition();
  }

  private publishMove(immediate = false) {
    const { room, canDrag, castId } = this.props;
    if (!room || !canDrag) return;
    const now = Date.now();
    if (!immediate && now - this.lastSendTime < 30) return;
    this.lastSendTime = now;

    const msg: PropMoveMessage = {
      type: "prop:move",
      castId,
      x: this.container.x,
      y: this.container.y,
      rotation: this.container.rotation * (180 / Math.PI),
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
        rotation: this.container.rotation * (180 / Math.PI),
        scaleX: this.sprite.scale.x,
      },
    });
  }

  private bringToTop() {
    const stage = this.props.app.stage;
    this.container.zIndex = stage.children.length + 1;
    stage.sortChildren();
  }

  // -------------------------------------------------------------------------
  // Public API (matches PixiCharacter)
  // -------------------------------------------------------------------------

  updateSpeaking(isSpeaking: boolean) {
    if (this.isSpeaking === isSpeaking) return;
    this.isSpeaking = isSpeaking;
    this.drawGlow();
  }

  applyRemoteMove(msg: PropMoveMessage) {
    this.container.x = msg.x;
    this.container.y = msg.y;
    this.container.rotation = msg.rotation * (Math.PI / 180);
    this.sprite.scale.x = msg.scaleX;
  }

  saveCurrentPosition() {
    if (!this.props.canDrag) return;
    this.persistPosition();
  }

  destroy() {
    this.destroyed = true;
    if (this.onKeyDown) window.removeEventListener("keydown", this.onKeyDown);
    if (this.tickerFn) {
      this.props.app.ticker.remove(this.tickerFn);
      this.tickerFn = null;
    }
    if (this.riveInstance) {
      this.riveInstance.cleanup();
      this.riveInstance = null;
    }
    if (this.riveCanvas && this.riveCanvas.parentNode) {
      document.body.removeChild(this.riveCanvas);
      this.riveCanvas = null;
    }
    this.container.destroy({ children: true });
  }
}
