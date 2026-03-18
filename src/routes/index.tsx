import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { listPublicStories } from '@/lib/stories.fns';
import { useTheme, Theme } from '@/hooks/useTheme';
import { PublicStoryCard } from '@/components/public-story-card.component';
import { Sun, Moon } from 'lucide-react';

export const Route = createFileRoute('/')({
  head: () => ({ meta: [{ title: 'potmagic' }] }),
  component: LandingPage,
});

function LandingPage() {
  const { theme, toggle } = useTheme();
  const { data: stories = [], isLoading } = useQuery({
    queryKey: ['public-stories'],
    queryFn: () => listPublicStories(),
  });

  return (
    <div className="min-h-screen bg-base-200 text-base-content">
      {/* Navbar */}
      <div className="navbar bg-base-100 border-b border-base-300 px-4">
        <div className="navbar-start">
          <img src="logo-text.svg" />
        </div>
        <div className="navbar-end gap-1">
          <button
            type="button"
            onClick={toggle}
            className="btn btn-sm btn-ghost btn-square"
            aria-label="Toggle theme"
          >
            {theme === Theme.dark ? (
              <Sun className="size-4" />
            ) : (
              <Moon className="size-4" />
            )}
          </button>
          <Link
            to="/auth"
            search={{ token: undefined }}
            className="btn btn-sm btn-primary font-display tracking-wide"
          >
            Sign in
          </Link>
        </div>
      </div>

      {/* Stories grid */}
      <div className="p-12">
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
    </div>
  );
}
