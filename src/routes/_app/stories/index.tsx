import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authClient } from '@/lib/auth-client';
import { listStories, createStory } from '@/lib/stories.fns';
import { StoryGrid } from '@/components/story-grid';

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
            className="btn btn-primary font-display tracking-[0.05em]"
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
            className="input input-sm bg-base-200 border-base-300 text-sm focus:border-primary/60 focus:ring-2 focus:ring-primary/10 w-64"
          />
          <button
            onClick={handleAdd}
            disabled={addMutation.isPending}
            className="btn btn-sm btn-primary font-display"
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
      ) : (
        <StoryGrid stories={stories} isDirector={isDirector} />
      )}
    </div>
  );
}
