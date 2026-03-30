import { useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";
import { useLanguage } from "@/hooks/useLanguage";
import { listAllProps, uploadProp } from "@/lib/props.fns";
import { 
  createCharacter, 
  getCharacter, 
  upsertCharacterPart, 
  publishCharacter,
  listCharacters
} from "@/lib/character-builder.fns";
import { cn } from "@/lib/cn";
import { 
  ChevronLeft, 
  Upload, 
  Save, 
  Plus, 
  Layers, 
  Maximize2, 
  Target,
  Trash2,
  CheckCircle2
} from "lucide-react";
import type { Application } from "pixi.js";
import { CompositeCharacter, type CharacterPartData } from "@/components/composite-character.component";

const PART_ROLES = [
  "body", "head", "jaw", "eye-left", "eye-right", "pupil-left", "pupil-right",
  "arm-upper-left", "arm-forearm-left", "arm-hand-left",
  "arm-upper-right", "arm-forearm-right", "arm-hand-right",
  "leg-upper-left", "leg-lower-left", "leg-foot-left",
  "leg-upper-right", "leg-lower-right", "leg-foot-right",
];

export function CharacterBuilderStudio() {
  const { storyId } = useParams({ from: "/($lang)/_app/character-builder/$storyId" });
  const navigate = useNavigate();
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const appRef = useRef<Application | null>(null);
  const compositeRef = useRef<CompositeCharacter | null>(null);

  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("body");
  const [isUploading, setIsUploading] = useState<"main" | "alt" | null>(null);

  const { data: session } = authClient.useSession();
  const isDirector = session?.user.role === "director";

  // Data fetching
  const { data: props = { character: [], background: [], sound: [], rive: [], part: [], composite: [] } } = useQuery({
    queryKey: ["all-props"],
    queryFn: () => listAllProps(),
  });

  const { data: userCharacters = [] } = useQuery({
    queryKey: ["user-characters", storyId],
    queryFn: () => listCharacters({ data: { storyId } }),
  });

  const { data: currentCharacter } = useQuery({
    queryKey: ["character", selectedCharacterId],
    queryFn: () => getCharacter({ data: { characterId: selectedCharacterId! } }),
    enabled: !!selectedCharacterId,
  });

  // Mutations
  const createCharacterMutation = useMutation({
    mutationFn: createCharacter,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["user-characters"] });
      setSelectedCharacterId(data.id);
    },
  });

  const upsertPartMutation = useMutation({
    mutationFn: upsertCharacterPart,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["character", selectedCharacterId] });
    },
  });

  const publishMutation = useMutation({
    mutationFn: publishCharacter,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-characters"] });
      queryClient.invalidateQueries({ queryKey: ["all-props"] });
    },
  });
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const role = e.dataTransfer.getData("partRole");
    if (!role || !canvasRef.current || !selectedCharacterId || !currentCharacter) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 800;
    const y = ((e.clientY - rect.top) / rect.height) * 800;

    // Offset is relative to character center (400, 400)
    const offsetX = Math.round(x - 400);
    const offsetY = Math.round(y - 400);

    const part = currentCharacter.parts.find(p => p.partRole === role);
    if (!part) return;

    setSelectedRole(role);
    upsertPartMutation.mutate({
      data: {
        characterId: selectedCharacterId,
        partRole: role as any,
        propId: part.propId,
        altPropId: part.altPropId,
        offsetX,
        offsetY,
        anchorX: part.anchorX,
        anchorY: part.anchorY,
        rotation: part.rotation,
        zIndex: part.zIndex,
      }
    });
  };

  const handleRemoveTexture = (isAlt: boolean) => {
    if (!selectedCharacterId || !selectedRole || !currentCharacter) return;
    const part = currentCharacter.parts.find(p => p.partRole === selectedRole);
    if (!part) return;

    if (isAlt) {
      upsertPartMutation.mutate({
        data: {
          characterId: selectedCharacterId,
          partRole: selectedRole as any,
          propId: part.propId,
          altPropId: null, // Remove alt texture
          offsetX: part.offsetX,
          offsetY: part.offsetY,
          anchorX: part.anchorX,
          anchorY: part.anchorY,
          rotation: part.rotation,
          zIndex: part.zIndex,
        }
      });
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
      
      // Initializing with selected character
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

  // Update Preview when parts change
  useEffect(() => {
    updatePreview();
  }, [currentCharacter, appRef.current]);

  const updatePreview = () => {
    if (!appRef.current || !currentCharacter) return;

    if (compositeRef.current) {
      compositeRef.current.destroy();
    }

    const composite = new CompositeCharacter({
      sceneCastId: "builder-preview",
      castId: "builder",
      parts: currentCharacter.parts as any,
      userId: session?.user.id ?? "",
      type: "composite",
      initialX: 400,
      initialY: 400,
      canDrag: true,
      interactive: true,
      app: appRef.current,
      onChange: (role, data) => {
        // Debounced or throttled updates could go here
        // For now, we update local state or just let the dragging happen
      },
    });

    compositeRef.current = composite;
    appRef.current.stage.addChild(composite.container);
  };

  const handleUploadPart = async (e: React.ChangeEvent<HTMLInputElement>, isAlt = false) => {
    const file = e.target.files?.[0];
    if (!file || !selectedCharacterId) return;

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
        const part = currentCharacter?.parts.find(p => p.partRole === selectedRole);
        await upsertPartMutation.mutateAsync({
          data: {
            characterId: selectedCharacterId,
            partRole: selectedRole as any,
            propId: isAlt ? (part?.propId ?? prop.id) : prop.id,
            altPropId: isAlt ? prop.id : part?.altPropId,
            zIndex: part?.zIndex ?? PART_ROLES.indexOf(selectedRole),
            offsetX: part?.offsetX ?? 0,
            offsetY: part?.offsetY ?? 0,
            anchorX: part?.anchorX ?? 0.5,
            anchorY: part?.anchorY ?? 0.5,
            rotation: part?.rotation ?? 0,
          },
        });
      }
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setIsUploading(null);
    }
  };

  const handleSaveAdjustments = async () => {
    if (!compositeRef.current || !selectedCharacterId) return;
    
    // In a real implementation, we'd iterate over all parts and update transforms
    // For this POC, we just save the current one being edited
    const parts = currentCharacter?.parts ?? [];
    for (const part of parts) {
      // Find current container values
      const container = (compositeRef.current as any).partContainers.get(part.partRole);
      if (container) {
        await upsertPartMutation.mutateAsync({
          data: {
            characterId: selectedCharacterId,
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

  if (!selectedCharacterId) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center">
        <h1 className="font-display mb-6 text-3xl font-bold">{t('characterBuilder.heading')}</h1>
        <div className="mb-8 flex flex-wrap justify-center gap-4">
          {userCharacters.map((char) => (
            <button
              key={char.id}
              onClick={() => setSelectedCharacterId(char.id)}
              className="card bg-base-200 hover:bg-base-300 border-base-300 w-48 border transition-colors"
            >
              <div className="card-body items-center p-6">
                <Layers className="mb-2 size-8 opacity-50" />
                <span className="font-medium">{char.name}</span>
                {char.compositePropId && (
                  <span className="badge badge-success badge-sm">Published</span>
                )}
              </div>
            </button>
          ))}
          <button
            onClick={() => createCharacterMutation.mutate({ data: { storyId, name: t('characterBuilder.newCharacter') } })}
            className="card bg-primary text-primary-content hover:bg-primary/90 w-48"
          >
            <div className="card-body items-center p-6">
              <Plus className="mb-2 size-8" />
              <span className="font-bold">{t('characterBuilder.newCharacter')}</span>
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
            onClick={() => setSelectedCharacterId(null)}
            className="btn btn-ghost btn-sm btn-square"
          >
            <ChevronLeft className="size-5" />
          </button>
          <h1 className="font-display text-xl font-bold">
            {currentCharacter?.name || "Loading..."}
          </h1>
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
            onClick={() => publishMutation.mutate({ data: { characterId: selectedCharacterId } })}
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
            {PART_ROLES.map((role) => {
              const part = currentCharacter?.parts?.find(p => p.partRole === role);
              return (
                <button
                  key={role}
                  onClick={() => setSelectedRole(role)}
                  draggable={!!part?.imageUrl}
                  onDragStart={(e) => {
                    if (part?.imageUrl) {
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
                      {part?.imageUrl ? (
                        <img src={part.imageUrl} alt={role} className="size-full object-contain" />
                      ) : (
                        <Layers className={cn("size-4", selectedRole === role ? "opacity-100" : "opacity-40")} />
                      )}
                    </div>
                    <span className="capitalize">{role.replace(/-/g, ' ')}</span>
                  </div>
                  {part && <div className="bg-success size-1.5 rounded-full" />}
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
                "bg-base-100 shadow-2xl relative aspect-square w-full max-w-[600px] overflow-hidden rounded-xl border border-white/5 transition-colors",
                "drop-target:border-primary drop-target:bg-primary/5"
              )}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
              }}
              onDrop={handleDrop}
            >
              <canvas ref={canvasRef} className="h-full w-full" />
              
              {/* Instructions Overlay */}
              <div className="pointer-events-none absolute bottom-4 left-4 right-4 flex justify-between text-[10px] uppercase tracking-widest opacity-30">
                <span>Drag corners to adjust scale (Pro)</span>
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
                    ) : currentCharacter?.parts?.find(p => p.partRole === selectedRole)?.imageUrl ? (
                      <div 
                        className="group relative h-full w-full cursor-grab active:cursor-grabbing"
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData("partRole", selectedRole);
                          e.dataTransfer.effectAllowed = "move";
                        }}
                      >
                        <img 
                          src={currentCharacter.parts.find(p => p.partRole === selectedRole)?.imageUrl!} 
                          alt="preview" 
                          className="max-h-48 w-full object-contain p-2"
                        />
                        <div className="bg-base-300/80 absolute inset-0 flex items-center justify-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                          <div className="flex flex-col items-center gap-1">
                            <Maximize2 className="size-5 text-white" />
                            <span className="text-[10px] uppercase tracking-widest font-bold">Drag to stage</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        <Upload className="size-6 opacity-30" />
                        <span className="text-xs opacity-50">{t('characterBuilder.uploadMain')}</span>
                      </>
                    )}
                  </div>
                </div>
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
                    ) : currentCharacter?.parts?.find(p => p.partRole === selectedRole)?.altImageUrl ? (
                      <div className="group relative h-full w-full">
                        <img 
                          src={currentCharacter.parts.find(p => p.partRole === selectedRole)?.altImageUrl!} 
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
                    )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Transform Controls (Visual Placeholder) */}
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
                    Drag and drop parts on the canvas to set their anchor points and offsets.
                  </p>
                </div>
              </div>
            </div>

            <div className="divider opacity-30" />

            <button className="btn btn-ghost btn-error btn-sm w-full gap-2">
              <Trash2 className="size-4" /> {t('action.remove')}
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
