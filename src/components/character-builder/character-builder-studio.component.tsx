import { useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";
import { useLanguage } from "@/hooks/useLanguage";
import type { SubscriptionType } from "@/db/schema";
import { deleteProp } from "@/lib/props.fns";
import {
  getCharacter,
  upsertCharacterPart,
  publishCharacter,
  unpublishCharacter,
  updateCharacter,
  uploadHumanPartFile,
  removeCharacterPart,
} from "@/lib/character-builder.fns";
import { cn } from "@/lib/cn";
import { toast } from "@/lib/toast";
import { gsap } from "gsap";
import {
  ChevronLeft,
  Upload,
  Save,
  Drama,
  Trash2,
  CheckCircle2,
  IterationCcw,
  IterationCw,
  ZoomIn,
  ZoomOut,
  Scan,
  XCircle,
} from "lucide-react";
import { ConfirmModal } from "@/components/confirm-modal";
import type { Application } from "pixi.js";
import {
  CompositeHumanCharacter,
  ALL_PART_ROLES,
} from "@/components/character-builder/composite-human-character.component";

export function CharacterBuilderStudio() {
  const { characterId } = useParams({ strict: false }) as {
    characterId?: string;
  };
  const navigate = useNavigate();
  const { t, langPrefix } = useLanguage();
  const queryClient = useQueryClient();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const appRef = useRef<Application | null>(null);
  const compositeRef = useRef<CompositeHumanCharacter | null>(null);

  const [selectedRole, setSelectedRole] = useState<string>("body");
  const [isUploading, setIsUploading] = useState<"main" | "alt" | null>(null);
  const [localName, setLocalName] = useState("");
  const [gizmoEditMode, setGizmoEditMode] = useState(false);
  // Track live pivot values from Pixi for the selected part
  const [livePivots, setLivePivots] = useState<
    Record<string, { x: number; y: number }>
  >({});
  const [showBoundingBoxes, setShowBoundingBoxes] = useState(false);
  const [previewPupils, setPreviewPupils] = useState(false);
  const [previewSpeaking, setPreviewSpeaking] = useState(false);
  const [previewLaughing, setPreviewLaughing] = useState(false);
  const [previewSmiling, setPreviewSmiling] = useState(false);
  const [previewGazing, setPreviewGazing] = useState(false);
  const [previewBlinking, setPreviewBlinking] = useState(false);
  const [previewSmilingEye, setPreviewSmilingEye] = useState(false);
  const [previewTurnMode, setPreviewTurnMode] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const isPanningRef = useRef(false);
  const isSpaceHeldRef = useRef(false);
  const [isSpaceHeld, setIsSpaceHeld] = useState(false);
  const lastPointerRef = useRef({ x: 0, y: 0 });
  const saveRef = useRef<() => Promise<void>>(null as any);
  const [ikState, setIkState] = useState({
    left: { enabled: false, flipped: true },
    right: { enabled: false, flipped: true },
  });

  const { data: session } = authClient.useSession();
  const isDirector = session?.user.role === "director";
  const isActor = session?.user.role === "actor";
  const sub = session?.user.subscription as SubscriptionType | undefined;
  const showSubDot = sub === "pro" || sub === "affiliate";
  const canAccess = isActor || (isDirector && showSubDot);

  const { data: currentCharacter } = useQuery({
    queryKey: ["character", characterId],
    queryFn: () => getCharacter({ data: { characterId: characterId! } }),
    enabled: !!characterId,
  });

  const hasRequiredPupilParts = [
    "head",
    "eye-left",
    "eye-right",
    "pupil-left",
    "pupil-right",
  ].every((role) => currentCharacter?.parts.some((p) => p.partRole === role));

  const hasRequiredSpeakingParts = ["head", "mouth"].every((role) =>
    currentCharacter?.parts.some((p) => p.partRole === role),
  );

  const hasRequiredTurnModeParts = ["body", "head"].every((role) =>
    currentCharacter?.parts.some((p) => p.partRole === role),
  );

  const hasLeftArmParts = [
    "arm-upper-left",
    "arm-forearm-left",
    "arm-hand-left",
  ].every((role) => currentCharacter?.parts.some((p) => p.partRole === role));

  const hasRightArmParts = [
    "arm-upper-right",
    "arm-forearm-right",
    "arm-hand-right",
  ].every((role) => currentCharacter?.parts.some((p) => p.partRole === role));

  const hasEyeAltTexture = currentCharacter?.parts.some(
    (p) =>
      (p.partRole === "eye-left" || p.partRole === "eye-right") &&
      !!p.altImageUrl,
  );

  const hasMouthAltTexture = currentCharacter?.parts.some(
    (p) => p.partRole === "mouth" && !!p.altImageUrl,
  );



  // Sync turn mode state to pixi
  useEffect(() => {
    if (compositeRef.current) {
      (compositeRef.current as any).setTurnMode?.(previewTurnMode);
    }
  }, [previewTurnMode]);

  // Reset pupil preview if required parts are removed
  useEffect(() => {
    if (!hasRequiredPupilParts && previewPupils) {
      setPreviewPupils(false);
    }
  }, [hasRequiredPupilParts, previewPupils]);

  // Reset speaking preview if required parts are removed
  useEffect(() => {
    if (!hasRequiredSpeakingParts && previewSpeaking) {
      setPreviewSpeaking(false);
    }
  }, [hasRequiredSpeakingParts, previewSpeaking]);

  // Sync laughing state to pixi
  useEffect(() => {
    if (compositeRef.current) {
      compositeRef.current.setLaughing(previewLaughing);
    }
  }, [previewLaughing]);

  // Reset laughing preview if mouth is removed
  useEffect(() => {
    const hasMouth = currentCharacter?.parts.some((p) => p.partRole === "mouth");
    if (!hasMouth && previewLaughing) {
      setPreviewLaughing(false);
    }
  }, [currentCharacter?.parts, previewLaughing]);

  // Sync smiling state to pixi
  useEffect(() => {
    if (compositeRef.current) {
      compositeRef.current.setSmile(previewSmiling);
    }
  }, [previewSmiling]);

  // Reset smiling preview if mouth is removed
  useEffect(() => {
    const hasMouth = currentCharacter?.parts.some((p) => p.partRole === "mouth");
    if (!hasMouth && previewSmiling) {
      setPreviewSmiling(false);
    }
  }, [currentCharacter?.parts, previewSmiling]);

  // Sync gazing state to pixi
  useEffect(() => {
    if (compositeRef.current) {
      compositeRef.current.setGaze(previewGazing);
    }
  }, [previewGazing]);

  // Reset gazing preview if mouth is removed
  useEffect(() => {
    const hasMouth = currentCharacter?.parts.some((p) => p.partRole === "mouth");
    if (!hasMouth && previewGazing) {
      setPreviewGazing(false);
    }
  }, [currentCharacter?.parts, previewGazing]);

  // Sync blinking state to pixi
  useEffect(() => {
    if (compositeRef.current) {
      compositeRef.current.setBlink(previewBlinking);
    }
  }, [previewBlinking]);

  // Reset blinking preview if eyes are removed
  useEffect(() => {
    const hasEyes = currentCharacter?.parts.some(
      (p) => p.partRole === "eye-left" || p.partRole === "eye-right",
    );
    if (!hasEyes && previewBlinking) {
      setPreviewBlinking(false);
    }
  }, [currentCharacter?.parts, previewBlinking]);

  // Sync eye-smile state to pixi
  useEffect(() => {
    if (compositeRef.current) {
      compositeRef.current.setSmileEye(previewSmilingEye);
    }
  }, [previewSmilingEye]);

  // Reset eye-smile preview if eyes are removed
  useEffect(() => {
    const hasEyes = currentCharacter?.parts.some(
      (p) => p.partRole === "eye-left" || p.partRole === "eye-right",
    );
    if (!hasEyes && previewSmilingEye) {
      setPreviewSmilingEye(false);
    }
  }, [currentCharacter?.parts, previewSmilingEye]);

  // Reset turn mode if required parts are removed
  useEffect(() => {
    if (!hasRequiredTurnModeParts && previewTurnMode) {
      setPreviewTurnMode(false);
    }
  }, [hasRequiredTurnModeParts, previewTurnMode]);

  // Reset IK if required parts are removed
  useEffect(() => {
    if (!hasLeftArmParts && ikState.left.enabled) {
      setIkState((prev) => ({
        ...prev,
        left: { ...prev.left, enabled: false },
      }));
    }
    if (!hasRightArmParts && ikState.right.enabled) {
      setIkState((prev) => ({
        ...prev,
        right: { ...prev.right, enabled: false },
      }));
    }
  }, [
    hasLeftArmParts,
    hasRightArmParts,
    ikState.left.enabled,
    ikState.right.enabled,
  ]);

  // Sync speaking state to composite character
  useEffect(() => {
    if (compositeRef.current) {
      compositeRef.current.setSpeaking(previewSpeaking);
    }
  }, [previewSpeaking]);


  // Sync IK state to pixi
  useEffect(() => {
    if (compositeRef.current) {
      compositeRef.current.setIKState(ikState);
    }
  }, [ikState]);

  // Mutations
  const upsertPartMutation = useMutation({
    mutationFn: upsertCharacterPart,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["character", characterId] });
    },
  });

  const publishMutation = useMutation({
    mutationFn: publishCharacter,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-characters"] });
      queryClient.invalidateQueries({ queryKey: ["all-props"] });
      queryClient.invalidateQueries({ queryKey: ["character", characterId] });
      toast.success(
        t("characterBuilder.published") || "Character published successfully!",
      );
    },
    onError: () => {
      toast.error("Failed to publish character");
    },
  });

  const unpublishMutation = useMutation({
    mutationFn: unpublishCharacter,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-characters"] });
      queryClient.invalidateQueries({ queryKey: ["all-props"] });
      queryClient.invalidateQueries({ queryKey: ["character", characterId] });
      toast.success("Character unpublished successfully");
    },
    onError: () => {
      toast.error("Failed to unpublish character");
    },
  });

  const updateCharacterMutation = useMutation({
    mutationFn: updateCharacter,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["character", characterId] });
      queryClient.invalidateQueries({ queryKey: ["user-characters"] });
    },
  });

  // Sync local name with fetched data
  useEffect(() => {
    if (currentCharacter?.name) {
      setLocalName(currentCharacter.name);
    }
  }, [currentCharacter?.name]);

  const handleGizmoEditModeChange = (enabled: boolean) => {
    setGizmoEditMode(enabled);
    compositeRef.current?.setGizmoEditMode(enabled);
  };

  const handleBoundingBoxToggle = (enabled: boolean) => {
    setShowBoundingBoxes(enabled);
    compositeRef.current?.setBoundingBoxesVisible(enabled);
  };

  const handleTitleSubmit = () => {
    if (characterId && localName && localName !== currentCharacter?.name) {
      updateCharacterMutation.mutate({
        data: { characterId, name: localName },
      });
    }
  };

  const deletePropMutation = useMutation({
    mutationFn: deleteProp,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["character", characterId] });
      queryClient.invalidateQueries({ queryKey: ["user-characters"] });
      queryClient.invalidateQueries({ queryKey: ["all-props"] });
    },
  });

  const removePartMutation = useMutation({
    mutationFn: removeCharacterPart,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["character", characterId] });
    },
  });

  const handleRemovePart = async () => {
    if (!characterId || !selectedRole || !currentCharacter) return;

    try {
      await removePartMutation.mutateAsync({
        data: { characterId, partRole: selectedRole },
      });
      toast.success("Part photo deleted permanently");
      setIsDeleteConfirmOpen(false);
    } catch (e) {
      console.error("Failed to remove part:", e);
      toast.error("Failed to delete part photo");
    }
  };

  const ZOOM_MIN = 0.25;
  const ZOOM_MAX = 4;
  const ZOOM_STEP = 1.125;
  const ZOOM_DEFAULT_X = -120;
  const ZOOM_DEFAULT_Y = 150;

  const applyZoom = (newZoom: number, originX: number, originY: number) => {
    const targetZoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, newZoom));

    // Calculate target pan values to keep origin fixed on screen
    const targetPanX = originX - (originX - pan.x) * (targetZoom / zoom);
    const targetPanY = originY - (originY - pan.y) * (targetZoom / zoom);

    // Animate zoom and pan together for a smooth transition
    const proxy = { z: zoom, x: pan.x, y: pan.y };
    gsap.to(proxy, {
      z: targetZoom,
      x: targetPanX,
      y: targetPanY,
      duration: 0.3,
      ease: "power2.out",
      onUpdate: () => {
        setZoom(proxy.z);
        setPan({ x: proxy.x, y: proxy.y });
      },
    });
  };

  const handleCanvasPointerDown = (e: React.PointerEvent) => {
    if (e.button === 0 && isSpaceHeldRef.current) {
      e.preventDefault();
      e.stopPropagation();
      isPanningRef.current = true;
      lastPointerRef.current = { x: e.clientX, y: e.clientY };
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    }
  };

  const handleCanvasPanMove = (e: React.PointerEvent) => {
    if (!isPanningRef.current) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const scaleRatio = 800 / rect.width;
    const dx = (e.clientX - lastPointerRef.current.x) * scaleRatio;
    const dy = (e.clientY - lastPointerRef.current.y) * scaleRatio;
    lastPointerRef.current = { x: e.clientX, y: e.clientY };
    setPan((p) => ({ x: p.x + dx, y: p.y + dy }));
  };

  const handleCanvasPointerUp = (e: React.PointerEvent) => {
    if (e.button === 0) {
      isPanningRef.current = false;
    }
  };

  const handleZoomIn = () => {
    applyZoom(zoom * ZOOM_STEP, ZOOM_DEFAULT_X, ZOOM_DEFAULT_Y);
  };
  const handleZoomOut = () => {
    applyZoom(zoom / ZOOM_STEP, ZOOM_DEFAULT_X, ZOOM_DEFAULT_Y);
  };

  const handleResetView = () => {
    // Reset torso to origin (composite container is at stage 400,400 = canvas center)
    compositeRef.current?.setPartPosition("torso", 0, 0);

    // Animate zoom and pan back to their default states
    const proxy = { z: zoom, x: pan.x, y: pan.y };
    gsap.to(proxy, {
      z: 1,
      x: ZOOM_DEFAULT_X,
      y: ZOOM_DEFAULT_Y,
      duration: 0.4,
      ease: "power2.inOut",
      onUpdate: () => {
        setZoom(proxy.z);
        setPan({ x: proxy.x, y: proxy.y });
      },
    });
  };

  const handleCanvasPointerMove = (e: React.PointerEvent) => {
    if (!compositeRef.current || !canvasRef.current) return;

    // Only update pupils if explicitly enabled for preview
    if (!previewPupils) return;

    // Skip if we are currently dragging a part or using gizmos
    const isInteracting =
      (compositeRef.current as any).draggingRole ||
      (compositeRef.current as any).rotatingRole ||
      (compositeRef.current as any).movingGizmoHandle;
    if (isInteracting) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const rawX = ((e.clientX - rect.left) / rect.width) * 800;
    const rawY = ((e.clientY - rect.top) / rect.height) * 800;
    const x = (rawX - pan.x) / zoom;
    const y = (rawY - pan.y) / zoom;

    compositeRef.current.updatePupils(x, y);
    compositeRef.current.handleGlobalHover({ x, y });
  };

  // PixiJS Initialization
  useEffect(() => {
    let app: Application;
    let isCancelled = false;

    async function initPixi() {
      const { Application } = await import("pixi.js");
      if (isCancelled || !canvasRef.current) return;

      app = new Application();
      await app.init({
        canvas: canvasRef.current,
        width: 800,
        height: 800,
        backgroundAlpha: 0,
        antialias: true,
      });

      if (isCancelled) {
        app.destroy(true);
        return;
      }

      appRef.current = app;
      updatePreview();
    }

    initPixi();

    return () => {
      isCancelled = true;
      if (app) {
        app.destroy(true);
      }
    };
  }, []);

  // Sync zoom/pan to the PixiJS stage
  useEffect(() => {
    if (!appRef.current) return;
    appRef.current.stage.scale.set(zoom);
    appRef.current.stage.position.set(pan.x, pan.y);
  }, [zoom, pan]);

  // Spacebar hold — enables pan mode
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && !e.repeat) {
        e.preventDefault();
        isSpaceHeldRef.current = true;
        setIsSpaceHeld(true);
        compositeRef.current?.setFrozen(true);
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        isSpaceHeldRef.current = false;
        setIsSpaceHeld(false);
        isPanningRef.current = false;
        compositeRef.current?.setFrozen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  // Rebuild preview when placed parts change
  useEffect(() => {
    updatePreview();
  }, [currentCharacter, appRef.current]);

  const updatePreview = () => {
    if (!appRef.current || !currentCharacter) return;

    // Capture live state (positions, anchors, etc.) to prevent reset during rebuild.
    const liveState = compositeRef.current?.getLiveState() ?? {};

    if (compositeRef.current) {
      compositeRef.current.destroy();
    }

    const parts = currentCharacter.parts.map((p) => {
      const state = liveState[p.partRole];
      return {
        ...p,
        x: state?.x ?? p.x,
        y: state?.y ?? p.y,
        pivotX: state?.pivotX ?? p.pivotX,
        pivotY: state?.pivotY ?? p.pivotY,
        rotation: state?.rotation ?? p.rotation,
      };
    });

    const composite = new CompositeHumanCharacter({
      sceneCastId: "builder-preview",
      castId: "builder",
      parts: parts as any,
      userId: session?.user.id ?? "",
      type: "composite-human",
      initialX: 400,
      initialY: 400,
      canDrag: true,
      interactive: true,
      app: appRef.current,
      showBoundingBoxes,
      onChange: (role, data) => {
        if (data.pivotX !== undefined && data.pivotY !== undefined) {
          setLivePivots((prev) => ({
            ...prev,
            [role]: { x: data.pivotX!, y: data.pivotY! },
          }));
        }
      },
    });

    compositeRef.current = composite;
    if (previewSpeaking) {
      composite.setSpeaking(true);
    }
    if (ikState.left.enabled || ikState.right.enabled) {
      composite.setIKState(ikState);
    }
    appRef.current.stage.addChild(composite.container);
  };

  // Upload a texture for a part.
  // - If the part is already placed (in currentCharacter.parts): update texture in DB immediately.
  // - If the part is not yet in the DB, it will be created with default coordinates.
  const handleUploadPart = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !characterId) return;

    setIsUploading("main");
    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onload = () => {
          const base64 = (reader.result as string).split(",")[1];
          resolve(base64);
        };
        reader.readAsDataURL(file);
      });

      const base64 = await base64Promise;

      const result = await uploadHumanPartFile({
        data: {
          fileName: file.name,
          contentType: file.type,
          base64,
        },
      });

      if (result?.url) {
        const existingPart = currentCharacter?.parts.find(
          (p) => p.partRole === selectedRole,
        );

        await upsertPartMutation.mutateAsync({
          data: {
            characterId: characterId!,
            partRole: selectedRole as any,
            imageUrl: result.url,
            propId: null,
            altPropId: existingPart?.altPropId,
            zIndex:
              existingPart?.zIndex ??
              ALL_PART_ROLES.indexOf(selectedRole as any),
            x: existingPart?.x ?? 0,
            y: existingPart?.y ?? 0,
            pivotX: existingPart?.pivotX ?? 0,
            pivotY: existingPart?.pivotY ?? 0,
            rotation: existingPart?.rotation ?? 0,
          },
        });
      }
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setIsUploading(null);
      // Reset so the same file can be re-selected
      e.target.value = "";
    }
  };

  const handleUploadAltTexture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !characterId) return;

    setIsUploading("alt");
    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onload = () => {
          const base64 = (reader.result as string).split(",")[1];
          resolve(base64);
        };
        reader.readAsDataURL(file);
      });

      const base64 = await base64Promise;

      const result = await uploadHumanPartFile({
        data: {
          fileName: file.name,
          contentType: file.type,
          base64,
        },
      });

      if (result?.url) {
        const existingPart = currentCharacter?.parts.find(
          (p) => p.partRole === selectedRole,
        );
        await upsertPartMutation.mutateAsync({
          data: {
            characterId: characterId!,
            partRole: selectedRole as any,
            altImageUrl: result.url,
            altPropId: null,
            propId: existingPart?.propId,
            zIndex:
              existingPart?.zIndex ??
              ALL_PART_ROLES.indexOf(selectedRole as any),
            x: existingPart?.x ?? 0,
            y: existingPart?.y ?? 0,
            pivotX: existingPart?.pivotX ?? 0,
            pivotY: existingPart?.pivotY ?? 0,
            rotation: existingPart?.rotation ?? 0,
          },
        });
      }
    } catch (err: any) {
      toast.error(`Upload failed: ${err.message}`);
    } finally {
      setIsUploading(null);
      e.target.value = "";
    }
  };

  const handleSaveAdjustments = async () => {
    if (!compositeRef.current || !characterId) return;

    const liveState = (compositeRef.current as any).getLiveState() as Record<
      string,
      { x: number; y: number; pivotX: number; pivotY: number; rotation: number }
    >;
    const parts = currentCharacter?.parts ?? [];

    for (const part of parts) {
      const state = liveState[part.partRole];
      if (state) {
        await upsertPartMutation.mutateAsync({
          data: {
            characterId,
            partRole: part.partRole,
            propId: part.propId,
            x: Math.round(state.x),
            y: Math.round(state.y),
            rotation: Math.round(state.rotation),
            pivotX: state.pivotX,
            pivotY: state.pivotY,
            zIndex: part.zIndex,
          },
        });
      }
    }
  };

  // Sync latest function to ref for autosave
  saveRef.current = handleSaveAdjustments;

  useEffect(() => {
    const timer = setInterval(
      () => {
        if (compositeRef.current && (currentCharacter?.parts.length ?? 0) > 0) {
          saveRef.current();
        }
      },
      5 * 60 * 1000,
    ); // 5 minutes
    return () => clearInterval(timer);
  }, [currentCharacter?.parts.length]);

  if (!canAccess) {
    return (
      <div className="text-error flex h-screen items-center justify-center p-8 text-center">
        Unauthorized
      </div>
    );
  }
  if (!characterId) {
    navigate({ to: `${langPrefix}/character-builder/` as any });
    return null;
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <header className="bg-base-100 border-base-300 flex items-center justify-between border-b px-6 py-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() =>
              navigate({ to: `${langPrefix}/character-builder/` as any })
            }
            className="btn btn-ghost btn-sm btn-square"
          >
            <ChevronLeft className="size-5" />
          </button>
          <input
            type="text"
            value={localName}
            onChange={(e) => setLocalName(e.target.value)}
            onBlur={handleTitleSubmit}
            onKeyDown={(e) => e.key === "Enter" && handleTitleSubmit()}
            className="font-display hover:bg-base-200/50 w-64 rounded bg-transparent px-1 text-xl font-bold transition-colors focus:ring-0 focus:outline-none"
            placeholder={t("characterBuilder.newCharacter")}
          />
          {currentCharacter?.compositePropId && (
            <span className="badge badge-success badge-sm font-semibold tracking-widest uppercase">
              Published
            </span>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleSaveAdjustments}
            disabled={upsertPartMutation.isPending}
            className="btn btn-ghost btn-sm gap-2"
          >
            {upsertPartMutation.isPending ? (
              <span className="loading loading-spinner loading-xs" />
            ) : (
              <Save className="size-4" />
            )}
            {t("action.save")}
          </button>
          {currentCharacter?.compositePropId ? (
            <button
              onClick={() =>
                unpublishMutation.mutate({ data: { characterId: characterId! } })
              }
              disabled={unpublishMutation.isPending}
              className="btn btn-ghost btn-sm gap-2"
            >
              <XCircle className="size-4" />
              {t("characterBuilder.unpublish") || "Unpublish"}
            </button>
          ) : (
            <button
              onClick={() =>
                publishMutation.mutate({ data: { characterId: characterId! } })
              }
              disabled={
                publishMutation.isPending ||
                (currentCharacter?.parts.length ?? 0) === 0
              }
              className="btn btn-primary btn-sm gap-2"
            >
              <CheckCircle2 className="size-4" />
              {t("characterBuilder.publish")}
            </button>
          )}
        </div>
      </header>

      {/* Main Studio Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar: Layers/Parts */}
        <aside className="bg-base-200 border-base-300 w-64 overflow-y-auto border-r p-4">
          <h2 className="mb-4 text-xs font-bold tracking-widest uppercase opacity-50">
            {t("characterBuilder.bodyParts")}
          </h2>
          <div className="space-y-1">
            {ALL_PART_ROLES.map((role) => {
              const part = currentCharacter?.parts?.find(
                (p) => p.partRole === role,
              );
              const imageUrl = part?.imageUrl ?? null;
              const isPlaced = !!part;
              return (
                <button
                  key={role}
                  onClick={() => setSelectedRole(role)}
                  className={cn(
                    "flex w-full cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors",
                    selectedRole === role
                      ? "bg-primary text-primary-content"
                      : "hover:bg-base-300",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-base-300 flex size-8 items-center justify-center overflow-hidden rounded-md border border-white/5">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={role}
                          className="size-full object-contain"
                        />
                      ) : (
                        <Drama
                          className={cn(
                            "size-4",
                            selectedRole === role
                              ? "opacity-100"
                              : "opacity-40",
                          )}
                        />
                      )}
                    </div>
                    <span className="capitalize">
                      {role.replace(/-/g, " ")}
                    </span>
                  </div>
                  {isPlaced && (
                    <div className="bg-success size-1.5 rounded-full" />
                  )}
                </button>
              );
            })}
          </div>
        </aside>

        {/* Center: Canvas Preview */}
        <main className="bg-base-300 relative flex-1">
          <div className="absolute inset-0 flex items-center justify-center p-8">
            <div
              className={cn(
                "bg-base-100 relative aspect-square w-full max-w-[600px] overflow-hidden rounded-xl border border-white/5 shadow-2xl transition-all duration-200",
                isSpaceHeld && !isPanningRef.current && "cursor-grab",
                isSpaceHeld && isPanningRef.current && "cursor-grabbing",
              )}
            >
              <canvas
                ref={canvasRef}
                onPointerMove={(e) => {
                  handleCanvasPanMove(e);
                  handleCanvasPointerMove(e);
                }}
                onPointerDown={handleCanvasPointerDown}
                onPointerUp={handleCanvasPointerUp}
                className="h-full w-full"
              />

              {/* Zoom / pan controls — top-left of canvas */}
              <div className="absolute top-3 left-3 flex flex-col gap-1">
                <button
                  onClick={handleZoomIn}
                  className="border-base-300 bg-base-100/80 hover:bg-base-200/80 flex size-7 items-center justify-center rounded-lg border backdrop-blur-sm transition-colors"
                  title="Zoom in"
                >
                  <ZoomIn className="size-3.5" />
                </button>
                <button
                  onClick={handleZoomOut}
                  className="border-base-300 bg-base-100/80 hover:bg-base-200/80 flex size-7 items-center justify-center rounded-lg border backdrop-blur-sm transition-colors"
                  title="Zoom out"
                >
                  <ZoomOut className="size-3.5" />
                </button>
                <button
                  onClick={handleResetView}
                  className="border-base-300 bg-base-100/80 hover:bg-base-200/80 flex size-7 items-center justify-center rounded-lg border backdrop-blur-sm transition-colors"
                  title="Reset view"
                >
                  <Scan className="size-3.5" />
                </button>
                <span className="text-base-content/40 text-center text-[9px] font-medium tabular-nums">
                  {Math.round(zoom * 100)}%
                </span>
              </div>

              {/* Control toggles — top-right of canvas */}
              <div className="absolute top-3 right-3 flex flex-col gap-2">
                <label
                  className={cn(
                    "border-base-300 bg-base-100/80 flex min-w-[124px] items-center gap-2 rounded-lg border px-3 py-1.5 text-[11px] font-medium tracking-wider uppercase backdrop-blur-sm transition-colors",
                    ikState.left.enabled ||
                      ikState.right.enabled ||
                      previewTurnMode
                      ? "cursor-not-allowed opacity-40 grayscale"
                      : "hover:bg-base-200/80 cursor-pointer",
                  )}
                  title={
                    ikState.left.enabled || ikState.right.enabled
                      ? "Disable IK to edit gizmo anchors"
                      : previewTurnMode
                        ? "Disable Turn Mode to edit gizmo anchors"
                        : ""
                  }
                >
                  <input
                    type="checkbox"
                    className="checkbox checkbox-xs checkbox-primary"
                    checked={gizmoEditMode}
                    disabled={
                      ikState.left.enabled ||
                      ikState.right.enabled ||
                      previewTurnMode
                    }
                    onChange={(e) =>
                      handleGizmoEditModeChange(e.target.checked)
                    }
                  />
                  Edit gizmos
                </label>

                <label className="border-base-300 bg-base-100/80 hover:bg-base-200/80 flex min-w-[124px] cursor-pointer items-center gap-2 rounded-lg border px-3 py-1.5 text-[11px] font-medium tracking-wider uppercase backdrop-blur-sm transition-colors">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-xs checkbox-accent"
                    checked={showBoundingBoxes}
                    onChange={(e) => handleBoundingBoxToggle(e.target.checked)}
                  />
                  Show bounds
                </label>

                <label
                  className={cn(
                    "border-base-300 bg-base-100/80 flex min-w-[124px] items-center gap-2 rounded-lg border px-3 py-1.5 text-[11px] font-medium tracking-wider uppercase backdrop-blur-sm transition-colors",
                    hasMouthAltTexture
                      ? "hover:bg-base-200/80 cursor-pointer"
                      : "cursor-not-allowed opacity-40 grayscale",
                  )}
                  title={
                    !hasMouthAltTexture
                      ? "Add a mouth and upload its Variation Texture to test"
                      : ""
                  }
                >
                  <input
                    type="checkbox"
                    className="checkbox checkbox-xs checkbox-info"
                    checked={previewLaughing}
                    disabled={!hasMouthAltTexture}
                    onChange={(e) => setPreviewLaughing(e.target.checked)}
                  />
                  😆 Laugh
                </label>

                <label
                  className={cn(
                    "border-base-300 bg-base-100/80 flex min-w-[124px] items-center gap-2 rounded-lg border px-3 py-1.5 text-[11px] font-medium tracking-wider uppercase backdrop-blur-sm transition-colors",
                    hasMouthAltTexture
                      ? "hover:bg-base-200/80 cursor-pointer"
                      : "cursor-not-allowed opacity-40 grayscale",
                  )}
                  title={
                    !hasMouthAltTexture
                      ? "Add a mouth and upload its Variation Texture to test"
                      : ""
                  }
                >
                  <input
                    type="checkbox"
                    className="checkbox checkbox-xs checkbox-info"
                    checked={previewSmiling}
                    disabled={!hasMouthAltTexture}
                    onChange={(e) => setPreviewSmiling(e.target.checked)}
                  />
                  👄 Smile
                </label>

                <label
                  className={cn(
                    "border-base-300 bg-base-100/80 flex min-w-[124px] items-center gap-2 rounded-lg border px-3 py-1.5 text-[11px] font-medium tracking-wider uppercase backdrop-blur-sm transition-colors",
                    hasEyeAltTexture
                      ? "hover:bg-base-200/80 cursor-pointer"
                      : "cursor-not-allowed opacity-40 grayscale",
                  )}
                  title={
                    !hasEyeAltTexture
                      ? "Upload a variation texture for an eye part to test"
                      : ""
                  }
                >
                  <input
                    type="checkbox"
                    className="checkbox checkbox-xs checkbox-info"
                    checked={previewGazing}
                    disabled={!hasEyeAltTexture}
                    onChange={(e) => setPreviewGazing(e.target.checked)}
                  />
                  👁️ Gaze
                </label>

                <label
                  className={cn(
                    "border-base-300 bg-base-100/80 flex min-w-[124px] items-center gap-2 rounded-lg border px-3 py-1.5 text-[11px] font-medium tracking-wider uppercase backdrop-blur-sm transition-colors",
                    hasEyeAltTexture
                      ? "hover:bg-base-200/80 cursor-pointer"
                      : "cursor-not-allowed opacity-40 grayscale",
                  )}
                  title={
                    !hasEyeAltTexture
                      ? "Upload a variation texture for an eye part to test"
                      : ""
                  }
                >
                  <input
                    type="checkbox"
                    className="checkbox checkbox-xs checkbox-info"
                    checked={previewBlinking}
                    disabled={!hasEyeAltTexture}
                    onChange={(e) => setPreviewBlinking(e.target.checked)}
                  />
                  👁️ Blink
                </label>

                <label
                  className={cn(
                    "border-base-300 bg-base-100/80 flex min-w-[124px] items-center gap-2 rounded-lg border px-3 py-1.5 text-[11px] font-medium tracking-wider uppercase backdrop-blur-sm transition-colors",
                    hasEyeAltTexture
                      ? "hover:bg-base-200/80 cursor-pointer"
                      : "cursor-not-allowed opacity-40 grayscale",
                  )}
                  title={
                    !hasEyeAltTexture
                      ? "Upload a variation texture for an eye part to test"
                      : ""
                  }
                >
                  <input
                    type="checkbox"
                    className="checkbox checkbox-xs checkbox-info"
                    checked={previewSmilingEye}
                    disabled={!hasEyeAltTexture}
                    onChange={(e) => setPreviewSmilingEye(e.target.checked)}
                  />
                  😊 Eye Smile
                </label>

                <div className="flex flex-col gap-1.5 p-1">
                  {/* Left Arm IK */}
                  <div
                    className={cn(
                      "border-base-300 bg-base-100/80 flex min-w-[140px] items-center justify-between gap-1 rounded-lg border px-2 py-1.5 backdrop-blur-sm",
                      !hasLeftArmParts && "opacity-40 grayscale",
                    )}
                    title={
                      !hasLeftArmParts
                        ? "Requires Upper Arm, Forearm, and Hand"
                        : ""
                    }
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        className="checkbox checkbox-xs checkbox-accent"
                        checked={ikState.left.enabled}
                        disabled={!hasLeftArmParts}
                        onChange={(e) =>
                          setIkState((prev) => ({
                            ...prev,
                            left: { ...prev.left, enabled: e.target.checked },
                          }))
                        }
                      />
                      <span className="text-[10px] font-bold tracking-tight uppercase">
                        IK Left
                      </span>
                    </div>
                    {ikState.left.enabled && (
                      <button
                        className="btn btn-xs btn-ghost h-6 min-h-0 px-1"
                        title="Flip Elbow"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          setIkState((prev) => ({
                            ...prev,
                            left: { ...prev.left, flipped: !prev.left.flipped },
                          }));
                        }}
                      >
                        {ikState.left.flipped ? (
                          <IterationCw className="size-4" />
                        ) : (
                          <IterationCcw className="size-4" />
                        )}
                      </button>
                    )}
                  </div>

                  {/* Right Arm IK */}
                  <div
                    className={cn(
                      "border-base-300 bg-base-100/80 flex min-w-[140px] items-center justify-between gap-1 rounded-lg border px-2 py-1.5 backdrop-blur-sm",
                      !hasRightArmParts && "opacity-40 grayscale",
                    )}
                    title={
                      !hasRightArmParts
                        ? "Requires Upper Arm, Forearm, and Hand"
                        : ""
                    }
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        className="checkbox checkbox-xs checkbox-accent"
                        checked={ikState.right.enabled}
                        disabled={!hasRightArmParts}
                        onChange={(e) =>
                          setIkState((prev) => ({
                            ...prev,
                            right: { ...prev.right, enabled: e.target.checked },
                          }))
                        }
                      />
                      <span className="text-[10px] font-bold tracking-tight uppercase">
                        IK Right
                      </span>
                    </div>
                    {ikState.right.enabled && (
                      <button
                        className="btn btn-xs btn-ghost h-6 min-h-0 px-1"
                        title="Flip Elbow"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          setIkState((prev) => ({
                            ...prev,
                            right: {
                              ...prev.right,
                              flipped: !prev.right.flipped,
                            },
                          }));
                        }}
                      >
                        {ikState.right.flipped ? (
                          <IterationCcw className="size-4" />
                        ) : (
                          <IterationCw className="size-4" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                <label
                  className={cn(
                    "border-base-300 bg-base-100/80 flex min-w-[124px] items-center gap-2 rounded-lg border px-3 py-1.5 text-[11px] font-medium tracking-wider uppercase backdrop-blur-sm transition-colors",
                    hasRequiredPupilParts
                      ? "hover:bg-base-200/80 cursor-pointer"
                      : "cursor-not-allowed opacity-40 grayscale",
                  )}
                  title={
                    !hasRequiredPupilParts
                      ? "Requires Head, Eyes, and Pupils"
                      : ""
                  }
                >
                  <input
                    type="checkbox"
                    className="checkbox checkbox-xs checkbox-info"
                    checked={previewPupils}
                    disabled={!hasRequiredPupilParts}
                    onChange={(e) => setPreviewPupils(e.target.checked)}
                  />
                  Test Pupils
                </label>


                <label
                  className={cn(
                    "border-base-300 bg-base-100/80 flex min-w-[124px] items-center gap-2 rounded-lg border px-3 py-1.5 text-[11px] font-medium tracking-wider uppercase backdrop-blur-sm transition-colors",
                    hasRequiredSpeakingParts
                      ? "hover:bg-base-200/80 cursor-pointer"
                      : "cursor-not-allowed opacity-50",
                  )}
                  title={
                    !hasRequiredSpeakingParts
                      ? "Place head and mouth to test speaking"
                      : ""
                  }
                >
                  <input
                    type="checkbox"
                    className="checkbox checkbox-xs checkbox-accent"
                    checked={previewSpeaking}
                    disabled={!hasRequiredSpeakingParts}
                    onChange={(e) => setPreviewSpeaking(e.target.checked)}
                  />
                  Test Speaking
                </label>


                <label
                  className={cn(
                    "border-base-300 bg-base-100/80 flex min-w-[124px] items-center gap-2 rounded-lg border px-3 py-1.5 text-[11px] font-medium tracking-wider uppercase backdrop-blur-sm transition-colors",
                    hasRequiredTurnModeParts
                      ? "hover:bg-base-200/80 cursor-pointer"
                      : "cursor-not-allowed opacity-40 grayscale",
                  )}
                  title={
                    !hasRequiredTurnModeParts
                      ? "Requires Head and Body to test turn mode"
                      : ""
                  }
                >
                  <input
                    type="checkbox"
                    className="checkbox checkbox-xs checkbox-accent"
                    checked={previewTurnMode}
                    disabled={!hasRequiredTurnModeParts}
                    onChange={(e) => setPreviewTurnMode(e.target.checked)}
                  />
                  Turn Mode
                </label>
              </div>

              <div className="pointer-events-none absolute right-4 bottom-4 left-4 flex justify-end text-[10px] tracking-widest uppercase opacity-30">
                <span>800x800 Preview</span>
              </div>
            </div>
          </div>
        </main>

        {/* Right Sidebar: Part Properties/Upload */}
        <aside className="bg-base-200 border-base-300 w-80 overflow-y-auto border-l p-6">
          {(() => {
            const part = currentCharacter?.parts?.find(
              (p) => p.partRole === selectedRole,
            );
            const isPlaced = !!part;
            const hasPhoto = !!part;
            const displayUrl = part?.imageUrl ?? null;

            const isEye =
              selectedRole === "eye-left" || selectedRole === "eye-right";
            const isMouth = selectedRole === "mouth";
            const hasAltTexture = isEye || isMouth;
            const altTextureUrl = part?.altImageUrl ?? null;

            return (
              <>
                <div className="mb-6 flex items-center justify-between gap-4">
                  <h2 className="truncate text-sm font-bold tracking-widest uppercase">
                    {selectedRole.replace(/-/g, " ")}
                  </h2>
                  {hasPhoto && !isPlaced && (
                    <div className="badge badge-warning badge-xs h-5 shrink-0 font-bold tracking-wider uppercase">
                      Not placed
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  {/* Upload Area */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-medium tracking-wide uppercase opacity-60">
                        Texture
                      </label>
                      <div className="relative">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleUploadPart(e)}
                          className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
                          disabled={!!isUploading}
                        />
                        <div
                          className={cn(
                            "border-base-300 flex min-h-32 flex-col items-center justify-center gap-2 overflow-hidden rounded-xl border-2 border-dashed transition-colors",
                            isUploading === "main"
                              ? "bg-base-300"
                              : "hover:bg-base-300",
                          )}
                        >
                          {isUploading === "main" ? (
                            <span className="loading loading-spinner loading-md text-primary" />
                          ) : displayUrl ? (
                            <div
                              className={cn(
                                "group relative h-full w-full",
                                !isPlaced
                                  ? "cursor-grab active:cursor-grabbing"
                                  : "cursor-pointer",
                              )}
                            >
                              <img
                                src={displayUrl}
                                alt="preview"
                                className="max-h-48 w-full object-contain p-2"
                              />
                              <div className="bg-base-300/80 absolute inset-0 flex items-center justify-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                                <div className="flex flex-col items-center gap-1">
                                  <Upload className="size-5 text-white" />
                                  <span className="text-[10px] font-bold tracking-widest uppercase">
                                    Replace texture
                                  </span>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <>
                              <Upload className="size-6 opacity-30" />
                              <span className="text-xs opacity-50">
                                {t("characterBuilder.uploadMain")}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Variation Texture — for eyes or mouth */}
                    {hasAltTexture && (
                      <div className="space-y-2">
                        <label className="text-xs font-medium tracking-wide uppercase opacity-60">
                          Variation Texture
                        </label>
                        <div className="relative group">
                          {!altTextureUrl && (
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleUploadAltTexture(e)}
                              className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
                              disabled={!!isUploading}
                            />
                          )}
                          <div
                            className={cn(
                              "border-base-300 flex min-h-32 flex-col items-center justify-center gap-2 overflow-hidden rounded-xl border-2 border-dashed transition-colors",
                              isUploading === "alt"
                                ? "bg-base-300"
                                : "hover:bg-base-200",
                            )}
                          >
                            {isUploading === "alt" ? (
                              <span className="loading loading-spinner loading-md text-primary" />
                            ) : altTextureUrl ? (
                              <div className="relative h-full w-full">
                                <img
                                  src={altTextureUrl}
                                  alt="alt preview"
                                  className="max-h-48 w-full object-contain p-2"
                                />
                                <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 transition-opacity group-hover:opacity-100 bg-base-300/80">
                                  <label className="flex flex-col items-center gap-1 cursor-pointer">
                                    <input
                                      type="file"
                                      accept="image/*"
                                      onChange={(e) => handleUploadAltTexture(e)}
                                      className="hidden"
                                    />
                                    <Upload className="size-5 text-white" />
                                    <span className="text-[10px] font-bold tracking-widest uppercase text-white">
                                      Replace
                                    </span>
                                  </label>
                                  <div className="h-6 w-px bg-white/20" />
                                  <button
                                    onClick={() => {
                                      upsertPartMutation.mutate({
                                        data: {
                                          characterId: characterId!,
                                          partRole: selectedRole as any,
                                          altImageUrl: null,
                                          altPropId: null,
                                        },
                                      });
                                    }}
                                    className="flex flex-col items-center gap-1"
                                  >
                                    <Trash2 className="size-5 text-error" />
                                    <span className="text-[10px] font-bold tracking-widest uppercase text-error">
                                      Remove
                                    </span>
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <Upload className="size-6 opacity-30" />
                                <span className="text-xs opacity-50">
                                  Upload variation asset
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Transform Controls */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-medium tracking-wide uppercase opacity-60">
                      Transform
                    </h3>

                    <div className="grid grid-cols-2 gap-4">
                      {(() => {
                        const pivotX =
                          livePivots[selectedRole]?.x ?? part?.pivotX ?? 0;
                        const pivotY =
                          livePivots[selectedRole]?.y ?? part?.pivotY ?? 0;

                        return (
                          <>
                            <div className="space-y-1">
                              <label className="text-[10px] uppercase opacity-40">
                                Pivot X (px)
                              </label>
                              <input
                                type="number"
                                className="input input-bordered input-sm bg-base-300 w-full"
                                value={Math.round(pivotX)}
                                readOnly
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] uppercase opacity-40">
                                Pivot Y (px)
                              </label>
                              <input
                                type="number"
                                className="input input-bordered input-sm bg-base-300 w-full"
                                value={Math.round(pivotY)}
                                readOnly
                              />
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>

                  <div className="divider opacity-30" />

                  <div className="flex flex-col gap-2 pt-4">
                    <button
                      onClick={() => setIsDeleteConfirmOpen(true)}
                      disabled={deletePropMutation.isPending || !part}
                      className={cn(
                        "btn btn-ghost btn-xs text-error/40 hover:bg-error/10 hover:text-error w-full gap-2",
                        deletePropMutation.isPending && "loading",
                      )}
                    >
                      {!deletePropMutation.isPending && (
                        <Trash2 className="size-3" />
                      )}
                      {deletePropMutation.isPending
                        ? t("action.deleting")
                        : t("characterBuilder.deleteImage")}
                    </button>
                  </div>
                </div>

                <ConfirmModal
                  isOpen={isDeleteConfirmOpen}
                  title={t("characterBuilder.deleteImage")}
                  message={t("characterBuilder.deleteImageConfirm")}
                  confirmText={t("action.delete")}
                  confirmButtonClass="btn-error"
                  isPending={deletePropMutation.isPending}
                  onConfirm={async () => {
                    await handleRemovePart();
                    setIsDeleteConfirmOpen(false);
                  }}
                  onCancel={() => setIsDeleteConfirmOpen(false)}
                />
              </>
            );
          })()}
        </aside>
      </div>
    </div>
  );
}
