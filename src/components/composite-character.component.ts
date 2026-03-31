// src/components/composite-character.component.ts
import { Application, Assets, Container, Graphics, Sprite } from "pixi.js";
import type { FederatedPointerEvent, Texture } from "pixi.js";
import { GlowFilter } from "pixi-filters/glow";
import type { Room } from "livekit-client";
import { saveSceneCastPosition } from "@/lib/scenes.fns";
import type { PropType } from "@/db/schema";
import type { PropMoveMessage } from "@/lib/livekit-messages";

export const ALL_PART_ROLES = [
  "body", "head", "jaw", "eye-left", "eye-right", "pupil-left", "pupil-right",
  "eye-brow-left", "eye-brow-right", "eye-closed-left", "eye-closed-right",
  "arm-upper-left", "arm-forearm-left", "arm-hand-left",
  "arm-upper-right", "arm-forearm-right", "arm-hand-right",
  "leg-upper-left", "leg-lower-left", "leg-foot-left",
  "leg-upper-right", "leg-lower-right", "leg-foot-right",
] as const;

export type PartRole = typeof ALL_PART_ROLES[number];

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
  private glowFilter: GlowFilter;
  private readonly props: CompositeCharacterProps;
  private partContainers: Map<string, Container> = new Map();
  private partSprites: Map<string, Sprite> = new Map();
  private textures: Map<string, Texture> = new Map();
  private altTextures: Map<string, Texture> = new Map();

  private isDragging = false;
  private dragOffset = { x: 0, y: 0 };
  private activePointers = new Map<number, { x: number; y: number }>();
  private lastSendTime = 0;
  private isSpeaking = false;

  // Stored so they can be removed from the stage on destroy()
  private boundPartPointerMove: ((e: FederatedPointerEvent) => void) | null = null;
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
    type: 'rotate' | 'translate';
    defaultX: number;
    defaultY: number;
  }> = [];

  private boundingBoxGraphics: Map<string, Graphics> = new Map();
  private showBoundingBoxes = false;

  private static readonly ROTATABLE_ROLES = [
    'head',
    'arm-upper-left', 'arm-forearm-left', 'arm-hand-left',
    'arm-upper-right', 'arm-forearm-right', 'arm-hand-right',
    'leg-upper-left', 'leg-lower-left', 'leg-foot-left',
    'leg-upper-right', 'leg-lower-right', 'leg-foot-right',
  ] as const;

  private static readonly NO_GIZMO_ROLES = [
    'eye-left', 'eye-right', 'pupil-left', 'pupil-right',
    'eye-closed-left', 'eye-closed-right'
  ] as const;

  constructor(props: CompositeCharacterProps) {
    this.props = props;
    this.showBoundingBoxes = props.showBoundingBoxes ?? false;

    this.container = new Container();
    this.container.label = props.sceneCastId;
    this.container.zIndex = 1;
    this.container.x = props.initialX ?? 100;
    this.container.y = props.initialY ?? 100;

    this.glowFilter = new GlowFilter({
      color: 0xa855f7,
      outerStrength: 4,
      innerStrength: 0,
      distance: 15,
      quality: 0.5,
    });
    this.glowFilter.enabled = false;

    this.loadAllTextures().then(() => {
      this.buildHierarchy();
      this.setupInteraction();
      this.props.onReady?.();
    });
  }

  private async loadAllTextures() {
    const loadPromises = this.props.parts.flatMap((p) => {
      const promises = [];
      if (p.imageUrl) {
        promises.push(
          Assets.load(p.imageUrl).then((tex) => this.textures.set(p.partRole, tex))
        );
      }
      if (p.altImageUrl) {
        promises.push(
          Assets.load(p.altImageUrl).then((tex) => this.altTextures.set(p.partRole, tex))
        );
      }
      return promises;
    });
    await Promise.all(loadPromises);
  }

  private buildHierarchy() {
    const partsByRole = new Map(this.props.parts.map(p => [p.partRole, p]));

    // Always creates a container for the role, using part data if available or defaults.
    // Sprites without a loaded texture are invisible (no hit area), so unplaced parts
    // are inert until the user drops them onto the canvas.
    const createPart = (role: string, parent: Container): Container => {
      const data = partsByRole.get(role);

      const container = new Container();
      container.label = role;
      container.x = data?.x ?? 0;
      container.y = data?.y ?? 0;
      container.rotation = (data?.rotation ?? 0) * (Math.PI / 180);
      container.zIndex = data?.zIndex ?? ALL_PART_ROLES.indexOf(role as PartRole);

      const sprite = new Sprite();
      const tex = this.textures.get(role);
      if (tex) sprite.texture = tex;
      
      // Default sprite anchor (always untouched by gizmo)
      sprite.anchor.set(0.5, 0.5);

      const isGizmoLess = (CompositeCharacter.NO_GIZMO_ROLES as readonly string[]).includes(role);
      
      // Use pivot for rotation point (stored in pixels)
      // Gizmo-less roles are enforced to center pivot (0,0 with 0.5 anchor)
      container.pivot.set(isGizmoLess ? 0 : (data?.pivotX ?? 0), isGizmoLess ? 0 : (data?.pivotY ?? 0));

      if (role === 'body') {
        sprite.filters = [this.glowFilter];
      }

      container.addChild(sprite);
      parent.addChild(container);

      this.partContainers.set(role, container);
      this.partSprites.set(role, sprite);

      return container;
    };

    // 1. Body — root child of the composite container
    const body = createPart('body', this.container);

    // 2. Head and its facial parts — attached to body
    const head = createPart('head', body);
    createPart('jaw', head);
    createPart('eye-left', head);
    createPart('eye-right', head);
    createPart('pupil-left', head);
    createPart('pupil-right', head);
    createPart('eye-brow-left', head);
    createPart('eye-brow-right', head);
    createPart('eye-closed-left', head);
    createPart('eye-closed-right', head);

    // 3. Arms — attached to body
    const aul = createPart('arm-upper-left', body);
    const afl = createPart('arm-forearm-left', aul);
    createPart('arm-hand-left', afl);

    const aur = createPart('arm-upper-right', body);
    const afr = createPart('arm-forearm-right', aur);
    createPart('arm-hand-right', afr);

    // 4. Legs — attached to body
    const lul = createPart('leg-upper-left', body);
    const lll = createPart('leg-lower-left', lul);
    createPart('leg-foot-left', lll);

    const lur = createPart('leg-upper-right', body);
    const llr = createPart('leg-lower-right', lur);
    createPart('leg-foot-right', llr);

    this.container.scale.x = this.props.initialScaleX ?? 1;
    this.container.rotation = (this.props.initialRotation ?? 0) * (Math.PI / 180);
    this.container.sortChildren();
  }

  private setupInteraction() {
    const { canDrag, interactive = false } = this.props;

    if (interactive) {
      // Builder mode: each placed (textured) part is independently draggable
      this.props.app.stage.eventMode = 'static';

      for (const [role, sprite] of this.partSprites) {
        if (!this.textures.has(role)) continue; // skip unplaced parts

        // All parts that have textures can be manually dragged
        sprite.eventMode = 'static';
        sprite.cursor = 'move';
        sprite.on('pointerdown', (e) => this.onPartPointerDown(e, role));
      }

      this.boundPartPointerMove = this.onPartGlobalPointerMove.bind(this);
      this.boundPartPointerUp = this.onPartPointerUp.bind(this);
      this.props.app.stage.on('globalpointermove', this.boundPartPointerMove);
      this.props.app.stage.on('pointerup', this.boundPartPointerUp);

      this.buildGizmos();
    } else {
      // Stage mode: root container / body handles drag
      const bodySprite = this.partSprites.get('body');
      if (bodySprite) {
        bodySprite.eventMode = canDrag ? "static" : "none";
        bodySprite.cursor = canDrag ? "pointer" : "default";
        if (canDrag) {
          bodySprite.on("pointerdown", this.onPointerDown.bind(this));
          bodySprite.on("pointerup", this.onPointerUp.bind(this));
          bodySprite.on("pointerupoutside", this.onPointerUp.bind(this));
          bodySprite.on("globalpointermove", this.onStagePointerMove.bind(this));
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
    // Gizmo handle repositioning (edit mode)
    if (this.movingGizmoHandle) {
      const { handle, gizmoGroup, startLocal, handleStart, role, updatesAnchor } = this.movingGizmoHandle;
      
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
            y: container.y
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
      const angle = Math.atan2(e.global.y - worldPos.y, e.global.x - worldPos.x);
      container.rotation = this.rotateStartContainerRotation + (angle - this.rotateStartAngle);
      this.props.onChange?.(this.rotatingRole, { rotation: container.rotation * (180 / Math.PI) });
      return;
    }

    // Part translation (interactive mode)
    if (this.draggingRole) {
      const container = this.partContainers.get(this.draggingRole)!;
      if (!container.parent) return;
      const local = container.parent.toLocal(e.global);
      container.x = local.x + this.partOffset.x;
      container.y = local.y + this.partOffset.y;
      this.props.onChange?.(this.draggingRole, { x: container.x, y: container.y });
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
    g.arc(0, 0, 18, -Math.PI * 0.7, Math.PI * 0.7).stroke({ color: 0xa855f7, width: 3 });
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

    const isGizmoLess = (CompositeCharacter.NO_GIZMO_ROLES as readonly string[]).includes(role);

    const gizmoGroup = new Container();
    gizmoGroup.alpha = 0;
    gizmoGroup.zIndex = 200;
    container.addChild(gizmoGroup);
    this.gizmoGroups.set(role, gizmoGroup);

    const isRotatable = (CompositeCharacter.ROTATABLE_ROLES as readonly string[]).includes(role);

    const show = () => { if (this.textures.has(role)) { gizmoGroup.alpha = 1; this.drawGizmoLines(role); } };
    const hide = () => { 
      if (this.rotatingRole !== role && this.draggingRole !== role && !this.movingGizmoHandle) {
        gizmoGroup.alpha = (this.gizmoEditMode && this.textures.has(role)) ? 1 : 0; 
        this.drawGizmoLines(role);
      }
    };

    if (isGizmoLess) {
      // Show pivot dot for gizmo-less roles on hover
      const pivotDot = new Graphics();
      pivotDot.circle(0, 0, 4).fill({ color: 0x3B82F6, alpha: 0.8 });
      pivotDot.x = container.pivot.x;
      pivotDot.y = container.pivot.y;
      gizmoGroup.addChild(pivotDot);
    } else {
      const setupHandle = (type: 'rotate' | 'translate', x: number, y: number) => {
        const handle = type === 'rotate' ? this.makeRotateHandle() : this.makeTranslateHandle();
        // Handle position is relative to pivot + offset
        handle.x = container.pivot.x + x;
        handle.y = container.pivot.y + y;
        handle.eventMode = 'static';
        handle.cursor = type === 'rotate' ? 'grab' : 'move';
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
          defaultY: y
        });

        handle.on('pointerover', show);
        handle.on('pointerout', hide);

        handle.on('pointerdown', (e: FederatedPointerEvent) => {
          e.stopPropagation();
          if (this.gizmoEditMode) {
            const startLocal = gizmoGroup.toLocal(e.global);
            this.movingGizmoHandle = {
              handle, connector, gizmoGroup,
              startLocal: { x: startLocal.x, y: startLocal.y },
              handleStart: { x: handle.x, y: handle.y },
              role,
              updatesAnchor: true
            };
          } else {
            if (type === 'rotate') {
              const worldPos = container.getGlobalPosition();
              this.rotatingRole = role;
              this.rotateStartAngle = Math.atan2(e.global.y - worldPos.y, e.global.x - worldPos.x);
              this.rotateStartContainerRotation = container.rotation;
            } else {
              this.draggingRole = role;
              const local = container.parent!.toLocal(e.global);
              this.partOffset = { x: container.x - local.x, y: container.y - local.y };
            }
          }
        });
      };

      setupHandle(isRotatable ? 'rotate' : 'translate', 0, 0);
    }

    // Bounding Box (Debug) — always added now, even for NO_GIZMO_ROLES
    const debugBox = new Graphics();
    debugBox.label = "debug-box";
    debugBox.alpha = this.showBoundingBoxes ? 0.3 : 0;
    debugBox.eventMode = 'none'; // CRITICAL: don't block mouse events
    container.addChild(debugBox);
    this.boundingBoxGraphics.set(role, debugBox);
    this.drawBoundingBox(role);

    // Initial show/hide for the sprite itself
    sprite.on('pointerover', show);
    sprite.on('pointerout', hide);
    
    // Initial draw
    this.drawGizmoLines(role);
  }

  private drawGizmoLines(role: string) {
    const container = this.partContainers.get(role);
    const refs = this.gizmoHandleRefs.filter(r => r.role === role);
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
      group.alpha = (enabled && hasTexture) ? 1 : 0;

      const container = this.partContainers.get(role);
      const refs = this.gizmoHandleRefs.filter(r => r.role === role);
      
      if (container) {
        for (const ref of refs) {
          ref.handle.cursor = enabled ? 'crosshair' : ref.defaultCursor;
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

  // --- Logic ---

  setSpeaking(isSpeaking: boolean) {
    if (this.isSpeaking === isSpeaking) return;
    this.isSpeaking = isSpeaking;
    this.glowFilter.enabled = isSpeaking;

    const jaw = this.partSprites.get('jaw');
    if (jaw) {
      const normalTex = this.textures.get('jaw');
      const altTex = this.altTextures.get('jaw');
      if (isSpeaking && altTex) {
        jaw.texture = altTex;
      } else if (normalTex) {
        jaw.texture = normalTex;
      }
    }
  }

  updatePupils(stageX: number, stageY: number) {
    const head = this.partContainers.get('head');
    if (!head) return;

    const localPoint = head.toLocal({ x: stageX, y: stageY });

    const updatePupil = (role: string) => {
      const container = this.partContainers.get(role);
      const data = this.props.parts.find(p => p.partRole === role);
      if (!container || !data) return;

      const dx = localPoint.x - data.x;
      const dy = localPoint.y - data.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const maxDist = 8;

      if (dist > maxDist) {
        const scale = maxDist / dist;
        container.x = data.x + dx * scale;
        container.y = data.y + dy * scale;
      } else {
        container.x = localPoint.x;
        container.y = localPoint.y;
      }
    };

    updatePupil('pupil-left');
    updatePupil('pupil-right');
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
    room.localParticipant.publishData(
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
    if (this.boundPartPointerMove) {
      this.props.app.stage.off('globalpointermove', this.boundPartPointerMove);
    }
    if (this.boundPartPointerUp) {
      this.props.app.stage.off('pointerup', this.boundPartPointerUp);
    }
    this.container.destroy({ children: true });
  }

  // Returns current live canvas state for all placed parts.
  // Used by the studio to preserve state when rebuilding the composite.
  getLiveState(): Record<string, { x: number; y: number; pivotX: number; pivotY: number; rotation: number }> {
    const result: Record<string, { x: number; y: number; pivotX: number; pivotY: number; rotation: number }> = {};
    for (const [role, container] of this.partContainers) {
      result[role] = {
        x: container.x,
        y: container.y,
        rotation: container.rotation * (180 / Math.PI),
        pivotX: container.pivot.x,
        pivotY: container.pivot.y
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
    box.rect(-ax * tw, -ay * th, tw, th)
       .stroke({ color, width: 2 })
       .fill({ color, alpha: 0.1 });
  }

  private getRoleColor(role: string): number {
    const roles = ALL_PART_ROLES;
    const colors = [
      0xff5555, 0x55ff55, 0x5555ff, 0xffff55, 0xff55ff, 0x55ffff,
      0xff8800, 0x88ff00, 0x00ff88, 0x0088ff, 0x8800ff, 0xff0088,
      0xffaa00, 0x00ffaa, 0xaa00ff, 0xff00aa, 0xaaff00, 0x00aaff
    ];
    const idx = roles.indexOf(role as PartRole);
    return colors[idx % colors.length];
  }
}
