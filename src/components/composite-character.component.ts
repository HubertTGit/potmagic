// src/components/composite-character.component.ts
import { Application, Assets, Container, Sprite } from "pixi.js";
import type { FederatedPointerEvent, Texture } from "pixi.js";
import { GlowFilter } from "pixi-filters/glow";
import type { Room } from "livekit-client";
import { saveSceneCastPosition } from "@/lib/scenes.fns";
import type { PropType } from "@/db/schema";
import type { PropMoveMessage } from "@/lib/livekit-messages";

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
    // Sort parts by ZIndex before building hierarchy for flat parts, 
    // but here we follow the prescribed hierarchy.
    
    const partsByRole = new Map(this.props.parts.map(p => [p.partRole, p]));

    const createPart = (role: string, parent: Container) => {
      const data = partsByRole.get(role);
      if (!data) return null;

      const container = new Container();
      container.label = role;
      container.x = data.offsetX;
      container.y = data.offsetY;
      container.rotation = data.rotation * (Math.PI / 180);
      container.zIndex = data.zIndex;
      
      const sprite = new Sprite();
      const tex = this.textures.get(role);
      if (tex) sprite.texture = tex;
      sprite.anchor.set(data.anchorX, data.anchorY);
      
      if (role === 'body') {
        sprite.filters = [this.glowFilter];
      }

      container.addChild(sprite);
      parent.addChild(container);
      
      this.partContainers.set(role, container);
      this.partSprites.set(role, sprite);
      
      return container;
    };

    // 1. Body is the root child
    const body = createPart('body', this.container);
    if (!body) return;

    // 2. Head attached to body
    const head = createPart('head', body);
    if (head) {
      createPart('jaw', head);
      createPart('eye-left', head);
      createPart('eye-right', head);
      createPart('pupil-left', head);
      createPart('pupil-right', head);
    }

    // 3. Arms attached to body
    const aul = createPart('arm-upper-left', body);
    if (aul) {
      const afl = createPart('arm-forearm-left', aul);
      if (afl) createPart('arm-hand-left', afl);
    }
    
    const aur = createPart('arm-upper-right', body);
    if (aur) {
      const afr = createPart('arm-forearm-right', aur);
      if (afr) createPart('arm-hand-right', afr);
    }

    // 4. Legs attached to body
    const lul = createPart('leg-upper-left', body);
    if (lul) {
      const lll = createPart('leg-lower-left', lul);
      if (lll) createPart('leg-foot-left', lll);
    }

    const lur = createPart('leg-upper-right', body);
    if (lur) {
      const llr = createPart('leg-lower-right', lur);
      if (llr) createPart('leg-foot-right', llr);
    }

    this.container.scale.x = this.props.initialScaleX ?? 1;
    this.container.rotation = (this.props.initialRotation ?? 0) * (Math.PI / 180);

    // Initial z-sort
    this.container.sortChildren();
  }

  private setupInteraction() {
    const { canDrag, interactive = false } = this.props;

    if (interactive) {
      // Builder mode: all parts are interactive for adjustment
      for (const [role, sprite] of this.partSprites) {
        sprite.eventMode = 'static';
        sprite.cursor = 'move';
        sprite.on('pointerdown', (e) => this.onPartPointerDown(e, role));
      }
      this.props.app.stage.on('globalpointermove', this.onPartGlobalPointerMove.bind(this));
      this.props.app.stage.on('pointerup', this.onPartPointerUp.bind(this));
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
    const parentGlobal = container.parent?.toGlobal({ x: 0, y: 0 }) ?? { x: 0, y: 0 };
    this.partOffset = {
      x: container.x - (e.global.x - parentGlobal.x),
      y: container.y - (e.global.y - parentGlobal.y),
    };
  }

  private onPartGlobalPointerMove(e: FederatedPointerEvent) {
    if (!this.draggingRole) return;
    const role = this.draggingRole;
    const container = this.partContainers.get(role)!;
    const parentGlobal = container.parent?.toGlobal({ x: 0, y: 0 }) ?? { x: 0, y: 0 };
    
    const newX = e.global.x - parentGlobal.x + this.partOffset.x;
    const newY = e.global.y - parentGlobal.y + this.partOffset.y;
    
    container.x = newX;
    container.y = newY;
    
    this.props.onChange?.(role, { offsetX: newX, offsetY: newY });
  }

  private onPartPointerUp() {
    this.draggingRole = null;
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

    // Convert stage coords to head-local coords
    const localPoint = head.toLocal({ x: stageX, y: stageY });
    
    const updatePupil = (role: string) => {
      const container = this.partContainers.get(role);
      const data = this.props.parts.find(p => p.partRole === role);
      if (!container || !data) return;

      // Distance from neutral (offset)
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
    this.container.destroy({ children: true });
  }

  // Builder utilities
  updatePartAnchor(role: string, x: number, y: number) {
    const sprite = this.partSprites.get(role);
    if (sprite) sprite.anchor.set(x, y);
  }
}
