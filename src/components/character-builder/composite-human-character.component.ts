// src/components/composite-human-character.component.ts
import { Application, Assets, Container, Graphics, Sprite } from "pixi.js";
import * as PIXI from "pixi.js";
import type { FederatedPointerEvent, Texture } from "pixi.js";
import { gsap } from "gsap";
import { PixiPlugin } from "gsap/PixiPlugin";
import type { Room } from "livekit-client";
import { saveSceneCastPosition } from "@/lib/scenes.fns";
import type { PropType } from "@/db/schema";
import type { PropMoveMessage } from "@/lib/livekit-messages";

gsap.registerPlugin(PixiPlugin);
PixiPlugin.registerPIXI(PIXI);

export const ALL_PART_ROLES = [
  "torso",
  "body",
  "head",
  "mouth",
  "eye-left",
  "eye-right",
  "pupil-left",
  "pupil-right",
  "eye-brow-left",
  "eye-brow-right",
  "arm-upper-left",
  "arm-forearm-left",
  "arm-hand-left",
  "arm-upper-right",
  "arm-forearm-right",
  "arm-hand-right",
] as const;

export type PartRole = (typeof ALL_PART_ROLES)[number];

export interface CharacterPartData {
  id: string;
  partRole: string;
  propId: string;
  pivotX: number; // Used as Pivot X (pixels)
  pivotY: number; // Used as Pivot Y (pixels)
  x: number;
  y: number;
  zIndex: number;
  rotation: number;
  imageUrl: string | null;
  altImageUrl: string | null;
  altImageUrl2: string | null;
}

export interface CompositeHumanCharacterProps {
  sceneCastId: string;
  castId: string;
  parts: CharacterPartData[];
  userId: string;
  type: PropType;
  imageUrl?: string | null;
  initialX?: number;
  initialY?: number;
  initialRotation?: number;
  initialScaleX?: number;
  room?: Room | null;
  canDrag: boolean;
  stageWidth?: number;
  stageHeight?: number;
  app: Application;
  onReady?: () => void;
  interactive?: boolean;
  onChange?: (role: string, data: Partial<CharacterPartAdjustments>) => void;
  showBoundingBoxes?: boolean;
  ikLeftDirection?: "cw" | "ccw";
  ikRightDirection?: "cw" | "ccw";
}

export interface CharacterPartAdjustments {
  characterId?: string;
  partRole?: string;
  propId?: string;
  pivotX?: number; // Pivot X
  pivotY?: number; // Pivot Y
  x?: number;
  y?: number;
  rotation?: number;
  zIndex?: number;
}

const encoder = new TextEncoder();

export class CompositeHumanCharacter {
  readonly container: Container;
  private readonly props: CompositeHumanCharacterProps;
  private partContainers: Map<string, Container> = new Map();
  private partSprites: Map<string, Sprite> = new Map();
  private textures: Map<string, Texture> = new Map();
  private variationTextures: Map<string, Texture> = new Map();
  private variationTextures2: Map<string, Texture> = new Map();

  private isDragging = false;
  private dragOffset = { x: 0, y: 0 };
  private activePointers = new Map<number, { x: number; y: number }>();
  private lastSendTime = 0;
  private isSpeaking = false;
  private isLaughing = false;
  private isSmiling = false;
  private isMouthSad = false;
  private isAngry = false;
  private isBlinking = false;
  private isEyebrowsHappy = false;
  private isEyebrowsAngry = false;
  private isAutoBlinking = false;
  private autoBlinkTimeline: gsap.core.Timeline | null = null;
  private speakingTimeline: gsap.core.Timeline | null = null;
  private eyebrowOriginalXs: Map<string, number> = new Map();
  private eyebrowOriginalYs: Map<string, number> = new Map();
  private eyebrowOriginalRots: Map<string, number> = new Map();
  private eyebrowTweens: Map<string, gsap.core.Tween> = new Map();
  private mouthOriginalY: number | null = null;
  private laughTween: gsap.core.Tween | null = null;
  private smileTween: gsap.core.Tween | null = null;
  private sadTimeline: gsap.core.Timeline | null = null;

  // Stored so they can be removed from the stage on destroy()
  private boundPartPointerMove: ((e: FederatedPointerEvent) => void) | null =
    null;
  private boundPartPointerUp: (() => void) | null = null;

  // Gizmos (interactive/builder mode only)
  private gizmoGroups: Map<string, Container> = new Map();
  private rotatingRole: string | null = null;
  private rotateStartAngle = 0;
  private rotateStartContainerRotation = 0;

  // Gizmo edit mode: drag handles to reposition them instead of triggering rotate/translate
  private gizmoEditMode = false;
  private movingGizmoHandle: {
    handle: Graphics;
    connector: Graphics;
    gizmoGroup: Container;
    startLocal: { x: number; y: number };
    handleStart: { x: number; y: number };
    role: string;
    updatesAnchor: boolean;
  } | null = null;
  // All draggable gizmo handles, stored for cursor toggling
  private gizmoHandleRefs: Array<{
    handle: Graphics;
    connector: Graphics;
    gizmoGroup: Container;
    defaultCursor: string;
    role: string;
    updatesAnchor: boolean;
    type: "rotate" | "translate";
    defaultX: number;
    defaultY: number;
  }> = [];

  get canDrag() {
    return this.props.canDrag;
  }

  get hasRoom() {
    return !!this.props.room;
  }

  private ikState: {
    left: {
      enabled: boolean;
      flipped: boolean;
      target: { x: number; y: number } | null;
    };
    right: {
      enabled: boolean;
      flipped: boolean;
      target: { x: number; y: number } | null;
    };
  } = {
    left: { enabled: false, flipped: true, target: null },
    right: { enabled: false, flipped: true, target: null },
  };

  /**
   * Updates the IK bend direction for a specific side.
   * Internal 'flipped' state is mapped from 'cw'/'ccw'.
   */
  setIKDirection(side: "left" | "right", direction: "cw" | "ccw") {
    // Current solver logic:
    // Left flipped: true -> ccw (ish), flipped: false -> cw (ish)
    // mapping is consistent across sides due to symmetry adjustment in solveIK:
    // const flip = (sideState.flipped ? 1 : -1) * (side === "right" ? -1 : 1);
    this.ikState[side].flipped = direction === "ccw";

    // If IK is active, re-solve immediately
    if (this.ikState[side].enabled && this.ikState[side].target) {
      this.solveIK(side, this.ikState[side].target);
    }
  }
  private static readonly ARM_CHAINS = {
    left: ["arm-upper-left", "arm-forearm-left", "arm-hand-left"],
    right: ["arm-upper-right", "arm-forearm-right", "arm-hand-right"],
  } as const;

  private ikOffset = { x: 0, y: 0 };

  private bodyHeadRotationEnabled = false;
  private bhHandleGroup: Container | null = null;
  private bhHandle: Graphics | null = null;
  private bhHitArea: Graphics | null = null;
  private bhValue = 0; // -1 to 1 normalized
  private bhInitialBodyRot = 0;
  private bhInitialHeadRot = 0;
  private bhDragging = false;
  private bhHandleRange = 100; // Half-width of movement area
  private bhSliderContainer: Container | null = null;
  private bhSliderFixedPos: { x: number; y: number } | null = null;
  private pupilNx = 0;
  private pupilNy = 0;

  private isAnyIKActive() {
    return this.ikState.left.enabled || this.ikState.right.enabled;
  }

  private boundingBoxGraphics: Map<string, Graphics> = new Map();
  private showBoundingBoxes = false;
  private forceMouthVisible = true;

  private static readonly ROTATABLE_ROLES = [
    "body",
    "head",
    "arm-upper-left",
    "arm-forearm-left",
    "arm-hand-left",
    "arm-upper-right",
    "arm-forearm-right",
    "arm-hand-right",
  ] as const;

  private static readonly NO_GIZMO_ROLES = [
    "eye-left",
    "eye-right",
    "pupil-left",
    "pupil-right",
    "eye-brow-left",
    "eye-brow-right",
    "mouth",
    "torso",
    "body",
  ] as const;

  constructor(props: CompositeHumanCharacterProps) {
    this.props = props;
    console.log(`[CompositeCharacter] Constructor: ${props.sceneCastId}`, {
      canDrag: props.canDrag,
      hasRoom: !!props.room,
      castId: props.castId,
      userId: props.userId,
    });
    this.showBoundingBoxes = props.showBoundingBoxes ?? false;

    this.container = new Container();
    this.container.label = props.sceneCastId;
    this.container.zIndex = 1;
    this.container.x = props.initialX ?? 100;
    this.container.y = props.initialY ?? 100;

    // Initialize IK directions from props
    if (props.ikLeftDirection) {
      this.ikState.left.flipped = props.ikLeftDirection === "ccw";
    }
    if (props.ikRightDirection) {
      this.ikState.right.flipped = props.ikRightDirection === "ccw";
    }

    this.loadAllTextures().then(() => {
      this.buildHierarchy();

      if (!this.props.interactive) {
        this.ikState.left.enabled = true;
        this.ikState.right.enabled = true;
      }

      this.setupInteraction();
      this.props.onReady?.();
    });

    // Keyboard listener for mirroring (Spacebar)
    if (!props.interactive) {
      window.addEventListener("keydown", this.handleGlobalKeyDown);
    }
  }

  private handleGlobalKeyDown = (e: KeyboardEvent) => {
    if (e.code === "Space") {
      // Only flip if this character is being hovered or was last interacted with
      // For simplicity, we check if the mouse is currently within our bounding area
      // OR if we are the "focused" character (e.g. dragging/just dragged).
      // Here we check if the character is being hovered by checking all sprites' eventMode.
      // But a simpler way is to check the container's bounds against the mouse.
      const app = this.props.app;
      const mouse = app.renderer.events.pointer.global;
      if (this.container.getBounds().containsPoint(mouse.x, mouse.y)) {
        const torso = this.partContainers.get("torso");
        if (torso) {
          e.preventDefault();
          torso.scale.x *= -1;
          this.publishMove();
          this.persistPosition();
        }
      }
    }
  };

  private async loadAllTextures() {
    const loadPromises = this.props.parts.flatMap((p) => {
      const promises = [];
      if (p.imageUrl) {
        promises.push(
          Assets.load(p.imageUrl).then((tex) =>
            this.textures.set(p.partRole, tex),
          ),
        );
      }
      if (p.altImageUrl) {
        promises.push(
          Assets.load(p.altImageUrl).then((tex) =>
            this.variationTextures.set(p.partRole, tex),
          ),
        );
      }
      if (p.altImageUrl2) {
        promises.push(
          Assets.load(p.altImageUrl2).then((tex) =>
            this.variationTextures2.set(p.partRole, tex),
          ),
        );
      }
      return promises;
    });

    await Promise.all(loadPromises);

    // Capture current expression states
    const states = {
      laughing: this.isLaughing,
      smiling: this.isSmiling,
      blinking: this.isBlinking,
      eyebrowsHappy: this.isEyebrowsHappy,
      eyebrowsAngry: this.isEyebrowsAngry,
      speaking: this.isSpeaking,
      sad: this.isMouthSad,
      angry: this.isAngry,
      autoBlinking: this.isAutoBlinking,
    };

    // Reset flags to force re-evaluation in setters
    this.isLaughing = false;
    this.isSmiling = false;
    this.isMouthSad = false;
    this.isAngry = false;
    this.isAutoBlinking = false;
    this.isBlinking = false;
    this.isEyebrowsHappy = false;
    this.isEyebrowsAngry = false;
    this.isSpeaking = false;

    // Re-evaluate expressions now that textures are loaded
    if (states.smiling) this.setSmile(true);
    if (states.blinking) this.setBlink(true);
    if (states.eyebrowsHappy) this.setEyebrowsHappy(true);
    if (states.eyebrowsAngry) this.setEyebrowsAngry(true);
    if (states.speaking) this.setSpeaking(true);
    if (states.sad) this.setSad(true);
    if (states.angry) this.setAngry(true);
    if (states.autoBlinking) this.setAutoBlinking(true);
  }

  private buildHierarchy() {
    const partsByRole = new Map(this.props.parts.map((p) => [p.partRole, p]));

    // Always creates a container for the role, using part data if available or defaults.
    // Sprites without a loaded texture are invisible (no hit area), so unplaced parts
    // are inert until the user drops them onto the canvas.
    const createPart = (role: string, parent: Container): Container => {
      const data = partsByRole.get(role);

      const container = new Container();
      container.label = role;

      // Coordinate Migration Logic:
      // If this is a pupil and the parent is an eye, check if data is in "head-space" (absolute to head)
      // or "eye-space" (relative to eye). We assume > 100 is likely absolute head-space.
      if (role.startsWith("pupil") && parent.label?.startsWith("eye")) {
        const absoluteX = data?.x ?? 0;
        const absoluteY = data?.y ?? 0;
        // If absoluteX is around head center/eye pos (e.g. 300-500), subtract parent offset
        if (absoluteX > 100) {
          container.x = absoluteX - parent.x;
          container.y = absoluteY - parent.y;
        } else {
          container.x = absoluteX;
          container.y = absoluteY;
        }
      } else {
        container.x = data?.x ?? 0;
        container.y = data?.y ?? 0;
      }

      container.rotation = (data?.rotation ?? 0) * (Math.PI / 180);
      container.zIndex =
        data?.zIndex ?? ALL_PART_ROLES.indexOf(role as PartRole);

      const sprite = new Sprite();
      const tex = this.textures.get(role);
      if (tex) sprite.texture = tex;

      // Default sprite anchor (always untouched by gizmo)
      sprite.anchor.set(0.5, 0.5);

      const isGizmoLess = (
        CompositeHumanCharacter.NO_GIZMO_ROLES as readonly string[]
      ).includes(role);

      // Use pivot for rotation point (stored in pixels)
      // Gizmo-less roles are enforced to center pivot (0,0 with 0.5 anchor)
      let px = isGizmoLess ? 0 : (data?.pivotX ?? 0);
      let py = isGizmoLess ? 0 : (data?.pivotY ?? 0);

      // Smart Placement: body defaults to center-bottom pivot (y = height/2)
      if (role === "body" && sprite.texture?.source.width > 0) {
        px = 0;
        py = sprite.texture.height / 2;
      }

      container.pivot.set(px, py);

      container.addChild(sprite);
      parent.addChild(container);

      this.partContainers.set(role, container);
      this.partSprites.set(role, sprite);

      return container;
    };

    // 1. Torso — root child of the composite container
    const torso = createPart("torso", this.container);

    // 2. Body — attached to torso
    const body = createPart("body", torso);

    // 3. Head and its facial parts — attached to body
    const head = createPart("head", body);
    createPart("mouth", head);

    // Grouping Eye Left
    const eyeLeftGroup = new Container();
    eyeLeftGroup.label = "eye-left-group";
    head.addChild(eyeLeftGroup);
    const eyeLeft = createPart("eye-left", eyeLeftGroup);
    createPart("pupil-left", eyeLeft);

    // Grouping Eye Right
    const eyeRightGroup = new Container();
    eyeRightGroup.label = "eye-right-group";
    head.addChild(eyeRightGroup);
    const eyeRight = createPart("eye-right", eyeRightGroup);
    createPart("pupil-right", eyeRight);

    createPart("eye-brow-left", head);
    createPart("eye-brow-right", head);

    // 4. Arms — attached to body
    const aul = createPart("arm-upper-left", body);
    const afl = createPart("arm-forearm-left", aul);
    createPart("arm-hand-left", afl);

    const aur = createPart("arm-upper-right", body);
    const afr = createPart("arm-forearm-right", aur);
    createPart("arm-hand-right", afr);

    torso.scale.x = this.props.initialScaleX ?? 1;
    torso.rotation = (this.props.initialRotation ?? 0) * (Math.PI / 180);

    this.container.sortChildren();

    // After building hierarchy, we can setup the specialized UI
    if (this.props.canDrag) {
      this.setupBodyHeadRotationUI();
    }
  }
  private setupInteraction() {
    const { canDrag, interactive = false } = this.props;

    if (canDrag) {
      this.boundPartPointerMove = this.onPartGlobalPointerMove.bind(this);
      this.boundPartPointerUp = this.onPartPointerUp.bind(this);
      this.props.app.stage.on("globalpointermove", this.boundPartPointerMove);
      this.props.app.stage.on("pointerup", this.boundPartPointerUp);
    }

    if (interactive) {
      // Builder mode: each placed (textured) part is independently draggable
      this.props.app.stage.eventMode = "static";

      for (const [role, sprite] of this.partSprites) {
        if (!this.textures.has(role)) continue; // skip unplaced parts

        sprite.eventMode = "static";
        sprite.cursor = "move";
        sprite.on("pointerdown", (e) => this.onPartPointerDown(e, role));

        if (role === "head") {
          sprite.on("pointerover", () => this.onHeadHover(true));
          sprite.on("pointerout", () => this.onHeadHover(false));

          if (this.bhHitArea) {
            this.bhHitArea.on("pointerover", () => this.onHeadHover(true));
            this.bhHitArea.on("pointerout", () => this.onHeadHover(false));
          }
        }
      }

      this.buildGizmos();
    } else {
      // Stage mode: torso handles root drag; hands handle posing (IK)
      const torsoSprite = this.partSprites.get("torso");
      if (torsoSprite) {
        torsoSprite.eventMode = canDrag ? "static" : "none";
        torsoSprite.cursor = canDrag ? "pointer" : "default";
        if (canDrag) {
          torsoSprite.on("pointerdown", this.onPointerDown.bind(this));
          torsoSprite.on("pointerup", this.onPointerUp.bind(this));
          torsoSprite.on("pointerupoutside", this.onPointerUp.bind(this));
          torsoSprite.on(
            "globalpointermove",
            this.onStagePointerMove.bind(this),
          );
        }
      }

      // Enable head interaction for Turn Mode hover in Stage Mode
      const headSprite = this.partSprites.get("head");
      if (headSprite && canDrag) {
        headSprite.eventMode = "static";
        headSprite.on("pointerover", () => this.onHeadHover(true));
        headSprite.on("pointerout", () => this.onHeadHover(false));
      }

      if (this.bhHitArea && canDrag) {
        this.bhHitArea.on("pointerover", () => this.onHeadHover(true));
        this.bhHitArea.on("pointerout", () => this.onHeadHover(false));
      }

      // Re-enable hand interactivity for posing (IK is on by default in constructor)
      const handRoles = ["arm-hand-left", "arm-hand-right"];
      for (const role of handRoles) {
        const sprite = this.partSprites.get(role);
        if (sprite && canDrag) {
          sprite.eventMode = "static";
          sprite.cursor = "move";
          sprite.on("pointerdown", (e) => this.onPartPointerDown(e, role));
        }
      }
    }
  }

  // --- Stage Mode Interaction ---

  private onPointerDown(e: FederatedPointerEvent) {
    this.activePointers.set(e.pointerId, { x: e.global.x, y: e.global.y });
    if (this.activePointers.size === 1) {
      this.isDragging = true;
      this.dragOffset = {
        x: this.container.x - e.global.x,
        y: this.container.y - e.global.y,
      };
      this.bringToTop();
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
    if (this.activePointers.has(e.pointerId)) {
      this.activePointers.set(e.pointerId, { x: e.global.x, y: e.global.y });
    }

    if (this.isDragging && this.activePointers.size === 1) {
      // Single-touch translation
      const rawX = e.global.x + this.dragOffset.x;
      const rawY = e.global.y + this.dragOffset.y;
      this.container.x = this.clampX(rawX);
      this.container.y = this.clampY(rawY);
      this.publishMove();
    }
  }

  private clampX(x: number): number {
    const { stageWidth = 1280 } = this.props;
    return Math.min(Math.max(x, 0), stageWidth);
  }

  private clampY(y: number): number {
    const { stageHeight = 720 } = this.props;
    return Math.min(Math.max(y, 0), stageHeight);
  }

  // --- Builder Mode Interaction ---

  private draggingRole: string | null = null;
  private partOffset = { x: 0, y: 0 };

  private onPartPointerDown(e: FederatedPointerEvent, role: string) {
    e.stopPropagation();
    // Freeze head and body dragging while turn mode is active
    if (this.bodyHeadRotationEnabled && (role === "head" || role === "body")) {
      return;
    }
    this.draggingRole = role;
    const container = this.partContainers.get(role)!;
    if (!container.parent) return;
    const local = container.parent.toLocal(e.global);
    this.partOffset = {
      x: container.x - local.x,
      y: container.y - local.y,
    };
  }

  private onPartGlobalPointerMove(e: FederatedPointerEvent) {
    // Gizmo handle repositioning (edit mode)
    if (this.movingGizmoHandle) {
      const {
        handle,
        gizmoGroup,
        startLocal,
        handleStart,
        role,
        updatesAnchor,
      } = this.movingGizmoHandle;

      const container = this.partContainers.get(role)!;
      if (!container.parent) return;

      // Calculate delta in gizmoGroup space BEFORE moving anything
      const cur = gizmoGroup.toLocal(e.global);
      const dx = cur.x - startLocal.x;
      const dy = cur.y - startLocal.y;

      if (dx === 0 && dy === 0) return;

      if (updatesAnchor && role) {
        const sprite = this.partSprites.get(role);
        if (sprite && sprite.texture && sprite.texture.source.width > 0) {
          const tw = sprite.texture.width;
          const th = sprite.texture.height;
          const ax = sprite.anchor.x;
          const ay = sprite.anchor.y;

          // 1. Calculate new proposed pivot
          const oldPivotX = container.pivot.x;
          const oldPivotY = container.pivot.y;

          let newPivotX = oldPivotX + dx;
          let newPivotY = oldPivotY + dy;

          // Constrain pivot to bounding box relative to anchor
          // Range: [-ax * tw, (1 - ax) * tw]
          newPivotX = Math.max(-ax * tw, Math.min((1 - ax) * tw, newPivotX));
          newPivotY = Math.max(-ay * th, Math.min((1 - ay) * th, newPivotY));

          const actualDx = newPivotX - oldPivotX;
          const actualDy = newPivotY - oldPivotY;

          if (actualDx === 0 && actualDy === 0) return;

          // 2. Update pivot
          container.pivot.x = newPivotX;
          container.pivot.y = newPivotY;

          // Sync handle position (visually represent the pivot)
          handle.x = newPivotX;
          handle.y = newPivotY;

          // 3. Move container to compensate
          container.x += actualDx;
          container.y += actualDy;

          // Update debug box
          this.drawBoundingBox(role);

          // Notify UI
          this.props.onChange?.(role, {
            pivotX: container.pivot.x,
            pivotY: container.pivot.y,
            x: container.x,
            y: container.y,
          });

          // Re-capture startLocal relative to the NOW-MOVED gizmoGroup
          this.movingGizmoHandle.startLocal = gizmoGroup.toLocal(e.global);

          // Update connectors
          this.drawGizmoLines(role);
        }
      } else {
        handle.x = handleStart.x + dx;
        handle.y = handleStart.y + dy;
        this.drawGizmoLines(role);
      }
      return;
    }

    // Body-Head Rotation handle
    if (this.bhDragging && this.bhHandle && this.bhHandleGroup) {
      const local = this.bhHandleGroup.toLocal(e.global);
      // Constraint to X only and clamp to range
      const newX = Math.max(
        -this.bhHandleRange,
        Math.min(this.bhHandleRange, local.x),
      );
      this.bhHandle.x = newX;

      // Map to normalized value -1 to 1
      this.bhValue = newX / this.bhHandleRange;
      this.applyBodyHeadRotation();
      this.publishMove();
      return;
    }

    // Rotation
    if (this.rotatingRole) {
      const container = this.partContainers.get(this.rotatingRole)!;
      const worldPos = container.getGlobalPosition();
      const angle = Math.atan2(
        e.global.y - worldPos.y,
        e.global.x - worldPos.x,
      );
      container.rotation =
        this.rotateStartContainerRotation + (angle - this.rotateStartAngle);
      this.props.onChange?.(this.rotatingRole, {
        rotation: container.rotation * (180 / Math.PI),
      });
    }

    // IK for arms
    if (this.draggingRole && this.draggingRole.includes("arm-hand")) {
      const side = this.draggingRole.includes("left") ? "left" : "right";
      if (this.ikState[side].enabled) {
        const target = {
          x: e.global.x + this.ikOffset.x,
          y: e.global.y + this.ikOffset.y,
        };
        this.solveIK(side, target);
        this.publishMove();
        return;
      }
    }

    // Part translation (interactive mode)
    if (this.draggingRole) {
      // ONLY freeze manual movement for arm parts whose side has IK enabled.
      // Other parts (body, head, legs, non-IK arms) remain draggable.
      const isArmPart = this.draggingRole.includes("arm-");
      const side = this.draggingRole.includes("left") ? "left" : "right";
      if (isArmPart && this.ikState[side].enabled) return;

      const container = this.partContainers.get(this.draggingRole)!;
      if (!container.parent) return;
      const local = container.parent.toLocal(e.global);
      container.x = local.x + this.partOffset.x;
      container.y = local.y + this.partOffset.y;
      this.props.onChange?.(this.draggingRole, {
        x: container.x,
        y: container.y,
      });
    }
  }

  private onPartPointerUp() {
    this.draggingRole = null;
    this.rotatingRole = null;
    this.movingGizmoHandle = null;
    this.bhDragging = false;
  }

  // --- Gizmos (builder mode) ---

  private buildGizmos() {
    for (const role of ALL_PART_ROLES) {
      this.attachPartGizmo(role);
    }
  }

  private makeRotateHandle(): Graphics {
    const g = new Graphics();
    // Outer ring arc to suggest rotation
    g.arc(0, 0, 18, -Math.PI * 0.7, Math.PI * 0.7).stroke({
      color: 0xa855f7,
      width: 3,
    });
    // Filled center circle
    g.circle(0, 0, 8).fill({ color: 0xa855f7 });
    return g;
  }

  private makeTranslateHandle(): Graphics {
    const g = new Graphics();
    const color = 0x3b82f6; // Blue for translate
    // Outer square with rounded corners
    g.roundRect(-15, -15, 30, 30, 4).stroke({ color, width: 3 });
    // Cross lines
    g.moveTo(-10, 0).lineTo(10, 0).stroke({ color, width: 2 });
    g.moveTo(0, -10).lineTo(0, 10).stroke({ color, width: 2 });
    // Arrow heads
    g.moveTo(-12, 0).lineTo(-8, -4).stroke({ color, width: 2 });
    g.moveTo(-12, 0).lineTo(-8, 4).stroke({ color, width: 2 });
    g.moveTo(12, 0).lineTo(8, -4).stroke({ color, width: 2 });
    g.moveTo(12, 0).lineTo(8, 4).stroke({ color, width: 2 });
    g.moveTo(0, -12).lineTo(-4, -8).stroke({ color, width: 2 });
    g.moveTo(0, -12).lineTo(4, -8).stroke({ color, width: 2 });
    g.moveTo(0, 12).lineTo(-4, 8).stroke({ color, width: 2 });
    g.moveTo(0, 12).lineTo(4, 8).stroke({ color, width: 2 });
    // Center point
    g.circle(0, 0, 5).fill({ color });
    return g;
  }

  private attachPartGizmo(role: string) {
    const container = this.partContainers.get(role);
    const sprite = this.partSprites.get(role);
    if (!container || !sprite) return;

    const isGizmoLess = (
      CompositeHumanCharacter.NO_GIZMO_ROLES as readonly string[]
    ).includes(role);

    const gizmoGroup = new Container();
    gizmoGroup.alpha = 0;
    gizmoGroup.zIndex = 200;
    container.addChild(gizmoGroup);
    this.gizmoGroups.set(role, gizmoGroup);

    const isRotatable = (
      CompositeHumanCharacter.ROTATABLE_ROLES as readonly string[]
    ).includes(role);

    const show = () => {
      if (this.textures.has(role)) {
        gizmoGroup.alpha = 1;
        this.drawGizmoLines(role);
      }
    };
    const hide = () => {
      if (
        this.rotatingRole !== role &&
        this.draggingRole !== role &&
        !this.movingGizmoHandle
      ) {
        gizmoGroup.alpha =
          this.gizmoEditMode && this.textures.has(role) ? 1 : 0;
        this.drawGizmoLines(role);
      }
    };

    if (isGizmoLess) {
      // Show pivot dot for gizmo-less roles on hover
      const pivotDot = new Graphics();
      pivotDot.rect(-0.5, -0.5, 1, 1).fill({ color: 0x3b82f6 });
      pivotDot.x = container.pivot.x;
      pivotDot.y = container.pivot.y;
      gizmoGroup.addChild(pivotDot);
    } else {
      const setupHandle = (
        type: "rotate" | "translate",
        x: number,
        y: number,
      ) => {
        const handle =
          type === "rotate"
            ? this.makeRotateHandle()
            : this.makeTranslateHandle();
        // Handle position is relative to pivot + offset
        handle.x = container.pivot.x + x;
        handle.y = container.pivot.y + y;
        handle.eventMode = "static";
        handle.cursor = type === "rotate" ? "grab" : "move";
        gizmoGroup.addChild(handle);

        const connector = new Graphics();
        gizmoGroup.addChild(connector);

        this.gizmoHandleRefs.push({
          handle,
          connector,
          gizmoGroup,
          defaultCursor: handle.cursor,
          role,
          updatesAnchor: true,
          type,
          defaultX: x,
          defaultY: y,
        });

        handle.on("pointerover", show);
        handle.on("pointerout", hide);

        handle.on("pointerdown", (e: FederatedPointerEvent) => {
          e.stopPropagation();
          if (this.gizmoEditMode) {
            const startLocal = gizmoGroup.toLocal(e.global);
            this.movingGizmoHandle = {
              handle,
              connector,
              gizmoGroup,
              startLocal: { x: startLocal.x, y: startLocal.y },
              handleStart: { x: handle.x, y: handle.y },
              role,
              updatesAnchor: true,
            };
          } else {
            if (type === "rotate") {
              const worldPos = container.getGlobalPosition();
              this.rotatingRole = role;
              this.rotateStartAngle = Math.atan2(
                e.global.y - worldPos.y,
                e.global.x - worldPos.x,
              );
              this.rotateStartContainerRotation = container.rotation;
            } else {
              this.draggingRole = role;

              if (this.isAnyIKActive() && role.includes("arm-hand")) {
                const worldPos = container.getGlobalPosition();
                this.ikOffset = {
                  x: worldPos.x - e.global.x,
                  y: worldPos.y - e.global.y,
                };
              }

              const local = container.parent!.toLocal(e.global);
              this.partOffset = {
                x: container.x - local.x,
                y: container.y - local.y,
              };
            }
          }
        });
      };

      if (role.toLowerCase().includes("arm-hand")) {
        setupHandle("rotate", 0, 0);
        setupHandle("translate", 0, 0);
      } else {
        setupHandle(isRotatable ? "rotate" : "translate", 0, 0);
      }
    }

    // Bounding Box (Debug) — always added now, even for NO_GIZMO_ROLES
    const debugBox = new Graphics();
    debugBox.label = "debug-box";
    debugBox.alpha = this.showBoundingBoxes ? 0.3 : 0;
    debugBox.eventMode = "none"; // CRITICAL: don't block mouse events
    container.addChild(debugBox);
    this.boundingBoxGraphics.set(role, debugBox);
    this.drawBoundingBox(role);

    // Initial show/hide for the sprite itself
    sprite.on("pointerover", show);
    sprite.on("pointerout", hide);

    // Initial draw
    this.drawGizmoLines(role);
    this.updateGizmoVisibilitiesForRole(role);
  }

  private drawGizmoLines(role: string) {
    const container = this.partContainers.get(role);
    const refs = this.gizmoHandleRefs.filter((r) => r.role === role);
    if (!container) return;

    for (const ref of refs) {
      ref.connector.clear();
    }
  }

  // Toggle gizmo edit mode: when enabled, dragging handles repositions them;
  // when disabled, handles trigger their normal rotate/translate behaviour.
  setGizmoEditMode(enabled: boolean) {
    this.gizmoEditMode = enabled;
    for (const [role, group] of this.gizmoGroups) {
      // Only show gizmo group if the part actually has a texture placed
      const hasTexture = this.textures.has(role);
      group.alpha = enabled && hasTexture ? 1 : 0;

      // Hide Turn Mode slider when editing gizmos
      if (enabled && this.bhHandleGroup) {
        this.bhHandleGroup.visible = false;
      }

      const container = this.partContainers.get(role);
      const refs = this.gizmoHandleRefs.filter((r) => r.role === role);

      if (container) {
        for (const ref of refs) {
          ref.handle.cursor = enabled ? "crosshair" : ref.defaultCursor;
          if (ref.updatesAnchor) {
            if (enabled) {
              // Edit mode: handle stays pinned to the pivot point for direct manipulation
              ref.handle.x = container.pivot.x;
              ref.handle.y = container.pivot.y;
            } else {
              // Normal mode: restore the default offset RELATIVE to the current pivot
              ref.handle.x = container.pivot.x + ref.defaultX;
              ref.handle.y = container.pivot.y + ref.defaultY;
            }
          }
        }
        this.drawGizmoLines(role);
      }
    }
  }

  setIKState(state: {
    left: { enabled: boolean; flipped: boolean };
    right: { enabled: boolean; flipped: boolean };
  }) {
    this.ikState = {
      left: { ...state.left, target: this.ikState.left.target },
      right: { ...state.right, target: this.ikState.right.target },
    };
    // Re-sync all gizmos to show/hide based on IK
    for (const [role] of this.partContainers) {
      this.updateGizmoVisibilitiesForRole(role);
    }
  }

  setIKMode(enabled: boolean) {
    this.ikState.left.enabled = enabled;
    this.ikState.right.enabled = enabled;
    // Re-sync all gizmos to show/hide based on IK
    for (const [role] of this.partContainers) {
      this.updateGizmoVisibilitiesForRole(role);
    }
  }

  private updateGizmoVisibilitiesForRole(role: string) {
    const group = this.gizmoGroups.get(role);
    if (!group) return;

    const isHand = role.toLowerCase().includes("arm-hand");
    const refs = this.gizmoHandleRefs.filter((r) => r.role === role);

    const side = role.toLowerCase().includes("-left") ? "left" : "right";
    const ikEnabled = this.ikState[side].enabled;

    const isArmSegment =
      role.includes("arm-upper") || role.includes("arm-forearm");

    // Apply visibility rules to each handle ref
    for (const ref of refs) {
      if (
        this.bodyHeadRotationEnabled &&
        (role === "head" || role === "body")
      ) {
        if (ref.type === "rotate") {
          ref.handle.visible = false;
          continue;
        }
      }

      if (ikEnabled) {
        if (isHand) {
          // In IK mode, hand ONLY shows translate (the IK handle)
          ref.handle.visible = ref.type === "translate";
        } else if (isArmSegment) {
          // In IK mode, hide rotation/translation for upper/forearm of THIS arm
          ref.handle.visible = false;
        } else {
          // Other parts (for the ACTIVE IK SIDE) - should we hide their translate too?
          // Usually a part belongs to only one side or 'none'.
          // For simplicity, we'll handle global IK state below.
          ref.handle.visible = true;
        }
      } else {
        // Regular mode for this role
        if (isHand) {
          ref.handle.visible = ref.type === "rotate";
        } else {
          ref.handle.visible = true;
        }
      }
    }
  }

  // --- Logic ---

  setExpression(type: string, value: boolean, fromRemote = false) {
    if (!fromRemote && this.props.room && this.props.canDrag) {
      this.publishExpression(type, value);
    }

    switch (type) {
      case "laughing":
        this.setLaughing(value);
        break;
      case "smiling":
        this.setSmile(value);
        break;
      case "sad":
        this.setSad(value);
        break;
      case "blink":
        this.setBlink(value);
        break;
      case "raisedBrows":
        this.setEyebrowsUp(value);
        break;
      case "happyBrows":
        this.setEyebrowsHappy(value);
        break;
      case "angryBrows":
        this.setEyebrowsAngry(value);
        break;
      case "angry":
        this.setAngry(value);
        break;
    }
  }

  private publishExpression(type: string, value: boolean) {
    if (!this.props.room) return;
    const msg = {
      type: "prop:expression",
      castId: this.props.castId,
      expression: type,
      value,
    };
    this.props.room.localParticipant.publishData(
      encoder.encode(JSON.stringify(msg)),
      {
        reliable: true,
      },
    );
  }

  setBlinking(isBlinking: boolean) {
    const roles = ["eye-left", "eye-right"] as const;
    for (const role of roles) {
      const sprite = this.partSprites.get(role);
      if (!sprite) continue;

      const mainTexture = this.textures.get(role);
      const blinkTexture = this.variationTextures.get(role);

      if (isBlinking && blinkTexture) {
        sprite.texture = blinkTexture;
      } else if (mainTexture) {
        sprite.texture = mainTexture;
      }

      // Hide pupil when blinking
      const pupilRole = role === "eye-left" ? "pupil-left" : "pupil-right";
      const pupilContainer = this.partContainers.get(pupilRole);
      if (pupilContainer) {
        pupilContainer.visible = !isBlinking;
      }
    }
  }

  setEyebrowsUp(up: boolean) {
    const roles = ["eye-brow-left", "eye-brow-right"] as const;
    for (const role of roles) {
      const container = this.partContainers.get(role);
      const sprite = this.partSprites.get(role);
      if (!container || !sprite) continue;

      // Clear any existing animation
      this.eyebrowTweens.get(role)?.kill();

      if (up) {
        // Store current Y as the neutral position if not already animating
        if (!this.eyebrowOriginalYs.has(role)) {
          this.eyebrowOriginalYs.set(role, container.y);
        }

        // Calculate displacement: 2 * height of the bounding box
        const bounds = sprite.getBounds();
        const targetY = this.eyebrowOriginalYs.get(role)! - 0.5 * bounds.height;

        const tween = gsap.to(container, {
          duration: 0.25,
          pixi: { y: targetY },
          ease: "power2.in",
        });
        this.eyebrowTweens.set(role, tween);
      } else {
        const originalY = this.eyebrowOriginalYs.get(role);
        if (originalY !== undefined) {
          const tween = gsap.to(container, {
            duration: 0.25,
            pixi: { y: originalY },
            ease: "power2.in",
            onComplete: () => {
              this.eyebrowOriginalYs.delete(role);
            },
          });
          this.eyebrowTweens.set(role, tween);
        }
      }
    }
  }

  setEyebrowsAngry(angry: boolean) {
    if (this.isEyebrowsAngry === angry) return;
    this.isEyebrowsAngry = angry;

    const roles = ["eye-brow-left", "eye-brow-right"] as const;
    for (const role of roles) {
      const container = this.partContainers.get(role);
      const sprite = this.partSprites.get(role);
      if (!container || !sprite) continue;

      // Clear any existing animation
      this.eyebrowTweens.get(role)?.kill();

      const mainTexture = this.textures.get(role);
      const altTexture = this.variationTextures.get(role);

      if (angry && altTexture && mainTexture) {
        // Angry brows uses frame index 2 of the alt texture/sprite sheet
        sprite.texture = new PIXI.Texture({
          source: altTexture.source,
          frame: new PIXI.Rectangle(
            0,
            0,
            mainTexture.width,
            mainTexture.height,
          ),
        });
      } else if (!angry && mainTexture) {
        sprite.texture = mainTexture;
      }

      // Store initial state
      if (!this.eyebrowOriginalXs.has(role)) {
        this.eyebrowOriginalXs.set(role, container.x);
      }
      if (!this.eyebrowOriginalYs.has(role)) {
        this.eyebrowOriginalYs.set(role, container.y);
      }
      if (!this.eyebrowOriginalRots.has(role)) {
        this.eyebrowOriginalRots.set(role, container.angle);
      }

      if (angry) {
        // Calculate displacement
        const bounds = sprite.getBounds();
        const targetY = this.eyebrowOriginalYs.get(role)! - 0.2 * bounds.height;
        // Move towards center: left moves right (+), right moves left (-)
        const xOffset = 0.2 * bounds.width;
        const targetX =
          role === "eye-brow-left"
            ? this.eyebrowOriginalXs.get(role)! - xOffset
            : this.eyebrowOriginalXs.get(role)! + xOffset;

        // Negated angles compared to happy
        const targetAngle = role === "eye-brow-left" ? -25 : 25;

        const tween = gsap.to(container, {
          duration: 0.3,
          pixi: { x: targetX, y: targetY, angle: targetAngle },
          ease: "power2.out",
        });
        this.eyebrowTweens.set(role, tween);
      } else {
        const originalX = this.eyebrowOriginalXs.get(role)!;
        const originalY = this.eyebrowOriginalYs.get(role)!;
        const originalRot = this.eyebrowOriginalRots.get(role)!;

        // Reset to original pose
        const tween = gsap.to(container, {
          duration: 0.3,
          pixi: { x: originalX, y: originalY, angle: originalRot },
          ease: "power2.inOut",
          onComplete: () => {
            // Only cleanup if no other eyebrow animation is active
            if (!this.isEyebrowsAngry && !this.isEyebrowsHappy) {
              this.eyebrowOriginalXs.delete(role);
              this.eyebrowOriginalYs.delete(role);
              this.eyebrowOriginalRots.delete(role);
            }
          },
        });
        this.eyebrowTweens.set(role, tween);
      }
    }
  }

  setEyebrowsHappy(happy: boolean) {
    if (this.isEyebrowsHappy === happy) return;
    this.isEyebrowsHappy = happy;

    const roles = ["eye-brow-left", "eye-brow-right"] as const;
    for (const role of roles) {
      const container = this.partContainers.get(role);
      const sprite = this.partSprites.get(role);
      if (!container || !sprite) continue;

      // Clear any existing animation
      this.eyebrowTweens.get(role)?.kill();

      const mainTexture = this.textures.get(role);
      const altTexture = this.variationTextures.get(role);

      if (happy && altTexture && mainTexture) {
        // Happy brows uses the alt texture directly (no vertical offset)
        sprite.texture = new PIXI.Texture({
          source: altTexture.source,
          frame: new PIXI.Rectangle(
            0,
            0,
            mainTexture.width,
            mainTexture.height,
          ),
        });
      } else if (!happy && mainTexture) {
        sprite.texture = mainTexture;
      }

      // Store initial state
      if (!this.eyebrowOriginalYs.has(role)) {
        this.eyebrowOriginalYs.set(role, container.y);
      }
      if (!this.eyebrowOriginalRots.has(role)) {
        this.eyebrowOriginalRots.set(role, container.angle);
      }

      if (happy) {
        // Calculate displacement: 0.3 * height of the bounding box
        const bounds = sprite.getBounds();
        const targetY = this.eyebrowOriginalYs.get(role)! - 0.3 * bounds.height;
        const targetAngle = role === "eye-brow-left" ? 10 : -10;

        const tween = gsap.to(container, {
          duration: 0.3,
          pixi: { y: targetY, angle: targetAngle },
          ease: "power2.out",
        });
        this.eyebrowTweens.set(role, tween);
      } else {
        const originalY = this.eyebrowOriginalYs.get(role)!;
        const originalRot = this.eyebrowOriginalRots.get(role)!;

        // Reset to original pose
        const tween = gsap.to(container, {
          duration: 0.3,
          pixi: { y: originalY, angle: originalRot },
          ease: "power2.inOut",
          onComplete: () => {
            // Only cleanup if no other eyebrow animation is active
            if (!this.isEyebrowsHappy && !this.isEyebrowsAngry) {
              this.eyebrowOriginalYs.delete(role);
              this.eyebrowOriginalRots.delete(role);
            }
          },
        });
        this.eyebrowTweens.set(role, tween);
      }
    }
  }

  setSpeaking(isSpeaking: boolean) {
    if (this.isSpeaking === isSpeaking) return;
    this.isSpeaking = isSpeaking;

    const mouthContainer = this.partContainers.get("mouth");
    const mouthSprite = this.partSprites.get("mouth");
    const mainTexture = this.textures.get("mouth");
    const altTexture = this.variationTextures.get("mouth");
    if (!mouthContainer || !mouthSprite || !mainTexture) return;

    this.speakingTimeline?.kill();
    this.smileTween?.kill();
    this.laughTween?.kill();
    this.sadTimeline?.kill();

    if (isSpeaking && altTexture) {
      this.isSmiling = false;
      this.isLaughing = false;
      this.isMouthSad = false;
      // 4 vertical variations: frame height = height of the mouth container's main texture
      const frameHeight = mainTexture.height;
      const frameWidth = mainTexture.width;

      // Cache the 4 textures for performance
      const frames: PIXI.Texture[] = [];
      for (let i = 0; i < 4; i++) {
        frames.push(
          new PIXI.Texture({
            source: altTexture.source,
            frame: new PIXI.Rectangle(
              0,
              i * frameHeight,
              frameWidth,
              frameHeight,
            ),
          }),
        );
      }

      this.speakingTimeline = gsap.timeline({ repeat: -1 });
      mouthContainer.visible = true;

      const frameDuration = 0.15;

      this.speakingTimeline
        .call(() => {
          const randomIndex = Math.floor(Math.random() * frames.length);
          mouthSprite.texture = frames[randomIndex];
        })
        .to({}, { duration: frameDuration });

      // Raise eyebrows while speaking
      this.setEyebrowsUp(true);
    } else {
      // Revert to stable mouth when not speaking
      mouthSprite.texture = mainTexture;
      mouthContainer.visible = this.forceMouthVisible;
      this.speakingTimeline = null;

      // Lower eyebrows when silent
      if (!this.isSmiling && !this.isLaughing && !this.isMouthSad) {
        this.setEyebrowsUp(false);
      }
    }
  }

  setLaughing(isLaughing: boolean) {
    if (this.isLaughing === isLaughing) return;
    this.isLaughing = isLaughing;

    const mouthContainer = this.partContainers.get("mouth");
    const mouthSprite = this.partSprites.get("mouth");
    const mainTexture = this.textures.get("mouth");
    // Favor variationTextures2 (Mouth Expression Texture)
    const altTexture =
      this.variationTextures2.get("mouth") ??
      this.variationTextures.get("mouth");

    if (!mouthContainer || !mouthSprite || !mainTexture) return;

    if (isLaughing && altTexture) {
      // 3rd frame (index 2 as per user manual edit)
      const frameHeight = mainTexture.height;
      const frameWidth = mainTexture.width;

      const laughTexture = new PIXI.Texture({
        source: altTexture.source,
        frame: new PIXI.Rectangle(0, 1 * frameHeight, frameWidth, frameHeight),
      });

      mouthSprite.texture = laughTexture;
      mouthContainer.visible = true;

      // Position logic: store original skip if already animating
      if (this.mouthOriginalY === null) {
        this.mouthOriginalY = mouthContainer.y;
      }

      // Kill conflicting mouth animations
      this.laughTween?.kill();
      this.smileTween?.kill();
      this.speakingTimeline?.kill();
      this.sadTimeline?.kill();

      this.isSmiling = false;
      this.isSpeaking = false;
      this.isMouthSad = false;

      // Animate upward by 1/4 of height with a bounce
      this.laughTween = gsap.to(mouthContainer, {
        pixi: { y: this.mouthOriginalY - frameHeight / 7 },
        duration: 0.2,
        ease: "circle.out",
        repeat: -1,
        yoyo: true,
      });

      // Raise eyebrows and blink while laughing
      this.setEyebrowsUp(true);
      this.setEyebrowsHappy(true);
      this.setBlinking(true);
    } else {
      // Cleanup laugh-specific animation
      this.laughTween?.kill();
      this.laughTween = null;
      if (this.mouthOriginalY !== null) {
        mouthContainer.y = this.mouthOriginalY;
        this.mouthOriginalY = null;
      }

      // Revert to stable mouth when not laughing (if not speaking)
      if (!this.isSpeaking) {
        mouthSprite.texture = mainTexture;
        mouthContainer.visible = this.forceMouthVisible;
        this.setEyebrowsUp(false);
        this.setEyebrowsHappy(false);
        this.setBlinking(false);
      }
    }
  }

  setSad(sad: boolean) {
    if (this.isMouthSad === sad) return;
    this.isMouthSad = sad;

    const mouthContainer = this.partContainers.get("mouth");
    const mouthSprite = this.partSprites.get("mouth");
    const mainTexture = this.textures.get("mouth");
    // Favor variationTextures2 (Mouth Expression Texture)
    const altTexture =
      this.variationTextures2.get("mouth") ??
      this.variationTextures.get("mouth");

    if (!mouthContainer || !mouthSprite || !mainTexture) return;

    this.sadTimeline?.kill();
    this.smileTween?.kill();
    this.laughTween?.kill();
    this.speakingTimeline?.kill();

    if (sad && altTexture) {
      this.isSmiling = false;
      this.isLaughing = false;
      this.isSpeaking = false;
      this.isAngry = false;
      const frameHeight = mainTexture.height;
      const frameWidth = mainTexture.width;

      // Kill conflicting mouth animations
      this.smileTween?.kill();
      this.laughTween?.kill();
      this.speakingTimeline?.kill();

      // Store original position if not already animating
      if (this.mouthOriginalY === null) {
        this.mouthOriginalY = mouthContainer.y;
      }

      // Create texture for frame index 2
      const sadTexture = new PIXI.Texture({
        source: altTexture.source,
        frame: new PIXI.Rectangle(0, 2 * frameHeight, frameWidth, frameHeight),
      });

      mouthSprite.texture = sadTexture;
      this.sadTimeline = null;

      // Slight downward displacement for sad expression
      gsap.to(mouthContainer, {
        pixi: { y: this.mouthOriginalY + frameHeight / 10 },
        duration: 0.5,
        ease: "power2.out",
      });

      mouthContainer.visible = true;

      // Raise eyebrows while sad
      this.setEyebrowsUp(true);
      this.setEyebrowsHappy(true);
    } else {
      // Reset to neutral
      mouthSprite.texture = mainTexture;
      if (this.mouthOriginalY !== null) {
        gsap.to(mouthContainer, {
          pixi: { y: this.mouthOriginalY },
          duration: 0.3,
          ease: "power2.inOut",
        });
      }
      this.sadTimeline = null;

      // Reset eyebrows
      this.setEyebrowsUp(false);
      this.setEyebrowsHappy(false);
    }
  }

  setAngry(angry: boolean) {
    if (this.isAngry === angry) return;
    this.isAngry = angry;

    const role = "mouth";
    const mouthContainer = this.partContainers.get(role);
    const mouthSprite = this.partSprites.get(role);
    const mainTexture = this.textures.get(role);
    // Favor variationTextures2 (Mouth Expression Texture)
    const altTexture =
      this.variationTextures2.get(role) ?? this.variationTextures.get(role);

    if (!mouthContainer || !mouthSprite || !mainTexture) return;

    if (angry && altTexture) {
      this.isSmiling = false;
      this.isLaughing = false;
      this.isMouthSad = false;
      this.isSpeaking = false;

      // Kill conflicting mouth animations
      this.smileTween?.kill();
      this.laughTween?.kill();
      this.speakingTimeline?.kill();
      this.sadTimeline?.kill();

      // Store original position if not already animating
      if (this.mouthOriginalY === null) {
        this.mouthOriginalY = mouthContainer.y;
      }

      const frameWidth = mainTexture.width;
      const frameHeight = mainTexture.height;

      // Create texture for frame index 2 (similar to sad mouth shape)
      const angryMouthTexture = new PIXI.Texture({
        source: altTexture.source,
        frame: new PIXI.Rectangle(0, 2 * frameHeight, frameWidth, frameHeight),
      });

      mouthSprite.texture = angryMouthTexture;

      // Slight downward displacement
      gsap.to(mouthContainer, {
        pixi: { y: this.mouthOriginalY + frameHeight / 10 },
        duration: 0.5,
        ease: "power2.out",
      });

      mouthContainer.visible = true;

      // Angry brows logic
      this.setEyebrowsUp(true);
      this.setEyebrowsAngry(true);
    } else {
      // Reset to neutral
      mouthSprite.texture = mainTexture;
      if (this.mouthOriginalY !== null) {
        gsap.to(mouthContainer, {
          pixi: { y: this.mouthOriginalY },
          duration: 0.3,
          ease: "power2.inOut",
        });
      }

      // Reset eyebrows
      this.setEyebrowsUp(false);
      this.setEyebrowsAngry(false);
    }
  }

  setAutoBlinking(enabled: boolean) {
    if (this.isAutoBlinking === enabled) return;
    this.isAutoBlinking = enabled;

    if (this.autoBlinkTimeline) {
      this.autoBlinkTimeline.kill();
      this.autoBlinkTimeline = null;
    }

    if (!enabled) {
      this.setBlink(false);
      return;
    }

    // Create a repeating GSAP timeline for auto-blinking
    // Cycle: 4s gap -> 0.3s blink (close eyes) -> repeat
    const tl = gsap.timeline({ repeat: -1 });

    tl.to({}, { duration: 4 }); // Initial 4s gap
    tl.call(() => this.setBlink(true)); // Close eyes
    tl.to({}, { duration: 0.3 }); // Keep closed for 300ms
    tl.call(() => this.setBlink(false)); // Open eyes

    this.autoBlinkTimeline = tl;
  }

  setBlink(isBlinking: boolean) {
    if (this.isBlinking === isBlinking) return;
    this.isBlinking = isBlinking;

    const roles = ["eye-left", "eye-right"] as const;
    for (const role of roles) {
      const sprite = this.partSprites.get(role);
      if (!sprite) continue;

      const mainTexture = this.textures.get(role);
      const altTexture = this.variationTextures.get(role);

      if (isBlinking && altTexture && mainTexture) {
        // Blink is typically the second frame (index 1)
        const frameWidth = mainTexture.width;
        const frameHeight = mainTexture.height;

        const blinkTexture = new PIXI.Texture({
          source: altTexture.source,
          frame: new PIXI.Rectangle(0, 0, frameWidth, frameHeight),
        });

        sprite.texture = blinkTexture;
      } else if (mainTexture) {
        sprite.texture = mainTexture;
      }

      // Hide pupils when eyes are closed (blinking)
      const pupilRole = role === "eye-left" ? "pupil-left" : "pupil-right";
      const pupilContainer = this.partContainers.get(pupilRole);
      if (pupilContainer) {
        pupilContainer.visible = !isBlinking;
      }
    }
  }

  setSmile(isSmiling: boolean) {
    if (this.isSmiling === isSmiling) return;
    this.isSmiling = isSmiling;

    const mouthContainer = this.partContainers.get("mouth");
    const mouthSprite = this.partSprites.get("mouth");
    const mainTexture = this.textures.get("mouth");
    // Favor variationTextures2 (Mouth Expression Texture)
    const altTexture =
      this.variationTextures2.get("mouth") ??
      this.variationTextures.get("mouth");

    if (!mouthContainer || !mouthSprite || !mainTexture) return;

    if (isSmiling && altTexture) {
      // Mouth variation frame index 0
      const frameHeight = mainTexture.height;
      const frameWidth = mainTexture.width;

      const smileTexture = new PIXI.Texture({
        source: altTexture.source,
        frame: new PIXI.Rectangle(0, 0 * frameHeight, frameWidth, frameHeight),
      });

      mouthSprite.texture = smileTexture;
      mouthContainer.visible = true;

      // Position logic: store original position if not already animating
      if (this.mouthOriginalY === null) {
        this.mouthOriginalY = mouthContainer.y;
      }

      // Kill conflicting mouth animations
      this.smileTween?.kill();
      this.laughTween?.kill();
      this.speakingTimeline?.kill();
      this.sadTimeline?.kill();

      this.isLaughing = false;
      this.isSpeaking = false;
      this.isMouthSad = false;

      // Animate upward once as requested
      this.smileTween = gsap.to(mouthContainer, {
        pixi: { y: this.mouthOriginalY - frameHeight / 8 },
        duration: 0.3,
        ease: "back.out(2)",
      });

      // Raise eyebrows while smiling
      this.setEyebrowsUp(true);
    } else {
      // Cleanup smile-specific animation
      this.smileTween?.kill();
      this.smileTween = null;

      if (this.mouthOriginalY !== null && !this.isLaughing) {
        mouthContainer.y = this.mouthOriginalY;
        this.mouthOriginalY = null;
      }

      // Revert to stable mouth if not speaking/laughing/sad
      if (!this.isSpeaking && !this.isLaughing && !this.isMouthSad) {
        mouthSprite.texture = mainTexture;
        mouthContainer.visible = this.forceMouthVisible;
        this.setEyebrowsUp(false);
      }
    }
  }

  setMouthVisible(visible: boolean) {
    this.forceMouthVisible = visible;
    const mouthContainer = this.partContainers.get("mouth");
    if (mouthContainer && !this.isSpeaking) {
      mouthContainer.visible = visible;
    }
  }

  updatePupils(stageX: number, stageY: number) {
    const headContainer = this.partContainers.get("head");
    const headSprite = this.partSprites.get("head");
    if (!headContainer || !headSprite) return;

    // 1. Boundary Check: Only track if cursor is within the PHYSICAL head sprite area
    // Using sprite bounds is more accurate than container bounds which might include
    // parts that poke out (like eyes or hair).
    const headBounds = headSprite.getBounds();
    const centerX = headBounds.x + headBounds.width / 2;
    const centerY = headBounds.y + headBounds.height / 2;
    // Double the tracking area: use full width/height as the half-extents
    const halfWidth = headBounds.width;
    const halfHeight = headBounds.height;

    const isInsideTrackingArea =
      stageX >= centerX - halfWidth &&
      stageX <= centerX + halfWidth &&
      stageY >= centerY - halfHeight &&
      stageY <= centerY + halfHeight;

    // 2. Normalized Mouse Position (-1 to 1) relative to area center
    let nx = 0;
    let ny = 0;

    if (isInsideTrackingArea) {
      nx = (stageX - centerX) / halfWidth;
      ny = (stageY - centerY) / halfHeight;
    }

    this.applyPupilMovement(nx, ny);

    // Sync gaze over LiveKit
    if (this.props.canDrag) {
      this.publishMove();
    }
  }

  private applyPupilMovement(nx: number, ny: number) {
    this.pupilNx = nx;
    this.pupilNy = ny;

    const updatePupil = (pupilRole: string, eyeRole: string) => {
      const pupilContainer = this.partContainers.get(pupilRole);
      const pupilSprite = this.partSprites.get(pupilRole);
      const eyeSprite = this.partSprites.get(eyeRole);
      const pupilData = this.props.parts.find((p) => p.partRole === pupilRole);
      const eyeData = this.props.parts.find((p) => p.partRole === eyeRole);

      if (
        !pupilContainer ||
        !pupilSprite ||
        !eyeSprite ||
        !pupilData ||
        !eyeData
      )
        return;

      // 3. Movement Constraint: Pupils are bounded by the eye bounding box
      const maxMoveX = Math.max(0, (eyeSprite.width - pupilSprite.width) / 2);
      const maxMoveY = Math.max(0, (eyeSprite.height - pupilSprite.height) / 2);

      // 4. Calculate Original Relative Position (Baseline)
      // This handles the eye-relative coordinate space migration
      let relBaseX = pupilData.x;
      let relBaseY = pupilData.y;
      if (pupilData.x > 100) {
        relBaseX = pupilData.x - eyeData.x;
        relBaseY = pupilData.y - eyeData.y;
      }

      // 5. Apply Position (Neutral + Mouse Offset)
      pupilContainer.x = relBaseX + nx * maxMoveX;
      pupilContainer.y = relBaseY + ny * maxMoveY;
    };

    updatePupil("pupil-left", "eye-left");
    updatePupil("pupil-right", "eye-right");
  }

  private solveIK(
    side: "left" | "right",
    targetGlobal: { x: number; y: number },
  ) {
    this.ikState[side].target = targetGlobal;
    const chain = CompositeHumanCharacter.ARM_CHAINS[side];
    const upperRole = chain[0];
    const middleRole = chain[1];
    const handRole = chain[2];

    const upper = this.partContainers.get(upperRole);
    const middle = this.partContainers.get(middleRole);
    const hand = this.partContainers.get(handRole);

    if (!upper || !middle || !hand || !upper.parent) return;

    // 1. Convert target to body space (upper's parent space)
    const targetLocal = upper.parent.toLocal(targetGlobal);

    // 2. Base vectors and angles (capture the resting orientation of the part images)
    // Vector from shoulder pivot to elbow attachment in upper arm local space
    const vUpperLocal = {
      x: middle.x - upper.pivot.x,
      y: middle.y - upper.pivot.y,
    };
    const baseAngle1 = Math.atan2(vUpperLocal.y, vUpperLocal.x);
    const l1 = Math.sqrt(
      vUpperLocal.x * vUpperLocal.x + vUpperLocal.y * vUpperLocal.y,
    );

    // Vector from elbow pivot to hand attachment in forearm local space
    const vMiddleLocal = {
      x: hand.x - middle.pivot.x,
      y: hand.y - middle.pivot.y,
    };
    const baseAngle2 = Math.atan2(vMiddleLocal.y, vMiddleLocal.x);
    const l2 = Math.sqrt(
      vMiddleLocal.x * vMiddleLocal.x + vMiddleLocal.y * vMiddleLocal.y,
    );

    // 3. Distance to target from shoulder joint (upper.x/y is the shoulder in parent space)
    const dx = targetLocal.x - upper.x;
    const dy = targetLocal.y - upper.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // 4. IK Math (Law of Cosines)
    const angleToTarget = Math.atan2(dy, dx);
    const maxDist = l1 + l2;
    const minDist = Math.abs(l1 - l2) + 0.1;
    const d = Math.max(minDist, Math.min(maxDist, dist));

    let alpha = 0;
    if (d < maxDist) {
      const cosAlpha = (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d);
      alpha = Math.acos(Math.max(-1, Math.min(1, cosAlpha)));
    }

    // Determine bend direction
    const sideState = this.ikState[side];
    const flip = (sideState.flipped ? 1 : -1) * (side === "right" ? -1 : 1);

    // Absolute target angles for the bone vectors in parent space
    const thetaAB = angleToTarget - alpha * flip;

    const cosBeta = (l1 * l1 + l2 * l2 - d * d) / (2 * l1 * l2);
    const beta = Math.acos(Math.max(-1, Math.min(1, cosBeta)));
    const thetaBC = thetaAB + (Math.PI - beta) * flip;

    // 5. Final Container Rotations (Adjusting for base angles)
    const finalUpperRotation = thetaAB - baseAngle1;
    const finalMiddleRotation = thetaBC - thetaAB + (baseAngle1 - baseAngle2);

    // Apply rotations directly and notify change (in degrees)
    upper.rotation = finalUpperRotation;
    middle.rotation = finalMiddleRotation;

    this.props.onChange?.(upperRole, {
      rotation: upper.rotation * (180 / Math.PI),
    });
    this.props.onChange?.(middleRole, {
      rotation: middle.rotation * (180 / Math.PI),
    });
  }

  updatePupilsWithNormalized(nx: number, ny: number) {
    this.applyPupilMovement(nx, ny);
  }

  applyRemoteMove(msg: PropMoveMessage) {
    this.container.x = msg.x;
    this.container.y = msg.y;

    const torso = this.partContainers.get("torso");
    if (torso) {
      torso.rotation = msg.rotation * (Math.PI / 180);
      torso.scale.x = msg.scaleX;
      torso.scale.y = Math.abs(msg.scaleX);
    }

    // Apply specific part rotations
    if (msg.rotationBody !== undefined) {
      const body = this.partContainers.get("body");
      if (body) body.rotation = msg.rotationBody * (Math.PI / 180);
    }
    if (msg.rotationHead !== undefined) {
      const head = this.partContainers.get("head");
      if (head) head.rotation = msg.rotationHead * (Math.PI / 180);
    }

    // Apply Arm rotations (FK over the wire)
    if (msg.rotationArmUpperL !== undefined) {
      const upper = this.partContainers.get("arm-upper-left");
      if (upper) upper.rotation = msg.rotationArmUpperL * (Math.PI / 180);
    }
    if (msg.rotationArmForearmL !== undefined) {
      const forearm = this.partContainers.get("arm-forearm-left");
      if (forearm) forearm.rotation = msg.rotationArmForearmL * (Math.PI / 180);
    }
    if (msg.rotationArmUpperR !== undefined) {
      const upper = this.partContainers.get("arm-upper-right");
      if (upper) upper.rotation = msg.rotationArmUpperR * (Math.PI / 180);
    }
    if (msg.rotationArmForearmR !== undefined) {
      const forearm = this.partContainers.get("arm-forearm-right");
      if (forearm) forearm.rotation = msg.rotationArmForearmR * (Math.PI / 180);
    }

    // Apply remote gaze
    if (msg.pupilPos) {
      this.applyPupilMovement(msg.pupilPos.x, msg.pupilPos.y);
    }
  }

  private publishMove(immediate = false) {
    const { room, canDrag, castId } = this.props;
    if (!room || !canDrag) {
      console.warn(`[CompositeCharacter] publishMove blocked: ${this.props.sceneCastId}`, {
        hasRoom: !!room,
        canDrag,
      });
      return;
    }
    const now = Date.now();
    if (!immediate && now - this.lastSendTime < 30) return;
    this.lastSendTime = now;

    // Get current part rotations to broadcast
    const torso = this.partContainers.get("torso");
    const body = this.partContainers.get("body");
    const head = this.partContainers.get("head");
    const upperL = this.partContainers.get("arm-upper-left");
    const forearmL = this.partContainers.get("arm-forearm-left");
    const upperR = this.partContainers.get("arm-upper-right");
    const forearmR = this.partContainers.get("arm-forearm-right");

    const msg: PropMoveMessage = {
      type: "prop:move",
      castId,
      x: this.container.x,
      y: this.container.y,
      rotation: (torso?.rotation ?? 0) * (180 / Math.PI),
      scaleX: torso?.scale.x ?? 1,
      indexZ: 0,
    };

    // Body/Head (Turn Mode result)
    if (body) msg.rotationBody = body.rotation * (180 / Math.PI);
    if (head) msg.rotationHead = head.rotation * (180 / Math.PI);

    // Left Arm (IK result)
    if (upperL) msg.rotationArmUpperL = upperL.rotation * (180 / Math.PI);
    if (forearmL) msg.rotationArmForearmL = forearmL.rotation * (180 / Math.PI);

    // Right Arm (IK result)
    if (upperR) msg.rotationArmUpperR = upperR.rotation * (180 / Math.PI);
    if (forearmR) msg.rotationArmForearmR = forearmR.rotation * (180 / Math.PI);

    // Include gaze if we have tracked it locally
    if (this.pupilNx !== 0 || this.pupilNy !== 0) {
      msg.pupilPos = { x: this.pupilNx, y: this.pupilNy };
    }

    room.localParticipant.publishData(encoder.encode(JSON.stringify(msg)), {
      reliable: false,
    });
  }

  private persistPosition() {
    if (!this.props.canDrag) return;
    const torso = this.partContainers.get("torso");
    saveSceneCastPosition({
      data: {
        sceneCastId: this.props.sceneCastId,
        x: this.container.x,
        y: this.container.y,
        rotation: (torso?.rotation ?? 0) * (180 / Math.PI),
        scaleX: torso?.scale.x ?? 1,
      },
    });
  }

  private bringToTop() {
    const stage = this.props.app.stage;
    this.container.zIndex = stage.children.length + 1;
    stage.sortChildren();
  }

  saveCurrentPosition() {
    if (!this.props.canDrag) return;
    this.persistPosition();
  }

  destroy() {
    if (this.autoBlinkTimeline) {
      this.autoBlinkTimeline.kill();
      this.autoBlinkTimeline = null;
    }

    if (this.speakingTimeline) {
      this.speakingTimeline.kill();
    }
    for (const tween of this.eyebrowTweens.values()) {
      tween.kill();
    }
    if (this.boundPartPointerMove) {
      this.props.app.stage.off("globalpointermove", this.boundPartPointerMove);
    }
    if (this.boundPartPointerUp) {
      this.props.app.stage.off("pointerup", this.boundPartPointerUp);
    }
    window.removeEventListener("keydown", this.handleGlobalKeyDown);
    this.container.destroy({ children: true });
  }

  // Returns current live canvas state for all placed parts.
  // Used by the studio to preserve state when rebuilding the composite.
  getLiveState(): Record<
    string,
    { x: number; y: number; pivotX: number; pivotY: number; rotation: number }
  > {
    const result: Record<
      string,
      { x: number; y: number; pivotX: number; pivotY: number; rotation: number }
    > = {};
    for (const [role, container] of this.partContainers) {
      // If Turn Mode is active, we report the "at rest" rotation for body/head
      // to prevents saving the temporary slider-driven rotation to database.
      let rotation = container.rotation;
      if (this.bodyHeadRotationEnabled) {
        if (role === "body") rotation = this.bhInitialBodyRot;
        if (role === "head") rotation = this.bhInitialHeadRot;
      }

      result[role] = {
        x: container.x,
        y: container.y,
        rotation: rotation * (180 / Math.PI),
        pivotX: container.pivot.x,
        pivotY: container.pivot.y,
      };
    }
    return result;
  }

  // Builder utilities
  updatePartPivot(role: string, x: number, y: number) {
    const container = this.partContainers.get(role);
    if (container) {
      container.pivot.set(x, y);
      this.drawBoundingBox(role);
    }
  }

  setFrozen(frozen: boolean) {
    this.container.eventMode = frozen ? "none" : "static";
  }

  setPartPosition(role: string, x: number, y: number) {
    const container = this.partContainers.get(role);
    if (container) {
      container.x = x;
      container.y = y;
    }
  }

  getPartTextureSize(role: string): { width: number; height: number } | null {
    const sprite = this.partSprites.get(role);
    if (!sprite || !sprite.texture || sprite.texture.source.width === 0)
      return null;
    return { width: sprite.texture.width, height: sprite.texture.height };
  }

  setBoundingBoxesVisible(visible: boolean) {
    this.showBoundingBoxes = visible;
    for (const box of this.boundingBoxGraphics.values()) {
      box.alpha = visible ? 0.4 : 0;
    }
  }

  private drawBoundingBox(role: string) {
    const box = this.boundingBoxGraphics.get(role);
    const sprite = this.partSprites.get(role);
    const container = this.partContainers.get(role);
    if (!box || !sprite || !sprite.texture || !container) return;

    box.clear();
    const tw = sprite.texture.width;
    const th = sprite.texture.height;
    const ax = sprite.anchor.x;
    const ay = sprite.anchor.y;

    const color = this.getRoleColor(role);
    // Boundary traces the sprite edge
    box
      .rect(-ax * tw, -ay * th, tw, th)
      .stroke({ color, width: 2 })
      .fill({ color, alpha: 0.1 });
  }

  private getRoleColor(role: string): number {
    const roles = ALL_PART_ROLES;
    const colors = [
      0xff5555, 0x55ff55, 0x5555ff, 0xffff55, 0xff55ff, 0x55ffff, 0xff8800,
      0x88ff00, 0x00ff88, 0x0088ff, 0x8800ff, 0xff0088, 0xffaa00, 0x00ffaa,
      0xaa00ff, 0xff00aa, 0xaaff00, 0x00aaff,
    ];
    const idx = roles.indexOf(role as PartRole);
    return colors[idx % colors.length];
  }

  // --- Body-Head Rotation UI ---

  private setupBodyHeadRotationUI() {
    const head = this.partContainers.get("head");
    if (!head || this.bhHandleGroup) return;

    // Create a dedicated hit area for Turn Mode interaction
    // (covers head + slider area above it)
    this.bhHitArea = new Graphics();
    this.bhHitArea.label = "bh-hit-area";
    this.bhHitArea.eventMode = "none";
    this.bhHitArea.cursor = "default";
    const torso = this.partContainers.get("torso") ?? head;
    torso.addChild(this.bhHitArea);

    // Control Handle Group (Outer container for positioning)
    this.bhHandleGroup = new Container();
    this.bhHandleGroup.label = "bh-handle-group";
    this.bhHandleGroup.visible = false;
    this.bhHandleGroup.alpha = 0;
    this.bhHandleGroup.zIndex = 500;
    torso.sortableChildren = true;
    torso.addChild(this.bhHandleGroup);

    // Slider Container (The interactive "unit" containing track + handle)
    this.bhSliderContainer = new Container();
    this.bhSliderContainer.label = "bh-slider-container";
    this.bhSliderContainer.eventMode = "static";
    this.bhSliderContainer.cursor = "default";
    this.bhHandleGroup.addChild(this.bhSliderContainer);

    // Track for guide
    const track = new Graphics();
    this.bhSliderContainer.addChild(track);

    const handle = this.makeTranslateHandle();
    handle.eventMode = "static";
    handle.cursor = "ew-resize";
    handle.scale.set(0.8);
    this.bhSliderContainer.addChild(handle);
    this.bhHandle = handle;

    handle.on("pointerdown", (e: FederatedPointerEvent) => {
      e.stopPropagation();
      this.bhDragging = true;
    });

    // Hover listeners on the slider container itself to keep it visible
    this.bhSliderContainer.on("pointerover", () => this.onHeadHover(true));
    this.bhSliderContainer.on("pointerout", () => this.onHeadHover(false));

    this.updateBHUIPlacement();
  }

  private updateBHUIPlacement() {
    const headContainer = this.partContainers.get("head");
    const torsoContainer = this.partContainers.get("torso");
    const headSprite = this.partSprites.get("head");
    if (
      !headContainer ||
      !torsoContainer ||
      !headSprite ||
      !this.bhHandleGroup ||
      !this.bhSliderContainer
    )
      return;

    // IF we don't have a fixed position yet, calculate it now
    // (This usually happens once per setTurnMode(true) or if first hover)
    if (!this.bhSliderFixedPos) {
      // Temporarily revert Turn Mode rotations to calculate "at rest" position
      const currentVal = this.bhValue;
      if (currentVal !== 0) {
        this.bhValue = 0;
        this.applyBodyHeadRotation();
      }

      // Calculate head origin in torso-local coordinates
      const headOriginInTorso = torsoContainer.toLocal(
        new PIXI.Point(0, 0),
        headContainer,
      );

      const headWidth = headSprite.texture.width;
      const headHeight = headSprite.texture.height;
      const ay = headSprite.anchor.y;
      const topOffset = ay * headHeight;

      // Position handle group above head within torsoContainer
      this.bhSliderFixedPos = {
        x: headOriginInTorso.x,
        y: headOriginInTorso.y - topOffset - 35, // Positioning above "header"
      };

      this.bhHandleRange = headWidth * 0.5;

      // Restore rotations if we reverted them
      if (currentVal !== 0) {
        this.bhValue = currentVal;
        this.applyBodyHeadRotation();
      }
    }

    // Apply the fixed position
    this.bhHandleGroup.x = this.bhSliderFixedPos.x;
    this.bhHandleGroup.y = this.bhSliderFixedPos.y;

    // Redraw track in the grouped container
    const track = this.bhSliderContainer.getChildAt(0) as Graphics;
    if (track) {
      track
        .clear()
        .moveTo(-this.bhHandleRange, 0)
        .lineTo(this.bhHandleRange, 0)
        .stroke({ color: 0x3b82f6, width: 2, alpha: 0.3 });
    }

    // Update hitArea for the slider container based on its bounds
    // We pad it slightly to make it easier to stay within the "slider area"
    const PADDING = 20;
    this.bhSliderContainer.hitArea = new PIXI.Rectangle(
      -this.bhHandleRange - PADDING,
      -PADDING,
      this.bhHandleRange * 2 + PADDING * 2,
      PADDING * 2,
    );

    // Update broader hit area to cover head + slider
    if (this.bhHitArea) {
      const headOriginInTorso = torsoContainer.toLocal(
        new PIXI.Point(0, 0),
        headContainer,
      );
      this.bhHitArea.x = headOriginInTorso.x;
      this.bhHitArea.y = headOriginInTorso.y;

      const tw = headSprite.texture.width;
      const th = headSprite.texture.height;
      const ax = headSprite.anchor.x;
      const ay = headSprite.anchor.y;

      const hitTop = -(ay * th) - 85; // Coverage above slider
      const hitBottom = (1 - ay) * th;
      const hitHeight = hitBottom - hitTop;

      this.bhHitArea
        .clear()
        .rect(-ax * tw, hitTop, tw, hitHeight)
        .fill({ color: 0xffffff, alpha: 0.001 }); // Invisible hit area
    }
  }

  private onHeadHover(isOver: boolean) {
    if (!this.bodyHeadRotationEnabled || this.gizmoEditMode) return;
    if (this.bhHandleGroup) {
      this.bhHandleGroup.visible = isOver;
      this.bhHandleGroup.alpha = isOver ? 1 : 0;
      if (isOver) {
        this.updateBHUIPlacement();
      }
    }
  }

  setTurnMode(enabled: boolean) {
    this.bodyHeadRotationEnabled = enabled;

    if (this.bhHandleGroup) {
      if (!enabled) {
        this.bhHandleGroup.visible = false;
        if (this.bhHitArea) this.bhHitArea.eventMode = "none";
        // Revert rotations if disabling
        this.bhValue = 0;
        this.applyBodyHeadRotation();
        this.bhSliderFixedPos = null;
      } else {
        if (this.bhHitArea) this.bhHitArea.eventMode = "static";
        // Reset fixed position to trigger recalculation at rest
        this.bhSliderFixedPos = null;
        // Capture initial rotations
        this.bhInitialBodyRot = this.partContainers.get("body")?.rotation ?? 0;
        this.bhInitialHeadRot = this.partContainers.get("head")?.rotation ?? 0;
        if (this.bhHandle) this.bhHandle.x = 0;
        this.bhValue = 0;
        this.updateBHUIPlacement();
      }

      // Re-sync gizmos for the impacted parts (head/body)
      this.updateGizmoVisibilitiesForRole("head");
      this.updateGizmoVisibilitiesForRole("body");
    }
  }

  private applyBodyHeadRotation() {
    const body = this.partContainers.get("body");
    const head = this.partContainers.get("head");
    if (!body || !head) return;

    // Simultaneous rotation logic
    // We apply normalized bhValue * max rotation angle
    const maxBodyRot = 24 * (Math.PI / 180); // 24 degrees max for body
    const maxHeadRot = 40 * (Math.PI / 180); // 40 degrees max for head

    const bodyRotOffset = this.bhValue * maxBodyRot;
    const headRotOffset = this.bhValue * maxHeadRot;

    body.rotation = this.bhInitialBodyRot + bodyRotOffset;
    head.rotation = this.bhInitialHeadRot + headRotOffset;
  }

  handleGlobalHover(globalPoint: { x: number; y: number }) {
    if (
      !this.bodyHeadRotationEnabled ||
      !this.bhHandleGroup ||
      this.gizmoEditMode
    )
      return;

    // Check if point is inside head sprite, hit area, or the slider itself
    const headSprite = this.partSprites.get("head");
    const isOverHead =
      headSprite?.getBounds().containsPoint(globalPoint.x, globalPoint.y) ??
      false;
    const isOverHitArea =
      this.bhHitArea?.getBounds().containsPoint(globalPoint.x, globalPoint.y) ??
      false;
    const isOverSlider =
      this.bhSliderContainer
        ?.getBounds()
        .containsPoint(globalPoint.x, globalPoint.y) ?? false;

    const isOver = isOverHead || isOverHitArea || isOverSlider;
    this.onHeadHover(isOver);
  }
}
