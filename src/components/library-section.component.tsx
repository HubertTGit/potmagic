import { useState, useRef, useEffect } from 'react';
import {
  PhotoIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { toast } from '@/lib/toast';
import type { PropType } from '@/db/schema';

export interface LibraryItem {
  id: string;
  name: string;
  imageUrl: string | null;
}

export function LibrarySection({
  label,
  type,
  items,
  isLoading,
  onAdd,
  onRemove,
}: {
  label: string;
  type: PropType;
  items: LibraryItem[];
  isLoading: boolean;
  onAdd: (file: File, name: string) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<{
    preview: string;
    file: File;
    name: string;
  } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedIndex === null) return;
      if (e.key === 'Escape') setSelectedIndex(null);
      if (e.key === 'ArrowRight') {
        setSelectedIndex((prev) =>
          prev !== null && prev < items.length - 1 ? prev + 1 : prev,
        );
      }
      if (e.key === 'ArrowLeft') {
        setSelectedIndex((prev) =>
          prev !== null && prev > 0 ? prev - 1 : prev,
        );
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, items.length]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const preview = URL.createObjectURL(file);
    const defaultName = file.name.replace(/\.[^.]+$/, '');
    setPending({ preview, file, name: defaultName });
    e.target.value = '';
  };

  const handleConfirm = async () => {
    if (!pending || !pending.name.trim() || uploading) return;
    setUploading(true);
    try {
      await onAdd(pending.file, pending.name.trim());
      URL.revokeObjectURL(pending.preview);
      setPending(null);
    } catch (error: any) {
      toast.error(error?.message ?? 'Upload failed');
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
      toast.error(error?.message ?? 'Failed to delete prop');
    } finally {
      setDeletingId(null);
    }
  };

  const handleCancel = () => {
    if (pending) URL.revokeObjectURL(pending.preview);
    setPending(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-base-content/40">
          {label} <span className="text-base-content/25">({items.length})</span>
        </h3>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="btn btn-xs btn-gold font-display tracking-wide"
        >
          + Upload
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* Pending upload — name confirmation */}
      {pending && (
        <div className="flex items-center gap-3 bg-base-200 border border-gold/30 rounded-xl p-3 mb-4">
          <img
            src={pending.preview}
            alt=""
            className="size-14 rounded-lg object-cover shrink-0 bg-base-300"
          />
          <input
            autoFocus
            type="text"
            value={pending.name}
            onChange={(e) =>
              setPending((p) => p && { ...p, name: e.target.value })
            }
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleConfirm();
              if (e.key === 'Escape') handleCancel();
            }}
            placeholder="Name…"
            className="input input-sm flex-1 bg-base-300 border-base-300 text-sm focus:border-gold/60"
            disabled={uploading}
          />
          <button
            onClick={handleConfirm}
            disabled={uploading}
            className="btn btn-sm btn-gold font-display"
          >
            {uploading ? (
              <>
                <span className="loading loading-spinner loading-xs" />
                Uploading…
              </>
            ) : (
              'Add'
            )}
          </button>
          <button
            onClick={handleCancel}
            disabled={uploading}
            className="btn btn-sm btn-ghost text-base-content/40"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <p className="text-sm text-base-content/40 py-4">Loading…</p>
      )}

      {/* Grid */}
      {!isLoading && items.length === 0 && !pending ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="flex flex-col items-center justify-center gap-2 border border-dashed border-base-300 rounded-xl py-8 text-base-content/25 cursor-pointer hover:border-gold/30 hover:text-base-content/40 transition-colors"
        >
          <PhotoIcon className="size-7" />
          <span className="text-xs">
            Upload your first {label.toLowerCase().slice(0, -1)}
          </span>
        </div>
      ) : !isLoading ? (
        <div className="grid grid-cols-4 gap-3">
          {items.map((item, index) => (
            <div
              key={item.id}
              onClick={() => setSelectedIndex(index)}
              className="group relative rounded-xl overflow-hidden bg-base-200 border border-base-300 aspect-square cursor-pointer"
            >
              {item.imageUrl && (
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              )}
              <div className="absolute inset-0 bg-base-100/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 p-2">
                <span className="text-xs font-medium text-center leading-tight line-clamp-2">
                  {item.name}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove(item.id);
                  }}
                  disabled={!!deletingId}
                  className="text-error/70 hover:text-error transition-colors disabled:opacity-50"
                >
                  <XMarkIcon className="size-4" />
                </button>
              </div>

              {deletingId === item.id && (
                <div className="absolute inset-0 bg-base-100/60 backdrop-blur-[1px] flex items-center justify-center z-10 transition-all">
                  <span className="loading loading-spinner loading-md text-gold" />
                </div>
              )}
              <p className="absolute bottom-0 inset-x-0 text-xs text-center bg-base-300/80 px-1 py-0.5 truncate group-hover:opacity-0 transition-opacity">
                {item.name}
              </p>
            </div>
          ))}
        </div>
      ) : null}

      {/* Image Modal */}
      {selectedIndex !== null && items[selectedIndex] && (
        <dialog className="modal modal-open backdrop-blur-sm">
          <div className="modal-box max-w-[95vw] md:max-w-[85vw] bg-transparent shadow-none p-0 overflow-visible relative flex flex-col items-center justify-center">
            {/* Close button */}
            <button
              onClick={() => setSelectedIndex(null)}
              className="btn btn-circle btn-sm btn-ghost bg-base-100/50 hover:bg-base-100 backdrop-blur-md absolute -top-12 right-0 md:-top-4 md:-right-12 xl:-right-16 z-50 text-base-content/80"
              title="Close (Esc)"
            >
              <XMarkIcon className="size-5" />
            </button>

            {/* Prev button */}
            {selectedIndex > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedIndex(selectedIndex - 1);
                }}
                className="btn btn-circle btn-ghost bg-base-100/50 hover:bg-base-100 backdrop-blur-md absolute top-1/2 -translate-y-1/2 left-2 md:-left-12 xl:-left-16 z-50 shadow-md text-base-content/80"
                title="Previous (Left Arrow)"
              >
                <ChevronLeftIcon className="size-6" />
              </button>
            )}

            {/* Next button */}
            {selectedIndex < items.length - 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedIndex(selectedIndex + 1);
                }}
                className="btn btn-circle btn-ghost bg-base-100/50 hover:bg-base-100 backdrop-blur-md absolute top-1/2 -translate-y-1/2 right-2 md:-right-12 xl:-right-16 z-50 shadow-md text-base-content/80"
                title="Next (Right Arrow)"
              >
                <ChevronRightIcon className="size-6" />
              </button>
            )}

            <div className="bg-base-100/5 p-2 rounded-2xl relative inline-block max-w-full">
              <img
                src={items[selectedIndex].imageUrl!}
                alt={items[selectedIndex].name}
                className="max-h-[80vh] w-auto max-w-full object-contain rounded-xl shadow-2xl bg-base-100/80"
              />
            </div>

            <div className="mt-4 flex flex-col items-center pb-8">
              <p className="font-medium bg-base-100/80 backdrop-blur-md px-6 py-2 rounded-full shadow-lg text-base-content text-sm inline-flex items-center gap-2">
                {items[selectedIndex].name}
                <span className="text-base-content/50 font-normal text-xs px-2 py-0.5 bg-base-content/5 rounded-full">
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
