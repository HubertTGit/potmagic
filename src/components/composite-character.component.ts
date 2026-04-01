// src/components/composite-character.component.ts
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
  altPropId: string | null;
  pivotX: number; // Used as Pivot X (pixels)
  pivotY: number; // Used as Pivot Y (pixels)
  x: number;
  y: number;
  zIndex: number;
  rotation: number;
  imageUrl: string | null;
  altImageUrl: string | null;
}

export interface CompositeCharacterProps {
  sceneCastId: string;
  castId: string;
  parts: CharacterPartData[];
  userId: string;
  type: PropType;
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
  autoBlink?: boolean;
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

export class CompositeCharacter {
  readonly container: Container;
  private readonly props: CompositeCharacterProps;
  private partContainers: Map<string, Container> = new Map();
  private partSprites: Map<string, Sprite> = new Map();
  private textures: Map<string, Texture> = new Map();
  private blinkTextures: Map<string, Texture> = new Map();

  private isDragging = false;
  private dragOffset = { x: 0, y: 0 };
  private activePointers = new Map<number, { x: number; y: number }>();
  private lastSendTime = 0;
  private isSpeaking = false;
  private speakingTimeline: gsap.core.Timeline | null = null;
  private blinkTimeline: gsap.core.Timeline | null = null;
  private eyebrowOriginalYs: Map<string, number> = new Map();
  private eyebrowTweens: Map<string, gsap.core.Tween> = new Map();

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

  private ikState = {
    left: { enabled: false, flipped: true },
    right: { enabled: false, flipped: true },
  };
  private static readonly ARM_CHAINS = {
    left: ["arm-upper-left", "arm-forearm-left", "arm-hand-left"],
    right: ["arm-upper-right", "arm-forearm-right", "arm-hand-right"],
  } as const;

  private ikOffset = { x: 0, y: 0 };

  private isAnyIKActive() {
    return this.ikState.left.enabled || this.ikState.right.enabled;
  }

  private boundingBoxGraphics: Map<string, Graphics> = new Map();
  private showBoundingBoxes = false;
  private forceMouthVisible = false;

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
  ] as const;

  constructor(props: CompositeCharacterProps) {
    this.props = props;
    this.showBoundingBoxes = props.showBoundingBoxes ?? false;

    this.container = new Container();
    this.container.label = props.sceneCastId;
    this.container.zIndex = 1;
    this.container.x = props.initialX ?? 100;
    this.container.y = props.initialY ?? 100;

    this.loadAllTextures().then(() => {
      this.buildHierarchy();
      this.setupInteraction();
      if (this.props.autoBlink) {
        this.startAutoBlink();
      }
      this.props.onReady?.();
    });
  }

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
            this.blinkTextures.set(p.partRole, tex),
          ),
        );
      }
      return promises;
    });
    await Promise.all(loadPromises);
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
        CompositeCharacter.NO_GIZMO_ROLES as readonly string[]
      ).includes(role);

      // Use pivot for rotation point (stored in pixels)
      // Gizmo-less roles are enforced to center pivot (0,0 with 0.5 anchor)
      container.pivot.set(
        isGizmoLess ? 0 : (data?.pivotX ?? 0),
        isGizmoLess ? 0 : (data?.pivotY ?? 0),
      );

      if (role === "mouth") {
        container.visible = false;
      }

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

    this.container.scale.x = this.props.initialScaleX ?? 1;
    this.container.rotation =
      (this.props.initialRotation ?? 0) * (Math.PI / 180);
    this.container.sortChildren();
  }

  private setupInteraction() {
    const { canDrag, interactive = false } = this.props;

    if (interactive) {
      // Builder mode: each placed (textured) part is independently draggable
      this.props.app.stage.eventMode = "static";

      for (const [role, sprite] of this.partSprites) {
        if (!this.textures.has(role)) continue; // skip unplaced parts

        // All parts that have textures can be manually dragged
        sprite.eventMode = "static";
        sprite.cursor = "move";
        sprite.on("pointerdown", (e) => this.onPartPointerDown(e, role));
      }

      this.boundPartPointerMove = this.onPartGlobalPointerMove.bind(this);
      this.boundPartPointerUp = this.onPartPointerUp.bind(this);
      this.props.app.stage.on("globalpointermove", this.boundPartPointerMove);
      this.props.app.stage.on("pointerup", this.boundPartPointerUp);

      this.buildGizmos();
    } else {
      // Stage mode: root container / body handles drag
      const bodySprite = this.partSprites.get("body");
      if (bodySprite) {
        bodySprite.eventMode = canDrag ? "static" : "none";
        bodySprite.cursor = canDrag ? "pointer" : "default";
        if (canDrag) {
          bodySprite.on("pointerdown", this.onPointerDown.bind(this));
          bodySprite.on("pointerup", this.onPointerUp.bind(this));
          bodySprite.on("pointerupoutside", this.onPointerUp.bind(this));
          bodySprite.on(
            "globalpointermove",
            this.onStagePointerMove.bind(this),
          );
        }
      }
    }
  }

  // --- Stage Mode Interaction ---

  private onPointerDown(e: FederatedPointerEvent) {
    this.activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
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
    if (!this.props.canDrag || !this.isDragging) return;
    const rawX = e.global.x + this.dragOffset.x;
    const rawY = e.global.y + this.dragOffset.y;
    this.container.x = this.clampX(rawX);
    this.container.y = this.clampY(rawY);
    this.publishMove();
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
    const anyIK = this.isAnyIKActive();

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
      CompositeCharacter.NO_GIZMO_ROLES as readonly string[]
    ).includes(role);

    const gizmoGroup = new Container();
    gizmoGroup.alpha = 0;
    gizmoGroup.zIndex = 200;
    container.addChild(gizmoGroup);
    this.gizmoGroups.set(role, gizmoGroup);

    const isRotatable = (
      CompositeCharacter.ROTATABLE_ROLES as readonly string[]
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
    this.ikState = state;
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

  setBlinking(isBlinking: boolean) {
    const roles = ["eye-left", "eye-right"] as const;
    for (const role of roles) {
      const sprite = this.partSprites.get(role);
      if (!sprite) continue;

      const mainTexture = this.textures.get(role);
      const blinkTexture = this.blinkTextures.get(role);

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

  startAutoBlink() {
    const BLINK_REPEAT = -1;
    const BLINK_DURATION = 0.5;
    const BLINK_REPEAT_DELAY = 4;

    this.stopAutoBlink();

    // Check if we have at least one blink texture
    const hasBlinkTexture = Array.from(this.blinkTextures.values()).length > 0;
    if (!hasBlinkTexture) return;

    this.blinkTimeline = gsap.timeline({
      repeat: BLINK_REPEAT,
      repeatDelay: BLINK_REPEAT_DELAY,
    });

    this.blinkTimeline
      .call(() => this.setBlinking(true))
      .to({}, { duration: BLINK_DURATION })
      .call(() => this.setBlinking(false));
  }

  setAutoBlink(enabled: boolean) {
    if (enabled) {
      this.startAutoBlink();
    } else {
      this.stopAutoBlink();
      // Ensure eyes are open when stopping
      this.setBlinking(false);
    }
  }

  stopAutoBlink() {
    if (this.blinkTimeline) {
      this.blinkTimeline.kill();
      this.blinkTimeline = null;
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

  setSpeaking(isSpeaking: boolean) {
    if (this.isSpeaking === isSpeaking) return;
    this.isSpeaking = isSpeaking;

    const mouthContainer = this.partContainers.get("mouth");
    if (!mouthContainer) return;

    this.speakingTimeline?.kill();

    if (isSpeaking) {
      // Create a 500ms show/hide cycle
      this.speakingTimeline = gsap.timeline({ repeat: -1 });
      this.speakingTimeline
        .set(mouthContainer, { visible: true })
        .to({}, { duration: 0.25 })
        .set(mouthContainer, { visible: false })
        .to({}, { duration: 0.25 });

      // Raise eyebrows while speaking
      this.setEyebrowsUp(true);
    } else {
      // Revert to manual visibility override when not speaking
      mouthContainer.visible = this.forceMouthVisible;
      this.speakingTimeline = null;

      // Lower eyebrows when silent
      this.setEyebrowsUp(false);
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
    const isInsideHead =
      stageX >= headBounds.x &&
      stageX <= headBounds.x + headBounds.width &&
      stageY >= headBounds.y &&
      stageY <= headBounds.y + headBounds.height;

    // 2. Normalized Mouse Position (-1 to 1) relative to head center
    // If outside, tracking stops and we reset to original relative position (nx/ny = 0)
    let nx = 0;
    let ny = 0;

    if (isInsideHead) {
      nx =
        (stageX - (headBounds.x + headBounds.width / 2)) /
        (headBounds.width / 2);
      ny =
        (stageY - (headBounds.y + headBounds.height / 2)) /
        (headBounds.height / 2);
    }

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
    const chain = CompositeCharacter.ARM_CHAINS[side];
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

  applyRemoteMove(msg: PropMoveMessage) {
    this.container.x = msg.x;
    this.container.y = msg.y;
    this.container.rotation = msg.rotation * (Math.PI / 180);
    this.container.scale.x = msg.scaleX;
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
      scaleX: this.container.scale.x,
      indexZ: 0,
    };
    room.localParticipant.publishData(encoder.encode(JSON.stringify(msg)), {
      reliable: false,
    });
  }

  private persistPosition() {
    if (!this.props.canDrag) return;
    saveSceneCastPosition({
      data: {
        sceneCastId: this.props.sceneCastId,
        x: this.container.x,
        y: this.container.y,
        rotation: this.container.rotation * (180 / Math.PI),
        scaleX: this.container.scale.x,
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
    this.stopAutoBlink();
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
      result[role] = {
        x: container.x,
        y: container.y,
        rotation: container.rotation * (180 / Math.PI),
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
}
