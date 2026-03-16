import { createFileRoute, Link, useRouter } from '@tanstack/react-router';
import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getStoryDetail,
  updateStoryTitle,
  addCast,
  removeCast,
  assignProp,
  addScene,
  removeScene,
} from '@/lib/story-detail.fns';
import { StatusBadge } from '@/components/status-badge.component';
import { Breadcrumb } from '@/components/breadcrumb.component';
import { ConfirmModal } from '@/components/confirm-modal';
import { cn } from '@/lib/cn';
import { authClient } from '@/lib/auth-client';
import { StoryCastTab } from '@/components/story-cast-tab';
import { StoryScenesTab } from '@/components/story-scenes-tab';

export const Route = createFileRoute('/_app/stories/$storyId/')({
  component: StoryDetailPage,
});

function StoryDetailPage() {
  const { storyId } = Route.useParams();
  const { data: session } = authClient.useSession();
  const isDirector = session?.user?.role === 'director';
  const queryClient = useQueryClient();
  const router = useRouter();
  const qk = ['story', storyId];

  const { data, isLoading } = useQuery({
    queryKey: qk,
    queryFn: () => getStoryDetail({ data: { storyId } }),
  });

  const [title, setTitle] = useState('');
  const [activeTab, setActiveTab] = useState<'scenes' | 'cast'>('scenes');
  const [sceneToDelete, setSceneToDelete] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [castToDelete, setCastToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);

  useEffect(() => {
    if (data?.story) setTitle(data.story.title);
  }, [data?.story?.title]);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: qk });

  const saveTitleMutation = useMutation({
    mutationFn: (t: string) =>
      updateStoryTitle({ data: { storyId, title: t } }),
    onSuccess: invalidate,
  });

  const addCastMutation = useMutation({
    mutationFn: (userId: string) => addCast({ data: { storyId, userId } }),
    onSuccess: invalidate,
  });

  const removeCastMutation = useMutation({
    mutationFn: (castId: string) => removeCast({ data: { castId } }),
    onSuccess: () => {
      invalidate();
      setCastToDelete(null);
    },
  });

  const assignPropMutation = useMutation({
    mutationFn: ({
      castId,
      propId,
    }: {
      castId: string;
      propId: string | null;
    }) => assignProp({ data: { castId, propId } }),
    onSuccess: invalidate,
  });

  const addSceneMutation = useMutation({
    mutationFn: (t: string) => addScene({ data: { storyId, title: t } }),
    onSuccess: invalidate,
  });

  const removeSceneMutation = useMutation({
    mutationFn: (sceneId: string) => removeScene({ data: { sceneId } }),
    onSuccess: () => {
      invalidate();
      setSceneToDelete(null);
    },
  });

  if (isLoading) {
    return (
      <div className="p-8">
        <p className="text-base-content/40 text-sm">Loading…</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8">
        <p className="text-base-content/40">Story not found.</p>
      </div>
    );
  }

  const { story, cast, scenes, props: availableProps, availableActors } = data;

  const isTitleDirty = title !== story.title;

  return (
    <div className="p-8 max-w-3xl">
      <Breadcrumb
        crumbs={[
          { label: 'Stories', to: '/stories/' },
          { label: story.title, type: 'story' },
        ]}
      />

      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        {isDirector ? (
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input flex-1 bg-base-200 border-base-300 text-lg font-semibold focus:border-gold/60 focus:ring-2 focus:ring-gold/10"
          />
        ) : (
          <h1 className="flex-1 text-lg font-semibold">{story.title}</h1>
        )}

        {isDirector && (
          <button
            disabled={!isTitleDirty || saveTitleMutation.isPending}
            onClick={() => saveTitleMutation.mutate(title)}
            className={cn(
              'btn btn-accent font-display tracking-[0.05em]',
              (!isTitleDirty || saveTitleMutation.isPending) &&
                'opacity-40 cursor-not-allowed',
            )}
          >
            Save
          </button>
        )}
        {scenes.length > 0 && (
          <button
            className="btn btn-primary font-display tracking-[0.05em]"
            onClick={() =>
              router.navigate({
                to: '/stage/$sceneId',
                params: { sceneId: scenes[0].id },
              })
            }
          >
            Enter Stage →
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex justify-between items-center">
        <div role="tablist" className="tabs tabs-border mb-6 border-base-300">
          {(['scenes', 'cast'] as const).map((tab) => (
            <button
              key={tab}
              role="tab"
              onClick={() => setActiveTab(tab)}
              className={cn(
                'tab font-display tracking-[0.05em] capitalize',
                activeTab === tab
                  ? 'tab-active text-gold'
                  : 'text-base-content/40',
              )}
            >
              {tab} ({tab === 'cast' ? cast.length : scenes.length})
            </button>
          ))}
        </div>
        <StatusBadge status={story.status} />
      </div>

      {/* Cast tab */}
      {activeTab === 'cast' && (
        <StoryCastTab
          cast={cast}
          availableProps={availableProps}
          availableActors={availableActors}
          isDirector={isDirector}
          onAddCast={(userId) => addCastMutation.mutate(userId)}
          onRemoveCast={(id, name) => setCastToDelete({ id, name })}
          onAssignProp={(castId, propId) =>
            assignPropMutation.mutate({ castId, propId })
          }
          currentUserId={session?.user?.id}
          isRemovingCast={removeCastMutation.isPending}
        />
      )}

      {/* Scenes tab */}
      {activeTab === 'scenes' && (
        <StoryScenesTab
          scenes={scenes}
          storyId={storyId}
          isDirector={isDirector}
          onAddScene={(title) => addSceneMutation.mutate(title)}
          onRemoveScene={(id, title) => setSceneToDelete({ id, title })}
          isAddingScene={addSceneMutation.isPending}
          isRemovingScene={removeSceneMutation.isPending}
        />
      )}

      {/* Delete Scene Confirmation Modal */}
      <ConfirmModal
        isOpen={!!sceneToDelete}
        title="Confirm Deletion"
        message={
          <>
            Are you sure you want to delete the scene "{sceneToDelete?.title}"?
            This action cannot be undone.
          </>
        }
        confirmText="Delete"
        pendingText="Deleting..."
        onConfirm={() =>
          sceneToDelete && removeSceneMutation.mutate(sceneToDelete.id)
        }
        onCancel={() => setSceneToDelete(null)}
        isPending={removeSceneMutation.isPending}
      />

      {/* Remove Cast Confirmation Modal */}
      <ConfirmModal
        isOpen={!!castToDelete}
        title="Confirm Removal"
        message={
          <>
            Are you sure you want to remove "{castToDelete?.name}" from the
            cast?
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
