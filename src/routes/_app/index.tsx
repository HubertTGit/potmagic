import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { authClient } from '@/lib/auth-client';
import { listStories } from '@/lib/stories.fns';
import { StoryCard } from '@/components/story-card.component';

export const Route = createFileRoute('/_app/')({
  component: IndexPage,
});

function IndexPage() {
  const { data: session } = authClient.useSession();
  const isDirector = session?.user?.role === 'director';

  const { data: stories = [], isLoading } = useQuery({
    queryKey: ['stories'],
    queryFn: () => listStories(),
  });

  return (
    <div className="p-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-2xl font-display font-semibold tracking-wide">
          Welcome{session?.user?.name ? `, ${session.user.name}` : ''}
        </h1>
        <p className="text-base-content/50 text-sm mt-1">
          {isDirector
            ? 'Manage your stories and direct the stage.'
            : 'Stories you are cast in.'}
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-base-content/40 text-sm">
          <span className="loading loading-spinner loading-xs" />
          Loading…
        </div>
      ) : stories.length === 0 ? (
        <div className="text-center py-20 text-base-content/30">
          <svg className="size-12 mx-auto mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
          </svg>
          <p className="text-sm">No stories yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {stories.map((story) => (
            <StoryCard key={story.id} story={story} isDirector={isDirector} />
          ))}
        </div>
      )}
    </div>
  );
}
