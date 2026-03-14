import { createFileRoute, Link, ErrorComponent } from '@tanstack/react-router';
import { useState, useEffect, useRef } from 'react';
import {
  useSuspenseQuery,
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import {
  getSceneDetail,
  updateSceneTitle,
  addSceneCast,
  removeSceneCast,
  getSceneNavigation,
  assignSceneBackground,
} from '@/lib/scenes.fns';
import { Breadcrumb } from '@/components/breadcrumb.component';
import { cn } from '@/lib/cn';
import { ConfirmModal } from '@/components/confirm-modal';
import { authClient } from '@/lib/auth-client';
import { TrashIcon } from '@heroicons/react/24/outline';

export const Route = createFileRoute('/_app/stories/$storyId/scenes/$sceneId')({
  component: SceneDetailPage,
  pendingComponent: () => (
    <div className="p-8">
      <p className="text-base-content/40 text-sm">Loading…</p>
    </div>
  ),
  errorComponent: ({ error }) => <ErrorComponent error={error} />,
});

type CastMember = {
  id: string;
  userId: string;
  userName: string | null;
  propId: string | null;
  propName: string | null;
  propImageUrl: string | null;
  propType: 'background' | 'character' | null;
};

type BackgroundProp = {
  id: string;
  name: string;
  imageUrl: string | null;
  type: 'background';
};

function SceneDetailPage() {
  const { storyId, sceneId } = Route.useParams();
  const { data: session } = authClient.useSession();
  const isDirector = session?.user?.role === 'director';
  const queryClient = useQueryClient();
  const qk = ['scene', storyId, sceneId];

  const { data } = useSuspenseQuery({
    queryKey: qk,
    queryFn: async () => {
      const res = await getSceneDetail({ data: { storyId, sceneId } });
      if (!res) throw new Error('Data is undefined');
      return res;
    },
  });

  const { data: nav } = useQuery({
    queryKey: ['scene-navigation', sceneId],
    queryFn: () => getSceneNavigation({ data: { sceneId } }),
  });

  const scene = data?.scene;
  const story = data?.story;
  const storyCast: CastMember[] = (data?.storyCast ?? []) as CastMember[];
  const sceneCastIds = new Set(data?.sceneCastIds ?? []);
  const background: BackgroundProp | null =
    data?.background as BackgroundProp | null;
  const storyProps = (data?.props ?? []) as BackgroundProp[];

  const [title, setTitle] = useState('');
  const [castToDelete, setCastToDelete] = useState<CastMember | null>(null);

  useEffect(() => {
    if (scene) setTitle(scene.title);
  }, [scene]);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: qk });

  const saveMutation = useMutation({
    mutationFn: (newTitle: string) =>
      updateSceneTitle({ data: { sceneId, title: newTitle } }),
    onSuccess: invalidate,
  });

  const addCastMutation = useMutation({
    mutationFn: (castId: string) => addSceneCast({ data: { sceneId, castId } }),
    onSuccess: invalidate,
  });

  const removeCastMutation = useMutation({
    mutationFn: (castId: string) =>
      removeSceneCast({ data: { sceneId, castId } }),
    onSuccess: () => {
      invalidate();
      setCastToDelete(null);
    },
  });

  const assignBgMutation = useMutation({
    mutationFn: (backgroundId: string | null) =>
      assignSceneBackground({ data: { sceneId, backgroundId } }),
    onSuccess: invalidate,
  });

  const isTitleDirty = title !== (scene?.title ?? '');

  if (!scene || !story) {
    return (
      <div className="p-8">
        <p className="text-base-content/40">Scene not found.</p>
      </div>
    );
  }

  const assignedCast = storyCast.filter((c) => sceneCastIds.has(c.id));
  const availableCast = storyCast.filter(
    (c) => !sceneCastIds.has(c.id) && c.propType === 'character',
  );
  const availableBackgrounds = storyProps.filter(
    (p) => p.type === 'background',
  );

  const handleAddCast = (castMember: CastMember) => {
    addCastMutation.mutate(castMember.id);
  };

  const handleAssignBackground = (bg: BackgroundProp | null) => {
    assignBgMutation.mutate(bg?.id ?? null);
  };

  return (
    <div className="p-8 max-w-2xl">
      <Breadcrumb
        crumbs={[
          { label: 'Stories', to: '/stories/' },
          { label: story.title, to: '/stories/$storyId/', params: { storyId } },
          { label: scene.title },
        ]}
      />

      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        {isDirector ? (
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input flex-1 bg-base-200 border-base-300 text-lg font-semibold focus:border-gold/60 focus:ring-2 focus:ring-gold/10"
          />
        ) : (
          <h1 className="flex-1 text-lg font-semibold">{scene.title}</h1>
        )}

        {isDirector && (
          <button
            disabled={!isTitleDirty || saveMutation.isPending}
            onClick={() => saveMutation.mutate(title)}
            className={cn(
              'btn btn-accent font-display tracking-[0.05em]',
              (!isTitleDirty || saveMutation.isPending) &&
                'opacity-40 cursor-not-allowed',
            )}
          >
            Save
          </button>
        )}
        <Link
          to="/stage/$sceneId"
          params={{ sceneId }}
          className="btn btn-primary font-display tracking-[0.05em]"
        >
          Enter Stage
        </Link>
      </div>

      {/* Cast section */}
      <div className="mb-8">
        <div className="flex justify-between items-center my-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-base-content/40">
            Cast
          </h2>

          {/* Scene navigator */}
          <div className="flex justify-end items-center gap-2 text-sm text-base-content/40">
            {nav?.prev ? (
              <Link
                to="/stories/$storyId/scenes/$sceneId"
                params={{ storyId, sceneId: nav.prev.id }}
                className="btn btn-xs btn-secondary px-2"
              >
                ‹
              </Link>
            ) : (
              <span className="btn btn-xs btn-ghost px-2 opacity-20 pointer-events-none">
                ‹
              </span>
            )}
            <span>
              <strong className="text-base-content">{scene.order}</strong> of{' '}
              {story.totalScenes}
            </span>
            {nav?.next ? (
              <Link
                to="/stories/$storyId/scenes/$sceneId"
                params={{ storyId, sceneId: nav.next.id }}
                className="btn btn-xs btn-secondary px-2"
              >
                ›
              </Link>
            ) : (
              <span className="btn btn-xs btn-ghost px-2 opacity-20 pointer-events-none">
                ›
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2 mb-3">
          {assignedCast.length === 0 ? (
            <p className="text-base-content/30 text-sm">
              No cast assigned yet.
            </p>
          ) : (
            assignedCast.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between bg-base-200 rounded-lg px-4 py-3 border border-base-300"
              >
                <div className="flex items-center gap-3">
                  {c.propImageUrl ? (
                    <img
                      src={c.propImageUrl}
                      alt={c.propName ?? ''}
                      className="size-8 rounded object-cover bg-base-300 shrink-0"
                    />
                  ) : (
                    <div className="size-8 rounded bg-base-300 shrink-0" />
                  )}
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{c.userName}</span>
                    {c.propName && (
                      <span className="text-xs text-base-content/40">
                        {c.propName}
                      </span>
                    )}
                  </div>
                  {c.propType && (
                    <span
                      className={cn(
                        'text-[10px] font-medium px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0',
                        c.propType === 'character'
                          ? 'bg-gold/15 text-gold'
                          : 'bg-info/15 text-info',
                      )}
                    >
                      {c.propType}
                    </span>
                  )}
                </div>
                {isDirector && (
                  <button
                    onClick={() => setCastToDelete(c)}
                    disabled={removeCastMutation.isPending}
                    className="text-xs text-error/60 hover:text-error transition-colors"
                  >
                    <TrashIcon className="size-4" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        {isDirector && availableCast.length > 0 && (
          <CastDropdown
            availableCast={availableCast}
            onAdd={handleAddCast}
            isLoading={addCastMutation.isPending}
          />
        )}
      </div>

      {/* Background section */}
      <div className="mb-8">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-base-content/40 mb-3">
          Background
        </h2>

        <div className="flex flex-col gap-2 mb-3">
          {!background ? (
            <p className="text-base-content/30 text-sm">
              No background assigned.
            </p>
          ) : (
            <div className="flex items-center justify-between bg-base-200 rounded-lg px-4 py-3 border border-base-300">
              <div className="flex items-center gap-3">
                {background.imageUrl ? (
                  <img
                    src={background.imageUrl}
                    alt={background.name}
                    className="size-16 rounded object-cover bg-base-300 shrink-0"
                  />
                ) : (
                  <div className="size-16 rounded bg-base-300 shrink-0" />
                )}
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{background.name}</span>
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0 bg-info/15 text-info w-fit mt-1">
                    Background
                  </span>
                </div>
              </div>
              {isDirector && (
                <button
                  onClick={() => handleAssignBackground(null)}
                  disabled={assignBgMutation.isPending}
                  className="text-xs text-error/60 hover:text-error transition-colors flex items-center gap-1"
                >
                  {assignBgMutation.isPending && (
                    <span className="loading loading-spinner loading-xs" />
                  )}
                  <TrashIcon className="size-4" />
                </button>
              )}
            </div>
          )}
        </div>

        {isDirector && availableBackgrounds.length > 0 && (
          <BackgroundDropdown
            availableBackgrounds={availableBackgrounds}
            onAssign={handleAssignBackground}
            currentId={background?.id}
            isLoading={assignBgMutation.isPending}
          />
        )}
      </div>

      <ConfirmModal
        isOpen={!!castToDelete}
        title="Confirm Removal"
        message={
          <>
            Are you sure you want to remove "{castToDelete?.userName}" from the
            scene?
          </>
        }
        confirmText="Remove"
        pendingText="Removing..."
        onConfirm={() =>
          castToDelete && removeCastMutation.mutate(castToDelete.id)
        }
        onCancel={() => setCastToDelete(null)}
        isPending={removeCastMutation.isPending}
      />
    </div>
  );
}

function CastDropdown({
  availableCast,
  onAdd,
  isLoading,
}: {
  availableCast: CastMember[];
  onAdd: (castMember: CastMember) => void;
  isLoading?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} className="relative w-64">
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={isLoading}
        className="btn btn-sm btn-outline btn-gold font-display w-full justify-start"
      >
        {isLoading && <span className="loading loading-spinner loading-xs" />}+
        Add cast member
      </button>
      {open && (
        <div className="absolute top-full mt-1 w-full bg-base-200 border border-base-300 rounded-lg shadow-xl z-50 overflow-hidden">
          {availableCast.map((c) => (
            <button
              key={c.id}
              onMouseDown={(e) => {
                e.preventDefault();
                onAdd(c);
                setOpen(false);
              }}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-base-300 transition-colors"
            >
              {c.propImageUrl ? (
                <img
                  src={c.propImageUrl}
                  alt={c.propName ?? ''}
                  className="size-8 rounded object-cover bg-base-300 shrink-0"
                />
              ) : (
                <div className="size-8 rounded bg-base-300 shrink-0" />
              )}
              <div className="flex flex-col text-left flex-1">
                <span className="font-medium">{c.userName}</span>
                {c.propName && (
                  <span className="text-xs text-base-content/40">
                    {c.propName}
                  </span>
                )}
              </div>
              {c.propType && (
                <span
                  className={cn(
                    'text-[10px] font-medium px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0',
                    c.propType === 'character'
                      ? 'bg-gold/15 text-gold'
                      : 'bg-info/15 text-info',
                  )}
                >
                  {c.propType}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function BackgroundDropdown({
  availableBackgrounds,
  onAssign,
  currentId,
  isLoading,
}: {
  availableBackgrounds: BackgroundProp[];
  onAssign: (bg: BackgroundProp) => void;
  currentId?: string;
  isLoading?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} className="relative w-64">
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={isLoading}
        className="btn btn-sm btn-outline btn-info font-display w-full justify-start"
      >
        {isLoading && <span className="loading loading-spinner loading-xs" />}
        {currentId ? 'Change background' : '+ Assign background'}
      </button>
      {open && (
        <div className="absolute top-full mt-1 w-full bg-base-200 border border-base-300 rounded-lg shadow-xl z-50 overflow-hidden">
          {availableBackgrounds.map((bg) => (
            <button
              key={bg.id}
              onMouseDown={(e) => {
                e.preventDefault();
                onAssign(bg);
                setOpen(false);
              }}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-base-300 transition-colors',
                bg.id === currentId && 'bg-base-300',
              )}
            >
              {bg.imageUrl ? (
                <img
                  src={bg.imageUrl}
                  alt={bg.name}
                  className="size-10 rounded object-cover bg-base-300 shrink-0"
                />
              ) : (
                <div className="size-10 rounded bg-base-300 shrink-0" />
              )}
              <div className="flex flex-col text-left flex-1">
                <span className="font-medium text-xs">{bg.name}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
