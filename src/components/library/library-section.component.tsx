import { useState, useRef, useEffect } from "react";
import { useAtomValue } from "jotai";
import { cn } from "@/lib/cn";
import { Image, X, ChevronLeft, ChevronRight, Music } from "lucide-react";
import { toast } from "@/lib/toast";
import { PropType } from "@/db/schema";
import { useLanguage } from "@/hooks/useLanguage";
import { riveApiAtom } from "@/lib/rive.atoms";
import { MediaPreview } from "./media-preview.component";
import { LibraryItemOverlay } from "./library-item-overlay.component";

export interface LibraryItem {
  id: string;
  name: string;
  imageUrl: string | null;
}

export interface LibrarySectionProps {
  label: string;
  type: PropType;
  items: LibraryItem[];
  isLoading: boolean;
  onAdd: (file: File, name: string) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
  readOnly?: boolean;
}

export function LibrarySection({
  label,
  type,
  items,
  isLoading,
  onAdd,
  onRemove,
  readOnly = false,
}: LibrarySectionProps) {
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<{
    preview: string;
    buffer?: ArrayBuffer;
    file: File;
    name: string;
  } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const riveApi = useAtomValue(riveApiAtom);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedIndex === null) return;
      if (e.key === "Escape") setSelectedIndex(null);
      if (e.key === "ArrowRight") {
        setSelectedIndex((prev) =>
          prev !== null && prev < items.length - 1 ? prev + 1 : prev,
        );
      }
      if (e.key === "ArrowLeft") {
        setSelectedIndex((prev) =>
          prev !== null && prev > 0 ? prev - 1 : prev,
        );
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedIndex, items.length]);

  const isRive = type === "rive";
  const isSound = type === "sound";
  const acceptMime = isRive
    ? "application/octet-stream,.riv"
    : isSound
      ? "audio/mp4,.mp4,audio/*"
      : "image/*";

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (isRive) {
      // For animations, we read as buffer for immediate Rive preview
      const reader = new FileReader();
      reader.onload = (event) => {
        const arrayBuffer = event.target?.result as ArrayBuffer;
        if (arrayBuffer) {
          setPending({
            preview: "", // Not needed when buffer is present
            buffer: arrayBuffer,
            file,
            name: file.name.replace(/\.[^.]+$/, ""),
          });
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      const preview = URL.createObjectURL(file);
      const defaultName = file.name.replace(/\.[^.]+$/, "");
      setPending({ preview, file, name: defaultName });
    }
    e.target.value = "";
  };

  const handleConfirm = async () => {
    if (!pending || !pending.name.trim() || uploading) return;
    setUploading(true);
    try {
      await onAdd(pending.file, pending.name.trim());
      if (pending.preview) URL.revokeObjectURL(pending.preview);
      setPending(null);
    } catch (error: any) {
      toast.error(error?.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async (id: string) => {
    if (deletingId) return;
    setDeletingId(id);
    try {
      await onRemove(id);
    } catch (error: any) {
      toast.error(error?.message ?? "Failed to delete prop");
    } finally {
      setDeletingId(null);
    }
  };

  const handleCancel = () => {
    if (pending && pending.preview) URL.revokeObjectURL(pending.preview);
    setPending(null);
  };

  return (
    <div>
      <div className="mb-3 flex justify-between">
        <h3 className="text-base-content/40 text-sm font-semibold tracking-widest uppercase">
          {label} <span className="text-base-content/25">({items.length})</span>
        </h3>
        {!readOnly && (
          <>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="btn btn-primary font-display tracking-wide"
            >
              {t("library.upload")}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept={acceptMime}
              className="hidden"
              onChange={handleFileChange}
            />
          </>
        )}
      </div>

      {/* Pending upload — name confirmation */}
      {pending && (
        <div className="bg-base-200 border-primary/30 mb-4 flex items-center gap-3 rounded-xl border p-3">
          <MediaPreview
            src={pending.preview}
            buffer={pending.buffer}
            isRive={isRive}
            isSound={isSound}
            className="bg-base-300 size-14 shrink-0 overflow-hidden rounded-lg object-cover"
          />
          <input
            autoFocus
            type="text"
            value={pending.name}
            onChange={(e) =>
              setPending((p) => p && { ...p, name: e.target.value })
            }
            onKeyDown={(e) => {
              if (e.key === "Enter") handleConfirm();
              if (e.key === "Escape") handleCancel();
            }}
            placeholder={t("library.namePlaceholder")}
            className="input input-sm bg-base-300 border-base-300 focus:border-primary/60 flex-1 text-sm"
            disabled={uploading}
          />
          <button
            onClick={handleConfirm}
            disabled={uploading}
            className="btn btn-sm btn-primary font-display"
          >
            {uploading ? (
              <>
                <span className="loading loading-spinner loading-xs" />
                {t("action.uploading")}
              </>
            ) : (
              t("action.add")
            )}
          </button>
          <button
            onClick={handleCancel}
            disabled={uploading}
            className="btn btn-sm btn-ghost text-base-content/40"
          >
            {t("action.cancel")}
          </button>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2">
              <div className="skeleton aspect-square w-full rounded-lg" />
              <div className="skeleton h-3 w-3/4 rounded" />
            </div>
          ))}
        </div>
      )}

      {/* Grid */}
      {!isLoading && items.length === 0 && !pending ? (
        <div
          onClick={readOnly ? undefined : () => fileInputRef.current?.click()}
          className={cn(
            "border-base-300 text-base-content/25 flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed py-8 transition-colors",
            !readOnly && "hover:border-primary/30 hover:text-base-content/40 cursor-pointer",
          )}
        >
          {isSound ? (
            <Music className="size-7" />
          ) : (
            <Image className="size-7" />
          )}
          <span className="text-xs">
            {t("library.uploadFirstItem", { type: label.toLowerCase() })}
          </span>
        </div>
      ) : !isLoading ? (
        <div className="grid grid-cols-4 gap-3">
          {items.map((item, index) => (
            <div
              key={item.id}
              onClick={() => setSelectedIndex(index)}
              className="group bg-base-200 border-base-300 relative aspect-square cursor-pointer overflow-hidden rounded-xl border"
            >
              <MediaPreview
                src={item.imageUrl}
                name={item.name}
                isRive={isRive}
                isSound={isSound}
                className="h-full w-full object-cover"
              />
              {!readOnly && (
                <LibraryItemOverlay
                  item={item}
                  confirmDeleteId={confirmDeleteId}
                  deletingId={deletingId}
                  onConfirmDelete={(id) => handleRemove(id)}
                  onCancelDelete={() => setConfirmDeleteId(null)}
                  onTriggerDelete={(id) => setConfirmDeleteId(id)}
                />
              )}

              {deletingId === item.id && (
                <div className="bg-base-100/60 absolute inset-0 z-10 flex items-center justify-center backdrop-blur-[1px] transition-all">
                  <span className="loading loading-spinner loading-md text-primary" />
                </div>
              )}
              <p className="bg-base-300/80 absolute inset-x-0 bottom-0 truncate px-1 py-0.5 text-center text-xs transition-opacity group-hover:opacity-0">
                {item.name}
              </p>
            </div>
          ))}
        </div>
      ) : null}

      {/* Image Modal */}
      {selectedIndex !== null && items[selectedIndex] && (
        <dialog className="modal modal-open backdrop-blur-sm">
          <div className="modal-box relative flex max-w-[95vw] flex-col items-center justify-center overflow-visible bg-transparent p-0 shadow-none md:max-w-[85vw]">
            {/* Close button */}
            <button
              onClick={() => setSelectedIndex(null)}
              className="btn btn-circle btn-sm btn-ghost bg-base-100/50 hover:bg-base-100 text-base-content/80 absolute -top-12 right-0 z-50 backdrop-blur-md md:-top-4 md:-right-12 xl:-right-16"
              title={t("aria.closeEsc")}
            >
              <X className="size-5" />
            </button>

            {/* Prev button */}
            {selectedIndex > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedIndex(selectedIndex - 1);
                }}
                className="btn btn-circle btn-ghost bg-base-100/50 hover:bg-base-100 text-base-content/80 absolute top-1/2 left-2 z-50 -translate-y-1/2 shadow-md backdrop-blur-md md:-left-12 xl:-left-16"
                title={t("aria.previousArrow")}
              >
                <ChevronLeft className="size-6" />
              </button>
            )}

            {/* Next button */}
            {selectedIndex < items.length - 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedIndex(selectedIndex + 1);
                }}
                className="btn btn-circle btn-ghost bg-base-100/50 hover:bg-base-100 text-base-content/80 absolute top-1/2 right-2 z-50 -translate-y-1/2 shadow-md backdrop-blur-md md:-right-12 xl:-right-16"
                title={t("aria.nextArrow")}
              >
                <ChevronRight className="size-6" />
              </button>
            )}

            <div className="bg-base-100/5 relative flex min-h-[50vh] max-w-full min-w-[50vw] flex-col items-center justify-center overflow-hidden rounded-2xl p-2">
              <MediaPreview
                src={items[selectedIndex].imageUrl!}
                name={items[selectedIndex].name}
                isRive={isRive}
                isSound={isSound}
                isInteractive={true}
                className="bg-base-100/80 max-h-[80vh] w-auto max-w-full overflow-hidden rounded-xl object-contain shadow-2xl"
              />
              {isRive && riveApi && (
                <p className="text-base-content/50 bg-base-content/5 mt-4 rounded-full px-2 py-0.5 text-xs font-normal">
                  Rive Interactive
                </p>
              )}
            </div>

            <div className="mt-4 flex flex-col items-center pb-8">
              {riveApi && (
                <div className="mb-6 flex flex-col items-center gap-4">
                  {/* Enums */}
                  {riveApi.enumValues.map((prop) => (
                    <div
                      key={prop.name}
                      className="flex flex-col items-center gap-2"
                    >
                      <span className="text-base-content/40 text-[10px] font-bold tracking-widest uppercase">
                        {prop.name}
                      </span>
                      <div className="flex flex-wrap justify-center gap-1">
                        {prop.enums?.map((val) => (
                          <button
                            key={val}
                            onClick={() => riveApi?.setEnum(prop.name, val)}
                            className="btn btn-xs btn-primary font-display"
                          >
                            {val}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}

                  {/* Booleans & Triggers */}
                  <div className="flex flex-wrap justify-center gap-4">
                    {riveApi.boolValues.map((prop) => (
                      <label
                        key={prop.name}
                        className="flex cursor-pointer items-center gap-2"
                      >
                        <span className="text-base-content/60 text-xs font-medium capitalize">
                          {prop.name}
                        </span>
                        <input
                          type="checkbox"
                          className="toggle toggle-primary toggle-xs"
                          onChange={(e) =>
                            riveApi?.setBool(prop.name, e.target.checked)
                          }
                        />
                      </label>
                    ))}

                    {riveApi.triggerValues.map((prop) => (
                      <button
                        key={prop.name}
                        onClick={() => riveApi?.fireTrigger(prop.name)}
                        className="btn btn-xs btn-accent font-display"
                      >
                        {prop.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <p className="bg-base-100/80 text-base-content inline-flex items-center gap-2 rounded-full px-6 py-2 text-sm font-medium shadow-lg backdrop-blur-md">
                {items[selectedIndex].name}
                {(type === "composite-human" || type === "composite-animal") && (
                  <span className="badge badge-primary badge-sm font-normal">
                    Composite Character
                  </span>
                )}
                <span className="text-base-content/50 bg-base-content/5 rounded-full px-2 py-0.5 text-xs font-normal">
                  {selectedIndex + 1} / {items.length}
                </span>
              </p>
            </div>
          </div>
          <form method="dialog" className="modal-backdrop bg-base-200/60">
            <button onClick={() => setSelectedIndex(null)}>close</button>
          </form>
        </dialog>
      )}
    </div>
  );
}
