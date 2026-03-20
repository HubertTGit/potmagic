import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { listPublicStories } from '@/lib/stories.fns';
import { LandingNavbar } from '@/components/landing-navbar.component';
import { LandingFooter } from '@/components/landing-footer.component';
import { PublicStoryCard } from '@/components/public-story-card.component';

export const Route = createFileRoute('/show/')({
  head: () => ({
    meta: [
      { title: 'Live Shows — potmagic: Live Story Theater' },
      { name: 'description', content: 'Watch live interactive story performances on potmagic. Join an audience and interact directly with actors in real-time from anywhere in the world.' },
      { property: 'og:title', content: 'Live Shows — potmagic' },
      { property: 'og:description', content: 'Watch live interactive story performances and interact directly with actors in real-time.' },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:title', content: 'Live Shows — potmagic' },
      { name: 'twitter:description', content: 'Watch live interactive story performances and interact directly with actors in real-time.' },
    ],
  }),
  component: ShowsPage,
});

function ShowsPage() {
  const { data: stories = [], isLoading } = useQuery({
    queryKey: ['public-stories'],
    queryFn: () => listPublicStories(),
  });

  return (
    <div className="min-h-screen flex flex-col bg-base-200 text-base-content">
      <LandingNavbar />
      <div className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {isLoading ? (
          <div className="flex items-center gap-2 text-base-content/40 text-sm mt-16 justify-center">
            <span className="loading loading-spinner loading-xs" />
            Loading…
          </div>
        ) : stories.length === 0 ? (
          <div className="text-center py-20 text-base-content/30">
            <svg
              className="size-12 mx-auto mb-3 opacity-40"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"
              />
            </svg>
            <p className="text-sm">No stories yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {stories.map((story) => (
              <PublicStoryCard
                key={story.id}
                id={story.id}
                title={story.title}
                status={story.status as 'draft' | 'active' | 'ended'}
              />
            ))}
          </div>
        )}
      </div>
      <LandingFooter />
    </div>
  );
}
