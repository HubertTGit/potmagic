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
import {
  SceneCastSection,
  type CastMember,
} from '@/components/scene-cast-section';
import {
  SceneBackgroundSection,
  type BackgroundProp,
} from '@/components/scene-background-section';

export const Route = createFileRoute('/_app/stories/$storyId/scenes/$sceneId')({
  component: SceneDetailPage,
  pendingComponent: () => (
    <div className="p-8">
      <p className="text-base-content/40 text-sm">Loading…</p>
    </div>
  ),
  errorComponent: ({ error }) => <ErrorComponent error={error} />,
});

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
    <div className="p-8 max-w-3xl">
      <Breadcrumb
        crumbs={[
          { label: 'Stories', to: '/stories/' },
          {
            label: story.title,
            to: '/stories/$storyId/',
            params: { storyId },
            type: 'story',
          },
          { label: scene.title, type: 'scene' },
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

      <SceneCastSection
        storyId={storyId}
        sceneId={sceneId}
        isDirector={isDirector}
        assignedCast={assignedCast}
        availableCast={availableCast}
        onAddCast={handleAddCast}
        onRemoveCast={setCastToDelete}
        isAddingCast={addCastMutation.isPending}
        isRemovingCast={removeCastMutation.isPending}
        sceneOrder={scene.order}
        totalScenes={story.totalScenes}
        nav={nav}
      />

      <SceneBackgroundSection
        isDirector={isDirector}
        background={background}
        availableBackgrounds={availableBackgrounds}
        onAssignBackground={handleAssignBackground}
        isAssigning={assignBgMutation.isPending}
      />

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
