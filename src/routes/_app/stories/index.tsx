import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authClient } from '@/lib/auth-client';
import { listStories, createStory, deleteStory } from '@/lib/stories.fns';
import { StatusBadge } from '@/components/status-badge.component';
import { RectangleStackIcon, TrashIcon } from '@heroicons/react/24/solid';

export const Route = createFileRoute('/_app/stories/')({
  component: StoriesPage,
});

function StoriesPage() {
  const { data: session } = authClient.useSession();
  const isDirector = session?.user?.role === 'director';
  const queryClient = useQueryClient();

  const [newTitle, setNewTitle] = useState('');
  const [adding, setAdding] = useState(false);

  const { data: stories = [], isLoading } = useQuery({
    queryKey: ['stories'],
    queryFn: () => listStories(),
  });

  const addMutation = useMutation({
    mutationFn: (title: string) => createStory({ data: { title } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stories'] });
      setNewTitle('');
      setAdding(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteStory({ data: { id } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['stories'] }),
  });

  const handleAdd = () => {
    if (!newTitle.trim()) return;
    addMutation.mutate(newTitle.trim());
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Stories</h1>
        {isDirector && (
          <button
            onClick={() => setAdding(true)}
            className="btn btn-sm btn-gold font-display tracking-[0.05em]"
          >
            + New Story
          </button>
        )}
      </div>

      {/* Inline add form */}
      {adding && (
        <div className="flex gap-2 mb-4 items-center">
          <input
            autoFocus
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAdd();
              if (e.key === 'Escape') setAdding(false);
            }}
            placeholder="Story title…"
            className="input input-sm bg-base-200 border-base-300 text-sm focus:border-gold/60 focus:ring-2 focus:ring-gold/10 w-64"
          />
          <button
            onClick={handleAdd}
            disabled={addMutation.isPending}
            className="btn btn-sm btn-gold font-display"
          >
            Add
          </button>
          <button
            onClick={() => setAdding(false)}
            className="btn btn-sm btn-ghost text-base-content/50"
          >
            Cancel
          </button>
        </div>
      )}

      {isLoading ? (
        <p className="text-base-content/40 text-sm">Loading…</p>
      ) : stories.length === 0 ? (
        <p className="text-base-content/40 text-sm">No stories yet.</p>
      ) : (
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
                      <span className="font-semibold text-base-content/80">{story.castCount}</span> Actors
                    </div>
                    <div>
                      <span className="font-semibold text-base-content/80">{story.sceneCount}</span> Scenes
                    </div>
                  </div>

                  <div className="card-actions justify-between items-center mt-auto">
                    {firstScene ? (
                      <Link
                        to="/stage/$sceneId"
                        params={{ sceneId: firstScene.id }}
                        className="btn btn-sm btn-neutral gap-2"
                      >
                        Enter Stage <RectangleStackIcon className="size-4" />
                      </Link>
                    ) : (
                      <div />
                    )}
                    
                    {isDirector && (
                      <div className="flex gap-2">
                        <Link
                          to="/stories/$storyId"
                          params={{ storyId: story.id }}
                          className="btn btn-primary btn-sm"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => deleteMutation.mutate(story.id)}
                          disabled={deleteMutation.isPending}
                          className="btn btn-accent btn-sm"
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
      )}
    </div>
  );
}
