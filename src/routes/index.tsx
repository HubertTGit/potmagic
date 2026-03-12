import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { listPublicStories } from '@/lib/stories.fns'
import { cn } from '@/lib/cn'

export const Route = createFileRoute('/')({
  component: LandingPage,
})

type StoryStatus = 'draft' | 'active' | 'ended'

const STATUS_BADGE: Record<StoryStatus, string> = {
  draft: 'badge-warning',
  active: 'badge-success',
  ended: 'badge-neutral',
}

const STATUS_LABEL: Record<StoryStatus, string> = {
  draft: 'Draft',
  active: 'Live',
  ended: 'Ended',
}

function LandingPage() {
  const { data: stories = [], isLoading } = useQuery({
    queryKey: ['public-stories'],
    queryFn: () => listPublicStories(),
  })

  return (
    <div className="min-h-screen bg-base-100 text-base-content">
      {/* Top bar */}
      <div className="flex items-center justify-between px-8 py-5">
        <span className="font-display italic font-semibold text-2xl text-gold gold-glow tracking-[-0.01em]">
          potmagic
        </span>
        <Link to="/auth" className="btn btn-sm btn-outline">
          Sign In
        </Link>
      </div>

      {/* Stories grid */}
      <div className="px-8 pb-12">
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
            {stories.map((story) => {
              const status = story.status as StoryStatus
              return (
                <div
                  key={story.id}
                  className="card bg-base-100 border border-base-300 shadow-sm hover:shadow-md transition-shadow duration-200"
                >
                  <div className="card-body gap-3">
                    <div className="flex items-start justify-between gap-2">
                      <h2 className="card-title font-display text-base leading-snug line-clamp-2">
                        {story.title}
                      </h2>
                      <span
                        className={cn(
                          'badge badge-sm font-semibold uppercase tracking-wider shrink-0',
                          STATUS_BADGE[status],
                        )}
                      >
                        {STATUS_LABEL[status]}
                      </span>
                    </div>

                    {status === 'active' && (
                      <div className="card-actions mt-auto pt-1">
                        <Link
                          to="/show/$storyId"
                          params={{ storyId: story.id }}
                          className="btn btn-sm btn-gold w-full font-display tracking-wide"
                        >
                          View Show
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
