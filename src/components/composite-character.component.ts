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
  anchorX: number;
  anchorY: number;
  offsetX: number;
  offsetY: number;
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
  onChange?: (role: string, data: Partial<CharacterPartData>) => void;
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
    initialAnchor: { x: number; y: number };
    initialContainerPos: { x: number; y: number };
  } | null = null;
  // All draggable gizmo handles, stored for cursor toggling
  private gizmoHandleRefs: Array<{
    handle: Graphics;
    connector: Graphics;
    gizmoGroup: Container;
    defaultCursor: string;
    role: string;
    updatesAnchor: boolean;
  }> = [];

  private static readonly ROTATABLE_ROLES = [
    'head', 'arm-upper-left', 'arm-upper-right', 'arm-forearm-left', 'arm-forearm-right',
  ];

  constructor(props: CompositeCharacterProps) {
    this.props = props;

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
      container.x = data?.offsetX ?? 0;
      container.y = data?.offsetY ?? 0;
      container.rotation = (data?.rotation ?? 0) * (Math.PI / 180);
      container.zIndex = data?.zIndex ?? ALL_PART_ROLES.indexOf(role as PartRole);

      const sprite = new Sprite();
      const tex = this.textures.get(role);
      if (tex) sprite.texture = tex;
      sprite.anchor.set(data?.anchorX ?? 0.5, data?.anchorY ?? 0.5);

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
      const { handle, connector, gizmoGroup, startLocal, handleStart } = this.movingGizmoHandle;
      const cur = gizmoGroup.toLocal(e.global);
      handle.x = handleStart.x + (cur.x - startLocal.x);
      handle.y = handleStart.y + (cur.y - startLocal.y);
      // Redraw connector from group origin to new handle position
      connector.clear();
      connector.moveTo(0, 0).lineTo(handle.x, handle.y).stroke({ color: 0xa855f7, width: 1, alpha: 0.4 });
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

    // Part translation
    if (!this.draggingRole) return;
    const container = this.partContainers.get(this.draggingRole)!;
    if (!container.parent) return;
    const local = container.parent.toLocal(e.global);
    container.x = local.x + this.partOffset.x;
    container.y = local.y + this.partOffset.y;
    this.props.onChange?.(this.draggingRole, { offsetX: container.x, offsetY: container.y });
  }

  private onPartPointerUp() {
    this.draggingRole = null;
    this.rotatingRole = null;
    this.movingGizmoHandle = null;
  }

  // --- Gizmos (builder mode) ---

  private buildGizmos() {
    for (const role of CompositeCharacter.ROTATABLE_ROLES) {
      this.attachRotateGizmo(role);
    }
    this.attachBodyGizmos();
  }

  private makeRotateHandle(): Graphics {
    const g = new Graphics();
    // Outer ring arc to suggest rotation
    g.arc(0, 0, 11, -Math.PI * 0.7, Math.PI * 0.7).stroke({ color: 0xa855f7, width: 2 });
    // Filled center circle
    g.circle(0, 0, 5).fill({ color: 0xa855f7 });
    return g;
  }

  private attachRotateGizmo(role: string) {
    const container = this.partContainers.get(role);
    const sprite = this.partSprites.get(role);
    if (!container || !sprite) return;

    const gizmoGroup = new Container();
    gizmoGroup.alpha = 0;
    gizmoGroup.zIndex = 200;
    container.addChild(gizmoGroup);
    this.gizmoGroups.set(role, gizmoGroup);

    const connector = new Graphics();
    connector.moveTo(0, 0).lineTo(0, -52).stroke({ color: 0xa855f7, width: 1, alpha: 0.4 });
    gizmoGroup.addChild(connector);

    const handle = this.makeRotateHandle();
    handle.y = -60;
    handle.eventMode = 'static';
    handle.cursor = 'grab';
    gizmoGroup.addChild(handle);

    this.gizmoHandleRefs.push({ handle, connector, gizmoGroup, defaultCursor: 'grab' });

    const show = () => { gizmoGroup.alpha = 1; };
    const hide = () => { if (this.rotatingRole !== role && !this.movingGizmoHandle) gizmoGroup.alpha = 0; };

    sprite.on('pointerover', show);
    sprite.on('pointerout', hide);
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
        };
      } else {
        const worldPos = container.getGlobalPosition();
        this.rotatingRole = role;
        this.rotateStartAngle = Math.atan2(e.global.y - worldPos.y, e.global.x - worldPos.x);
        this.rotateStartContainerRotation = container.rotation;
      }
    });
  }

  private attachBodyGizmos() {
    const container = this.partContainers.get('body');
    const sprite = this.partSprites.get('body');
    if (!container || !sprite) return;

    const gizmoGroup = new Container();
    gizmoGroup.alpha = 0;
    gizmoGroup.zIndex = 200;
    container.addChild(gizmoGroup);
    this.gizmoGroups.set('body', gizmoGroup);

    // Move handle: crosshair at center
    const moveHandle = new Graphics();
    moveHandle.rect(-10, -2, 20, 4).fill({ color: 0x38bdf8 });
    moveHandle.rect(-2, -10, 4, 20).fill({ color: 0x38bdf8 });
    moveHandle.circle(0, 0, 12).stroke({ color: 0x38bdf8, width: 1.5 });
    moveHandle.eventMode = 'static';
    moveHandle.cursor = 'move';
    gizmoGroup.addChild(moveHandle);

    // Connector line + rotate handle above body
    const connector = new Graphics();
    connector.moveTo(0, 0).lineTo(0, -52).stroke({ color: 0xa855f7, width: 1, alpha: 0.4 });
    gizmoGroup.addChild(connector);

    const rotateHandle = this.makeRotateHandle();
    rotateHandle.y = -60;
    rotateHandle.eventMode = 'static';
    rotateHandle.cursor = 'grab';
    gizmoGroup.addChild(rotateHandle);

    const show = () => { gizmoGroup.alpha = 1; };
    const hide = () => { if (this.rotatingRole !== 'body' && this.draggingRole !== 'body') gizmoGroup.alpha = 0; };

    sprite.on('pointerover', show);
    sprite.on('pointerout', hide);
    moveHandle.on('pointerover', show);
    moveHandle.on('pointerout', hide);
    rotateHandle.on('pointerover', show);
    rotateHandle.on('pointerout', hide);

    // Dummy connector for the move handle (no line, but stored for consistent ref shape)
    const moveConnector = new Graphics();
    gizmoGroup.addChild(moveConnector);

    // Connector for rotate handle
    const rotateConnector = new Graphics();
    rotateConnector.moveTo(0, 0).lineTo(0, -52).stroke({ color: 0xa855f7, width: 1, alpha: 0.4 });
    gizmoGroup.addChild(rotateConnector);

    this.gizmoHandleRefs.push({ handle: moveHandle, connector: moveConnector, gizmoGroup, defaultCursor: 'move' });
    this.gizmoHandleRefs.push({ handle: rotateHandle, connector: rotateConnector, gizmoGroup, defaultCursor: 'grab' });

    moveHandle.on('pointerdown', (e: FederatedPointerEvent) => {
      e.stopPropagation();
      if (this.gizmoEditMode) {
        const startLocal = gizmoGroup.toLocal(e.global);
        this.movingGizmoHandle = {
          handle: moveHandle, connector: moveConnector, gizmoGroup,
          startLocal: { x: startLocal.x, y: startLocal.y },
          handleStart: { x: moveHandle.x, y: moveHandle.y },
        };
      } else {
        this.draggingRole = 'body';
        const local = container.parent!.toLocal(e.global);
        this.partOffset = { x: container.x - local.x, y: container.y - local.y };
      }
    });

    rotateHandle.on('pointerdown', (e: FederatedPointerEvent) => {
      e.stopPropagation();
      if (this.gizmoEditMode) {
        const startLocal = gizmoGroup.toLocal(e.global);
        this.movingGizmoHandle = {
          handle: rotateHandle, connector: rotateConnector, gizmoGroup,
          startLocal: { x: startLocal.x, y: startLocal.y },
          handleStart: { x: rotateHandle.x, y: rotateHandle.y },
        };
      } else {
        const worldPos = container.getGlobalPosition();
        this.rotatingRole = 'body';
        this.rotateStartAngle = Math.atan2(e.global.y - worldPos.y, e.global.x - worldPos.x);
        this.rotateStartContainerRotation = container.rotation;
      }
    });
  }

  // Toggle gizmo edit mode: when enabled, dragging handles repositions them;
  // when disabled, handles trigger their normal rotate/translate behaviour.
  setGizmoEditMode(enabled: boolean) {
    this.gizmoEditMode = enabled;
    for (const [, group] of this.gizmoGroups) {
      // In edit mode keep all gizmos always visible so the user can see and grab them.
      // In normal mode reset to hidden-until-hover.
      group.alpha = enabled ? 1 : 0;
    }
    for (const { handle, defaultCursor } of this.gizmoHandleRefs) {
      handle.cursor = enabled ? 'crosshair' : defaultCursor;
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

      const dx = localPoint.x - data.offsetX;
      const dy = localPoint.y - data.offsetY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const maxDist = 8;

      if (dist > maxDist) {
        const scale = maxDist / dist;
        container.x = data.offsetX + dx * scale;
        container.y = data.offsetY + dy * scale;
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

  // Returns current live canvas positions (local to parent) for all placed parts.
  // Used by the studio to preserve positions when rebuilding the composite.
  getLivePositions(): Record<string, { x: number; y: number }> {
    const result: Record<string, { x: number; y: number }> = {};
    for (const [role, container] of this.partContainers) {
      result[role] = { x: container.x, y: container.y };
    }
    return result;
  }

  // Builder utilities
  updatePartAnchor(role: string, x: number, y: number) {
    const sprite = this.partSprites.get(role);
    if (sprite) sprite.anchor.set(x, y);
  }
}
