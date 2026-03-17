import { useRouter, Link } from '@tanstack/react-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateStoryStatus } from '@/lib/story-detail.fns';
import { cn } from '@/lib/cn';
import type { listStories } from '@/lib/stories.fns';

type StoryStatus = 'draft' | 'active' | 'ended';

const STATUS_CONFIG: Record<StoryStatus, { label: string; badge: string; next: StoryStatus | null; nextLabel: string | null }> = {
  draft:  { label: 'Draft',  badge: 'badge-warning', next: 'active', nextLabel: 'Go Live' },
  active: { label: 'Live',   badge: 'badge-success', next: 'ended',  nextLabel: 'End Show' },
  ended:  { label: 'Ended',  badge: 'badge-neutral', next: 'draft',  nextLabel: 'Reset'    },
};

interface StoryCardProps {
  story: Awaited<ReturnType<typeof listStories>>[number];
  isDirector: boolean;
}

export function StoryCard({ story, isDirector }: StoryCardProps) {
  const queryClient = useQueryClient();
  const router = useRouter();

  const statusMutation = useMutation({
    mutationFn: (status: StoryStatus) =>
      updateStoryStatus({ data: { storyId: story.id, status } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['stories'] }),
  });

  const cfg = STATUS_CONFIG[story.status as StoryStatus];
  const firstScene = story.scenes[0];

  return (
    <div className="card bg-base-100 border border-base-300 shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col">
      <div className="card-body gap-3 flex flex-col flex-1">

        {/* Header: title + status */}
        <div className="flex items-start justify-between gap-2">
          <Link
            to="/stories/$storyId"
            params={{ storyId: story.id }}
            className="card-title font-display text-base leading-snug line-clamp-2 hover:text-primary transition-colors"
          >
            {story.title}
          </Link>

          {isDirector && cfg.next ? (
            <div className="dropdown dropdown-end shrink-0">
              <button
                tabIndex={0}
                className={cn(
                  'badge badge-sm font-semibold uppercase tracking-wider cursor-pointer select-none',
                  cfg.badge,
                )}
                disabled={statusMutation.isPending}
              >
                {statusMutation.isPending ? (
                  <span className="loading loading-spinner loading-xs" />
                ) : (
                  cfg.label
                )}
              </button>
              <ul
                tabIndex={0}
                className="dropdown-content menu bg-base-200 rounded-box border border-base-300 shadow-lg z-10 p-1 w-32 mt-1"
              >
                <li>
                  <button className="text-xs" onClick={() => statusMutation.mutate(cfg.next!)}>
                    {cfg.nextLabel}
                  </button>
                </li>
              </ul>
            </div>
          ) : (
            <span className={cn('badge badge-sm font-semibold uppercase tracking-wider shrink-0', cfg.badge)}>
              {cfg.label}
            </span>
          )}
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-3 text-xs text-base-content/50">
          <Link
            to="/stories/$storyId"
            params={{ storyId: story.id }}
            className="flex items-center gap-1 hover:text-base-content transition-colors"
          >
            <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {story.castCount} {story.castCount === 1 ? 'actor' : 'actors'}
          </Link>
          <span className="text-base-content/20">·</span>
          <span className="flex items-center gap-1">
            <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
            </svg>
            {story.sceneCount} {story.sceneCount === 1 ? 'scene' : 'scenes'}
          </span>
        </div>

        {/* Scene list preview */}
        {story.scenes.length > 0 ? (
          <ol className="flex flex-col gap-0.5 flex-1">
            {story.scenes.slice(0, 4).map((scene, i) => (
              <li key={scene.id} className="flex items-center gap-1.5 text-xs">
                <span className="text-base-content/30 w-3 shrink-0 text-right">{i + 1}.</span>
                <Link
                  to="/stories/$storyId/scenes/$sceneId"
                  params={{ storyId: story.id, sceneId: scene.id }}
                  className="truncate text-base-content/60 hover:text-base-content transition-colors"
                >
                  {scene.title}
                </Link>
              </li>
            ))}
            {story.scenes.length > 4 && (
              <li className="text-xs text-base-content/30 pl-5">
                +{story.scenes.length - 4} more…
              </li>
            )}
          </ol>
        ) : (
          <p className="text-xs text-base-content/30 italic flex-1">No scenes yet</p>
        )}

        {/* Enter Stage button */}
        <div className="card-actions mt-auto pt-2">
          {firstScene ? (
            <button
              className="btn btn-sm btn-primary w-full font-display tracking-wide"
              onClick={() => router.navigate({ to: '/stage/$sceneId', params: { sceneId: firstScene.id } })}
            >
              Enter Stage
            </button>
          ) : (
            <button className="btn btn-sm btn-ghost w-full" disabled>
              No scenes
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
