import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authClient } from '@/lib/auth-client';
import { listStories, createStory } from '@/lib/stories.fns';
import { StoryGrid } from '@/components/story-grid';
import { getMeta } from '@/i18n/meta';
import { useLanguage } from '@/hooks/useLanguage';
import { Layers3 } from 'lucide-react';

export const Route = createFileRoute('/($lang)/_app/stories/')({
  head: ({ match }) => {
    const locale = (match.context as { locale?: string })?.locale ?? 'en';
    return {
      meta: [{ title: getMeta(locale, 'meta.stories.title') }],
    };
  },
  component: StoriesPage,
});

function StoriesPage() {
  const { t } = useLanguage();
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
    <div className="max-w-5xl p-8">
      <header className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 rounded-xl p-3">
            <Layers3 className="text-primary size-8" />
          </div>
          <div>
            <h1 className="font-display text-3xl font-bold">
              {t('stories.heading')}
            </h1>
            <p className="text-base-content/60">
              Manage your stories and productions.
            </p>
          </div>
        </div>
        {isDirector && (
          <button
            onClick={() => setAdding(true)}
            className="btn btn-primary font-display tracking-[0.05em]"
          >
            {t('stories.newStory')}
          </button>
        )}
      </header>

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
            placeholder={t('stories.titlePlaceholder')}
            className="input input-sm bg-base-200 border-base-300 text-sm focus:border-primary/60 focus:ring-2 focus:ring-primary/10 w-64"
          />
          <button
            onClick={handleAdd}
            disabled={addMutation.isPending}
            className="btn btn-sm btn-primary font-display"
          >
            {t('action.add')}
          </button>
          <button
            onClick={() => setAdding(false)}
            className="btn btn-sm btn-ghost text-base-content/50"
          >
            {t('action.cancel')}
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card bg-base-200">
              <div className="card-body p-6 gap-3">
                <div className="flex justify-between items-start">
                  <div className="skeleton h-5 w-3/4 rounded" />
                  <div className="skeleton h-5 w-12 rounded-full" />
                </div>
                <div className="flex gap-4">
                  <div className="skeleton h-3 w-16 rounded" />
                  <div className="skeleton h-3 w-16 rounded" />
                </div>
                <div className="skeleton h-8 w-full rounded mt-2" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <StoryGrid stories={stories} isDirector={isDirector} />
      )}
    </div>
  );
}
