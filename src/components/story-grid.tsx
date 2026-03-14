import { Link } from '@tanstack/react-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { deleteStory } from '@/lib/stories.fns';
import { StatusBadge } from '@/components/status-badge.component';
import { ConfirmModal } from '@/components/confirm-modal';
import { RectangleStackIcon, TrashIcon } from '@heroicons/react/24/solid';

type Story = {
  id: string;
  title: string;
  status: any; // Type accurately if exposed from your fns or types
  castCount: number;
  sceneCount: number;
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
  const [storyToDelete, setStoryToDelete] = useState<{ id: string; title: string } | null>(null);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteStory({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stories'] });
      setStoryToDelete(null);
    },
  });

  if (stories.length === 0) {
    return <p className="text-base-content/40 text-sm">No stories yet.</p>;
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {stories.map((story) => {
          const firstScene = story.scenes[0];
          return (
            <div
              key={story.id}
              className="card bg-base-200 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="card-body p-6">
                <div className="flex justify-between items-start mb-2">
                  <Link
                    to="/stories/$storyId"
                    params={{ storyId: story.id }}
                    className="card-title font-medium hover:text-gold transition-colors text-lg"
                  >
                    {story.title}
                  </Link>
                  <StatusBadge status={story.status} />
                </div>

                <div className="flex gap-4 text-sm text-base-content/60 mb-6">
                  <div>
                    <span className="font-semibold text-base-content/80">
                      {story.castCount}
                    </span>{' '}
                    Actors
                  </div>
                  <div>
                    <span className="font-semibold text-base-content/80">
                      {story.sceneCount}
                    </span>{' '}
                    Scenes
                  </div>
                </div>

                <div className="flex flex-col gap-2 mt-auto w-full">
                  {firstScene && (
                    <Link
                      to="/stage/$sceneId"
                      params={{ sceneId: firstScene.id }}
                      className="btn btn-sm btn-primary w-full gap-2"
                    >
                      Enter Stage <RectangleStackIcon className="size-4" />
                    </Link>
                  )}

                  {isDirector && (
                    <div className="flex gap-2 w-full">
                      <Link
                        to="/stories/$storyId"
                        params={{ storyId: story.id }}
                        className="btn btn-accent btn-xs flex-1"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => setStoryToDelete({ id: story.id, title: story.title })}
                        disabled={deleteMutation.isPending}
                        className="btn btn-warning btn-xs flex-1"
                        title="Delete Story"
                      >
                        <TrashIcon className="size-4" />
                      </button>
                    </div>
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
        title="Confirm Deletion"
        message={
          <>
            Are you sure you want to delete the story "{storyToDelete?.title}"? This action cannot be undone.
          </>
        }
        confirmText="Delete"
        pendingText="Deleting..."
        onConfirm={() => storyToDelete && deleteMutation.mutate(storyToDelete.id)}
        onCancel={() => setStoryToDelete(null)}
        isPending={deleteMutation.isPending}
      />
    </>
  );
}
