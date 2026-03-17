import { createFileRoute, useRouter } from '@tanstack/react-router';
import { Theater } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getStoryDetail,
  updateStoryTitle,
  addScene,
  removeScene,
  reorderScenes,
} from '@/lib/story-detail.fns';
import { StatusBadge } from '@/components/status-badge.component';
import { Breadcrumb } from '@/components/breadcrumb.component';
import { ConfirmModal } from '@/components/confirm-modal';
import { cn } from '@/lib/cn';
import { authClient } from '@/lib/auth-client';
import { StoryScenesTab } from '@/components/story-scenes-tab';

export const Route = createFileRoute('/_app/stories/$storyId/')({
  head: () => ({ meta: [{ title: 'Story — potmagic' }] }),
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
  const [sceneToDelete, setSceneToDelete] = useState<{
    id: string;
    title: string;
  } | null>(null);

  useEffect(() => {
    if (data?.story) setTitle(data.story.title);
  }, [data?.story?.title]);

  useEffect(() => {
    if (data?.story?.title) {
      document.title = `${data.story.title} — potmagic`;
      return () => { document.title = 'potmagic'; };
    }
  }, [data?.story?.title]);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: qk });

  const saveTitleMutation = useMutation({
    mutationFn: (t: string) =>
      updateStoryTitle({ data: { storyId, title: t } }),
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

  const reorderScenesMutation = useMutation({
    mutationFn: (reordered: { id: string; order: number }[]) =>
      reorderScenes({ data: { scenes: reordered } }),
    onSuccess: invalidate,
    onError: invalidate,
  });

  if (isLoading) {
    return (
      <div className="p-8 max-w-3xl">
        <div className="skeleton h-4 w-48 rounded mb-8" />
        <div className="flex items-center gap-3 mb-8">
          <div className="skeleton h-10 flex-1 rounded" />
          <div className="skeleton h-10 w-20 rounded" />
          <div className="skeleton h-10 w-32 rounded" />
        </div>
        <div className="flex justify-end mb-6">
          <div className="skeleton h-5 w-16 rounded-full" />
        </div>
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton h-12 w-full rounded" />
          ))}
        </div>
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

  const { story, scenes } = data;

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
            className="input flex-1 bg-base-200 border-base-300 text-lg font-semibold focus:border-primary/60 focus:ring-2 focus:ring-primary/10"
          />
        ) : (
          <h1 className="flex-1 text-lg font-semibold">{story.title}</h1>
        )}

        {isDirector && (
          <button
            disabled={!isTitleDirty || saveTitleMutation.isPending}
            onClick={() => saveTitleMutation.mutate(title)}
            className={cn(
              'btn btn-secondary font-display tracking-[0.05em]',
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
            Enter Stage <Theater className="size-4" />
          </button>
        )}
      </div>

      {/* Status */}
      <div className="flex justify-end items-center mb-6">
        <StatusBadge status={story.status} />
      </div>

      <StoryScenesTab
        scenes={scenes}
        storyId={storyId}
        isDirector={isDirector}
        onAddScene={(title) => addSceneMutation.mutate(title)}
        onRemoveScene={(id, title) => setSceneToDelete({ id, title })}
        onReorderScenes={(reordered) => reorderScenesMutation.mutate(reordered)}
        isAddingScene={addSceneMutation.isPending}
        isRemovingScene={removeSceneMutation.isPending}
      />

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
    </div>
  );
}
