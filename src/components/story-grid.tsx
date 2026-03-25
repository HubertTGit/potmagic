import { Link, useNavigate } from '@tanstack/react-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '@/hooks/useLanguage';
import { useState } from 'react';
import { deleteStory } from '@/lib/stories.fns';
import { cn } from '@/lib/cn';
import { StatusBadge } from '@/components/status-badge.component';
import { ConfirmModal } from '@/components/confirm-modal';
import { Theater, Trash2 } from 'lucide-react';

type Story = {
  id: string;
  title: string;
  status: any; // Type accurately if exposed from your fns or types
  castCount: number;
  sceneCount: number;
  selectedSceneId: string | null;
  directorOnStage: boolean;
  scenes: { id: string }[];
};

export function StoryGrid({
  stories,
  isDirector,
}: {
  stories: Story[];
  isDirector: boolean;
}) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { langPrefix, t } = useLanguage();
  const [storyToDelete, setStoryToDelete] = useState<{
    id: string;
    title: string;
  } | null>(null);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteStory({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stories'] });
      setStoryToDelete(null);
    },
  });

  if (stories.length === 0) {
    return <p className="text-base-content/40 text-sm">{t('stories.empty')}</p>;
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {stories.map((story) => {
          const firstScene = story.scenes[0];
          const stageSceneId = (!isDirector && story.selectedSceneId) ? story.selectedSceneId : firstScene?.id;
          const canEnterStage = isDirector || (story.directorOnStage && (story.status === 'draft' || story.status === 'active'));
          return (
            <div
              key={story.id}
              className="card bg-base-200 shadow-sm hover:shadow-md transition-all cursor-pointer hover:outline-2 hover:outline-primary hover:outline-offset-2"
              role="button"
              tabIndex={0}
              onClick={() =>
                navigate({ to: `${langPrefix}/stories/${story.id}` as any })
              }
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  navigate({ to: `${langPrefix}/stories/${story.id}` as any });
                }
              }}
            >
              <div className="card-body p-6">
                <div className="flex justify-between items-start mb-2">
                  <Link
                    to={`${langPrefix}/stories/${story.id}` as any}
                    className="card-title font-medium hover:text-primary transition-colors text-lg"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {story.title}
                  </Link>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={story.status} />
                    {isDirector && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setStoryToDelete({
                            id: story.id,
                            title: story.title,
                          });
                        }}
                        disabled={deleteMutation.isPending}
                        className="text-xs text-error/60 hover:text-error transition-colors"
                        title={t('story.deleteStory')}
                      >
                        <Trash2 className="size-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex gap-4 text-sm text-base-content/60 mb-6">
                  <div>
                    <span className="font-semibold text-base-content/80">
                      {story.castCount}
                    </span>{' '}
                    {story.castCount === 1 ? t('story.actor') : t('story.actors')}
                  </div>
                  <div>
                    <span className="font-semibold text-base-content/80">
                      {story.sceneCount}
                    </span>{' '}
                    {story.sceneCount === 1 ? t('story.scene') : t('story.scenes')}
                  </div>
                </div>

                <div
                  className="flex flex-col gap-2 mt-auto w-full"
                  onClick={(e) => e.stopPropagation()}
                >
                  {stageSceneId && (
                    <Link
                      to={`${langPrefix}/stage/${stageSceneId}` as any}
                      disabled={!canEnterStage}
                      className={cn(
                        'btn btn-sm btn-primary w-full gap-2',
                        !canEnterStage && 'btn-disabled pointer-events-none opacity-50',
                      )}
                      aria-disabled={!canEnterStage}
                    >
                      {t('story.enterStage')} <Theater className="size-4" />
                    </Link>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!storyToDelete}
        title={t('modal.confirmDeletion')}
        message={t('modal.deleteStoryMessage', { title: storyToDelete?.title ?? '' })}
        confirmText={t('action.delete')}
        pendingText={t('action.deleting')}
        onConfirm={() =>
          storyToDelete && deleteMutation.mutate(storyToDelete.id)
        }
        onCancel={() => setStoryToDelete(null)}
        isPending={deleteMutation.isPending}
      />
    </>
  );
}
