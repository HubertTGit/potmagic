import { useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";
import { useLanguage } from "@/hooks/useLanguage";
import { uploadProp, deleteProp } from "@/lib/props.fns";
import {
  createCharacter,
  getCharacter,
  upsertCharacterPart,
  publishCharacter,
  listCharacters,
  updateCharacter
} from "@/lib/character-builder.fns";
import { cn } from "@/lib/cn";
import {
  ChevronLeft,
  Upload,
  Save,
  Plus,
  Drama,
  Sparkles,
  Maximize2,
  Target,
  Trash2,
  CheckCircle2
} from "lucide-react";
import type { Application } from "pixi.js";
import { CompositeCharacter, ALL_PART_ROLES } from "@/components/composite-character.component";

// Pending prop: uploaded to Blob/DB but not yet placed on canvas via drag-drop
type PendingProp = {
  propId: string;
  imageUrl: string;
  altPropId?: string;
  altImageUrl?: string;
};

export function CharacterBuilderStudio() {
  const { storyId, characterId } = useParams({ strict: false }) as { storyId: string, characterId?: string };
  const navigate = useNavigate();
  const { t } = useLanguage();
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
  const [pendingPropByRole, setPendingPropByRole] = useState<Record<string, PendingProp>>({});

  const { data: session } = authClient.useSession();
  const isDirector = session?.user.role === "director";

  const { data: userCharacters = [] } = useQuery({
    queryKey: ["user-characters", storyId],
    queryFn: () => listCharacters({ data: { storyId } }),
  });

  const { data: currentCharacter } = useQuery({
    queryKey: ["character", characterId],
    queryFn: () => getCharacter({ data: { characterId: characterId! } }),
    enabled: !!characterId,
  });

  // Mutations
  const createCharacterMutation = useMutation({
    mutationFn: createCharacter,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["user-characters"] });
      navigate({ to: `/character-builder/${storyId}/${data.id}` as any });
    },
  });

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

  const handleTitleSubmit = () => {
    if (characterId && localName && localName !== currentCharacter?.name) {
      updateCharacterMutation.mutate({ data: { characterId, name: localName } });
    }
  };

  const deletePropMutation = useMutation({
    mutationFn: deleteProp,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["character", characterId] });
      queryClient.invalidateQueries({ queryKey: ["all-props"] });
    },
  });

  const handleRemovePart = async () => {
    if (!characterId || !selectedRole || !currentCharacter) return;

    // If only pending (not placed), just clear from local state
    if (pendingPropByRole[selectedRole] && !currentCharacter.parts.find(p => p.partRole === selectedRole)) {
      setPendingPropByRole(prev => {
        const next = { ...prev };
        delete next[selectedRole];
        return next;
      });
      return;
    }

    const part = currentCharacter.parts.find(p => p.partRole === selectedRole);
    if (!part) return;

    try {
      if (part.altPropId) {
        await deletePropMutation.mutateAsync({ data: { id: part.altPropId } });
      }
      if (part.propId) {
        await deletePropMutation.mutateAsync({ data: { id: part.propId } });
      }
    } catch (e) {
      console.error("Failed to remove part:", e);
    }
  };

  // Drop from sidebar onto canvas — this is the ONLY way a part appears on canvas
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    const role = e.dataTransfer.getData("partRole");
    if (!role || !canvasRef.current || !characterId || !currentCharacter) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 800;
    const y = ((e.clientY - rect.top) / rect.height) * 800;

    const offsetX = Math.round(x - 400);
    const offsetY = Math.round(y - 400);

    const existingPart = currentCharacter.parts.find(p => p.partRole === role);
    const pending = pendingPropByRole[role];

    const propId = existingPart?.propId ?? pending?.propId;
    if (!propId) return; // no texture uploaded for this role yet

    setSelectedRole(role);
    upsertPartMutation.mutate({
      data: {
        characterId,
        partRole: role as any,
        propId,
        altPropId: existingPart?.altPropId ?? pending?.altPropId,
        offsetX,
        offsetY,
        anchorX: existingPart?.anchorX ?? 0.5,
        anchorY: existingPart?.anchorY ?? 0.5,
        rotation: existingPart?.rotation ?? 0,
        zIndex: existingPart?.zIndex ?? ALL_PART_ROLES.indexOf(role as any),
      }
    }, {
      onSuccess: () => {
        // Clear from pending now that it's persisted and will appear via currentCharacter
        setPendingPropByRole(prev => {
          const next = { ...prev };
          delete next[role];
          return next;
        });
      }
    });
  };

  const handleRemoveTexture = async (isAlt: boolean) => {
    if (!characterId || !selectedRole || !currentCharacter) return;
    const part = currentCharacter.parts.find(p => p.partRole === selectedRole);
    if (!part) return;

    if (isAlt && part.altPropId) {
      try {
        await deletePropMutation.mutateAsync({ data: { id: part.altPropId } });
      } catch (e) {
        console.error("Failed to remove alt texture:", e);
      }
    }
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

    // Capture live canvas positions before destroying the old composite so that
    // parts the user has already dragged don't snap back to their DB values.
    // Newly added parts won't have a live position and will use the DB value (the drop point).
    const livePositions = compositeRef.current?.getLivePositions() ?? {};

    if (compositeRef.current) {
      compositeRef.current.destroy();
    }

    const parts = currentCharacter.parts.map(p => ({
      ...p,
      offsetX: livePositions[p.partRole]?.x ?? p.offsetX,
      offsetY: livePositions[p.partRole]?.y ?? p.offsetY,
    }));

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
      onChange: () => {},
    });

    compositeRef.current = composite;
    appRef.current.stage.addChild(composite.container);
  };

  // Upload a texture for a part.
  // - If the part is already placed (in currentCharacter.parts): update texture in DB immediately.
  // - If not yet placed: store in pendingPropByRole; it appears on canvas only when dropped.
  const handleUploadPart = async (e: React.ChangeEvent<HTMLInputElement>, isAlt = false) => {
    const file = e.target.files?.[0];
    if (!file || !characterId) return;

    setIsUploading(isAlt ? "alt" : "main");
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
          name: `${selectedRole}_${isAlt ? 'alt_' : ''}${Date.now()}`,
          type: "part",
          fileName: file.name,
          contentType: file.type,
          base64,
          size: file.size,
        },
      });

      if (prop) {
        const existingPart = currentCharacter?.parts.find(p => p.partRole === selectedRole);

        if (existingPart) {
          // Already placed: update texture in DB directly
          await upsertPartMutation.mutateAsync({
            data: {
              characterId,
              partRole: selectedRole as any,
              propId: isAlt ? (existingPart.propId ?? prop.id) : prop.id,
              altPropId: isAlt ? prop.id : existingPart.altPropId,
              zIndex: existingPart.zIndex ?? ALL_PART_ROLES.indexOf(selectedRole as any),
              offsetX: existingPart.offsetX,
              offsetY: existingPart.offsetY,
              anchorX: existingPart.anchorX,
              anchorY: existingPart.anchorY,
              rotation: existingPart.rotation,
            },
          });
        } else {
          // Not yet placed: stage in pending — appears on canvas only when dropped
          setPendingPropByRole(prev => ({
            ...prev,
            [selectedRole]: {
              ...prev[selectedRole],
              ...(isAlt
                ? { altPropId: prop.id, altImageUrl: prop.imageUrl ?? undefined }
                : { propId: prop.id, imageUrl: prop.imageUrl ?? "" }
              ),
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

  const handleSaveAdjustments = async () => {
    if (!compositeRef.current || !characterId) return;

    const parts = currentCharacter?.parts ?? [];
    for (const part of parts) {
      const container = (compositeRef.current as any).partContainers.get(part.partRole);
      if (container) {
        await upsertPartMutation.mutateAsync({
          data: {
            characterId,
            partRole: part.partRole,
            propId: part.propId,
            offsetX: Math.round(container.x),
            offsetY: Math.round(container.y),
            rotation: Math.round(container.rotation * (180 / Math.PI)),
            zIndex: part.zIndex,
          },
        });
      }
    }
  };

  if (!isDirector) {
    return (
      <div className="flex h-screen items-center justify-center p-8 text-center text-error">
        Unauthorized
      </div>
    );
  }
  if (!characterId) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-12 text-center">
        <div className="mb-8 flex items-center justify-center gap-4">
          <h1 className="font-display text-4xl font-bold tracking-tight">{t('characterBuilder.heading')}</h1>
          {session?.user.subscription !== 'standard' && (
            <div className="badge badge-accent badge-lg gap-2 font-bold uppercase tracking-widest shadow-sm">
              <Sparkles className="size-4" />
              {session?.user.subscription}
            </div>
          )}
        </div>

        <div className="mb-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {userCharacters.map((char) => (
            <button
              key={char.id}
              onClick={() => navigate({ to: `/character-builder/${storyId}/${char.id}` as any })}
              className="card bg-base-100 hover:bg-base-200 border-base-300 group w-56 border shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
            >
              <div className="card-body items-center p-8">
                <div className="bg-primary/5 group-hover:bg-primary/10 mb-4 flex size-20 items-center justify-center rounded-2xl transition-colors">
                  <Drama className="text-primary size-10 transform transition-transform group-hover:scale-110" />
                </div>
                <span className="font-display text-lg font-semibold">{char.name}</span>
                {char.compositePropId && (
                  <span className="badge badge-success badge-sm mt-2 font-medium uppercase tracking-wider">Published</span>
                )}
              </div>
            </button>
          ))}
          <button
            onClick={() => createCharacterMutation.mutate({ data: { storyId, name: t('characterBuilder.newCharacter') } })}
            className="card bg-primary text-primary-content hover:bg-primary/90 group w-56 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="card-body items-center p-8">
              <div className="bg-white/20 group-hover:bg-white/30 mb-4 flex size-20 items-center justify-center rounded-2xl transition-colors">
                <Plus className="size-10 transform transition-transform group-hover:scale-120" />
              </div>
              <span className="font-display text-lg font-bold">{t('characterBuilder.newCharacter')}</span>
            </div>
          </button>
        </div>
        <button
          onClick={() => navigate({ to: `/stories/${storyId}` as any })}
          className="btn btn-ghost gap-2"
        >
          <ChevronLeft className="size-4" /> Back
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <header className="bg-base-100 border-base-300 flex items-center justify-between border-b px-6 py-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate({ to: `/character-builder/${storyId}` as any })}
            className="btn btn-ghost btn-sm btn-square"
          >
            <ChevronLeft className="size-5" />
          </button>
          <input
            type="text"
            value={localName}
            onChange={(e) => setLocalName(e.target.value)}
            onBlur={handleTitleSubmit}
            onKeyDown={(e) => e.key === 'Enter' && handleTitleSubmit()}
            className="font-display bg-transparent text-xl font-bold focus:outline-none focus:ring-0 w-64 hover:bg-base-200/50 rounded px-1 transition-colors"
            placeholder={t('characterBuilder.newCharacter')}
          />
          {currentCharacter?.compositePropId && (
            <span className="badge badge-success badge-sm font-semibold uppercase tracking-widest">
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
            {t('action.save')}
          </button>
          <button
            onClick={() => publishMutation.mutate({ data: { characterId } })}
            disabled={publishMutation.isPending || (currentCharacter?.parts.length ?? 0) === 0}
            className="btn btn-primary btn-sm gap-2"
          >
            <CheckCircle2 className="size-4" />
            {t('characterBuilder.publish')}
          </button>
        </div>
      </header>

      {/* Main Studio Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar: Layers/Parts */}
        <aside className="bg-base-200 border-base-300 w-64 overflow-y-auto border-r p-4">
          <h2 className="mb-4 text-xs font-bold uppercase tracking-widest opacity-50">
            {t('characterBuilder.bodyParts')}
          </h2>
          <div className="space-y-1">
            {ALL_PART_ROLES.map((role) => {
              const part = currentCharacter?.parts?.find(p => p.partRole === role);
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
                    "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors",
                    selectedRole === role ? "bg-primary text-primary-content" : "hover:bg-base-300"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-base-300 flex size-8 items-center justify-center overflow-hidden rounded-md border border-white/5">
                      {imageUrl ? (
                        <img src={imageUrl} alt={role} className="size-full object-contain" />
                      ) : (
                        <Drama className={cn("size-4", selectedRole === role ? "opacity-100" : "opacity-40")} />
                      )}
                    </div>
                    <span className="capitalize">{role.replace(/-/g, ' ')}</span>
                  </div>
                  {isPlaced && <div className="bg-success size-1.5 rounded-full" />}
                  {isPending && <div className="bg-warning size-1.5 rounded-full" title="Uploaded — drag to canvas to place" />}
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
                "bg-base-100 shadow-2xl relative aspect-square w-full max-w-[600px] overflow-hidden rounded-xl border border-white/5 transition-all duration-200",
                isDraggingOver && "border-primary bg-primary/5 scale-[1.02]"
              )}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
                setIsDraggingOver(true);
              }}
              onDragLeave={() => setIsDraggingOver(false)}
              onDrop={handleDrop}
            >
              <canvas ref={canvasRef} className="h-full w-full" />

              {/* Gizmo edit mode toggle — top-right of canvas */}
              <label className="absolute top-3 right-3 flex cursor-pointer items-center gap-2 rounded-lg border border-base-300 bg-base-100/80 px-3 py-1.5 text-[11px] font-medium uppercase tracking-wider backdrop-blur-sm transition-colors hover:bg-base-200/80">
                <input
                  type="checkbox"
                  className="checkbox checkbox-xs checkbox-primary"
                  checked={gizmoEditMode}
                  onChange={(e) => handleGizmoEditModeChange(e.target.checked)}
                />
                Edit gizmos
              </label>

              <div className="pointer-events-none absolute bottom-4 left-4 right-4 flex justify-between text-[10px] uppercase tracking-widest opacity-30">
                <span>Drag parts from the sidebar to place them</span>
                <span>800x800 Preview</span>
              </div>
            </div>
          </div>
        </main>

        {/* Right Sidebar: Part Properties/Upload */}
        <aside className="bg-base-200 border-base-300 w-80 overflow-y-auto border-l p-6">
          <h2 className="mb-6 text-sm font-bold uppercase tracking-widest">
            {selectedRole.replace(/-/g, ' ')}
          </h2>

          <div className="space-y-6">
            {/* Upload Area */}
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-medium opacity-60 tracking-wide uppercase">
                  Texture
                </label>
                {(() => {
                  const part = currentCharacter?.parts?.find(p => p.partRole === selectedRole);
                  const pending = pendingPropByRole[selectedRole];
                  const displayUrl = part?.imageUrl ?? pending?.imageUrl ?? null;
                  const isPlaced = !!part;
                  return (
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleUploadPart(e, false)}
                        className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
                        disabled={!!isUploading}
                      />
                      <div className={cn(
                        "border-base-300 flex min-h-32 flex-col items-center justify-center gap-2 overflow-hidden rounded-xl border-2 border-dashed transition-colors",
                        isUploading === "main" ? "bg-base-300" : "hover:bg-base-300"
                      )}>
                        {isUploading === "main" ? (
                          <span className="loading loading-spinner loading-md text-primary" />
                        ) : displayUrl ? (
                          <div
                            className={cn(
                              "group relative h-full w-full",
                              !isPlaced ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"
                            )}
                            draggable={!isPlaced}
                            onDragStart={(e) => {
                              if (!isPlaced) {
                                e.dataTransfer.setData("partRole", selectedRole);
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
                                    <span className="text-[10px] uppercase tracking-widest font-bold">Replace texture</span>
                                  </>
                                ) : (
                                  <>
                                    <Maximize2 className="size-5 text-white" />
                                    <span className="text-[10px] uppercase tracking-widest font-bold">Drag to canvas</span>
                                  </>
                                )}
                              </div>
                            </div>
                            {!isPlaced && (
                              <div className="absolute top-2 right-2 badge badge-warning badge-xs font-bold uppercase tracking-wider">
                                Not placed
                              </div>
                            )}
                          </div>
                        ) : (
                          <>
                            <Upload className="size-6 opacity-30" />
                            <span className="text-xs opacity-50">{t('characterBuilder.uploadMain')}</span>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>

              {(selectedRole === 'jaw' || selectedRole.startsWith('eye') || selectedRole.startsWith('pupil')) && (
                <div className="space-y-2">
                  <label className="text-xs font-medium opacity-60 tracking-wide uppercase">
                    Expression Appearance (Talking/Blinking)
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleUploadPart(e, true)}
                      className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
                      disabled={!!isUploading}
                    />
                    <div className={cn(
                      "border-base-300 flex h-24 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed transition-colors",
                      isUploading === "alt" ? "bg-base-300" : "hover:bg-base-300"
                    )}>
                    {isUploading === "alt" ? (
                      <span className="loading loading-spinner loading-md text-primary" />
                    ) : (() => {
                      const part = currentCharacter?.parts?.find(p => p.partRole === selectedRole);
                      const pending = pendingPropByRole[selectedRole];
                      const altUrl = part?.altImageUrl ?? pending?.altImageUrl ?? null;
                      return altUrl ? (
                        <div className="group relative h-full w-full">
                          <img
                            src={altUrl}
                            alt="alt-preview"
                            className="max-h-32 w-full object-contain p-2"
                          />
                          <div className="bg-base-300/80 absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveTexture(true);
                              }}
                              className="btn btn-circle btn-error btn-xs"
                            >
                              <Trash2 className="size-3" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <Plus className="size-5 opacity-30" />
                          <span className="text-xs opacity-50">{t('characterBuilder.uploadAlt')}</span>
                        </>
                      );
                    })()}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Transform Controls */}
            <div className="space-y-4">
              <h3 className="text-xs font-medium opacity-60 tracking-wide uppercase">
                Transform
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] opacity-40 uppercase">Anchor X</label>
                  <input type="number" className="input input-bordered input-sm w-full bg-base-300" value={0.5} readOnly />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] opacity-40 uppercase">Anchor Y</label>
                  <input type="number" className="input input-bordered input-sm w-full bg-base-300" value={0.5} readOnly />
                </div>
              </div>

              <div className="bg-primary/5 rounded-lg border border-primary/20 p-4">
                <div className="flex items-start gap-3">
                  <Target className="text-primary mt-0.5 size-4" />
                  <p className="text-xs leading-relaxed opacity-70 italic">
                    Upload a texture, then drag it from the sidebar or this panel onto the canvas to place it. Once placed, drag parts freely on the canvas to reposition.
                  </p>
                </div>
              </div>
            </div>

            <div className="divider opacity-30" />

            <button
              onClick={handleRemovePart}
              disabled={
                deletePropMutation.isPending ||
                (!currentCharacter?.parts?.find(p => p.partRole === selectedRole) && !pendingPropByRole[selectedRole])
              }
              className="btn btn-ghost btn-error btn-sm w-full gap-2 mt-4"
            >
              {deletePropMutation.isPending ? (
                <span className="loading loading-spinner loading-xs" />
              ) : (
                <Trash2 className="size-4" />
              )}
              {deletePropMutation.isPending ? 'Removing...' : t('action.remove')}
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
