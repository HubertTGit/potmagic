import { createFileRoute, Link } from '@tanstack/react-router';
import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listStories } from '@/lib/stories.fns';
import {
  getSignedUploadUrl,
  createProp,
  listProps,
  deleteProp,
} from '@/lib/props.fns';
import { StatusBadge } from '@/components/status-badge.component';
import { cn } from '@/lib/cn';
import { PhotoIcon, XMarkIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { updateStoryStatus } from '@/lib/story-detail.fns';
import { toast } from '@/lib/toast';

export const Route = createFileRoute('/_app/director')({
  component: DirectorPage,
});

interface LibraryItem {
  id: string;
  name: string;
  imageUrl: string | null;
}

type Tab = 'dashboard' | 'library';

function DirectorPage() {
  const [tab, setTab] = useState<Tab>('dashboard');

  const queryClient = useQueryClient();
  const { data: stories = [], isLoading } = useQuery({
    queryKey: ['stories'],
    queryFn: () => listStories(),
  });

  const statusMutation = useMutation({
    mutationFn: ({
      storyId,
      status,
    }: {
      storyId: string;
      status: 'draft' | 'active' | 'ended';
    }) => updateStoryStatus({ data: { storyId, status } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['stories'] }),
  });

  const { data: characters = [], isLoading: loadingChars } = useQuery({
    queryKey: ['props', 'character'],
    queryFn: () => listProps({ data: { type: 'character' } }),
    enabled: tab === 'library',
  });

  const { data: backgrounds = [], isLoading: loadingBgs } = useQuery({
    queryKey: ['props', 'background'],
    queryFn: () => listProps({ data: { type: 'background' } }),
    enabled: tab === 'library',
  });

  const active = stories.filter((s) => s.status === 'active');
  const draft = stories.filter((s) => s.status === 'draft');
  const ended = stories.filter((s) => s.status === 'ended');

  const handleAddProp = async (
    type: 'character' | 'background' | 'animation',
    file: File,
    name: string,
  ) => {
    try {
      const { signedUrl, publicUrl } = await getSignedUploadUrl({
        data: { filename: file.name, contentType: file.type },
      });

      // Insert into DB first so Drizzle check constraint validates the size.
      const prop = await createProp({ data: { name, type, imageUrl: publicUrl, size: file.size } });

      const uploadResponse = await fetch(signedUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      });
      
      if (!uploadResponse.ok) {
        // Rollback the DB entry if the actual file upload fails
        try {
          await deleteProp({ data: { id: prop.id } });
        } catch (e) {
          // Swallow rollback errors to retain original fetch error
        }
        
        throw new Error(
          `Upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`,
        );
      }

      queryClient.invalidateQueries({ queryKey: ['props', type] });
    } catch (error: any) {
      toast.error(`File size is too big. It should not be larger than 1MB.\n${error.message}`);
      throw error;
    }
  };

  const handleRemoveProp = async (
    type: 'character' | 'background' | 'animation',
    id: string,
  ) => {
    await deleteProp({ data: { id } });
    queryClient.invalidateQueries({ queryKey: ['props', type] });
  };

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-2xl font-semibold mb-2">Director</h1>
      <p className="text-sm text-base-content/40 mb-6">
        Manage sessions and story status.
      </p>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-base-300 mb-8">
        {(['dashboard', 'library'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'px-4 py-2 text-sm font-medium capitalize tracking-wide border-b-2 -mb-px transition-colors',
              tab === t
                ? 'border-gold text-base-content'
                : 'border-transparent text-base-content/40 hover:text-base-content/70',
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'dashboard' && (
        <>
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-4 mb-10">
            {[
              { label: 'Active', count: active.length, color: 'text-success' },
              {
                label: 'Draft',
                count: draft.length,
                color: 'text-base-content/60',
              },
              {
                label: 'Ended',
                count: ended.length,
                color: 'text-base-content/30',
              },
            ].map(({ label, count, color }) => (
              <div
                key={label}
                className="bg-base-200 border border-base-300 rounded-xl px-5 py-4"
              >
                <p className={cn('text-3xl font-bold font-display', color)}>
                  {count}
                </p>
                <p className="text-xs text-base-content/40 uppercase tracking-widest mt-1">
                  {label}
                </p>
              </div>
            ))}
          </div>

          {/* Stories table */}
          {isLoading ? (
            <p className="text-sm text-base-content/40">Loading…</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="table table-sm w-full">
                <thead>
                  <tr className="text-base-content/50 text-xs uppercase tracking-wider">
                    <th>Story</th>
                    <th>Cast</th>
                    <th>Status</th>
                    <th>Session</th>
                  </tr>
                </thead>
                <tbody>
                  {stories.map((story) => (
                    <tr
                      key={story.id}
                      className="hover:bg-base-200 transition-colors"
                    >
                      <td>
                        <Link
                          to="/stories/$storyId"
                          params={{ storyId: story.id }}
                          className="font-medium hover:text-gold transition-colors"
                        >
                          {story.title}
                        </Link>
                      </td>
                      <td className="text-base-content/50">
                        {story.castCount}
                      </td>
                      <td>
                        <StatusBadge status={story.status} />
                      </td>
                      <td>
                        <SessionControls
                          story={story}
                          onSetStatus={(id, status) =>
                            statusMutation.mutate({ storyId: id, status })
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {tab === 'library' && (
        <>
          <p className="text-sm text-base-content/40 mb-6">
            Upload characters and backgrounds available across stories.
          </p>
          <div className="flex flex-col gap-8">
            <LibrarySection
              label="Characters"
              type="character"
              items={characters}
              isLoading={loadingChars}
              onAdd={(file, name) => handleAddProp('character', file, name)}
              onRemove={(id) => handleRemoveProp('character', id)}
            />
            <LibrarySection
              label="Backgrounds"
              type="background"
              items={backgrounds}
              isLoading={loadingBgs}
              onAdd={(file, name) => handleAddProp('background', file, name)}
              onRemove={(id) => handleRemoveProp('background', id)}
            />
          </div>
        </>
      )}
    </div>
  );
}

function LibrarySection({
  label,
  type,
  items,
  isLoading,
  onAdd,
  onRemove,
}: {
  label: string;
  type: 'character' | 'background' | 'animation';
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
        setSelectedIndex((prev) => (prev !== null && prev < items.length - 1 ? prev + 1 : prev));
      }
      if (e.key === 'ArrowLeft') {
        setSelectedIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : prev));
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
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async (id: string) => {
    if (deletingId) return;
    setDeletingId(id);
    try {
      await onRemove(id);
    } catch (error) {
      console.error('Delete failed:', error);
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

function SessionControls({
  story,
  onSetStatus,
}: {
  story: { id: string; status: 'draft' | 'active' | 'ended' };
  onSetStatus: (id: string, status: 'draft' | 'active' | 'ended') => void;
}) {
  if (story.status === 'draft') {
    return (
      <button
        onClick={() => onSetStatus(story.id, 'active')}
        className="btn btn-xs btn-success font-display tracking-wide"
      >
        Start session
      </button>
    );
  }
  if (story.status === 'active') {
    return (
      <button
        onClick={() => onSetStatus(story.id, 'ended')}
        className="btn btn-xs btn-error btn-outline font-display tracking-wide"
      >
        End session
      </button>
    );
  }
  return (
    <button
      onClick={() => onSetStatus(story.id, 'draft')}
      className="btn btn-xs btn-outline font-display tracking-wide"
    >
      Set to draft
    </button>
  );
}
