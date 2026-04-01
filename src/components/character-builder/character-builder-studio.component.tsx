import { useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";
import { useLanguage } from "@/hooks/useLanguage";
import type { SubscriptionType } from "@/db/schema";
import { uploadProp, deleteProp } from "@/lib/props.fns";
import {
  getCharacter,
  upsertCharacterPart,
  removeCharacterPart,
  publishCharacter,
  updateCharacter,
} from "@/lib/character-builder.fns";
import { cn } from "@/lib/cn";
import { toast } from "@/lib/toast";
import {
  ChevronLeft,
  Upload,
  Save,
  Plus,
  Drama,
  Maximize2,
  Target,
  Trash2,
  CheckCircle2,
  CircleX,
  IterationCcw,
  IterationCw,
} from "lucide-react";
import { ConfirmModal } from "@/components/confirm-modal";
import type { Application } from "pixi.js";
import {
  CompositeCharacter,
  ALL_PART_ROLES,
} from "@/components/composite-character.component";

// Pending prop: uploaded to Blob/DB but not yet placed on canvas via drag-drop
type PendingProp = {
  propId: string;
  imageUrl: string;
  altPropId?: string;
  altImageUrl?: string;
};

export function CharacterBuilderStudio() {
  const { characterId } = useParams({ strict: false }) as {
    characterId?: string;
  };
  const navigate = useNavigate();
  const { t, langPrefix } = useLanguage();
  const queryClient = useQueryClient();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const appRef = useRef<Application | null>(null);
  const compositeRef = useRef<CompositeCharacter | null>(null);

  const [selectedRole, setSelectedRole] = useState<string>("body");
  const [isUploading, setIsUploading] = useState<"main" | "alt" | null>(null);
  const [localName, setLocalName] = useState("");
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [gizmoEditMode, setGizmoEditMode] = useState(false);
  // Parts uploaded but not yet placed on the canvas via drag-drop
  const [pendingPropByRole, setPendingPropByRole] = useState<
    Record<string, PendingProp>
  >({});
  // Track live pivot values from Pixi for the selected part
  const [livePivots, setLivePivots] = useState<
    Record<string, { x: number; y: number }>
  >({});
  const [showBoundingBoxes, setShowBoundingBoxes] = useState(false);
  const [previewPupils, setPreviewPupils] = useState(false);
  const [previewSpeaking, setPreviewSpeaking] = useState(false);
  const [previewBlinking, setPreviewBlinking] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [ikState, setIkState] = useState({
    left: { enabled: false, flipped: false },
    right: { enabled: false, flipped: true },
  });

  const { data: session } = authClient.useSession();
  const isDirector = session?.user.role === "director";
  const isActor = session?.user.role === "actor";
  const sub = session?.user.subscription as SubscriptionType | undefined;
  const showSubDot = sub === "pro" || sub === "advance";
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


  const hasBlinkTexture = currentCharacter?.parts.some(
    (p) => (p.partRole === "eye-left" || p.partRole === "eye-right") && !!p.altImageUrl,
  );

  // Sync auto-blink state to pixi
  useEffect(() => {
    if (compositeRef.current) {
      compositeRef.current.setAutoBlink(previewBlinking);
    }
  }, [previewBlinking]);


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
      queryClient.invalidateQueries({ queryKey: ["all-props"] });
    },
  });

  const unplacePartMutation = useMutation({
    mutationFn: removeCharacterPart,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["character", characterId] });
      toast.success(
        t("characterBuilder.unplaced") || "Part removed from canvas",
      );
    },
    onError: () => {
      toast.error("Failed to remove part from canvas");
    },
  });

  const handleUnplacePart = async () => {
    if (!characterId || !selectedRole || !currentCharacter) return;
    const part = currentCharacter.parts.find(
      (p) => p.partRole === selectedRole,
    );
    if (!part) return;

    // Add to pending props so it stays in the toolbox
    setPendingPropByRole((prev) => ({
      ...prev,
      [selectedRole]: {
        propId: part.propId!,
        imageUrl: part.imageUrl!,
        altPropId: part.altPropId ?? undefined,
        altImageUrl: part.altImageUrl ?? undefined,
      },
    }));

    await unplacePartMutation.mutateAsync({
      data: { characterId, partRole: selectedRole },
    });
  };

  const handleRemovePart = async () => {
    if (!characterId || !selectedRole || !currentCharacter) return;

    // If only pending (not placed), just clear from local state
    if (
      pendingPropByRole[selectedRole] &&
      !currentCharacter.parts.find((p) => p.partRole === selectedRole)
    ) {
      setPendingPropByRole((prev) => {
        const next = { ...prev };
        delete next[selectedRole];
        return next;
      });
      return;
    }

    const part = currentCharacter.parts.find(
      (p) => p.partRole === selectedRole,
    );
    if (!part) return;

    // Delete prop permanently from DB and Blob storage
    try {
      if (part.altPropId) {
        await deletePropMutation.mutateAsync({ data: { id: part.altPropId } });
      }
      if (part.propId) {
        await deletePropMutation.mutateAsync({ data: { id: part.propId } });
      }
      toast.success("Part photo deleted permanently");
    } catch (e) {
      console.error("Failed to remove part:", e);
      toast.error("Failed to delete part photo");
    }
  };

  // Drop from sidebar onto canvas — this is the ONLY way a part appears on canvas
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    const role = e.dataTransfer.getData("partRole");
    if (!role || !canvasRef.current || !characterId || !currentCharacter)
      return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 800;
    const y = ((e.clientY - rect.top) / rect.height) * 800;

    const posX = Math.round(x - 400);
    const posY = Math.round(y - 400);

    const existingPart = currentCharacter.parts.find(
      (p) => p.partRole === role,
    );
    const pending = pendingPropByRole[role];

    const propId = existingPart?.propId ?? pending?.propId;
    if (!propId) return; // no texture uploaded for this role yet

    setSelectedRole(role);
    upsertPartMutation.mutate(
      {
        data: {
          characterId,
          partRole: role as any,
          propId,
          altPropId: existingPart?.altPropId ?? pending?.altPropId,
          x: posX,
          y: posY,
          pivotX: existingPart?.pivotX ?? 0,
          pivotY: existingPart?.pivotY ?? 0,
          rotation: existingPart?.rotation ?? 0,
          zIndex: existingPart?.zIndex ?? ALL_PART_ROLES.indexOf(role as any),
        },
      },
      {
        onSuccess: () => {
          // Clear from pending now that it's persisted and will appear via currentCharacter
          setPendingPropByRole((prev) => {
            const next = { ...prev };
            delete next[role];
            return next;
          });
        },
      },
    );
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
    const x = ((e.clientX - rect.left) / rect.width) * 800;
    const y = ((e.clientY - rect.top) / rect.height) * 800;

    compositeRef.current.updatePupils(x, y);
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

    const composite = new CompositeCharacter({
      sceneCastId: "builder-preview",
      castId: "builder",
      parts: parts as any,
      userId: session?.user.id ?? "",
      type: "composite",
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
  // - If not yet placed: store in pendingPropByRole; it appears on canvas only when dropped.
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

      const prop = await uploadProp({
        data: {
          name: `${selectedRole}_${Date.now()}`,
          type: "part",
          fileName: file.name,
          contentType: file.type,
          base64,
          size: file.size,
        },
      });

      if (prop) {
        const existingPart = currentCharacter?.parts.find(
          (p) => p.partRole === selectedRole,
        );

        if (existingPart) {
          // Already placed: update texture in DB directly
          await upsertPartMutation.mutateAsync({
            data: {
              characterId: characterId!,
              partRole: selectedRole as any,
              propId: prop.id,
              altPropId: existingPart.altPropId,
              zIndex:
                existingPart.zIndex ??
                ALL_PART_ROLES.indexOf(selectedRole as any),
              x: existingPart.x,
              y: existingPart.y,
              pivotX: existingPart.pivotX,
              pivotY: existingPart.pivotY,
              rotation: existingPart.rotation,
            },
          });
        } else {
          // Not yet placed: stage in pending — appears on canvas only when dropped
          setPendingPropByRole((prev) => ({
            ...prev,
            [selectedRole]: {
              ...prev[selectedRole]!,
              propId: prop.id,
              imageUrl: prop.imageUrl ?? "",
            },
          }));
        }
      }
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setIsUploading(null);
      // Reset so the same file can be re-selected
      e.target.value = "";
    }
  };

  const handleUploadBlink = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

      const prop = await uploadProp({
        data: {
          name: `${selectedRole}_blink_${Date.now()}`,
          type: "part",
          fileName: file.name,
          contentType: file.type,
          base64,
          size: file.size,
        },
      });

      if (prop) {
        const existingPart = currentCharacter?.parts.find(
          (p) => p.partRole === selectedRole,
        );
        if (existingPart) {
          await upsertPartMutation.mutateAsync({
            data: {
              characterId: characterId!,
              partRole: selectedRole as any,
              propId: existingPart.propId,
              altPropId: prop.id,
              pivotX: existingPart.pivotX,
              pivotY: existingPart.pivotY,
              x: existingPart.x,
              y: existingPart.y,
              zIndex: existingPart.zIndex,
              rotation: existingPart.rotation,
            },
          });
        } else {
          setPendingPropByRole((prev) => ({
            ...prev,
            [selectedRole]: {
              ...prev[selectedRole]!,
              altPropId: prop.id,
              altImageUrl: prop.imageUrl!,
            },
          }));
        }
      }
    } catch (err: any) {
      toast.error(`Blink upload failed: ${err.message}`);
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
          <button
            onClick={() => publishMutation.mutate({ data: { characterId } })}
            disabled={
              publishMutation.isPending ||
              (currentCharacter?.parts.length ?? 0) === 0
            }
            className="btn btn-primary btn-sm gap-2"
          >
            <CheckCircle2 className="size-4" />
            {t("characterBuilder.publish")}
          </button>
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
              const pending = pendingPropByRole[role];
              const imageUrl = part?.imageUrl ?? pending?.imageUrl ?? null;
              const isPlaced = !!part;
              const isPending = !isPlaced && !!pending;
              return (
                <button
                  key={role}
                  onClick={() => setSelectedRole(role)}
                  draggable={!!imageUrl}
                  onDragStart={(e) => {
                    if (imageUrl) {
                      e.dataTransfer.setData("partRole", role);
                      e.dataTransfer.effectAllowed = "move";
                    }
                  }}
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
                  {isPending && (
                    <div
                      className="bg-warning size-1.5 rounded-full"
                      title="Uploaded — drag to canvas to place"
                    />
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
                isDraggingOver && "border-primary bg-primary/5 scale-[1.02]",
              )}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
                setIsDraggingOver(true);
              }}
              onDragLeave={() => setIsDraggingOver(false)}
              onDrop={handleDrop}
            >
              <canvas
                ref={canvasRef}
                onPointerMove={handleCanvasPointerMove}
                className="h-full w-full"
              />

              {/* Control toggles — top-right of canvas */}
              <div className="absolute top-3 right-3 flex flex-col gap-2">
                <label
                  className={cn(
                    "border-base-300 bg-base-100/80 flex min-w-[124px] items-center gap-2 rounded-lg border px-3 py-1.5 text-[11px] font-medium tracking-wider uppercase backdrop-blur-sm transition-colors",
                    ikState.left.enabled || ikState.right.enabled
                      ? "opacity-40 grayscale cursor-not-allowed"
                      : "hover:bg-base-200/80 cursor-pointer",
                  )}
                  title={
                    ikState.left.enabled || ikState.right.enabled
                      ? "Disable IK to edit gizmo anchors"
                      : ""
                  }
                >
                  <input
                    type="checkbox"
                    className="checkbox checkbox-xs checkbox-primary"
                    checked={gizmoEditMode}
                    disabled={ikState.left.enabled || ikState.right.enabled}
                    onChange={(e) =>
                      handleGizmoEditModeChange(e.target.checked)
                    }
                  />
                  Edit gizmos
                </label>

                <label className="border-base-300 bg-base-100/80 hover:bg-base-200/80 flex min-w-[124px] cursor-pointer items-center gap-2 rounded-lg border px-3 py-1.5 text-[11px] font-medium tracking-wider uppercase backdrop-blur-sm transition-colors">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-xs checkbox-secondary"
                    checked={showBoundingBoxes}
                    onChange={(e) => handleBoundingBoxToggle(e.target.checked)}
                  />
                  Show bounds
                </label>

                <div className="flex flex-col gap-1.5 p-1">
                  {/* Left Arm IK */}
                  <div className="border-base-300 bg-base-100/80 flex min-w-[140px] items-center justify-between gap-1 rounded-lg border px-2 py-1.5 backdrop-blur-sm">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        className="checkbox checkbox-xs checkbox-accent"
                        checked={ikState.left.enabled}
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
                        className={cn(
                          "btn btn-xs btn-ghost px-1 h-6 min-h-0",
                          ikState.left.flipped && "text-accent",
                        )}
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
                          <IterationCcw className="size-4" />
                        ) : (
                          <IterationCw className="size-4" />
                        )}
                      </button>
                    )}
                  </div>

                  {/* Right Arm IK */}
                  <div className="border-base-300 bg-base-100/80 flex min-w-[140px] items-center justify-between gap-1 rounded-lg border px-2 py-1.5 backdrop-blur-sm">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        className="checkbox checkbox-xs checkbox-accent"
                        checked={ikState.right.enabled}
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
                        className={cn(
                          "btn btn-xs btn-ghost px-1 h-6 min-h-0",
                          ikState.right.flipped && "text-accent",
                        )}
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
                      : "opacity-40 grayscale cursor-not-allowed",
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
                    hasBlinkTexture
                      ? "hover:bg-base-200/80 cursor-pointer"
                      : "cursor-not-allowed opacity-50",
                  )}
                  title={
                    !hasBlinkTexture
                      ? "Upload a blink texture in an eye part's sidebar to test"
                      : ""
                  }
                >
                  <input
                    type="checkbox"
                    className="checkbox checkbox-xs checkbox-accent"
                    checked={previewBlinking}
                    disabled={!hasBlinkTexture}
                    onChange={(e) => setPreviewBlinking(e.target.checked)}
                  />
                  Auto Blink
                </label>
              </div>

              <div className="pointer-events-none absolute right-4 bottom-4 left-4 flex justify-between text-[10px] tracking-widest uppercase opacity-30">
                <span>Drag parts from the sidebar to place them</span>
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
            const pending = pendingPropByRole[selectedRole];
            const isPlaced = !!part;
            const hasPhoto = !!(part || pending);
            const displayUrl = part?.imageUrl ?? pending?.imageUrl ?? null;

            const isEye =
              selectedRole === "eye-left" || selectedRole === "eye-right";
            const blinkUrl = part?.altImageUrl ?? pending?.altImageUrl ?? null;

            return (
              <>
                <div className="mb-6 flex items-center justify-between gap-4">
                  <h2 className="text-sm font-bold tracking-widest uppercase truncate">
                    {selectedRole.replace(/-/g, " ")}
                  </h2>
                  {hasPhoto &&
                    (isPlaced ? (
                      <button
                        onClick={handleUnplacePart}
                        disabled={unplacePartMutation.isPending}
                        className="btn btn-xs btn-ghost border-base-300 h-6 min-h-0 text-[10px] font-bold tracking-wider uppercase"
                      >
                        {unplacePartMutation.isPending ? (
                          <span className="loading loading-spinner loading-xs" />
                        ) : (
                          "unplace"
                        )}
                      </button>
                    ) : (
                      <div className="badge badge-warning badge-xs h-5 font-bold tracking-wider uppercase shrink-0">
                        Not placed
                      </div>
                    ))}
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
                              draggable={!isPlaced}
                              onDragStart={(e) => {
                                if (!isPlaced) {
                                  e.dataTransfer.setData(
                                    "partRole",
                                    selectedRole,
                                  );
                                  e.dataTransfer.effectAllowed = "move";
                                }
                              }}
                            >
                              <img
                                src={displayUrl}
                                alt="preview"
                                className="max-h-48 w-full object-contain p-2"
                              />
                              <div className="bg-base-300/80 absolute inset-0 flex items-center justify-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                                <div className="flex flex-col items-center gap-1">
                                  {isPlaced ? (
                                    <>
                                      <Upload className="size-5 text-white" />
                                      <span className="text-[10px] font-bold tracking-widest uppercase">
                                        Replace texture
                                      </span>
                                    </>
                                  ) : (
                                    <>
                                      <Maximize2 className="size-5 text-white" />
                                      <span className="text-[10px] font-bold tracking-widest uppercase">
                                        Drag to canvas
                                      </span>
                                    </>
                                  )}
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

                    {/* Blink Texture — only for eyes */}
                    {isEye && (
                      <div className="space-y-2">
                        <label className="text-xs font-medium tracking-wide uppercase opacity-60">
                          Blink Texture
                        </label>
                        <div className="relative">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleUploadBlink(e)}
                            className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
                            disabled={!!isUploading}
                          />
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
                            ) : blinkUrl ? (
                              <div className="group relative h-full w-full cursor-pointer">
                                <img
                                  src={blinkUrl}
                                  alt="blink preview"
                                  className="max-h-48 w-full object-contain p-2"
                                />
                                <div className="bg-base-300/80 absolute inset-0 flex items-center justify-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                                  <div className="flex flex-col items-center gap-1">
                                    <Upload className="size-5 text-white" />
                                    <span className="text-[10px] font-bold tracking-widest uppercase">
                                      Replace blink
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <>
                                <Upload className="size-6 opacity-30" />
                                <span className="text-xs opacity-50">
                                  Upload blink asset
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
                                className="input input-bordered input-sm w-full bg-base-300"
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
                                className="input input-bordered input-sm w-full bg-base-300"
                                value={Math.round(pivotY)}
                                readOnly
                              />
                            </div>
                          </>
                        );
                      })()}
                    </div>

                    <div className="border-primary/20 bg-primary/5 rounded-lg border p-4">
                      <div className="flex items-start gap-3">
                        <Target className="text-primary mt-0.5 size-4" />
                        <p className="text-xs italic leading-relaxed opacity-70">
                          Upload a texture, then drag it from the sidebar or
                          this panel onto the canvas to place it. Once placed,
                          drag parts freely on the canvas to reposition.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="divider opacity-30" />

                  <div className="flex flex-col gap-2 pt-4">
                    <button
                      onClick={() => setIsDeleteConfirmOpen(true)}
                      disabled={
                        deletePropMutation.isPending ||
                        (!part && !pendingPropByRole[selectedRole])
                      }
                      className={cn(
                        "btn btn-ghost btn-xs w-full gap-2 text-error/40 hover:bg-error/10 hover:text-error",
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
