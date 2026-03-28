import { createFileRoute, Link, ErrorComponent } from '@tanstack/react-router';
import { getMeta } from '@/i18n/meta';
import { useLanguage } from '@/hooks/useLanguage';
import { Theater } from 'lucide-react';
import { useState, useEffect } from 'react';
import {
  useSuspenseQuery,
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import {
  getSceneDetail,
  updateSceneTitle,
  removeSceneCast,
  getSceneNavigation,
  assignSceneBackground,
  assignSceneSound,
  setSceneSoundAutoplay,
  setSceneBackgroundRepeat,
  addActorToScene,
  assignSceneProp,
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
import {
  SceneSoundSection,
  type SoundProp,
} from '@/components/scene-sound-section';

export const Route = createFileRoute('/($lang)/_app/stories/$storyId/scenes/$sceneId')({
  head: ({ match }) => {
    const locale = (match.context as { locale?: string })?.locale ?? 'en';
    return { meta: [{ title: getMeta(locale, 'meta.sceneDetail.title') }] };
  },
  component: SceneDetailPage,
  pendingComponent: () => (
    <div className="p-8 max-w-3xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-8">
        <div className="skeleton h-3 w-12 rounded" />
        <div className="skeleton h-3 w-2 rounded-full" />
        <div className="skeleton h-3 w-24 rounded" />
        <div className="skeleton h-3 w-2 rounded-full" />
        <div className="skeleton h-3 w-20 rounded" />
      </div>

      {/* Header: title + buttons */}
      <div className="flex items-center gap-3 mb-3">
        <div className="skeleton h-10 flex-1 rounded" />
        <div className="skeleton h-10 w-20 rounded" />
        <div className="skeleton h-10 w-32 rounded" />
      </div>

      {/* Cast section */}
      <div className="mt-8 flex flex-col gap-3">
        <div className="skeleton h-4 w-16 rounded" />
        {(['a', 'b', 'c'] as const).map((k) => (
          <div key={k} className="flex items-center gap-3">
            <div className="skeleton size-8 rounded-full shrink-0" />
            <div className="skeleton h-4 flex-1 rounded" />
            <div className="skeleton h-8 w-24 rounded" />
          </div>
        ))}
      </div>

      {/* Background section */}
      <div className="mt-8 flex flex-col gap-3">
        <div className="skeleton h-4 w-24 rounded" />
        <div className="skeleton h-24 w-full rounded-lg" />
      </div>

      {/* Sound section */}
      <div className="mt-8 flex flex-col gap-3">
        <div className="skeleton h-4 w-12 rounded" />
        <div className="skeleton h-12 w-full rounded" />
      </div>
    </div>
  ),
  errorComponent: ({ error }) => <ErrorComponent error={error} />,
});

function SceneDetailPage() {
  const { storyId, sceneId } = Route.useParams();
  const { t } = useLanguage();
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

  useEffect(() => {
    if (scene?.title && story?.title) {
      document.title = `${scene.title} — ${story.title} — potmagic: Live Story Theater`;
      return () => { document.title = 'potmagic: Live Story Theater'; };
    }
  }, [scene?.title, story?.title]);
  const assignedCast: CastMember[] = (data?.assignedCast ?? []).map((c) => ({
    id: c.id,
    sceneCastId: c.sceneCastId,
    userId: c.userId,
    userName: c.userName,
    propId: c.propId ?? null,
    propName: c.propName ?? null,
    propImageUrl: c.propImageUrl ?? null,
    propType: c.propType ?? null,
    userImage: c.userImage,
  }));
  const availableActors = data?.availableActors ?? [];
  const availableProps = (data?.props ?? []).filter(
    (p) => p.type === 'character' || p.type === 'rive',
  );
  const background: BackgroundProp | null =
    data?.background as BackgroundProp | null;
  const sound: SoundProp | null = data?.sound as SoundProp | null;
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

  const addActorMutation = useMutation({
    mutationFn: (userId: string) =>
      addActorToScene({ data: { sceneId, userId } }),
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

  const assignPropMutation = useMutation({
    mutationFn: ({
      sceneCastId,
      propId,
    }: {
      sceneCastId: string;
      propId: string | null;
    }) => assignSceneProp({ data: { sceneCastId, propId } }),
    onSuccess: invalidate,
  });

  const assignBgMutation = useMutation({
    mutationFn: (backgroundId: string | null) =>
      assignSceneBackground({ data: { sceneId, backgroundId } }),
    onSuccess: invalidate,
  });

  const assignSoundMutation = useMutation({
    mutationFn: (soundId: string | null) =>
      assignSceneSound({ data: { sceneId, soundId } }),
    onSuccess: invalidate,
  });

  const autoplayMutation = useMutation({
    mutationFn: (autoplay: boolean) =>
      setSceneSoundAutoplay({ data: { sceneId, autoplay } }),
    onSuccess: invalidate,
  });

  const backgroundRepeatMutation = useMutation({
    mutationFn: (repeat: boolean) =>
      setSceneBackgroundRepeat({ data: { sceneId, repeat } }),
    onSuccess: invalidate,
  });

  const isTitleDirty = title !== (scene?.title ?? '');

  if (!scene || !story) {
    return (
      <div className="p-8">
        <p className="text-base-content/40">{t('scene.notFound')}</p>
      </div>
    );
  }

  const availableBackgrounds = storyProps.filter(
    (p) => p.type === 'background',
  );
  const availableSounds = (data?.props ?? []).filter(
    (p) => p.type === 'sound',
  ) as SoundProp[];

  const handleAssignBackground = (bg: BackgroundProp | null) => {
    assignBgMutation.mutate(bg?.id ?? null);
  };

  const handleAssignSound = (s: SoundProp | null) => {
    assignSoundMutation.mutate(s?.id ?? null);
  };

  return (
    <div className="p-8 max-w-3xl">
      <Breadcrumb
        crumbs={[
          { label: t('nav.stories'), to: '/stories/' },
          {
            label: story.title,
            to: `/stories/${storyId}/`,
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
            className="input flex-1 bg-base-200 border-base-300 text-lg font-semibold focus:border-primary/60 focus:ring-2 focus:ring-primary/10"
          />
        ) : (
          <h1 className="flex-1 text-lg font-semibold">{scene.title}</h1>
        )}

        {isDirector && (
          <button
            disabled={!isTitleDirty || saveMutation.isPending}
            onClick={() => saveMutation.mutate(title)}
            className={cn(
              'btn btn-secondary font-display tracking-[0.05em]',
              (!isTitleDirty || saveMutation.isPending) &&
                'opacity-40 cursor-not-allowed',
            )}
          >
            {t('action.save')}
          </button>
        )}
        <Link
          to={`/stage/${(!isDirector && data?.story?.selectedSceneId) ? data.story.selectedSceneId : sceneId}` as any}
          disabled={!isDirector && (!data?.story?.directorOnStage || (data?.story?.status !== 'draft' && data?.story?.status !== 'active'))}
          className={cn(
            'btn btn-primary font-display tracking-[0.05em]',
            !isDirector && (!data?.story?.directorOnStage || (data?.story?.status !== 'draft' && data?.story?.status !== 'active')) && 'btn-disabled pointer-events-none opacity-50',
          )}
          aria-disabled={!isDirector && (!data?.story?.directorOnStage || (data?.story?.status !== 'draft' && data?.story?.status !== 'active'))}
        >
          {t('story.enterStage')} <Theater className="size-4" />
        </Link>
      </div>

      <SceneCastSection
        storyId={storyId}
        sceneId={sceneId}
        isDirector={isDirector}
        assignedCast={assignedCast}
        availableActors={availableActors}
        availableProps={availableProps}
        onAddCast={(userId) => addActorMutation.mutate(userId)}
        onRemoveCast={setCastToDelete}
        onAssignProp={(sceneCastId, propId) =>
          assignPropMutation.mutate({ sceneCastId, propId })
        }
        isAddingCast={addActorMutation.isPending}
        isRemovingCast={removeCastMutation.isPending}
        assigningPropCastId={
          assignPropMutation.isPending
            ? assignPropMutation.variables?.sceneCastId
            : undefined
        }
        sceneOrder={scene.order}
        totalScenes={story.totalScenes}
        nav={nav}
        currentUserId={session?.user?.id}
      />

      <SceneBackgroundSection
        isDirector={isDirector}
        background={background}
        availableBackgrounds={availableBackgrounds}
        onAssignBackground={handleAssignBackground}
        isAssigning={assignBgMutation.isPending}
        backgroundRepeat={data?.backgroundRepeat ?? false}
        onToggleRepeat={(repeat) => backgroundRepeatMutation.mutate(repeat)}
        isTogglingRepeat={backgroundRepeatMutation.isPending}
      />

      <SceneSoundSection
        isDirector={isDirector}
        sound={sound}
        availableSounds={availableSounds}
        onAssignSound={handleAssignSound}
        isAssigning={assignSoundMutation.isPending}
        autoplay={data?.soundAutoplay ?? true}
        onToggleAutoplay={(autoplay) => autoplayMutation.mutate(autoplay)}
        isTogglingAutoplay={autoplayMutation.isPending}
      />

      <ConfirmModal
        isOpen={!!castToDelete}
        title={t('modal.confirmRemoval')}
        message={t('modal.removeFromSceneMessage', { name: castToDelete?.userName ?? '' })}
        confirmText={t('action.remove')}
        pendingText={t('action.removing')}
        onConfirm={() =>
          castToDelete && removeCastMutation.mutate(castToDelete.id)
        }
        onCancel={() => setCastToDelete(null)}
        isPending={removeCastMutation.isPending}
      />
    </div>
  );
}
